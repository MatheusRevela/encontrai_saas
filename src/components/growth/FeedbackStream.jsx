import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Loader2, Send } from 'lucide-react';
import { collectFeedback } from '@/functions/collectFeedback';

const FeedbackCard = ({ feedback }) => (
  <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-emerald-400">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < (feedback.avaliacao || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">{new Date(feedback.created_date).toLocaleDateString('pt-BR')}</p>
    </div>
    <p className="text-sm text-slate-700 italic">"{feedback.satisfaction_feedback || feedback.feedback}"</p>
  </div>
);

export default function FeedbackStream({ transactions = [], onUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Verificação de segurança para garantir que transactions existe e é um array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  const feedbacks = safeTransactions
    .filter(t => t.satisfaction_feedback || t.feedback)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const handleTriggerManual = async () => {
    setIsProcessing(true);
    try {
      const response = await collectFeedback();
      alert(response.data.message);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao disparar coleta de feedback:", error);
      alert("Ocorreu um erro ao coletar os feedbacks.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            Feedback dos Clientes
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">O que os usuários estão dizendo.</p>
        </div>
        <Button onClick={handleTriggerManual} disabled={isProcessing} size="sm" variant="outline">
           {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Coletar Manualmente
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {feedbacks.length > 0 ? (
          feedbacks.map(f => <FeedbackCard key={f.id} feedback={f} />)
        ) : (
          <div className="text-center text-slate-500 py-10">
            <p>Nenhum feedback coletado ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}