import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ALLOWED_ORIGIN = 'https://encontrai.com';
const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ Lógica de precificação centralizada — única fonte de verdade
const PRECO_UNITARIO = 5.00;
const DESCONTO_CINCO_SOLUCOES = 3.00;

const calcularValor = (quantidade, isNovoUsuario, isAdicional) => {
    if (quantidade <= 0) return 0;
    let valor = (!isAdicional && isNovoUsuario)
        ? Math.max(0, (quantidade - 1) * PRECO_UNITARIO)
        : quantidade * PRECO_UNITARIO;
    if (!isAdicional && quantidade === 5) {
        valor = Math.max(0, valor - DESCONTO_CINCO_SOLUCOES);
    }
    return parseFloat(valor.toFixed(2));
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const base44 = createClientFromRequest(req);

        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { sessionId } = await req.json();
        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'sessionId é obrigatório' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });
        if (!transacoes || transacoes.length === 0) {
            return new Response(JSON.stringify({ error: 'Transação não encontrada' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const transacao = transacoes[0];

        // 🔒 Verificar ownership
        if (transacao.created_by && transacao.created_by !== user.email) {
            return new Response(JSON.stringify({ error: 'Acesso negado' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
        if (!mpAccessToken) {
            return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!transacao.cliente_nome || !transacao.cliente_email) {
            return new Response(JSON.stringify({ error: 'Dados do cliente incompletos' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 🔒 Recalcular valor no backend — nunca confiar no frontend
        const isAdicionalCheckout = transacao.is_adicional_checkout || false;
        const quantidadeSelecionada = isAdicionalCheckout
            ? (transacao.adicional_startups_count || 0)
            : (transacao.startups_selecionadas?.length || 0);

        if (quantidadeSelecionada === 0) {
            return new Response(JSON.stringify({ error: 'Nenhuma startup selecionada' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Verificar se é novo usuário (primeira compra paga)
        const comprasAnteriores = await base44.asServiceRole.entities.Transacao.filter({
            created_by: user.email,
            status_pagamento: 'pago'
        });
        const isNovoUsuario = comprasAnteriores.length === 0;

        const valorTotal = calcularValor(quantidadeSelecionada, isNovoUsuario, isAdicionalCheckout);

        // Validar CPF
        const cpfCliente = transacao.cliente_cpf?.replace(/\D/g, '');
        if (!cpfCliente || cpfCliente.length !== 11 || cpfCliente === '00000000000') {
            return new Response(JSON.stringify({
                error: 'CPF inválido. O Mercado Pago exige um CPF válido para processar pagamentos.',
                field: 'cpf'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const preference = {
            items: [{
                title: `Desbloqueio de ${quantidadeSelecionada} soluç${quantidadeSelecionada > 1 ? 'ões' : 'ão'} - EncontrAI`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: valorTotal
            }],
            payer: {
                name: transacao.cliente_nome,
                email: transacao.cliente_email,
                identification: { type: 'CPF', number: cpfCliente }
            },
            payment_methods: {
                excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
                installments: 1
            },
            back_urls: {
                success: `${ALLOWED_ORIGIN}/Sucesso?sessionId=${sessionId}`,
                failure: `${ALLOWED_ORIGIN}/Checkout?sessionId=${sessionId}&error=payment_failed`,
                pending: `${ALLOWED_ORIGIN}/StatusPagamento?sessionId=${sessionId}`
            },
            auto_return: 'approved',
            external_reference: transacao.id,
            statement_descriptor: 'ENCONTRAI',
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            notification_url: `${ALLOWED_ORIGIN}/functions/handleMercadoPagoWebhook`
        };

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });

        if (!mpResponse.ok) {
            const mpError = await mpResponse.json();
            console.error('Erro do Mercado Pago:', mpError.message);
            return new Response(JSON.stringify({
                error: `Erro do Mercado Pago: ${mpError.message || 'Erro desconhecido'}`
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const mpData = await mpResponse.json();

        // Salvar valor RECALCULADO no backend — sobrescreve qualquer valor do frontend
        await base44.entities.Transacao.update(transacao.id, {
            mp_preference_id: mpData.id,
            mp_init_point: mpData.init_point,
            status_pagamento: 'processando',
            valor_total: valorTotal
        });

        return new Response(JSON.stringify({
            success: true,
            paymentUrl: mpData.init_point,
            preferenceId: mpData.id
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro em createPaymentLink:', error.message);
        return new Response(JSON.stringify({ error: 'Erro interno ao processar o pagamento' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});