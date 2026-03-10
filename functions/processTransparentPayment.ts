import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ALLOWED_ORIGIN = 'https://encontrai.com';
const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRECO_UNITARIO = 5.00;
const DESCONTO_CINCO_SOLUCOES = 3.00;

const calcularValor = (quantidade, isNovoUsuario, isAdicional) => {
    if (quantidade <= 0) return 0;
    let valor = (!isAdicional && isNovoUsuario)
        ? Math.max(0, (quantidade - 1) * PRECO_UNITARIO)
        : quantidade * PRECO_UNITARIO;
    if (!isAdicional && quantidade === 5) valor = Math.max(0, valor - DESCONTO_CINCO_SOLUCOES);
    return parseFloat(valor.toFixed(2));
};

const unlockAndNotify = async (base44, transaction, emailCliente, nomeCliente) => {
    if (!transaction.startups_selecionadas?.length) return;

    // Identificar apenas as startups ainda não desbloqueadas
    const jaDesbloquedosIds = new Set((transaction.startups_desbloqueadas || []).map(s => s.startup_id));
    const novosIds = transaction.startups_selecionadas.filter(id => !jaDesbloquedosIds.has(id));

    if (novosIds.length === 0) return;

    const startups = await base44.asServiceRole.entities.Startup.filter({
        id: { $in: novosIds }
    });

    const novasDesbloqueadas = startups.map(s => ({
        startup_id: s.id, nome: s.nome, descricao: s.descricao,
        categoria: s.categoria, vertical_atuacao: s.vertical_atuacao,
        modelo_negocio: s.modelo_negocio, site: s.site, email: s.email,
        whatsapp: s.whatsapp, linkedin: s.linkedin, preco_base: s.preco_base,
        logo_url: s.logo_url, avaliacao_qualitativa: s.avaliacao_qualitativa
    }));

    // APPEND às já desbloqueadas (não substitui)
    const todasDesbloqueadas = [...(transaction.startups_desbloqueadas || []), ...novasDesbloqueadas];

    await base44.asServiceRole.entities.Transacao.update(transaction.id, {
        startups_desbloqueadas: todasDesbloqueadas
    });

    if (emailCliente && novasDesbloqueadas.length > 0) {
        const corpo = `Olá ${nomeCliente || 'Cliente'},\n\nSeu pagamento foi confirmado! Aqui estão os contatos:\n\n${novasDesbloqueadas.map(s => `🏢 ${s.nome}\n${s.email ? `📧 ${s.email}` : ''}\n${s.whatsapp ? `📱 ${s.whatsapp}` : ''}\n${s.site ? `🌐 ${s.site}` : ''}\n---`).join('\n')}\n\nAcesse: ${ALLOWED_ORIGIN}/DetalhesBusca?id=${transaction.id}`;
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: emailCliente,
                subject: `🎉 Suas ${novasDesbloqueadas.length} solução${novasDesbloqueadas.length > 1 ? 'ões' : ''} ${novasDesbloqueadas.length > 1 ? 'foram' : 'foi'} desbloqueada${novasDesbloqueadas.length > 1 ? 's' : ''}!`,
                body: corpo
            });
        } catch (e) {
            console.error('Erro ao enviar email:', e.message);
        }
    }
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { sessionId, email, cpf, paymentFormData } = await req.json();
        if (!sessionId || !email || !cpf || !paymentFormData) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });
        if (!transacoes.length) return new Response(JSON.stringify({ error: 'Transação não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const transacao = transacoes[0];
        if (transacao.created_by && transacao.created_by !== user.email) {
            return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const isAdicionalCheckout = transacao.is_adicional_checkout || false;
        const quantidade = isAdicionalCheckout
            ? (transacao.adicional_startups_count || 0)
            : (transacao.startups_selecionadas?.length || 0);

        const comprasAnteriores = await base44.asServiceRole.entities.Transacao.filter({
            created_by: user.email, status_pagamento: 'pago'
        });
        const isNovoUsuario = comprasAnteriores.length === 0;
        const valorTotal = calcularValor(quantidade, isNovoUsuario, isAdicionalCheckout);

        const cpfLimpo = cpf.replace(/\D/g, '');
        const nomeCliente = user?.full_name || email.split('@')[0];

        await base44.entities.Transacao.update(transacao.id, {
            cliente_email: email.trim(),
            cliente_nome: nomeCliente,
            cliente_cpf: cpfLimpo,
            status_pagamento: 'processando'
        });

        // Caso GRÁTIS
        if (valorTotal === 0 || paymentFormData.payment_method_id === 'free') {
            await unlockAndNotify(base44, transacao, email.trim(), nomeCliente);
            await base44.entities.Transacao.update(transacao.id, { status_pagamento: 'pago' });
            return new Response(JSON.stringify({ success: true, status: 'approved' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
        if (!accessToken) return new Response(JSON.stringify({ error: 'Configuração incompleta' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const paymentPayload = {
            ...paymentFormData,
            transaction_amount: valorTotal,
            description: `Desbloqueio de ${quantidade} solução${quantidade > 1 ? 'ões' : ''} - EncontrAI`,
            external_reference: transacao.id,
            notification_url: `${ALLOWED_ORIGIN}/functions/handleMercadoPagoWebhook`,
            payer: {
                ...(paymentFormData?.payer || {}),
                email: email.trim(),
                identification: { type: 'CPF', number: cpfLimpo }
            }
        };

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `${transacao.id}-${Date.now()}`
            },
            body: JSON.stringify(paymentPayload)
        });

        const payment = await mpResponse.json();

        if (!mpResponse.ok) {
            const errMsg = payment.message || payment.cause?.[0]?.description || 'Erro ao processar pagamento';
            await base44.entities.Transacao.update(transacao.id, { status_pagamento: 'pendente' });
            return new Response(JSON.stringify({ success: false, error: errMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (payment.status === 'approved') {
            // Primeiro desbloqueia as startups, depois marca como pago (atômico via unlockAndNotify)
            await unlockAndNotify(base44, transacao, email.trim(), nomeCliente);
            // unlockAndNotify já salvou startups_desbloqueadas; agora atualiza status
            await base44.entities.Transacao.update(transacao.id, {
                mp_payment_id: payment.id.toString(),
                mp_payment_status: payment.status,
                status_pagamento: 'pago',
                valor_total: valorTotal
            });
        } else {
            const newStatus = payment.status === 'in_process' ? 'processando' : 'pendente';
            await base44.entities.Transacao.update(transacao.id, {
                mp_payment_id: payment.id.toString(),
                mp_payment_status: payment.status,
                status_pagamento: newStatus,
                valor_total: valorTotal
            });
        }

        const result = { success: true, status: payment.status, paymentId: payment.id };

        if (payment.status === 'pending' && payment.point_of_interaction?.transaction_data) {
            result.pixQrCode = payment.point_of_interaction.transaction_data.qr_code;
            result.pixQrCodeBase64 = payment.point_of_interaction.transaction_data.qr_code_base64;
        }

        return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Erro em processTransparentPayment:', error.message);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});