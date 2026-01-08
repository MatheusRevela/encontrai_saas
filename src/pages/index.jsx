import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Target, 
  ArrowRight, 
  Star,
  Users,
  Brain,
  MessageCircle,
  Building2,
  Sparkles,
  Rocket,
  Heart,
  Zap,
  Shield,
  Clock,
  Award,
  TrendingUp,
  CheckCircle,
  Gift
} from 'lucide-react';

export default function LandingPage() {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            localStorage.setItem('referral_code', refCode);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    // MÉTODO SIMPLES E DIRETO - vai para o login do Base44
    const handleLogin = () => {
        window.location.href = '/login';
    };

    const feedbacks = [
        { id: 'static1', cliente_nome: 'Maria Silva', feedback: 'Encontrei a solução perfeita para automatizar meu e-commerce. Economizei 15 horas por semana!', avaliacao: 5, dor_relatada: 'Automação de vendas' },
        { id: 'static2', cliente_nome: 'João Santos', feedback: 'A IA me conectou com startups que nem sabia que existiam. Problema de logística resolvido!', avaliacao: 5, dor_relatada: 'Otimização de entregas' },
        { id: 'static3', cliente_nome: 'Ana Costa', feedback: 'Impressionante como a plataforma entendeu exatamente o que eu precisava. A primeira solução já deu resultado.', avaliacao: 5, dor_relatada: 'Gestão financeira PME' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Hero Section */}
            <section className="pt-20 pb-24">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-6 px-4 py-2">✨ Primeira solução completamente gratuita</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">Encontre as <span className="text-emerald-600"> melhores startups</span> <br />para seus desafios</h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12">Nossa IA analisa seu problema e conecta você com as soluções mais adequadas do ecossistema brasileiro. Rápido, inteligente e eficaz.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all" onClick={handleLogin}>
                            <Brain className="w-6 h-6 mr-2" />
                            Começar com IA
                        </Button>
                        <Button size="lg" variant="outline" className="text-lg px-8 py-4 rounded-xl border-2 border-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all" onClick={handleLogin}>
                            <Search className="w-6 h-6 mr-2" />
                            Busca Rápida
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {[
                            { number: '500+', label: 'Empresários Atendidos', icon: Users }, 
                            { number: '+400', label: 'Startups Verificadas', icon: Building2 }, 
                            { number: '95%', label: 'Taxa de Sucesso', icon: Target }, 
                            { number: '+1 mil', label: 'Buscas Realizadas', icon: Search }
                        ].map((stat) => { 
                            const Icon = stat.icon; 
                            return (
                                <div key={stat.label} className="text-center">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Icon className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 mb-1">{stat.number}</div>
                                    <div className="text-sm text-slate-600">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Como Funciona */}
            <section className="py-20 bg-white/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Como funciona?</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">Em 3 passos simples, você conecta com as startups que vão resolver seus desafios</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '1', title: 'Conte seu desafio', desc: 'Descreva qual problema você precisa resolver - nossa IA vai entender perfeitamente', icon: MessageCircle, color: 'emerald' },
                            { step: '2', title: 'Receba sugestões', desc: 'Nossa IA analisa +400 startups e seleciona as 5 com maior % de match', icon: Brain, color: 'blue' },
                            { step: '3', title: 'Conecte-se', desc: 'Escolha as startups, pague apenas pelas que quiser e receba o contato direto', icon: Rocket, color: 'purple' }
                        ].map((item) => {
                            const Icon = item.icon;
                            const colorClasses = {
                                emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
                                blue: 'bg-blue-100 text-blue-600 border-blue-200', 
                                purple: 'bg-purple-100 text-purple-600 border-purple-200'
                            };
                            return (
                                <Card key={item.step} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-8 text-center">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${colorClasses[item.color]} border-2`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div className="text-4xl font-bold text-slate-300 mb-2">{item.step}</div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                        <p className="text-slate-600">{item.desc}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Depoimentos */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">O que dizem nossos usuários</h2>
                        <p className="text-xl text-slate-600">Empresários reais, resultados reais</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {feedbacks.map((item, index) => (
                            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 mb-6 italic">"{item.feedback}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold">{item.cliente_nome.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{item.cliente_nome}</div>
                                            <div className="text-sm text-slate-600">{item.dor_relatada}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Por que escolher */}
            <section className="py-20 bg-white/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Por que escolher o EncontrAI?</h2>
                        <p className="text-xl text-slate-600">A forma mais inteligente de encontrar soluções</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'IA Especializada', desc: 'Algoritmo treinado especificamente para matching de startups brasileiras', icon: Brain },
                            { title: 'Startups Verificadas', desc: 'Todas as startups passam por processo de verificação e validação', icon: Shield },
                            { title: 'Pagamento Justo', desc: 'Pague apenas pelas startups que escolher desbloquear', icon: Heart },
                            { title: 'Resultados Rápidos', desc: 'Encontre soluções em minutos, não em meses de pesquisa', icon: Zap },
                            { title: 'Suporte Especializado', desc: 'Equipe especializada para te ajudar em todo o processo', icon: Award },
                            { title: 'Primeira Gratuita', desc: 'Sua primeira solução desbloqueada é completamente gratuita', icon: Gift },
                            { title: 'Taxa de Sucesso', desc: '95% dos usuários encontram pelo menos uma solução adequada', icon: TrendingUp },
                            { title: 'Disponível 24/7', desc: 'Plataforma disponível a qualquer hora, qualquer dia', icon: Clock }
                        ].map((benefit, index) => {
                            const Icon = benefit.icon;
                            return (
                                <div key={index} className="text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Icon className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                                    <p className="text-sm text-slate-600">{benefit.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronto para encontrar sua próxima solução?</h2>
                    <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">Junte-se a centenas de empreendedores que já transformaram seus negócios com as startups certas</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button size="lg" className="bg-white text-emerald-600 hover:bg-slate-50 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all" onClick={handleLogin}>
                            <Sparkles className="w-6 h-6 mr-2" />
                            Começar Agora - É Grátis
                            <ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                        <Link to={createPageUrl("lp")}>
                            <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4 rounded-xl transition-all">
                                Saber Mais
                            </Button>
                        </Link>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-emerald-500/30">
                        {[
                            { icon: CheckCircle, text: 'Primeira solução gratuita' },
                            { icon: Shield, text: 'Startups verificadas' },
                            { icon: Zap, text: 'Resultados em minutos' }
                        ].map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="flex items-center gap-2 text-emerald-100">
                                    <Icon className="w-5 h-5" />
                                    <span>{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}