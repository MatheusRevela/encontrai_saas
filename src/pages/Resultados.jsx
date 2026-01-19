import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Transacao, Startup } from '@/entities/all';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowRight,
  Clock, // Kept for insight icon
  AlertCircle, // Kept for error state
  Tag, // New for category
  Sparkles, // New for advice/insight header
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion'; // Added for animations
import BuscaLoadingAnimation from '../components/common/BuscaLoadingAnimation';
import BuscaInterativa from '../components/busca/BuscaInterativa';
import FiltrosAvancados from '../components/busca/FiltrosAvancados';
import { buildMatchingPrompt, buildMatchingJsonSchema } from '../components/utils/promptBuilder';

export default function Resultados() {
  const [transacao, setTransacao] = useState(null);
  const [startupsSugeridas, setStartupsSugeridas] = useState([]);
  const [startupsOriginais, setStartupsOriginais] = useState([]);
  const [selectedStartups, setSelectedStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarBuscaInterativa, setMostrarBuscaInterativa] = useState(false);
  const [analiseEnriquecida, setAnaliseEnriquecida] = useState(null);
  const [filtros, setFiltros] = useState({
    categorias: [],
    verticais: [],
    modelosNegocio: [],
    matchMinimo: 50
  });
  const navigate = useNavigate();

  const sessionId = new URLSearchParams(window.location.search).get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      navigate(createPageUrl('Buscar'));
      return;
    }
    loadTransacao();
  }, [sessionId, navigate]);

  const loadTransacao = async () => {
    try {
      const transacoes = await Transacao.filter({ session_id: sessionId });
      if (transacoes.length === 0) {
        setError('Transação não encontrada.');
        setIsLoading(false);
        return;
      }

      const currentTransacao = transacoes[0];
      setTransacao(currentTransacao);

      // If suggestions already exist, use them
      if (currentTransacao.startups_sugeridas?.length > 0) {
        setStartupsSugeridas(currentTransacao.startups_sugeridas);
        setStartupsOriginais(currentTransacao.startups_sugeridas);
        // Also load previously selected startups if any
        if (currentTransacao.startups_selecionadas?.length > 0) {
            setSelectedStartups(currentTransacao.startups_selecionadas);
        }
        setIsLoading(false);
        return;
      }

      // Oferecer busca interativa para refinar
      setMostrarBuscaInterativa(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar transação:', error);
      setError('Erro ao carregar dados da busca.');
      setIsLoading(false);
    }
  };

  const handleAnaliseCompleta = async (dadosAnalise) => {
    setMostrarBuscaInterativa(false);
    setAnaliseEnriquecida(dadosAnalise);
    await gerarSugestoes(transacao, dadosAnalise);
  };

  const gerarSugestoes = async (currentTransacao, dadosAnalise = null) => {
    try {
      setIsLoading(true);

      // Fetch all active startups
      const todasStartups = await Startup.filter({ ativo: true });

      if (todasStartups.length === 0) {
        throw new Error('Nenhuma startup ativa encontrada na base de dados.');
      }

      const problemaCompleto = dadosAnalise?.problemCompleto || currentTransacao.dor_relatada;
      const insights = dadosAnalise?.insights || [];
      const filtrosIA = dadosAnalise?.filtros || {};
      const perfilCliente = dadosAnalise?.perfilCliente || currentTransacao.perfil_cliente || 'pessoa_fisica';

      // Build intelligent prompt with enriched context
      const prompt = buildMatchingPrompt(
        problemaCompleto,
        todasStartups,
        perfilCliente,
        insights,
        filtrosIA
      );

      console.log('🔍 Executando matching inteligente...');

      // Call AI with improved prompt
      const matchingResult = await InvokeLLM({
        prompt,
        response_json_schema: buildMatchingJsonSchema()
      });

      if (!matchingResult.matches || matchingResult.matches.length === 0) {
        throw new Error('IA não conseguiu encontrar matches adequados.');
      }

      // Enrich data with complete startup information
      const startupsEnriquecidas = await Promise.all(
        matchingResult.matches.map(async (match) => {
          const startupCompleta = todasStartups.find(s => s.id === match.startup_id);
          if (!startupCompleta) {
            console.warn(`Startup ${match.startup_id} não encontrada`);
            return null;
          }

          return {
            startup_id: startupCompleta.id,
            nome: startupCompleta.nome,
            descricao: startupCompleta.descricao,
            categoria: startupCompleta.categoria,
            vertical_atuacao: startupCompleta.vertical_atuacao,
            site: startupCompleta.site || null,
            logo_url: startupCompleta.logo_url || null,
            preco_base: startupCompleta.preco_base || null,
            match_percentage: Math.round(match.match_percentage),
            resumo_personalizado: match.resumo_personalizado,
            pontos_fortes: match.pontos_fortes || [],
            como_resolve: match.como_resolve || '',
            beneficios_tangiveis: match.beneficios_tangiveis || [],
            implementacao_estimada: match.implementacao_estimada || '1-2 semanas'
          };
        })
      );

      // Remove null matches
      const matchesValidos = startupsEnriquecidas.filter(Boolean);

      if (matchesValidos.length === 0) {
        throw new Error('Nenhum match válido foi encontrado.');
      }

      // Save to transaction
      await Transacao.update(currentTransacao.id, {
        startups_sugeridas: matchesValidos,
        insight_gerado: matchingResult.insight_geral || 'Análise realizada com base no seu perfil e necessidades específicas.',
        perfil_cliente: perfilCliente
      });

      setStartupsSugeridas(matchesValidos);
      setStartupsOriginais(matchesValidos);
      console.log(`✅ ${matchesValidos.length} startups encontradas com sucesso`);

    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      setError(`Erro no matching: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStartupSelection = (startupId) => {
    try {
      setSelectedStartups(prev => {
        const newSelection = prev.includes(startupId) 
          ? prev.filter(id => id !== startupId)
          : prev.length >= 5 
            ? prev 
            : [...prev, startupId];
        
        console.log('Seleção atualizada:', newSelection.length, 'startups');
        return newSelection;
      });
    } catch (error) {
      console.error('Erro ao selecionar startup:', error);
      alert('Erro ao selecionar startup. Tente novamente.');
    }
  };

  const handleProceedToCheckout = async () => {
    if (selectedStartups.length === 0) {
      alert('Selecione pelo menos uma startup para continuar.');
      return;
    }

    try {
      const startupsCompletas = startupsSugeridas.filter(s =>
        selectedStartups.includes(s.startup_id)
      );

      const valorTotal = selectedStartups.length === 5 
        ? 22.00 
        : selectedStartups.length * (transacao?.valor_por_startup || 5.00);

      console.log('Procedendo para checkout:', {
        quantidade: selectedStartups.length,
        valorTotal,
        startupsCompletas: startupsCompletas.length
      });

      await Transacao.update(transacao.id, {
        startups_selecionadas: selectedStartups,
        quantidade_selecionada: selectedStartups.length,
        valor_total: valorTotal,
        startups_detalhadas: startupsCompletas
      });

      navigate(createPageUrl(`Checkout?sessionId=${sessionId}`));
    } catch (error) {
      console.error('Erro ao prosseguir para checkout:', error);
      alert(`Erro ao prosseguir: ${error.message}`);
    }
  };

  // Memoize insight and startups for rendering
  const insight = useMemo(() => transacao?.insight_gerado || '', [transacao?.insight_gerado]);
  
  // Apply filters to startups
  const enrichedStartups = useMemo(() => {
    let resultado = [...startupsSugeridas];

    // Filter by categories
    if (filtros.categorias.length > 0) {
      resultado = resultado.filter(s => filtros.categorias.includes(s.categoria));
    }

    // Filter by verticals
    if (filtros.verticais.length > 0) {
      resultado = resultado.filter(s => filtros.verticais.includes(s.vertical_atuacao));
    }

    // Filter by business models
    if (filtros.modelosNegocio.length > 0) {
      resultado = resultado.filter(s => {
        const startupCompleta = startupsOriginais.find(so => so.startup_id === s.startup_id);
        return startupCompleta && filtros.modelosNegocio.includes(startupCompleta.modelo_negocio);
      });
    }

    // Filter by minimum match
    resultado = resultado.filter(s => s.match_percentage >= filtros.matchMinimo);

    return resultado;
  }, [startupsSugeridas, filtros, startupsOriginais]);

  const anonymizeName = (name) => {
      // Fallback para caso o nome da startup vaze no texto da IA
      return name.replace(/\[([^\]]+)\]/g, 'Esta solução'); // Specific regex to catch names like [Startup X]
  };

  if (isLoading) {
    return <BuscaLoadingAnimation />;
  }

  if (mostrarBuscaInterativa && transacao) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Vamos refinar sua busca
            </h1>
            <p className="text-slate-600">
              Responda algumas perguntas rápidas para encontrar as soluções perfeitas
            </p>
          </div>
          <BuscaInterativa
            problemInicial={transacao.dor_relatada}
            onAnaliseCompleta={handleAnaliseCompleta}
          />
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erro na Busca</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => navigate(createPageUrl('Buscar'))} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Soluções Encontradas
          </h1>
          
          {/* 🎁 DESTAQUE DO BUNDLE */}
          {enrichedStartups.length === 5 && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-full px-6 py-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-purple-800">
                Desbloqueie as 5 soluções por R$ 22,00 (economize R$ 3,00!)
              </span>
            </div>
          )}
        </div>

        {/* Insight da IA */}
        {insight && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-slate-900">Um conselho para você</h3>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {insight}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {enrichedStartups.map((startup, index) => {
            const isSelected = selectedStartups.includes(startup.startup_id);
            // In this implementation, the `startup` object itself contains all the recommendation details
            // so `recomendacao` is just an alias for `startup`
            const recomendacao = startup;

            return (
              <motion.div
                key={startup.startup_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`transition-all duration-300 border-2 ${isSelected ? 'border-emerald-500 shadow-xl' : 'border-transparent hover:shadow-lg'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Checkbox
                        id={`startup-${startup.startup_id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleStartupSelection(startup.startup_id)}
                        className="h-6 w-6 rounded-md self-start mt-1"
                        aria-label={`Selecionar ${startup.nome}`}
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                              Solução #{index + 1}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                                {recomendacao?.match_percentage}% match
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {recomendacao?.categoria}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {recomendacao?.implementacao_estimada}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            <p className="text-2xl font-bold text-emerald-600">
                              R$ {(transacao?.valor_por_startup || 5.00)?.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-xs text-slate-500">para desbloquear</p>
                          </div>
                        </div>

                        <p className="text-slate-700 mb-4">
                          {anonymizeName(recomendacao?.resumo_personalizado)}
                        </p>

                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger className="text-sm font-semibold text-emerald-700 hover:no-underline">
                              Ver detalhes completos da solução
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                                {recomendacao?.pontos_fortes?.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                      <span className="text-emerald-600">✓</span> Pontos Fortes
                                    </h4>
                                    <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                                      {recomendacao.pontos_fortes.map((ponto, i) => (
                                        <li key={i}>{anonymizeName(ponto)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {recomendacao?.como_resolve && (
                                  <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                      <span className="text-blue-600">⚙️</span> Como Resolve Seu Problema
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                      {anonymizeName(recomendacao.como_resolve)}
                                    </p>
                                  </div>
                                )}

                                {recomendacao?.beneficios_tangiveis?.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                      <span className="text-purple-600">🎯</span> Benefícios Esperados
                                    </h4>
                                    <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                                      {recomendacao.beneficios_tangiveis.map((beneficio, i) => (
                                        <li key={i}>{anonymizeName(beneficio)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {recomendacao.descricao && (
                                  <div>
                                    <h4 className="font-semibold text-slate-800 mb-2">Sobre a Solução</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{recomendacao.descricao}</p>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Action Bar - ATUALIZADO COM BUNDLE */}
        {selectedStartups.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm shadow-lg border-t border-slate-200 z-50">
            <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {selectedStartups.length} {selectedStartups.length === 1 ? 'solução selecionada' : 'soluções selecionadas'}
                </div>
                <div className="text-sm text-slate-600">
                  {selectedStartups.length === 5 ? (
                    <>
                      <span className="line-through text-slate-400">R$ 25,00</span>
                      {' '}
                      <span className="text-emerald-600 font-bold">R$ 22,00</span>
                      {' '}
                      <span className="text-purple-600">(economize R$ 3,00!)</span>
                    </>
                  ) : (
                    <>Total: R$ {((selectedStartups.length * (transacao?.valor_por_startup || 5.00)).toFixed(2) || '0.00').replace('.', ',')}</>
                  )}
                  {selectedStartups.length > 0 && <span className="block text-emerald-600 font-semibold mt-1">🎁 Primeira solução grátis (desconto no checkout)</span>}
                </div>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                disabled={selectedStartups.length === 0}
                size="lg"
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Prosseguir para o Pagamento
              </Button>
            </div>
          </div>
        )}

        {enrichedStartups.length === 0 && !isLoading && !error && (
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mt-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhuma solução encontrada</h3>
            <p className="text-slate-600 mb-4">
              Não conseguimos encontrar soluções ideais com base na sua descrição.
              Tente refinar sua busca ou entre em contato para um atendimento personalizado.
            </p>
            <Button onClick={() => navigate(createPageUrl('Buscar'))} variant="outline">
              Nova Busca
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}