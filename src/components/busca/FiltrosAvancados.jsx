import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIAS = [
  { value: 'gestao', label: 'Gestão' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'rh', label: 'RH' },
  { value: 'tecnologia', label: 'Tecnologia' }
];

const VERTICAIS = [
  { value: 'fintech', label: 'Fintech' },
  { value: 'edtech', label: 'Edtech' },
  { value: 'healthtech', label: 'Healthtech' },
  { value: 'retailtech', label: 'Retailtech' },
  { value: 'martech', label: 'Martech' },
  { value: 'hrtech', label: 'HRtech' },
  { value: 'logtech', label: 'Logtech' }
];

const MODELOS_NEGOCIO = [
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'pagamento_uso', label: 'Pague por Uso' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'consultoria', label: 'Consultoria' }
];

export default function FiltrosAvancados({ filtros, onFiltrosChange, startupsOriginais, startupsFiltradas }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleCategoria = (categoria) => {
    const novasCategorias = filtros.categorias.includes(categoria)
      ? filtros.categorias.filter(c => c !== categoria)
      : [...filtros.categorias, categoria];
    
    onFiltrosChange({ ...filtros, categorias: novasCategorias });
  };

  const toggleVertical = (vertical) => {
    const novasVerticais = filtros.verticais.includes(vertical)
      ? filtros.verticais.filter(v => v !== vertical)
      : [...filtros.verticais, vertical];
    
    onFiltrosChange({ ...filtros, verticais: novasVerticais });
  };

  const toggleModelo = (modelo) => {
    const novosModelos = filtros.modelosNegocio.includes(modelo)
      ? filtros.modelosNegocio.filter(m => m !== modelo)
      : [...filtros.modelosNegocio, modelo];
    
    onFiltrosChange({ ...filtros, modelosNegocio: novosModelos });
  };

  const limparFiltros = () => {
    onFiltrosChange({
      categorias: [],
      verticais: [],
      modelosNegocio: [],
      matchMinimo: 50
    });
  };

  const filtrosAtivos = filtros.categorias.length + filtros.verticais.length + filtros.modelosNegocio.length;

  return (
    <Card className="border-slate-200">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <span>Filtros Avançados</span>
            {filtrosAtivos > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {filtrosAtivos} ativos
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {startupsFiltradas?.length || 0} de {startupsOriginais?.length || 0}
            </span>
            {filtrosAtivos > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  limparFiltros();
                }}
                className="h-7 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Categorias */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Categorias</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <Badge
                  key={cat.value}
                  variant={filtros.categorias.includes(cat.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    filtros.categorias.includes(cat.value)
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleCategoria(cat.value)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Verticais */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Verticais</h4>
            <div className="flex flex-wrap gap-2">
              {VERTICAIS.map(vert => (
                <Badge
                  key={vert.value}
                  variant={filtros.verticais.includes(vert.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    filtros.verticais.includes(vert.value)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleVertical(vert.value)}
                >
                  {vert.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Modelos de Negócio */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Modelo de Negócio</h4>
            <div className="flex flex-wrap gap-2">
              {MODELOS_NEGOCIO.map(modelo => (
                <Badge
                  key={modelo.value}
                  variant={filtros.modelosNegocio.includes(modelo.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    filtros.modelosNegocio.includes(modelo.value)
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleModelo(modelo.value)}
                >
                  {modelo.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Match Mínimo */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Match Mínimo</h4>
              <Badge variant="secondary">{filtros.matchMinimo}%</Badge>
            </div>
            <Slider
              value={[filtros.matchMinimo]}
              onValueChange={(value) => onFiltrosChange({ ...filtros, matchMinimo: value[0] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}