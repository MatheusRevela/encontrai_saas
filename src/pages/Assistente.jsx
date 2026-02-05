import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '../components/assistente/MessageBubble';

export default function Assistente() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        sender: 'bot', 
        text: 'Olá! Sou especialista em conectar pessoas aos recursos certos. Conte-me: que desafio você está enfrentando? Pode descrever com detalhes, vou entender o contexto.' 
      }]);
    }
  }, []);
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newHumanMessage = { sender: 'user', text: userInput };
    const currentConversation = [...messages, newHumanMessage];
    
    setMessages(currentConversation);
    setUserInput('');
    setIsLoading(true);

    try {
      const conversationHistory = currentConversation
        .map(msg => `${msg.sender === 'bot' ? 'Consultor' : 'Cliente'}: ${msg.text}`)
        .join('\n\n');

      const shouldComplete = questionCount >= 3;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um consultor experiente e empático, especializado em entender necessidades de negócios e projetos pessoais. Sua comunicação é natural, humana e contextual.

**HISTÓRICO DA CONVERSA:**
${conversationHistory}

**ANÁLISE SEMÂNTICA - LEIA COM ATENÇÃO:**
1. Analise TODO o contexto fornecido até agora
2. Identifique informações IMPLÍCITAS na fala do cliente (não pergunte o óbvio)
3. Se o cliente já deixou claro o contexto (pessoal vs. profissional, área de atuação, problema específico), NÃO pergunte novamente
4. Se ele mencionou "meu negócio", "minha empresa", "meus clientes" → já sabe que é profissional
5. Se ele detalhou um problema com especificidades técnicas → já tem contexto suficiente

**COMPORTAMENTO INTELIGENTE:**
- Perguntas ${questionCount}/4 feitas até agora
- ${shouldComplete ? 'Você TEM informação suficiente. FINALIZE.' : 'Continue APENAS se faltar informação essencial'}
- Se o cliente deu um problema BEM ESPECÍFICO e contextualizado: vá direto para aprofundamento (recursos, prioridades)
- Se o cliente foi genérico: peça esclarecimento do problema real

**O QUE PERGUNTAR (quando necessário):**
1. Se não souber o PROBLEMA REAL: "Qual é o principal desafio que isso está causando no dia a dia?"
2. Se não souber RECURSOS: "Você já tentou alguma solução? O que não funcionou?"
3. Se não souber PRIORIDADE: "Entre resolver X e Y, qual tem mais impacto imediato?"

**REGRAS DE OURO:**
✅ Pergunte APENAS o que ainda não foi respondido (direta ou indiretamente)
✅ Se ele disse "preciso automatizar vendas no meu e-commerce" → NÃO pergunte se é pessoal ou profissional
✅ Se ele já deu 3+ detalhes concretos: FINALIZE, você tem informação suficiente
✅ Seja conversacional, não robotizado

❌ NUNCA pergunte algo que já foi respondido no histórico
❌ NUNCA ignore contexto óbvio da resposta anterior

${shouldComplete ? 
  '**AÇÃO OBRIGATÓRIA:** Finalize. Você tem informação suficiente ou atingiu 4 perguntas.' :
  '**AÇÃO:** Se falta informação CRÍTICA para recomendar soluções, faça UMA pergunta natural e específica.'
}

RESPONDA EM JSON:`,
        response_json_schema: {
          type: "object",
          properties: {
            next_question: {
              type: ["string", "null"], 
              description: "Próxima pergunta específica ou null se deve finalizar"
            },
            should_complete: {
              type: "boolean",
              description: "True se tem informação suficiente OU atingiu 4 perguntas"
            },
            context_summary: {
              type: "string",
              description: "Resumo estruturado do que foi descoberto (apenas se should_complete = true)"
            },
            client_profile: {
              type: "string",
              enum: ["pessoa_fisica", "pme", "indefinido"],
              description: "Perfil identificado (apenas se should_complete = true)"
            }
          }
        }
      });

      if (response.should_complete || shouldComplete) {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: "Perfeito! Tenho todas as informações necessárias. Vou buscar as melhores soluções para o seu caso específico. Aguarde alguns instantes..." 
        }]);
        
        setTimeout(() => {
          handleFinalSubmit(response.context_summary, response.client_profile);
        }, 1500);
      } else if (response.next_question) {
        setMessages(prev => [...prev, { sender: 'bot', text: response.next_question }]);
        setQuestionCount(prev => prev + 1);
      } else {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: "Entendi. Com essas informações já posso encontrar boas soluções para você!" 
        }]);
        setTimeout(() => {
          handleFinalSubmit(
            "Consulta baseada nas informações fornecidas durante a conversa", 
            "indefinido"
          );
        }, 1500);
      }

    } catch (error) {
      console.error("Erro na conversa:", error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "Houve um problema técnico. Poderia repetir sua resposta?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFinalSubmit = async (finalSummary, profile) => {
    try {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referralCode = localStorage.getItem('referral_code');
      
      await base44.entities.Transacao.create({
        session_id: sessionId,
        dor_relatada: finalSummary,
        perfil_cliente: profile === "indefinido" ? "pessoa_fisica" : profile,
        status_pagamento: 'pendente',
        valor_por_startup: 5.00,
        referral_code: referralCode || undefined
      });
      
      navigate(createPageUrl(`Resultados?sessionId=${sessionId}`));
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "Houve um problema ao processar sua consulta. Tente novamente." 
      }]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen-minus-header bg-slate-50">
      <div className="flex-grow p-6 md:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={`message-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <MessageBubble sender={msg.sender} text={msg.text} isLoading={false} />
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <MessageBubble sender="bot" text="Analisando sua resposta..." isLoading={true} />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-6 md:p-8 bg-white border-t border-slate-200">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <Textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="Digite sua resposta..."
              rows={2}
              className="flex-grow resize-none"
              disabled={isLoading}
              onKeyPress={handleKeyPress}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!userInput.trim() || isLoading} 
              size="icon"
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {/* 📊 PROGRESS BAR */}
          {questionCount > 0 && questionCount < 4 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Progresso da Conversa</span>
                <span className="text-sm font-semibold text-emerald-600">Pergunta {questionCount} de 4</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(questionCount / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}