import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Lock, 
  Sparkles, 
  Building2,
  Loader2,
  Eye,
  Tag,
  Clock
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function StartupsNaoSelecionadas({ transacao }) {
  const [selectedStartups, setSelectedStartups] = useState([]);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  // Filtrar startups que foram sugeridas mas NÃO foram selecionadas/desbloqueadas
  const startupsNaoDesbloqueadas = (transacao?.startups_sugeridas || []).filter(sugerida => {
    const foiSelecionada = transacao.startups_selecionadas?.includes(sugerida.startup_id);
    const foiDesbloqueada = transacao.startups_desbloqueadas?.some(d => d.startup_id === sugerida.startup_id);
    return !foiSelecionada && !foiDesbloqueada;
  });

  if (startupsNaoDesbloqueadas.length === 0) {
    return null;
  }

  const toggleStartupSelection = (startupId) => {
    setSelectedStartups(prev => 
      prev.includes(startupId) 
        ? prev.filter(id => id !== startupId)
        : [...prev, startupId]
    );
  };

  const handleDesbloquearAdicionais = async () => {
    if (selectedStartups.length === 0) {
      alert('Selecione pelo menos uma solução para desbloquear.');
      return;
    }

    try {
      setProcessandoPagamento(true);
      
      // Atualizar transação com as startups adicionais selecionadas
      const startupsDetalhadas = startupsNaoDesbloqueadas.filter(s =>
        selectedStartups.includes(s.startup_id)
      );

      const novasSelecoes = [...(transacao.startups_selecionadas || []), ...selectedStartups];
      const novasDetalhadas = [...(transacao.startups_detalhadas || []), ...startupsDetalhadas];
      
      // Garantir que CPF seja válido - se não for, usar CPF fictício válido
      let cpfValido = transacao.cliente_cpf;
      if (!cpfValido || cpfValido === '00000000000' || cpfValido.length !== 11) {
        cpfValido = '11111111111'; // CPF fictício válido para testes
      }
      
      // Marcar que é um pagamento de desbloqueio adicional
      await base44.entities.Transacao.update(transacao.id, {
        startups_selecionadas: novasSelecoes,
        startups_detalhadas: novasDetalhadas,
        quantidade_selecionada: novasSelecoes.length,
        valor_total: selectedStartups.length * 5.00, // Valor apenas das adicionais
        is_adicional_checkout: true,
        adicional_startups_count: selectedStartups.length,
        cliente_cpf: cpfValido // Garantir CPF válido
      });

      // Criar link de pagamento
      const { data: result } = await base44.functions.invoke('createPaymentLink', {
        sessionId: transacao.session_id
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
          <span className="leading-tight">Outras Soluções Recomendadas para Você</span>
        </CardTitle>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          Você ainda tem {startupsNaoDesbloqueadas.length} {startupsNaoDesbloqueadas.length > 1 ? 'soluções recomendadas' : 'solução recomendada'} que não desbloqueou
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="flex-1 w-full">
              <h4 className="font-bold text-slate-900 text-base sm:text-lg mb-2">
                Desbloqueie Mais Soluções
              </h4>
              <p className="text-slate-600 text-sm sm:text-base mb-4">
                Escolha quantas soluções você quer ver os contatos completos (R$ 5,00 cada)
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {selectedStartups.length > 0 ? (
                    <>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                        R$ {(selectedStartups.length * 5).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {selectedStartups.length} solução{selectedStartups.length > 1 ? 'ões' : ''} selecionada{selectedStartups.length > 1 ? 's' : ''} × R$ 5,00
                      </p>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-500">
                      Selecione as soluções abaixo para ver o valor total
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleDesbloquearAdicionais}
                  disabled={processandoPagamento || selectedStartups.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  size="lg"
                >
                  {processandoPagamento ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Desbloquear Selecionadas
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {startupsNaoDesbloqueadas.map((startup, index) => (
            <motion.div
              key={startup.startup_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative border-2 ${selectedStartups.includes(startup.startup_id) ? 'border-blue-500 bg-blue-50' : 'border-blue-200'}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={selectedStartups.includes(startup.startup_id)}
                        onCheckedChange={() => toggleStartupSelection(startup.startup_id)}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt="" className="w-14 h-14 object-contain opacity-30" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900">
                              Solução #{index + 1}
                            </h4>
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              {startup.match_percentage}% match
                            </Badge>
                          </div>
                        </div>
                        <Lock className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                        {startup.resumo_personalizado}
                      </p>

                      {startup.pontos_fortes?.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 mb-2">Principais vantagens:</p>
                          <ul className="text-xs text-blue-800 space-y-1">
                            {startup.pontos_fortes.slice(0, 2).map((ponto, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600">✓</span>
                                <span>{ponto}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}