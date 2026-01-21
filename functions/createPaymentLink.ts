import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

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

    // 🔒 SEGURANÇA: Recalcular valor no backend - nunca confie no frontend
    const PRECO_UNITARIO = 5.00;
    const quantidadeSelecionada = transacao.startups_selecionadas?.length || 0;
    
    if (quantidadeSelecionada === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma startup selecionada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Primeira solução GRÁTIS, demais R$ 5,00 cada
    const valorTotal = Math.max(0, (quantidadeSelecionada - 1) * PRECO_UNITARIO);

    // Validar CPF do cliente (Mercado Pago exige CPF válido no Brasil)
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
      items: [
        {
          title: `Desbloqueio de ${quantidadeSelecionada} soluç${quantidadeSelecionada > 1 ? 'ões' : 'ão'} - EncontrAI`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(valorTotal.toFixed(2))
        }
      ],
      payer: {
        name: transacao.cliente_nome,
        email: transacao.cliente_email,
        identification: {
          type: 'CPF',
          number: cpfCliente
        }
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'atm' }
        ],
        installments: 1
      },
      back_urls: {
        success: `${req.headers.get('origin')}/Sucesso?sessionId=${sessionId}`,
        failure: `${req.headers.get('origin')}/Checkout?sessionId=${sessionId}&error=payment_failed`,
        pending: `${req.headers.get('origin')}/StatusPagamento?sessionId=${sessionId}`
      },
      auto_return: 'approved',
      external_reference: transacao.id,
      statement_descriptor: 'ENCONTRAI',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notification_url: `${req.headers.get('origin')}/functions/handleMercadoPagoWebhook`
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
      const error = await mpResponse.json();
      console.error('Erro do Mercado Pago:', error);
      return new Response(JSON.stringify({ 
        error: `Erro do Mercado Pago: ${error.message || 'Erro desconhecido'}`,
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mpData = await mpResponse.json();

    await base44.entities.Transacao.update(transacao.id, {
      mp_preference_id: mpData.id,
      mp_init_point: mpData.init_point,
      status_pagamento: 'processando',
      valor_total: valorTotal // Salvar valor recalculado
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
    console.error('[ERRO em createPaymentLink]:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno ao processar o pagamento',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});