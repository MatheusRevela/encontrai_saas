import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 🌐 DOMÍNIO DE PRODUÇÃO
const PRODUCTION_DOMAIN = 'https://encontrai.com';

const getEmailTemplate = (type, transacao) => {
  const templates = {
    '2h': {
      subject: "🔍 Suas soluções estão esperando por você!",
      body: `
Olá ${transacao.cliente_nome || 'empreendedor'},

Há algumas horas você descobriu ${transacao.startups_sugeridas?.length || 5} soluções incríveis para resolver: "${transacao.dor_relatada}"

⏰ Suas recomendações ficam disponíveis por apenas 24 horas!

As startups que nossa IA selecionou especialmente para você têm alta compatibilidade com seu desafio. Que tal dar uma olhada rápida e desbloquear os contatos?

👉 Finalizar agora: ${PRODUCTION_DOMAIN}/Resultados?sessionId=${transacao.session_id}

Lembre-se: A primeira solução é GRATUITA! 🎁

Abraços,
Equipe EncontrAI
      `
    },
    '24h': {
      subject: "Não perca o foco na solução do seu desafio!",
      body: `
Olá ${transacao.cliente_nome || 'empreendedor'},

Não deixe o problema que você queria resolver ficar para depois! Ontem você deu o primeiro passo para superar: "${transacao.dor_relatada}"

As ${transacao.startups_sugeridas?.length || 5} soluções que nossa IA encontrou continuam com alta compatibilidade para o seu caso.

"Depois de usar o EncontrAI, economizei 3 meses de pesquisa e encontrei a solução perfeita!" - Marina, CEO TechStore

👉 Retome de onde parou: ${PRODUCTION_DOMAIN}/Resultados?sessionId=${transacao.session_id}

Lembre-se: A primeira solução ainda é GRATUITA! 🎁

Equipe EncontrAI
      `
    },
    '3d': {
      subject: "🚨 Última chance para acessar suas recomendações",
      body: `
Olá ${transacao.cliente_nome || 'empreendedor'},

Este é um último lembrete sobre a sua busca para: "${transacao.dor_relatada}"

Suas recomendações personalizadas estão prestes a expirar. Esta é sua última oportunidade de acessá-las e encontrar o parceiro ideal para o seu negócio.

Por que outros empreendedores escolheram o EncontrAI:
✅ 94% de precisão nas recomendações
✅ Economia de 10-20 horas de pesquisa
✅ Contato direto com fundadores
✅ Startups verificadas mensalmente

👉 Acessar minhas soluções: ${PRODUCTION_DOMAIN}/Resultados?sessionId=${transacao.session_id}

Se não for o momento certo, sem problemas. Desejamos sucesso em seus projetos!

Equipe EncontrAI
      `
    }
  };

  return templates[type];
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

    // 1. Emails após 2 horas
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const pending2h = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pendente',
      created_date: { $lte: twoHoursAgo.toISOString() },
      abandoned_cart_2h_sent: { $ne: true }
    });

    for (const transacao of pending2h) {
      if (transacao.cliente_email) {
        try {
          const template = getEmailTemplate('2h', transacao);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: transacao.cliente_email,
            subject: template.subject,
            body: template.body
          });
          
          await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            abandoned_cart_2h_sent: true
          });
          emailsSent++;
        } catch (error) {
          console.error(`Erro ao enviar email 2h para ${transacao.cliente_email}:`, error);
        }
      }
    }

    // 2. Emails após 24 horas
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const pending24h = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pendente',
      created_date: { $lte: twentyFourHoursAgo.toISOString() },
      abandoned_cart_24h_sent: { $ne: true },
      abandoned_cart_2h_sent: true
    });

    for (const transacao of pending24h) {
      if (transacao.cliente_email) {
        try {
          const template = getEmailTemplate('24h', transacao);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: transacao.cliente_email,
            subject: template.subject,
            body: template.body
          });
          
          await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            abandoned_cart_24h_sent: true
          });
          emailsSent++;
        } catch (error) {
          console.error(`Erro ao enviar email 24h para ${transacao.cliente_email}:`, error);
        }
      }
    }

    // 3. Emails após 3 dias
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const pending3d = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pendente',
      created_date: { $lte: threeDaysAgo.toISOString() },
      abandoned_cart_3d_sent: { $ne: true },
      abandoned_cart_24h_sent: true
    });

    for (const transacao of pending3d) {
      if (transacao.cliente_email) {
        try {
          const template = getEmailTemplate('3d', transacao);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: transacao.cliente_email,
            subject: template.subject,
            body: template.body
          });
          
          await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            abandoned_cart_3d_sent: true
          });
          emailsSent++;
        } catch (error) {
          console.error(`Erro ao enviar email 3d para ${transacao.cliente_email}:`, error);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `${emailsSent} e-mails de carrinho abandonado enviados com sucesso.`,
      breakdown: {
        '2h': pending2h.length,
        '24h': pending24h.length,
        '3d': pending3d.length
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no envio de e-mails de carrinho abandonado:', error);
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