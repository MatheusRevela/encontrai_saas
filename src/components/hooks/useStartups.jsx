import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from '@/api/base44Client';

export function useStartups() {
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verticalFilter, setVerticalFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false); // NOVO filtro
  const [sortBy, setSortBy] = useState("-created_date");

  const loadStartups = useCallback(async () => {
    setIsLoading(true);
    try {
      // CÓDIGO ORIGINAL - SEM QUALQUER LIMITE OU PAGINAÇÃO
      const data = await base44.entities.Startup.list('-created_date');
      setStartups(data || []);
    } catch (error) {
      console.error("Erro ao carregar startups:", error);
      setStartups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStartups();
  }, [loadStartups]);

  const updateStartupStatus = async (startupId, updates) => {
    setIsProcessing(true);
    try {
      await base44.entities.Startup.update(startupId, updates);
      await loadStartups();
    } catch (error) {
      console.error("Erro ao atualizar startup:", error);
      alert('Ocorreu um erro ao atualizar a startup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteStartupById = async (startupId) => {
    setIsProcessing(true);
    try {
      await base44.entities.Startup.delete(startupId);
      await loadStartups();
      alert('Startup excluída com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir startup:', error);
      alert('Ocorreu um erro ao excluir a startup.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para detectar duplicatas por site
  // Memoized function to avoid re-creating on every render
  const getDuplicateIds = useCallback(() => {
    const siteCounts = {};
    startups.forEach(startup => {
      if (startup.site) {
        const normalizedSite = startup.site.toLowerCase().trim()
          .replace(/^(https?:\/\/)?(www\.)?/, '')
          .replace(/\/$/, '');
        
        if (!siteCounts[normalizedSite]) {
          siteCounts[normalizedSite] = [];
        }
        siteCounts[normalizedSite].push(startup.id);
      }
    });
    
    const duplicateIds = new Set();
    Object.values(siteCounts).forEach(ids => {
      if (ids.length > 1) {
        ids.forEach(id => duplicateIds.add(id));
      }
    });
    
    return duplicateIds;
  }, [startups]); // Recalculate only when 'startups' data changes

  // Memoize the set of duplicate IDs to avoid re-calculating on every filter run
  const memoizedDuplicateIds = useMemo(() => {
    if (showDuplicatesOnly) {
      return getDuplicateIds();
    }
    return new Set(); // Return an empty set if the filter is not active
  }, [showDuplicatesOnly, getDuplicateIds]);


  // Filtrar startups localmente (como era antes)
  const filteredStartups = startups.filter(startup => {
    let matches = true;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      matches = matches && (
        startup.nome.toLowerCase().includes(lowerSearchTerm) ||
        (startup.descricao && startup.descricao.toLowerCase().includes(lowerSearchTerm)) ||
        startup.categoria.toLowerCase().includes(lowerSearchTerm) ||
        startup.vertical_atuacao?.toLowerCase().includes(lowerSearchTerm) ||
        startup.modelo_negocio?.toLowerCase().includes(lowerSearchTerm) ||
        startup.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (categoryFilter !== "all") {
      matches = matches && startup.categoria === categoryFilter;
    }

    if (verticalFilter !== "all") {
      matches = matches && startup.vertical_atuacao === verticalFilter;
    }

    if (originFilter !== "all") {
      matches = matches && (startup.origem_criacao || 'manual') === originFilter;
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "ativo";
      matches = matches && startup.ativo === isActive;
    }

    if (showProblemsOnly) {
      matches = matches && startup.status_verificacao?.site_online === false;
    }

    // NOVO: Filtro para mostrar apenas duplicatas
    if (showDuplicatesOnly) {
      matches = matches && memoizedDuplicateIds.has(startup.id);
    }

    return matches;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'nome_asc':
        return a.nome.localeCompare(b.nome);
      case 'nome_desc':
        return b.nome.localeCompare(a.nome);
      case 'verificacao_asc':
        return (a.ultima_verificacao ? new Date(a.ultima_verificacao) : new Date(0)) - (b.ultima_verificacao ? new Date(b.ultima_verificacao) : new Date(0));
      case 'site_asc': // NOVO: Ordenar por site para agrupar duplicatas
        return (a.site || '').localeCompare(b.site || '');
      case '-created_date':
      default:
        return new Date(b.created_date) - new Date(a.created_date);
    }
  });

  return {
    startups: filteredStartups,
    totalCount: filteredStartups.length,
    isLoading,
    isProcessing,
    setIsProcessing,
    loadStartups,
    updateStartupStatus,
    deleteStartupById,
    filters: {
      searchTerm, setSearchTerm,
      categoryFilter, setCategoryFilter,
      verticalFilter, setVerticalFilter,
      originFilter, setOriginFilter,
      statusFilter, setStatusFilter,
      showProblemsOnly, setShowProblemsOnly,
      showDuplicatesOnly, setShowDuplicatesOnly, // NOVO
      sortBy, setSortBy,
    }
  };
}