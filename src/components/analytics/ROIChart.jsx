import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ROIChart({ data, averageROI, title = "Satisfação por Categoria" }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Dados insuficientes para análise de ROI</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            {title}
          </CardTitle>
          {averageROI && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Média: {averageROI.toFixed(1)}% de satisfação
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="categoria" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 5]}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${value.toFixed(2)} ⭐`, 'Avaliação']}
            />
            <Radar 
              name="Satisfação Média" 
              dataKey="satisfacao" 
              stroke="#8b5cf6" 
              fill="#8b5cf6" 
              fillOpacity={0.5}
              strokeWidth={2}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center text-sm text-slate-600">
          <p>Baseado em {data.reduce((acc, d) => acc + d.avaliacoes, 0)} avaliações de clientes</p>
        </div>
      </CardContent>
    </Card>
  );
}