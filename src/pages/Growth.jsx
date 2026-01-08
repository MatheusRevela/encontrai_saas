import React, { useState, useEffect } from "react";
import { Transacao } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import OnboardingMetrics from '../components/growth/OnboardingMetrics';
import AbandonedCartFunnel from '../components/growth/AbandonedCartFunnel';
import FeedbackStream from '../components/growth/FeedbackStream';

export default function Growth() {
  const [metrics, setMetrics] = useState({
    conversion_rate: 0,
    avg_time_to_convert: 0,
    cart_abandonment_rate: 0,
    returning_users: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const allTransactions = await Transacao.list('-created_date');
      const paid = allTransactions.filter(t => t.status_pagamento === 'pago');
      const pending = allTransactions.filter(t => t.status_pagamento === 'pendente');
      
      const conversionRate = allTransactions.length > 0 
        ? (paid.length / allTransactions.length) * 100 
        : 0;
      
      const cartAbandonmentRate = allTransactions.length > 0
        ? (pending.length / allTransactions.length) * 100
        : 0;

      const avgTimeToConvert = paid.length > 0
        ? paid.reduce((acc, t) => {
            const created = new Date(t.created_date);
            const updated = new Date(t.updated_date);
            return acc + (updated - created);
          }, 0) / paid.length / (1000 * 60)
        : 0;

      setMetrics({
        conversion_rate: conversionRate,
        avg_time_to_convert: avgTimeToConvert,
        cart_abandonment_rate: cartAbandonmentRate,
        returning_users: 0
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Growth & Retenção</h1>
          <p className="text-slate-600">Métricas de crescimento e estratégias de retenção</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{metrics.conversion_rate.toFixed(1)}%</span>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tempo Médio p/ Converter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{metrics.avg_time_to_convert.toFixed(0)}min</span>
                <TrendingDown className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Carrinho Abandonado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{metrics.cart_abandonment_rate.toFixed(1)}%</span>
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Usuários Recorrentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{metrics.returning_users}</span>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <OnboardingMetrics />
          <AbandonedCartFunnel />
        </div>

        <FeedbackStream />
      </div>
    </div>
  );
}