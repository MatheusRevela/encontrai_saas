import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem executar esta ação.' }), { status: 403, headers: corsHeaders });
    }

    console.log(`[DELETE INACTIVE] Ação iniciada por: ${user.email}`);

    // Buscar todas as startups inativas
    const inactiveStartups = await base44.asServiceRole.entities.Startup.filter({ ativo: false });

    if (inactiveStartups.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma startup inativa encontrada para excluir.' }), { status: 200, headers: corsHeaders });
    }

    console.log(`[DELETE INACTIVE] ${inactiveStartups.length} startups inativas encontradas.`);
    
    let deletedCount = 0;
    const errors = [];

    for (const startup of inactiveStartups) {
      try {
        await base44.asServiceRole.entities.Startup.delete(startup.id);
        deletedCount++;
      } catch (error) {
        console.error(`[DELETE INACTIVE] Erro ao excluir ${startup.nome} (ID: ${startup.id}):`, error);
        errors.push(`${startup.nome}: ${error.message}`);
      }
    }

    const message = `🗑️ Limpeza concluída!\n\n- ${deletedCount} startups inativas foram excluídas permanentemente.\n- ${errors.length} erros ocorreram durante o processo.`;

    return new Response(JSON.stringify({ 
      message,
      deletedCount,
      errors
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[DELETE INACTIVE] Erro fatal:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});