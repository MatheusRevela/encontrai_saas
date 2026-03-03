import { createClient } from 'npm:@base44/sdk@0.8.20';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://encontrai.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sendSuccessEmail = async (transaction, unlockedStartups) => {
    if (!transaction.cliente_email || unlockedStartups.length === 0) return;
    try {
        const emailBody = `Olá ${transaction.cliente_nome || 'Cliente'},

Ótima notícia! Seu pagamento foi confirmado e suas soluções foram desbloqueadas.

Aqui estão os contatos das ${unlockedStartups.length} startup${unlockedStartups.length > 1 ? 's' : ''} que você escolheu:

${unlockedStartups.map(startup => `🏢 ${startup.nome} (${startup.categoria}${startup.vertical_atuacao ? ` - ${startup.vertical_atuacao}` : ''})
${startup.email ? `📧 Email: ${startup.email}` : ''}
${startup.whatsapp ? `📱 WhatsApp: ${startup.whatsapp}` : ''}
${startup.site ? `🌐 Site: ${startup.site}` : ''}
${startup.preco_base ? `💰 Investimento: ${startup.preco_base}` : ''}
---`).join('\n')}

Acesse suas soluções em: https://encontrai.com/DetalhesBusca?id=${transaction.id}

Obrigado por usar o EncontrAI!`;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: transaction.cliente_email,
            subject: `🎉 Suas ${unlockedStartups.length} solução${unlockedStartups.length > 1 ? 'ões' : ''} foi${unlockedStartups.length > 1 ? 'ram' : ''} desbloqueada${unlockedStartups.length > 1 ? 's' : ''}!`,
            body: emailBody
        });
        console.log('Email enviado para:', transaction.cliente_email);
    } catch (error) {
        console.error('Erro ao enviar email:', error.message);
    }
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
        const body = await req.text();

        const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
        if (!webhookSecret) {
            console.error('MP_WEBHOOK_SECRET não configurado');
            return new Response('Webhook secret not configured', { status: 500, headers: corsHeaders });
        }

        // 🔒 SEGURANÇA: Validação de assinatura OBRIGATÓRIA
        const signature = req.headers.get('x-signature');
        const requestId = req.headers.get('x-request-id');

        if (!signature || !requestId) {
            console.error('Headers de assinatura ausentes - requisição rejeitada');
            return new Response('Missing signature headers', { status: 401, headers: corsHeaders });
        }

        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhookSecret);
        const message = encoder.encode(requestId + body);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, message);
        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        const receivedSignature = signature.replace('sha256=', '');

        if (expectedSignature !== receivedSignature) {
            console.error('Assinatura inválida - requisição rejeitada');
            return new Response('Invalid signature', { status: 401, headers: corsHeaders });
        }

        const data = JSON.parse(body);

        if (data.type !== 'payment') {
            return new Response('OK', { status: 200, headers: corsHeaders });
        }

        const paymentId = data.data?.id;
        if (!paymentId) {
            return new Response('Missing payment ID', { status: 400, headers: corsHeaders });
        }

        const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
        if (!accessToken) {
            return new Response('Access token not configured', { status: 500, headers: corsHeaders });
        }

        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!paymentResponse.ok) {
            console.error('Erro ao buscar pagamento:', paymentResponse.status);
            return new Response('Failed to fetch payment details', { status: 400, headers: corsHeaders });
        }

        const payment = await paymentResponse.json();

        // Identificar transação
        let transactions = [];
        const externalRef = payment.external_reference;
        const metadataTransacaoId = payment.metadata?.transacao_id;

        if (externalRef) {
            transactions = await base44.asServiceRole.entities.Transacao.filter({ id: externalRef });
        } else if (metadataTransacaoId) {
            transactions = await base44.asServiceRole.entities.Transacao.filter({ id: metadataTransacaoId });
        }

        if (transactions.length === 0) {
            console.error('Transação não encontrada para payment:', paymentId);
            return new Response('Transaction not found', { status: 400, headers: corsHeaders });
        }

        const transaction = transactions[0];

        // 🔒 Idempotência: evitar processamento duplicado
        if (transaction.status_pagamento === 'pago') {
            console.log('Pagamento já processado - webhook duplicado ignorado');
            return new Response('Already processed', { status: 200, headers: corsHeaders });
        }

        // 🔒 Validar preference_id
        if (transaction.mp_preference_id && payment.preference_id &&
            transaction.mp_preference_id !== payment.preference_id) {
            console.error('Preference ID não corresponde à transação');
            return new Response('Invalid preference ID', { status: 400, headers: corsHeaders });
        }

        // 🔒 Race condition: verificar se outro webhook já registrou este payment_id com status diferente
        if (transaction.mp_payment_id && transaction.mp_payment_id !== payment.id.toString()) {
            console.error('Payment ID conflitante - possível race condition');
            return new Response('Payment ID mismatch', { status: 409, headers: corsHeaders });
        }

        const newStatus = payment.status === 'approved' ? 'pago' :
            payment.status === 'in_process' ? 'processando' :
            payment.status === 'rejected' ? 'cancelado' : 'pendente';

        await base44.asServiceRole.entities.Transacao.update(transaction.id, {
            mp_payment_id: payment.id.toString(),
            mp_payment_status: payment.status,
            status_pagamento: newStatus
        });

        if (payment.status === 'approved') {
            const tipoTransacao = payment.metadata?.tipo;

            if (tipoTransacao === 'similares') {
                const startupOriginalId = payment.metadata?.startup_original_id;
                const similaresSelecionadas = JSON.parse(payment.metadata?.similares_selecionadas || '[]');

                if (startupOriginalId && similaresSelecionadas.length > 0) {
                    const startupsCompletas = await base44.asServiceRole.entities.Startup.filter({
                        id: { $in: similaresSelecionadas }
                    });

                    const similaresData = startupsCompletas.map(s => ({
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
                        logo_url: s.logo_url,
                        avaliacao_qualitativa: s.avaliacao_qualitativa
                    }));

                    const similaresDesbloqueadas = [...(transaction.similares_desbloqueadas || [])];
                    const indexExistente = similaresDesbloqueadas.findIndex(
                        s => s.startup_original_id === startupOriginalId
                    );

                    const novoRegistro = {
                        startup_original_id: startupOriginalId,
                        startups_similares: similaresData,
                        pago_em: new Date().toISOString()
                    };

                    if (indexExistente >= 0) {
                        similaresDesbloqueadas[indexExistente] = novoRegistro;
                    } else {
                        similaresDesbloqueadas.push(novoRegistro);
                    }

                    await base44.asServiceRole.entities.Transacao.update(transaction.id, {
                        similares_desbloqueadas: similaresDesbloqueadas
                    });
                }
            } else if (transaction.startups_selecionadas?.length > 0) {
                const startups = await base44.asServiceRole.entities.Startup.filter({
                    id: { $in: transaction.startups_selecionadas }
                });

                const unlockedStartups = startups.map(s => ({
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
                    logo_url: s.logo_url,
                    avaliacao_qualitativa: s.avaliacao_qualitativa
                }));

                await base44.asServiceRole.entities.Transacao.update(transaction.id, {
                    startups_desbloqueadas: unlockedStartups
                });

                await sendSuccessEmail(transaction, unlockedStartups);
            }
        }

        return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('Erro no webhook:', error.message);
        return new Response('Internal server error', { status: 500, headers: corsHeaders });
    }
});