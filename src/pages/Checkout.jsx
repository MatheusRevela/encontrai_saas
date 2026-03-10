import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
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
  Zap,
  Copy,
  Check
} from 'lucide-react';
import MercadoPagoBrick from '../components/checkout/MercadoPagoBrick';

export default function Checkout() {
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [isFreeProcessing, setIsFreeProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const sessionId = new URLSearchParams(window.location.search).get('sessionId');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

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
      if (!sessionId) throw new Error('Session ID não encontrado');
      const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });
      if (transacoes.length === 0) throw new Error('Transação não encontrada');
      const currentTransacao = transacoes[0];
      if (!currentTransacao.startups_selecionadas?.length) throw new Error('Nenhuma startup selecionada. Retorne à página de resultados.');
      await base44.entities.Transacao.update(currentTransacao.id, {
        checkout_viewed_at: new Date().toISOString()
      });
      return currentTransacao;
    },
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000,
  });

  const { data: checkoutConfig } = useQuery({
    queryKey: ['checkoutConfig'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getCheckoutConfig', {});
      return data;
    },
    enabled: !!transacao,
    staleTime: 30 * 60 * 1000,
  });

  // Pré-preencher email do usuário
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  // Polling para detectar pagamento Pix confirmado (webhook pode demorar)
  useEffect(() => {
    if (!pixData || !transacao?.id) return;

    // Também subscribes em tempo real
    const unsubscribe = base44.entities.Transacao.subscribe((event) => {
      if (event.id === transacao.id && event.data?.status_pagamento === 'pago') {
        navigate(createPageUrl(`Sucesso?sessionId=${sessionId}`));
      }
    });

    // Polling a cada 5s por até 10 minutos
    const interval = setInterval(async () => {
      try {
        const lista = await base44.entities.Transacao.filter({ session_id: sessionId });
        if (lista[0]?.status_pagamento === 'pago') {
          clearInterval(interval);
          navigate(createPageUrl(`Sucesso?sessionId=${sessionId}`));
        }
      } catch (_) {}
    }, 5000);

    return () => { unsubscribe(); clearInterval(interval); };
  }, [pixData, transacao?.id]);

  const validarCampos = () => {
    if (!email.trim()) { setErrorMessage('Email é obrigatório'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setErrorMessage('Email inválido'); return false; }
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) { setErrorMessage('CPF deve conter 11 dígitos'); return false; }
    return true;
  };

  const handlePaymentSubmit = async (formData) => {
    setErrorMessage(null);
    if (!validarCampos()) throw new Error('Campos inválidos');

    const { data } = await base44.functions.invoke('processTransparentPayment', {
      sessionId,
      email: email.trim(),
      cpf: cpf.replace(/\D/g, ''),
      paymentFormData: formData
    });

    if (!data.success) {
      const errMsg = data.error || 'Erro ao processar pagamento';
      setErrorMessage(errMsg);
      throw new Error(errMsg);
    }

    if (data.status === 'approved') {
      navigate(createPageUrl(`Sucesso?sessionId=${sessionId}`));
    } else if (data.status === 'pending') {
      setPixData({ qrCode: data.pixQrCode, qrCodeBase64: data.pixQrCodeBase64 });
    }
  };

  const handleFreeCheckout = async () => {
    setErrorMessage(null);
    if (!validarCampos()) return;
    setIsFreeProcessing(true);
    const { data } = await base44.functions.invoke('processTransparentPayment', {
      sessionId,
      email: email.trim(),
      cpf: cpf.replace(/\D/g, ''),
      paymentFormData: { payment_method_id: 'free', transaction_amount: 0 }
    });
    setIsFreeProcessing(false);
    if (data.success) navigate(createPageUrl(`Sucesso?sessionId=${sessionId}`));
    else setErrorMessage(data.error || 'Erro ao processar');
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

  const handleCPFChange = (e) => setCpf(formatCPF(e.target.value));

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAnonymizedTitle = (startup, index) => {
    const categoryMap = {
      'gestao': 'Gestão', 'vendas': 'Vendas', 'marketing': 'Marketing',
      'financeiro': 'Financeiro', 'operacional': 'Operacional',
      'rh': 'Recursos Humanos', 'tecnologia': 'Tecnologia', 'logistica': 'Logística'
    };
    return `${categoryMap[startup.categoria] || 'Solução'} #${index + 1}`;
  };

  const isAdicionalCheckout = transacao?.is_adicional_checkout || false;
  const adicionalCount = transacao?.adicional_startups_count || 0;

  let selectedStartups;
  if (isAdicionalCheckout && adicionalCount > 0) {
    const allStartups = transacao?.startups_detalhadas ||
      transacao?.startups_sugeridas?.filter(s => transacao.startups_selecionadas?.includes(s.startup_id)) || [];
    selectedStartups = allStartups.slice(-adicionalCount);
  } else {
    selectedStartups = transacao?.startups_detalhadas ||
      transacao?.startups_sugeridas?.filter(s => transacao.startups_selecionadas?.includes(s.startup_id)) || [];
  }

  const valorPorStartup = transacao?.valor_por_startup || 5.00;
  const quantidadeSelecionada = selectedStartups?.length || 0;
  const primeiraGratis = !isAdicionalCheckout && isNovoUsuario === true && quantidadeSelecionada >= 1;
  let valorFinal = primeiraGratis
    ? Math.max(0, (quantidadeSelecionada - 1) * valorPorStartup)
    : quantidadeSelecionada * valorPorStartup;
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
          {/* COLUNA ESQUERDA */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Confirme seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Email para receber os contatos *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-white border-slate-200 text-lg"
                  disabled={!!pixData}
                />
                <p className="text-xs text-slate-500 mt-1">Os contatos das startups serão enviados para este email</p>
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
                  maxLength={14}
                  className="bg-white border-slate-200 text-lg"
                  disabled={!!pixData}
                />
                <p className="text-xs text-slate-500 mt-1">Exigido para processar o pagamento</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Pagamento 100% Seguro</p>
                    <p className="text-xs text-slate-600">Processado via Mercado Pago — sem sair do app</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Acesso Instantâneo</p>
                    <p className="text-xs text-slate-600">Contatos liberados imediatamente após o pagamento</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Startups Verificadas</p>
                    <p className="text-xs text-slate-600">Todas validadas pela nossa equipe</p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{String(errorMessage)}</span>
                  </div>
                </div>
              )}

              {/* PIX QR CODE */}
              {pixData && (
                <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span className="text-sm font-semibold text-emerald-700">Aguardando pagamento Pix...</span>
                  </div>
                  {pixData.qrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="mx-auto w-48 h-48 rounded-lg border border-emerald-200"
                    />
                  )}
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Ou copie o código Pix copia e cola:</p>
                    <div className="flex gap-2">
                      <Input readOnly value={pixData.qrCode} className="text-xs bg-white" />
                      <Button variant="outline" size="icon" onClick={copyPixCode} className="shrink-0">
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    O acesso será liberado automaticamente após a confirmação do pagamento.
                  </p>
                </div>
              )}

              {/* GRÁTIS */}
              {!pixData && valorFinal === 0 && (
                <Button
                  onClick={handleFreeCheckout}
                  disabled={isFreeProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold"
                >
                  {isFreeProcessing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5 mr-2" />Confirmar (Grátis!)</>
                  )}
                </Button>
              )}

              {/* MP BRICK */}
              {!pixData && valorFinal > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Forma de pagamento
                  </p>
                  {checkoutConfig?.publicKey ? (
                    <MercadoPagoBrick
                      publicKey={checkoutConfig.publicKey}
                      amount={valorFinal}
                      payerEmail={email}
                      payerCpf={cpf}
                      onSubmit={handlePaymentSubmit}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                      <span className="text-sm text-slate-600">Carregando opções de pagamento...</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-slate-500">
                Ao continuar, você concorda com nossos{' '}
                <a href={createPageUrl('TermosDeUso')} className="underline">Termos de Uso</a>
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
                      <p className="font-semibold text-slate-800 text-sm">{getAnonymizedTitle(startup, index)}</p>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs mt-1">
                        {startup.match_percentage}% match
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-800">R$ {valorPorStartup.toFixed(2).replace('.', ',')}</p>
                </div>
              ))}

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotal ({quantidadeSelecionada} {quantidadeSelecionada === 1 ? 'solução' : 'soluções'})</span>
                  <span className="text-slate-900">R$ {(quantidadeSelecionada * valorPorStartup).toFixed(2).replace('.', ',')}</span>
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
                  <span className="text-emerald-600">R$ {valorFinal.toFixed(2).replace('.', ',')}</span>
                </div>
                {quantidadeSelecionada === 1 && primeiraGratis && (
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