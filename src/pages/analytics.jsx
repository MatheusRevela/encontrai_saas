import React, { useState, useEffect } from "react";
import { Transacao, Startup } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "../components/SkeletonLoaders";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  FunnelChart, Funnel, LabelList 
} from "recharts";
import { 
  Users, DollarSign, MessageCircle, Building2, Percent, ShoppingCart
} from "lucide-react";

export default function Analytics() {
  const [transacoes, setTransacoes] = useState([]);
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transacoesData, startupsData] = await Promise.all([
        Transacao.list('-created_date'),
        Startup.list()
      ]);
      setTransacoes(transacoesData || []);
      setStartups(startupsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const processAnalytics = () => {
    const totalBuscas = transacoes.length;
    const buscasComSelecao = transacoes.filter(t => t.startups_selecionadas?.length > 0).length;
    const conversoesPagas = transacoes.filter(t => t.status_pagamento === 'pago').length;
    const faturamentoTotal = conversoesPagas > 0 ? transacoes.filter(t => t.status_pagamento === 'pago').reduce((sum, t) => sum + (t.valor_total || 0), 0) : 0;
    
    const funilData = [
      { name: 'Total de Buscas', value: totalBuscas, fill: '#3B82F6' },
      { name: 'Selecionaram Soluções', value: buscasComSelecao, fill: '#10B981' },
      { name: 'Pagamentos Concluídos', value: conversoesPagas, fill: '#8B5CF6' },
    ];

    const faturamentoPorMes = transacoes.filter(t => t.status_pagamento === 'pago').reduce((acc, t) => {
      const mes = new Date(t.created_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      acc[mes] = (acc[mes] || 0) + t.valor_total;
      return acc;
    }, {});
    const faturamentoMensalData = Object.entries(faturamentoPorMes).map(([mes, faturamento]) => ({ mes, faturamento: Number(faturamento) }));

    const startupPerformance = startups.map(startup => {
      const sugerida = transacoes.filter(t => t.startups_sugeridas?.some(s => s.startup_id === startup.id)).length;
      const selecionada = transacoes.filter(t => t.startups_selecionadas?.includes(startup.id)).length;
      const paga = transacoes.filter(t => t.status_pagamento === 'pago' && t.startups_desbloqueadas?.some(s => s.startup_id === startup.id)).length;
      return {
        nome: startup.nome,
        sugerida,
        selecionada,
        paga,
        conversao: sugerida > 0 ? ((paga / sugerida) * 100).toFixed(1) : 0,
      };
    }).sort((a,b) => b.paga - a.paga || b.selecionada - a.selecionada).slice(0, 10);

    return {
      faturamentoTotal,
      funilData,
      faturamentoMensalData,
      startupPerformance,
      totalBuscas,
      conversoesPagas,
      taxaConversao: totalBuscas > 0 ? ((conversoesPagas / totalBuscas) * 100).toFixed(1) : 0,
      ticketMedio: conversoesPagas > 0 ? (faturamentoTotal / conversoesPagas).toFixed(2) : 0,
    };
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  const analytics = processAnalytics();

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Avançado</h1>
          <p className="text-slate-600">Análise de performance e comportamento do usuário</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Faturamento Total" value={`R$ ${analytics.faturamentoTotal.toFixed(2)}`} icon={DollarSign} />
          <MetricCard title="Taxa de Conversão" value={`${analytics.taxaConversao}%`} icon={Percent} />
          <MetricCard title="Ticket Médio" value={`R$ ${analytics.ticketMedio}`} icon={ShoppingCart} />
          <MetricCard title="Total de Buscas" value={analytics.totalBuscas} icon={MessageCircle} />
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <Card className="md:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="text-blue-500"/>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={analytics.funilData} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><BarChart className="text-emerald-500"/>Faturamento Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.faturamentoMensalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `R$${value}`} />
                  <Tooltip formatter={(value) => `R$${Number(value).toFixed(2)}`} />
                  <Bar dataKey="faturamento" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="text-purple-500"/>Performance das Startups (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Startup</th>
                    <th scope="col" className="px-6 py-3">Sugerida</th>
                    <th scope="col" className="px-6 py-3">Selecionada</th>
                    <th scope="col" className="px-6 py-3">Paga</th>
                    <th scope="col" className="px-6 py-3">Conversão (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.startupPerformance.map((item, index) => (
                    <tr key={index} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.nome}</td>
                      <td className="px-6 py-4">{item.sugerida}</td>
                      <td className="px-6 py-4">{item.selecionada}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{item.paga}</td>
                      <td className="px-6 py-4 font-bold">{item.conversao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

const MetricCard = ({ title, value, icon: Icon }) => (
  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="p-3 bg-emerald-100 rounded-lg">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);