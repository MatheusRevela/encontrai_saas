import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, ArrowUpDown, ListFilter, Building2, Star } from "lucide-react";

const CATEGORIAS = [
  { value: "all", label: "Todas as Categorias" },
  { value: "gestao", label: "Gestão" },
  { value: "vendas", label: "Vendas" },
  { value: "marketing", label: "Marketing" },
  { value: "financeiro", label: "Financeiro" },
  { value: "operacional", label: "Operacional" },
  { value: "rh", label: "Recursos Humanos" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "logistica", label: "Logística" }
];

const VERTICAIS = [
  { value: "all", label: "Todas as Verticais" },
  { value: "agtech", label: "Agtech" },
  { value: "biotech", label: "Biotech" },
  { value: "ciberseguranca", label: "Cibersegurança" },
  { value: "cleantech", label: "Cleantech" },
  { value: "construtech", label: "Construtech" },
  { value: "deeptech", label: "Deeptech" },
  { value: "edtech", label: "Edtech" },
  { value: "energytech", label: "Energytech" },
  { value: "fashiontech", label: "Fashiontech" },
  { value: "fintech", label: "Fintech" },
  { value: "foodtech", label: "Foodtech" },
  { value: "govtech", label: "Govtech" },
  { value: "greentech", label: "Greentech" },
  { value: "healthtech", label: "Healthtech" },
  { value: "hrtech", label: "HRTech" },
  { value: "indtech", label: "Indtech" },
  { value: "insurtech", label: "Insurtech" },
  { value: "legaltech", label: "Legaltech" },
  { value: "logtech", label: "Logtech" },
  { value: "martech", label: "Martech" },
  { value: "mobilidade", label: "Mobilidade" },
  { value: "pet_tech", label: "Pet-tech" },
  { value: "proptech", label: "Proptech" },
  { value: "regtech", label: "Regtech" },
  { value: "retailtech", label: "Retailtech" },
  { value: "salestech", label: "Salestech" },
  { value: "sportech", label: "Sportech" },
  { value: "supply_chain", label: "SupplyChain" },
  { value: "traveltech", label: "Traveltech" }
];

export default function StartupFilters({ filters, setFilters, totalCount }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key, checked) => {
    setFilters(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <Card className="bg-white/90 shadow-lg border-0">
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <Label htmlFor="search-startup" className="text-sm font-medium text-slate-700">Buscar</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="search-startup"
                placeholder="Buscar por nome, site, descrição..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 h-11 border-slate-200 focus:border-emerald-500 bg-white text-base"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">Categoria</Label>
            <Select value={filters.categoria} onValueChange={(value) => handleFilterChange('categoria', value)}>
              <SelectTrigger className="border-slate-200 focus:border-emerald-500 bg-white mt-2 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">Vertical</Label>
            <Select value={filters.vertical} onValueChange={(value) => handleFilterChange('vertical', value)}>
              <SelectTrigger className="border-slate-200 focus:border-emerald-500 bg-white mt-2 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VERTICAIS.map(ver => (
                  <SelectItem key={ver.value} value={ver.value}>{ver.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/80">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="show-problems" 
                checked={filters.showProblemsOnly} 
                onCheckedChange={(checked) => handleCheckboxChange('showProblemsOnly', checked)} 
              />
              <Label htmlFor="show-problems" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Apenas com problemas
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="show-duplicates" 
                checked={filters.showDuplicatesOnly} 
                onCheckedChange={(checked) => handleCheckboxChange('showDuplicatesOnly', checked)} 
              />
              <Label htmlFor="show-duplicates" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-500" />
                Apenas duplicatas de site
              </Label>
            </div>

            <Select value={filters.avaliacaoEspecialista || 'all'} onValueChange={(value) => handleFilterChange('avaliacaoEspecialista', value)}>
              <SelectTrigger className="w-[200px] border-slate-200 focus:border-emerald-500 bg-white h-9">
                <Star className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Rating Qualitativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ratings</SelectItem>
                <SelectItem value="avaliadas">Apenas Avaliadas</SelectItem>
                <SelectItem value="nao_avaliadas">Apenas Não Avaliadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[180px] border-slate-200 focus:border-emerald-500 bg-white h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Apenas Ativas</SelectItem>
                <SelectItem value="inativo">Apenas Inativas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.origem} onValueChange={(value) => handleFilterChange('origem', value)}>
              <SelectTrigger className="w-[180px] border-slate-200 focus:border-emerald-500 bg-white h-9">
                <ListFilter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                <SelectItem value="manual">Cadastro Manual</SelectItem>
                <SelectItem value="csv_import">Importada (CSV)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger className="w-[180px] border-slate-200 focus:border-emerald-500 bg-white h-9">
                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="nome_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="verificacao_recente">Verificadas Recentemente</SelectItem>
                <SelectItem value="verificacao_antiga">Verificadas Há Mais Tempo</SelectItem>
                <SelectItem value="avaliacao_desc">Melhor Avaliadas</SelectItem>
                <SelectItem value="nao_avaliadas_primeiro">Não Avaliadas Primeiro</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 px-3 py-1 text-sm whitespace-nowrap">
              {totalCount} resultado{totalCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}