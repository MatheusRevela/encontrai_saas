import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    if (!(await base44.auth.isAuthenticated())) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("🔍 BUSCA AVANÇADA POR STARTUPS PERDIDAS...");
    
    const resultados = {
      encontradas: [],
      fontes_verificadas: []
    };

    // 1. Buscar em transações por dados detalhados das startups
    try {
      const transacoes = await base44.asServiceRole.entities.Transacao.list();
      const startupsDetalhadas = new Map();
      
      transacoes.forEach(t => {
        // Buscar em startups_desbloqueadas (dados completos)
        if (t.startups_desbloqueadas && Array.isArray(t.startups_desbloqueadas)) {
          t.startups_desbloqueadas.forEach(startup => {
            if (startup && startup.startup_id && !startupsDetalhadas.has(startup.startup_id)) {
              startupsDetalhadas.set(startup.startup_id, {
                ...startup,
                fonte: 'transacao_desbloqueada',
                transacao_id: t.id
              });
            }
          });
        }
        
        // Buscar em startups_sugeridas
        if (t.startups_sugeridas && Array.isArray(t.startups_sugeridas)) {
          t.startups_sugeridas.forEach(startup => {
            if (startup && startup.startup_id && !startupsDetalhadas.has(startup.startup_id)) {
              startupsDetalhadas.set(startup.startup_id, {
                startup_id: startup.startup_id,
                nome: startup.nome,
                resumo: startup.resumo_personalizado,
                fonte: 'transacao_sugerida',
                transacao_id: t.id
              });
            }
          });
        }
      });
      
      resultados.encontradas = Array.from(startupsDetalhadas.values());
      resultados.fontes_verificadas.push(`${transacoes.length} transações analisadas`);
      
    } catch (error) {
      console.error('Erro ao buscar em transações:', error);
      resultados.fontes_verificadas.push(`Erro em transações: ${error.message}`);
    }

    // ... (removendo a parte de buscar na tabela Startup, pois já sabemos que está vazia)

    return new Response(JSON.stringify({
      total_recuperaveis: resultados.encontradas.length,
      startups_encontradas: resultados.encontradas.slice(0, 50), // Primeiras 50 para visualização
      fontes_verificadas: resultados.fontes_verificadas,
      recomendacao: resultados.encontradas.length > 0 ? 
        `DADOS ENCONTRADOS! Posso tentar recriar ${resultados.encontradas.length} startups baseado nas transações. Você autoriza?` :
        'Nenhum dado recuperável encontrado nas transações. A única esperança agora é o suporte da Base44.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Erro na busca avançada:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});