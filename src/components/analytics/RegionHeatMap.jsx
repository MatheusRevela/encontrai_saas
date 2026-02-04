import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RegionHeatMap({ data, title = "Distribuição Regional" }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Dados de região não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const maxBuscas = Math.max(...data.map(d => d.buscas));
  
  const getIntensityColor = (value) => {
    const intensity = (value / maxBuscas) * 100;
    if (intensity > 75) return 'from-red-500 to-red-600';
    if (intensity > 50) return 'from-orange-500 to-orange-600';
    if (intensity > 25) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((regiao, index) => (
            <div 
              key={index}
              className={`relative p-6 rounded-xl bg-gradient-to-br ${getIntensityColor(regiao.buscas)} text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-5 h-5" />
                <Badge className="bg-white/20 text-white border-white/30">
                  {regiao.conversoes}/{regiao.buscas}
                </Badge>
              </div>
              <h4 className="text-lg font-bold mb-1">{regiao.regiao}</h4>
              <p className="text-sm opacity-90">{regiao.buscas} buscas</p>
              <div className="mt-2 text-xs opacity-75">
                Taxa conversão: {((regiao.conversoes / regiao.buscas) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-green-600"></div>
            <span>Baixa demanda</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-500 to-yellow-600"></div>
            <span>Média demanda</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-orange-600"></div>
            <span>Alta demanda</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-red-600"></div>
            <span>Muito alta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}