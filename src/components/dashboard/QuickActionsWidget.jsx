import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, History, Sparkles, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Search,
      label: 'Busca Rápida',
      description: 'Encontre soluções com IA',
      color: 'emerald',
      path: 'Buscar'
    },
    {
      icon: Sparkles,
      label: 'Assistente IA',
      description: 'Análise personalizada',
      color: 'purple',
      path: 'Assistente'
    },
    {
      icon: History,
      label: 'Histórico',
      description: 'Suas buscas anteriores',
      color: 'blue',
      path: 'MinhasBuscas'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Acesso Rápido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant="outline"
                className={`h-auto py-4 justify-start hover:border-${action.color}-500 hover:bg-${action.color}-50 transition-all`}
                onClick={() => navigate(createPageUrl(action.path))}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-lg bg-${action.color}-100`}>
                    <Icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">{action.label}</div>
                    <div className="text-xs text-slate-500">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}