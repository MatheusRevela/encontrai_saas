import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RecentSearchesWidget({ transacoes }) {
  const navigate = useNavigate();
  const recentSearches = transacoes.slice(0, 3);

  const getStatusBadge = (status) => {
    const variants = {
      pago: { label: 'Pago', className: 'bg-green-100 text-green-800' },
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    };
    const variant = variants[status] || variants.pendente;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          Buscas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentSearches.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nenhuma busca realizada ainda</p>
            <Button
              onClick={() => navigate(createPageUrl('Buscar'))}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              Fazer Primeira Busca
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSearches.map((transacao) => (
              <div
                key={transacao.id}
                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(createPageUrl(`DetalhesBusca?id=${transacao.id}`))}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {transacao.dor_relatada}
                    </p>
                  </div>
                  {getStatusBadge(transacao.status_pagamento)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(transacao.created_date), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </div>
                  {transacao.quantidade_selecionada > 0 && (
                    <span>{transacao.quantidade_selecionada} soluções</span>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(createPageUrl('MinhasBuscas'))}
            >
              Ver Todas as Buscas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}