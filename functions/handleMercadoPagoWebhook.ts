import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://encontrai.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sendSuccessEmail = async (base44, transaction, unlockedStartups) => {
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

        // Validação de assinatura Mercado Pago (formato: ts=<timestamp>,v1=<hmac>)
        if (webhookSecret) {
            const xSignature = req.headers.get('x-signature');
            const xRequestId = req.headers.get('x-request-id');

            if (xSignature && xRequestId) {
                // Extrair ts e v1 do header x-signature
                let ts = '';
                let v1 = '';
                for (const part of xSignature.split(',')) {
                    if (part.trim().startsWith('ts=')) ts = part.trim().substring(3);
                    if (part.trim().startsWith('v1=')) v1 = part.trim().substring(3);
                }

                if (ts && v1) {
                    // Extrair data.id do body para o manifest
                    let dataId = '';
                    try {
                        const parsedBody = JSON.parse(body);
                        dataId = parsedBody?.data?.id || '';
                    } catch (_) {}

                    // Manifest conforme documentação do MP
                    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

                    const encoder = new TextEncoder();
                    const cryptoKey = await crypto.subtle.importKey(
                        'raw', encoder.encode(webhookSecret),
                        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
                    );
                    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(manifest));
                    const expectedV1 = Array.from(new Uint8Array(signatureBuffer))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');

                    if (expectedV1 !== v1) {
                        console.error('Assinatura inválida - requisição rejeitada');
                        return new Response('Invalid signature', { status: 401, headers: corsHeaders });
                    }
                }
            }
        }

        const data = JSON.parse(body);
        console.log('Webhook recebido:', data.type, data.data?.id);

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
        console.log('Payment status:', payment.status, 'external_reference:', payment.external_reference);

        const base44 = createClientFromRequest(req);

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
            return new Response('Transaction not found', { status: 404, headers: corsHeaders });
        }

        const transaction = transactions[0];

        // Idempotência
        if (transaction.status_pagamento === 'pago') {
            console.log('Pagamento já processado - webhook duplicado ignorado');
            return new Response('Already processed', { status: 200, headers: corsHeaders });
        }

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
                        startup_id: s.id, nome: s.nome, descricao: s.descricao,
                        categoria: s.categoria, vertical_atuacao: s.vertical_atuacao,
                        modelo_negocio: s.modelo_negocio, site: s.site, email: s.email,
                        whatsapp: s.whatsapp, linkedin: s.linkedin, preco_base: s.preco_base,
                        logo_url: s.logo_url, avaliacao_qualitativa: s.avaliacao_qualitativa
                    }));

                    const similaresDesbloqueadas = [...(transaction.similares_desbloqueadas || [])];
                    const indexExistente = similaresDesbloqueadas.findIndex(s => s.startup_original_id === startupOriginalId);
                    const novoRegistro = { startup_original_id: startupOriginalId, startups_similares: similaresData, pago_em: new Date().toISOString() };

                    if (indexExistente >= 0) similaresDesbloqueadas[indexExistente] = novoRegistro;
                    else similaresDesbloqueadas.push(novoRegistro);

                    // Atualiza status e similares em uma única chamada atômica
                    await base44.asServiceRole.entities.Transacao.update(transaction.id, {
                        mp_payment_id: payment.id.toString(),
                        mp_payment_status: payment.status,
                        status_pagamento: 'pago',
                        similares_desbloqueadas: similaresDesbloqueadas
                    });
                }
            } else if (transaction.startups_selecionadas?.length > 0) {
                // Identificar apenas as startups ainda não desbloqueadas (APPEND, não substitui)
                const jaDesbloqueadasIds = new Set((transaction.startups_desbloqueadas || []).map(s => s.startup_id));
                const novosIds = transaction.startups_selecionadas.filter(id => !jaDesbloqueadasIds.has(id));

                const startups = novosIds.length > 0
                    ? await base44.asServiceRole.entities.Startup.filter({ id: { $in: novosIds } })
                    : [];

                const novasDesbloqueadas = startups.map(s => ({
                    startup_id: s.id, nome: s.nome, descricao: s.descricao,
                    categoria: s.categoria, vertical_atuacao: s.vertical_atuacao,
                    modelo_negocio: s.modelo_negocio, site: s.site, email: s.email,
                    whatsapp: s.whatsapp, linkedin: s.linkedin, preco_base: s.preco_base,
                    logo_url: s.logo_url, avaliacao_qualitativa: s.avaliacao_qualitativa
                }));

                const todasDesbloqueadas = [...(transaction.startups_desbloqueadas || []), ...novasDesbloqueadas];

                // Atualiza tudo em uma única chamada atômica
                await base44.asServiceRole.entities.Transacao.update(transaction.id, {
                    mp_payment_id: payment.id.toString(),
                    mp_payment_status: payment.status,
                    status_pagamento: 'pago',
                    startups_desbloqueadas: todasDesbloqueadas
                });

                if (novasDesbloqueadas.length > 0) {
                    await sendSuccessEmail(base44, { ...transaction, startups_desbloqueadas: todasDesbloqueadas }, novasDesbloqueadas);
                }
            }
        } else {
            // Para status não-aprovado, apenas atualiza o status
            const newStatus = payment.status === 'in_process' ? 'processando' :
                payment.status === 'rejected' ? 'cancelado' : 'pendente';

            await base44.asServiceRole.entities.Transacao.update(transaction.id, {
                mp_payment_id: payment.id.toString(),
                mp_payment_status: payment.status,
                status_pagamento: newStatus
            });
        }

        return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('Erro no webhook:', error.message);
        return new Response('Internal server error', { status: 500, headers: corsHeaders });
    }
});