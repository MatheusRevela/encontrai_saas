import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, XCircle, Loader2, Sparkles, Globe, AlertCircle, AlertTriangle } from "lucide-react";
import { UploadFile, InvokeLLM } from '@/integrations/Core';
import { useDebounce } from '../hooks/useDebounce';
import { Startup } from '@/entities/all';

const CATEGORIAS = [
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

const MODELOS_NEGOCIO = [
  { value: "assinatura", label: "Assinatura" },
  { value: "pagamento_uso", label: "Pagamento por Uso" },
  { value: "marketplace", label: "Marketplace" },
  { value: "consultoria", label: "Consultoria" }
];

export default function StartupForm({ startup, onSave, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(startup || {
    nome: "",
    descricao: "",
    categoria: "",
    vertical_atuacao: "",
    modelo_negocio: "",
    tags: [],
    site: "",
    email: "",
    whatsapp: "",
    linkedin: "",
    preco_base: "",
    ativo: true,
    logo_url: "",
    ultima_verificacao: null,
    status_verificacao: { site_online: true }
  });

  const [urlAnalise, setUrlAnalise] = useState("");
  const [descricaoAdicional, setDescricaoAdicional] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState({ checking: false, error: null });

  const debouncedSite = useDebounce(formData.site, 500);

  useEffect(() => {
    const checkForDuplicate = async () => {
      if (!debouncedSite || debouncedSite.trim() === "" || !debouncedSite.includes('.')) {
        setDuplicateCheck({ checking: false, error: null });
        return;
      }

      setDuplicateCheck({ checking: true, error: null });
      try {
        const results = await Startup.filter({ site: debouncedSite.trim() });
        const foundDuplicate = results.find(s => s.id !== startup?.id);

        if (foundDuplicate) {
          setDuplicateCheck({
            checking: false,
            error: `Alerta: O site "${foundDuplicate.site}" já está cadastrado para a startup "${foundDuplicate.nome}".`
          });
        } else {
          setDuplicateCheck({ checking: false, error: null });
        }
      } catch (error) {
        console.error("Erro ao verificar duplicata:", error);
        setDuplicateCheck({ checking: false, error: "Erro ao verificar duplicatas. Tente novamente." });
      }
    };

    checkForDuplicate();
  }, [debouncedSite, startup?.id]);

  const analisarSite = async () => {
    if (!urlAnalise.trim()) {
      alert('Por favor, insira uma URL válida para análise.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // ETAPA 1: Análise Geral (SEM TAGS)
      const promptGeral = `Analise o site da startup e a descrição adicional, e extraia as seguintes informações em formato JSON:

CATEGORIAS DISPONÍVEIS: ${CATEGORIAS.map(c => c.value).join(', ')}
VERTICAIS DISPONÍVEIS: ${VERTICAIS.map(v => v.value).join(', ')}
MODELOS DE NEGÓCIO DISPONÍVEIS: ${MODELOS_NEGOCIO.map(m => m.value).join(', ')}

REGRAS CRÍTICAS:
1. A DESCRIÇÃO FINAL NÃO PODE MENCIONAR O NOME DA EMPRESA.
2. Use termos genéricos como "a solução", "a plataforma", etc.
3. Descrição deve ter 2-3 linhas explicando O QUE a solução faz.
4. Escolha categorias, verticais e modelos EXATAMENTE como listados.
5. Use TANTO o conteúdo do site quanto a descrição adicional.
6. Para preços: procure especificamente em páginas/seções de "Preços", "Planos", "Pricing". Se encontrar, use o formato: "R$XX,XX - R$XX,XX/mês" ou "R$XX,XX - R$XX,XX/ano". Se NÃO encontrar preços no site, retorne null.
7. Tente encontrar um email de contato e URL do LinkedIn.

DADOS PARA ANÁLISE:
Site: ${urlAnalise}
${descricaoAdicional ? `Descrição adicional: ${descricaoAdicional}` : ''}

Retorne um JSON com este formato:
{
  "nome": "Nome da startup",
  "descricao": "Descrição SEM o nome da empresa",
  "categoria": "uma das categorias da lista",
  "vertical_atuacao": "uma das verticais ou null",
  "modelo_negocio": "um dos modelos ou null",
  "email": "email de contato ou null",
  "linkedin": "URL do LinkedIn ou null",
  "preco_base": "formato R$XX,XX - R$XX,XX/mês ou null se não encontrar"
}`;

      const resultadoGeral = await InvokeLLM({
        prompt: promptGeral,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            nome: { type: "string" },
            descricao: { type: "string" },
            categoria: { type: "string" },
            vertical_atuacao: { type: ["string", "null"] },
            modelo_negocio: { type: ["string", "null"] },
            email: { type: ["string", "null"] },
            linkedin: { type: ["string", "null"] },
            preco_base: { type: ["string", "null"] }
          }
        }
      });
      
      // Aplica os dados gerais ao formulário (exceto tags, que serão geradas separadamente)
      setFormData(prev => ({
        ...prev,
        nome: resultadoGeral.nome || prev.nome,
        descricao: resultadoGeral.descricao || prev.descricao,
        categoria: resultadoGeral.categoria || prev.categoria,
        vertical_atuacao: resultadoGeral.vertical_atuacao || prev.vertical_atuacao,
        modelo_negocio: resultadoGeral.modelo_negocio || prev.modelo_negocio,
        site: urlAnalise,
        email: resultadoGeral.email || prev.email,
        linkedin: resultadoGeral.linkedin || prev.linkedin,
        preco_base: resultadoGeral.preco_base || prev.preco_base,
        tags: [], // Limpa as tags antigas para receber as novas
      }));

      const descricaoGerada = resultadoGeral.descricao || "";

      // ETAPA 2: Geração Focada de Tags
      console.log("🚀 Iniciando geração focada de tags...");
      const promptTags = `Baseado no conteúdo do site ${urlAnalise} e na descrição a seguir, gere uma lista abrangente de palavras-chave (tags) para matching.

Descrição da Solução: "${descricaoGerada}"

REGRAS PARA TAGS:
- Gere entre 10 e 15 tags relevantes.
- As tags devem ser curtas, em minúsculas e em português.
- Foque nos problemas que a solução resolve e nas funcionalidades.
- Ex: "gestão de estoque", "controle financeiro", "crm de vendas", "automação de marketing".

Retorne um JSON com este formato:
{
  "tags": ["array", "de", "tags"]
}`;

      try {
        const resultadoTags = await InvokeLLM({
          prompt: promptTags,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              tags: { type: "array", items: { type: "string" } }
            }
          }
        });

        if (resultadoTags && resultadoTags.tags) {
          // Normalizar tags para garantir encoding correto
          const tagsNormalizadas = resultadoTags.tags.map(tag => 
            tag.normalize('NFC').trim()
          );
          console.log(`✅ Tags geradas: ${tagsNormalizadas.join(', ')}`);
          setFormData(prev => ({ ...prev, tags: tagsNormalizadas }));
        }
      } catch (tagsError) {
        console.error("Erro na geração de tags:", tagsError);
      }
      
      // ETAPA 3: Busca Focada por WhatsApp
      console.log("🚀 Iniciando busca focada por WhatsApp...");
      const promptWhatsapp = `Analise o conteúdo do site ${urlAnalise} com um único objetivo: encontrar o número de telefone ou WhatsApp de contato. Procure em links 'wa.me', texto, rodapés e páginas de contato. Se encontrar, retorne-o. Se não encontrar NADA, retorne null. O número deve estar no formato internacional, por exemplo, "+5511987654321".

Retorne um JSON com este formato:
{
  "whatsapp": "número encontrado ou null"
}`;

      try {
        const resultadoWhatsapp = await InvokeLLM({
          prompt: promptWhatsapp,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              whatsapp: { type: ["string", "null"] }
            }
          }
        });

        if (resultadoWhatsapp && resultadoWhatsapp.whatsapp) {
          console.log(`✅ WhatsApp encontrado: ${resultadoWhatsapp.whatsapp}`);
          // Aplica o WhatsApp encontrado ao formulário
          setFormData(prev => ({
            ...prev,
            whatsapp: resultadoWhatsapp.whatsapp
          }));
        } else {
          console.log("🟡 WhatsApp não encontrado na busca focada.");
        }
      } catch (whatsappError) {
        console.error("Erro na busca focada por WhatsApp:", whatsappError);
      }

      alert('✅ Análise completa! Geramos tags, buscamos o WhatsApp e preenchemos os dados. Revise e ajuste se necessário.');

    } catch (error) {
      console.error('Erro na análise geral do site:', error);
      alert('Erro ao analisar o site. Verifique se a URL está correta e tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTagsFromInput = (inputString) => {
    if (!inputString.trim()) return;

    const newTags = inputString
      .split(',')
      .map(tag => tag.normalize('NFC').trim()) // Normalizar encoding UTF-8
      .filter(tag => tag && !formData.tags.includes(tag));

    if (newTags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, ...newTags]
      }));
    }
    setNewTag("");
  };

  const addTag = () => {
    addTagsFromInput(newTag);
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePasteTags = (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    addTagsFromInput(pastedText);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('logo_url', file_url);
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          {startup ? 'Editar Startup' : 'Nova Startup'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Assistente de Análise de Site */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Assistente de Cadastro Inteligente</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Cole a URL da startup e opcionalmente uma descrição adicional. Nossa IA preencherá automaticamente todos os campos.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="https://exemplo.com"
                  value={urlAnalise}
                  onChange={(e) => setUrlAnalise(e.target.value)}
                  disabled={isAnalyzing}
                  className="border-blue-200 focus:border-purple-500"
                />
              </div>
              <Button
                onClick={analisarSite}
                disabled={isAnalyzing || !urlAnalise.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-6"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Analisar Site
                  </>
                )}
              </Button>
            </div>

            <div>
              <Textarea
                placeholder="[OPCIONAL] Cole aqui uma descrição adicional da startup que você já tenha (ex: do LinkedIn, database, etc.). Isso ajudará a IA a fazer uma análise mais precisa."
                value={descricaoAdicional}
                onChange={(e) => setDescricaoAdicional(e.target.value)}
                disabled={isAnalyzing}
                rows={3}
                className="border-blue-200 focus:border-purple-500 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Dica: Quanto mais contexto você fornecer, melhor será a análise da IA.
              </p>
            </div>
          </div>

          {isAnalyzing && (
            <div className="mt-3 flex items-center gap-2 text-sm text-purple-700">
              <AlertCircle className="w-4 h-4" />
              <span>Analisando o site e extraindo informações... Isso pode levar alguns segundos.</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-slate-700">
                Nome da Startup *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: TechSolve"
                required
                className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Logo da Startup</Label>
            <div className="flex items-center gap-4">
              {formData.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={formData.logo_url}
                    alt="Logo da startup"
                    className="w-16 h-16 object-contain border border-slate-200 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload').click()}
                    disabled={isUploadingLogo}
                    className="text-xs"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Fazer Upload'
                    )}
                  </Button>
                  {formData.logo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange('logo_url', '')}
                      className="text-xs text-red-600"
                      disabled={isUploadingLogo}
                    >
                      Remover
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Ou cole a URL da logo aqui"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="text-xs border-slate-200 focus:border-emerald-500"
                  disabled={isUploadingLogo}
                />
                <p className="text-xs text-slate-500">
                  Formatos aceitos: JPG, PNG, GIF. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Status da Startup Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Status da Startup</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.ativo ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-blue-800">
                  {formData.ativo ? 'Ativa no sistema' : 'Inativa no sistema'}
                </span>
              </div>
              {formData.ultima_verificacao && (
                <div className="text-blue-700">
                  Última verificação: {new Date(formData.ultima_verificacao).toLocaleDateString('pt-BR')}
                </div>
              )}
              {formData.status_verificacao?.site_online === false && (
                <div className="text-red-700 text-xs">
                  ⚠️ Site não está respondendo
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-sm font-medium text-slate-700">
                Categoria Principal *
              </Label>
              <Select required value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vertical_atuacao" className="text-sm font-medium text-slate-700">
                Vertical de Atuação
              </Label>
              <Select value={formData.vertical_atuacao} onValueChange={(value) => handleInputChange('vertical_atuacao', value)}>
                <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                  <SelectValue placeholder="Selecione uma vertical" />
                </SelectTrigger>
                <SelectContent>
                  {VERTICAIS.map((ver) => (
                    <SelectItem key={ver.value} value={ver.value}>
                      {ver.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo_negocio" className="text-sm font-medium text-slate-700">
                Modelo de Negócio
              </Label>
              <Select value={formData.modelo_negocio} onValueChange={(value) => handleInputChange('modelo_negocio', value)}>
                <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS_NEGOCIO.map((modelo) => (
                    <SelectItem key={modelo.value} value={modelo.value}>
                      {modelo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium text-slate-700">
              Descrição da Solução *
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva como a solução resolve problemas de PMEs... (NÃO mencione o nome da empresa)"
              rows={4}
              required
              className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ IMPORTANTE: A descrição NÃO deve conter o nome da empresa. Use termos como "a solução", "a plataforma", etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Tags para Matching</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-emerald-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onPaste={handlePasteTags}
                placeholder="Digite tags separadas por vírgula"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="border-slate-200 focus:border-emerald-500"
              />
              <Button type="button" onClick={addTag} variant="outline" className="px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Você pode colar uma lista de tags ou digitá-las separadas por vírgula. Ex: "vendas, marketing, crm".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="site" className="text-sm font-medium text-slate-700">
                Site *
              </Label>
              <Input
                id="site"
                type="url"
                value={formData.site}
                onChange={(e) => handleInputChange('site', e.target.value)}
                placeholder="https://exemplo.com"
                className="border-slate-200 focus:border-emerald-500"
                required
              />
              {/* NOVO: Alerta de duplicata */}
              {duplicateCheck.checking && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verificando duplicatas...
                </div>
              )}
              {duplicateCheck.error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2 rounded-md flex items-start gap-2 mt-1">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{duplicateCheck.error}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email de Contato
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@exemplo.com"
                className="border-slate-200 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium text-slate-700">
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className="border-slate-200 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_base" className="text-sm font-medium text-slate-700">
                Faixa de Preço
              </Label>
              <Input
                id="preco_base"
                value={formData.preco_base}
                onChange={(e) => handleInputChange('preco_base', e.target.value)}
                placeholder="Ex: R$ 50-200/mês"
                className="border-slate-200 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing || isUploadingLogo || isAnalyzing || duplicateCheck.checking}
              className="hover:bg-slate-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || isUploadingLogo || isAnalyzing || duplicateCheck.checking || duplicateCheck.error}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isProcessing ? 'Salvando...' : 'Salvar Startup'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}