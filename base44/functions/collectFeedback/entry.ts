import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://encontrai.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 🌐 DOMÍNIO DE PRODUÇÃO
const PRODUCTION_DOMAIN = 'https://encontrai.com';

const getEmailTemplate = (days, transacao) => {
  
  const templates = {
    15: {
      subject: "Como está indo com sua nova solução? 🚀",
      body: `
Olá ${transacao.cliente_nome || 'empreendedor'},

Faz 15 dias que você desbloqueou soluções para: "${transacao.dor_relatada}"

Como está a experiência até agora? 

📊 Dados rápidos nos ajudam a melhorar:
- A startup respondeu rapidamente? (Sim/Não)
- Conseguiu implementar algo? (Sim/Parcialmente/Não)
- Qual foi sua primeira impressão? (1-5 estrelas)

👉 Responder pesquisa (2 minutos): ${PRODUCTION_DOMAIN}/Feedback?id=${transacao.id}&type=15d

Sua opinião melhora nossa IA e ajuda outros empreendedores! 

Obrigado,
Equipe EncontrAI
      `
    },
    30: {
      subject: "1 mês depois: Sua solução funcionou? 📈",
      body: `
Olá ${transacao.cliente_nome || 'empreendedor'},

Faz 1 mês que você encontrou soluções no EncontrAI para: "${transacao.dor_relatada}"

Este é o momento perfeito para nos contar os RESULTADOS REAIS!

🎯 Nos conte em 3 minutos:
✅ A solução resolveu seu problema?
✅ Qual o impacto no seu negócio?
✅ Recomendaria para outros empreendedores?
✅ Alguma sugestão de melhoria?

👉 Avaliar experiência: ${PRODUCTION_DOMAIN}/Feedback?id=${transacao.id}&type=30d

🎁 BÔNUS: Quem avalia ganha 50% de desconto na próxima busca!

Cases como o seu inspiram outros empreendedores.

Abraços,
Equipe EncontrAI
      `
    },
    60: {
      subject: "Case de sucesso? Queremos divulgar! 🏆",
      body: `
Olá ${transacao.cliente_nome || 'empreendedor'},

2 meses se passaram desde que você usou o EncontrAI para: "${transacao.dor_relatada}"

Se deu certo, queremos CELEBRAR seu sucesso! 🎉

📢 Histórias de sucesso que divulgamos:
- "Aumentei 40% nas vendas com a solução do EncontrAI" - João B.
- "Economizei 15 horas semanais no meu e-commerce" - Ana C.
- "Encontrei o parceiro ideal para escalar minha startup" - Pedro L.

👉 Compartilhar seu case: ${PRODUCTION_DOMAIN}/Feedback?id=${transacao.id}&type=60d

🎁 Se seu case for selecionado: R$ 200 em créditos na plataforma!

Mesmo que não tenha dado certo, seu feedback é valioso.

Sucesso sempre!
Equipe EncontrAI
      `
    }
  };

  return templates[days];
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

    const now = new Date();
    let emailsSent = 0;

    // 1. Feedback após 15 dias
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const paid15d = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pago',
      created_date: { $lte: fifteenDaysAgo.toISOString() },
      feedback_15d_sent: { $ne: true }
    });

    for (const transacao of paid15d) {
      if (transacao.cliente_email) {
        try {
          const template = getEmailTemplate(15, transacao);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: transacao.cliente_email,
            subject: template.subject,
            body: template.body
          });
          
          await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            feedback_15d_sent: true
          });
          emailsSent++;
        } catch (error) {
          console.error(`Erro ao enviar feedback email para ${transacao.cliente_email}:`, error);
        }
      }
    }

    // 2. Feedback após 30 dias
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const paid30d = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pago',
      created_date: { $lte: thirtyDaysAgo.toISOString() },
      feedback_30d_sent: { $ne: true }
    });

    for (const transacao of paid30d) {
      if (transacao.cliente_email) {
        try {
          const template = getEmailTemplate(30, transacao);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: transacao.cliente_email,
            subject: template.subject,
            body: template.body
          });
          
          await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            feedback_30d_sent: true
          });
          emailsSent++;
        } catch (error) {
          console.error(`Erro ao enviar feedback email para ${transacao.cliente_email}:`, error);
        }
      }
    }

    // 3. Case de sucesso após 60 dias
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const paid60d = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pago',
      created_date: { $lte: sixtyDaysAgo.toISOString() },
      feedback_60d_sent: { $ne: true }
    });

    for (const transacao of paid60d) {
      if (transacao.cliente_email) {
        try {
          const template = getEmailTemplate(60, transacao);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: transacao.cliente_email,
            subject: template.subject,
            body: template.body
          });
          
          await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            feedback_60d_sent: true
          });
          emailsSent++;
        } catch (error) {
          console.error(`Erro ao enviar feedback email para ${transacao.cliente_email}:`, error);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `${emailsSent} e-mails de feedback enviados com sucesso.`,
      breakdown: {
        '15d': paid15d.length,
        '30d': paid30d.length,
        '60d': paid60d.length
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no envio de e-mails de feedback:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno no servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});