import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🌐 DOMÍNIO DE PRODUÇÃO
const PRODUCTION_DOMAIN = 'https://encontrai.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado.' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

    const allPotentiallyEligible = await base44.asServiceRole.entities.Transacao.filter({
      status_pagamento: 'pago',
      follow_up_email_sent: { $ne: true },
      created_date: { $lte: twentyFourHoursAgo.toISOString() }
    });

    if (allPotentiallyEligible.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma transação elegível para follow-up.' }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let emailsSent = 0;
    for (const transacao of allPotentiallyEligible) {
      if (!transacao.cliente_email) continue;

      const emailBody = `
Olá ${transacao.cliente_nome || 'Cliente'},

Faz 24 horas que você usou o EncontrAI para resolver: "${transacao.dor_relatada}".

Gostaríamos muito de saber como está sendo sua experiência! 

✅ Conseguiu entrar em contato com as soluções?
✅ Alguma delas está te ajudando?
✅ Precisa de algum suporte nosso?

👉 Avalie sua experiência: ${PRODUCTION_DOMAIN}/Feedback?id=${transacao.id}

Sua opinião é fundamental!

Muito obrigado,
Equipe EncontrAI
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: transacao.cliente_email,
        subject: 'Como está indo com as soluções do EncontrAI? 🚀',
        body: emailBody,
      });
      
      await base44.asServiceRole.entities.Transacao.update(transacao.id, { follow_up_email_sent: true });
      emailsSent++;
    }

    return new Response(JSON.stringify({ message: `${emailsSent} e-mails de follow-up enviados.` }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Erro no envio de e-mails de follow-up:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no servidor ao enviar e-mails.', details: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});