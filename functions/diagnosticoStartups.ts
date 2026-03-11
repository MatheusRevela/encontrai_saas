import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://encontrai.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica autenticação
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado - apenas admins' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("🔍 Iniciando diagnóstico completo de startups...");

    // 1. Contar TODAS as startups (sem filtros) usando service role
    const todasStartups = await base44.asServiceRole.entities.Startup.list();
    console.log(`📊 Total de startups encontradas: ${todasStartups.length}`);
    
    // 2. Contar apenas ativas
    const startupsAtivas = todasStartups.filter(s => s.ativo === true);
    console.log(`✅ Startups ativas: ${startupsAtivas.length}`);
    
    // 3. Contar inativas
    const startupsInativas = todasStartups.filter(s => s.ativo === false);
    console.log(`❌ Startups inativas: ${startupsInativas.length}`);
    
    // 4. Agrupar por origem
    const porOrigem = {
      manual: todasStartups.filter(s => !s.origem_criacao || s.origem_criacao === 'manual').length,
      csv_import: todasStartups.filter(s => s.origem_criacao === 'csv_import').length
    };
    console.log(`📝 Por origem - Manual: ${porOrigem.manual}, CSV: ${porOrigem.csv_import}`);
    
    // 5. Verificar avaliações qualitativas (rating C a AAA)
    const ratingsAltos = ['AAA', 'AA+', 'AA', 'AA-', 'A'];
    const ratingsMedios = ['BBB+', 'BBB', 'BBB-', 'BB', 'B+', 'B', 'B-'];
    const ratingsBaixos = ['CCC+', 'CCC', 'CCC-', 'CC', 'C'];
    const avaliacoes = {
      avaliadas: todasStartups.filter(s => s.avaliacao_qualitativa?.rating_final).length,
      nao_avaliadas: todasStartups.filter(s => !s.avaliacao_qualitativa?.rating_final).length,
      por_faixa: {
        alto: todasStartups.filter(s => ratingsAltos.includes(s.avaliacao_qualitativa?.rating_final)).length,
        medio: todasStartups.filter(s => ratingsMedios.includes(s.avaliacao_qualitativa?.rating_final)).length,
        baixo: todasStartups.filter(s => ratingsBaixos.includes(s.avaliacao_qualitativa?.rating_final)).length
      }
    };
    
    // 6. Verificar as 10 mais recentes
    const maisRecentes = todasStartups
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10)
      .map(s => ({
        nome: s.nome,
        ativo: s.ativo,
        origem: s.origem_criacao || 'manual',
        rating: s.avaliacao_qualitativa?.rating_final || null,
        created_date: s.created_date
      }));

    // 7. Verificar se há problemas de RLS (Row Level Security)
    let startupsComUsuario = [];
    let problemaRLS = false;
    
    try {
      startupsComUsuario = await base44.entities.Startup.list();
    } catch (rlsError) {
      console.warn("Aviso RLS:", rlsError.message);
      problemaRLS = true;
    }
    
    const relatorio = {
      timestamp: new Date().toISOString(),
      total_completo: todasStartups.length,
      total_visiveis_usuario: startupsComUsuario.length,
      ativas: startupsAtivas.length,
      inativas: startupsInativas.length,
      por_origem: porOrigem,
      avaliacoes_especialista: avaliacoes,
      mais_recentes: maisRecentes,
      possivel_problema_rls: problemaRLS || (todasStartups.length !== startupsComUsuario.length),
      diferenca_rls: todasStartups.length - startupsComUsuario.length
    };

    console.log("📊 Relatório gerado com sucesso:", {
      total: relatorio.total_completo,
      ativas: relatorio.ativas,
      avaliadas: relatorio.avaliacoes_especialista.avaliadas
    });
    // avaliadas = avaliacao_qualitativa presente

    return new Response(JSON.stringify(relatorio), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Erro no diagnóstico:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno no servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});