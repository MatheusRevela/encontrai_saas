import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') throw new Error('Acesso negado');

    // Buscar startups criadas recentemente (últimas 2 horas) que são inativas e de origem CSV
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const startupsToDelete = await base44.asServiceRole.entities.Startup.filter({
      ativo: false,
      origem_criacao: 'csv_import',
      created_date: { $gte: twoHoursAgo.toISOString() }
    });

    console.log(`🧹 Encontradas ${startupsToDelete.length} startups para excluir`);
    
    let deletedCount = 0;
    const errors = [];

    for (const startup of startupsToDelete) {
      try {
        await base44.asServiceRole.entities.Startup.delete(startup.id);
        deletedCount++;
        console.log(`✅ Excluída: ${startup.nome}`);
      } catch (error) {
        console.error(`❌ Erro ao excluir ${startup.nome}:`, error);
        errors.push(`${startup.nome}: ${error.message}`);
      }
    }

    const message = `🧹 Limpeza concluída!\n\n- ${deletedCount} startups excluídas\n- ${errors.length} erros${errors.length > 0 ? `\n\nErros:\n${errors.slice(0, 5).join('\n')}` : ''}`;

    return new Response(JSON.stringify({ 
      message,
      deletedCount,
      errors: errors.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na limpeza:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});