import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { LogIn } from "lucide-react";

const SimplePublicHeader = () => {
  const handleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}${createPageUrl('Painel')}`;
      await base44.auth.redirectToLogin(redirectUrl);
    } catch (error) {
      console.error("Erro ao tentar redirecionar para o login:", error);
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/02b71dae4_Logo_expandido_3-removebg-preview.png"
            alt="EncontrAI Logo"
            className="h-8 w-auto"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 mr-4">
          <Link to={createPageUrl("FAQ")} className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">FAQ</Link>
          <Link to={createPageUrl("Contato")} className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Contato</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleLogin}>
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </Button>
          <Button size="sm" onClick={handleLogin} className="bg-emerald-600 hover:bg-emerald-700">
            Criar conta
          </Button>
        </div>
      </div>
    </header>
  );
};

const SimpleFooter = () => (
  <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/60 py-6 px-4">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-slate-600 gap-4">
      <p>&copy; {new Date().getFullYear()} EncontrAI. Todos os direitos reservados.</p>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link to={createPageUrl("Home")} className="hover:text-emerald-600">Início</Link>
        <Link to={createPageUrl("FAQ")} className="hover:text-emerald-600">FAQ</Link>
        <Link to={createPageUrl("Contato")} className="hover:text-emerald-600">Contato</Link>
        <Link to={createPageUrl("TermosDeUso")} className="hover:text-emerald-600">Termos de Uso</Link>
        <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-emerald-600">Política de Privacidade</Link>
      </div>
    </div>
  </footer>
);

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <SimplePublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <SimpleFooter />
    </div>
  );
}