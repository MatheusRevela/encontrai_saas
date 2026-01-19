import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Lock, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle, 
  Building2,
  Loader2,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { FeedbackSimilaridade } from '@/entities/all';
import { motion, AnimatePresence } from 'framer-motion';

export default function StartupsSimilares({ startupOriginal, transacaoId }) {
  const [similares, setSimilares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPago, setIsPago] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [feedbacks, setFeedbacks] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [selectedSimilares, setSelectedSimilares] = useState([]);

  useEffect(() => {
    carregarSimilares();
  }, [startupOriginal.startup_id, transacaoId]);

  const carregarSimilares = async () => {
    try {
      setIsLoading(true);
      const { data: result } = await base44.functions.invoke('gerarStartupsSimilares', {
        startup_id: startupOriginal.startup_id,
        transacao_id: transacaoId
      });

      if (result.similares) {
        setSimilares(result.similares);
        setIsPago(result.pago || false);
      }

      // Carregar feedbacks existentes
      const feedbacksExistentes = await FeedbackSimilaridade.filter({
        transacao_id: transacaoId,
        startup_original_id: startupOriginal.startup_id
      });

      const feedbacksMap = {};
      feedbacksExistentes.forEach(fb => {
        feedbacksMap[fb.startup_similar_id] = fb.tipo_feedback;
      });
      setFeedbacks(feedbacksMap);

      // Auto-selecionar todas se ainda não pagou
      if (!result.pago && result.similares) {
        setSelectedSimilares(result.similares.map(s => s.startup_id));
      }

    } catch (error) {
      console.error('Erro ao carregar similares:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSimilarSelection = (similarId) => {
    setSelectedSimilares(prev => 
      prev.includes(similarId) 
        ? prev.filter(id => id !== similarId)
        : [...prev, similarId]
    );
  };

  const handlePagarSimilares = async () => {
    if (selectedSimilares.length === 0) {
      alert('Selecione pelo menos uma startup similar para desbloquear.');
      return;
    }

    try {
      setProcessandoPagamento(true);
      const { data: result } = await base44.functions.invoke('pagarStartupsSimilares', {
        transacao_id: transacaoId,
        startup_original_id: startupOriginal.startup_id,
        similares_selecionadas: selectedSimilares
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const handleFeedback = async (similarId, tipoFeedback) => {
    try {
      // Salvar feedback
      await FeedbackSimilaridade.create({
        transacao_id: transacaoId,
        startup_original_id: startupOriginal.startup_id,
        startup_similar_id: similarId,
        tipo_feedback: tipoFeedback,
        comentario: comentarios[similarId] || ''
      });

      setFeedbacks(prev => ({ ...prev, [similarId]: tipoFeedback }));
      setComentarios(prev => ({ ...prev, [similarId]: '' }));
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-slate-600">Analisando startups similares...</p>
        </CardContent>
      </Card>
    );
  }

  if (!similares || similares.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Startups Similares a {startupOriginal.nome}
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Encontramos {similares.length} startup{similares.length > 1 ? 's' : ''} com características semelhantes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPago && (
          <div className="bg-white rounded-xl p-6 border-2 border-purple-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-lg mb-2">
                  Selecione as Alternativas que Deseja Desbloquear
                </h4>
                <p className="text-slate-600 mb-4">
                  Escolha quantas startups similares você quer ver os contatos completos (R$ 4,00 cada)
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    {selectedSimilares.length > 0 ? (
                      <>
                        <p className="text-3xl font-bold text-purple-600">
                          R$ {(selectedSimilares.length * 4).toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-sm text-slate-500">
                          {selectedSimilares.length} startup{selectedSimilares.length > 1 ? 's' : ''} selecionada{selectedSimilares.length > 1 ? 's' : ''} × R$ 4,00
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Selecione as startups abaixo para ver o valor total
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handlePagarSimilares}
                    disabled={processandoPagamento || selectedSimilares.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
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
        )}

        <div className="space-y-4">
          {similares.map((similar, index) => (
            <motion.div
              key={similar.startup_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative ${!isPago ? 'border-2 border-purple-200' : ''} ${!isPago && selectedSimilares.includes(similar.startup_id) ? 'border-purple-500 bg-purple-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {!isPago && (
                      <div className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={selectedSimilares.includes(similar.startup_id)}
                          onChange={() => toggleSimilarSelection(similar.startup_id)}
                          className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </div>
                    )}
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {similar.logo_url && isPago ? (
                        <img src={similar.logo_url} alt="" className="w-14 h-14 object-contain" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900">
                            Solução Similar #{index + 1}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {similar.categoria}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              {similar.similaridade_score}% similar
                            </Badge>
                          </div>
                        </div>
                        {!isPago && (
                          <Lock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3">
                        {similar.resumo_match}
                      </p>

                      {isPago && similar.descricao && (
                        <p className="text-sm text-slate-700 mb-3 bg-slate-50 p-3 rounded-lg">
                          <strong>Sobre a solução:</strong> {similar.descricao}
                        </p>
                      )}

                      {isPago && (
                        <>
                          {/* Razões de similaridade */}
                          {similar.razoes_similaridade && (
                            <div className="bg-purple-50 rounded-lg p-3 mb-3">
                              <p className="text-xs font-semibold text-purple-900 mb-2">Por que é similar:</p>
                              <ul className="text-xs text-purple-800 space-y-1">
                                {similar.razoes_similaridade.map((razao, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{razao}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Contatos */}
                          <div className="bg-slate-50 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Contatos:</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {similar.email && (
                                <a href={`mailto:${similar.email}`} className="text-blue-600 hover:underline">
                                  {similar.email}
                                </a>
                              )}
                              {similar.whatsapp && (
                                <a 
                                  href={`https://wa.me/${similar.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:underline"
                                >
                                  WhatsApp
                                </a>
                              )}
                              {similar.site && (
                                <a 
                                  href={similar.site}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:underline"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Feedback */}
                          <div className="border-t pt-3">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Esta sugestão foi útil?</p>
                            {feedbacks[similar.startup_id] ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                <p className="text-xs text-green-800">
                                  ✓ Obrigado pelo feedback! Isso nos ajuda a melhorar.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleFeedback(similar.startup_id, 'interessante')}
                                  >
                                    <ThumbsUp className="w-4 h-4 mr-1" />
                                    Interessante
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleFeedback(similar.startup_id, 'ja_conheco')}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Já conheço
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleFeedback(similar.startup_id, 'nao_relevante')}
                                  >
                                    <ThumbsDown className="w-4 h-4 mr-1" />
                                    Não relevante
                                  </Button>
                                </div>
                                <Textarea
                                  placeholder="Comentário opcional..."
                                  value={comentarios[similar.startup_id] || ''}
                                  onChange={(e) => setComentarios(prev => ({ 
                                    ...prev, 
                                    [similar.startup_id]: e.target.value 
                                  }))}
                                  rows={2}
                                  className="text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </>
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