import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Send, AlertCircle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import APP_CONFIG from '@/components/utils/config';

export default function Feedback() {
  const [transacao, setTransacao] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadTransacao = async () => {
      const params = new URLSearchParams(window.location.search);
      const transactionId = params.get('id');

      if (!transactionId) {
        setError('ID da busca não encontrado na URL.');
        setIsLoading(false);
        return;
      }

      try {
        const transacaoEncontrada = await base44.entities.Transacao.get(transactionId);
        
        if (!transacaoEncontrada) {
          setError('Busca não encontrada ou você não tem permissão para acessá-la.');
          setIsLoading(false);
          return;
        }

        if (transacaoEncontrada.avaliacoes_individuais && transacaoEncontrada.avaliacoes_individuais.length > 0) {
          setError('Você já avaliou esta busca.');
          setIsLoading(false);
          return;
        }
        
        setTransacao(transacaoEncontrada);
        
        // Inicializar avaliações individuais
        const startupsDesbloqueadas = transacaoEncontrada.startups_desbloqueadas || [];
        setAvaliacoes(startupsDesbloqueadas.map(startup => ({
          startup_id: startup.startup_id,
          startup_nome: startup.nome,
          logo_url: startup.logo_url,
          avaliacao: 0,
          feedback: ''
        })));
      } catch (err) {
        console.error('Erro ao carregar transação:', err);
        setError('Ocorreu um erro ao buscar sua transação.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransacao();
  }, []);

  const handleRatingChange = (index, rating) => {
    setAvaliacoes(prev => {
      const updated = [...prev];
      updated[index].avaliacao = rating;
      return updated;
    });
  };

  const handleFeedbackChange = (index, feedback) => {
    setAvaliacoes(prev => {
      const updated = [...prev];
      updated[index].feedback = feedback;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transacao) return;

    // Validar se todas as startups foram avaliadas
    const todasAvaliadas = avaliacoes.every(av => av.avaliacao > 0);
    if (!todasAvaliadas) {
      alert('Por favor, avalie todas as soluções antes de continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular média geral
      const mediaGeral = avaliacoes.reduce((sum, av) => sum + av.avaliacao, 0) / avaliacoes.length;
      
      await base44.entities.Transacao.update(transacao.id, {
        avaliacoes_individuais: avaliacoes,
        avaliacao: Math.round(mediaGeral), // Manter compatibilidade
        feedback: avaliacoes.map(av => av.feedback).filter(f => f.trim()).join(' | ') // Concatenar feedbacks
      });

      navigate(createPageUrl('MinhasBuscas'));
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link to={createPageUrl('MinhasBuscas')}>
            <Button variant="outline">Voltar para Minhas Buscas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Avalie sua experiência</h1>
          <p className="text-slate-600">Avalie cada solução que você desbloqueou. Seu feedback é muito importante!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence>
            {avaliacoes.map((avaliacao, index) => (
              <motion.div
                key={avaliacao.startup_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      {avaliacao.logo_url && (
                        <img 
                          src={avaliacao.logo_url} 
                          alt={avaliacao.startup_nome}
                          className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1"
                        />
                      )}
                      {!avaliacao.logo_url && (
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-emerald-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{avaliacao.startup_nome}</CardTitle>
                        <p className="text-sm text-slate-500">Solução #{index + 1}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Como você avalia esta solução?
                      </label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            onClick={() => handleRatingChange(index, star)}
                            className={`w-10 h-10 cursor-pointer transition-all duration-200 ${
                              avaliacao.avaliacao >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`feedback-${index}`} className="text-sm font-medium text-slate-700 mb-2 block">
                        Comentário sobre esta solução (opcional):
                      </label>
                      <Textarea
                        id={`feedback-${index}`}
                        value={avaliacao.feedback}
                        onChange={(e) => handleFeedbackChange(index, e.target.value)}
                        placeholder="O que você achou desta solução específica?"
                        rows={3}
                        className="focus:ring-emerald-500 border-slate-200"
                        maxLength={500}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to={createPageUrl(`DetalhesBusca?id=${transacao?.id}`)} className="w-full">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting || avaliacoes.some(av => av.avaliacao === 0)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Enviar Avaliações
            </Button>
          </div>
        </form>
      </div>


    </div>
  );
}