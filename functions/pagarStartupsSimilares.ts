import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transacao_id, startup_original_id, similares_selecionadas } = await req.json();

    if (!transacao_id || !startup_original_id || !similares_selecionadas || similares_selecionadas.length === 0) {
      return Response.json({ error: 'Parâmetros obrigatórios faltando' }, { status: 400 });
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      return Response.json({ error: 'Mercado Pago não configurado' }, { status: 500 });
    }

    // Buscar transação
    const transacao = await base44.asServiceRole.entities.Transacao.get(transacao_id);
    
    const quantidadeSelecionada = similares_selecionadas.length;
    const valorTotal = quantidadeSelecionada * 4.00;

    // Criar preferência de pagamento no Mercado Pago
    const preference = {
      items: [
        {
          title: `${quantidadeSelecionada} Startup${quantidadeSelecionada > 1 ? 's' : ''} Similar${quantidadeSelecionada > 1 ? 'es' : ''} - ${transacao.id.substring(0, 8)}`,
          quantity: quantidadeSelecionada,
          unit_price: 4.00,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: user.email,
        name: user.full_name
      },
      back_urls: {
        success: `${req.headers.get('origin')}/StatusPagamento?sessionId=${transacao.session_id}&tipo=similares&startup_id=${startup_original_id}`,
        failure: `${req.headers.get('origin')}/StatusPagamento?sessionId=${transacao.session_id}&tipo=similares&status=failure`,
        pending: `${req.headers.get('origin')}/StatusPagamento?sessionId=${transacao.session_id}&tipo=similares&status=pending`
      },
      auto_return: 'approved',
      notification_url: `${req.headers.get('origin')}/api/handleMercadoPagoWebhook`,
      metadata: {
        transacao_id: transacao.id,
        startup_original_id: startup_original_id,
        similares_selecionadas: JSON.stringify(similares_selecionadas),
        tipo: 'similares',
        user_email: user.email
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

    // Salvar preferência na transação
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
    console.error('Erro ao processar pagamento de similares:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});