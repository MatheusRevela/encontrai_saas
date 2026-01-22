import { base44 } from '@/api/base44Client';
import { LIMITS } from '../utils/constants';

class ApiService {
  /**
   * Gera um insight inicial sobre o problema do cliente.
   * @param {string} problema - A descrição do problema.
   * @returns {Promise<string>} - O insight gerado pela IA.
   */
  async generateInsight(problema) {
    const insightResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Como um consultor experiente em negócios para PMEs, analise este problema: "${problema}". 
      Gere um conselho motivacional e prático em português do Brasil, com tom informal e próximo (como "É ótimo que você esteja buscando melhorar isso!"). 
      O conselho deve ter no máximo 3 frases e reconhecer a importância do problema relatado.`,
    });
    return insightResponse;
  }

  /**
   * Encontra as startups que melhor correspondem ao problema.
   * @param {string} problema - A descrição do problema.
   * @param {Array<object>} activeStartups - A lista de startups ativas.
   * @returns {Promise<Array<object>>} - A lista de startups correspondentes.
   */
  async matchStartups(problema, activeStartups) {
    const matchingResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise este problema de uma PME: "${problema}"
      
      Aqui estão as startups disponíveis:
      ${activeStartups.map(s => `
      - Nome: ${s.nome}
      - Descrição: ${s.descricao}  
      - Categoria: ${s.categoria}
      - Tags: ${s.tags?.join(', ') || 'N/A'}
      `).join('\n')}
      
      Para cada startup que pode resolver esse problema:
      1. Calcule um percentual de match (0-100%)
      2. Gere um resumo personalizado explicando como essa solução atende especificamente ao problema.
      **IMPORTANTE: No 'personalized_summary', NÃO revele o nome da startup.** Apenas explique como a solução resolve o problema de forma anônima.
      
      Retorne as ${LIMITS.MAX_STARTUPS_SUGERIDAS} startups com maior match, ordenadas por relevância.
      **REQUERIMENTO CRÍTICO: A lista de 'matches' deve conter apenas startups ÚNICAS. Não repita a mesma startup na lista de resultados.**`,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startup_name: { type: "string" },
                match_percentage: { type: "number" },
                personalized_summary: { type: "string" }
              },
              required: ["startup_name", "match_percentage", "personalized_summary"]
            }
          }
        },
        required: ["matches"]
      }
    });

    const matches = matchingResponse.matches || [];
    
    // Dupla garantia: remove duplicatas programaticamente
    const uniqueMatches = [];
    const seenNames = new Set();
    for (const match of matches) {
        if (!seenNames.has(match.startup_name)) {
            uniqueMatches.push(match);
            seenNames.add(match.startup_name);
        }
    }
    
    return uniqueMatches;
  }
}

export const apiService = new ApiService();