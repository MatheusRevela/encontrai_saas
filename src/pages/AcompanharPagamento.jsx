import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { checkPaymentStatus } from '@/functions/checkPaymentStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Zap,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export default function AcompanharPagamento() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, paymentId, valorTotal, startups } = location.state || {};
  
  const [statusPagamento, setStatusPagamento] = useState('pendente');
  const [isChecking, setIsChecking] = useState(false);
  const [linkPagamento, setLinkPagamento] = useState('');

  useEffect(() => {
    if (!sessionId || !paymentId) {
      navigate(createPageUrl("Buscar"));
      return;
    }
    
    // Verificar status inicial
    verificarStatusPagamento();
    
    // Verificar a cada 15 segundos
    const interval = setInterval(verificarStatusPagamento, 15000);
    
    return () => clearInterval(interval);
  }, [sessionId, paymentId]);

  const verificarStatusPagamento = async () => {
    setIsChecking(true);
    try {
      const response = await checkPaymentStatus({ paymentId });

      if (response.data) {
        const { status, init_point } = response.data;
        setStatusPagamento(status);
        setLinkPagamento(init_point);

        // Se foi pago, atualizar transação e redirecionar
        if (status === 'approved') {
          await finalizarTransacao();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    }
    setIsChecking(false);
  };

  const finalizarTransacao = () => {
    // A confirmação do pagamento e desbloqueio de startups é feita 100% pelo backend via webhook.
    // O frontend apenas redireciona para a página de sucesso.
    navigate(createPageUrl(`Sucesso?sessionId=${sessionId}`));
  };

  const getStatusInfo = () => {
    switch (statusPagamento) {
      case 'pending':
      case 'pendente':
        return {
          icon: <Clock className="w-8 h-8 text-amber-500" />,
          title: 'Aguardando Pagamento',
          description: 'Sua cobrança foi gerada. Clique no link para pagar via Mercado Pago.',
          cardClass: 'bg-amber-50 border-amber-200',
          titleClass: 'text-amber-900',
          descClass: 'text-amber-700'
        };
      case 'approved':
      case 'pago':
        return {
          icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
          title: 'Pagamento Confirmado!',
          description: 'Seu pagamento foi aprovado. Redirecionando para os contatos...',
          cardClass: 'bg-emerald-50 border-emerald-200',
          titleClass: 'text-emerald-900',
          descClass: 'text-emerald-700'
        };
      case 'rejected':
      case 'cancelled':
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          title: 'Pagamento Não Aprovado',
          description: 'O pagamento foi recusado. Faça uma nova busca para tentar novamente.',
          cardClass: 'bg-red-50 border-red-200',
          titleClass: 'text-red-900',
          descClass: 'text-red-700'
        };
      default:
        return {
          icon: <Clock className="w-8 h-8 text-slate-500" />,
          title: 'Verificando Status...',
          description: 'Aguarde enquanto verificamos seu pagamento.',
          cardClass: 'bg-slate-50 border-slate-200',
          titleClass: 'text-slate-900',
          descClass: 'text-slate-700'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (!sessionId || !paymentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Sessão inválida</h2>
          <p className="text-slate-600 mb-4">Não foi possível encontrar os dados do seu pagamento.</p>
          <Button onClick={() => navigate(createPageUrl("Buscar"))}>
            Fazer Nova Busca
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Status do Pagamento</h1>
          </div>
        </div>

        {/* Status Card */}
        <Card className={`border-0 shadow-xl ${statusInfo.cardClass} mb-8`}>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              {statusInfo.icon}
            </div>
            <h2 className={`text-2xl font-bold ${statusInfo.titleClass} mb-2`}>
              {statusInfo.title}
            </h2>
            <p className={`${statusInfo.descClass} mb-6`}>
              {statusInfo.description}
            </p>
            
            {statusPagamento === 'pending' || statusPagamento === 'pendente' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={verificarStatusPagamento}
                    disabled={isChecking}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    {isChecking ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar Status
                      </>
                    )}
                  </Button>
                  
                  {linkPagamento && (
                    <Button
                      onClick={() => window.open(linkPagamento, '_blank')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Pagamento
                    </Button>
                  )}
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-medium text-amber-900 mb-2">💳 Mercado Pago</h3>
                  <div className="text-sm text-amber-800">
                    Pague com segurança através do Mercado Pago
                  </div>
                </div>
              </div>
            ) : (statusPagamento === 'rejected' || statusPagamento === 'cancelled') ? (
              <Button onClick={() => navigate(createPageUrl("Buscar"))}>
                Fazer Nova Busca
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-600" />
              Resumo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-700">
                {startups?.length || 0} soluções selecionadas
              </span>
              <span className="font-bold text-emerald-600">
                R$ {valorTotal?.toFixed(2) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Verificação Automática */}
        <div className="mt-6 text-center text-sm text-slate-500">
          {statusPagamento === 'pending' || statusPagamento === 'pendente' ? (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verificando automaticamente a cada 15 segundos...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}