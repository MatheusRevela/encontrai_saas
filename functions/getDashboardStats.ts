import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    // Buscar dados em paralelo
    const [usersData, transacoesData, startupsData] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Transacao.list('-created_date'),
      base44.asServiceRole.entities.Startup.list()
    ]);

    // Calcular stats principais
    const totalUsers = usersData.length;
    const paidTransactions = transacoesData.filter(t => t.status_pagamento === 'pago');
    const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.valor_total || 0), 0);
    const totalTransactions = transacoesData.length;
    const conversionRate = totalTransactions > 0 ? (paidTransactions.length / totalTransactions) * 100 : 0;

    // Growth metrics
    const pendingTransactions = transacoesData.filter(t => t.status_pagamento === 'pendente');
    const cartAbandonmentRate = totalTransactions > 0 
      ? (pendingTransactions.length / totalTransactions) * 100 
      : 0;

    const avgTimeToConvert = paidTransactions.length > 0
      ? paidTransactions.reduce((acc, t) => {
          const created = new Date(t.created_date);
          const updated = new Date(t.updated_date);
          return acc + (updated - created);
        }, 0) / paidTransactions.length / (1000 * 60) // minutos
      : 0;

    // Verification stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let needsVerificationCount = 0;
    let withIssuesCount = 0;
    let verifiedLast30DaysCount = 0;
    const issuesList = [];

    startupsData.forEach(startup => {
      const lastCheck = startup.ultima_verificacao ? new Date(startup.ultima_verificacao) : null;
      
      if (!lastCheck || lastCheck < thirtyDaysAgo) {
        needsVerificationCount++;
      } else {
        verifiedLast30DaysCount++;
      }
      
      if (startup.status_verificacao?.site_online === false || 
          startup.status_verificacao?.ssl_valido === false) {
        if (!issuesList.some(s => s.id === startup.id)) {
          withIssuesCount++;
          if (issuesList.length < 5) {
            issuesList.push({
              id: startup.id,
              nome: startup.nome,
              status_verificacao: startup.status_verificacao
            });
          }
        }
      }
    });

    const newUsersCount = usersData.filter(u => 
      new Date(u.created_date) >= weekAgo
    ).length;

    // Transações recentes (top 5)
    const recentTransactions = transacoesData.slice(0, 5).map(t => ({
      id: t.id,
      created_date: t.created_date,
      status_pagamento: t.status_pagamento,
      valor_total: t.valor_total,
      quantidade_selecionada: t.quantidade_selecionada,
      cliente_email: t.cliente_email
    }));

    return Response.json({
      stats: {
        totalUsers,
        totalRevenue,
        totalTransactions,
        conversionRate
      },
      growthMetrics: {
        conversion_rate: conversionRate,
        avg_time_to_convert: avgTimeToConvert,
        cart_abandonment_rate: cartAbandonmentRate,
        returning_users: 0 // TODO: Implementar lógica de usuários recorrentes
      },
      verificationStats: {
        needsVerification: needsVerificationCount,
        withIssues: withIssuesCount,
        verifiedLast30Days: verifiedLast30DaysCount,
        startupsWithIssues: issuesList,
        total: startupsData.length,
        newUsers: newUsersCount
      },
      recentTransactions
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[ERRO getDashboardStats]:', error);
    return Response.json({ 
      error: 'Erro ao carregar estatísticas do dashboard',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});