import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
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
  const [expandedConteudos, setExpandedConteudos] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

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

  const updateMacroMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Macrocaixa.update(id, data),
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

  const updateCaixaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Caixa.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['caixas'])
  });

  const deleteCaixaMutation = useMutation({
    mutationFn: (id) => base44.entities.Caixa.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['caixas'])
  });

  const createMicroMutation = useMutation({
    mutationFn: (data) => base44.entities.Microcaixa.create(data),
    onSuccess: () => queryClient.invalidateQueries(['microcaixas'])
  });

  const updateMicroMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Microcaixa.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['microcaixas'])
  });

  const deleteMicroMutation = useMutation({
    mutationFn: (id) => base44.entities.Microcaixa.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['microcaixas'])
  });

  const createConteudoMutation = useMutation({
    mutationFn: (data) => base44.entities.Conteudo.create(data),
    onSuccess: () => queryClient.invalidateQueries(['conteudos'])
  });

  const updateConteudoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conteudo.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['conteudos'])
  });

  const deleteConteudoMutation = useMutation({
    mutationFn: (id) => base44.entities.Conteudo.delete(id),
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

  const toggleConteudo = (id) => {
    setExpandedConteudos(prev => ({ ...prev, [id]: !prev[id] }));
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

  const getConteudosByCaixa = (caixaId) => {
    return conteudos.filter(c => c.caixa_id === caixaId && !c.microcaixa_id);
  };

  const getConteudosByMacro = (macroId) => {
    return conteudos.filter(c => c.macrocaixa_id === macroId && !c.caixa_id && !c.microcaixa_id);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Framework de Aprendizado</h1>
            <p className="text-slate-600 mt-1">Estrutura hierárquica para negócios e startups</p>
          </div>
          
          {isAdmin && (
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
          )}
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
                  {isAdmin && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar {macro.nome}</DialogTitle>
                          </DialogHeader>
                          <MacrocaixaForm 
                            initial={macro}
                            onSubmit={(data) => updateMacroMutation.mutate({ id: macro.id, data })}
                          />
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Adicionar Caixa">
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Adicionar Conteúdo Diretamente">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Conteúdo em {macro.nome}</DialogTitle>
                          </DialogHeader>
                          <ConteudoForm 
                            macrocaixaId={macro.id}
                            onSubmit={createConteudoMutation.mutate}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Deletar esta macrocaixa e todo seu conteúdo?')) {
                            deleteMacroMutation.mutate(macro.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
                {macro.descricao && (
                  <p className="text-sm text-slate-600 mt-2 ml-8">{macro.descricao}</p>
                )}
              </CardHeader>

              {expandedMacros[macro.id] && (
                <CardContent className="pl-12 space-y-3">
                  {getConteudosByMacro(macro.id).map((cont) => {
                    const Icon = TIPO_ICONS[cont.tipo];
                    return (
                      <Card key={cont.id} className="border-l-2 border-purple-300">
                        <CardHeader 
                          className="py-2 px-3 cursor-pointer hover:bg-slate-50"
                          onClick={() => toggleConteudo(cont.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {expandedConteudos[cont.id] ? (
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-500" />
                              )}
                              <Badge className={TIPO_COLORS[cont.tipo]}>
                                <Icon className="w-3 h-3 mr-1" />
                                {cont.tipo}
                              </Badge>
                              <span className="text-slate-700 font-medium">{cont.titulo}</span>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Editar Conteúdo</DialogTitle>
                                    </DialogHeader>
                                    <ConteudoForm 
                                      initial={cont}
                                      macrocaixaId={cont.macrocaixa_id}
                                      onSubmit={(data) => updateConteudoMutation.mutate({ id: cont.id, data })}
                                    />
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Deletar "${cont.titulo}"?`)) {
                                      deleteConteudoMutation.mutate(cont.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        {expandedConteudos[cont.id] && cont.corpo && (
                          <CardContent className="pt-0 pb-2 px-3">
                            <div className="prose prose-sm max-w-none text-slate-700">
                              <ReactMarkdown>{cont.corpo}</ReactMarkdown>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                  
                  {getCaixasByMacro(macro.id).map((caixa) => (
                    <Card key={caixa.id} className="border-l-4 border-blue-400 mb-2">
                      <CardHeader className="py-3 px-4">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleCaixa(caixa.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedCaixas[caixa.id] ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                            <div>
                              <h4 className="font-semibold text-slate-900">{caixa.nome}</h4>
                              {caixa.objetivo && (
                                <p className="text-xs text-slate-600 mt-0.5">{caixa.objetivo}</p>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar {caixa.nome}</DialogTitle>
                                  </DialogHeader>
                                  <CaixaForm 
                                    initial={caixa}
                                    macrocaixaId={caixa.macrocaixa_id}
                                    onSubmit={(data) => updateCaixaMutation.mutate({ id: caixa.id, data })}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Adicionar Microcaixa">
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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Adicionar Conteúdo Diretamente">
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Adicionar Conteúdo em {caixa.nome}</DialogTitle>
                                  </DialogHeader>
                                  <ConteudoForm 
                                    caixaId={caixa.id}
                                    onSubmit={createConteudoMutation.mutate}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Deletar "${caixa.nome}" e todas as microcaixas?`)) {
                                    deleteCaixaMutation.mutate(caixa.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      {expandedCaixas[caixa.id] && (
                        <CardContent className="pt-2 pb-3 px-4 space-y-2">
                          {getConteudosByCaixa(caixa.id).map((cont) => {
                            const Icon = TIPO_ICONS[cont.tipo];
                            return (
                              <Card key={cont.id} className="border-l-2 border-blue-300">
                                <CardHeader 
                                  className="py-2 px-3 cursor-pointer hover:bg-slate-50"
                                  onClick={() => toggleConteudo(cont.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {expandedConteudos[cont.id] ? (
                                        <ChevronDown className="w-3 h-3 text-slate-500" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 text-slate-500" />
                                      )}
                                      <Badge className={TIPO_COLORS[cont.tipo]}>
                                        <Icon className="w-3 h-3 mr-1" />
                                        {cont.tipo}
                                      </Badge>
                                      <span className="text-slate-700">{cont.titulo}</span>
                                    </div>
                                    {isAdmin && (
                                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <Edit2 className="w-3 h-3" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Editar Conteúdo</DialogTitle>
                                            </DialogHeader>
                                            <ConteudoForm 
                                              initial={cont}
                                              caixaId={cont.caixa_id}
                                              onSubmit={(data) => updateConteudoMutation.mutate({ id: cont.id, data })}
                                            />
                                          </DialogContent>
                                        </Dialog>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (confirm(`Deletar "${cont.titulo}"?`)) {
                                              deleteConteudoMutation.mutate(cont.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CardHeader>
                                {expandedConteudos[cont.id] && cont.corpo && (
                                  <CardContent className="pt-0 pb-2 px-3">
                                    <div className="prose prose-sm max-w-none text-slate-700">
                                      <ReactMarkdown>{cont.corpo}</ReactMarkdown>
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            );
                          })}

                          {getMicrosByCaixa(caixa.id).map((micro) => (
                            <Card key={micro.id} className="border-l-4 border-green-400">
                              <CardHeader className="py-2 px-3">
                                <div 
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => toggleMicro(micro.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedMicros[micro.id] ? (
                                      <ChevronDown className="w-3 h-3 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-500" />
                                    )}
                                    <div>
                                      <h5 className="text-sm font-semibold text-slate-800">{micro.nome}</h5>
                                      {micro.descricao && (
                                        <p className="text-xs text-slate-600 mt-0.5">{micro.descricao}</p>
                                      )}
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <Edit2 className="w-3 h-3" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Editar {micro.nome}</DialogTitle>
                                          </DialogHeader>
                                          <MicrocaixaForm 
                                            initial={micro}
                                            caixaId={micro.caixa_id}
                                            onSubmit={(data) => updateMicroMutation.mutate({ id: micro.id, data })}
                                          />
                                        </DialogContent>
                                      </Dialog>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="sm">
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
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm(`Deletar "${micro.nome}"?`)) {
                                            deleteMicroMutation.mutate(micro.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardHeader>

                              {expandedMicros[micro.id] && (
                                <CardContent className="pt-2 pb-2 px-3 space-y-1">
                                  {getConteudosByMicro(micro.id).map((cont) => {
                                    const Icon = TIPO_ICONS[cont.tipo];
                                    return (
                                      <Card key={cont.id} className="border">
                                        <CardHeader 
                                          className="py-2 px-3 cursor-pointer hover:bg-slate-50"
                                          onClick={() => toggleConteudo(cont.id)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              {expandedConteudos[cont.id] ? (
                                                <ChevronDown className="w-3 h-3 text-slate-500" />
                                              ) : (
                                                <ChevronRight className="w-3 h-3 text-slate-500" />
                                              )}
                                              <Badge className={TIPO_COLORS[cont.tipo]}>
                                                <Icon className="w-3 h-3 mr-1" />
                                                {cont.tipo}
                                              </Badge>
                                              <span className="text-slate-700">{cont.titulo}</span>
                                            </div>
                                            {isAdmin && (
                                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Dialog>
                                                  <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                      <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                  </DialogTrigger>
                                                  <DialogContent>
                                                    <DialogHeader>
                                                      <DialogTitle>Editar Conteúdo</DialogTitle>
                                                    </DialogHeader>
                                                    <ConteudoForm 
                                                      initial={cont}
                                                      microcaixaId={cont.microcaixa_id}
                                                      onSubmit={(data) => updateConteudoMutation.mutate({ id: cont.id, data })}
                                                    />
                                                  </DialogContent>
                                                </Dialog>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    if (confirm(`Deletar "${cont.titulo}"?`)) {
                                                      deleteConteudoMutation.mutate(cont.id);
                                                    }
                                                  }}
                                                >
                                                  <Trash2 className="w-3 h-3 text-red-500" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </CardHeader>
                                        {expandedConteudos[cont.id] && cont.corpo && (
                                          <CardContent className="pt-0 pb-2 px-3">
                                            <div className="prose prose-sm max-w-none text-slate-700">
                                              <ReactMarkdown>{cont.corpo}</ReactMarkdown>
                                            </div>
                                          </CardContent>
                                        )}
                                      </Card>
                                    );
                                  })}
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </CardContent>
                      )}
                    </Card>
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

function MacrocaixaForm({ onSubmit, initial }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [descricao, setDescricao] = useState(initial?.descricao || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nome, descricao, ativa: true, ordem: initial?.ordem || 0 });
    if (!initial) {
      setNome('');
      setDescricao('');
    }
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
      <Button type="submit" className="w-full">{initial ? 'Salvar' : 'Criar'}</Button>
    </form>
  );
}

function CaixaForm({ macrocaixaId, onSubmit, initial }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [objetivo, setObjetivo] = useState(initial?.objetivo || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ macrocaixa_id: macrocaixaId, nome, objetivo, ordem: initial?.ordem || 0 });
    if (!initial) {
      setNome('');
      setObjetivo('');
    }
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
      <Button type="submit" className="w-full">{initial ? 'Salvar' : 'Criar'}</Button>
    </form>
  );
}

function MicrocaixaForm({ caixaId, onSubmit, initial }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [descricao, setDescricao] = useState(initial?.descricao || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ caixa_id: caixaId, nome, descricao, editavel: true, ordem: initial?.ordem || 0 });
    if (!initial) {
      setNome('');
      setDescricao('');
    }
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
      <Button type="submit" className="w-full">{initial ? 'Salvar' : 'Criar'}</Button>
    </form>
  );
}

function ConteudoForm({ macrocaixaId, caixaId, microcaixaId, onSubmit, initial }) {
  const [tipo, setTipo] = useState(initial?.tipo || 'conceito');
  const [titulo, setTitulo] = useState(initial?.titulo || '');
  const [corpo, setCorpo] = useState(initial?.corpo || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { tipo, titulo, corpo, ativo: true, ordem: initial?.ordem || 0 };
    
    if (microcaixaId) {
      data.microcaixa_id = microcaixaId;
    } else if (caixaId) {
      data.caixa_id = caixaId;
    } else if (macrocaixaId) {
      data.macrocaixa_id = macrocaixaId;
    }
    
    onSubmit(data);
    if (!initial) {
      setTitulo('');
      setCorpo('');
    }
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
      <Button type="submit" className="w-full">{initial ? 'Salvar' : 'Criar'}</Button>
    </form>
  );
}