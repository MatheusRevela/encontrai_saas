import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CACHE_TTL_HORAS = 24;
const MIN_CANDIDATAS_PARA_FILTRAR = 10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startup_id, transacao_id } = await req.json();
    if (!startup_id || !transacao_id) {
      return Response.json({ error: 'Parâmetros obrigatórios faltando' }, { status: 400 });
    }

    // Rate limiting: máx 8 chamadas LLM por usuário por hora
    const kv = await Deno.openKv();
    const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));
    const rlKey = ['rl', 'gerarSimilares', user.email, hourBucket];
    const { value: callCount } = await kv.get(rlKey);
    if ((callCount || 0) >= 8) {
      return Response.json({
        error: 'Limite de chamadas atingido. Aguarde alguns minutos e tente novamente.'
      }, { status: 429 });
    }
    await kv.set(rlKey, (callCount || 0) + 1, { expireIn: 3600000 });

    const transacao = await base44.asServiceRole.entities.Transacao.get(transacao_id);
    if (!transacao) {
      return Response.json({ error: 'Transação não encontrada' }, { status: 404 });
    }
    // Verificar ownership — usuário só pode acessar suas próprias transações
    if (transacao.created_by && transacao.created_by !== user.email) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // ✅ CACHE: Verificar similares já geradas (pagas ou preview) nas últimas 24h
    const similarExistente = transacao.similares_desbloqueadas?.find(
      s => s.startup_original_id === startup_id
    );
    const jaDesbloqueiuSimilares = !!similarExistente;

    if (similarExistente?.startups_similares?.length) {
      const pago_em = similarExistente.pago_em || similarExistente.gerado_em;
      const diferencaHoras = pago_em
        ? (Date.now() - new Date(pago_em).getTime()) / (1000 * 60 * 60)
        : CACHE_TTL_HORAS + 1;

      if (diferencaHoras < CACHE_TTL_HORAS) {
        return Response.json({
          similares: similarExistente.startups_similares,
          pago: jaDesbloqueiuSimilares,
          cached: true
        });
      }
    }

    // ✅ CACHE: Verificar cache de preview não pago (campo separado na transação)
    const previewCache = transacao.similares_preview_cache?.find(
      c => c.startup_original_id === startup_id
    );
    if (previewCache?.startups_similares?.length) {
      const diferencaHoras = (Date.now() - new Date(previewCache.gerado_em).getTime()) / (1000 * 60 * 60);
      if (diferencaHoras < CACHE_TTL_HORAS) {
        return Response.json({
          similares: previewCache.startups_similares,
          pago: false,
          cached: true
        });
      }
    }

    // Buscar startup original e startups ativas em paralelo
    const [startupOriginal, todasStartups] = await Promise.all([
      base44.asServiceRole.entities.Startup.get(startup_id),
      base44.asServiceRole.entities.Startup.filter({ ativo: true })
    ]);

    if (!startupOriginal) {
      return Response.json({ error: 'Startup não encontrada' }, { status: 404 });
    }

    // IDs a excluir das candidatas
    const startupsJaDesbloqueadas = new Set(
      transacao.startups_desbloqueadas?.map(s => s.startup_id) || []
    );
    const startupsJaSimilares = new Set();
    transacao.similares_desbloqueadas?.forEach(similar => {
      if (similar.startup_original_id !== startup_id) {
        similar.startups_similares?.forEach(s => {
          if (s.startup_id) startupsJaSimilares.add(s.startup_id);
        });
      }
    });

    // Feedbacks negativos em paralelo (já iniciado acima, esperar aqui)
    const feedbacksNegativos = await base44.asServiceRole.entities.FeedbackSimilaridade.filter({
      transacao_id,
      tipo_feedback: { $in: ['ja_conheco', 'nao_relevante'] }
    });
    const startupsComFeedbackNegativo = new Set(feedbacksNegativos.map(f => f.startup_similar_id));

    const excluida = (id) =>
      id === startup_id ||
      startupsJaDesbloqueadas.has(id) ||
      startupsJaSimilares.has(id) ||
      startupsComFeedbackNegativo.has(id);

    // ✅ Filtrar por categoria/vertical antes de enviar à IA — reduz tokens e melhora qualidade
    const porCategoriaVertical = todasStartups.filter(s =>
      !excluida(s.id) &&
      (s.categoria === startupOriginal.categoria || s.vertical_atuacao === startupOriginal.vertical_atuacao)
    );

    // Fallback: se filtro for muito restrito, abre para todas
    const candidatasFinais = porCategoriaVertical.length >= MIN_CANDIDATAS_PARA_FILTRAR
      ? porCategoriaVertical
      : todasStartups.filter(s => !excluida(s.id));

    if (candidatasFinais.length === 0) {
      return Response.json({ similares: [], pago: jaDesbloqueiuSimilares });
    }

    const prompt = `Você é um especialista em análise de startups e soluções tecnológicas.

STARTUP DE REFERÊNCIA:
- Nome: ${startupOriginal.nome}
- Categoria: ${startupOriginal.categoria}
- Vertical: ${startupOriginal.vertical_atuacao || 'N/A'}
- Modelo de Negócio: ${startupOriginal.modelo_negocio || 'N/A'}
- Descrição: ${startupOriginal.descricao}
- Tags: ${startupOriginal.tags?.join(', ') || 'N/A'}

STARTUPS CANDIDATAS (${candidatasFinais.length} pré-filtradas por relevância):
${candidatasFinais.slice(0, 50).map((s, i) => `
${i + 1}. ${s.nome} (ID: ${s.id})
   - Categoria: ${s.categoria}
   - Vertical: ${s.vertical_atuacao || 'N/A'}
   - Modelo: ${s.modelo_negocio || 'N/A'}
   - Descrição: ${s.descricao}
   - Tags: ${s.tags?.join(', ') || 'N/A'}
`).join('\n')}

TAREFA: Identifique as 3-5 startups MAIS SIMILARES à startup de referência.

CRITÉRIOS OBRIGATÓRIOS:
1. Mesma categoria ou vertical da startup de referência
2. Resolve o mesmo tipo de problema
3. Público-alvo semelhante

Para cada similar: startup_id, similaridade_score (0-100), resumo_match (sem citar o nome da startup), razoes_similaridade (2-3 motivos).

REGRAS: Retorne APENAS startups com score >= 70. Se nenhuma atender, retorne lista vazia.
No resumo_match use apenas "Esta solução", "A plataforma", "O sistema" — NUNCA o nome da startup.`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_opus_4_7',
      response_json_schema: {
        type: 'object',
        properties: {
          similares: {
            type: 'array',
            maxItems: 5,
            items: {
              type: 'object',
              properties: {
                startup_id: { type: 'string' },
                similaridade_score: { type: 'number', minimum: 70, maximum: 100 },
                resumo_match: { type: 'string' },
                razoes_similaridade: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'string' } }
              },
              required: ['startup_id', 'similaridade_score', 'resumo_match', 'razoes_similaridade']
            }
          }
        },
        required: ['similares']
      }
    });

    // Enriquecer com dados completos
    const similaresEnriquecidas = resultado.similares
      .map(similar => {
        const startupCompleta = candidatasFinais.find(s => s.id === similar.startup_id);
        if (!startupCompleta) return null;
        return {
          startup_id: startupCompleta.id,
          nome: startupCompleta.nome,
          descricao: startupCompleta.descricao,
          categoria: startupCompleta.categoria,
          vertical_atuacao: startupCompleta.vertical_atuacao,
          modelo_negocio: startupCompleta.modelo_negocio,
          logo_url: jaDesbloqueiuSimilares ? startupCompleta.logo_url : null,
          site: jaDesbloqueiuSimilares ? startupCompleta.site : null,
          email: jaDesbloqueiuSimilares ? startupCompleta.email : null,
          whatsapp: jaDesbloqueiuSimilares ? startupCompleta.whatsapp : null,
          similaridade_score: similar.similaridade_score,
          resumo_match: similar.resumo_match,
          razoes_similaridade: similar.razoes_similaridade
        };
      })
      .filter(Boolean);

    // ✅ Salvar cache de preview (sem dados de contato) para evitar reprocessamento
    if (!jaDesbloqueiuSimilares && similaresEnriquecidas.length > 0) {
      const cacheAtual = (transacao.similares_preview_cache || []).filter(
        c => c.startup_original_id !== startup_id
      );
      await base44.asServiceRole.entities.Transacao.update(transacao_id, {
        similares_preview_cache: [
          ...cacheAtual,
          {
            startup_original_id: startup_id,
            startups_similares: similaresEnriquecidas,
            gerado_em: new Date().toISOString()
          }
        ]
      });
    }

    return Response.json({
      similares: similaresEnriquecidas,
      pago: jaDesbloqueiuSimilares
    });

  } catch (error) {
    console.error('Erro ao gerar similares:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});