import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Search,
  Zap,
  Shield,
  Gift
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const transacoes = await base44.entities.Transacao.filter({ 
        destaque_home: true,
        avaliacao: { $gte: 4 }
      });
      // Ordenar manualmente e limitar a 6
      const sorted = transacoes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);
      setTestimonials(sorted);
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error);
    }
  };

  const handleNavigate = async (pageName) => {
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(createPageUrl(pageName));
    } else {
      navigate(createPageUrl(pageName));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 mb-6 px-4 py-2 text-sm">
            🚀 +1000 soluções verificadas na nossa base
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Encontre as melhores <span className="text-emerald-600">soluções</span><br />
            para seus desafios
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Nossa IA analisa seu problema e conecta você com as soluções ideais.<br />
            Simples, rápido e direto ao ponto.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <Card 
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100"
              onClick={() => handleNavigate('Assistente')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-3">
                  Nova Busca com IA
                </h3>
                <p className="text-emerald-700 mb-6">
                  Use nosso assistente inteligente para uma experiência personalizada
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Começar Busca
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-100"
              onClick={() => handleNavigate('Buscar')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">
                  Busca Rápida
                </h3>
                <p className="text-blue-700 mb-6">
                  Descreva seu desafio e encontre soluções imediatamente
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Buscar Agora
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Primeira solução grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>100% seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span>Resultados em minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-slate-600">
              3 passos simples para encontrar sua solução ideal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">1</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Descreva seu desafio
                </h3>
                <p className="text-slate-600">
                  Conte qual problema você precisa resolver no seu negócio
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  IA encontra matches
                </h3>
                <p className="text-slate-600">
                  Nossa inteligência artificial analisa e sugere até 5 soluções ideais
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Conecte-se direto
                </h3>
                <p className="text-slate-600">
                  Desbloqueie contatos e fale diretamente com as empresas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  Por que escolher o EncontrAI?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Curadoria especializada</h4>
                      <p className="text-slate-600">Soluções verificadas mensalmente por IA e especialistas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Primeira solução grátis</h4>
                      <p className="text-slate-600">Desbloqueie sua primeira solução sem custo algum</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Matching inteligente</h4>
                      <p className="text-slate-600">IA treinada com milhares de cases de sucesso</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">100% seguro</h4>
                      <p className="text-slate-600">Pagamento via Mercado Pago, dados protegidos</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">R$ 5,00</div>
                  <div className="text-slate-600 mb-6">por solução desbloqueada</div>
                  <div className="space-y-2 text-sm text-slate-600 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Acesso completo aos contatos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Email, WhatsApp, LinkedIn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Informações de preço</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Histórico sempre disponível</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleNavigate('Buscar')}
                  >
                    Começar Agora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-xl text-slate-600">
                Casos reais de quem encontrou soluções pelo EncontrAI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.avaliacao)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 italic">
                      "{testimonial.feedback || 'Excelente plataforma, encontrei exatamente o que precisava!'}"
                    </p>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-slate-900">
                        {testimonial.cliente_nome || 'Cliente EncontrAI'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {testimonial.perfil_cliente === 'pme' ? 'Pequena/Média Empresa' : 'Pessoa Física'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Pronto para encontrar sua solução ideal?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Junte-se a centenas de empresas que já transformaram seus desafios em resultados
          </p>
          <Button 
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700 text-lg px-12 py-6"
            onClick={() => handleNavigate('Assistente')}
          >
            Começar Agora - É Grátis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}