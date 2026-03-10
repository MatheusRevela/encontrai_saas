import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Search, Building2, CheckCircle } from 'lucide-react';

export default function StatsOverviewWidget({ transacoes }) {
  const totalBuscas = transacoes.length;
  const buscasPagas = transacoes.filter(t => t.status_pagamento === 'pago').length;
  const startupsDesbloqueadas = transacoes
    .filter(t => t.startups_desbloqueadas?.length > 0)
    .reduce((acc, t) => acc + t.startups_desbloqueadas.length, 0);

  const stats = [
    {
      icon: Search,
      label: 'Total de Buscas',
      value: totalBuscas,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: CheckCircle,
      label: 'Buscas Concluídas',
      value: buscasPagas,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: Building2,
      label: 'Soluções Desbloqueadas',
      value: startupsDesbloqueadas,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Resumo de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className={`p-3 rounded-full ${stat.iconBg}`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}