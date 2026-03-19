import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://encontrai.com',
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

    const { nomeStartup } = await req.json();

    if (!nomeStartup || nomeStartup.trim() === '') {
      return new Response(JSON.stringify({ error: 'Nome da startup é obrigatório' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🔍 Buscando site para: ${nomeStartup}`);

    const prompt = `Você é um especialista em buscar informações de startups brasileiras.

TAREFA: Encontre o site oficial da startup "${nomeStartup}".

INSTRUÇÕES CRÍTICAS:
1. Use busca no Google para encontrar o site oficial
2. Verifique se o domínio encontrado realmente pertence à startup correta
3. Retorne APENAS a URL do site no formato: {"site": "https://..."}
4. Se NÃO encontrar um site confiável, retorne: {"site": null}

IMPORTANTE: 
- NÃO invente URLs
- NÃO retorne sites de terceiros (LinkedIn, Crunchbase, etc)
- APENAS o site oficial da própria startup

Retorne um JSON válido.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          site: {
            type: ["string", "null"],
            description: "URL do site oficial ou null se não encontrado"
          }
        },
        required: ["site"]
      }
    });

    console.log(`✅ Resultado: ${response.site || 'não encontrado'}`);

    return new Response(JSON.stringify({ 
      success: true,
      site: response.site 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Erro na busca:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao buscar site',
      details: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});