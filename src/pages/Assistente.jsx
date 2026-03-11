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
        text: 'Olá! Sou consultor especializado em conectar pessoas e empresas às melhores soluções tecnológicas. Para encontrar o que realmente faz sentido para o seu caso, preciso entender bem o contexto. Me conte: qual é o desafio que você está enfrentando?' 
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

      const shouldComplete = questionCount >= 4;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um consultor experiente em inovação e tecnologia, com profundo conhecimento em soluções para negócios e demandas pessoais. Você conversa de forma natural e humana, como um especialista de confiança — sem soar como um robô ou seguir roteiros engessados.

HISTÓRICO DA CONVERSA:
${conversationHistory}

Seu objetivo é entender o problema com profundidade suficiente para recomendar as soluções mais adequadas. Você não faz isso por meio de interrogatório, mas por meio de uma conversa genuína: você demonstra que compreendeu o que foi dito, faz observações pertinentes, e então aprofunda nos pontos que ainda precisam de clareza.

Diretrizes que você segue naturalmente (não as mencione):
- Leia nas entrelinhas. Se a pessoa mencionou "minha equipe", "meus clientes", "meu negócio", você já inferiu que é um contexto profissional — não pergunte isso de novo.
- Jamais repita perguntas já respondidas, direta ou indiretamente.
- Antes de perguntar, faça um comentário que mostre que você realmente entendeu o contexto. Isso cria confiança.
- Nunca use listas, tópicos ou cabeçalhos. Isso é uma conversa, não um formulário.
- Faça no máximo uma pergunta por vez — e que seja a pergunta certa, aquela que revela o que ainda falta saber.
- Você precisa coletar: (1) qual é o problema central, (2) o contexto em que ele ocorre, (3) o que já foi tentado ou o que não funcionou, (4) qual é a prioridade ou impacto esperado.
- Número de perguntas já feitas: ${questionCount} de 4. ${shouldComplete ? 'Você já tem contexto suficiente para encerrar.' : 'Continue aprofundando — ainda há perguntas importantes a fazer antes de encerrar.'}

${shouldComplete
  ? 'INSTRUÇÃO FINAL: Você já coletou informações suficientes. Encerre a conversa de forma natural e acolhedora, sinalizando que vai buscar as melhores soluções para o caso. Coloque o texto de encerramento no campo "next_question" e defina should_complete como true.'
  : 'INSTRUÇÃO: Continue a conversa. Faça a próxima pergunta mais relevante com base no que ainda não foi esclarecido. Defina should_complete como false.'
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
        const encerramento = response.next_question || "Muito bem, acredito que já tenho uma visão clara do que você precisa. Vou buscar as soluções mais adequadas para o seu caso — aguarde um momento.";
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: encerramento
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
          text: "Entendido. Com as informações que você trouxe, já consigo buscar as melhores opções para o seu caso." 
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
        text: "Ocorreu um problema técnico. Poderia repetir sua última mensagem?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFinalSubmit = async (finalSummary, profile) => {
    try {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let referralCode;
      try {
        const raw = localStorage.getItem('referral_code');
        if (raw) {
          const parsed = JSON.parse(raw);
          const expired = !parsed.ts || (Date.now() - parsed.ts > 30 * 24 * 60 * 60 * 1000);
          if (!expired && /^[A-Za-z0-9_-]{3,20}$/.test(parsed.code)) {
            referralCode = parsed.code;
          } else {
            localStorage.removeItem('referral_code');
          }
        }
      } catch {
        localStorage.removeItem('referral_code');
      }
      
      await base44.entities.Transacao.create({
        session_id: sessionId,
        dor_relatada: finalSummary,
        perfil_cliente: profile === "indefinido" ? "pessoa_fisica" : profile,
        status_pagamento: 'pendente',
        valor_por_startup: 5.00,
        referral_code: referralCode
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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
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