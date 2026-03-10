import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Lightbulb,
  Loader2,
  Lock,
  Sparkles
} from 'lucide-react';

export default function Buscar() {
  const [problema, setProblema] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const MIN_CHARS = 20;
  const MAX_CHARS = 500;

  const validarProblema = (texto) => {
    const t = texto.trim();
    if (t.length < MIN_CHARS) return `Descreva com pelo menos ${MIN_CHARS} caracteres para uma busca precisa`;
    if (t.length > MAX_CHARS) return `Máximo de ${MAX_CHARS} caracteres`;
    // Rejeitar entradas claramente inválidas (só números, só símbolos, etc.)
    if (!/[a-zA-ZÀ-ÿ]{5,}/.test(t)) return 'Por favor, descreva seu desafio com palavras';
    return null;
  };

  const erroValidacao = problema.length > 0 ? validarProblema(problema) : null;
  const podeSubmeter = !erroValidacao && problema.trim().length >= MIN_CHARS && !isLoading;

  const handleBuscar = async () => {
    const erro = validarProblema(problema);
    if (erro || isLoading) return;

    setIsLoading(true);
    try {
      const sessionId = `sess_${crypto.randomUUID().replace(/-/g, '')}`;
      // Ler referral com expiração de 30 dias
      let referralCode;
      try {
        const raw = localStorage.getItem('referral_code');
        if (raw) {
          const parsed = JSON.parse(raw);
          const expired = !parsed.ts || (Date.now() - parsed.ts > 30 * 24 * 60 * 60 * 1000);
          if (!expired && /^[A-Za-z0-9_-]{3,20}$/.test(parsed.code)) {
            referralCode = parsed.code;
          } else {
            localStorage.removeItem('referral_code');
          }
        }
      } catch {
        localStorage.removeItem('referral_code');
      }

      await base44.entities.Transacao.create({
        session_id: sessionId,
        dor_relatada: problema.trim(),
        perfil_cliente: 'pessoa_fisica',
        status_pagamento: 'pendente',
        valor_por_startup: 5.00,
        referral_code: referralCode
      });

      navigate(createPageUrl(`Resultados?sessionId=${sessionId}`));

    } catch (error) {
      console.error("Erro ao iniciar busca:", error);
      alert("Ocorreu um erro ao iniciar sua busca. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const exemplos = [
    "Preciso organizar melhor meu estoque, sempre fico sem produtos importantes",
    "Quero automatizar as vendas do meu e-commerce e integrar com redes sociais",
    "Meu fluxo de caixa está uma bagunça, não sei quanto tenho para pagar as contas",
    "Quero organizar minhas finanças pessoais e começar a investir"
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/02b71dae4_Logo_expandido_3-removebg-preview.png"
              alt="EncontrAI Logo"
              className="h-14 w-auto"
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">Busca Rápida com IA</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Qual desafio você precisa resolver hoje?
          </h2>
          <p className="text-slate-600 text-lg">
            Descreva seu problema e nossa IA encontrará as melhores soluções
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">
                Descreva seu desafio ou necessidade
              </label>
              <Textarea
                placeholder="Ex: Preciso organizar melhor meu estoque, sempre fico sem produtos ou com excesso. Também queria controlar melhor as vendas..."
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                rows={6}
                className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white text-base"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>Sua busca é 100% confidencial</span>
                </div>
                <span className={`${problema.length > 450 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {problema.length}/500
                </span>
              </div>
            </div>

            <Button
              onClick={handleBuscar}
              disabled={!podeSubmeter}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando sua busca...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Encontrar Soluções
                </>
              )}
            </Button>

            {erroValidacao && (
              <p className="text-sm text-amber-600 text-center">
                {erroValidacao}
              </p>
            )}
          </div>
        </div>

        {/* Exemplos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span className="font-medium">Precisa de inspiração? Clique em um exemplo:</span>
          </div>

          <div className="grid gap-3">
            {exemplos.map((exemplo, index) => (
              <button
                key={index}
                onClick={() => !isLoading && setProblema(exemplo)}
                disabled={isLoading}
                className="text-left p-4 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl transition-all duration-200 hover:border-emerald-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm text-slate-700">"{exemplo}"</p>
              </button>
            ))}
          </div>
        </div>

        {/* Informativo */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200">
          <div className="text-center">
            <h3 className="font-semibold text-slate-900 mb-2">Como funciona?</h3>
            <p className="text-sm text-slate-600">
              Nossa IA analisa seu desafio e encontra até 5 startups com alto percentual de match.
              Você escolhe quantas quer desbloquear e paga apenas por elas (R$ 5,00 cada).
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              🎁 Ganhe 1 solução grátis ao desbloquear 2 ou mais!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}