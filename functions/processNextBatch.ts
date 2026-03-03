import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CATEGORIAS = ["gestao", "vendas", "marketing", "financeiro", "operacional", "rh", "tecnologia", "logistica"];
const VERTICAIS = ["agtech", "biotech", "ciberseguranca", "cleantech", "construtech", "deeptech", "edtech", "energytech", "fashiontech", "fintech", "foodtech", "govtech", "greentech", "healthtech", "hrtech", "indtech", "insurtech", "legaltech", "logtech", "martech", "mobilidade", "pet_tech", "proptech", "regtech", "retailtech", "salestech", "sportech", "supply_chain", "traveltech"];
const MODELOS_NEGOCIO = ["assinatura", "pagamento_uso", "marketplace", "consultoria"];

// Função para delay entre requisições
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para retry com backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const isRateLimit = error.message?.includes('Rate limit') || 
                         error.message?.includes('429') || 
                         error.message?.includes('rate_limit');
      
      if (isRateLimit) {
        const delayTime = baseDelay * Math.pow(2, attempt - 1); // Backoff exponencial
        console.log(`⏳ Rate limit detectado, aguardando ${delayTime}ms antes da tentativa ${attempt + 1}`);
        await delay(delayTime);
      } else {
        // Para outros erros, delay menor
        await delay(1000 * attempt);
      }
    }
  }
}

async function analisarStartupCompleta(base44, item) {
  const temDescricao = item.descricao && item.descricao.trim() !== '';
  
  console.log(`🤖 Iniciando análise OTIMIZADA para: ${item.nome}`);

  // OTIMIZAÇÃO: Combinar todas as análises em UMA ÚNICA CHAMADA para reduzir rate limit
  const promptCompleto = `Analise o site da startup e a descrição adicional, e extraia as seguintes informações em formato JSON:

CATEGORIAS DISPONÍVEIS: ${CATEGORIAS.join(', ')}
VERTICAIS DISPONÍVEIS: ${VERTICAIS.join(', ')}
MODELOS DE NEGÓCIO DISPONÍVEIS: ${MODELOS_NEGOCIO.join(', ')}

REGRAS CRÍTICAS:
1. A DESCRIÇÃO FINAL NÃO PODE MENCIONAR O NOME DA EMPRESA.
2. Use termos genéricos como "a solução", "a plataforma", etc.
3. Descrição deve ter 2-3 linhas explicando O QUE a solução faz.
4. Escolha categorias, verticais e modelos EXATAMENTE como listados.
5. SEMPRE preencha a vertical_atuacao - analise bem o tipo de negócio e escolha a mais adequada.
6. Para preços: procure especificamente em páginas/seções de "Preços", "Planos", "Pricing". Se encontrar, use o formato: "R$XX,XX - R$XX,XX/mês" ou "R$XX,XX - R$XX,XX/ano". Se NÃO encontrar preços no site, retorne null.
7. Use TANTO o conteúdo do site quanto a descrição adicional.
8. Procure por um email de contato, URL do LinkedIn e a URL da imagem do LOGO.
9. Gere entre 10 a 15 tags **relevantes e específicas** em português. As tags devem ser curtas (1 a 3 palavras), em letras minúsculas, MANTENDO acentuação e caracteres especiais do português (ç, ã, é, á, etc.). Sem pontuação ou underscores. O resultado deve ser um array de strings.
   - Exemplo de formato BOM: ["gestão de estoque", "controle financeiro", "recuperação de crédito", "automação"]
   - Exemplo de formato RUIM: ["Gestão de Estoque.", "controle_financeiro", "[erp]", "gestao"]
10. Para WhatsApp: procure números em links 'wa.me', textos, rodapés. Formato internacional: "+5511987654321".

REGRAS ANTI-ALUCINAÇÃO (MUITO IMPORTANTE):
1. Se uma informação (email, whatsapp, linkedin, logo_url, preco_base) NÃO estiver EXPLICITAMENTE no site, retorne null para o campo correspondente.
2. NÃO invente, adivinhe ou deduza informações de contato. É CRÍTICO que você retorne null se o dado não for encontrado. É melhor um campo vazio do que um dado incorreto.

DADOS PARA ANÁLISE:
Site: ${item.site}
${temDescricao ? `Descrição adicional: ${item.descricao}` : ''}

Retorne um JSON com este formato:
{
  "nome": "Nome da startup",
  "descricao": "Descrição SEM o nome da empresa",
  "categoria": "uma das categorias da lista",
  "vertical_atuacao": "uma das verticais da lista (OBRIGATÓRIO)",
  "modelo_negocio": "um dos modelos ou null",
  "tags": ["array", "de", "tags", "em", "portugues"],
  "email": "email de contato ou null",
  "linkedin": "URL do LinkedIn ou null",
  "preco_base": "formato R$XX,XX - R$XX,XX/mês ou null se não encontrar",
  "whatsapp": "número encontrado ou null",
  "logo_url": "URL da imagem do logo ou null"
}`;

  // Usar retry com backoff exponencial
  const resultado = await retryWithBackoff(async () => {
    await delay(1500); // Delay base de 1.5s entre chamadas
    
    return await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: promptCompleto,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          nome: { type: "string" },
          descricao: { type: "string" },
          categoria: { type: "string" },
          vertical_atuacao: { type: "string" },
          modelo_negocio: { type: ["string", "null"] },
          tags: { type: "array", items: { type: "string" } },
          email: { type: ["string", "null"] },
          linkedin: { type: ["string", "null"] },
          preco_base: { type: ["string", "null"] },
          whatsapp: { type: ["string", "null"] },
          logo_url: { type: ["string", "null"] }
        },
        required: ["nome", "descricao", "categoria", "vertical_atuacao"]
      }
    });
  }, 3, 3000); // 3 tentativas, delay base de 3s

  console.log(`✅ Análise concluída para: ${resultado.nome}`);
  return resultado;
}

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

    const { labId, action } = await req.json();
    
    const lab = await base44.asServiceRole.entities.StartupLab.get(labId);
    if (!lab) throw new Error('Laboratório não encontrado');

    if (action === 'pause') {
      await base44.asServiceRole.entities.StartupLab.update(labId, { status: 'pausado' });
      return new Response(JSON.stringify({ message: 'Processamento pausado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'start') {
      // Se já está concluído, não faz nada
      if (lab.processados >= lab.total_registros) {
        await base44.asServiceRole.entities.StartupLab.update(labId, { status: 'concluido' });
        return new Response(JSON.stringify({ message: 'Processamento já concluído.' }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await base44.asServiceRole.entities.StartupLab.update(labId, { status: 'processando' });
      
      const pendentes = lab.dados_csv.filter((item) => item.status === 'pendente');
      
      if (pendentes.length === 0) {
        await base44.asServiceRole.entities.StartupLab.update(labId, { 
          status: 'concluido', 
          concluido_em: new Date().toISOString() 
        });
        return new Response(JSON.stringify({ message: 'Concluído por falta de itens pendentes.' }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const itemAtual = pendentes[0];
      
      try {
        console.log(`🤖 Analisando: ${itemAtual.nome} - ${itemAtual.site}`);
        
        const existingStartups = itemAtual.site 
          ? await base44.asServiceRole.entities.Startup.filter({ site: itemAtual.site })
          : [];
        
        if (existingStartups.length > 0) {
          console.log(`⚠️ Startup já existe com o site ${itemAtual.site}. Pulando...`);
          
          const itemIndexDup = lab.dados_csv.findIndex(
            (item) => item.site === itemAtual.site && item.status === 'pendente'
          );
          const dadosComDuplicata = lab.dados_csv.map((item, i) => 
            i === itemIndexDup ? { 
              ...item, 
              status: 'sucesso', 
              startup_id: existingStartups[0].id, 
              erro_mensagem: 'Startup já existia na base' 
            } : item
          );

          const updatePayload = {
            dados_csv: dadosComDuplicata,
            processados: lab.processados + 1,
            criados_com_sucesso: lab.criados_com_sucesso + 1,
          };
          
          if (updatePayload.processados >= lab.total_registros) {
            updatePayload.status = 'concluido';
            updatePayload.concluido_em = new Date().toISOString();
          }

          await base44.asServiceRole.entities.StartupLab.update(labId, updatePayload);
          return new Response(JSON.stringify({ message: 'Item já existia, continuando' }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Identificar item pelo índice para evitar colisão com sites duplicados no CSV
        const itemIndex = lab.dados_csv.findIndex(
          (item) => item.site === itemAtual.site && item.status === 'pendente'
        );
        const dadosAtualizados = lab.dados_csv.map((item, i) => 
          i === itemIndex ? { ...item, status: 'processando' } : item
        );
        await base44.asServiceRole.entities.StartupLab.update(labId, { dados_csv: dadosAtualizados });

        // ANÁLISE COM RETRY E BACKOFF
        const resultadoIA = await analisarStartupCompleta(base44, itemAtual);
        
        const startupData = {
          nome: resultadoIA.nome || itemAtual.nome,
          descricao: resultadoIA.descricao || itemAtual.descricao,
          categoria: resultadoIA.categoria || 'tecnologia',
          tags: (resultadoIA.tags || []).map(tag => tag.normalize('NFC').trim()),
          site: itemAtual.site,
          logo_url: itemAtual.logo_url || resultadoIA.logo_url,
          email: resultadoIA.email,
          whatsapp: resultadoIA.whatsapp,
          linkedin: resultadoIA.linkedin,
          preco_base: resultadoIA.preco_base,
          vertical_atuacao: resultadoIA.vertical_atuacao,
          modelo_negocio: resultadoIA.modelo_negocio,
          ativo: false,
          origem_criacao: 'csv_import',
          status_verificacao: { 
            site_online: true, 
            observacoes: "Criado via Laboratório de Startups com IA otimizada" 
          }
        };

        // Remove campos vazios
        Object.keys(startupData).forEach(key => {
          if (startupData[key] === null || startupData[key] === undefined || 
              (Array.isArray(startupData[key]) && startupData[key].length === 0) || 
              startupData[key] === '') {
            delete startupData[key];
          }
        });

        const novaStartup = await base44.asServiceRole.entities.Startup.create(startupData);
        
        const dadosFinais = lab.dados_csv.map((item, i) => 
          i === itemIndex ? { ...item, status: 'sucesso', startup_id: novaStartup.id } : item
        );

        const updatePayloadSuccess = {
          dados_csv: dadosFinais,
          processados: lab.processados + 1,
          criados_com_sucesso: lab.criados_com_sucesso + 1,
        };
        
        if (updatePayloadSuccess.processados >= lab.total_registros) {
          updatePayloadSuccess.status = 'concluido';
          updatePayloadSuccess.concluido_em = new Date().toISOString();
        }

        await base44.asServiceRole.entities.StartupLab.update(labId, updatePayloadSuccess);
        console.log(`✅ Startup criada com sucesso: ${startupData.nome}`);

      } catch (error) {
        console.error(`❌ Erro ao processar ${itemAtual.nome}:`, error);
        
        // Tratamento específico para rate limit
        const isRateLimit = error.message?.includes('Rate limit') || 
                           error.message?.includes('429') ||
                           error.message?.includes('rate_limit');
        
        if (isRateLimit) {
          // Para rate limit, pausa o laboratório automaticamente
          await base44.asServiceRole.entities.StartupLab.update(labId, { 
            status: 'pausado',
            dados_csv: lab.dados_csv.map((item) => 
              item.site === itemAtual.site ? { 
                ...item, 
                status: 'pendente', // Volta para pendente para tentar depois
                erro_mensagem: 'Pausado por rate limit - tente novamente em alguns minutos' 
              } : item
            )
          });
          
          return new Response(JSON.stringify({ 
            error: 'Rate limit atingido. Laboratório pausado automaticamente. Aguarde alguns minutos e clique em "Iniciar" novamente.' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Para outros erros, marca como erro e continua
        const dadosComErro = lab.dados_csv.map((item) => 
          item.site === itemAtual.site ? { 
            ...item, 
            status: 'erro', 
            erro_mensagem: error.message.substring(0, 200) 
          } : item
        );

        const updatePayloadError = {
          dados_csv: dadosComErro,
          processados: lab.processados + 1,
          erros: lab.erros + 1,
        };
        
        if (updatePayloadError.processados >= lab.total_registros) {
          updatePayloadError.status = 'concluido';
          updatePayloadError.concluido_em = new Date().toISOString();
        }
        
        await base44.asServiceRole.entities.StartupLab.update(labId, updatePayloadError);
      }

      return new Response(JSON.stringify({ message: 'Processamento em andamento' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Ação inválida');

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});