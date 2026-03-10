import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ⚠️ Preço de similares — específico para este fluxo (valor diferente de calcularPreco.ts)
const PRECO_SIMILAR = 4.00;
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://encontrai.com';
const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { transacaoId, startupOriginalId, similaresSelecionadas, email, cpf, paymentFormData } = await req.json();

        if (!transacaoId || !startupOriginalId || !similaresSelecionadas?.length || !email || !cpf || !paymentFormData) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const transacao = await base44.asServiceRole.entities.Transacao.get(transacaoId);
        if (!transacao) return new Response(JSON.stringify({ error: 'Transação não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        if (transacao.created_by && transacao.created_by !== user.email) {
            return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Verificar se estas similares já foram desbloqueadas (idempotência)
        const jaDesbloqueadas = transacao.similares_desbloqueadas?.find(s => s.startup_original_id === startupOriginalId);
        if (jaDesbloqueadas) {
            return new Response(JSON.stringify({ success: false, error: 'Estas similares já foram desbloqueadas.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const valorTotal = parseFloat((similaresSelecionadas.length * PRECO_SIMILAR).toFixed(2));
        const cpfLimpo = cpf.replace(/\D/g, '');
        const nomeCliente = user?.full_name || email.split('@')[0];

        const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
        if (!accessToken) return new Response(JSON.stringify({ error: 'Configuração incompleta' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const paymentPayload = {
            ...paymentFormData,
            transaction_amount: valorTotal,
            description: `${similaresSelecionadas.length} startup${similaresSelecionadas.length > 1 ? 's' : ''} similar${similaresSelecionadas.length > 1 ? 'es' : ''} - EncontrAI`,
            external_reference: transacaoId,
            notification_url: `${ALLOWED_ORIGIN}/functions/handleMercadoPagoWebhook`,
            metadata: {
                transacao_id: transacaoId,
                startup_original_id: startupOriginalId,
                similares_selecionadas: JSON.stringify(similaresSelecionadas),
                tipo: 'similares'
            },
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
                'X-Idempotency-Key': `similares-${transacaoId}-${startupOriginalId}-${Date.now()}`
            },
            body: JSON.stringify(paymentPayload)
        });

        const payment = await mpResponse.json();

        if (!mpResponse.ok) {
            const errMsg = payment.message || payment.cause?.[0]?.description || 'Erro ao processar pagamento';
            return new Response(JSON.stringify({ success: false, error: errMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (payment.status === 'approved') {
            // Buscar dados completos das similares
            const startups = await base44.asServiceRole.entities.Startup.filter({ id: { $in: similaresSelecionadas } });
            const similaresData = startups.map(s => ({
                startup_id: s.id, nome: s.nome, descricao: s.descricao,
                categoria: s.categoria, vertical_atuacao: s.vertical_atuacao,
                modelo_negocio: s.modelo_negocio, site: s.site, email: s.email,
                whatsapp: s.whatsapp, linkedin: s.linkedin, preco_base: s.preco_base,
                logo_url: s.logo_url, avaliacao_qualitativa: s.avaliacao_qualitativa
            }));

            // APPEND to similares_desbloqueadas
            const similaresDesbloqueadas = [...(transacao.similares_desbloqueadas || [])];
            const existingIdx = similaresDesbloqueadas.findIndex(s => s.startup_original_id === startupOriginalId);
            const novoRegistro = { startup_original_id: startupOriginalId, startups_similares: similaresData, pago_em: new Date().toISOString() };
            if (existingIdx >= 0) similaresDesbloqueadas[existingIdx] = novoRegistro;
            else similaresDesbloqueadas.push(novoRegistro);

            await base44.asServiceRole.entities.Transacao.update(transacaoId, {
                similares_desbloqueadas: similaresDesbloqueadas
            });

            // Send email
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: email.trim(),
                    subject: `✅ Startups similares desbloqueadas!`,
                    body: `Olá ${nomeCliente},\n\nSuas startups similares foram desbloqueadas!\n\n${similaresData.map(s => `🏢 ${s.nome}\n${s.email ? `📧 ${s.email}` : ''}\n${s.whatsapp ? `📱 ${s.whatsapp}` : ''}\n${s.site ? `🌐 ${s.site}` : ''}\n---`).join('\n')}\n\nAcesse: ${ALLOWED_ORIGIN}/DetalhesBusca?id=${transacaoId}`
                });
            } catch (e) {
                console.error('Erro ao enviar email:', e.message);
            }
        }

        const result = { success: true, status: payment.status, paymentId: payment.id };
        if (payment.status === 'pending' && payment.point_of_interaction?.transaction_data) {
            result.pixQrCode = payment.point_of_interaction.transaction_data.qr_code;
            result.pixQrCodeBase64 = payment.point_of_interaction.transaction_data.qr_code_base64;
        }

        return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Erro em processTransparentPaymentSimilares:', error.message);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});