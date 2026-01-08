
import React, { useState, useEffect } from "react";
import { User, Transacao, Startup } from "@/entities/all";
import MetricCard from "../components/dashboard/MetricCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import EvaluationStats from "../components/dashboard/EvaluationStats";
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
  Sparkles, // Novo ícone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sendFollowUpEmails } from '@/functions/sendFollowUpEmails';
import { processMLFeedback } from '@/functions/processMLFeedback'; // Nova importação

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
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [verificationStats, setVerificationStats] = useState({
    needsVerification: 0,
    withIssues: 0,
    verifiedLast30Days: 0,
    startupsWithIssues: [],
    total: 0,
    newUsers: 0
  });

  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isOptimizingAI, setIsOptimizingAI] = useState(false); // Novo estado

  const handleSendFollowUps = async () => {
    if (!confirm('Deseja procurar por transações antigas e enviar e-mails de follow-up?')) return;
    
    setIsSendingFollowUp(true);
    try {
      const response = await sendFollowUpEmails();
      alert(response.data.message);
    } catch (error) {
      console.error('Erro ao enviar follow-ups:', error);
      alert('Ocorreu um erro ao enviar os e-mails.');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  // Nova função para otimizar IA
  const handleOptimizeAI = async () => {
    if (!confirm('Deseja iniciar a otimização da IA com base no feedback dos clientes? Isso pode levar alguns instantes.')) return;
    
    setIsOptimizingAI(true);
    try {
      const response = await processMLFeedback();
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

        setRecentTransactions(transacoesData.slice(0, 5));
        setStartups(startupsData);

        // Calculate verification stats
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Visão geral do desempenho da plataforma EncontrAI</p>
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
                  Otimizar IA com Feedback
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
                  Enviar Follow-ups
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <RecentActivity transactions={recentTransactions} />
          </div>
          
          <div className="lg:col-span-1 space-y-8">
             <HealthCheckWidget stats={verificationStats} />
             <EvaluationStats transactions={recentTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
