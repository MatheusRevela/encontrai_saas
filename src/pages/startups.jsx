import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Building2,
  Globe,
  Mail,
  MessageCircle,
  Edit,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import StartupForm from "../components/startups/StartupForm";

export default function Startups() {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm]);

  const loadStartups = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Startup.list('-created_date');
      setStartups(data);
    } catch (error) {
      console.error("Erro ao carregar startups:", error);
    }
    setIsLoading(false);
  };

  const cleanupStartups = async () => {
    if (!confirm('Tem certeza que deseja excluir todas as startups exceto "Alo, chefia"?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { cleanupStartups: importedCleanupStartups } = await import('@/functions/cleanupStartups'); // Renamed to avoid conflict with outer function name
      const response = await importedCleanupStartups();

      if (response.status === 200) {
        alert('Startups excluídas com sucesso!');
        await loadStartups();
      } else {
        alert('Erro ao excluir startups');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir startups');
    }
    setIsProcessing(false);
  };

  const filterStartups = () => {
    if (!searchTerm) {
      setFilteredStartups(startups);
      return;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = startups.filter(startup =>
      startup.nome.toLowerCase().includes(lowerCaseSearch) ||
      startup.descricao.toLowerCase().includes(lowerCaseSearch) ||
      startup.categoria.toLowerCase().includes(lowerCaseSearch) ||
      startup.vertical_atuacao?.toLowerCase().includes(lowerCaseSearch) ||
      startup.modelo_negocio?.toLowerCase().includes(lowerCaseSearch) || // Add modelo_negocio to filter
      startup.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
    );
    setFilteredStartups(filtered);
  };

  const handleSave = async (startupData) => {
    setIsProcessing(true);
    try {
      if (editingStartup) {
        await base44.entities.Startup.update(editingStartup.id, startupData);
      } else {
        await base44.entities.Startup.create(startupData);
      }
      await loadStartups();
      setShowForm(false);
      setEditingStartup(null);
    } catch (error) {
      console.error("Erro ao salvar startup:", error);
    }
    setIsProcessing(false);
  };

  const handleEdit = (startup) => {
    setEditingStartup(startup);
    setShowForm(true);
  };

  const toggleStatus = async (startup) => {
    try {
      await base44.entities.Startup.update(startup.id, { ativo: !startup.ativo });
      await loadStartups();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const getCategoriaLabel = (categoria) => {
    const categorias = {
      gestao: "Gestão",
      vendas: "Vendas",
      marketing: "Marketing",
      financeiro: "Financeiro",
      operacional: "Operacional",
      rh: "Recursos Humanos",
      tecnologia: "Tecnologia",
      logistica: "Logística"
    };
    return categorias[categoria] || categoria;
  };

  const getVerticalLabel = (vertical) => {
    const verticais = {
      agtech: "Agtech", biotech: "Biotech", ciberseguranca: "Cibersegurança", cleantech: "Cleantech",
      construtech: "Construtech", deeptech: "Deeptech", edtech: "Edtech", energytech: "Energytech",
      fashiontech: "Fashiontech", fintech: "Fintech", foodtech: "Foodtech", govtech: "Govtech",
      greentech: "Greentech", healthtech: "Healthtech", hrtech: "HRTech", indtech: "Indtech",
      insurtech: "Insurtech", legaltech: "Legaltech", logtech: "Logtech", martech: "Martech",
      mobilidade: "Mobilidade", pet_tech: "Pet-tech", proptech: "Proptech", regtech: "Regtech",
      retailtech: "Retailtech", salestech: "Salestech", sportech: "Sportech",
      supply_chain: "SupplyChain", traveltech: "Traveltech"
    };
    return verticais[vertical] || vertical;
  };

  const getModeloNegocioLabel = (modelo) => {
    const modelos = {
      assinatura: "Assinatura",
      pagamento_uso: "Pagamento por Uso",
      marketplace: "Marketplace",
      consultoria: "Consultoria"
    };
    return modelos[modelo] || modelo;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Startups</h1>
            <p className="text-slate-600">Gerencie as soluções disponíveis no EncontrAI</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={cleanupStartups}
              disabled={isProcessing}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Limpar Base
            </Button>
            <Button
              onClick={() => {
                setEditingStartup(null);
                setShowForm(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Startup
            </Button>
          </div>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StartupForm
              startup={editingStartup}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingStartup(null);
              }}
              isProcessing={isProcessing}
            />
          </motion.div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar startups, categorias, verticais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-emerald-500 bg-white/80"
            />
          </div>
          <div className="text-sm text-slate-600">
            {filteredStartups.length} de {startups.length} startups
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredStartups.map((startup) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${
                  !startup.ativo ? 'opacity-60' : ''
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-900">
                            {startup.nome}
                          </CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              {getCategoriaLabel(startup.categoria)}
                            </Badge>
                            {startup.vertical_atuacao && (
                               <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {getVerticalLabel(startup.vertical_atuacao)}
                               </Badge>
                            )}
                            {startup.modelo_negocio && (
                               <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                {getModeloNegocioLabel(startup.modelo_negocio)}
                               </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleStatus(startup)}
                          className="h-8 w-8"
                        >
                          {startup.ativo ? (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(startup)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {startup.descricao}
                    </p>

                    {startup.tags && startup.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {startup.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {tag}
                          </Badge>
                        ))}
                        {startup.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                            +{startup.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex gap-3">
                        {startup.site && (
                          <a href={startup.site} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 text-slate-400 hover:text-emerald-600 transition-colors" />
                          </a>
                        )}
                        {startup.email && (
                          <a href={`mailto:${startup.email}`}>
                            <Mail className="w-4 h-4 text-slate-400 hover:text-emerald-600 transition-colors" />
                          </a>
                        )}
                        {startup.whatsapp && (
                          <a href={`https://wa.me/${startup.whatsapp}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4 text-slate-400 hover:text-emerald-600 transition-colors" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {startup.preco_base && (
                          <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                            {startup.preco_base}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredStartups.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma startup encontrada</h3>
            <p className="text-slate-600">
              {searchTerm ? 'Tente usar outros termos de busca' : 'Adicione sua primeira startup para começar'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}