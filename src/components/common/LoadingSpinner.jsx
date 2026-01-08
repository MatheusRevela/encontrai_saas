import React, { useState, useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const LoadingSpinner = ({ 
  size = 'default', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-emerald-600", sizeClasses[size])} />
      {text && (
        <p className="text-sm text-slate-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const FullPageLoader = ({ text = "Carregando..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

const processingSteps = [
  "Analisando seu problema...",
  "Consultando nossa base de soluções...",
  "Gerando recomendações personalizadas...",
  "Quase pronto!",
];

export const ProcessingLoader = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % processingSteps.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Zap className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.h2
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-2xl font-bold text-slate-900 mb-4"
          >
            {processingSteps[step]}
          </motion.h2>
        </AnimatePresence>
        <p className="text-slate-600">Nossa IA está trabalhando para você. Isso pode levar alguns segundos.</p>
        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-8 overflow-hidden">
          <div className="bg-emerald-500 h-2.5 rounded-full w-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
};