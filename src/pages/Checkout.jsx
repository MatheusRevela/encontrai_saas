import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  ShoppingCart,
  Newspaper,
  Shield,
  Zap
} from 'lucide-react';

export default function Checkout() {
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  
  const navigate = useNavigate();
  const sessionId = new URLSearchParams(window.location.search).get('sessionId');

  // React Query: Buscar usuário e transação
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
  });

  // Verificar se é novo usuário
  const { data: isNovoUsuario } = useQuery({
    queryKey: ['isNovoUsuario'],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) return true;
        
        const comprasAnteriores = await base44.entities.Transacao.filter({
          created_by: currentUser.email,
          status_pagamento: 'pago'
        });
        
        return comprasAnteriores.length === 0;
      } catch {
        return true;
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: transacao, isLoading, error } = useQuery({
    queryKey: ['checkout', sessionId],
    queryFn: async () => {
      console.log('🛒 Checkout - sessionId:', sessionId);
      
      if (!sessionId) {
        console.error('❌ Session ID não encontrado na URL do checkout');
        throw new Error('Session ID não encontrado');
      }
      
      const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });
      console.log('📦 Transações no checkout:', transacoes.length);
      
      if (transacoes.length === 0) {
        throw new Error('Transação não encontrada');
      }

      const currentTransacao = transacoes[0];

      if (!currentTransacao.startups_selecionadas?.length) {
        throw new Error('Nenhuma startup selecionada. Retorne à página de resultados.');
      }

      // 📊 TRACKING: Usuário chegou no checkout
      await base44.entities.Transacao.update(currentTransacao.id, {
        checkout_viewed_at: new Date().toISOString()
      });

      return currentTransacao;
    },
    onSuccess: () => {
      if (user?.email) setEmail(user.email);
    },
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // Cache por 1 minuto
  });

  // React Query: Mutation para processar pagamento
  const paymentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Transacao.update(transacao.id, {
        cliente_email: email.trim(),
        cliente_nome: user?.full_name || email.split('@')[0],
        cliente_cpf: cpf.replace(/\D/g, ''),
        status_pagamento: 'processando'
      });

      const { data: paymentData } = await base44.functions.invoke('createPaymentLink', { sessionId });
      
      if (!paymentData.success || !paymentData.paymentUrl) {
        throw new Error('Erro ao criar link de pagamento');
      }

      return paymentData.paymentUrl;
    },
    onSuccess: (paymentUrl) => {
      window.location.href = paymentUrl;
    },
    onError: (error) => {
      console.error('Erro no checkout:', error);
      setErrorMessage('Erro ao processar pagamento. Tente novamente.');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Email é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Email inválido');
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      setErrorMessage('CPF deve conter 11 dígitos');
      return;
    }

    await paymentMutation.mutateAsync();
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cpf;
  };

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const getAnonymizedTitle = (startup, index) => {
    const categoryMap = {
      'gestao': 'Gestão',
      'vendas': 'Vendas', 
      'marketing': 'Marketing',
      'financeiro': 'Financeiro',
      'operacional': 'Operacional',
      'rh': 'Recursos Humanos',
      'tecnologia': 'Tecnologia',
      'logistica': 'Logística'
    };
    
    const categoryName = startup.categoria ? (categoryMap[startup.categoria] || startup.categoria) : 'Solução';
    return `${categoryName} #${index + 1}`;
  };

  // Se for checkout adicional, mostrar apenas as startups adicionais
  const isAdicionalCheckout = transacao?.is_adicional_checkout || false;
  const adicionalCount = transacao?.adicional_startups_count || 0;
  
  let selectedStartups;
  if (isAdicionalCheckout && adicionalCount > 0) {
    // Pegar apenas as últimas N startups (as adicionais)
    const allStartups = transacao?.startups_detalhadas || 
                        transacao?.startups_sugeridas?.filter(s => 
                          transacao.startups_selecionadas?.includes(s.startup_id)
                        ) || [];
    selectedStartups = allStartups.slice(-adicionalCount);
  } else {
    selectedStartups = transacao?.startups_detalhadas || 
                            transacao?.startups_sugeridas?.filter(s => 
                              transacao.startups_selecionadas?.includes(s.startup_id)
                            ) || [];
  }

  const valorPorStartup = transacao?.valor_por_startup || 5.00;
  const quantidadeSelecionada = selectedStartups.length;
  
  // Primeira solução GRÁTIS apenas para novos usuários E apenas no checkout inicial
  const primeiraGratis = !isAdicionalCheckout && isNovoUsuario === true && quantidadeSelecionada >= 1;
  let valorFinal = primeiraGratis 
    ? Math.max(0, (quantidadeSelecionada - 1) * valorPorStartup)
    : quantidadeSelecionada * valorPorStartup;
  
  // Desconto de R$ 3,00 ao selecionar todas as 5 soluções (apenas checkout inicial)
  const descontoCincoSolucoes = !isAdicionalCheckout && quantidadeSelecionada === 5 ? 3.00 : 0;
  valorFinal = Math.max(0, valorFinal - descontoCincoSolucoes);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erro no Checkout</h3>
            <p className="text-red-700 mb-4">{error?.message || String(error)}</p>
            <Button onClick={() => navigate(createPageUrl(`Resultados?sessionId=${sessionId}`))} variant="outline">
              Voltar aos Resultados
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isAdicionalCheckout ? 'Desbloqueio de Soluções Adicionais' : 'Finalizar Pagamento'}
          </h1>
          <p className="text-slate-600">
            {isAdicionalCheckout 
              ? `Confirme seu email para desbloquear mais ${selectedStartups.length} ${selectedStartups.length !== 1 ? 'soluções' : 'solução'}`
              : `Confirme seu email para desbloquear ${selectedStartups.length} ${selectedStartups.length !== 1 ? 'soluções' : 'solução'}`
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* COLUNA ESQUERDA - Dados Simplificados */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Confirme seu Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Email para receber os contatos *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={paymentMutation.isLoading}
                  className="bg-white border-slate-200 text-lg"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Os contatos das startups serão enviados para este email
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  CPF *
                </label>
                <Input
                  type="text"
                  value={cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  required
                  disabled={paymentMutation.isLoading}
                  maxLength={14}
                  className="bg-white border-slate-200 text-lg"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Exigido pelo Mercado Pago para processar o pagamento
                </p>
              </div>

              {/* SELOS DE CONFIANÇA */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Pagamento 100% Seguro</p>
                    <p className="text-xs text-slate-600">Processado via Mercado Pago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Acesso Instantâneo</p>
                    <p className="text-xs text-slate-600">Contatos liberados imediatamente após o pagamento</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Startups Verificadas</p>
                    <p className="text-xs text-slate-600">Todas validadas pela nossa equipe</p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{String(errorMessage)}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!email.trim() || !cpf.trim() || paymentMutation.isLoading || selectedStartups.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold"
              >
                {paymentMutation.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar R$ {valorFinal.toFixed(2).replace('.', ',')}
                  </>
                )}
              </Button>
              
              <p className="text-center text-xs text-slate-500">
                Ao continuar, você concorda com nossos <a href={createPageUrl('TermosDeUso')} className="underline">Termos de Uso</a>
              </p>
            </CardContent>
          </Card>

          {/* COLUNA DIREITA - Resumo */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStartups.map((startup, index) => (
                <div key={startup.id || index} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Newspaper className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {getAnonymizedTitle(startup, index)}
                      </p>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs mt-1">
                        {startup.match_percentage}% match
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-800">
                    R$ {valorPorStartup.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
              
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotal ({quantidadeSelecionada} {quantidadeSelecionada === 1 ? 'solução' : 'soluções'})</span>
                  <span className="text-slate-900">
                    R$ {(quantidadeSelecionada * valorPorStartup).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {primeiraGratis && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-600 font-semibold">🎁 Primeira solução GRÁTIS</span>
                    <span className="text-emerald-600 font-semibold">- R$ {valorPorStartup.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                
                {descontoCincoSolucoes > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-600 font-semibold">🎉 Desconto 5 soluções</span>
                    <span className="text-emerald-600 font-semibold">- R$ {descontoCincoSolucoes.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xl font-bold pt-2">
                  <span>Total:</span>
                  <span className="text-emerald-600">
                    R$ {valorFinal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {quantidadeSelecionada === 1 && (
                  <p className="text-xs text-emerald-600 text-center mt-2">
                    🎉 Sua primeira solução é totalmente gratuita!
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2">O que você receberá:</h4>
                <ul className="space-y-1 text-sm text-slate-700">
                  <li>• Contatos diretos das {selectedStartups.length} startup{selectedStartups.length !== 1 ? 's' : ''}</li>
                  <li>• Email, WhatsApp e LinkedIn de cada uma</li>
                  <li>• Informações detalhadas das soluções</li>
                  <li>• Acesso permanente em "Minhas Buscas"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}