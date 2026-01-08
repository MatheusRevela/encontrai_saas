
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Zap, Target, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/entities/all'; // Added import for User entity

const OnboardingStep = ({ step, totalSteps, onNext, onSkip, onComplete }) => {
  const steps = [
    {
      title: "Bem-vindo ao EncontrAI! 🎉",
      description: "Sua jornada para encontrar as melhores startups começa aqui. Em apenas 30 segundos, você entenderá como funciona.",
      icon: Zap,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Como Funciona? 🧠",
      description: "Nossa IA analisa seu desafio e encontra startups com alta compatibilidade. Sem busca manual, sem perda de tempo.",
      icon: Target,
      color: "from-blue-500 to-blue-600",
      stats: "94% de precisão nas recomendações"
    },
    {
      title: "Cases de Sucesso 📈",
      description: "Mais de 500 PMEs já encontraram soluções perfeitas. A primeira startup é GRATUITA para você experimentar!",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      testimonial: {
        text: "Encontrei a solução para meu e-commerce em 5 minutos. Fantástico!",
        author: "Marina, CEO TechStore"
      }
    }
  ];

  const currentStep = steps[step - 1];
  const Icon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          <div className="flex justify-between items-center mb-6">
            <Badge variant="outline" className="text-xs">
              {step} de {totalSteps}
            </Badge>
            <button onClick={onSkip} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${currentStep.color} flex items-center justify-center mx-auto mb-6`}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4">{currentStep.title}</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">{currentStep.description}</p>

          {currentStep.stats && (
            <div className="bg-emerald-50 p-3 rounded-lg mb-6">
              <p className="text-emerald-800 font-semibold text-sm">{currentStep.stats}</p>
            </div>
          )}

          {currentStep.testimonial && (
            <div className="bg-purple-50 p-4 rounded-lg mb-6 border-l-4 border-purple-500">
              <p className="text-purple-900 italic text-sm mb-2">"{currentStep.testimonial.text}"</p>
              <p className="text-purple-700 font-semibold text-xs">— {currentStep.testimonial.author}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Pular Tour
            </Button>
            <Button 
              onClick={step === totalSteps ? onComplete : onNext}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {step === totalSteps ? (
                <>Começar Agora <Zap className="w-4 h-4 ml-2" /></>
              ) : (
                <>Próximo <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function OnboardingTour({ isOpen, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const finishOnboarding = async (completed = true) => {
    try {
      const currentUser = await User.me();
      await User.update(currentUser.id, { onboarding_completed: completed });
    } catch (error) {
      console.error("Erro ao atualizar status do onboarding:", error);
      // Even if backend update fails, mark it locally to prevent repeated display
    }
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const checkOnboardingStatus = async () => {
      try {
        const hasSeenStorage = localStorage.getItem('hasSeenOnboarding');
        if (hasSeenStorage) {
          onComplete();
          return;
        }

        const currentUser = await User.me();
        if (currentUser.onboarding_completed) {
          localStorage.setItem('hasSeenOnboarding', 'true'); // Sync localStorage with backend
          onComplete();
        }
      } catch (error) {
        // Usuário não logado ou erro na API.
        // If User.me() fails, the onboarding will still be shown if not in localStorage.
        console.warn("Could not check backend onboarding status:", error);
      }
    };
    checkOnboardingStatus();
  }, [isOpen, onComplete]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // If the tour is not open or if localStorage already indicates it has been seen, don't render.
  if (!isOpen || localStorage.getItem('hasSeenOnboarding')) {
    return null;
  }

  return (
    <AnimatePresence>
      <OnboardingStep
        step={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onSkip={() => finishOnboarding(false)} // Call finishOnboarding when skipped
        onComplete={() => finishOnboarding(true)} // Call finishOnboarding when completed
      />
    </AnimatePresence>
  );
}
