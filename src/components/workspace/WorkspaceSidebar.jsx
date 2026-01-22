import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import {
  Lightbulb,
  Search,
  User as UserIcon,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function WorkspaceSidebar({ user }) {
  const location = useLocation();

  const menuItems = [
    { title: "Nova Busca", url: createPageUrl("Assistente"), icon: Lightbulb },
    { title: "Minhas Buscas", url: createPageUrl("MinhasBuscas"), icon: Search },
    { title: "FAQ", url: createPageUrl("FAQ"), icon: HelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await base44.auth.logout(createPageUrl('HomePublica'));
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.reload();
    }
  };

  return (
    <>
      <SidebarHeader className="border-b border-slate-200/60 p-4 flex justify-center">
        <Link to={createPageUrl("Home")} aria-label="Página Inicial">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8d5c8a61b_logo_icone-removebg-preview.png"
            alt="EncontrAI Logo"
            className="h-10 w-10"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <Link to={createPageUrl("Assistente")}>
          <Button className="w-full mb-6 bg-emerald-600 hover:bg-emerald-700">
            <Lightbulb className="w-4 h-4 mr-2" />
            Nova Busca
          </Button>
        </Link>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(1).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`hover:bg-slate-100 rounded-lg group ${
                      location.pathname.startsWith(item.url)
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600'
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon
                        className={`w-5 h-5 transition-colors ${
                          location.pathname.startsWith(item.url)
                            ? 'text-emerald-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/60 p-4 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate" title={user?.full_name}>
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate" title={user?.email}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </SidebarFooter>
    </>
  );
}