import React, { useState, useEffect, useCallback } from "react";
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  Search,
  User,
  DollarSign,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import TransactionActions from '../components/admin/TransactionActions';
import { formatDateBrasiliaShort } from '../components/utils/dateUtils';

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [filteredTransacoes, setFilteredTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadTransacoes();
  }, []);

  const filterTransacoes = useCallback(() => {
    let filtered = [...transacoes];

    if (searchTerm) {
      filtered = filtered.filter(transacao =>
        transacao.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transacao.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transacao.dor_relatada?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(transacao => transacao.status_pagamento === statusFilter);
    }

    setFilteredTransacoes(filtered);
  }, [transacoes, searchTerm, statusFilter]);

  useEffect(() => {
    filterTransacoes();
  }, [filterTransacoes]);

  const loadTransacoes = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Transacao.list('-created_date');
      setTransacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
    setIsLoading(false);
  };

  const formatDate = formatDateBrasiliaShort;

  if (isLoading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-xl text-slate-600 flex items-center gap-3">
          <Clock className="animate-spin text-emerald-500" />
          Carregando transações...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Transações</h1>
          <p className="text-slate-600">Acompanhe todos os pagamentos e desbloqueios da plataforma</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, email ou problema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-emerald-500 bg-white/80"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 border-slate-200 focus:border-emerald-500 bg-white/80">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="processando">Processando</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
              <SelectItem value="expirado">Expirados</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-slate-600 flex-shrink-0">
            {filteredTransacoes.length} de {transacoes.length} transações
          </div>
        </div>

        <div className="space-y-4">
          {filteredTransacoes.map((transacao, index) => (
            <motion.div
              key={transacao.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900">
                          {transacao.cliente_nome || 'Cliente Anônimo'}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="w-4 h-4" />
                          {transacao.cliente_email || 'Email não informado'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TransactionActions
                        transaction={transacao}
                        onUpdate={loadTransacoes}
                      />
                      <div className="text-sm text-slate-500 flex-shrink-0">
                        {formatDate(transacao.created_date)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">Valor:</span> R$ {transacao.valor_total?.toFixed(2).replace('.', ',') || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold">Plano:</span> {transacao.plano_tipo || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      {transacao.status_pagamento === 'pago' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {transacao.status_pagamento === 'processando' && <Clock className="w-4 h-4 text-yellow-500" />}
                      {transacao.status_pagamento === 'pendente' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                      {transacao.status_pagamento === 'cancelado' && <XCircle className="w-4 h-4 text-red-500" />}
                      {transacao.status_pagamento === 'expirado' && <XCircle className="w-4 h-4 text-gray-500" />}
                      <span className="font-semibold">Status:</span>
                      <Badge
                        className={`
                          ${transacao.status_pagamento === 'pago' ? 'bg-green-100 text-green-800' : ''}
                          ${transacao.status_pagamento === 'processando' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${transacao.status_pagamento === 'pendente' ? 'bg-orange-100 text-orange-800' : ''}
                          ${transacao.status_pagamento === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                          ${transacao.status_pagamento === 'expirado' ? 'bg-gray-100 text-gray-800' : ''}
                        `}
                      >
                        {transacao.status_pagamento ? transacao.status_pagamento.charAt(0).toUpperCase() + transacao.status_pagamento.slice(1) : 'N/A'}
                      </Badge>
                    </div>
                    {transacao.dor_relatada && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-start gap-2">
                        <Star className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="font-semibold">Dor Relatada:</span> {transacao.dor_relatada}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {!isLoading && filteredTransacoes.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg font-semibold mb-2">Nenhuma transação encontrada</p>
            <p>Ajuste seus filtros ou adicione novas transações para vê-las aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}