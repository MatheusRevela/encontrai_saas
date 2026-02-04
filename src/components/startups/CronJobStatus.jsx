import React from 'react';
import { Clock, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CronJobStatus({ lastRunTimestamp }) {
  let timeAgo;
  let bgColor = 'bg-slate-100';
  let borderColor = 'border-slate-200';
  
  if (!lastRunTimestamp) {
    timeAgo = 'nunca executada';
  } else if (lastRunTimestamp.type === 'never_verified') {
    timeAgo = '⚠️ Existem startups nunca verificadas';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
  } else if (lastRunTimestamp.type === 'oldest') {
    timeAgo = formatDistanceToNow(new Date(lastRunTimestamp.date), { addSuffix: true, locale: ptBR });
    // Se a data mais antiga for > 7 dias, destacar em amarelo
    const daysDiff = (Date.now() - new Date(lastRunTimestamp.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      bgColor = 'bg-yellow-50';
      borderColor = 'border-yellow-200';
    }
  } else {
    timeAgo = formatDistanceToNow(new Date(lastRunTimestamp), { addSuffix: true, locale: ptBR });
  }

  return (
    <div className={`flex items-center gap-4 p-2 rounded-lg border ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <Clock className="w-4 h-4 text-slate-500" />
        <div>
          <span className="font-medium">Verificação Automática</span>
          <p className="text-xs text-slate-500">Última execução: {timeAgo}</p>
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm font-semibold">Frequência: A cada 24 horas</p>
            <p className="text-xs mt-1">
              Para alterar, vá ao painel principal, clique em "Código" &gt; "Funções", encontre a função `verificarStartups` e clique no ícone de relógio para agendar.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}