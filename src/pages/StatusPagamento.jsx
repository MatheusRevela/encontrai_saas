import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { checkPaymentStatus } from '@/functions/checkPaymentStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  RefreshCw,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatusPagamento() {
  const [status, setStatus] = useState('verificando');
  const [tentativas, setTentativas] = useState(0);
  const navigate = useNavigate();
  
  const sessionId = new URLSearchParams(window.location.search).get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      navigate(createPageUrl('Home'));
      return;
    }
    verificarStatus();
  }, [sessionId]);

  const verificarStatus = async () => {
    setStatus('verificando');
    const maxTentativas = 6;
    
    for (let i = 0; i < maxTentativas; i++) {
      setTentativas(i + 1);
      
      try {
        const response = await checkPaymentStatus({ sessionId });
        
        if (response.data?.status === 'pago') {
          // Pagamento confirmado - redirecionar para página de sucesso
          navigate(createPageUrl(`Sucesso?sessionId=${sessionId}`));
          return;
        }
        
        // Se não for a última tentativa, aguardar antes da próxima
        if (i < maxTentativas - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`Tentativa ${i + 1} falhou:`, error);
        
        if (i === maxTentativas - 1) {
          setStatus('erro');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Se chegou aqui, não conseguiu confirmar
    setStatus('pendente');
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'verificando':
        return {
          icon: <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />,
          title: 'Verificando seu pagamento...',
          description: `Aguarde enquanto confirmamos seu pagamento (${tentativas}/6)`,
          bgColor: 'from-blue-50 to-slate-100',
          cardBg: 'bg-blue-50/50'
        };
      case 'pendente':
        return {
          icon: <Clock className="w-12 h-12 text-amber-600" />,
          title: 'Pagamento em processamento',
          description: 'Seu pagamento está sendo processado. Isso pode levar alguns minutos.',
          bgColor: 'from-amber-50 to-slate-100',
          cardBg: 'bg-amber-50/50'
        };
      case 'erro':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-600" />,
          title: 'Não foi possível verificar',
          description: 'Ocorreu um problema ao verificar seu pagamento. Tente novamente.',
          bgColor: 'from-red-50 to-slate-100',
          cardBg: 'bg-red-50/50'
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-slate-600" />,
          title: 'Verificando...',
          description: 'Aguarde um momento',
          bgColor: 'from-slate-50 to-slate-100',
          cardBg: 'bg-slate-50/50'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${statusInfo.bgColor} flex items-center justify-center px-4`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className={`border-0 shadow-2xl ${statusInfo.cardBg} backdrop-blur-sm`}>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              {statusInfo.icon}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {statusInfo.title}
            </h1>
            
            <p className="text-slate-600 mb-6">
              {statusInfo.description}
            </p>

            {/* Barra de progresso para verificação */}
            {status === 'verificando' && (
              <div className="w-full bg-slate-200 rounded-full h-3 mb-6">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(tentativas / 6) * 100}%` }}
                />
              </div>
            )}

            <div className="space-y-3">
              {status === 'pendente' && (
                <>
                  <Button onClick={verificarStatus} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Novamente
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(createPageUrl('MinhasBuscas'))}
                    className="w-full"
                  >
                    Ver Minhas Buscas
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}

              {status === 'erro' && (
                <>
                  <Button onClick={verificarStatus} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(createPageUrl('Contato'))}
                    className="w-full"
                  >
                    Entrar em Contato
                  </Button>
                </>
              )}

              {status === 'verificando' && (
                <p className="text-sm text-slate-500">
                  Por favor, não feche esta página
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Problemas? <button 
              onClick={() => navigate(createPageUrl('Contato'))}
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              Entre em contato
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}