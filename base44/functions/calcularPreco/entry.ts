import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ============================================================
// FONTE ÚNICA DE VERDADE PARA PREÇOS DO ENCONTRAI
// Importado por: createPaymentLink, pagarStartupsSimilares
// ============================================================
export const PRECO_UNITARIO = 5.00;
export const DESCONTO_CINCO_SOLUCOES = 3.00;

/**
 * Calcula o valor total de uma compra.
 * @param {number} quantidade - Quantidade de startups
 * @param {boolean} isNovoUsuario - Se é a primeira compra do usuário (ganha 1 grátis)
 * @param {boolean} isAdicional - Se é um checkout adicional (similares)
 * @returns {number} Valor total em BRL com 2 casas decimais
 */
export const calcularValor = (quantidade, isNovoUsuario, isAdicional) => {
    if (quantidade <= 0) return 0;
    let valor = (!isAdicional && isNovoUsuario)
        ? Math.max(0, (quantidade - 1) * PRECO_UNITARIO)
        : quantidade * PRECO_UNITARIO;
    if (!isAdicional && quantidade === 5) {
        valor = Math.max(0, valor - DESCONTO_CINCO_SOLUCOES);
    }
    return parseFloat(valor.toFixed(2));
};

// Endpoint utilitário para o frontend consultar preços sem expor lógica sensível
Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://encontrai.com',
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
            return Response.json({ error: 'Não autenticado' }, { status: 401, headers: corsHeaders });
        }

        const { quantidade, isAdicional, transacao_id } = await req.json();
        if (!quantidade || quantidade < 1 || quantidade > 5) {
            return Response.json({ error: 'Quantidade inválida (1-5)' }, { status: 400, headers: corsHeaders });
        }

        // ✅ ANTI RACE-CONDITION: is_first_purchase é persistido na transação uma única vez.
        // Se já foi gravado, usamos o valor persistido — nunca recalculamos após a primeira gravação.
        let isNovoUsuario;
        if (transacao_id) {
            const transacao = await base44.asServiceRole.entities.Transacao.get(transacao_id);
            if (transacao && transacao.is_first_purchase !== undefined && transacao.is_first_purchase !== null) {
                // Já persistido — usar valor imutável
                isNovoUsuario = transacao.is_first_purchase;
            } else {
                // Calcular e persistir atomicamente (primeira vez)
                const comprasAnteriores = await base44.asServiceRole.entities.Transacao.filter({
                    created_by: user.email, status_pagamento: 'pago'
                });
                isNovoUsuario = comprasAnteriores.length === 0;
                if (transacao) {
                    await base44.asServiceRole.entities.Transacao.update(transacao_id, {
                        is_first_purchase: isNovoUsuario
                    });
                }
            }
        } else {
            const comprasAnteriores = await base44.asServiceRole.entities.Transacao.filter({
                created_by: user.email, status_pagamento: 'pago'
            });
            isNovoUsuario = comprasAnteriores.length === 0;
        }

        const valorTotal = calcularValor(quantidade, isNovoUsuario, isAdicional || false);

        return Response.json({
            preco_unitario: PRECO_UNITARIO,
            desconto_cinco: DESCONTO_CINCO_SOLUCOES,
            quantidade,
            is_novo_usuario: isNovoUsuario,
            valor_total: valorTotal
        }, { headers: corsHeaders });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});