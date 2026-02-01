import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock, ArrowRight, Building2, Search, Info, Calendar, Sparkles } from 'lucide-react';
import { formatDateBrasiliaShort } from '../components/utils/dateUtils';
import { motion } from 'framer-motion';

const formatSearchDescription = (description) => {
  if (!description) return "Desafio não descrito.";

  let text = description;

  // Extrai a parte principal do desafio, se houver um formato complexo
  if (text.includes(' || ')) {
    text = text.split(' || ')[0].replace('Desafio principal:', '').trim();
  } else if (text.includes("Desafio principal:")) {
    text = text.split("Perfil:")[0].replace("Desafio principal:", "").trim();
  }
  
  // Converte a linguagem para a perspectiva do usuário ("Você")
  text = text
    .replace(/^O cliente desenvolveu/i, "Você desenvolveu")
    .replace(/^O cliente deseja/i, "Você deseja")
    .replace(/^Cliente deseja/i, "Você deseja")
    .replace(/\bO cliente\b/gi, "Você")
    .replace(/\bcliente\b/gi, "você")
    .replace(/\. Ele /gi, ". Você ")
    .replace(/\bEle possui\b/gi, "Você possui")
    .replace(/\bEle tem\b/gi, "Você tem")
    .replace(/\bEle busca\b/gi, "Você busca")
    .replace(/\bEle enfrenta\b/gi, "Você enfrenta")
    .replace(/\bEle não sabe\b/gi, "Você não sabe")
    .replace(/do cliente/gi, "seu")
    .replace(/da cliente/gi, "sua")
    .replace(/no cliente/gi, "em você");

  // Garante que a primeira letra seja maiúscula
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // Limita o texto para aproximadamente 3 linhas (cerca de 300 caracteres)
  if (text.length > 300) {
    const truncatedText = text.substring(0, 300);
    const lastSpace = truncatedText.lastIndexOf(' ');
    return truncatedText.substring(0, lastSpace) + '...';
  }

  return text;
};

const StatusBadge = ({ status }) => {
    const statusInfo = {
        pago: { 
            text: 'Soluções Desbloqueadas', 
            icon: CheckCircle, 
            color: 'bg-emerald-500 text-white border-emerald-600',
            dotColor: 'bg-emerald-400'
        },
        pendente: { 
            text: 'Pagamento Pendente', 
            icon: Clock, 
            color: 'bg-amber-500 text-white border-amber-600',
            dotColor: 'bg-amber-400'
        },
        processando: { 
            text: 'Processando Pagamento', 
            icon: Loader2, 
            color: 'bg-blue-500 text-white border-blue-600',
            dotColor: 'bg-blue-400'
        },
        cancelado: { 
            text: 'Busca Cancelada', 
            icon: Info, 
            color: 'bg-red-500 text-white border-red-600',
            dotColor: 'bg-red-400'
        }
    };

    const info = statusInfo[status] || { 
        text: 'Status Desconhecido', 
        icon: Info, 
        color: 'bg-slate-500 text-white border-slate-600',
        dotColor: 'bg-slate-400'
    };

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border-2 ${info.color} shadow-md`}>
            <span className={`w-2 h-2 rounded-full ${info.dotColor} animate-pulse`}></span>
            <info.icon className={`w-4 h-4 ${status === 'processando' ? 'animate-spin' : ''}`} />
            {info.text}
        </div>
    );
};

export default function MinhasBuscas() {
    const [buscas, setBuscas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'desbloqueadas', 'pendentes'

    useEffect(() => {
        const loadBuscas = async () => {
            setIsLoading(true);
            try {
                const currentUser = await base44.auth.me();
                const userBuscas = await base44.entities.Transacao.filter({ created_by: currentUser.email }, '-created_date');
                setBuscas(userBuscas);
            } catch (err) {
                console.error("Erro ao carregar buscas:", err);
                setError("Não foi possível carregar suas buscas. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };
        loadBuscas();
    }, []);

    const filteredBuscas = buscas.filter(busca => {
        if (filter === 'desbloqueadas') return busca.status_pagamento === 'pago';
        if (filter === 'pendentes') return ['pendente', 'processando'].includes(busca.status_pagamento);
        return true;
    });

    if (isLoading) {
        return <div className="p-8 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-600" /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                {/* Header Moderno */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Search className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Minhas Buscas
                            </h1>
                            <p className="text-slate-600 text-lg">
                                Histórico completo das suas buscas por soluções
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Filtros Modernos */}
                <div className="flex gap-3 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-sm border border-slate-200/60 w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            filter === 'all'
                                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg shadow-emerald-500/25'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('desbloqueadas')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            filter === 'desbloqueadas'
                                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg shadow-emerald-500/25'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Desbloqueadas
                    </button>
                    <button
                        onClick={() => setFilter('pendentes')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            filter === 'pendentes'
                                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg shadow-emerald-500/25'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Pendentes
                    </button>
                </div>

                <div className="grid gap-6">
                    {filteredBuscas.length > 0 ? (
                        filteredBuscas.map((busca, index) => (
                            <motion.div
                                key={busca.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                    <CardContent className="p-0">
                                        {/* Header colorido com gradiente baseado no status */}
                                        <div className={`p-6 ${
                                            busca.status_pagamento === 'pago' 
                                                ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-b border-emerald-100' 
                                                : busca.status_pagamento === 'processando'
                                                ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-100'
                                                : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-100'
                                        }`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-5 h-5 text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {formatDateBrasiliaShort(busca.created_date)}
                                                    </span>
                                                </div>
                                                <StatusBadge status={busca.status_pagamento} />
                                            </div>
                                            <p className="text-slate-800 text-base leading-relaxed">
                                                {formatSearchDescription(busca.dor_relatada)}
                                            </p>
                                        </div>

                                        <div className="p-6">
                                            {busca.status_pagamento === 'pago' && busca.startups_desbloqueadas?.length > 0 && (
                                                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-5 mb-5 border border-emerald-200/60">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                                            <Sparkles className="w-5 h-5 text-white" />
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 text-lg">Soluções Desbloqueadas</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {busca.startups_desbloqueadas.map((s) => (
                                                            <span key={s.startup_id} className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-medium text-slate-700 shadow-sm border border-emerald-100">
                                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                                {s.nome}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Link to={createPageUrl(`DetalhesBusca?id=${busca.id}`)}>
                                                <Button 
                                                    className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-base font-semibold"
                                                >
                                                    Ver Detalhes Completos
                                                    <ArrowRight className="w-5 h-5 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <Card className="text-center py-16 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                                <Search className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma busca encontrada</h3>
                            <p className="text-slate-600 mb-8 text-lg">Suas buscas aparecerão aqui assim que você as realizar.</p>
                            <Link to={createPageUrl('Assistente')}>
                                <Button 
                                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-lg px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/25"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Iniciar Nova Busca
                                </Button>
                            </Link>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}