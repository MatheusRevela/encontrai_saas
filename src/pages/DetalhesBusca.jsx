
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Transacao } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Star, Loader2, Globe, Mail, Phone } from 'lucide-react';

const ProximosPassosCard = () => (
  <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <Star className="w-6 h-6 text-emerald-600" />
        Próximos Passos Recomendados
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid md:grid-cols-2 gap-6 text-slate-700">
        <div className="space-y-4">
          <div className="flex items-start gap-3"><div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div><div><h4 className="font-semibold text-slate-800">Entre em contato</h4><p className="text-sm">Use os contatos acima para conversar com cada startup.</p></div></div>
          <div className="flex items-start gap-3"><div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div><div><h4 className="font-semibold text-slate-800">Solicite demonstrações</h4><p className="text-sm">Peça para ver como a solução funciona na prática.</p></div></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3"><div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div><div><h4 className="font-semibold text-slate-800">Compare as opções</h4><p className="text-sm">Avalie preços, funcionalidades e suporte oferecido.</p></div></div>
          <div className="flex items-start gap-3"><div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div><div><h4 className="font-semibold text-slate-800">Deixe seu feedback</h4><p className="text-sm">Sua avaliação ajuda a comunidade a encontrar as melhores soluções.</p></div></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DetalhesBusca() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [busca, setBusca] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const transactionId = searchParams.get('id');
    if (!transactionId) {
      setError("ID da busca não fornecido.");
      setIsLoading(false);
      return;
    }

    const loadBusca = async () => {
      setIsLoading(true);
      try {
        const data = await Transacao.get(transactionId);
        if (!data) {
          setError("Busca não encontrada ou você não tem permissão para acessá-la.");
        } else {
          setBusca(data);
        }
      } catch (err) {
        console.error("Erro ao carregar busca:", err);
        setError("Ocorreu um erro ao carregar os detalhes da sua busca.");
      } finally {
        setIsLoading(false);
      }
    };
    loadBusca();
  }, [searchParams]);

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error}</p>
        <Button variant="outline" onClick={() => navigate(createPageUrl('MinhasBuscas'))} className="mt-4">
          Voltar para Minhas Buscas
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('MinhasBuscas'))} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Minhas Buscas
        </Button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Detalhes da sua Busca</h1>
          <p className="text-slate-600">Veja as soluções que você desbloqueou e avalie sua experiência.</p>
        </div>

        {busca.status_pagamento === 'pago' && busca.startups_desbloqueadas?.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Soluções Desbloqueadas</h2>
            <div className="space-y-6">
              {busca.startups_desbloqueadas.map(startup => {
                // Encontrar avaliação individual para esta startup
                const avaliacaoIndividual = busca.avaliacoes_individuais?.find(
                  av => av.startup_id === startup.startup_id
                );

                return (
                  <Card key={startup.startup_id} className="bg-white border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6 mb-6">
                        {startup.logo_url && (
                          <img src={startup.logo_url} alt={`Logo ${startup.nome}`} className="w-24 h-24 rounded-2xl object-contain bg-slate-50 p-2 self-start"/>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-2xl font-bold text-slate-900">{startup.nome}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {startup.categoria && <Badge variant="secondary">{startup.categoria}</Badge>}
                                {startup.vertical_atuacao && <Badge variant="outline">{startup.vertical_atuacao}</Badge>}
                                {startup.modelo_negocio && <Badge variant="outline" className="capitalize">{startup.modelo_negocio}</Badge>}
                              </div>
                              
                              {/* Mostrar avaliação individual se existir */}
                              {avaliacaoIndividual && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-sm text-slate-600">Sua avaliação:</span>
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < avaliacaoIndividual.avaliacao ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {startup.preco_base && (
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-sm text-slate-500 font-medium">Investimento</p>
                                <p className="font-bold text-emerald-600">{startup.preco_base}</p>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-600 mt-4">{startup.descricao}</p>
                          
                          {/* Mostrar feedback individual */}
                          {avaliacaoIndividual && avaliacaoIndividual.feedback && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-sm text-slate-700 italic">"{avaliacaoIndividual.feedback}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-800 mb-4">Contatos:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {startup.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /> <a href={`mailto:${startup.email}`} className="text-blue-600 hover:underline">{startup.email}</a></div>}
                          {startup.whatsapp && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /> <a href={`https://wa.me/${startup.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{startup.whatsapp}</a></div>}
                          {startup.site && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-slate-500" /> <a href={startup.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visitar Site</a></div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <ProximosPassosCard />

            {/* AVALIAÇÃO */}
            {busca.avaliacoes_individuais && busca.avaliacoes_individuais.length > 0 ? (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> Suas Avaliações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-2">Você avaliou {busca.avaliacoes_individuais.length} solução(ões)</p>
                  <p className="text-xs text-slate-500 mt-4">Obrigado pelo seu feedback detalhado!</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-2xl p-8 text-center">
                <Star className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Que tal avaliar sua experiência?</h3>
                <p className="text-slate-600 mb-6">Avalie cada solução individualmente - seu feedback ajuda outros empreendedores!</p>
                <Link to={createPageUrl(`Feedback?id=${busca.id}`)}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3">
                    <Star className="w-5 h-5 mr-2" />
                    Avaliar Soluções
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        ) : (
          <Card className="text-center p-8">
            <h2 className="text-xl font-semibold">Pagamento Pendente</h2>
            <p className="text-slate-600 my-4">Você precisa finalizar o pagamento para ver os detalhes das soluções.</p>
            <Link to={createPageUrl(`Checkout?sessionId=${busca.session_id}`)}>
              <Button>
                <CheckCircle className="w-4 h-4 mr-2" />
                Ir para o Checkout
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
