import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const processStartupFeedback = async (base44) => {
    // 1. Buscar todas as transações que foram pagas e avaliadas
    const evaluatedTransactions = await base44.asServiceRole.entities.Transacao.filter({
        status_pagamento: 'pago',
        $or: [
          { avaliacoes_individuais: { $exists: true, $ne: [] } },
          { avaliacao: { $exists: true, $gt: 0 } }
        ]
    });

    if (evaluatedTransactions.length === 0) {
        return {
            message: 'Nenhum novo feedback para processar.',
            updatedCount: 0,
            topPerformers: [],
        };
    }

    // 2. Agrupar avaliações por startup (priorizar avaliações individuais)
    const startupFeedback = {};

    for (const transaction of evaluatedTransactions) {
        // NOVO: Usar avaliações individuais se existirem
        if (transaction.avaliacoes_individuais && transaction.avaliacoes_individuais.length > 0) {
            for (const avaliacaoIndividual of transaction.avaliacoes_individuais) {
                const startupId = avaliacaoIndividual.startup_id;
                if (!startupId) continue;
                
                if (!startupFeedback[startupId]) {
                    startupFeedback[startupId] = {
                        ratings: [],
                        nome: avaliacaoIndividual.startup_nome || 'Startup Desconhecida'
                    };
                }
                startupFeedback[startupId].ratings.push(avaliacaoIndividual.avaliacao);
            }
        }
        // LEGADO: Fallback para avaliação geral (compatibilidade)
        else if (transaction.avaliacao && transaction.startups_desbloqueadas && transaction.startups_desbloqueadas.length > 0) {
            for (const startup of transaction.startups_desbloqueadas) {
                const startupId = startup.startup_id;
                if (!startupId) continue;
                
                if (!startupFeedback[startupId]) {
                    startupFeedback[startupId] = {
                        ratings: [],
                        nome: startup.nome || 'Startup Desconhecida'
                    };
                }
                startupFeedback[startupId].ratings.push(transaction.avaliacao);
            }
        }
    }

    // 3. Calcular novos scores e atualizar
    const topPerformers = [];
    const errors = [];
    let successCount = 0;

    for (const startupId in startupFeedback) {
        const feedback = startupFeedback[startupId];
        const total_avaliacoes = feedback.ratings.length;
        const sumOfRatings = feedback.ratings.reduce((sum, rating) => sum + rating, 0);
        const averageRating = sumOfRatings / total_avaliacoes;

        const satisfaction_score = Math.round(((averageRating - 1) / 4) * 100);

        const updatePayload = {
            rating: parseFloat(averageRating.toFixed(2)),
            total_avaliacoes: total_avaliacoes,
            satisfaction_score: satisfaction_score,
            casos_de_sucesso: feedback.ratings.filter(r => r >= 4).length
        };

        try {
            const startupExists = await base44.asServiceRole.entities.Startup.get(startupId);
            
            if (startupExists) {
                await base44.asServiceRole.entities.Startup.update(startupId, updatePayload);
                successCount++;
                
                if (averageRating >= 4.0) {
                    topPerformers.push({
                        nome: feedback.nome,
                        rating: updatePayload.rating,
                        evaluations: total_avaliacoes,
                    });
                }
            } else {
                console.log(`⚠️ Startup ${startupId} não existe mais, pulando`);
                errors.push({
                    startupId,
                    nome: feedback.nome,
                    reason: 'Startup não encontrada'
                });
            }
        } catch (error) {
            console.error(`❌ Erro ao processar startup ${startupId}:`, error.message);
            errors.push({
                startupId,
                nome: feedback.nome,
                reason: error.message
            });
        }
    }

    topPerformers.sort((a, b) => b.rating - a.rating);

    return {
        message: `✅ ${successCount} startups atualizadas com base em avaliações individuais de ${evaluatedTransactions.length} transações.`,
        updatedCount: successCount,
        skippedCount: errors.length,
        topPerformers: topPerformers.slice(0, 5),
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined
    };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const result = await processStartupFeedback(base44);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no processamento de feedback ML:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno no servidor', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});