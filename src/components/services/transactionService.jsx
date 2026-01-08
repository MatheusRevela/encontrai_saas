
import { Transacao, Startup } from '@/entities/all';
import { apiService } from './api';
import { validateSessionId, generateSecureSessionId } from '../utils/validation';
import { LIMITS } from '../utils/constants';

class TransactionService {
  async createTransaction(problema, userEmail, existingSessionId = null) {
    if (!problema || problema.length < LIMITS.MIN_PROBLEMA_LENGTH) {
      throw new Error('Problema muito curto');
    }

    if (!userEmail) {
      throw new Error('Email do usuário é obrigatório');
    }

    const sessionId = existingSessionId || generateSecureSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + LIMITS.TRANSACAO_EXPIRY_HOURS);

    try {
      const startups = await Startup.list();
      const activeStartups = startups.filter(s => s.ativo);

      if (activeStartups.length === 0) {
        throw new Error('Nenhuma startup ativa disponível no momento');
      }

      const [insight, matches] = await Promise.all([
        apiService.generateInsight(problema),
        apiService.matchStartups(problema, activeStartups)
      ]);

      const enrichedMatches = matches
        .map(match => {
          const startup = activeStartups.find(s => s.nome === match.startup_name);
          if (!startup) return null;
          
          return {
            startup_id: startup.id,
            nome: startup.nome,
            categoria: startup.categoria,
            match_percentage: Math.min(100, Math.max(0, match.match_percentage)),
            resumo_personalizado: match.personalized_summary
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.match_percentage - a.match_percentage);

      const limitedMatches = enrichedMatches.slice(0, 5);
      const extraHighMatches = enrichedMatches.slice(5).filter(match => match.match_percentage >= 90);
      const finalMatches = [...limitedMatches, ...extraHighMatches];

      const transacaoData = {
        cliente_email: userEmail,
        dor_relatada: problema,
        insight_gerado: insight,
        startups_sugeridas: finalMatches,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
        status_pagamento: 'pendente'
      };

      const existing = await Transacao.filter({ session_id: sessionId });
      let transacao;
      if (existing.length > 0) {
        transacao = await Transacao.update(existing[0].id, transacaoData);
      } else {
        transacao = await Transacao.create(transacaoData);
      }

      return {
        transacao,
        insight,
        recomendacoes: finalMatches,
        sessionId
      };

    } catch (error) {
      console.error('Erro ao criar/atualizar transação:', error);
      throw new Error('Falha ao processar sua solicitação. Tente novamente.');
    }
  }

  async getTransaction(sessionId) {
    if (!sessionId) {
      throw new Error("Session ID é obrigatório");
    }
    const transacoes = await Transacao.filter({ session_id: sessionId });
    if (transacoes.length === 0) {
      throw new Error("Transação não encontrada");
    }
    return transacoes[0];
  }

  async updateSelections(sessionId, selectedStartupIds, valorPorStartup) {
    if (!validateSessionId(sessionId)) {
      throw new Error('ID de sessão inválido');
    }

    if (!Array.isArray(selectedStartupIds)) {
        throw new Error('A seleção de startups é inválida');
    }

    if (selectedStartupIds.length > LIMITS.MAX_STARTUPS_SELECIONADAS) {
      throw new Error(`Máximo de ${LIMITS.MAX_STARTUPS_SELECIONADAS} startups podem ser selecionadas`);
    }

    const transacao = await this.getTransaction(sessionId);
    
    const sugeridaIds = transacao.startups_sugeridas?.map(s => s.startup_id) || [];
    const invalidSelections = selectedStartupIds.filter(id => !sugeridaIds.includes(id));
    
    if (invalidSelections.length > 0) {
      throw new Error('Startups selecionadas inválidas');
    }

    const valorTotal = selectedStartupIds.length * valorPorStartup;

    const updatedTransaction = await Transacao.update(transacao.id, {
      startups_selecionadas: selectedStartupIds,
      valor_total: valorTotal,
      valor_por_startup: valorPorStartup
    });

    return updatedTransaction;
  }
}

export const transactionService = new TransactionService();
