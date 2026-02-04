import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Mail, Phone, Globe, Star, Rocket, Building2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import StartupsSimilares from '../components/startups/StartupsSimilares';

export default function Sucesso() {
  const navigate = useNavigate();
  const sessionId = new URLSearchParams(window.location.search).get('sessionId');

  const [tentativas, setTentativas] = React.useState(0);

  const { data: transacao, isLoading, error, refetch } = useQuery({
    queryKey: ['sucesso', sessionId, tentativas],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Sessão não encontrada');
      }

      const transacoes = await base44.entities.Transacao.filter({ session_id: sessionId });
      if (transacoes.length === 0) {
        throw new Error('Transação não encontrada');
      }

      const transacaoAtual = transacoes[0];
      
      // Se não está pago ainda, tentar verificar o status no Mercado Pago
      if (transacaoAtual.status_pagamento !== 'pago') {
        // Dar tempo para o webhook processar (até 3 tentativas com 3s de intervalo)
        if (tentativas < 3) {
          // Aguardar 3 segundos e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 3000));
          setTentativas(prev => prev + 1);
          throw new Error('Verificando pagamento...');
        }
        
        // Após 3 tentativas, tentar verificar manualmente via API
        try {
          const { data: statusResult } = await base44.functions.invoke('checkPaymentStatus', {
            sessionId: sessionId
          });
          
          if (statusResult?.status === 'pago') {
            // Recarregar dados da transação
            const transacoesAtualizadas = await base44.entities.Transacao.filter({ session_id: sessionId });
            if (transacoesAtualizadas.length > 0 && transacoesAtualizadas[0].status_pagamento === 'pago') {
              return transacoesAtualizadas[0];
            }
          }
        } catch (checkError) {
          console.error('Erro ao verificar status:', checkError);
        }
        
        // Se ainda não está pago, redirecionar para checkout
        navigate(createPageUrl(`Checkout?sessionId=${sessionId}`));
        throw new Error('Pagamento pendente');
      }

      return transacaoAtual;
    },
    enabled: !!sessionId,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {tentativas > 0 ? `Verificando pagamento (tentativa ${tentativas}/3)...` : 'Carregando suas soluções...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <p className="text-red-600 mb-4">{error?.message || 'Erro ao carregar dados'}</p>
            <Link to={createPageUrl('MinhasBuscas')}>
              <Button variant="outline">Voltar às Minhas Buscas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transacao?.startups_desbloqueadas?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <p className="text-amber-600 mb-4">Nenhuma solução desbloqueada encontrada.</p>
            <Link to={createPageUrl('MinhasBuscas')}>
              <Button variant="outline">Voltar às Minhas Buscas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de Sucesso */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🎉 Parabéns! Suas Soluções Estão Desbloqueadas</h1>
          <p className="text-slate-600 text-lg">Os contatos estão disponíveis abaixo e também foram enviados para <strong>{transacao.cliente_email}</strong></p>
        </motion.div>

        {/* 🚀 PRÓXIMOS PASSOS - DESTAQUE NO TOPO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-emerald-300 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="w-7 h-7 text-emerald-600" />
                O Que Fazer Agora?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-slate-700">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Entre em contato AGORA</h4>
                      <p className="text-sm">Use os botões de WhatsApp abaixo para conversar diretamente com cada startup.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Solicite uma demonstração</h4>
                      <p className="text-sm">Peça para ver como a solução funciona com seu tipo de problema específico.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Compare as opções</h4>
                      <p className="text-sm">Avalie preços, funcionalidades e suporte antes de decidir.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">4</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Volte aqui depois</h4>
                      <p className="text-sm">Esses contatos ficarão salvos em "Minhas Buscas" para sempre!</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Soluções Desbloqueadas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Soluções Desbloqueadas</h2>
          <div className="space-y-6">
            {transacao.startups_desbloqueadas.map((startup, index) => (
              <motion.div
                key={startup.startup_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="bg-white shadow-lg border-0">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                          {startup.logo_url ? (
                            <img 
                              src={startup.logo_url} 
                              alt={`Logo ${startup.nome}`}
                              className="w-14 h-14 object-contain rounded-xl"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <Building2 
                            className="w-8 h-8 text-emerald-600" 
                            style={{ display: startup.logo_url ? 'none' : 'flex' }}
                          />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{startup.nome}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge className="bg-slate-100 text-slate-700">{startup.categoria}</Badge>
                            {startup.vertical_atuacao && (
                              <Badge className="bg-blue-100 text-blue-700">{startup.vertical_atuacao}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {startup.preco_base && (
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Investimento</p>
                          <p className="text-lg font-bold text-emerald-600">{startup.preco_base}</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <p className="text-slate-700 leading-relaxed">{startup.descricao}</p>
                    </div>

                    {/* 📱 BOTÕES DE CONTATO DIRETO COM WHATSAPP EM DESTAQUE */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                        <Phone className="w-6 h-6 text-green-600" />
                        Entre em Contato Agora:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {startup.whatsapp && (
                          <a 
                            href={`https://wa.me/${startup.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Encontrei vocês no EncontrAI e gostaria de saber mais sobre como vocês podem me ajudar com: ${transacao.dor_relatada.substring(0, 100)}...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                          >
                            <Phone className="w-5 h-5" />
                            Enviar WhatsApp
                          </a>
                        )}
                        
                        {startup.email && (
                          <a 
                            href={`mailto:${startup.email}?subject=${encodeURIComponent('Encontrei vocês no EncontrAI')}&body=${encodeURIComponent(`Olá,\n\nEncontrei vocês no EncontrAI e gostaria de saber mais sobre como podem me ajudar.\n\nMeu desafio: ${transacao.dor_relatada}\n\nAguardo retorno!`)}`}
                            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                          >
                            <Mail className="w-5 h-5" />
                            Enviar Email
                          </a>
                        )}

                        {startup.site && (
                          <a 
                            href={startup.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                          >
                            <Globe className="w-5 h-5" />
                            Visitar Site
                          </a>
                        )}

                        {startup.linkedin && (
                          <a 
                            href={startup.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                          >
                            <ExternalLink className="w-5 h-5" />
                            Ver LinkedIn
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Startups Similares */}
                    <div className="mt-6">
                      <StartupsSimilares
                        startupOriginal={startup}
                        transacaoId={transacao.id}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 💰 UPSELL - Precisa de mais soluções? */}
        {transacao.startups_sugeridas && transacao.startups_sugeridas.length > transacao.startups_desbloqueadas.length && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Ainda ficou com dúvida? Desbloqueie mais soluções!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 mb-4">
                  Você viu {transacao.startups_sugeridas.length} soluções e desbloqueou {transacao.startups_desbloqueadas.length}. 
                  Que tal comparar com mais opções?
                </p>
                <Link to={createPageUrl(`Resultados?sessionId=${transacao.session_id}`)}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Ver Outras Soluções Disponíveis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Seção de Avaliação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-2xl p-8 text-center"
        >
          <Star className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Que tal avaliar sua experiência?</h3>
          <p className="text-slate-600 mb-6">Sua opinião nos ajuda a melhorar e ajuda outros empreendedores</p>
          <Link to={createPageUrl(`Feedback?id=${transacao.id}&sessionId=${transacao.session_id}`)}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3">
              <Star className="w-5 h-5 mr-2" />
              Avaliar Experiência
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}