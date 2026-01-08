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
    
    if (!user || !user.mp_preapproval_id) {
      return new Response(JSON.stringify({ error: 'Assinatura não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');

    // Cancela assinatura no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${user.mp_preapproval_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (!mpResponse.ok) {
      const error = await mpResponse.json();
      return new Response(JSON.stringify({ error: 'Erro ao cancelar assinatura' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Atualiza usuário
    await base44.auth.updateMe({
      subscription_plan: 'free',
      mp_subscription_status: 'cancelled'
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});