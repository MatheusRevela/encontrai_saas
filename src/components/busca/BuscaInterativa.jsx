import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BuscaInterativa({ problemInicial, onAnaliseCompleta }) {
  const [conversacao, setConversacao] = useState([
    { role: 'assistant', content: 'Vou fazer algumas perguntas para entender melhor sua necessidade e encontrar as soluções ideais.' }
  ]);
  const [resposta, setResposta] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analiseCompleta, setAnaliseCompleta] = useState(false);

  const gerarProximaPergunta = async () => {
    setIsProcessing(true);
    try {
      const contextoConversa = conversacao.map(msg => 
        `${msg.role === 'user' ? 'Cliente' : 'Consultor'}: ${msg.content}`
      ).join('\n');

      const prompt = `Você é um consultor de tecnologia experiente, conversando naturalmente com um cliente.

PROBLEMA INICIAL DO CLIENTE:
"${problemInicial}"

CONVERSA ATÉ AGORA:
${contextoConversa}

ÚLTIMA RESPOSTA DO CLIENTE:
"${resposta}"

COMO CONDUZIR A CONVERSA:

**ANÁLISE SEMÂNTICA:**
- Leia o contexto TODO antes de decidir próximos passos
- Identifique o que JÁ FOI REVELADO implicitamente (não pergunte de novo)
- Priorize profundidade sobre quantidade de perguntas

**QUANDO FINALIZAR** (analise_completa = true):
✓ Você consegue identificar claramente O QUÊ, QUEM, COMO e POR QUÊ
✓ Sabe se é contexto empresarial ou pessoal
✓ Entende a escala/impacto do problema
✓ Já tem pistas sobre urgência ou recursos disponíveis
✓ Cliente deu 2+ respostas substantivas

**QUANDO CONTINUAR** (próxima pergunta):
Faça UMA pergunta contextual e natural baseada especificamente no que o cliente acabou de dizer.

DIRETRIZES PARA PERGUNTAS:
- NÃO use frases genéricas como "poderia detalhar mais?"
- NÃO siga um roteiro fixo (contexto → problema → recursos → prioridade)
- SIM adapte-se ao tom e conteúdo da última resposta
- SIM seja conversacional e empático
- SIM explore lacunas específicas que impedem entender a necessidade

EXEMPLOS DE PERGUNTAS CONTEXTUAIS:
❌ "Qual é o tamanho do seu negócio?" (genérica)
✅ "Você mencionou dificuldade com estoque - quantos produtos/SKUs você gerencia hoje?" (específica)

❌ "Quando você precisa resolver isso?" (roteirizada)
✅ "Esse atraso nas entregas está causando perda de vendas agora ou é para se preparar pro futuro?" (contextual)

LEMBRE-SE: Você está tendo uma CONVERSA, não preenchendo um formulário.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            analise_completa: { type: 'boolean' },
            proxima_pergunta: { type: 'string' },
            insights: {
              type: 'array',
              items: { type: 'string' }
            },
            filtros_sugeridos: {
              type: 'object',
              properties: {
                categorias: { type: 'array', items: { type: 'string' } },
                verticais: { type: 'array', items: { type: 'string' } },
                caracteristicas: { type: 'array', items: { type: 'string' } }
              }
            },
            perfil_cliente: {
              type: 'string',
              enum: ['pessoa_fisica', 'pme']
            }
          }
        }
      });

      if (resultado.analise_completa) {
        setAnaliseCompleta(true);
        onAnaliseCompleta({
          problemCompleto: `${problemInicial}\n\nContexto adicional: ${conversacao.filter(m => m.role === 'user').map(m => m.content).join(' ')}`,
          insights: resultado.insights || [],
          filtros: resultado.filtros_sugeridos || {},
          perfilCliente: resultado.perfil_cliente || 'pessoa_fisica'
        });
      } else {
        setConversacao(prev => [...prev, 
          { role: 'user', content: resposta },
          { role: 'assistant', content: resultado.proxima_pergunta }
        ]);
        setResposta('');
      }
    } catch (error) {
      console.error('Erro ao processar pergunta:', error);
      // Em caso de erro, prosseguir com análise básica
      onAnaliseCompleta({
        problemCompleto: problemInicial,
        insights: [],
        filtros: {},
        perfilCliente: 'pessoa_fisica'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pularPerguntas = () => {
    onAnaliseCompleta({
      problemCompleto: problemInicial,
      insights: [],
      filtros: {},
      perfilCliente: 'pessoa_fisica'
    });
  };

  if (analiseCompleta) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Análise Completa!</h3>
          <p className="text-green-700">Processando suas respostas e encontrando as melhores soluções...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Refinamento Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Histórico da conversa */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {conversacao.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-900'
              }`}>
                {msg.role === 'assistant' && (
                  <Badge variant="outline" className="mb-2 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    IA
                  </Badge>
                )}
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input de resposta */}
        <div className="space-y-3">
          <Textarea
            placeholder="Digite sua resposta..."
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isProcessing}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={gerarProximaPergunta}
              disabled={!resposta.trim() || isProcessing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Enviar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={pularPerguntas}
              disabled={isProcessing}
            >
              Pular
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          💡 Responda para obter resultados mais precisos, ou pule para ver sugestões gerais
        </p>
      </CardContent>
    </Card>
  );
}