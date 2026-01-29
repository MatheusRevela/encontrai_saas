import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Search,
  History,
  Brain,
  LogOut,
  MessageCircle,
  Handshake,
  Wrench,
  BarChart3,
  Building2,
  Beaker,
  ShoppingCart,
  Users,
  User as UserOutlineIcon
} from 'lucide-react';

const AdminNav = ({ navItems }) => {
  const adminGroups = [
    { title: 'Dashboard', items: ['Dashboard', 'Meu Dashboard'] },
    { title: 'Visão do Usuário', items: ['Painel de Usuário', 'Nova Busca (IA)', 'Busca Rápida', 'Minhas Buscas'] },
    { title: 'Gestão', items: ['Startups', 'Laboratório', 'Transações', 'Conversas', 'Usuários', 'Parceiros'] },
    { title: 'Ferramentas', items: ['Ferramentas'] }
  ];

  return (
    <>
      {adminGroups.map((group, index) => (
        <div key={index}>
          {group.title && (
            <h3 className={`text-xs font-semibold uppercase text-slate-400 px-4 mb-2 ${index > 0 ? 'mt-4' : ''}`}>
              {group.title}
            </h3>
          )}
          {navItems
            .filter(item => group.items.includes(item.name))
            .map((item) => {
              const IconComponent = item.icon;
              return (
                <Link 
                  key={item.name} 
                  to={createPageUrl(item.path)} 
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </>
  );
};

const UserNav = ({ navItems }) => {
  const userGroups = [
    { title: 'Menu', items: ['Meu Dashboard', 'Painel de Usuário', 'Nova Busca (IA)', 'Busca Rápida', 'Minhas Buscas'] }
  ];

  return (
    <>
      {userGroups.map((group, index) => (
        <div key={index}>
          {group.title && (
            <h3 className={`text-xs font-semibold uppercase text-slate-400 px-4 mb-2 ${index > 0 ? 'mt-4' : ''}`}>
              {group.title}
            </h3>
          )}
          {navItems
            .filter(item => item.section === 'user' && group.items.includes(item.name))
            .map((item) => {
              const IconComponent = item.icon;
              return (
                <Link 
                  key={item.name} 
                  to={createPageUrl(item.path)} 
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </>
  );
};

export default function ProtectedLayout({ children, pageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: 'dashboard', icon: BarChart3, section: 'admin', group: 'Dashboard' },
    { name: 'Meu Dashboard', path: 'DashboardUsuario', icon: UserOutlineIcon, section: 'user', group: 'Visão do Usuário' },
    { name: 'Painel de Usuário', path: 'Painel', icon: UserOutlineIcon, section: 'user', group: 'Visão do Usuário' },
    { name: 'Nova Busca (IA)', path: 'Assistente', icon: Brain, section: 'user', group: 'Visão do Usuário' },
    { name: 'Busca Rápida', path: 'Buscar', icon: Search, section: 'user', group: 'Visão do Usuário' },
    { name: 'Minhas Buscas', path: 'MinhasBuscas', icon: History, section: 'user', group: 'Visão do Usuário' },
    { name: 'Startups', path: 'Startups', icon: Building2, section: 'admin', group: 'Gestão' },
    { name: 'Laboratório', path: 'LaboratorioStartups', icon: Beaker, section: 'admin', group: 'Gestão' },
    { name: 'Transações', path: 'transacoes', icon: ShoppingCart, section: 'admin', group: 'Gestão' },
    { name: 'Conversas', path: 'Conversas', icon: MessageCircle, section: 'admin', group: 'Gestão' },
    { name: 'Usuários', path: 'users', icon: Users, section: 'admin', group: 'Gestão' },
    { name: 'Parceiros', path: 'Parceiros', icon: Handshake, section: 'admin', group: 'Gestão' },
    { name: 'Ferramentas', path: 'Ferramentas', icon: Wrench, section: 'admin', group: 'Ferramentas' }
  ];

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setIsLoading(false);
        
        // 🎯 ROLE-BASED HOMEPAGE
        if (location.pathname === '/' || location.pathname === '/index') {
          if (userData.role === 'admin') {
            navigate(createPageUrl('dashboard'), { replace: true });
          } else {
            navigate(createPageUrl('DashboardUsuario'), { replace: true });
          }
        }
      } catch (e) {
        // Usuário não autenticado - redireciona imediatamente
        setIsLoading(false);
        const publicUrl = createPageUrl('HomePublica');
        window.location.replace(publicUrl);
      }
    };
    checkUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl('HomePublica'));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-slate-100 p-4">
                  <nav className="flex flex-col gap-2 mt-8">
                    {user?.role === 'admin' ? <AdminNav navItems={navItems} /> : <UserNav navItems={navItems} />}
                  </nav>
                </SheetContent>
              </Sheet>
              <Link to={createPageUrl(user?.role === 'admin' ? 'dashboard' : 'DashboardUsuario')}>
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/02b71dae4_Logo_expandido_3-removebg-preview.png" alt="EncontrAI" className="h-10 w-auto"/>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar - Largura aumentada para 280px */}
      <div className="hidden md:flex md:w-[280px] md:flex-col md:fixed md:inset-y-0 md:top-16">
        <div className="flex flex-col flex-grow bg-white overflow-y-auto border-r shadow-sm">
          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-3 py-4 space-y-1">
              {user?.role === 'admin' ? <AdminNav navItems={navItems} /> : <UserNav navItems={navItems} />}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content - Ajustado para nova largura da sidebar */}
      <main className="md:pl-[280px] pt-16">
        {children}
      </main>
    </div>
  );
}