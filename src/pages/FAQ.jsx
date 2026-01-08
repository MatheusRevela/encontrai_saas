import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Shield, CreditCard, Gift, Star } from 'lucide-react';

const faqs = [
  {
    icon: CheckCircle,
    question: "Como funciona o EncontrAI?",
    answer: "É simples! Você descreve um desafio ou necessidade do seu negócio, nossa Inteligência Artificial analisa o contexto e recomenda até 5 startups da nossa base que podem resolver seu problema. Você pode então escolher quais contatos deseja desbloquear."
  },
  {
    icon: Shield,
    question: "Como vocês garantem a qualidade das startups?",
    answer: "Temos um processo rigoroso. Além de uma curadoria inicial, nosso sistema verifica automaticamente e mensalmente todas as startups da nossa base para garantir que seus sites estão ativos e as informações de contato são válidas. Isso garante que você sempre receberá recomendações de empresas ativas e confiáveis."
  },
  {
    icon: Star,
    question: "O que é a avaliação de especialista que vocês fazem?",
    answer: "Cada startup é avaliada individualmente por especialistas de mercado em uma escala de 1 a 5 estrelas. Consideramos fatores como qualidade da equipe, investimentos recebidos, experiência dos fundadores, quantidade de funcionários e qualidade da carteira de clientes. Essa avaliação complementa nosso algoritmo de IA, oferecendo uma perspectiva humana especializada sobre a real capacidade de execução de cada empresa."
  },
  {
    icon: CreditCard,
    question: "O pagamento é seguro? Quanto custa?",
    answer: "Sim, usamos o Mercado Pago, um dos gateways de pagamento mais seguros do Brasil. Você paga apenas pelas soluções que escolher desbloquear, ao custo de R$ 5,00 por startup, sem taxas escondidas. Você tem total controle sobre seus gastos."
  },
  {
    icon: Gift,
    question: "O que acontece depois que eu pago?",
    answer: "Imediatamente após a confirmação do pagamento, você receberá por e-mail todos os dados de contato da(s) startup(s) que selecionou: nome, site, e-mail, WhatsApp, etc. Você também poderá ver essas informações na sua área de 'Minhas Buscas' a qualquer momento."
  }
];

export default function FAQ() {
  return (
    <div className="py-12 md:py-20 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-lg text-slate-600">
            Tudo o que você precisa saber para usar o EncontrAI com confiança.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline text-base">
                <div className="flex items-center gap-4">
                  <faq.icon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  {faq.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}