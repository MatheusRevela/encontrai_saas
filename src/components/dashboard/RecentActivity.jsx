
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateBrasiliaShort } from "../utils/dateUtils";
import { MessageCircle, CheckCircle, Clock, DollarSign } from "lucide-react";

export default function RecentActivity({ transactions }) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">Nenhuma atividade encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pendente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((transacao) => (
            <div key={transacao.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex-shrink-0">
                {getStatusIcon(transacao.status_pagamento)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900 truncate">
                    {transacao.cliente_nome || 'Cliente não identificado'}
                  </p>
                  <Badge className={`${getStatusColor(transacao.status_pagamento)} border text-xs`}>
                    {transacao.status_pagamento || 'indefinido'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {transacao.dor_relatada || 'Nenhuma descrição disponível'}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {formatDateBrasiliaShort(transacao.created_date)}
                  </p>
                  {transacao.valor_total != null && transacao.valor_total > 0 && (
                    <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                      <DollarSign className="w-3 h-3" />
                      R$ {Number(transacao.valor_total).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
