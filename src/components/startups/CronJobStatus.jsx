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
  const timeAgo = lastRunTimestamp 
    ? formatDistanceToNow(new Date(lastRunTimestamp), { addSuffix: true, locale: ptBR })
    : 'nunca executada';

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg bg-slate-100 border border-slate-200">
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