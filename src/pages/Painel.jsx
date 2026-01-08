import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Transacao } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Brain,
  History,
  PlusCircle,
  ArrowRight,
  User as UserIcon
} from 'lucide-react';

export default function Painel() {
  const [user, setUser] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        if (userData?.email) {
          const searches = await Transacao.filter({ created_by: userData.email }, '-created_date', 3);
          setRecentSearches(searches || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do painel:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  if (isLoading || !user) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header de Boas-vindas */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Olá, {user.full_name?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Que ótimo ter você aqui! Pronto para encontrar novas soluções para seus desafios?
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link to={createPageUrl("Assistente")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-3">
                  Nova Busca com IA
                </h3>
                <p className="text-emerald-700 mb-4">
                  Use nosso assistente inteligente para uma experiência personalizada
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Começar Busca
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Buscar")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">
                  Busca Rápida
                </h3>
                <p className="text-blue-700 mb-4">
                  Descreva seu desafio e encontre soluções imediatamente
                </p>
                <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  <Search className="w-5 h-5 mr-2" />
                  Buscar Agora
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Minhas Buscas Recentes */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Suas Buscas Recentes</h2>
            <Link to={createPageUrl("MinhasBuscas")}>
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Ver Todas
              </Button>
            </Link>
          </div>

          {recentSearches.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {recentSearches.map((search) => (
                <Card key={search.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`${
                        search.status_pagamento === 'pago' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : search.status_pagamento === 'pendente'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      } border`}>
                        {search.status_pagamento === 'pago' ? 'Pago' : 
                         search.status_pagamento === 'pendente' ? 'Pendente' : 'Processando'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(search.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm mb-4 line-clamp-3">
                      {search.dor_relatada}
                    </p>
                    <Link to={createPageUrl(`DetalhesBusca?id=${search.id}`)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Detalhes
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Ainda não há buscas
                </h3>
                <p className="text-slate-600 mb-6">
                  Comece sua primeira busca para encontrar as soluções ideais para seus desafios.
                </p>
                <Link to={createPageUrl("Assistente")}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Brain className="w-5 h-5 mr-2" />
                    Fazer Primeira Busca
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}