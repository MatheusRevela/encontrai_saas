import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Criar Macrocaixa Finanças
    const macro = await base44.asServiceRole.entities.Macrocaixa.create({
      nome: "Finanças",
      descricao: "Gestão financeira, modelagem, demonstrativos e fundraising",
      ativa: true,
      ordem: 0
    });

    // Estrutura de Caixas e suas Microcaixas
    const estrutura = [
      {
        nome: "Modelagem Financeira",
        objetivo: "Construir e analisar modelos financeiros",
        microcaixas: ["Valuation", "Projeções financeiras", "Orçamento", "Foresight financeiro", "Equity e diluição", "Análises financeiras"]
      },
      {
        nome: "Demonstrativos Financeiros",
        objetivo: "Demonstrativos contábeis e métricas",
        microcaixas: ["Balanço Patrimonial", "DRE", "Fluxo de Caixa", "Métricas financeiras"]
      },
      {
        nome: "Financiamento",
        objetivo: "Estratégias de captação e financiamento",
        microcaixas: ["Bootstrapping", "Rodadas de investimento", "Modalidades de financiamento", "Estratégia de fundraising", "Data room"]
      },
      {
        nome: "Equipe de Finanças",
        objetivo: "Estruturação do time financeiro",
        microcaixas: ["FP&A", "Compliance financeiro"]
      }
    ];

    const resultado = {
      macrocaixa: macro,
      caixas: [],
      microcaixas: [],
      conteudos: []
    };

    // Criar cada Caixa
    for (const [idx, caixaData] of estrutura.entries()) {
      const caixa = await base44.asServiceRole.entities.Caixa.create({
        macrocaixa_id: macro.id,
        nome: caixaData.nome,
        objetivo: caixaData.objetivo,
        ordem: idx
      });

      resultado.caixas.push(caixa);

      // Criar Microcaixas
      for (const [microIdx, microNome] of caixaData.microcaixas.entries()) {
        const micro = await base44.asServiceRole.entities.Microcaixa.create({
          caixa_id: caixa.id,
          nome: microNome,
          descricao: `Competência sobre ${microNome}`,
          editavel: true,
          ordem: microIdx
        });

        resultado.microcaixas.push(micro);

        // Criar 3 conteúdos padrão para cada microcaixa
        const tiposConteudo = ['conceito', 'framework', 'checklist'];
        
        for (const [contIdx, tipo] of tiposConteudo.entries()) {
          const conteudo = await base44.asServiceRole.entities.Conteudo.create({
            microcaixa_id: micro.id,
            tipo: tipo,
            titulo: `${microNome} - ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
            corpo: `[Placeholder] Conteúdo de ${tipo} para ${microNome}. Edite este campo para adicionar informações relevantes.`,
            ativo: true,
            ordem: contIdx
          });

          resultado.conteudos.push(conteudo);
        }
      }
    }

    return Response.json({
      success: true,
      message: "Estrutura de Finanças criada com sucesso!",
      total: {
        macrocaixas: 1,
        caixas: resultado.caixas.length,
        microcaixas: resultado.microcaixas.length,
        conteudos: resultado.conteudos.length
      },
      data: resultado
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});