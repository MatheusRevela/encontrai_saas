import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar transações (todas para admin, apenas do usuário para user)
    const transacoes = user.role === 'admin'
      ? await base44.asServiceRole.entities.Transacao.list('-created_date', 1000)
      : await base44.entities.Transacao.filter({ created_by: user.email }, '-created_date', 500);

    // Buscar startups para mapeamento de categorias
    const startups = await base44.asServiceRole.entities.Startup.list('', 5000);

    // 1. TENDÊNCIAS DE BUSCAS (últimos 12 períodos)
    const trends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTransacoes = transacoes.filter(t => {
        const created = new Date(t.created_date);
        return created >= monthStart && created <= monthEnd;
      });

      trends.push({
        periodo: `${monthStart.toLocaleString('pt-BR', { month: 'short' })}/${monthStart.getFullYear()}`,
        buscas: monthTransacoes.length,
        conversoes: monthTransacoes.filter(t => t.status_pagamento === 'pago').length
      });
    }

    // 2. CATEGORIAS MAIS DEMANDADAS
    const categoryMap = {};
    
    transacoes.forEach(t => {
      if (t.startups_selecionadas && Array.isArray(t.startups_selecionadas)) {
        t.startups_selecionadas.forEach(startupId => {
          const startup = startups.find(s => s.id === startupId);
          if (startup && startup.categoria) {
            categoryMap[startup.categoria] = (categoryMap[startup.categoria] || 0) + 1;
          }
        });
      }
    });

    const categories = Object.entries(categoryMap)
      .map(([categoria, quantidade]) => ({ categoria, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // 3. ROI / SATISFAÇÃO POR CATEGORIA
    const roiMap = {};
    
    transacoes.forEach(t => {
      if (t.avaliacoes_individuais && Array.isArray(t.avaliacoes_individuais)) {
        t.avaliacoes_individuais.forEach(av => {
          const startup = startups.find(s => s.id === av.startup_id);
          if (startup && startup.categoria && av.avaliacao) {
            if (!roiMap[startup.categoria]) {
              roiMap[startup.categoria] = { total: 0, count: 0 };
            }
            roiMap[startup.categoria].total += av.avaliacao;
            roiMap[startup.categoria].count += 1;
          }
        });
      }
    });

    const roi = Object.entries(roiMap)
      .map(([categoria, data]) => ({
        categoria,
        satisfacao: data.total / data.count,
        avaliacoes: data.count
      }))
      .sort((a, b) => b.satisfacao - a.satisfacao);

    const averageROI = roi.length > 0
      ? (roi.reduce((sum, r) => sum + r.satisfacao, 0) / roi.length) * 20 // Convertendo para %
      : 0;

    // 4. DISTRIBUIÇÃO REGIONAL (simulada com base em sessões/IPs - dados mockados por enquanto)
    const regions = [
      { regiao: 'São Paulo', buscas: Math.floor(transacoes.length * 0.35), conversoes: Math.floor(transacoes.filter(t => t.status_pagamento === 'pago').length * 0.35) },
      { regiao: 'Rio de Janeiro', buscas: Math.floor(transacoes.length * 0.20), conversoes: Math.floor(transacoes.filter(t => t.status_pagamento === 'pago').length * 0.20) },
      { regiao: 'Minas Gerais', buscas: Math.floor(transacoes.length * 0.15), conversoes: Math.floor(transacoes.filter(t => t.status_pagamento === 'pago').length * 0.15) },
      { regiao: 'Paraná', buscas: Math.floor(transacoes.length * 0.10), conversoes: Math.floor(transacoes.filter(t => t.status_pagamento === 'pago').length * 0.10) },
      { regiao: 'Bahia', buscas: Math.floor(transacoes.length * 0.08), conversoes: Math.floor(transacoes.filter(t => t.status_pagamento === 'pago').length * 0.08) },
      { regiao: 'Outros', buscas: Math.floor(transacoes.length * 0.12), conversoes: Math.floor(transacoes.filter(t => t.status_pagamento === 'pago').length * 0.12) }
    ].filter(r => r.buscas > 0);

    // 5. RESUMO EXECUTIVO
    const totalBuscas = transacoes.length;
    const totalConversoes = transacoes.filter(t => t.status_pagamento === 'pago').length;
    const receitaTotal = transacoes
      .filter(t => t.status_pagamento === 'pago')
      .reduce((sum, t) => sum + (t.valor_total || 0), 0);

    const summary = {
      totalBuscas,
      totalConversoes,
      taxaConversao: totalBuscas > 0 ? (totalConversoes / totalBuscas) * 100 : 0,
      receitaTotal
    };

    return Response.json({
      success: true,
      data: {
        trends,
        categories,
        roi,
        averageROI,
        regions,
        summary
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados analíticos:', error);
    return Response.json(
      { error: 'Erro ao processar dados analíticos', details: error.message },
      { status: 500 }
    );
  }
});