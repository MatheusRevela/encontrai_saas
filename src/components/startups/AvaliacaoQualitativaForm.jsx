import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, Info, Star } from "lucide-react";
import { base44 } from '@/api/base44Client';

// Componente de Estrelas Clicáveis
function StarRating({ value, onChange, label, helper }) {
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div>
      <Label className="text-xs text-slate-600 mb-2 block">{label}</Label>
      <div className="flex items-center gap-1 mb-1">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-all hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-slate-700">{value}/5</span>
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

const RATING_TABLE = [
  { min: 0, max: 20, rating: "C" },
  { min: 21, max: 25, rating: "CC" },
  { min: 26, max: 30, rating: "CCC-" },
  { min: 31, max: 35, rating: "CCC" },
  { min: 36, max: 40, rating: "CCC+" },
  { min: 41, max: 45, rating: "B-" },
  { min: 46, max: 50, rating: "B" },
  { min: 51, max: 55, rating: "B+" },
  { min: 56, max: 60, rating: "BB" },
  { min: 61, max: 65, rating: "BBB-" },
  { min: 66, max: 70, rating: "BBB" },
  { min: 71, max: 75, rating: "BBB+" },
  { min: 76, max: 80, rating: "A" },
  { min: 81, max: 85, rating: "AA-" },
  { min: 86, max: 90, rating: "AA" },
  { min: 91, max: 95, rating: "AA+" },
  { min: 96, max: 100, rating: "AAA" }
];

const PESOS = {
  equipe: 35,
  tese_modelo: 30,
  tracao: 25,
  qualidade_comercial: 10
};

export default function AvaliacaoQualitativaForm({ formData, onUpdate, startupId }) {
  const [scores, setScores] = useState({
    equipe: {
      tempo_mercado: 0,
      experiencia_captacao: 0,
      historico_empreendedor: 0
    },
    tese_modelo: {
      escalabilidade: 0,
      barreira_entrada: 0
    },
    tracao: {
      sinais_publicos: 0,
      prova_social: 0
    },
    qualidade_comercial: {
      fluidez_navegacao: 0,
      clareza_informacoes: 0
    }
  });

  const [justificativas, setJustificativas] = useState({
    equipe: '',
    tese: '',
    tracao: '',
    comercial: ''
  });

  useEffect(() => {
    if (formData.avaliacao_qualitativa) {
      const av = formData.avaliacao_qualitativa;
      setScores({
        equipe: av.equipe || scores.equipe,
        tese_modelo: av.tese_modelo || scores.tese_modelo,
        tracao: av.tracao || scores.tracao,
        qualidade_comercial: av.qualidade_comercial || scores.qualidade_comercial
      });
      setJustificativas({
        equipe: av.justificativa_equipe || '',
        tese: av.justificativa_tese || '',
        tracao: av.justificativa_tracao || '',
        comercial: av.justificativa_comercial || ''
      });
    }
  }, [formData.avaliacao_qualitativa]);

  const calcularScoreBloco = (criterios) => {
    const valores = Object.values(criterios);
    const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;
    return (media / 5) * 100;
  };

  const calcularScoreFinal = () => {
    const scoreEquipe = calcularScoreBloco(scores.equipe);
    const scoreTese = calcularScoreBloco(scores.tese_modelo);
    const scoreTracao = calcularScoreBloco(scores.tracao);
    const scoreComercial = calcularScoreBloco(scores.qualidade_comercial);

    return (
      (scoreEquipe * PESOS.equipe / 100) +
      (scoreTese * PESOS.tese_modelo / 100) +
      (scoreTracao * PESOS.tracao / 100) +
      (scoreComercial * PESOS.qualidade_comercial / 100)
    );
  };

  const getRating = (scoreFinal) => {
    const entry = RATING_TABLE.find(r => scoreFinal >= r.min && scoreFinal <= r.max);
    return entry ? entry.rating : "C";
  };

  const handleScoreChange = (bloco, criterio, valor) => {
    setScores(prev => ({
      ...prev,
      [bloco]: {
        ...prev[bloco],
        [criterio]: parseFloat(valor)
      }
    }));
  };

  const [salvando, setSalvando] = useState(false);

  const handleSalvarAvaliacao = async () => {
    const scoreFinal = calcularScoreFinal();
    const ratingFinal = getRating(scoreFinal);
    
    setSalvando(true);
    try {
      const user = await base44.auth.me();

      const avaliacaoCompleta = {
        equipe: {
          ...scores.equipe,
          score_bloco: calcularScoreBloco(scores.equipe)
        },
        tese_modelo: {
          ...scores.tese_modelo,
          score_bloco: calcularScoreBloco(scores.tese_modelo)
        },
        tracao: {
          ...scores.tracao,
          score_bloco: calcularScoreBloco(scores.tracao)
        },
        qualidade_comercial: {
          ...scores.qualidade_comercial,
          score_bloco: calcularScoreBloco(scores.qualidade_comercial)
        },
        score_final: scoreFinal,
        rating_final: ratingFinal,
        justificativa_equipe: justificativas.equipe,
        justificativa_tese: justificativas.tese,
        justificativa_tracao: justificativas.tracao,
        justificativa_comercial: justificativas.comercial,
        data_avaliacao: new Date().toISOString(),
        avaliado_por: user.email
      };

      // Salvar direto no banco se temos o ID da startup
      if (startupId) {
        await base44.entities.Startup.update(startupId, {
          avaliacao_qualitativa: avaliacaoCompleta
        });
        alert('✅ Avaliação salva com sucesso!');
      }

      // Também atualizar o estado local do formulário pai
      onUpdate(avaliacaoCompleta);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const scoreFinal = calcularScoreFinal();
  const ratingFinal = getRating(scoreFinal);

  return (
    <div className="space-y-6">
      {/* 1. Equipe - 35% */}
      <Card className="border-2 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            🧠 Equipe <span className="text-xs text-slate-500">(Peso: 35%)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <StarRating
              label="Tempo de Mercado"
              value={scores.equipe.tempo_mercado}
              onChange={(val) => handleScoreChange('equipe', 'tempo_mercado', val)}
              helper="1: 0-3 anos | 2: 3-5 | 3: 5-10 | 5: +10 anos"
            />
            <StarRating
              label="Experiência Captação"
              value={scores.equipe.experiencia_captacao}
              onChange={(val) => handleScoreChange('equipe', 'experiencia_captacao', val)}
              helper="0: Nenhuma | 3: Anjos/Aceleradoras | 5: VCs"
            />
            <StarRating
              label="Histórico Empreendedor"
              value={scores.equipe.historico_empreendedor}
              onChange={(val) => handleScoreChange('equipe', 'historico_empreendedor', val)}
              helper="0: Nunca | 1: Background | 3: Já empreen | 5: Exit"
            />
          </div>
          <div className="mb-2">
            <Label className="text-xs text-slate-600">Justificativa (Equipe)</Label>
            <Textarea
              value={justificativas.equipe}
              onChange={(e) => setJustificativas(prev => ({ ...prev, equipe: e.target.value }))}
              rows={2}
              maxLength={500}
              className="text-sm"
              placeholder="Justifique a avaliação da equipe..."
            />
          </div>
          <div className="text-sm font-semibold text-blue-700">
            Score Bloco: {calcularScoreBloco(scores.equipe).toFixed(1)}/100
          </div>
        </CardContent>
      </Card>

      {/* 2. Tese e Modelo - 30% */}
      <Card className="border-2 border-purple-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            🚀 Tese e Modelo de Negócios <span className="text-xs text-slate-500">(Peso: 30%)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <StarRating
              label="Escalabilidade"
              value={scores.tese_modelo.escalabilidade}
              onChange={(val) => handleScoreChange('tese_modelo', 'escalabilidade', val)}
              helper="0: Baixa | 3: Média | 5: Alta"
            />
            <StarRating
              label="Barreira de Entrada"
              value={scores.tese_modelo.barreira_entrada}
              onChange={(val) => handleScoreChange('tese_modelo', 'barreira_entrada', val)}
              helper="0: Baixa | 3: Média | 5: Alta"
            />
          </div>
          <div className="mb-2">
            <Label className="text-xs text-slate-600">Justificativa (Tese e Modelo)</Label>
            <Textarea
              value={justificativas.tese}
              onChange={(e) => setJustificativas(prev => ({ ...prev, tese: e.target.value }))}
              rows={2}
              maxLength={500}
              className="text-sm"
              placeholder="Justifique a avaliação da tese..."
            />
          </div>
          <div className="text-sm font-semibold text-purple-700">
            Score Bloco: {calcularScoreBloco(scores.tese_modelo).toFixed(1)}/100
          </div>
        </CardContent>
      </Card>

      {/* 3. Tração - 25% */}
      <Card className="border-2 border-green-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            📊 Tração (Proxy Pública) <span className="text-xs text-slate-500">(Peso: 25%)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <StarRating
              label="Sinais Públicos"
              value={scores.tracao.sinais_publicos}
              onChange={(val) => handleScoreChange('tracao', 'sinais_publicos', val)}
              helper="0: Nenhum | 2: Clientes citados | 5: Métricas públicas"
            />
            <StarRating
              label="Prova Social"
              value={scores.tracao.prova_social}
              onChange={(val) => handleScoreChange('tracao', 'prova_social', val)}
              helper="0: Nenhuma | 3: Parcerias | 5: Logos relevantes"
            />
          </div>
          <div className="mb-2">
            <Label className="text-xs text-slate-600">Justificativa (Tração)</Label>
            <Textarea
              value={justificativas.tracao}
              onChange={(e) => setJustificativas(prev => ({ ...prev, tracao: e.target.value }))}
              rows={2}
              maxLength={500}
              className="text-sm"
              placeholder="Justifique a avaliação da tração..."
            />
          </div>
          <div className="text-sm font-semibold text-green-700">
            Score Bloco: {calcularScoreBloco(scores.tracao).toFixed(1)}/100
          </div>
        </CardContent>
      </Card>

      {/* 4. Qualidade Comercial - 10% */}
      <Card className="border-2 border-amber-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            💰 Qualidade Comercial <span className="text-xs text-slate-500">(Peso: 10%)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <StarRating
              label="Fluidez Navegação"
              value={scores.qualidade_comercial.fluidez_navegacao}
              onChange={(val) => handleScoreChange('qualidade_comercial', 'fluidez_navegacao', val)}
              helper="0: Baixa | 3: Média | 5: Alta"
            />
            <StarRating
              label="Clareza Informações"
              value={scores.qualidade_comercial.clareza_informacoes}
              onChange={(val) => handleScoreChange('qualidade_comercial', 'clareza_informacoes', val)}
              helper="0: Baixa | 3: Média | 5: Alta"
            />
          </div>
          <div className="mb-2">
            <Label className="text-xs text-slate-600">Justificativa (Qualidade Comercial)</Label>
            <Textarea
              value={justificativas.comercial}
              onChange={(e) => setJustificativas(prev => ({ ...prev, comercial: e.target.value }))}
              rows={2}
              maxLength={500}
              className="text-sm"
              placeholder="Justifique a avaliação comercial..."
            />
          </div>
          <div className="text-sm font-semibold text-amber-700">
            Score Bloco: {calcularScoreBloco(scores.qualidade_comercial).toFixed(1)}/100
          </div>
        </CardContent>
      </Card>

      {/* Score Final e Rating */}
      <Card className="border-3 border-purple-400 bg-gradient-to-br from-purple-100 to-indigo-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-purple-900">Rating Final</h3>
              <p className="text-sm text-purple-700">Score ponderado por todos os blocos</p>
            </div>
            <div className="text-5xl font-black text-purple-700">
              {ratingFinal}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-slate-600">Score Final</p>
              <p className="text-xl font-bold text-slate-900">{scoreFinal.toFixed(2)}/100</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-slate-600">Classificação</p>
              <p className="text-xl font-bold text-purple-700">{ratingFinal}</p>
            </div>
          </div>
          <Button 
            onClick={handleSalvarAvaliacao} 
            disabled={salvando}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {salvando ? 'Salvando...' : 'Salvar Avaliação Completa'}
          </Button>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2 text-xs text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Esta avaliação ficará visível apenas após o cliente desbloquear a solução.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}