import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';

import RecentSearchesWidget from '../components/dashboard/RecentSearchesWidget';
import UnlockedStartupsWidget from '../components/dashboard/UnlockedStartupsWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import StatsOverviewWidget from '../components/dashboard/StatsOverviewWidget';
import SearchTrendsChart from '../components/analytics/SearchTrendsChart';
import CategoryDemandChart from '../components/analytics/CategoryDemandChart';
import ROIChart from '../components/analytics/ROIChart';
import ReportExporter from '../components/analytics/ReportExporter';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_WIDGETS = {
  stats: true,
  recentSearches: true,
  quickActions: true,
  unlockedStartups: true,
  analytics: true
};

export default function DashboardUsuario() {
  const [user, setUser] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleWidgets, setVisibleWidgets] = useState(DEFAULT_WIDGETS);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-data-user'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getAnalyticsData');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const analyticsData = analyticsResponse?.data || {
    trends: [],
    categories: [],
    roi: [],
    summary: null
  };

  useEffect(() => {
    loadDashboardData();
    loadWidgetPreferences();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const userTransacoes = await base44.entities.Transacao.filter(
        { created_by: currentUser.email },
        '-created_date',
        50
      );
      setTransacoes(userTransacoes);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWidgetPreferences = () => {
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) {
      setVisibleWidgets(JSON.parse(saved));
    }
  };

  const saveWidgetPreferences = (newPreferences) => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(newPreferences));
    setVisibleWidgets(newPreferences);
  };

  const toggleWidget = (widgetKey) => {
    const newPreferences = {
      ...visibleWidgets,
      [widgetKey]: !visibleWidgets[widgetKey]
    };
    saveWidgetPreferences(newPreferences);
  };

  const widgetsList = [
    { key: 'stats', label: 'Resumo de Atividades', description: 'Estatísticas gerais' },
    { key: 'recentSearches', label: 'Buscas Recentes', description: 'Últimas 3 buscas' },
    { key: 'quickActions', label: 'Acesso Rápido', description: 'Atalhos principais' },
    { key: 'unlockedStartups', label: 'Soluções Desbloqueadas', description: 'Suas startups' },
    { key: 'analytics', label: 'Analytics Avançado', description: 'Gráficos e tendências' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Olá, {user?.full_name?.split(' ')[0] || 'Usuário'}! 👋
            </h1>
            <p className="text-slate-600">
              Bem-vindo ao seu painel personalizado
            </p>
          </div>

          <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Personalizar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Personalizar Dashboard</DialogTitle>
                <DialogDescription>
                  Escolha quais widgets você deseja exibir
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {widgetsList.map((widget) => (
                  <div
                    key={widget.key}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={widget.key}
                        checked={visibleWidgets[widget.key]}
                        onCheckedChange={() => toggleWidget(widget.key)}
                      />
                      <div>
                        <label
                          htmlFor={widget.key}
                          className="text-sm font-medium text-slate-900 cursor-pointer"
                        >
                          {widget.label}
                        </label>
                        <p className="text-xs text-slate-500">{widget.description}</p>
                      </div>
                    </div>
                    {visibleWidgets[widget.key] ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {/* Stats - Full width */}
            {visibleWidgets.stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-3"
              >
                <StatsOverviewWidget transacoes={transacoes} />
              </motion.div>
            )}

            {/* Recent Searches - 2 columns */}
            {visibleWidgets.recentSearches && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-2"
              >
                <RecentSearchesWidget transacoes={transacoes} />
              </motion.div>
            )}

            {/* Quick Actions - 1 column */}
            {visibleWidgets.quickActions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-1"
              >
                <QuickActionsWidget />
              </motion.div>
            )}

            {/* Unlocked Startups - Full width */}
            {visibleWidgets.unlockedStartups && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-3"
              >
                <UnlockedStartupsWidget transacoes={transacoes} />
              </motion.div>
            )}

            {/* Analytics Avançado - Full width */}
            {visibleWidgets.analytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-3"
              >
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">📊 Analytics Pessoal</h2>
                  
                  {analyticsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <SearchTrendsChart data={analyticsData.trends} title="Seu Histórico de Buscas" />
                        </div>
                        <ReportExporter analyticsData={analyticsData} userName={user?.full_name} />
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6">
                        <CategoryDemandChart data={analyticsData.categories} title="Categorias que Você Buscou" />
                        <ROIChart 
                          data={analyticsData.roi} 
                          averageROI={analyticsData.averageROI}
                          title="Sua Satisfação por Categoria"
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!Object.values(visibleWidgets).some(v => v) && (
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum widget selecionado
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Clique em "Personalizar" para escolher os widgets que deseja exibir
                  </p>
                  <Button onClick={() => setIsCustomizing(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Personalizar Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}