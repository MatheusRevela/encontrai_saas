
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Database, Search, Zap, CheckCircle, Sparkles, Target } from 'lucide-react';

// Etapas com ritmo mais realista para uma busca de ~55 segundos
const steps = [
  {
    icon: Brain,
    message: "Analisando seu desafio com IA avançada...",
    duration: 7000, // 7s
    progressStart: 0,
    progressEnd: 15
  },
  {
    icon: Database,
    message: "Acessando nossa base de startups...",
    duration: 5000, // 5s
    progressStart: 15,
    progressEnd: 25
  },
  {
    icon: Search,
    message: "Buscando soluções compatíveis...",
    duration: 10000, // 10s
    progressStart: 25,
    progressEnd: 45
  },
  {
    icon: Sparkles,
    message: "Aplicando algoritmos de matching...",
    duration: 12000, // 12s
    progressStart: 45,
    progressEnd: 70
  },
  {
    icon: Target,
    message: "Cruzando dados com avaliações de especialistas...",
    duration: 8000, // 8s
    progressStart: 70,
    progressEnd: 85
  },
  {
    icon: Zap,
    message: "Calculando scores de compatibilidade...",
    duration: 7000, // 7s
    progressStart: 85,
    progressEnd: 95
  },
  {
    icon: CheckCircle,
    message: "Finalizando suas recomendações personalizadas...",
    duration: 6000, // 6s
    progressStart: 95,
    progressEnd: 100
  }
];

const subtleMessages = [
  "Processando milhares de startups...",
  "Avaliando especialistas do mercado...",
  "Verificando histórico de sucesso...",
  "Analisando compatibilidade de setor...",
  "Filtrando as melhores opções...",
  "Validando qualidade das soluções...",
  "Tá quase lá, aguarde mais um pouco...",
  "Carregando dados das empresas...",
  "Aplicando filtros de qualidade...",
  "Preparando suas recomendações...",
  "Verificando disponibilidade das startups...",
  "Organizando os resultados finais..."
];

const BuscaLoadingAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    let stepTimer;
    let progressTimer;
    let messageTimer;

    const runStep = (stepIndex) => {
      if (stepIndex >= steps.length) return;

      const step = steps[stepIndex];
      setCurrentStep(stepIndex);
      setCurrentMessage(step.message);

      // Anima o progresso mais devagar e suave
      const progressDiff = step.progressEnd - step.progressStart;
      const progressIncrement = progressDiff / (step.duration / 150); // Mais suave (150ms por incremento)
      let currentProgress = step.progressStart;

      progressTimer = setInterval(() => {
        currentProgress += progressIncrement;
        if (currentProgress >= step.progressEnd) {
          currentProgress = step.progressEnd;
          clearInterval(progressTimer);
        }
        setProgress(Math.min(currentProgress, 100));
      }, 150); // Mais suave

      // Muda mensagem mais frequentemente para dar sensação de trabalho ativo
      messageTimer = setInterval(() => {
        if (Math.random() > 0.6) { // 40% chance de mudar mensagem (mais frequente)
          const randomMessage = subtleMessages[Math.floor(Math.random() * subtleMessages.length)];
          setCurrentMessage(randomMessage);
          
          // Volta para a mensagem original após 2.5 segundos
          setTimeout(() => {
            setCurrentMessage(step.message);
          }, 2500);
        }
      }, 2500); // Muda a cada 2.5s

      // Avança para próxima etapa
      stepTimer = setTimeout(() => {
        clearInterval(progressTimer);
        clearInterval(messageTimer);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, []);

  const currentStepData = steps[currentStep];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl">
      
      {/* Ícone animado da etapa atual */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
          <AnimatePresence mode="wait">
            {currentStepData && (
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <currentStepData.icon className="w-12 h-12 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Círculos de progresso pulsando */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-emerald-300"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Barra de progresso mais visual */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Progresso</span>
          <motion.span
            key={Math.floor(progress)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-semibold text-emerald-600"
          >
            {Math.floor(progress)}%
          </motion.span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }} // Transição mais suave
          />
        </div>
      </div>

      {/* Mensagem animada */}
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-medium text-slate-800"
          >
            {currentMessage}
          </motion.div>
        </AnimatePresence>
        
        {/* Pontos de loading - sempre animados */}
        <motion.div className="flex justify-center mt-2 space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-emerald-500 rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Indicadores de etapas */}
      <div className="flex space-x-2">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              index <= currentStep ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            animate={{
              scale: index === currentStep ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 0.8,
              repeat: index === currentStep ? Infinity : 0,
            }}
          />
        ))}
      </div>

      {/* Texto de apoio */}
      <motion.p 
        className="text-sm text-slate-500 mt-4 text-center max-w-md"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {progress < 95 
          ? "Estamos processando milhares de startups para encontrar as melhores soluções para você."
          : "Quase pronto! Organizando os resultados finais..."
        }
      </motion.p>
    </div>
  );
};

export default BuscaLoadingAnimation;
