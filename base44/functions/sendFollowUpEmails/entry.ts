import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PRODUCTION_DOMAIN = 'https://encontrai.com';
const corsHeaders = {
    'Access-Control-Allow-Origin': PRODUCTION_DOMAIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        // Envio em paralelo com Promise.allSettled (não bloqueia em falhas individuais)
        const results = await Promise.allSettled(
            allPotentiallyEligible
                .filter(t => t.cliente_email)
                .map(async (transacao) => {
                    const emailBody = `Olá ${transacao.cliente_nome || 'Cliente'},

Faz 24 horas que você usou o EncontrAI para resolver: "${transacao.dor_relatada}".

Gostaríamos muito de saber como está sendo sua experiência!

✅ Conseguiu entrar em contato com as soluções?
✅ Alguma delas está te ajudando?
✅ Precisa de algum suporte nosso?

👉 Avalie sua experiência: ${PRODUCTION_DOMAIN}/Feedback?id=${transacao.id}

Muito obrigado,
Equipe EncontrAI`;

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: transacao.cliente_email,
                        subject: 'Como está indo com as soluções do EncontrAI? 🚀',
                        body: emailBody,
                    });

                    await base44.asServiceRole.entities.Transacao.update(transacao.id, {
                        follow_up_email_sent: true
                    });
                })
        );

        const emailsSent = results.filter(r => r.status === 'fulfilled').length;
        const errors = results.filter(r => r.status === 'rejected').length;

        return new Response(JSON.stringify({ message: `${emailsSent} e-mails enviados. ${errors} falhas.` }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no envio de e-mails de follow-up:', error.message);
        return new Response(JSON.stringify({ error: 'Erro interno no servidor.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});