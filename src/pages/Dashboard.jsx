import React, { useState, useEffect } from "react";
import { User, Transacao, Startup } from "@/entities/all";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricCard from "../components/dashboard/MetricCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import EvaluationStats from "../components/dashboard/EvaluationStats";
import OnboardingMetrics from '../components/growth/OnboardingMetrics';
import AbandonedCartFunnel from '../components/growth/AbandonedCartFunnel';
import FeedbackStream from '../components/growth/FeedbackStream';
import {
  Users,
  DollarSign,
  BarChart3,
  Activity,
  ClipboardCheck,
  Loader2,
  TrendingUp,
  AlertCircle as AlertCircleSolid,
  MailCheck,
  Sparkles,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';

const HealthCheckWidget = ({ stats }) => (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <ClipboardCheck className="w-6 h-6 text-blue-500" />
                Saúde da Plataforma
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Startups Verificadas (30d)</span>
                <span className="font-bold text-green-600">{stats.verifiedLast30Days} de {stats.total}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(stats.verifiedLast30Days / stats.total) * 100}%` }}></div>
            </div>

            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Startups com Problemas</span>
                 <span className="font-bold text-red-600 flex items-center gap-1">
                    <AlertCircleSolid className="w-4 h-4" /> {stats.withIssues}
                </span>
            </div>
             <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(stats.withIssues / stats.total) * 100}%` }}></div>
            </div>

             <div className="flex justify-between items-center text-sm pt-2 border-t mt-4">
                <span className="text-slate-600">Novos Usuários (7d)</span>
                 <span className="font-bold text-purple-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> {stats.newUsers}
                </span>
            </div>
        </CardContent>
    </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    conversionRate: 0,
  });
  const [growthMetrics, setGrowthMetrics] = useState({
    conversion_rate: 0,
    avg_time_to_convert: 0,
    cart_abandonment_rate: 0,
    returning_users: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [verificationStats, setVerificationStats] = useState({
    needsVerification: 0,
    withIssues: 0,
    verifiedLast30Days: 0,
    startupsWithIssues: [],
    total: 0,
    newUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isOptimizingAI, setIsOptimizingAI] = useState(false);

  const handleSendFollowUps = async () => {
    if (!confirm('Deseja procurar por transações antigas e enviar e-mails de follow-up?')) return;
    
    setIsSendingFollowUp(true);
    try {
      const response = await base44.functions.invoke('sendFollowUpEmails');
      alert(response.data.message);
    } catch (error) {
      console.error('Erro ao enviar follow-ups:', error);
      alert('Ocorreu um erro ao enviar os e-mails.');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleOptimizeAI = async () => {
    if (!confirm('Deseja iniciar a otimização da IA com base no feedback dos clientes? Isso pode levar alguns instantes.')) return;
    
    setIsOptimizingAI(true);
    try {
      const response = await base44.functions.invoke('processMLFeedback');
      alert(response.data.message || 'Otimização concluída!');
    } catch (error) {
      console.error('Erro ao otimizar IA:', error);
      alert('Ocorreu um erro ao processar o feedback.');
    } finally {
      setIsOptimizingAI(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [usersData, transacoesData, startupsData] = await Promise.all([
          User.list(),
          Transacao.list('-created_date'),
          Startup.list()
        ]);

        // Stats principais
        const totalUsers = usersData.length;
        const totalRevenue = transacoesData
          .filter(t => t.status_pagamento === 'pago')
          .reduce((sum, t) => sum + (t.valor_total || 0), 0);
        const totalTransactions = transacoesData.length;
        const paidTransactions = transacoesData.filter(t => t.status_pagamento === 'pago').length;
        const conversionRate = totalTransactions > 0 ? (paidTransactions / totalTransactions) * 100 : 0;
        
        setStats({
          totalUsers,
          totalRevenue,
          totalTransactions,
          conversionRate
        });

        // Growth metrics
        const paid = transacoesData.filter(t => t.status_pagamento === 'pago');
        const pending = transacoesData.filter(t => t.status_pagamento === 'pendente');
        
        const growthConversionRate = transacoesData.length > 0 
          ? (paid.length / transacoesData.length) * 100 
          : 0;
        
        const cartAbandonmentRate = transacoesData.length > 0
          ? (pending.length / transacoesData.length) * 100
          : 0;

        const avgTimeToConvert = paid.length > 0
          ? paid.reduce((acc, t) => {
              const created = new Date(t.created_date);
              const updated = new Date(t.updated_date);
              return acc + (updated - created);
            }, 0) / paid.length / (1000 * 60)
          : 0;

        setGrowthMetrics({
          conversion_rate: growthConversionRate,
          avg_time_to_convert: avgTimeToConvert,
          cart_abandonment_rate: cartAbandonmentRate,
          returning_users: 0
        });

        setRecentTransactions(transacoesData.slice(0, 5));

        // Verification stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let needsVerificationCount = 0;
        let withIssuesCount = 0;
        let verifiedLast30DaysCount = 0;
        const issuesList = [];

        startupsData.forEach(startup => {
          const lastCheck = startup.ultima_verificacao ? new Date(startup.ultima_verificacao) : null;
          
          if (!lastCheck || lastCheck < thirtyDaysAgo) {
            needsVerificationCount++;
          } else {
            verifiedLast30DaysCount++;
          }
          
          if (startup.status_verificacao?.site_online === false || startup.status_verificacao?.ssl_valido === false) {
            if(!issuesList.some(s => s.id === startup.id)) {
              withIssuesCount++;
              if(issuesList.length < 5) issuesList.push(startup);
            }
          }
        });
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newUsersCount = usersData.filter(u => new Date(u.created_date) >= weekAgo).length;

        setVerificationStats({
          needsVerification: needsVerificationCount,
          withIssues: withIssuesCount,
          verifiedLast30Days: verifiedLast30DaysCount,
          startupsWithIssues: issuesList,
          total: startupsData.length,
          newUsers: newUsersCount,
        });

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Unificado</h1>
            <p className="text-slate-600">Visão completa da plataforma EncontrAI</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleOptimizeAI}
              disabled={isOptimizingAI || isSendingFollowUp}
              variant="outline"
              className="bg-white/80 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {isOptimizingAI ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Otimizando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Otimizar IA
                </>
              )}
            </Button>
            <Button
              onClick={handleSendFollowUps}
              disabled={isSendingFollowUp || isOptimizingAI}
              variant="outline"
              className="bg-white/80"
            >
              {isSendingFollowUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <MailCheck className="w-4 h-4 mr-2" />
                  Follow-ups
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Receita Total" 
            value={`R$ ${stats.totalRevenue.toFixed(2)}`} 
            icon={DollarSign} 
            iconBgClass="bg-emerald-100"
            iconColorClass="text-emerald-600"
          />
          <MetricCard 
            title="Usuários Totais" 
            value={stats.totalUsers} 
            icon={Users}
            iconBgClass="bg-blue-100"
            iconColorClass="text-blue-600"
          />
          <MetricCard 
            title="Transações" 
            value={stats.totalTransactions} 
            icon={Activity}
            iconBgClass="bg-purple-100"
            iconColorClass="text-purple-600"
          />
          <MetricCard 
            title="Taxa de Conversão" 
            value={`${stats.conversionRate.toFixed(1)}%`} 
            icon={BarChart3}
            iconBgClass="bg-amber-100"
            iconColorClass="text-amber-600"
          />
        </div>

        {/* Tabs para diferentes seções */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="growth">Growth & Retenção</TabsTrigger>
            <TabsTrigger value="analytics">Analytics Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <RecentActivity transactions={recentTransactions} />
              </div>
              
              <div className="lg:col-span-1 space-y-8">
                <HealthCheckWidget stats={verificationStats} />
                <EvaluationStats transactions={recentTransactions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-8 mt-6">
            {/* Métricas de Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-900">{growthMetrics.conversion_rate.toFixed(1)}%</span>
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
                    <span className="text-3xl font-bold text-slate-900">{growthMetrics.avg_time_to_convert.toFixed(0)}min</span>
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
                    <span className="text-3xl font-bold text-slate-900">{growthMetrics.cart_abandonment_rate.toFixed(1)}%</span>
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
                    <span className="text-3xl font-bold text-slate-900">{growthMetrics.returning_users}</span>
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8 mt-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Analytics Detalhado
              </h3>
              <p className="text-slate-600 mb-4">
                Visualize métricas avançadas, cohorts e análise de comportamento
              </p>
              <Link to={createPageUrl('analytics')}>
                <Button>
                  Ver Analytics Completo
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}