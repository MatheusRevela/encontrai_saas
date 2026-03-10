import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ALLOWED_ORIGIN = 'https://encontrai.com';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transacao_id, startup_original_id, similares_selecionadas } = await req.json();

        if (!transacao_id || !startup_original_id || !similares_selecionadas?.length) {
            return Response.json({ error: 'Parâmetros obrigatórios faltando' }, { status: 400 });
        }

        const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
        if (!MP_ACCESS_TOKEN) {
            return Response.json({ error: 'Mercado Pago não configurado' }, { status: 500 });
        }

        const transacao = await base44.asServiceRole.entities.Transacao.get(transacao_id);
        if (!transacao) {
            return Response.json({ error: 'Transação não encontrada' }, { status: 404 });
        }

        // 🔒 Verificar ownership — usuário deve ser dono da transação
        if (transacao.created_by && transacao.created_by !== user.email) {
            return Response.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const quantidadeSelecionada = similares_selecionadas.length;
        // Similares têm preço próprio (R$ 4,00/un) — diferentes do checkout principal (R$ 5,00)
        const PRECO_SIMILAR = 4.00;
        const valorTotal = parseFloat((quantidadeSelecionada * PRECO_SIMILAR).toFixed(2));

        const preference = {
            items: [{
                title: `${quantidadeSelecionada} Startup${quantidadeSelecionada > 1 ? 's' : ''} Similar${quantidadeSelecionada > 1 ? 'es' : ''} - ${transacao.id.substring(0, 8)}`,
                quantity: quantidadeSelecionada,
                unit_price: PRECO_SIMILAR,
                currency_id: 'BRL'
            }],
            payer: {
                email: user.email,
                name: user.full_name
            },
            back_urls: {
                success: `${ALLOWED_ORIGIN}/StatusPagamento?sessionId=${transacao.session_id}&tipo=similares&startup_id=${startup_original_id}`,
                failure: `${ALLOWED_ORIGIN}/StatusPagamento?sessionId=${transacao.session_id}&tipo=similares&status=failure`,
                pending: `${ALLOWED_ORIGIN}/StatusPagamento?sessionId=${transacao.session_id}&tipo=similares&status=pending`
            },
            auto_return: 'approved',
            // 🔒 URL correta do webhook
            notification_url: `https://app.base44.com/api/functions/handleMercadoPagoWebhook`,
            metadata: {
                transacao_id: transacao.id,
                startup_original_id: startup_original_id,
                similares_selecionadas: JSON.stringify(similares_selecionadas),
                tipo: 'similares'
            }
        };

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });

        if (!mpResponse.ok) {
            const errorData = await mpResponse.text();
            console.error('Erro Mercado Pago:', errorData);
            return Response.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
        }

        const mpData = await mpResponse.json();

        await base44.asServiceRole.entities.Transacao.update(transacao.id, {
            mp_preference_similares: {
                preference_id: mpData.id,
                startup_original_id: startup_original_id,
                similares_selecionadas: similares_selecionadas,
                init_point: mpData.init_point,
                created_at: new Date().toISOString()
            }
        });

        return Response.json({
            payment_url: mpData.init_point,
            preference_id: mpData.id
        });

    } catch (error) {
        console.error('Erro ao processar pagamento de similares:', error.message);
        return Response.json({ error: 'Erro interno' }, { status: 500 });
    }
});