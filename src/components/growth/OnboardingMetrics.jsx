import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CheckCircle } from 'lucide-react';

export default function OnboardingMetrics() {
  const [metrics, setMetrics] = useState({
    total_new_users: 0,
    completed_onboarding: 0,
    completion_rate: 0
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const allUsers = await base44.entities.User.list();
      const newUsers = allUsers.filter(u => new Date(u.created_date) >= sevenDaysAgo);
      const completed = newUsers.filter(u => u.onboarding_completed === true);

      setMetrics({
        total_new_users: newUsers.length,
        completed_onboarding: completed.length,
        completion_rate: newUsers.length > 0 ? (completed.length / newUsers.length) * 100 : 0
      });
    } catch (error) {
      console.error('Erro ao carregar métricas de onboarding:', error);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          Onboarding (últimos 7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Novos Usuários</span>
          <span className="text-2xl font-bold text-slate-900">{metrics.total_new_users}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Completaram Onboarding</span>
          <span className="text-2xl font-bold text-emerald-600">{metrics.completed_onboarding}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-slate-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Taxa de Conclusão
          </span>
          <span className="text-2xl font-bold text-blue-600">{metrics.completion_rate.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}