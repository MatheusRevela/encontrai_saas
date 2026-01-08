
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle,
  Building2,
  Loader2,
  Star // Added Star icon
} from 'lucide-react';
import { Transacao, Startup } from '@/entities/all';
import { SendEmail } from '@/integrations/Core';

export default function TransactionActions({ transaction, onUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false); // New state variable

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      const startups = await Startup.list();
      const startupsCompletas = startups.filter(s => transaction.startups_selecionadas?.includes(s.id));
      
      const dadosDesbloqueados = startupsCompletas.map(startup => ({
        startup_id: startup.id,
        nome: startup.nome,
        descricao: startup.descricao,
        categoria: startup.categoria,
        vertical_atuacao: startup.vertical_atuacao,
        modelo_negocio: startup.modelo_negocio,
        site: startup.site,
        email: startup.email,
        whatsapp: startup.whatsapp,
        linkedin: startup.linkedin,
        preco_base: startup.preco_base,
        logo_url: startup.logo_url
      }));

      await Transacao.update(transaction.id, {
        status_pagamento: 'pago',
        startups_desbloqueadas: dadosDesbloqueados
      });

      if (transaction.cliente_email && dadosDesbloqueados.length > 0) {
        const emailBody = `
Olá ${transaction.cliente_nome || 'Cliente'},

Ótima notícia! Seu pagamento foi confirmado e suas soluções foram desbloqueadas.

Aqui estão os contatos das ${dadosDesbloqueados.length} startup${dadosDesbloqueados.length > 1 ? 's' : ''} que você escolheu:

${dadosDesbloqueados.map(startup => `
🏢 ${startup.nome} (${startup.categoria}${startup.vertical_atuacao ? ` - ${startup.vertical_atuacao}` : ''})
${startup.email ? `📧 Email: ${startup.email}` : ''}
${startup.whatsapp ? `📱 WhatsApp: ${startup.whatsapp}` : ''}
${startup.site ? `🌐 Site: ${startup.site}` : ''}
${startup.preco_base ? `💰 Investimento: ${startup.preco_base}` : ''}

Descrição: ${startup.descricao}
---
`).join('')}

Você também pode acessar essas informações a qualquer momento em: 
${window.location.origin}/DetalhesBusca?id=${transaction.id}

Obrigado por usar o EncontrAI!

P.S. Todas as nossas startups são verificadas mensalmente para garantir que estão ativas e atualizadas.
        `;

        await SendEmail({
          to: transaction.cliente_email,
          subject: `🎉 Suas ${dadosDesbloqueados.length} solução${dadosDesbloqueados.length > 1 ? 'ões' : ''} foi${dadosDesbloqueados.length > 1 ? 'ram' : ''} desbloqueada${dadosDesbloqueados.length > 1 ? 's' : ''}!`,
          body: emailBody
        });
      }

      onUpdate();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsRejected = async () => {
    setIsProcessing(true);
    try {
      await Transacao.update(transaction.id, {
        status_pagamento: 'cancelado'
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao cancelar transação:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFeature = async () => {
    setIsFeaturing(true);
    try {
      await Transacao.update(transaction.id, {
        destaque_home: !transaction.destaque_home,
      });
      onUpdate();
    } catch (error) {
      console.error("Erro ao destacar transação:", error);
    } finally {
      setIsFeaturing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Pago</Badge>;
      case 'processando':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processando</Badge>;
      case 'pendente':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-2"> {/* Adjusted gap from gap-3 to gap-2 */}
      {transaction.feedback && transaction.avaliacao ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleFeature}
          disabled={isFeaturing}
          title={transaction.destaque_home ? "Remover da Home" : "Destacar na Home"}
          className={`h-8 w-8 ${transaction.destaque_home ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'}`}
        >
          {isFeaturing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className={`w-5 h-5 ${transaction.destaque_home ? 'fill-current' : ''}`} />
          )}
        </Button>
      ) : (
        <div className="w-8"></div> // Placeholder to keep alignment
      )}

      {getStatusBadge(transaction.status_pagamento)}
      
      {transaction.status_pagamento === 'processando' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleMarkAsPaid}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs"
          >
            {isProcessing ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3 mr-1" />
            )}
            Confirmar Pago
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAsRejected}
            disabled={isProcessing}
            className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
        </div>
      )}

      {transaction.status_pagamento === 'pendente' && (
        <Button
          size="sm"
          onClick={handleMarkAsPaid}
          disabled={isProcessing}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="w-3 h-3 mr-1" />
          )}
          Marcar como Pago
        </Button>
      )}

      {transaction.status_pagamento === 'pago' && transaction.startups_desbloqueadas?.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <Building2 className="w-3 h-3" />
          {transaction.startups_desbloqueadas.length} desbloqueada{transaction.startups_desbloqueadas.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
