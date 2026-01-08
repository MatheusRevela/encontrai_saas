import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock } from 'lucide-react';

export default function ProgressTracker({ currentStep, totalSteps, completedSteps = [] }) {
  const steps = [
    { id: 1, title: "Descrever Desafio", description: "Conte seu problema" },
    { id: 2, title: "Ver Recomendações", description: "IA encontra soluções" },
    { id: 3, title: "Escolher Startups", description: "Selecione as melhores" },
    { id: 4, title: "Realizar Pagamento", description: "Desbloqueie contatos" },
    { id: 5, title: "Conectar-se", description: "Fale com as startups" }
  ];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Seu Progresso</h3>
          <span className="text-sm text-slate-600">{currentStep} de {totalSteps}</span>
        </div>
        
        <Progress value={progressPercentage} className="mb-4 h-2" />
        
        <div className="grid grid-cols-5 gap-2 text-xs">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isLocked = step.id > currentStep;
            
            return (
              <div key={step.id} className="text-center">
                <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isCurrent ? 'bg-blue-500 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> :
                   isLocked ? <Lock className="w-4 h-4" /> :
                   <Circle className="w-4 h-4" />}
                </div>
                <p className={`font-medium ${isCurrent ? 'text-blue-600' : 'text-slate-600'}`}>
                  {step.title}
                </p>
                <p className="text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}