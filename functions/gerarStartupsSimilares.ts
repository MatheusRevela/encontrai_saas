import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Verificar se já pagou pelas similares
    const transacao = await base44.asServiceRole.entities.Transacao.get(transacao_id);
    const jaDesbloqueiuSimilares = transacao.similares_desbloqueadas?.some(
      s => s.startup_original_id === startup_id
    );

    // CACHE: Verificar se similares foram geradas recentemente (últimas 24h)
    const similarExistente = transacao.similares_desbloqueadas?.find(
      s => s.startup_original_id === startup_id
    );
    
    if (similarExistente) {
      const pagoEm = new Date(similarExistente.pago_em);
      const agora = new Date();
      const diferencaHoras = (agora - pagoEm) / (1000 * 60 * 60);
      
      if (diferencaHoras < 24 && similarExistente.startups_similares) {
        // Retornar cache
        return Response.json({
          similares: similarExistente.startups_similares.map(s => ({
            ...s,
            logo_url: s.logo_url,
            site: s.site,
            email: s.email,
            whatsapp: s.whatsapp
          })),
          pago: true,
          cached: true
        });
      }
    }

    // Buscar startup original
    const startupOriginal = await base44.asServiceRole.entities.Startup.get(startup_id);
    
    if (!startupOriginal) {
      return Response.json({ error: 'Startup não encontrada' }, { status: 404 });
    }

    // Buscar IDs das startups já desbloqueadas na transação
    const startupsJaDesbloqueadas = transacao.startups_desbloqueadas?.map(s => s.startup_id) || [];
    
    // DUPLICATAS: Buscar startups que já apareceram como similares de outras
    const startupsJaSimilares = [];
    transacao.similares_desbloqueadas?.forEach(similar => {
      if (similar.startup_original_id !== startup_id && similar.startups_similares) {
        similar.startups_similares.forEach(s => {
          if (s.startup_id) startupsJaSimilares.push(s.startup_id);
        });
      }
    });
    
    // APRENDIZADO: Buscar feedbacks negativos do usuário
    const feedbacksNegativos = await base44.asServiceRole.entities.FeedbackSimilaridade.filter({
      transacao_id: transacao_id,
      tipo_feedback: { $in: ['ja_conheco', 'nao_relevante'] }
    });
    const startupsComFeedbackNegativo = feedbacksNegativos.map(f => f.startup_similar_id);

    // Buscar todas as startups ativas exceto a original e as já desbloqueadas
    const todasStartups = await base44.asServiceRole.entities.Startup.filter({ 
      ativo: true 
    });

    const startupsCandiatas = todasStartups.filter(s => 
      s.id !== startup_id && 
      !startupsJaDesbloqueadas.includes(s.id) &&
      !startupsJaSimilares.includes(s.id) &&
      !startupsComFeedbackNegativo.includes(s.id)
    );

    // Usar IA para encontrar as mais similares
    const prompt = `Você é um especialista em análise de startups e soluções tecnológicas.

STARTUP DE REFERÊNCIA:
- Nome: ${startupOriginal.nome}
- Categoria: ${startupOriginal.categoria}
- Vertical: ${startupOriginal.vertical_atuacao || 'N/A'}
- Modelo de Negócio: ${startupOriginal.modelo_negocio || 'N/A'}
- Descrição: ${startupOriginal.descricao}
- Tags: ${startupOriginal.tags?.join(', ') || 'N/A'}

STARTUPS CANDIDATAS:
${startupsCandiatas.slice(0, 50).map((s, i) => `
${i + 1}. ${s.nome} (ID: ${s.id})
   - Categoria: ${s.categoria}
   - Vertical: ${s.vertical_atuacao || 'N/A'}
   - Modelo: ${s.modelo_negocio || 'N/A'}
   - Descrição: ${s.descricao}
   - Tags: ${s.tags?.join(', ') || 'N/A'}
`).join('\n')}

TAREFA:
Identifique as 3-5 startups MAIS SIMILARES à startup de referência.

CRITÉRIOS OBRIGATÓRIOS (todos devem ser atendidos):
1. MESMA CATEGORIA ou vertical da startup de referência
2. Resolve o MESMO TIPO DE PROBLEMA (não pode ser genérico ou muito diferente)
3. Público-alvo semelhante

CRITÉRIOS COMPLEMENTARES:
4. Modelo de negócio compatível
5. Tags similares

Para cada similar, forneça:
- startup_id
- similaridade_score (0-100)
- resumo_match: breve explicação de como resolve problema similar (1-2 frases)
- razoes_similaridade: lista de 2-3 motivos específicos da similaridade

REGRAS CRÍTICAS:
1. NO resumo_match, NÃO mencione o nome da startup - use termos genéricos como "Esta solução", "A plataforma", "O sistema"
2. Retorne APENAS startups com score >= 70 E que atendam aos critérios obrigatórios
3. Se nenhuma startup atender aos critérios, retorne lista vazia
4. EVITE startups muito genéricas ou que resolvam problemas muito diferentes
5. Priorize soluções que o usuário realmente consideraria como alternativas

EXEMPLO de resumo_match correto:
❌ ERRADO: "A Inovyo oferece soluções para gestão..."
✅ CORRETO: "Esta solução oferece ferramentas para gestão..."`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
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
                razoes_similaridade: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 3,
                  items: { type: 'string' }
                }
              },
              required: ['startup_id', 'similaridade_score', 'resumo_match', 'razoes_similaridade']
            }
          }
        },
        required: ['similares']
      }
    });

    // Enriquecer com dados completos (se já pagou)
    const similaresEnriquecidas = await Promise.all(
      resultado.similares.map(async (similar) => {
        const startupCompleta = startupsCandiatas.find(s => s.id === similar.startup_id);
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
    );

    const similaresValidas = similaresEnriquecidas.filter(Boolean);

    return Response.json({
      similares: similaresValidas,
      pago: jaDesbloqueiuSimilares || false
    });

  } catch (error) {
    console.error('Erro ao gerar similares:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});