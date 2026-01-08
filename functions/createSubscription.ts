import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const { planType } = await req.json();
    
    if (planType !== 'starter') {
      return new Response(JSON.stringify({ error: 'Plano inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: 'Configuração de pagamento não encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cria preferência de assinatura no Mercado Pago
    const preference = {
      reason: 'EncontrAI - Plano Básico',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 49.90,
        currency_id: 'BRL'
      },
      back_url: `${req.headers.get('origin')}/Painel?subscription=success`,
      payer_email: user.email,
      external_reference: user.id
    };

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
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
        error: 'Erro ao criar assinatura',
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mpData = await mpResponse.json();

    // Atualiza usuário com ID da assinatura
    await base44.auth.updateMe({
      mp_preapproval_id: mpData.id,
      subscription_plan: 'starter'
    });

    return new Response(JSON.stringify({ 
      success: true, 
      checkoutUrl: mpData.init_point,
      preapprovalId: mpData.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});