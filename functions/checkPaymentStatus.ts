import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sendSuccessEmail = async (transaction, unlockedStartups) => {
    if (!transaction.cliente_email || unlockedStartups.length === 0) return;

    try {
        const { SendEmail } = await import('@/integrations/Core');
        
        const emailBody = `
Olá ${transaction.cliente_nome || 'Cliente'},

Ótima notícia! Seu pagamento foi confirmado e suas soluções foram desbloqueadas.

Aqui estão os contatos das ${unlockedStartups.length} startup${unlockedStartups.length > 1 ? 's' : ''} que você escolheu:

${unlockedStartups.map(startup => `
🏢 ${startup.nome} (${startup.categoria}${startup.vertical_atuacao ? ` - ${startup.vertical_atuacao}` : ''})
${startup.email ? `📧 Email: ${startup.email}` : ''}
${startup.whatsapp ? `📱 WhatsApp: ${startup.whatsapp}` : ''}
${startup.site ? `🌐 Site: ${startup.site}` : ''}
${startup.preco_base ? `💰 Investimento: ${startup.preco_base}` : ''}

Descrição: ${startup.descricao}
---
`).join('')}

Você também pode acessar essas informações a qualquer momento em:
https://app--encontr-ai-76824f7d.base44.app/DetalhesBusca?id=${transaction.id}

Obrigado por usar o EncontrAI!
        `;

        await base44.integrations.Core.SendEmail({
            to: transaction.cliente_email,
            subject: `🎉 Suas ${unlockedStartups.length} solução${unlockedStartups.length > 1 ? 'ões' : ''} foi${unlockedStartups.length > 1 ? 'ram' : ''} desbloqueada${unlockedStartups.length > 1 ? 's' : ''}!`,
            body: emailBody
        });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
    }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { sessionId } = await req.json();
    const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });

    if (transacoes.length === 0) {
      return new Response(JSON.stringify({ error: 'Transação não encontrada' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const transacao = transacoes[0];

    if (transacao.status_pagamento === 'pago') {
      return new Response(JSON.stringify({ status: 'pago' }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: 'Gateway de pagamento não configurado' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Busca pagamentos aprovados para esta transação
    const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${transacao.id}&status=approved`;
    const response = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${mpAccessToken}` }
    });
    
    if (!response.ok) {
        return new Response(JSON.stringify({ status: 'processando' }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
    
    const searchData = await response.json();
    
    if (searchData.results && searchData.results.length > 0) {
        const approvedPayment = searchData.results[0];
        
        // Busca as startups para desbloquear
        const startups = await base44.entities.Startup.list();
        const unlockedStartups = startups
            .filter(s => transacao.startups_selecionadas?.includes(s.id))
            .map(s => ({
                startup_id: s.id,
                nome: s.nome,
                descricao: s.descricao,
                categoria: s.categoria,
                vertical_atuacao: s.vertical_atuacao,
                modelo_negocio: s.modelo_negocio,
                site: s.site,
                email: s.email,
                whatsapp: s.whatsapp,
                linkedin: s.linkedin,
                preco_base: s.preco_base,
                logo_url: s.logo_url
            }));

        // Atualiza transação como paga
        await base44.entities.Transacao.update(transacao.id, {
            status_pagamento: 'pago',
            startups_desbloqueadas: unlockedStartups,
            mp_payment_id: String(approvedPayment.id),
            mp_payment_status: approvedPayment.status
        });
        
        // Envia email de sucesso
        await sendSuccessEmail(transacao, unlockedStartups);

        return new Response(JSON.stringify({ status: 'pago' }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify({ status: 'processando' }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Erro em checkPaymentStatus:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});