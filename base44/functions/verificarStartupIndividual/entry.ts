import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simula navegador real para evitar bloqueios de bot
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

async function checkUrl(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    // 200-499: site está no ar (mesmo 404 = domínio ativo)
    // 500+: erro do servidor
    const online = response.status < 500;
    return { online, status: response.status, elapsed, error: null };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return { online: false, status: null, elapsed: null, error: isTimeout ? 'timeout' : err.message };
  }
}

async function verificarSite(url) {
  // Tenta 2 vezes antes de declarar offline
  const primeira = await checkUrl(url, 15000);
  if (primeira.online) return { ...primeira, tentativas: 1 };

  // Aguarda 3s e tenta novamente
  await new Promise(r => setTimeout(r, 3000));
  const segunda = await checkUrl(url, 20000);
  return { ...segunda, tentativas: 2 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403, headers: corsHeaders });
    }

    const { startupId } = await req.json();
    if (!startupId) {
      return Response.json({ error: 'startupId é obrigatório' }, { status: 400, headers: corsHeaders });
    }

    const startup = await base44.asServiceRole.entities.Startup.get(startupId);
    if (!startup) {
      return Response.json({ error: 'Startup não encontrada' }, { status: 404, headers: corsHeaders });
    }

    const result = { site_online: false, tempo_resposta: null, ssl_valido: false, email_valido: !!startup.email, observacoes: '' };
    let desativada = false;
    const obs = [];

    if (startup.site) {
      const check = await verificarSite(startup.site);
      result.site_online = check.online;
      result.tempo_resposta = check.elapsed;
      result.ssl_valido = startup.site.startsWith('https://');

      if (check.online) {
        obs.push(`Site online (HTTP ${check.status}) em ${check.elapsed}ms`);
      } else {
        const motivo = check.error === 'timeout'
          ? `Timeout após ${check.tentativas} tentativa(s)`
          : `HTTP ${check.status ?? 'erro'}: ${check.error ?? 'sem resposta'} após ${check.tentativas} tentativa(s)`;
        obs.push(motivo);
      }
    } else {
      obs.push('Site não cadastrado');
    }

    result.observacoes = obs.join('; ');

    // Calcula falhas consecutivas
    const falhasAnteriores = startup.status_verificacao?.falhas_consecutivas ?? 0;
    const novasFalhas = result.site_online ? 0 : falhasAnteriores + 1;

    // Só desativa após 2 falhas consecutivas (evita falsos positivos por instabilidade temporária)
    // E nunca desativa se tiver verificação manual aprovada
    const protegidaManualmente = startup.verificacao_manual?.status_aprovado === true;
    if (!result.site_online && novasFalhas >= 2 && !protegidaManualmente) {
      desativada = true;
    }

    const updateData = {
      ultima_verificacao: new Date().toISOString(),
      status_verificacao: { ...result, falhas_consecutivas: novasFalhas },
    };

    if (desativada) updateData.ativo = false;
    // Se voltou a ficar online e estava inativo por verificação automática, reativa
    if (result.site_online && startup.ativo === false && !protegidaManualmente) {
      updateData.ativo = true;
    }

    await base44.asServiceRole.entities.Startup.update(startupId, updateData);

    return Response.json({
      success: true,
      startup: { id: startup.id, nome: startup.nome },
      resultado: { ...result, falhas_consecutivas: novasFalhas, desativada },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Erro na verificação:', error);
    return Response.json({ error: 'Erro ao verificar startup', details: error.message }, { status: 500, headers: corsHeaders });
  }
});