import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Star, Loader2, Globe, Mail, Phone, Sparkles, ExternalLink } from 'lucide-react';
import StartupsNaoSelecionadas from '../components/startups/StartupsNaoSelecionadas';

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
        const data = await base44.entities.Transacao.get(transactionId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl('MinhasBuscas'))} 
          className="mb-6 hover:bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Minhas Buscas
        </Button>
        
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Detalhes da sua Busca
              </h1>
              <p className="text-slate-600 text-lg">Veja as soluções que você desbloqueou e avalie sua experiência</p>
            </div>
          </div>
        </div>

        {busca.status_pagamento === 'pago' && busca.startups_desbloqueadas?.length > 0 ? (
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Soluções Desbloqueadas</h2>
            </div>
            <div className="space-y-8">
              {busca.startups_desbloqueadas.map((startup) => {
                // Encontrar avaliação individual para esta startup
                const avaliacaoIndividual = busca.avaliacoes_individuais?.find(
                  av => av.startup_id === startup.startup_id
                );

                return (
                  <Card key={startup.startup_id} className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
                    <CardContent className="p-0">
                      {/* Header com gradiente sutil */}
                      <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 p-6 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {startup.logo_url && (
                            <div className="relative">
                              <img 
                                src={startup.logo_url} 
                                alt={`Logo ${startup.nome}`} 
                                className="w-24 h-24 rounded-2xl object-contain bg-white p-3 shadow-lg ring-2 ring-emerald-100"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-3">{startup.nome}</h3>
                                <div className="flex flex-wrap gap-2">
                                 {startup.categoria && (
                                   <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1">
                                     {startup.categoria}
                                   </Badge>
                                 )}
                                 {startup.vertical_atuacao && (
                                   <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                                     {startup.vertical_atuacao}
                                   </Badge>
                                 )}
                                 {startup.modelo_negocio && (
                                   <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1 capitalize">
                                     {startup.modelo_negocio}
                                   </Badge>
                                 )}
                                </div>

                                {/* Mostrar avaliação individual se existir */}
                                {avaliacaoIndividual && (
                                 <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
                                   <div className="flex items-center gap-2">
                                     <span className="text-sm font-medium text-amber-900">Sua avaliação:</span>
                                     <div className="flex gap-1">
                                       {[...Array(5)].map((_, i) => (
                                         <Star key={i} className={`w-4 h-4 ${i < avaliacaoIndividual.avaliacao ? 'text-amber-500 fill-amber-500' : 'text-amber-200'}`} />
                                       ))}
                                     </div>
                                   </div>
                                 </div>
                                )}
                                </div>
                                {startup.preco_base && (
                                <div className="text-right flex-shrink-0 ml-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                 <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Investimento</p>
                                 <p className="text-2xl font-bold text-emerald-600">{startup.preco_base}</p>
                                </div>
                                )}
                                </div>
                                </div>
                                </div>
                      
                      <div className="p-6">
                        <p className="text-slate-700 text-base leading-relaxed">{startup.descricao}</p>
                          
                        {/* Mostrar feedback individual */}
                        {avaliacaoIndividual && avaliacaoIndividual.feedback && (
                          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-slate-800 italic leading-relaxed">💬 "{avaliacaoIndividual.feedback}"</p>
                          </div>
                        )}
                        
                        {/* Contatos em destaque */}
                        <div className="mt-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200">
                          <h4 className="font-bold text-slate-900 mb-5 text-lg flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                              <Phone className="w-4 h-4 text-white" />
                            </div>
                            Entre em Contato
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {startup.email && (
                              <a 
                                href={`mailto:${startup.email}`}
                                className="flex items-center gap-3 bg-white p-4 rounded-xl hover:shadow-lg transition-all group border border-slate-200"
                              >
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 font-medium">Email</p>
                                  <p className="text-sm text-slate-900 font-semibold truncate">{startup.email}</p>
                                </div>
                              </a>
                            )}
                            {startup.whatsapp && (
                              <a 
                                href={`https://wa.me/${startup.whatsapp.replace(/\D/g,'')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white p-4 rounded-xl hover:shadow-lg transition-all group border border-slate-200"
                              >
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                  <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 font-medium">WhatsApp</p>
                                  <p className="text-sm text-slate-900 font-semibold truncate">{startup.whatsapp}</p>
                                </div>
                              </a>
                            )}
                            {startup.site && (
                              <a 
                                href={startup.site}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white p-4 rounded-xl hover:shadow-lg transition-all group border border-slate-200"
                              >
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                  <Globe className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 font-medium">Website</p>
                                  <p className="text-sm text-slate-900 font-semibold">Visitar Site</p>
                                </div>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desbloqueios Adicionais */}
            {busca.similares_desbloqueadas && busca.similares_desbloqueadas.length > 0 && (
              <>
                <div className="flex items-center gap-3 mt-12">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Desbloqueios Adicionais</h2>
                </div>
                <div className="space-y-6">
                  {busca.similares_desbloqueadas.map((similar, idx) => 
                    similar.startups_similares?.map((startup) => (
                      <Card key={`${idx}-${startup.startup_id}`} className="bg-white border-0 shadow-lg overflow-hidden">
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
                                </div>
                                {startup.preco_base && (
                                  <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-sm text-slate-500 font-medium">Investimento</p>
                                    <p className="font-bold text-emerald-600">{startup.preco_base}</p>
                                  </div>
                                )}
                              </div>
                              <p className="text-slate-600 mt-4">{startup.descricao}</p>
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
                    ))
                  )}
                </div>
              </>
            )}

            {/* Startups não selecionadas */}
            <StartupsNaoSelecionadas transacao={busca} />
            
            <ProximosPassosCard />

            {/* AVALIAÇÃO */}
            {busca.avaliacoes_individuais && busca.avaliacoes_individuais.length > 0 ? (
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    Suas Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 text-lg mb-2">Você avaliou <span className="font-bold text-amber-600">{busca.avaliacoes_individuais.length}</span> solução(ões)</p>
                  <p className="text-sm text-slate-600 mt-4">✨ Obrigado pelo seu feedback detalhado!</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-emerald-500 to-blue-600 border-0 shadow-2xl rounded-3xl p-10 text-center overflow-hidden relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Que tal avaliar sua experiência?</h3>
                  <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                    Avalie cada solução individualmente - seu feedback ajuda outros empreendedores!
                  </p>
                  <Link to={createPageUrl(`Feedback?id=${busca.id}`)}>
                    <Button className="bg-white text-emerald-600 hover:bg-white/90 text-lg px-10 py-6 rounded-xl shadow-xl font-bold">
                      <Star className="w-5 h-5 mr-2" />
                      Avaliar Soluções
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="text-center p-12 bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-xl rounded-3xl">
            <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Pagamento Pendente</h2>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
              Você precisa finalizar o pagamento para ver os detalhes das soluções.
            </p>
            <Link to={createPageUrl(`Checkout?sessionId=${busca.session_id}`)}>
              <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-lg px-10 py-6 rounded-xl shadow-lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Ir para o Checkout
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}