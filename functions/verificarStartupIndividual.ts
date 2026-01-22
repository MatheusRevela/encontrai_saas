import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { startupId } = await req.json();
    
    if (!startupId) {
      return new Response(JSON.stringify({ error: 'startupId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const startup = await base44.asServiceRole.entities.Startup.get(startupId);
    
    if (!startup) {
      return new Response(JSON.stringify({ error: 'Startup não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const observacoes = [];
    const verificacao = {
      site_online: false,
      tempo_resposta: null,
      ssl_valido: false,
      email_valido: !!startup.email,
      observacoes: '' // String vazia por padrão
    };

    // Verifica site
    if (startup.site) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout reduzido para 5s
        
        const response = await fetch(startup.site, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        verificacao.tempo_resposta = Date.now() - startTime;
        verificacao.site_online = response.ok;
        verificacao.ssl_valido = startup.site.startsWith('https://');
        
        if (response.ok) {
          observacoes.push(`Site respondeu em ${verificacao.tempo_resposta}ms`);
        } else {
          observacoes.push(`Site retornou status ${response.status}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          observacoes.push('Site não respondeu em 5 segundos (timeout)');
        } else {
          observacoes.push(`Erro ao acessar site: ${error.message}`);
        }
        verificacao.site_online = false;
      }
    } else {
      observacoes.push('Site não cadastrado');
    }

    // Converte array de observações para string
    verificacao.observacoes = observacoes.join('; ');

    // Atualiza a startup
    const updateData = {
      ultima_verificacao: new Date().toISOString(),
      status_verificacao: verificacao
    };

    // Se site está offline, desativa a startup
    if (!verificacao.site_online && startup.site) {
      updateData.ativo = false;
    }

    await base44.asServiceRole.entities.Startup.update(startupId, updateData);

    return new Response(JSON.stringify({ 
      success: true,
      resultado: {
        verificacao,
        desativada: !verificacao.site_online && startup.site,
        erro: !verificacao.site_online ? verificacao.observacoes : null
      },
      startup: {
        id: startup.id,
        nome: startup.nome
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na verificação:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao verificar startup',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});