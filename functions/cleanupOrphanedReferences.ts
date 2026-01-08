import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    // Buscar todas as transações que têm startups sugeridas
    const transacoes = await base44.entities.Transacao.filter({
      startups_sugeridas: { $exists: true, $ne: [] }
    });

    let transacoesLimpas = 0;
    let referenciasRemovidas = 0;

    for (const transacao of transacoes) {
      if (!transacao.startups_sugeridas || transacao.startups_sugeridas.length === 0) {
        continue;
      }

      const sugestoesValidas = [];
      
      for (const sugestao of transacao.startups_sugeridas) {
        try {
          const startup = await base44.entities.Startup.get(sugestao.startup_id);
          if (startup && startup.ativo) {
            sugestoesValidas.push(sugestao);
          } else {
            referenciasRemovidas++;
            console.log(`Removendo referência inválida: ${sugestao.startup_id}`);
          }
        } catch (error) {
          referenciasRemovidas++;
          console.log(`Removendo referência com erro: ${sugestao.startup_id}`);
        }
      }

      // Atualizar transação se houve mudanças
      if (sugestoesValidas.length !== transacao.startups_sugeridas.length) {
        await base44.entities.Transacao.update(transacao.id, {
          startups_sugeridas: sugestoesValidas
        });
        transacoesLimpas++;
      }
    }

    return new Response(JSON.stringify({
      message: 'Limpeza de referências órfãs concluída',
      transacoesLimpas,
      referenciasRemovidas
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na limpeza de referências órfãs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});