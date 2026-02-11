import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Startup } from "@/entities/Startup";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Building2, Trash2, ChevronLeft, ChevronRight, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import StartupForm from "../components/startups/StartupForm";
import StartupFilters from "../components/startups/StartupFilters";
import StartupCard from "../components/startups/StartupCard";
import CronJobStatus from "../components/startups/CronJobStatus";
import VerifyAllButton from '../components/startups/VerifyAllButton';
import { verificarExistenciaStartups } from '@/functions/verificarExistenciaStartups';
import { diagnosticoStartups } from '@/functions/diagnosticoStartups';
import { deleteInactiveStartups } from '@/functions/deleteInactiveStartups';
import { processMLFeedback } from '@/functions/processMLFeedback';

const ITEMS_PER_PAGE = 25;

export default function Startups() {
  const [sessionId] = useState(() => `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Data states
  const [allStartups, setAllStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [currentPageStartups, setCurrentPageStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem(`startup_filters_${sessionId}`);
    return savedFilters ? JSON.parse(savedFilters) : {
      search: '',
      categoria: 'all',
      status: 'all',
      vertical: 'all',
      origem: 'all',
      avaliacaoEspecialista: 'all',
      showProblemsOnly: false,
      showDuplicatesOnly: false,
      sortBy: 'recent'
    };
  });

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState(null);
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
  const [isDeletingInactive, setIsDeletingInactive] = useState(false);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);

  const lastVerificationTime = useMemo(() => {
    if (!allStartups || allStartups.length === 0) return null;
    
    // Verificar se existe alguma startup nunca verificada
    const neverVerified = allStartups.some(s => !s.ultima_verificacao);
    if (neverVerified) {
      return { type: 'never_verified' };
    }
    
    // Se todas foram verificadas, encontrar a data mais ANTIGA
    let oldest = null;
    for (const startup of allStartups) {
      if (startup.ultima_verificacao) {
        const checkDate = new Date(startup.ultima_verificacao);
        if (!oldest || checkDate < oldest) {
          oldest = checkDate;
        }
      }
    }
    return oldest ? { type: 'oldest', date: oldest } : null;
  }, [allStartups]);

  const applyFilters = useCallback(() => {
    let currentFiltered = [...allStartups];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(s =>
        s.nome.toLowerCase().includes(searchTerm) ||
        (s.site && s.site.toLowerCase().includes(searchTerm)) ||
        (s.descricao && s.descricao.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.categoria && filters.categoria !== 'all') {
      currentFiltered = currentFiltered.filter(s => s.categoria === filters.categoria);
    }

    if (filters.status && filters.status !== 'all') {
      currentFiltered = currentFiltered.filter(s =>
        filters.status === 'ativo' ? s.ativo : !s.ativo
      );
    }

    if (filters.vertical && filters.vertical !== 'all') {
      currentFiltered = currentFiltered.filter(s => s.vertical_atuacao === filters.vertical);
    }

    if (filters.origem && filters.origem !== 'all') {
      currentFiltered = currentFiltered.filter(s => s.origem_criacao === filters.origem);
    }

    if (filters.avaliacaoEspecialista && filters.avaliacaoEspecialista !== 'all') {
      switch (filters.avaliacaoEspecialista) {
        case 'avaliadas':
          currentFiltered = currentFiltered.filter(s => s.avaliacao_qualitativa?.rating_final);
          break;
        case 'nao_avaliadas':
          currentFiltered = currentFiltered.filter(s => !s.avaliacao_qualitativa?.rating_final);
          break;
      }
    }

    if (filters.showProblemsOnly) {
      currentFiltered = currentFiltered.filter(s => {
        return s.status_verificacao &&
               (s.status_verificacao.site_online === false ||
                s.status_verificacao.ssl_valido === false ||
                s.status_verificacao.email_valido === false);
      });
    }

    if (filters.showDuplicatesOnly) {
      const siteCounts = currentFiltered.reduce((acc, s) => {
        if (s.site) {
          const normalizedSite = s.site.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
          acc[normalizedSite] = (acc[normalizedSite] || 0) + 1;
        }
        return acc;
      }, {});

      currentFiltered = currentFiltered.filter(s => {
        if (!s.site) return false;
        const normalizedSite = s.site.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        return siteCounts[normalizedSite] > 1;
      });
    }

    if (filters.sortBy === 'recent') {
      currentFiltered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (filters.sortBy === 'nome_asc') {
      currentFiltered.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (filters.sortBy === 'nome_desc') {
      currentFiltered.sort((a, b) => b.nome.localeCompare(a.nome));
    } else if (filters.sortBy === 'verificacao_recente') {
      currentFiltered.sort((a, b) => {
        const aVerificada = a.ultima_verificacao;
        const bVerificada = b.ultima_verificacao;
        
        // Ambas verificadas: mais recente primeiro
        if (aVerificada && bVerificada) {
          return new Date(b.ultima_verificacao) - new Date(a.ultima_verificacao);
        }
        // Apenas A verificada: A vem primeiro
        if (aVerificada && !bVerificada) return -1;
        // Apenas B verificada: B vem primeiro
        if (!aVerificada && bVerificada) return 1;
        // Nenhuma verificada: ordena por data de criação (mais recente primeiro)
        return new Date(b.created_date) - new Date(a.created_date);
      });
    } else if (filters.sortBy === 'verificacao_antiga') {
      currentFiltered.sort((a, b) => {
        const aVerificada = a.ultima_verificacao;
        const bVerificada = b.ultima_verificacao;
        
        // Ambas verificadas: mais antiga primeiro
        if (aVerificada && bVerificada) {
          return new Date(a.ultima_verificacao) - new Date(b.ultima_verificacao);
        }
        // Apenas A verificada: A vem primeiro
        if (aVerificada && !bVerificada) return -1;
        // Apenas B verificada: B vem primeiro
        if (!aVerificada && bVerificada) return 1;
        // Nenhuma verificada: ordena por data de criação (mais antiga primeiro)
        return new Date(a.created_date) - new Date(b.created_date);
      });
    } else if (filters.sortBy === 'avaliacao_desc') {
      currentFiltered.sort((a, b) => {
        const aScore = a.avaliacao_qualitativa?.score_final || 0;
        const bScore = b.avaliacao_qualitativa?.score_final || 0;
        return bScore - aScore;
      });
    } else if (filters.sortBy === 'nao_avaliadas_primeiro') {
      currentFiltered.sort((a, b) => {
        const aAvaliada = a.avaliacao_qualitativa?.rating_final;
        const bAvaliada = b.avaliacao_qualitativa?.rating_final;

        if (!aAvaliada && bAvaliada) return -1;
        if (aAvaliada && !bAvaliada) return 1;
        return 0;
      });
    }

    setFilteredStartups(currentFiltered);

    const newTotalPages = Math.ceil(currentFiltered.length / ITEMS_PER_PAGE);
    setTotalPages(newTotalPages);

    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [allStartups, filters, currentPage]);

  const applyPagination = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentPageStartups(filteredStartups.slice(startIndex, endIndex));
  }, [filteredStartups, currentPage]);

  const loadStartups = useCallback(async () => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const data = await Startup.list(`-created_date?_t=${timestamp}`);
      setAllStartups(data);
    } catch (error) {
      console.error('Erro ao carregar startups:', error);
      alert('Erro ao carregar startups.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStartupStatus = useCallback(async (startupId, updates) => {
    setIsProcessing(true);
    try {
      await Startup.update(startupId, updates);
      await loadStartups();
    } catch (error) {
      console.error("Erro ao atualizar status da startup:", error);
      alert('Erro ao atualizar startup.');
    } finally {
      setIsProcessing(false);
    }
  }, [loadStartups]);

  const deleteStartupById = useCallback(async (id) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta startup?");
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await Startup.delete(id);
      await loadStartups();
    } catch (error) {
      console.error("Erro ao excluir startup:", error);
      alert('Erro ao excluir startup.');
    } finally {
      setIsProcessing(false);
    }
  }, [loadStartups]);

  useEffect(() => {
    loadStartups();
  }, [loadStartups]);

  useEffect(() => {
    localStorage.setItem(`startup_filters_${sessionId}`, JSON.stringify(filters));
    applyFilters();
  }, [filters, allStartups, sessionId, applyFilters]);

  useEffect(() => {
    applyPagination();
  }, [filteredStartups, currentPage, applyPagination]);

  useEffect(() => {
    return () => {
      localStorage.removeItem(`startup_filters_${sessionId}`);
    };
  }, [sessionId]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const handleEdit = (startup) => {
    setEditingStartup(startup);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (startupData) => {
    setIsProcessing(true);
    try {
      if (editingStartup) {
        await Startup.update(editingStartup.id, startupData);
      } else {
        await Startup.create(startupData);
      }
      await loadStartups();
      setShowForm(false);
      setEditingStartup(null);
    } catch (error) {
      console.error("Erro ao salvar startup:", error);
      alert('Erro ao salvar startup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualVerification = async (startup, action) => {
    const now = new Date().toISOString();
    const updates = {
      verificacao_manual: {
        data_ultima_revisao: now,
        revisado_por: 'admin',
        status_aprovado: action === 'confirm_ok',
        observacoes_revisao: action === 'confirm_ok' ? 'Verificado manualmente: OK' : 'Verificado manualmente: Problema confirmado'
      }
    };

    if (action === 'confirm_problem') updates.ativo = false;
    if (action === 'confirm_ok') {
      updates.status_verificacao = { site_online: true, ssl_valido: true };
      updates.ultima_verificacao = now;
    }

    await updateStartupStatus(startup.id, updates);
  };

  const handleMarkResolved = useCallback(async (startupId) => {
    const now = new Date().toISOString();
    await updateStartupStatus(startupId, {
      status_verificacao: null,
      verificacao_manual: {
        data_ultima_revisao: now,
        revisado_por: 'admin',
        status_aprovado: true,
        observacoes_revisao: 'Problema marcado como resolvido'
      },
      ultima_verificacao: now
    });
  }, [updateStartupStatus]);

  const handleToggleStatus = useCallback(async (startupId, newStatus) => {
    await updateStartupStatus(startupId, { ativo: newStatus });
  }, [updateStartupStatus]);

  const handleDiagnostico = async () => {
    try {
      const response = await diagnosticoStartups();
      
      if (!response.data) {
        alert('Erro: Resposta vazia do servidor');
        return;
      }

      const dados = response.data;

      const relatorio = `
🔍 DIAGNÓSTICO DE STARTUPS
========================

📊 TOTAIS:
• Total no banco: ${dados.total_completo}
• Visíveis para você: ${dados.total_visiveis_usuario}
• Ativas: ${dados.ativas}
• Inativas: ${dados.inativas}

📁 POR ORIGEM:
• Cadastro manual: ${dados.por_origem.manual}
• Importação CSV: ${dados.por_origem.csv_import}

⭐ AVALIAÇÕES DE ESPECIALISTA:
• Avaliadas: ${dados.avaliacoes_especialista.avaliadas}
• Não avaliadas: ${dados.avaliacoes_especialista.nao_avaliadas}
• 5 estrelas: ${dados.avaliacoes_especialista.por_nota.cinco_estrelas}
• 4 estrelas: ${dados.avaliacoes_especialista.por_nota.quatro_estrelas}
• 3 estrelas: ${dados.avaliacoes_especialista.por_nota.tres_estrelas}
• 2 estrelas: ${dados.avaliacoes_especialista.por_nota.duas_estrelas}
• 1 estrela: ${dados.avaliacoes_especialista.por_nota.uma_estrela}

⚠️ POSSÍVEIS PROBLEMAS:
• Problema de RLS: ${dados.possivel_problema_rls ? 'SIM' : 'NÃO'}
• Startups ocultas: ${dados.diferenca_rls}

📝 ÚLTIMAS 10 CRIADAS:
${dados.mais_recentes.map(s => `• ${s.nome} (${s.ativo ? 'ativa' : 'inativa'}) - ${s.avaliacao_especialista ? s.avaliacao_especialista + '⭐' : 'não avaliada'} - ${new Date(s.created_date).toLocaleDateString()}`).join('\n')}
      `;

      alert(relatorio);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      
      let errorMessage = 'Erro ao executar diagnóstico.';
      if (error.response?.data?.details) {
        errorMessage += ` Detalhes: ${error.response.data.details}`;
      } else if (error.message) {
        errorMessage += ` Erro: ${error.message}`;
      }
      
      alert(errorMessage + '\n\nVerifique o console para mais detalhes.');
    }
  };

  const handleCheckExistence = async () => {
    setIsCheckingExistence(true);
    try {
      const response = await verificarExistenciaStartups();
      if (response.data) {
        const {
          totalProcessado = 0,
          duplicatasEncontradas = 0,
          desativadas = 0,
          falhas = []
        } = response.data;

        let alertMessage = `🧹 Verificação de Duplicatas Concluída!\n\n`;
        alertMessage += `📊 ${totalProcessado} startups verificadas no total.\n`;
        alertMessage += `🔗 ${duplicatasEncontradas} duplicatas encontradas com base no site.\n`;
        alertMessage += `🔌 ${desativadas} startups duplicadas foram desativadas com sucesso.\n\n`;

        if (falhas.length > 0) {
          alertMessage += `⚠️ Falhas durante a desativação:\n${falhas.slice(0, 10).map(f => `• ${f.nome}: ${f.erro}`).join('\n')}\n`;
        }

        if (duplicatasEncontradas === 0) {
          alertMessage += "✨ Sua base de dados está limpa, sem duplicatas!";
        } else {
          alertMessage += "\n🔍 Ativando filtro para mostrar todas as duplicatas restantes...";
          setFilters(prev => ({
            ...prev,
            showDuplicatesOnly: true,
            sortBy: 'site_asc'
          }));
        }

        alert(alertMessage);
        await loadStartups();
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      alert('Erro ao verificar duplicatas. Tente novamente.');
    } finally {
      setIsCheckingExistence(false);
    }
  };

  const handleDeleteInactive = async () => {
    const firstConfirm = confirm("⚠️ ATENÇÃO!\n\nVocê está prestes a excluir TODAS as startups inativas do banco de dados.\n\nEsta ação é PERMANENTE e não pode ser desfeita. Deseja continuar?");
    if (!firstConfirm) return;

    const secondConfirm = confirm("Confirmação final: Tem certeza absoluta de que deseja excluir permanentemente todas as startups inativas?");
    if (!secondConfirm) return;

    setIsDeletingInactive(true);
    try {
      const response = await deleteInactiveStartups();
      alert(response.data.message);
      await loadStartups();
    } catch (error) {
      console.error('Erro ao excluir startups inativas:', error);
      alert(`Ocorreu um erro: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsDeletingInactive(false);
    }
  };

  const handleProcessFeedback = async () => {
    setIsProcessingFeedback(true);
    try {
      const response = await processMLFeedback();
      if (response.data) {
        let alertMessage = `🧠 Otimização da IA Concluída!\n\n`;
        alertMessage += `${response.data.message}\n\n`;
        alertMessage += `📈 ${response.data.updatedCount} startups tiveram seus scores atualizados.\n\n`;

        if (response.data.topPerformers && response.data.topPerformers.length > 0) {
          alertMessage += `⭐ TOP 5 AVALIADAS:\n`;
          response.data.topPerformers.forEach(p => {
            alertMessage += `• ${p.nome} - Nota: ${p.rating.toFixed(2)} (${p.evaluations} avaliações)\n`;
          });
        }
        alert(alertMessage);
        await loadStartups();
      }
    } catch (error) {
      console.error('Erro ao processar feedback:', error);
      alert('Ocorreu um erro ao otimizar a IA. Tente novamente.');
    } finally {
      setIsProcessingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const anyActionRunning = isCheckingExistence || isDeletingInactive || isProcessing || isProcessingFeedback;

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestão de Startups</h1>
          <p className="text-slate-600">Gerencie o ecossistema de soluções do EncontrAI</p>
        </div>

        {/* Primeira linha de botões - Monitoramento e Otimização */}
        <div className="flex flex-wrap items-center gap-3">
          <CronJobStatus lastRunTimestamp={lastVerificationTime} />
          <Button
            variant="outline"
            onClick={handleDiagnostico}
            size="sm"
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
            disabled={anyActionRunning}
          >
            🔍 Diagnóstico
          </Button>
          <Button
            variant="outline"
            onClick={handleProcessFeedback}
            disabled={anyActionRunning}
            size="sm"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {isProcessingFeedback ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Otimizando...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 mr-2" />
                Otimizar IA
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCheckExistence}
            disabled={anyActionRunning}
            size="sm"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            {isCheckingExistence ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando DB...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Limpar Duplicatas
              </>
            )}
          </Button>
        </div>

        {/* Segunda linha de botões - Ações Principais */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="destructive"
            onClick={handleDeleteInactive}
            disabled={anyActionRunning}
            size="sm"
          >
            {isDeletingInactive ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Inativas
              </>
            )}
          </Button>
          <VerifyAllButton 
            allStartups={allStartups} 
            onComplete={() => loadStartups()}
            disabled={anyActionRunning}
          />
          <Button 
            onClick={() => { setEditingStartup(null); setShowForm(true); }} 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg" 
            disabled={anyActionRunning}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Startup
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }} className="overflow-hidden">
              <StartupForm startup={editingStartup} onSave={handleSave} onCancel={() => setShowForm(false)} isProcessing={isProcessing} />
            </motion.div>
          )}
        </AnimatePresence>

        <StartupFilters filters={filters} setFilters={setFilters} totalCount={filteredStartups.length} />

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white/80 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredStartups.length)} de {filteredStartups.length} startups
            </div>

            <div className="flex items-center gap-2">
              {/* Pagination controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {currentPageStartups.map((startup) => (
              <StartupCard
                key={startup.id}
                startup={startup}
                onEdit={handleEdit}
                onDelete={deleteStartupById}
                onToggleStatus={handleToggleStatus}
                onManualVerify={handleManualVerification}
                onMarkResolved={handleMarkResolved}
                isProcessing={isProcessing}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredStartups.length === 0 && !isLoading && (
          <div className="text-center py-12 col-span-full">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma startup encontrada</h3>
            <p className="text-slate-600">Ajuste os filtros ou adicione sua primeira startup para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}