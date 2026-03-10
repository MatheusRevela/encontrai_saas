/**
 * Repository Pattern — Abstrai chamadas ao Base44 SDK.
 *
 * USE ESTAS FUNÇÕES em vez de chamar base44.entities.* diretamente.
 * Reduz vendor lock-in e facilita futuras migrações de infraestrutura.
 * Se o Base44 SDK mudar, apenas este arquivo precisa ser atualizado.
 */
import { base44 } from '@/api/base44Client';

export const StartupRepo = {
  getAtivas: () => base44.entities.Startup.filter({ ativo: true }),
  getAll: (order = '-created_date') => base44.entities.Startup.list(order),
  getById: (id) => base44.entities.Startup.get(id),
  create: (data) => base44.entities.Startup.create(data),
  update: (id, data) => base44.entities.Startup.update(id, data),
  delete: (id) => base44.entities.Startup.delete(id),
};

export const TransacaoRepo = {
  getBySessionId: (sessionId) => base44.entities.Transacao.filter({ session_id: sessionId }),
  getByUser: (email) => base44.entities.Transacao.filter({ created_by: email }),
  getPagasByUser: (email) => base44.entities.Transacao.filter({ created_by: email, status_pagamento: 'pago' }),
  getAll: (order = '-created_date') => base44.entities.Transacao.list(order),
  create: (data) => base44.entities.Transacao.create(data),
  update: (id, data) => base44.entities.Transacao.update(id, data),
};

export const UserRepo = {
  getAll: () => base44.entities.User.list(),
  me: () => base44.auth.me(),
  isAuthenticated: () => base44.auth.isAuthenticated(),
  logout: (redirectUrl) => base44.auth.logout(redirectUrl),
  updateMe: (data) => base44.auth.updateMe(data),
};