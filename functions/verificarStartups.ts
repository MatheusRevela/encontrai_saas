import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function checkWebsite(url) {
  if (!url || !url.startsWith('http')) {
    return { online: false, tempo_resposta: null, erro: 'URL inválida ou ausente' };
  }
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow', 
      signal: AbortSignal.timeout(10000) 
    });
    const tempo_resposta = Date.now() - startTime;
    
    return { 
      online: response.ok, 
      tempo_resposta, 
      ssl_valido: url.startsWith('https://'),
      erro: response.ok ? null : `Status ${response.status}` 
    };
  } catch (error) {
    return { online: false, tempo_resposta: null, ssl_valido: false, erro: error.message.slice(0, 100) };
  }
}

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
    
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { startupId, verificarTodas } = await req.json();

    // 🎯 MODO 1: Verificar UMA startup específica
    if (startupId) {
      const startup = await base44.asServiceRole.entities.Startup.get(startupId);
      if (!startup) {
        return new Response(JSON.stringify({ error: 'Startup não encontrada' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { online, tempo_resposta, ssl_valido, erro } = await checkWebsite(startup.site);
      const observacoes = [];
      
      if (online) {
        observacoes.push(`Site respondeu em ${tempo_resposta}ms`);
      } else {
        observacoes.push(erro);
      }

      const verificacao = {
        site_online: online,
        tempo_resposta,
        ssl_valido,
        email_valido: !!startup.email,
        observacoes: observacoes.join('; ')
      };

      const updateData = {
        ultima_verificacao: new Date().toISOString(),
        status_verificacao: verificacao
      };

      if (!online && startup.site) {
        updateData.ativo = false;
      }

      await base44.asServiceRole.entities.Startup.update(startupId, updateData);

      return new Response(JSON.stringify({ 
        success: true,
        resultado: {
          verificacao,
          desativada: !online && startup.site,
        },
        startup: {
          id: startup.id,
          nome: startup.nome
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🎯 MODO 2: Verificar TODAS as startups
    if (verificarTodas) {
      const startups = await base44.asServiceRole.entities.Startup.list();
      if (!startups || startups.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhuma startup encontrada.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      let totalProcessado = 0;
      let verificadasComSucesso = 0;
      let comProblemasDeSite = 0;
      let falhasDeUpdate = 0;
      const problemas = [];
      const falhas = [];

      for (const startup of startups) {
        totalProcessado++;
        
        const { online, tempo_resposta, ssl_valido, erro } = await checkWebsite(startup.site);
        
        const statusVerificacao = {
          site_online: online,
          tempo_resposta,
          ssl_valido,
          email_valido: !!startup.email,
          observacoes: erro || `Verificado em ${tempo_resposta}ms`
        };

        try {
          await base44.asServiceRole.entities.Startup.update(startup.id, {
            ultima_verificacao: new Date().toISOString(),
            status_verificacao: statusVerificacao,
            ativo: startup.ativo ? online : false,
          });
          
          verificadasComSucesso++;
          if (!online) {
            comProblemasDeSite++;
            problemas.push({ nome: startup.nome, erro });
          }

        } catch (updateError) {
          falhasDeUpdate++;
          falhas.push({ nome: startup.nome, erro: updateError.message });
        }
        
        await delay(200);
      }

      const relatorio = {
        message: `Verificação concluída! ${totalProcessado} startups processadas. ${comProblemasDeSite} foram desativadas por problemas no site.`,
        totalProcessado,
        verificadasComSucesso,
        comProblemasDeSite,
        falhasDeUpdate,
        problemas,
        falhas,
      };
      
      return new Response(JSON.stringify(relatorio), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na verificação:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno no servidor.', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});