import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        console.log("🧹 Iniciando verificação de duplicatas de startups...");
        const allStartups = await base44.asServiceRole.entities.Startup.list();

        const startupsBySite = new Map();
        allStartups.forEach(startup => {
            if (!startup.site || startup.site.trim() === '') return;
            // Normaliza a URL para comparação
            const siteKey = startup.site.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
            if (!startupsBySite.has(siteKey)) {
                startupsBySite.set(siteKey, []);
            }
            startupsBySite.get(siteKey).push(startup);
        });

        let duplicatasEncontradas = 0;
        let desativadas = 0;
        const falhas = [];

        for (const [site, startups] of startupsBySite.entries()) {
            if (startups.length > 1) {
                duplicatasEncontradas += (startups.length - 1);
                
                startups.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
                const original = startups.shift();
                console.log(`Site duplicado: ${site}. Original: ${original.nome} (ID: ${original.id})`);

                for (const duplicata of startups) {
                    try {
                        if (duplicata.ativo) {
                            await base44.asServiceRole.entities.Startup.update(duplicata.id, { ativo: false });
                            desativadas++;
                            console.log(`  -> Desativada: ${duplicata.nome} (ID: ${duplicata.id})`);
                        }
                    } catch(error) {
                        console.error(`Falha ao desativar duplicata ${duplicata.id}:`, error);
                        falhas.push({ nome: duplicata.nome, id: duplicata.id, erro: error.message });
                    }
                }
            }
        }
        
        console.log(`Limpeza concluída. ${desativadas} duplicatas desativadas.`);

        return new Response(JSON.stringify({
            totalProcessado: allStartups.length,
            duplicatasEncontradas,
            desativadas,
            falhas
        }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('💥 Erro geral na verificação de duplicatas:', error);
        return new Response(JSON.stringify({ error: 'Erro interno no servidor', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});