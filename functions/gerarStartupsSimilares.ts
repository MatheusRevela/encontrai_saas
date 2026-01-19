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

    // Buscar startup original
    const startupOriginal = await base44.asServiceRole.entities.Startup.get(startup_id);
    
    if (!startupOriginal) {
      return Response.json({ error: 'Startup não encontrada' }, { status: 404 });
    }

    // Buscar IDs das startups já desbloqueadas na transação
    const startupsJaDesbloqueadas = transacao.startups_desbloqueadas?.map(s => s.startup_id) || [];

    // Buscar todas as startups ativas exceto a original e as já desbloqueadas
    const todasStartups = await base44.asServiceRole.entities.Startup.filter({ 
      ativo: true 
    });

    const startupsCandiatas = todasStartups.filter(s => 
      s.id !== startup_id && !startupsJaDesbloqueadas.includes(s.id)
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
Identifique as 3-5 startups MAIS SIMILARES à startup de referência com base em:
1. Mesma categoria ou vertical (peso 40%)
2. Problema/solução semelhante (peso 40%)
3. Modelo de negócio compatível (peso 20%)

Para cada similar, forneça:
- startup_id
- similaridade_score (0-100)
- resumo_match: breve explicação de como resolve problema similar (1-2 frases)
- razoes_similaridade: lista de 2-3 motivos específicos da similaridade

IMPORTANTE: Retorne APENAS startups com score >= 60. Se nenhuma atingir, retorne lista vazia.`;

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
                similaridade_score: { type: 'number', minimum: 60, maximum: 100 },
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