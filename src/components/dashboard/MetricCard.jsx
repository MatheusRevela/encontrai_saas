import React from "react";
import { Card, CardContent } from "@/components/ui/card";

// Componente MetricCard simplificado e mais robusto
export default function MetricCard({ title, value, icon: Icon, iconBgClass, iconColorClass }) {
  // Usa as classes fornecidas, com uma cor padrão de fallback
  const bgClass = iconBgClass || 'bg-slate-100';
  const colorClass = iconColorClass || 'text-slate-500';

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
          {Icon && (
            <div className={`p-3 rounded-lg ${bgClass}`}>
              <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}