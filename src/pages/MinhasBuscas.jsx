import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Transacao, User } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock, ArrowRight, Building2, Search, Info } from 'lucide-react';
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
                const currentUser = await User.me();
                const userBuscas = await Transacao.filter({ created_by: currentUser.email }, '-created_date');
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
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Minhas Buscas</h1>
                    <p className="text-slate-600">Aqui está o histórico de todas as suas buscas por soluções.</p>
                </div>
                
                <div className="flex gap-2 mb-6 border-b pb-4">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todas</Button>
                    <Button variant={filter === 'desbloqueadas' ? 'default' : 'outline'} onClick={() => setFilter('desbloqueadas')}>Desbloqueadas</Button>
                    <Button variant={filter === 'pendentes' ? 'default' : 'outline'} onClick={() => setFilter('pendentes')}>Pendentes</Button>
                </div>

                <div className="space-y-6">
                    {filteredBuscas.length > 0 ? (
                        filteredBuscas.map((busca, index) => (
                            <motion.div
                                key={busca.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow duration-300">
                                    <CardHeader>
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500">{formatDateBrasiliaShort(busca.created_date)}</p>
                                                <CardTitle className="text-lg mt-1">{formatSearchDescription(busca.dor_relatada)}</CardTitle>
                                            </div>
                                            <StatusBadge status={busca.status_pagamento} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {busca.status_pagamento === 'pago' && busca.startups_desbloqueadas?.length > 0 && (
                                            <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200">
                                                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2"><Building2 className="w-5 h-5"/> Soluções Desbloqueadas:</h4>
                                                <ul className="list-disc list-inside text-emerald-800">
                                                    {busca.startups_desbloqueadas.map(s => <li key={s.startup_id}>{s.nome}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="mt-4 flex justify-end">
                                            <Link to={createPageUrl(`DetalhesBusca?id=${busca.id}`)}>
                                                <Button variant="outline">
                                                    Ver Detalhes <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Search className="w-12 h-12 mx-auto mb-4 text-slate-400"/>
                            <h3 className="text-lg font-semibold">Nenhuma busca encontrada</h3>
                            <p>Suas buscas aparecerão aqui assim que você as realizar.</p>
                            <Link to={createPageUrl('Assistente')} className="mt-4 inline-block">
                                <Button>Iniciar Nova Busca</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}