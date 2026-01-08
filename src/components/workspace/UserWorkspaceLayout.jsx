import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu } from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import WorkspaceSidebar from './WorkspaceSidebar';

export default function UserWorkspaceLayout({ children, user }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <WorkspaceSidebar user={user} />
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="md:hidden bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 flex items-center gap-4">
            <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
              <Menu className="w-5 h-5 text-slate-700" />
            </SidebarTrigger>
            <Link to={createPageUrl("Home")} aria-label="Página Inicial">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/02b71dae4_Logo_expandido_3-removebg-preview.png" 
                alt="EncontrAI Logo" 
                className="h-7 w-auto" 
              />
            </Link>
          </header>
          
          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}