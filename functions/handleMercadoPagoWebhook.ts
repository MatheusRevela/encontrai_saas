import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sendSuccessEmail = async (transaction, unlockedStartups) => {
    if (!transaction.cliente_email || unlockedStartups.length === 0) return;

    try {
        const emailBody = `
Olá ${transaction.cliente_nome || 'Cliente'},

Ótima notícia! Seu pagamento foi confirmado e suas soluções foram desbloqueadas.

Aqui estão os contatos das ${unlockedStartups.length} startup${unlockedStartups.length > 1 ? 's' : ''} que você escolheu:

${unlockedStartups.map(startup => `
🏢 ${startup.nome} (${startup.categoria}${startup.vertical_atuacao ? ` - ${startup.vertical_atuacao}` : ''})
${startup.email ? `📧 Email: ${startup.email}` : ''}
${startup.whatsapp ? `📱 WhatsApp: ${startup.whatsapp}` : ''}
${startup.site ? `🌐 Site: ${startup.site}` : ''}
${startup.preco_base ? `💰 Investimento: ${startup.preco_base}` : ''}

Descrição: ${startup.descricao}
---
`).join('')}

Você também pode acessar essas informações a qualquer momento em:
https://app--encontr-ai-76824f7d.base44.app/DetalhesBusca?id=${transaction.id}

Obrigado por usar o EncontrAI!
        `;

        await base44.integrations.Core.SendEmail({
            to: transaction.cliente_email,
            subject: `🎉 Suas ${unlockedStartups.length} solução${unlockedStartups.length > 1 ? 'ões' : ''} foi${unlockedStartups.length > 1 ? 'ram' : ''} desbloqueada${unlockedStartups.length > 1 ? 's' : ''}!`,
            body: emailBody
        });
        
        console.log('✅ Email enviado para:', transaction.cliente_email);
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
    }
};

Deno.serve(async (req) => {
    console.log('🔔 Webhook recebido:', req.method, req.url);
    
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
        const body = await req.text();
        console.log('📦 Payload recebido:', body);
        
        const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
        if (!webhookSecret) {
            console.error('❌ MP_WEBHOOK_SECRET não configurado');
            return new Response('Webhook secret not configured', { status: 500, headers: corsHeaders });
        }

        // 🔒 SEGURANÇA: Validação de assinatura usando Web Crypto API (Deno nativo)
        const signature = req.headers.get('x-signature');
        const requestId = req.headers.get('x-request-id');
        
        if (signature && requestId) {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(webhookSecret);
            const message = encoder.encode(requestId + body);
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            
            const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, message);
            const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            const receivedSignature = signature.replace('sha256=', '');
            
            if (expectedSignature !== receivedSignature) {
                console.error('❌ Assinatura inválida');
                return new Response('Invalid signature', { status: 401, headers: corsHeaders });
            }
            console.log('✅ Assinatura validada com sucesso');
        }

        const data = JSON.parse(body);
        console.log('📋 Dados do webhook:', JSON.stringify(data, null, 2));
        
        // Processa apenas webhooks de pagamento
        if (data.type === 'payment') {
            const paymentId = data.data.id;
            console.log('💳 Processando pagamento:', paymentId);
            
            const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
            if (!accessToken) {
                console.error('❌ MP_ACCESS_TOKEN não configurado');
                return new Response('Access token not configured', { status: 500, headers: corsHeaders });
            }

            // Busca detalhes do pagamento
            const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!paymentResponse.ok) {
                console.error('❌ Erro ao buscar pagamento:', paymentResponse.status);
                return new Response('Failed to fetch payment details', { status: 400, headers: corsHeaders });
            }

            const payment = await paymentResponse.json();
            console.log('💰 Detalhes do pagamento:', JSON.stringify(payment, null, 2));
            
            // Identificar transação através de external_reference ou metadata
            let transactions = [];
            
            if (payment.external_reference) {
                transactions = await base44.entities.Transacao.filter({ id: payment.external_reference });
                console.log('🔍 Transações encontradas por external_reference:', transactions.length);
            } else if (payment.metadata?.transacao_id) {
                // Para pagamentos de similares, usar o metadata
                transactions = await base44.entities.Transacao.filter({ id: payment.metadata.transacao_id });
                console.log('🔍 Transações encontradas por metadata:', transactions.length);
            } else {
                console.error('❌ Não foi possível identificar a transação');
                return new Response('Transaction not found', { status: 400, headers: corsHeaders });
            }

            if (transactions.length > 0) {
                const transaction = transactions[0];
                console.log('📊 Transação atual:', JSON.stringify(transaction, null, 2));

                // 🔒 SEGURANÇA: Verificações de integridade
                // 1. Evitar processamento duplicado (idempotência)
                if (transaction.status_pagamento === 'pago') {
                    console.log('⚠️ Pagamento já processado - webhook duplicado ignorado');
                    return new Response('Payment already processed', { status: 200, headers: corsHeaders });
                }

                // 2. Validar que a preferência MP pertence a esta transação
                if (transaction.mp_preference_id && payment.preference_id && 
                    transaction.mp_preference_id !== payment.preference_id) {
                    console.error('❌ Preference ID não corresponde à transação');
                    return new Response('Invalid preference ID', { status: 400, headers: corsHeaders });
                }

                // 3. Verificar race conditions (múltiplos webhooks simultâneos)
                if (transaction.mp_payment_id && transaction.mp_payment_id !== payment.id.toString()) {
                    console.error('❌ Payment ID conflitante - possível race condition');
                    return new Response('Payment ID mismatch', { status: 409, headers: corsHeaders });
                }
                
                // Atualiza status do pagamento
                const newStatus = payment.status === 'approved' ? 'pago' : 
                                payment.status === 'in_process' ? 'processando' : 
                                payment.status === 'rejected' ? 'cancelado' : 'pendente';

                await base44.entities.Transacao.update(transaction.id, {
                    mp_payment_id: payment.id.toString(),
                    mp_payment_status: payment.status,
                    status_pagamento: newStatus
                });

                console.log(`🔄 Status atualizado para: ${newStatus}`);

                // Se aprovado, verifica tipo de pagamento
                if (payment.status === 'approved') {
                    const tipoTransacao = payment.metadata?.tipo;
                    
                    if (tipoTransacao === 'similares') {
                        // Pagamento de similares
                        console.log('🔍 Desbloqueando similares...');
                        const startupOriginalId = payment.metadata?.startup_original_id;
                        const similaresSelecionadas = JSON.parse(payment.metadata?.similares_selecionadas || '[]');
                        
                        if (startupOriginalId && similaresSelecionadas.length > 0) {
                            // Buscar dados completos das startups selecionadas
                            const startupsCompletas = await base44.entities.Startup.filter({
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

                            const similaresDesbloqueadas = transaction.similares_desbloqueadas || [];
                            
                            // Verificar se já existe entrada para esta startup original
                            const indexExistente = similaresDesbloqueadas.findIndex(
                                s => s.startup_original_id === startupOriginalId
                            );
                            
                            if (indexExistente >= 0) {
                                // Atualizar entrada existente
                                similaresDesbloqueadas[indexExistente] = {
                                    startup_original_id: startupOriginalId,
                                    startups_similares: similaresData,
                                    pago_em: new Date().toISOString()
                                };
                            } else {
                                // Adicionar nova entrada
                                similaresDesbloqueadas.push({
                                    startup_original_id: startupOriginalId,
                                    startups_similares: similaresData,
                                    pago_em: new Date().toISOString()
                                });
                            }

                            await base44.entities.Transacao.update(transaction.id, {
                                similares_desbloqueadas: similaresDesbloqueadas
                            });

                            console.log(`✅ ${similaresData.length} similares desbloqueadas com sucesso`);
                        }
                    } else if (transaction.startups_selecionadas?.length > 0) {
                        // Pagamento normal de startups
                        console.log('🚀 Desbloqueando startups...');
                        
                        const startups = await base44.entities.Startup.filter({
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

                        await base44.entities.Transacao.update(transaction.id, {
                            startups_desbloqueadas: unlockedStartups
                        });

                        console.log(`✅ ${unlockedStartups.length} startups desbloqueadas`);
                        
                        // Envia email de sucesso
                        await sendSuccessEmail(transaction, unlockedStartups);
                        console.log('📧 Email de sucesso enviado');
                    }
                }
            } else {
                console.error('❌ Transação não encontrada:', externalReference);
            }
        }

        console.log('✅ Webhook processado com sucesso');
        return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('💥 Erro no webhook:', error);
        return new Response('Internal server error', { status: 500, headers: corsHeaders });
    }
});