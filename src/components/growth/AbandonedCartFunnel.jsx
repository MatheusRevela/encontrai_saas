import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, AlertCircle } from 'lucide-react';

export default function AbandonedCartFunnel() {
  const [metrics, setMetrics] = useState({
    total_abandoned: 0,
    email_2h_sent: 0,
    email_24h_sent: 0,
    email_3d_sent: 0,
    recovered: 0
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const allTransactions = await base44.entities.Transacao.list();
      const abandoned = allTransactions.filter(t => t.status_pagamento === 'pendente');
      
      const email2h = abandoned.filter(t => t.abandoned_cart_2h_sent === true);
      const email24h = abandoned.filter(t => t.abandoned_cart_24h_sent === true);
      const email3d = abandoned.filter(t => t.abandoned_cart_3d_sent === true);
      
      const recovered = allTransactions.filter(t => 
        (t.abandoned_cart_2h_sent || t.abandoned_cart_24h_sent || t.abandoned_cart_3d_sent) && 
        t.status_pagamento === 'pago'
      );

      setMetrics({
        total_abandoned: abandoned.length,
        email_2h_sent: email2h.length,
        email_24h_sent: email24h.length,
        email_3d_sent: email3d.length,
        recovered: recovered.length
      });
    } catch (error) {
      console.error('Erro ao carregar métricas de carrinho abandonado:', error);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-500" />
          Funil de Recuperação de Carrinho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Carrinhos Abandonados</span>
            <span className="font-bold text-slate-900">{metrics.total_abandoned}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">📧 Email 2h enviado</span>
            <span className="font-bold text-blue-600">{metrics.email_2h_sent}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: metrics.total_abandoned > 0 ? `${(metrics.email_2h_sent / metrics.total_abandoned) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">📧 Email 24h enviado</span>
            <span className="font-bold text-indigo-600">{metrics.email_24h_sent}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full" 
              style={{ width: metrics.total_abandoned > 0 ? `${(metrics.email_24h_sent / metrics.total_abandoned) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">📧 Email 3d enviado</span>
            <span className="font-bold text-purple-600">{metrics.email_3d_sent}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: metrics.total_abandoned > 0 ? `${(metrics.email_3d_sent / metrics.total_abandoned) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              Convertidos
            </span>
            <span className="text-2xl font-bold text-emerald-600">{metrics.recovered}</span>
          </div>
          {metrics.total_abandoned > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              Taxa de recuperação: {((metrics.recovered / metrics.total_abandoned) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}