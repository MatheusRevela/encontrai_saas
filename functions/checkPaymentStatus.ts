import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://encontrai.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'sessionId obrigatório' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });

        if (transacoes.length === 0) {
            return new Response(JSON.stringify({ error: 'Transação não encontrada' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const transacao = transacoes[0];

        // Verificar ownership da transação
        if (transacao.created_by && transacao.created_by !== user.email) {
            return new Response(JSON.stringify({ error: 'Acesso negado' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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

            // APPEND: só desbloquear as que ainda não foram desbloqueadas
            const jaDesbloquedosIds = new Set((transacao.startups_desbloqueadas || []).map(s => s.startup_id));
            const novosIds = (transacao.startups_selecionadas || []).filter(id => !jaDesbloquedosIds.has(id));

            const startups = novosIds.length > 0
                ? await base44.asServiceRole.entities.Startup.filter({ id: { $in: novosIds } })
                : [];

            const novasDesbloqueadas = startups.map(s => ({
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

            const todasDesbloqueadas = [...(transacao.startups_desbloqueadas || []), ...novasDesbloqueadas];

            await base44.asServiceRole.entities.Transacao.update(transacao.id, {
                status_pagamento: 'pago',
                startups_desbloqueadas: todasDesbloqueadas,
                mp_payment_id: String(approvedPayment.id),
                mp_payment_status: approvedPayment.status
            });

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
        console.error('Erro em checkPaymentStatus:', error.message);
        return new Response(JSON.stringify({ error: 'Erro interno' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});