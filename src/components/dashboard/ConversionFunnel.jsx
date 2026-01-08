import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function ConversionFunnel({ stats }) {
  if (!stats) return null;

  const stages = [
    { name: 'Buscas Iniciadas', value: stats.totalSearches, icon: '🔍' },
    { name: 'Resultados Vistos', value: stats.resultsViewed, icon: '👀' },
    { name: 'Soluções Selecionadas', value: stats.selectionsMADE, icon: '✅' },
    { name: 'Checkouts Iniciados', value: stats.checkoutsStarted, icon: '🛒' },
    { name: 'Pagamentos Concluídos', value: stats.paidTransactions, icon: '💰' }
  ];

  const getConversionRate = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current / previous) * 100).toFixed(1);
  };

  const getHealthColor = (rate) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const previousValue = index > 0 ? stages[index - 1].value : null;
            const conversionRate = previousValue ? getConversionRate(stage.value, previousValue) : 100;
            const healthColor = getHealthColor(conversionRate);

            return (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stage.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{stage.name}</p>
                      {index > 0 && (
                        <p className={`text-xs font-medium ${healthColor}`}>
                          {conversionRate}% do estágio anterior
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stage.value}</p>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(stage.value / stages[0].value) * 100}%` }}
                  />
                </div>

                {index < stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Taxa de Conversão Geral */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Taxa de Conversão Geral:</span>
            <span className="text-2xl font-bold text-emerald-600">
              {getConversionRate(stats.paidTransactions, stats.totalSearches)}%
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            De buscas iniciadas até pagamentos concluídos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}