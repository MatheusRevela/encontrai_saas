import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PRODUCTION_DOMAIN = 'https://encontrai.com';
const corsHeaders = {
    'Access-Control-Allow-Origin': PRODUCTION_DOMAIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getEmailTemplate = (type, transacao) => {
    const templates = {
        '2h': {
            subject: "🔍 Suas soluções estão esperando por você!",
            body: `Olá ${transacao.cliente_nome || 'empreendedor'},

Há algumas horas você descobriu ${transacao.startups_sugeridas?.length || 5} soluções incríveis para resolver: "${transacao.dor_relatada}"

⏰ Suas recomendações ficam disponíveis por apenas 24 horas!

👉 Finalizar agora: ${PRODUCTION_DOMAIN}/Resultados?sessionId=${transacao.session_id}

Lembre-se: A primeira solução é GRATUITA! 🎁

Abraços,
Equipe EncontrAI`
        },
        '24h': {
            subject: "Não perca o foco na solução do seu desafio!",
            body: `Olá ${transacao.cliente_nome || 'empreendedor'},

Ontem você deu o primeiro passo para superar: "${transacao.dor_relatada}"

As soluções que nossa IA encontrou continuam com alta compatibilidade para o seu caso.

👉 Retome de onde parou: ${PRODUCTION_DOMAIN}/Resultados?sessionId=${transacao.session_id}

Lembre-se: A primeira solução ainda é GRATUITA! 🎁

Equipe EncontrAI`
        },
        '3d': {
            subject: "🚨 Última chance para acessar suas recomendações",
            body: `Olá ${transacao.cliente_nome || 'empreendedor'},

Este é um último lembrete sobre a sua busca para: "${transacao.dor_relatada}"

Por que outros empreendedores escolheram o EncontrAI:
✅ Recomendações com alto índice de precisão
✅ Economia de horas de pesquisa
✅ Contato direto com fundadores
✅ Startups verificadas mensalmente

👉 Acessar minhas soluções: ${PRODUCTION_DOMAIN}/Resultados?sessionId=${transacao.session_id}

Equipe EncontrAI`
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

        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        const [pending2h, pending24h, pending3d] = await Promise.all([
            base44.asServiceRole.entities.Transacao.filter({
                status_pagamento: 'pendente',
                created_date: { $lte: twoHoursAgo.toISOString() },
                abandoned_cart_2h_sent: { $ne: true }
            }),
            base44.asServiceRole.entities.Transacao.filter({
                status_pagamento: 'pendente',
                created_date: { $lte: twentyFourHoursAgo.toISOString() },
                abandoned_cart_24h_sent: { $ne: true },
                abandoned_cart_2h_sent: true
            }),
            base44.asServiceRole.entities.Transacao.filter({
                status_pagamento: 'pendente',
                created_date: { $lte: threeDaysAgo.toISOString() },
                abandoned_cart_3d_sent: { $ne: true },
                abandoned_cart_24h_sent: true
            })
        ]);

        const sendBatch = async (batch, type, flagField) => {
            const results = await Promise.allSettled(
                batch
                    .filter(t => t.cliente_email)
                    .map(async (transacao) => {
                        const template = getEmailTemplate(type, transacao);
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: transacao.cliente_email,
                            subject: template.subject,
                            body: template.body
                        });
                        await base44.asServiceRole.entities.Transacao.update(transacao.id, {
                            [flagField]: true
                        });
                    })
            );
            return results.filter(r => r.status === 'fulfilled').length;
        };

        const [sent2h, sent24h, sent3d] = await Promise.all([
            sendBatch(pending2h, '2h', 'abandoned_cart_2h_sent'),
            sendBatch(pending24h, '24h', 'abandoned_cart_24h_sent'),
            sendBatch(pending3d, '3d', 'abandoned_cart_3d_sent')
        ]);

        emailsSent = sent2h + sent24h + sent3d;

        return new Response(JSON.stringify({
            success: true,
            message: `${emailsSent} e-mails de carrinho abandonado enviados.`,
            breakdown: { '2h': sent2h, '24h': sent24h, '3d': sent3d }
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no envio de e-mails de carrinho abandonado:', error.message);
        return new Response(JSON.stringify({
            success: false,
            error: 'Erro interno no servidor'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});