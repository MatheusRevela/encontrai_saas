import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, XCircle, Loader2, Sparkles, Globe, AlertCircle, AlertTriangle } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useDebounce } from '../hooks/useDebounce';
import AvaliacaoQualitativaForm from './AvaliacaoQualitativaForm';

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

// Corrige double-encoding: UTF-8 interpretado como Latin-1 (ex: "Ã§" → "ç")
const fixEncoding = (str) => {
  if (!str || typeof str !== 'string') return str;
  try {
    // decodeURIComponent(escape()) converte Latin-1 mal-interpretado de volta para UTF-8 correto
    return decodeURIComponent(escape(str)).normalize('NFC').trim();
  } catch {
    return str.normalize('NFC').trim();
  }
};

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

  // Atualizar formData quando a prop startup mudar (apenas para edição)
  useEffect(() => {
    if (startup && startup.id) {
      setFormData(startup);
    }
  }, [startup?.id]);

  useEffect(() => {
    const checkForDuplicate = async () => {
      if (!debouncedSite || debouncedSite.trim() === "" || !debouncedSite.includes('.')) {
        setDuplicateCheck({ checking: false, error: null });
        return;
      }

      setDuplicateCheck({ checking: true, error: null });
      try {
        const results = await base44.entities.Startup.filter({ site: debouncedSite.trim() });
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

  const [analysisStep, setAnalysisStep] = useState('');

  const analisarSite = async () => {
    if (!urlAnalise.trim()) {
      alert('Por favor, insira uma URL válida para análise.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('Acessando e lendo o site...');

    const categoriasStr = CATEGORIAS.map(c => `"${c.value}" (${c.label})`).join(', ');
    const verticaisStr = VERTICAIS.map(v => `"${v.value}" (${v.label})`).join(', ');
    const modelosStr = MODELOS_NEGOCIO.map(m => `"${m.value}" (${m.label})`).join(', ');

    const prompt = `Você é um especialista em análise de startups B2B brasileiras. Acesse e analise COMPLETAMENTE o site a seguir, incluindo todas as páginas relevantes: home, sobre, produto, pricing/planos, contato, rodapé e redes sociais.

URL PARA ANALISAR: ${urlAnalise}
${descricaoAdicional ? `\nINFORMAÇÕES ADICIONAIS FORNECIDAS PELO USUÁRIO:\n"${descricaoAdicional}"` : ''}

=== INSTRUÇÕES DETALHADAS ===

1. NOME: Nome oficial da empresa/produto conforme aparece no site.

2. DESCRICAO: Escreva 3-4 frases descrevendo O QUE a solução faz, QUAIS PROBLEMAS resolve e PARA QUEM. PROIBIDO mencionar o nome da empresa. Use "a plataforma", "a solução", "o sistema", "a ferramenta". Foco total em benefícios e funcionalidades concretas.

3. CATEGORIA (escolha EXATAMENTE um dos valores abaixo):
${categoriasStr}

4. VERTICAL_ATUACAO (escolha EXATAMENTE um dos valores abaixo, ou null se não se encaixar):
${verticaisStr}
DICA: Analise o setor atendido pela startup. Ex: startup de RH = "hrtech", financeiro = "fintech", saúde = "healthtech", varejo = "retailtech", educação = "edtech".

5. MODELO_NEGOCIO (escolha EXATAMENTE um dos valores abaixo, ou null):
${modelosStr}
DICA: Procure em páginas de Planos/Pricing. "assinatura" = plano mensal/anual recorrente; "pagamento_uso" = cobra por transação/uso; "marketplace" = conecta compradores e vendedores; "consultoria" = serviço personalizado.

6. EMAIL: Procure em rodapé, página de contato, "fale conosco", cabeçalho. Retorne o email de contato principal ou null.

7. WHATSAPP: Procure links wa.me, ícones de WhatsApp, números de telefone em rodapé/contato. Retorne no formato "+5511999999999" ou null.

8. LINKEDIN: URL completa do perfil LinkedIn da empresa (linkedin.com/company/...) ou null.

9. PRECO_BASE: Acesse a página de planos/preços. Se encontrar valores: retorne no formato "R$XX - R$XX/mês" ou "A partir de R$XX/mês". Se for apenas "Consulte" ou não tiver preço, retorne null.

10. TAGS: Gere entre 12 e 18 tags em português que representem:
- Funcionalidades principais ("gestão de estoque", "emissão de nota fiscal")
- Problemas resolvidos ("controle de inadimplência", "automação de cobranças")
- Público-alvo ("pequenas empresas", "e-commerce", "restaurantes")
- Termos de busca que um cliente usaria para encontrar essa solução
REGRA CRÍTICA PARA TAGS: Use APENAS caracteres simples sem acentos nas tags. Substitua: ã→a, ç→c, é/ê/è→e, á/â/à→a, í→i, ó/ô/õ→o, ú→u. Ex: "gestao de estoque" (sem acento), "emissao de notas fiscais", "controle financeiro", "automacao de marketing".

Retorne SOMENTE o JSON abaixo, sem texto adicional:`;

    try {
      setAnalysisStep('IA analisando conteúdo do site...');
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
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
            whatsapp: { type: ["string", "null"] },
            linkedin: { type: ["string", "null"] },
            preco_base: { type: ["string", "null"] },
            tags: { type: "array", items: { type: "string" } }
          },
          required: ["nome", "descricao", "categoria", "tags"]
        }
      });

      setAnalysisStep('Aplicando dados...');

      // Validar categoria e vertical retornadas
      const categoriaValida = CATEGORIAS.find(c => c.value === resultado.categoria)?.value || '';
      const verticalValida = VERTICAIS.find(v => v.value === resultado.vertical_atuacao)?.value || '';
      const modeloValido = MODELOS_NEGOCIO.find(m => m.value === resultado.modelo_negocio)?.value || '';

      // Tags: normalizar para garantir UTF-8 limpo (sem double-encoding)
      const tagsLimpas = (resultado.tags || []).map(tag => {
        // Primeiro tenta corrigir double-encoding, depois normaliza
        let t = tag;
        try { t = decodeURIComponent(escape(tag)); } catch {}
        return t.normalize('NFC').toLowerCase().trim();
      }).filter(t => t.length >= 2 && t.length <= 50);

      setFormData(prev => ({
        ...prev,
        nome: resultado.nome || prev.nome,
        descricao: resultado.descricao || prev.descricao,
        categoria: categoriaValida || prev.categoria,
        vertical_atuacao: verticalValida || prev.vertical_atuacao,
        modelo_negocio: modeloValido || prev.modelo_negocio,
        site: urlAnalise,
        email: resultado.email || prev.email,
        whatsapp: resultado.whatsapp || prev.whatsapp,
        linkedin: resultado.linkedin || prev.linkedin,
        preco_base: resultado.preco_base || prev.preco_base,
        tags: tagsLimpas,
      }));

      const camposPreenchidos = [
        resultado.nome && 'Nome',
        resultado.descricao && 'Descrição',
        categoriaValida && 'Categoria',
        verticalValida && 'Vertical',
        modeloValido && 'Modelo de Negócio',
        resultado.email && 'Email',
        resultado.whatsapp && 'WhatsApp',
        resultado.linkedin && 'LinkedIn',
        resultado.preco_base && 'Preço',
        tagsLimpas.length > 0 && `${tagsLimpas.length} Tags`,
      ].filter(Boolean);

      alert(`✅ Análise completa!\n\nCampos preenchidos: ${camposPreenchidos.join(', ')}.\n\nRevise e ajuste os dados antes de salvar.`);

    } catch (error) {
      console.error('Erro na análise do site:', error);
      alert('Erro ao analisar o site. Verifique se a URL está correta e tente novamente.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
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
      .map(tag => fixEncoding(tag))
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
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

          {/* Avaliação Qualitativa (Rating C-AAA) */}
          <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Avaliação Qualitativa (C a AAA)</h3>
                <p className="text-xs text-slate-600">Informação visível apenas após desbloqueio</p>
              </div>
            </div>

            {formData.avaliacao_qualitativa && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-purple-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl font-bold text-purple-700">
                    {formData.avaliacao_qualitativa.rating_final}
                  </div>
                  <div className="text-sm text-slate-600">
                    Score: {formData.avaliacao_qualitativa.score_final?.toFixed(1)}/100
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Avaliado por: {formData.avaliacao_qualitativa.avaliado_por || 'N/A'} • {' '}
                  {formData.avaliacao_qualitativa.data_avaliacao 
                    ? new Date(formData.avaliacao_qualitativa.data_avaliacao).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </div>
              </div>
            )}

            <AvaliacaoQualitativaForm 
              formData={formData}
              startupId={startup?.id}
              onUpdate={(avaliacaoData) => {
                setFormData(prev => ({
                  ...prev,
                  avaliacao_qualitativa: avaliacaoData
                }));
              }}
            />
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
              disabled={isProcessing || isUploadingLogo || isAnalyzing || duplicateCheck.checking}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isProcessing ? 'Salvando...' : (startup ? 'Atualizar Startup' : 'Salvar Startup')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}