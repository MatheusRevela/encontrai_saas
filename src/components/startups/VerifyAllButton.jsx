import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Shield, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function VerifyAllButton({ allStartups, onComplete, disabled }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: 0, failed: 0 });

  const handleVerifyAll = async () => {
    const activeStartups = allStartups.filter(s => s.ativo);
    
    if (activeStartups.length === 0) {
      alert('Nenhuma startup ativa para verificar.');
      return;
    }

    // Ordena por prioridade: nunca verificadas primeiro, depois as mais antigas
    const sortedStartups = [...activeStartups].sort((a, b) => {
      const aVerificada = a.ultima_verificacao;
      const bVerificada = b.ultima_verificacao;
      
      // Nunca verificadas vêm primeiro
      if (!aVerificada && bVerificada) return -1;
      if (aVerificada && !bVerificada) return 1;
      
      // Ambas não verificadas: ordena por criação (mais antigas primeiro)
      if (!aVerificada && !bVerificada) {
        return new Date(a.created_date) - new Date(b.created_date);
      }
      
      // Ambas verificadas: mais antigas primeiro
      return new Date(a.ultima_verificacao) - new Date(b.ultima_verificacao);
    });

    // Limita a 75 startups para evitar falhas
    const startupsToVerify = sortedStartups.slice(0, 75);

    if (!confirm(`Deseja verificar as ${startupsToVerify.length} startups mais prioritárias? (Nunca verificadas + mais antigas)`)) {
      return;
    }

    setIsVerifying(true);
    setProgress({ current: 0, total: startupsToVerify.length });
    setResults({ success: 0, failed: 0 });
    
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < startupsToVerify.length; i++) {
      const startup = startupsToVerify[i];
      
      try {
        await base44.functions.invoke('verificarStartupIndividual', { 
          startupId: startup.id 
        });
        
        successCount++;
        setResults({ success: successCount, failed: failedCount });
      } catch (error) {
        console.error(`Erro ao verificar ${startup.nome}:`, error);
        failedCount++;
        setResults({ success: successCount, failed: failedCount });
      }
      
      setProgress({ current: i + 1, total: startupsToVerify.length });
      
      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsVerifying(false);
    alert(`Verificação concluída!\n✅ ${successCount} com sucesso\n❌ ${failedCount} com erro`);
    
    if (onComplete) {
      onComplete();
    }
  };

  const progressPercentage = progress.total > 0 
    ? (progress.current / progress.total) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <Button
        onClick={handleVerifyAll}
        disabled={isVerifying || allStartups.length === 0 || disabled}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verificando {progress.current}/{progress.total}...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Verificar 75 Mais Antigas
          </>
        )}
      </Button>

      {isVerifying && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-900">Progresso da Verificação</span>
                <span className="text-blue-700">{progress.current} de {progress.total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  {results.success} verificadas
                </div>
                <div className="flex items-center gap-1 text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  {results.failed} com erro
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}