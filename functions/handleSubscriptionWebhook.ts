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
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    const body = await req.json();
    
    console.log('Webhook de assinatura recebido:', body);

    if (body.type !== 'subscription_preapproval') {
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    const preapprovalId = body.data?.id;
    if (!preapprovalId) {
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Busca detalhes da assinatura no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });

    if (!mpResponse.ok) {
      console.error('Erro ao buscar assinatura no MP');
      return new Response('error', { status: 500, headers: corsHeaders });
    }

    const subscription = await mpResponse.json();
    const userId = subscription.external_reference;

    const base44 = createClientFromRequest(req);

    // Atualiza status do usuário baseado no status da assinatura
    const updateData = {
      mp_preapproval_id: preapprovalId,
      mp_subscription_status: subscription.status
    };

    if (subscription.status === 'authorized') {
      updateData.subscription_plan = 'starter';
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      updateData.subscription_renews_on = nextBilling.toISOString().split('T')[0];
    } else if (subscription.status === 'cancelled' || subscription.status === 'paused') {
      updateData.subscription_plan = 'free';
    }

    // Busca o usuário pelo ID
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users && users.length > 0) {
      await base44.asServiceRole.entities.User.update(userId, updateData);
    }

    return new Response('ok', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Erro no webhook de assinatura:', error);
    return new Response('error', { status: 500, headers: corsHeaders });
  }
});