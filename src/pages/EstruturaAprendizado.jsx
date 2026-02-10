import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, ChevronRight, ChevronDown, Edit2, Trash2, 
  BookOpen, FileText, ListChecks, Lightbulb, 
  FileCode, Wrench, AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPO_ICONS = {
  conceito: BookOpen,
  framework: FileText,
  checklist: ListChecks,
  exemplo: Lightbulb,
  template: FileCode,
  ferramenta: Wrench,
  erros_comuns: AlertCircle
};

const TIPO_COLORS = {
  conceito: "bg-blue-100 text-blue-700",
  framework: "bg-purple-100 text-purple-700",
  checklist: "bg-green-100 text-green-700",
  exemplo: "bg-yellow-100 text-yellow-700",
  template: "bg-pink-100 text-pink-700",
  ferramenta: "bg-indigo-100 text-indigo-700",
  erros_comuns: "bg-red-100 text-red-700"
};

export default function EstruturaAprendizado() {
  const queryClient = useQueryClient();
  const [expandedMacros, setExpandedMacros] = useState({});
  const [expandedCaixas, setExpandedCaixas] = useState({});
  const [expandedMicros, setExpandedMicros] = useState({});

  // Queries
  const { data: macrocaixas = [] } = useQuery({
    queryKey: ['macrocaixas'],
    queryFn: () => base44.entities.Macrocaixa.list('ordem')
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list('ordem')
  });

  const { data: microcaixas = [] } = useQuery({
    queryKey: ['microcaixas'],
    queryFn: () => base44.entities.Microcaixa.list('ordem')
  });

  const { data: conteudos = [] } = useQuery({
    queryKey: ['conteudos'],
    queryFn: () => base44.entities.Conteudo.list('ordem')
  });

  // Mutations
  const createMacroMutation = useMutation({
    mutationFn: (data) => base44.entities.Macrocaixa.create(data),
    onSuccess: () => queryClient.invalidateQueries(['macrocaixas'])
  });

  const deleteMacroMutation = useMutation({
    mutationFn: (id) => base44.entities.Macrocaixa.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['macrocaixas'])
  });

  const createCaixaMutation = useMutation({
    mutationFn: (data) => base44.entities.Caixa.create(data),
    onSuccess: () => queryClient.invalidateQueries(['caixas'])
  });

  const createMicroMutation = useMutation({
    mutationFn: (data) => base44.entities.Microcaixa.create(data),
    onSuccess: () => queryClient.invalidateQueries(['microcaixas'])
  });

  const createConteudoMutation = useMutation({
    mutationFn: (data) => base44.entities.Conteudo.create(data),
    onSuccess: () => queryClient.invalidateQueries(['conteudos'])
  });

  const toggleMacro = (id) => {
    setExpandedMacros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCaixa = (id) => {
    setExpandedCaixas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMicro = (id) => {
    setExpandedMicros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCaixasByMacro = (macroId) => {
    return caixas.filter(c => c.macrocaixa_id === macroId);
  };

  const getMicrosByCaixa = (caixaId) => {
    return microcaixas.filter(m => m.caixa_id === caixaId);
  };

  const getConteudosByMicro = (microId) => {
    return conteudos.filter(c => c.microcaixa_id === microId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Framework de Aprendizado</h1>
            <p className="text-slate-600 mt-1">Estrutura hierárquica para negócios e startups</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Macrocaixa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Macrocaixa</DialogTitle>
              </DialogHeader>
              <MacrocaixaForm onSubmit={createMacroMutation.mutate} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {macrocaixas.map((macro) => (
            <Card key={macro.id} className="border-2 hover:border-purple-200 transition-all">
              <CardHeader className="cursor-pointer" onClick={() => toggleMacro(macro.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedMacros[macro.id] ? (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                    <CardTitle className="text-xl">{macro.nome}</CardTitle>
                    {!macro.ativa && <Badge variant="secondary">Inativa</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Caixa em {macro.nome}</DialogTitle>
                        </DialogHeader>
                        <CaixaForm 
                          macrocaixaId={macro.id}
                          onSubmit={createCaixaMutation.mutate}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Deletar esta macrocaixa e todo seu conteúdo?')) {
                          deleteMacroMutation.mutate(macro.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {macro.descricao && (
                  <p className="text-sm text-slate-600 mt-2 ml-8">{macro.descricao}</p>
                )}
              </CardHeader>

              {expandedMacros[macro.id] && (
                <CardContent className="pl-12 space-y-3">
                  {getCaixasByMacro(macro.id).map((caixa) => (
                    <div key={caixa.id} className="border-l-2 border-blue-200 pl-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded"
                        onClick={() => toggleCaixa(caixa.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedCaixas[caixa.id] ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-semibold text-slate-800">{caixa.nome}</span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar Microcaixa em {caixa.nome}</DialogTitle>
                            </DialogHeader>
                            <MicrocaixaForm 
                              caixaId={caixa.id}
                              onSubmit={createMicroMutation.mutate}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      {expandedCaixas[caixa.id] && (
                        <div className="mt-2 ml-6 space-y-2">
                          {getMicrosByCaixa(caixa.id).map((micro) => (
                            <div key={micro.id} className="border-l-2 border-green-200 pl-4">
                              <div 
                                className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded"
                                onClick={() => toggleMicro(micro.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedMicros[micro.id] ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span className="text-sm text-slate-700">{micro.nome}</span>
                                </div>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Adicionar Conteúdo em {micro.nome}</DialogTitle>
                                    </DialogHeader>
                                    <ConteudoForm 
                                      microcaixaId={micro.id}
                                      onSubmit={createConteudoMutation.mutate}
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>

                              {expandedMicros[micro.id] && (
                                <div className="mt-2 ml-4 space-y-1">
                                  {getConteudosByMicro(micro.id).map((cont) => {
                                    const Icon = TIPO_ICONS[cont.tipo];
                                    return (
                                      <div 
                                        key={cont.id}
                                        className="flex items-center gap-2 p-2 text-sm"
                                      >
                                        <Badge className={TIPO_COLORS[cont.tipo]}>
                                          <Icon className="w-3 h-3 mr-1" />
                                          {cont.tipo}
                                        </Badge>
                                        <span className="text-slate-600">{cont.titulo}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MacrocaixaForm({ onSubmit }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nome, descricao, ativa: true, ordem: 0 });
    setNome('');
    setDescricao('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input 
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Finanças"
          required
        />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea 
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Breve descrição..."
        />
      </div>
      <Button type="submit" className="w-full">Criar</Button>
    </form>
  );
}

function CaixaForm({ macrocaixaId, onSubmit }) {
  const [nome, setNome] = useState('');
  const [objetivo, setObjetivo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ macrocaixa_id: macrocaixaId, nome, objetivo, ordem: 0 });
    setNome('');
    setObjetivo('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input 
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Modelagem Financeira"
          required
        />
      </div>
      <div>
        <Label>Objetivo</Label>
        <Textarea 
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          placeholder="Objetivo desta caixa..."
        />
      </div>
      <Button type="submit" className="w-full">Criar</Button>
    </form>
  );
}

function MicrocaixaForm({ caixaId, onSubmit }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ caixa_id: caixaId, nome, descricao, editavel: true, ordem: 0 });
    setNome('');
    setDescricao('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input 
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Valuation"
          required
        />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea 
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição da competência..."
        />
      </div>
      <Button type="submit" className="w-full">Criar</Button>
    </form>
  );
}

function ConteudoForm({ microcaixaId, onSubmit }) {
  const [tipo, setTipo] = useState('conceito');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ microcaixa_id: microcaixaId, tipo, titulo, corpo, ativo: true, ordem: 0 });
    setTitulo('');
    setCorpo('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conceito">Conceito</SelectItem>
            <SelectItem value="framework">Framework</SelectItem>
            <SelectItem value="checklist">Checklist</SelectItem>
            <SelectItem value="exemplo">Exemplo</SelectItem>
            <SelectItem value="template">Template</SelectItem>
            <SelectItem value="ferramenta">Ferramenta</SelectItem>
            <SelectItem value="erros_comuns">Erros Comuns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Título</Label>
        <Input 
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: O que é Valuation?"
          required
        />
      </div>
      <div>
        <Label>Corpo (Markdown)</Label>
        <Textarea 
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          placeholder="Conteúdo em markdown..."
          rows={6}
        />
      </div>
      <Button type="submit" className="w-full">Criar</Button>
    </form>
  );
}