import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const { dor_relatada } = await req.json();

        if (!dor_relatada) {
            return new Response(JSON.stringify({ error: 'O campo "dor_relatada" é obrigatório.' }), { status: 400, headers: corsHeaders });
        }

        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: corsHeaders });
        }

        if (!user.subscription_plan || user.subscription_plan === 'free' || user.available_credits <= 0) {
            return new Response(JSON.stringify({ error: 'Você não tem créditos de busca suficientes.' }), { status: 403, headers: corsHeaders });
        }

        // Debita o crédito ANTES de processar
        await base44.entities.User.update(user.id, { available_credits: user.available_credits - 1 });

        const allStartups = await base44.asServiceRole.entities.Startup.list();
        const startupsParaAnalise = allStartups.map(({ id, nome, descricao, tags }) => ({ id, nome, descricao, tags }));

        const prompt = `
            Você é um analista de negócios sênior e especialista em conectar empresas a soluções de tecnologia.
            Analise a "dor do cliente" e compare-a com a "lista de startups" fornecida.

            Dor do Cliente: "${dor_relatada}"

            Lista de Startups para Análise:
            ${JSON.stringify(startupsParaAnalise)}

            Sua tarefa é retornar APENAS as startups que têm uma compatibilidade (matching) de 50% ou mais com a dor do cliente.
            Para cada startup compatível, forneça:
            1. 'startup_id': O ID da startup.
            2. 'match_percentage': Um número de 50 a 100.
            3. 'resumo_personalizado': Uma frase curta e impactante explicando POR QUE essa startup resolve a dor do cliente.

            Retorne o resultado como um array JSON. Se nenhuma startup atingir 50% de match, retorne um array vazio.
        `;

        const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        startup_id: { type: "string" },
                        match_percentage: { type: "number" },
                        resumo_personalizado: { type: "string" }
                    },
                    required: ["startup_id", "match_percentage", "resumo_personalizado"]
                }
            }
        });

        const startupsEncontradas = llmResponse.map(item => {
            const startupOriginal = allStartups.find(s => s.id === item.startup_id);
            return {
                ...item,
                nome: startupOriginal?.nome || 'Nome não encontrado',
                logo_url: startupOriginal?.logo_url || '',
                descricao: startupOriginal?.descricao || 'Descrição não disponível'
            };
        });

        const novaBusca = await base44.entities.BuscaEnterprise.create({
            dor_relatada: dor_relatada,
            startups_encontradas: startupsEncontradas
        });

        return new Response(JSON.stringify({ buscaId: novaBusca.id }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("Erro na busca enterprise:", error);
        return new Response(JSON.stringify({ error: 'Ocorreu um erro interno ao processar sua busca.', details: error.message }), { status: 500, headers: corsHeaders });
    }
});