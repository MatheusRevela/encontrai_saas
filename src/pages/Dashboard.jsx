import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricCard from "../components/dashboard/MetricCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import EvaluationStats from "../components/dashboard/EvaluationStats";
import OnboardingMetrics from '../components/growth/OnboardingMetrics';
import AbandonedCartFunnel from '../components/growth/AbandonedCartFunnel';
import FeedbackStream from '../components/growth/FeedbackStream';
import SearchTrendsChart from '../components/analytics/SearchTrendsChart';
import CategoryDemandChart from '../components/analytics/CategoryDemandChart';
import ROIChart from '../components/analytics/ROIChart';
import RegionHeatMap from '../components/analytics/RegionHeatMap';
import ReportExporter from '../components/analytics/ReportExporter';
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
  // React Query: Buscar estatísticas do dashboard
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getDashboardStats');
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    refetchInterval: 5 * 60 * 1000 // Atualizar a cada 5 minutos
  });

  // React Query: Buscar dados analíticos
  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getAnalyticsData');
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const analyticsData = analyticsResponse?.data || {
    trends: [],
    categories: [],
    roi: [],
    regions: [],
    summary: null
  };

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    conversionRate: 0
  };

  const growthMetrics = dashboardData?.growthMetrics || {
    conversion_rate: 0,
    avg_time_to_convert: 0,
    cart_abandonment_rate: 0,
    returning_users: 0
  };

  const verificationStats = dashboardData?.verificationStats || {
    needsVerification: 0,
    withIssues: 0,
    verifiedLast30Days: 0,
    startupsWithIssues: [],
    total: 0,
    newUsers: 0
  };

  const recentTransactions = dashboardData?.recentTransactions || [];

  // Mutation para enviar follow-ups
  const followUpMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('sendFollowUpEmails');
      return data;
    },
    onSuccess: (data) => {
      alert(data.message);
    },
    onError: (error) => {
      console.error('Erro ao enviar follow-ups:', error);
      alert('Ocorreu um erro ao enviar os e-mails.');
    }
  });

  // Mutation para otimizar IA
  const optimizeAIMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('processMLFeedback');
      return data;
    },
    onSuccess: (data) => {
      alert(data.message || 'Otimização concluída!');
    },
    onError: (error) => {
      console.error('Erro ao otimizar IA:', error);
      alert('Ocorreu um erro ao processar o feedback.');
    }
  });

  const handleSendFollowUps = async () => {
    if (!confirm('Deseja procurar por transações antigas e enviar e-mails de follow-up?')) return;
    followUpMutation.mutate();
  };

  const handleOptimizeAI = async () => {
    if (!confirm('Deseja iniciar a otimização da IA com base no feedback dos clientes? Isso pode levar alguns instantes.')) return;
    optimizeAIMutation.mutate();
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
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Unificado</h1>
            <p className="text-slate-600">Visão completa da plataforma EncontrAI</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleOptimizeAI}
              disabled={optimizeAIMutation.isPending || followUpMutation.isPending}
              variant="outline"
              className="bg-white/80 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {optimizeAIMutation.isPending ? (
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
              disabled={followUpMutation.isPending || optimizeAIMutation.isPending}
              variant="outline"
              className="bg-white/80"
            >
              {followUpMutation.isPending ? (
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
            {analyticsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <SearchTrendsChart data={analyticsData.trends} />
                  </div>
                  <ReportExporter analyticsData={analyticsData} />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <CategoryDemandChart data={analyticsData.categories} />
                  <ROIChart 
                    data={analyticsData.roi} 
                    averageROI={analyticsData.averageROI}
                  />
                </div>

                <RegionHeatMap data={analyticsData.regions} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}