
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, ThumbsDown, Award, Building2 } from "lucide-react";

// Componente auxiliar para renderizar estrelas de avaliação
const StarRating = ({ rating, size = 'w-4 h-4' }) => {
    if (!rating) return null;
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`${size} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                />
            ))}
        </div>
    );
};

export default function EvaluationStats({ transactions }) {
    // Filtra apenas as transações que foram avaliadas
    const evaluatedTransactions = (transactions || []).filter(t => t.avaliacao && t.avaliacao > 0);

    // Mostra uma mensagem se não houver avaliações suficientes
    if (evaluatedTransactions.length === 0) {
        return (
            <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                <CardHeader className="p-0 pb-4">
                    <CardTitle className="font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        Análise de Avaliações
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-sm text-slate-500">Ainda não há avaliações de clientes para exibir.</p>
                </CardContent>
            </Card>
        );
    }

    // Calcula a média geral
    const totalRating = evaluatedTransactions.reduce((sum, t) => sum + t.avaliacao, 0);
    const averageRating = (totalRating / evaluatedTransactions.length).toFixed(1);

    // Encontra a melhor e a pior transação avaliada
    const bestTransaction = [...evaluatedTransactions].sort((a, b) => b.avaliacao - a.avaliacao || new Date(b.created_date) - new Date(a.created_date))[0];
    const worstTransaction = [...evaluatedTransactions].sort((a, b) => a.avaliacao - b.avaliacao || new Date(b.created_date) - new Date(a.created_date))[0];

    const renderTransactionSolutions = (transaction) => {
        if (!transaction.startups_desbloqueadas || transaction.startups_desbloqueadas.length === 0) {
            return null;
        }
        return (
            <div className="flex items-center gap-2 mt-2 text-xs">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">Soluções:</span>
                <span className="truncate">{transaction.startups_desbloqueadas.map(s => s.nome).join(', ')}</span>
            </div>
        );
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Análise de Avaliações
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700 text-sm">Média Geral</span>
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                        {averageRating}
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                </div>

                {bestTransaction && (
                    <div className="p-3 border rounded-lg bg-emerald-50 border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 font-semibold text-emerald-800 text-sm">
                                <ThumbsUp className="w-4 h-4"/>
                                Melhor Avaliação
                           </div>
                           <StarRating rating={bestTransaction.avaliacao} />
                        </div>
                        <p className="text-xs text-emerald-700 italic line-clamp-2">Problema: "{bestTransaction.dor_relatada}"</p>
                        <div className="text-emerald-700">{renderTransactionSolutions(bestTransaction)}</div>
                    </div>
                )}

                {worstTransaction && bestTransaction.id !== worstTransaction.id && (
                     <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 font-semibold text-red-800 text-sm">
                                <ThumbsDown className="w-4 h-4"/>
                                Pior Avaliação
                           </div>
                           <StarRating rating={worstTransaction.avaliacao} />
                        </div>
                        <p className="text-xs text-red-700 italic line-clamp-2">Problema: "{worstTransaction.dor_relatada}"</p>
                        <div className="text-red-700">{renderTransactionSolutions(worstTransaction)}</div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
