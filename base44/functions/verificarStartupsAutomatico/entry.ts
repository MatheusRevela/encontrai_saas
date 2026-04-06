/**
 * Função agendada: verifica automaticamente o status de todas as startups ativas.
 * Deve ser executada diariamente via automation (scheduled).
 * 
 * Lógica anti-falso-positivo:
 * - Usa GET com headers de navegador real
 * - Timeout de 15s + retry (2 tentativas)
 * - Só desativa após 2 falhas consecutivas
 * - Nunca desativa startups com verificação manual aprovada
 * - Reativa automaticamente startups que voltaram ao ar
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

async function checkUrl(url, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const t0 = Date.now();
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: BROWSER_HEADERS });
    clearTimeout(id);
    return { online: res.status < 500, status: res.status, elapsed: Date.now() - t0, error: null };
  } catch (e) {
    clearTimeout(id);
    return { online: false, status: null, elapsed: null, error: e.name === 'AbortError' ? 'timeout' : e.message };
  }
}

async function verificarSite(url) {
  const r1 = await checkUrl(url, 15000);
  if (r1.online) return { ...r1, tentativas: 1 };
  await new Promise(r => setTimeout(r, 3000));
  const r2 = await checkUrl(url, 20000);
  return { ...r2, tentativas: 2 };
}

// Pausa para não sobrecarregar (rate limiting)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const BATCH_SIZE = 100; // 100 por dia

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Para chamadas agendadas (sem user), usa service role direto
    // Para chamadas manuais de admin, valida auth
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
      }
    } catch {
      // Chamada agendada sem token de usuário — ok
      isScheduled = true;
    }

    console.log(`🔍 Iniciando verificação automática de startups... (agendada: ${isScheduled})`);

    // Busca startups com site, ordenadas pelas verificadas há mais tempo (oldest-first)
    const todasStartups = await base44.asServiceRole.entities.Startup.list();
    const comSite = todasStartups
      .filter(s => s.site && s.site.trim() !== '')
      .sort((a, b) => {
        const ta = a.ultima_verificacao ? new Date(a.ultima_verificacao).getTime() : 0;
        const tb = b.ultima_verificacao ? new Date(b.ultima_verificacao).getTime() : 0;
        return ta - tb; // mais antigas primeiro
      })
      .slice(0, BATCH_SIZE);

    console.log(`📊 Total com site (no banco): ${todasStartups.filter(s => s.site).length} | Processando este lote: ${comSite.length}`);

    const resultados = {
      total: comSite.length,
      online: 0,
      offline: 0,
      desativadas: 0,
      reativadas: 0,
      erros: [],
      timestamp: new Date().toISOString(),
    };

    for (let i = 0; i < comSite.length; i++) {
      const startup = comSite[i];

      try {
        const check = await verificarSite(startup.site);
        const falhasAnteriores = startup.status_verificacao?.falhas_consecutivas ?? 0;
        const novasFalhas = check.online ? 0 : falhasAnteriores + 1;
        const protegida = startup.verificacao_manual?.status_aprovado === true;

        const obs = check.online
          ? `Online (HTTP ${check.status}) em ${check.elapsed}ms`
          : (check.error === 'timeout'
              ? `Timeout após ${check.tentativas} tentativa(s)`
              : `HTTP ${check.status ?? 'erro'}: ${check.error} após ${check.tentativas} tentativa(s)`);

        const updateData = {
          ultima_verificacao: new Date().toISOString(),
          status_verificacao: {
            site_online: check.online,
            tempo_resposta: check.elapsed,
            ssl_valido: startup.site.startsWith('https://'),
            email_valido: !!startup.email,
            observacoes: obs,
            falhas_consecutivas: novasFalhas,
          },
        };

        let desativada = false;
        let reativada = false;

        if (!check.online && novasFalhas >= 2 && !protegida && startup.ativo !== false) {
          updateData.ativo = false;
          desativada = true;
          resultados.desativadas++;
          resultados.erros.push({ id: startup.id, nome: startup.nome, site: startup.site, motivo: obs, falhas: novasFalhas });
          console.warn(`❌ Desativada: ${startup.nome} (${startup.site}) — ${obs}`);
        }

        if (check.online && startup.ativo === false && !protegida) {
          updateData.ativo = true;
          reativada = true;
          resultados.reativadas++;
          console.log(`✅ Reativada: ${startup.nome} (${startup.site})`);
        }

        if (check.online) resultados.online++;
        else resultados.offline++;

        await base44.asServiceRole.entities.Startup.update(startup.id, updateData);

        // Log de progresso a cada 10
        if ((i + 1) % 10 === 0) {
          console.log(`⏳ Progresso: ${i + 1}/${comSite.length}`);
        }

        // Pausa de 500ms entre cada verificação para não sobrecarregar
        if (i < comSite.length - 1) await sleep(500);

      } catch (err) {
        console.error(`Erro ao verificar ${startup.nome}:`, err.message);
        resultados.erros.push({ id: startup.id, nome: startup.nome, site: startup.site, motivo: `Erro interno: ${err.message}` });
      }
    }

    console.log(`✅ Verificação concluída:`, {
      total: resultados.total,
      online: resultados.online,
      offline: resultados.offline,
      desativadas: resultados.desativadas,
      reativadas: resultados.reativadas,
    });

    return Response.json({ success: true, resultados });

  } catch (error) {
    console.error('Erro na verificação automática:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});