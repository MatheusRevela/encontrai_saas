import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  AlertCircle,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDateBrasiliaShort } from '../components/utils/dateUtils';

function getPrincipalProblem(description) {
  if (!description) return "Desafio não descrito.";
  if (description.includes(' || ')) {
    const problemPart = description.split(' || ')[0];
    return problemPart.replace('Desafio principal:', '').trim();
  }
  if (description.includes("Desafio principal:")) {
    return description.split("Perfil:")[0].replace("Desafio principal:", "").trim();
  }
  return description;
}

function StatusBadge({ status }) {
  if (status === 'pago') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border flex items-center gap-2 text-xs">
        <CheckCircle className="w-4 h-4" />
        <span>Pago</span>
      </Badge>
    );
  }
  
  if (status === 'pendente') {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 border flex items-center gap-2 text-xs">
        <Clock className="w-4 h-4" />
        <span>Pendente</span>
      </Badge>
    );
  }
  
  if (status === 'processando') {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border flex items-center gap-2 text-xs">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Processando</span>
      </Badge>
    );
  }
  
  if (status === 'cancelado') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 border flex items-center gap-2 text-xs">
        <XCircle className="w-4 h-4" />
        <span>Cancelado</span>
      </Badge>
    );
  }
  
  return (
    <Badge className="bg-slate-100 text-slate-800 border-slate-200 border flex items-center gap-2 text-xs">
      <AlertCircle className="w-4 h-4" />
      <span>{status || 'N/A'}</span>
    </Badge>
  );
}

export default function Conversas() {
  const [sessionId] = useState(`conversas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [conversas, setConversas] = useState([]);
  const [filteredConversas, setFilteredConversas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadConversas = async () => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const data = await base44.entities.Transacao.list(`-created_date?_t=${timestamp}`);
      setConversas(data || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
      setConversas([]);
    }
    setIsLoading(false);
  };

  const filterConversas = useCallback(() => {
    let filtered = [...conversas];

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(conversa =>
        (conversa.cliente_nome?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (conversa.cliente_email?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (conversa.dor_relatada?.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === 'avaliado') {
        filtered = filtered.filter(conversa => conversa.avaliacao && conversa.avaliacao > 0);
      } else {
        filtered = filtered.filter(conversa => conversa.status_pagamento === statusFilter);
      }
    }

    setFilteredConversas(filtered);
  }, [conversas, searchTerm, statusFilter]);

  useEffect(() => {
    loadConversas();
  }, []);

  useEffect(() => {
    filterConversas();
  }, [filterConversas]); // Dependency is now the memoized filterConversas function

  const handleToggleDestaque = async (conversa) => {
    try {
      const novoEstado = !conversa.destaque_home;
      await base44.entities.Transacao.update(conversa.id, { destaque_home: novoEstado });
      setConversas(prev =>
        prev.map(c =>
          c.id === conversa.id ? { ...c, destaque_home: novoEstado } : c
        )
      );
    } catch (error) {
      console.error("Erro ao destacar a conversa:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Histórico de Buscas</h1>
          <p className="text-slate-600">Acompanhe todas as buscas realizadas pelos usuários na plataforma.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por usuário, email ou desafio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-emerald-500 bg-white/80"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-56 border-slate-200 focus:border-emerald-500 bg-white/80">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="avaliado">Avaliadas</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="processando">Processando</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-slate-600 flex items-center whitespace-nowrap">
            {filteredConversas.length} de {conversas.length} buscas
          </div>
        </div>

        <div className="space-y-4">
          {filteredConversas.map((conversa, index) => (
            <motion.div
              key={conversa.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900">
                          {conversa.cliente_nome || 'Usuário Anônimo'}
                        </CardTitle>
                        <p className="text-sm text-slate-600">{conversa.cliente_email || conversa.created_by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleDestaque(conversa)}
                        title={conversa.destaque_home ? "Remover destaque da Home" : "Destacar na Home"}
                      >
                        <Star className={`w-5 h-5 transition-all ${conversa.destaque_home ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-amber-500'}`} />
                      </Button>
                      <StatusBadge status={conversa.status_pagamento} />
                      <div className="text-sm text-slate-500">
                        {formatDateBrasiliaShort(conversa.created_date)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">Desafio Relatado:</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      {getPrincipalProblem(conversa.dor_relatada)}
                    </p>
                  </div>
                  {conversa.valor_total > 0 && (
                     <div className="flex items-center gap-2 text-sm pt-3 border-t border-slate-200/60">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-slate-700">Valor:</span>
                        <span className="font-semibold text-emerald-700">R$ {conversa.valor_total.toFixed(2).replace('.', ',')}</span>
                     </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredConversas.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma busca encontrada</h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== "all"
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'As buscas dos usuários aparecerão aqui.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}