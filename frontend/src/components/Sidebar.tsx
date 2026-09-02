/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Calendar, 
  Users, 
  DollarSign, 
  Package, 
  ClipboardList, 
  Settings as SettingsIcon, 
  LogOut, 
  X as CloseIcon, 
  ChefHat, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  onLogout: () => void;
  companyName: string;
  customLogo?: string | null;
  customColor?: string | null;
}

interface NavGroup {
  title: string;
  items: {
    id: Tab;
    label: string;
    icon: ReactNode;
    badge?: string;
  }[];
}

export default function Sidebar({
  activeTab,
  onNavigate,
  isSidebarOpen,
  onToggleSidebar,
  isMobileMenuOpen,
  onCloseMobileMenu,
  onLogout,
  companyName,
  customLogo,
  customColor,
}: SidebarProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navGroups: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'orçamentos', label: 'Orçamentos', icon: <Calculator size={20} /> },
        { id: 'agenda', label: 'Agenda', icon: <Calendar size={20} /> },
      ],
    },
    {
      title: 'Operação',
      items: [
        { id: 'clientes', label: 'Clientes', icon: <Users size={20} /> },
        { id: 'catálogo', label: 'Catálogo', icon: <ClipboardList size={20} /> },
        { id: 'estoque', label: 'Estoque', icon: <Package size={20} /> },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
        { id: 'configurações', label: 'Configurações', icon: <SettingsIcon size={20} /> },
      ],
    },
  ];

  // Se o usuário estiver na aba admin ou acessar a rota admin
  if (activeTab === 'admin') {
    navGroups.push({
      title: 'Sistema',
      items: [
        { id: 'admin', label: 'Logs do Sistema', icon: <ShieldCheck size={20} /> },
      ],
    });
  }

  return (
    <>
      {/* Overlay Backdrop para Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Principal (Desktop e Drawer Mobile) */}
      <aside
        className={`bg-[#0b1120] text-slate-200 flex flex-col z-50 fixed lg:relative h-full transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-slate-800/80 shadow-2xl lg:shadow-none select-none
          ${isSidebarOpen ? 'w-[270px]' : 'lg:w-[84px] w-0'}
          ${isMobileMenuOpen ? 'translate-x-0 w-[285px]' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Cabeçalho / Branding */}
        <div className="h-20 shrink-0 flex items-center justify-between px-4 border-b border-slate-800/70 bg-[#0f172a]/60">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {/* Logo / Ícone com Efeito Glow */}
            <div className="relative shrink-0 group">
              <div 
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-pink-600 flex items-center justify-center text-white shadow-lg shadow-brand-primary/25 overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={customColor ? { background: `linear-gradient(135deg, ${customColor}, #db2777)` } : undefined}
              >
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ChefHat size={22} className="text-white drop-shadow-sm" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0b1120] rounded-full" title="Sistema Online" />
            </div>

            {/* Nome da Empresa & Tagline (Visível quando expandido) */}
            <div className={`transition-all duration-200 flex flex-col justify-center min-w-0 ${!isSidebarOpen ? 'lg:hidden' : 'opacity-100'}`}>
              <h1 className="text-sm font-black tracking-tight text-white uppercase truncate">
                {companyName}
              </h1>
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 truncate">
                <Sparkles size={11} className="text-brand-primary shrink-0" /> Confeitaria Artesanal
              </span>
            </div>
          </div>

          {/* Botão Fechar (Mobile) */}
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Fechar menu"
          >
            <CloseIcon size={20} />
          </button>

          {/* Botão Recolher/Expandir (Desktop) */}
          <button
            onClick={onToggleSidebar}
            className={`hidden lg:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all duration-200 ${
              isSidebarOpen ? 'w-8 h-8' : 'w-9 h-9 mx-auto'
            }`}
            title={isSidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Links de Navegação com Categorias */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-1">
              {/* Título do Grupo ou Linha Divisória */}
              {isSidebarOpen ? (
                <div className="px-3 pt-1 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
                    {group.title}
                  </span>
                </div>
              ) : (
                groupIdx > 0 && <div className="my-2 border-t border-slate-800/60 mx-2" />
              )}

              {/* Itens do Grupo */}
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const isHovered = hoveredTab === item.id;

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => onNavigate(item.id)}
                      onMouseEnter={() => setHoveredTab(item.id)}
                      onMouseLeave={() => setHoveredTab(null)}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl transition-all duration-200 relative text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-primary to-pink-600 text-white font-bold shadow-lg shadow-brand-primary/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium'
                      } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
                    >
                      {/* Ícone com Micro-interação */}
                      <div className={`shrink-0 transition-transform duration-200 ${isHovered || isActive ? 'scale-110' : ''} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                        {item.icon}
                      </div>

                      {/* Label do Menu (Quando Expandido) */}
                      {isSidebarOpen && (
                        <span className="text-sm tracking-tight truncate flex-1">
                          {item.label}
                        </span>
                      )}

                      {/* Indicador Ativo */}
                      {isActive && isSidebarOpen && (
                        <motion.div
                          layoutId="activeNavDot"
                          className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </button>

                    {/* Tooltip Flutuante no Modo Recolhido (Desktop) */}
                    {!isSidebarOpen && (
                      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-1.5 bg-slate-900/95 text-white text-xs font-bold rounded-xl shadow-xl border border-slate-700/70 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-slate-800/70 bg-[#0f172a]/40 shrink-0">
          {/* Card de Status do Sistema (Quando expandido) */}
          {isSidebarOpen && (
            <div className="mb-2 p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-slate-400">Ateliê Conectado</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">v1.0.0</span>
            </div>
          )}

          {/* Botão de Bloqueio / Logout */}
          <div className="relative group">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 border border-transparent hover:border-rose-500/20 group/btn ${
                !isSidebarOpen ? 'justify-center px-0' : ''
              }`}
              title={!isSidebarOpen ? 'Bloquear Sistema' : undefined}
            >
              <div className="shrink-0 p-1 rounded-xl bg-slate-800/60 text-slate-400 group-hover/btn:text-rose-400 group-hover/btn:bg-rose-500/20 transition-all">
                <Lock size={16} />
              </div>

              {isSidebarOpen && (
                <div className="flex flex-col text-left truncate flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 group-hover/btn:text-rose-300">
                    Bloquear Sistema
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover/btn:text-rose-400/80">
                    Sair com segurança
                  </span>
                </div>
              )}

              {isSidebarOpen && (
                <LogOut size={16} className="text-slate-500 group-hover/btn:text-rose-400 group-hover/btn:translate-x-0.5 transition-all shrink-0" />
              )}
            </button>

            {/* Tooltip do Logout quando recolhido */}
            {!isSidebarOpen && (
              <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-1.5 bg-rose-950/90 text-rose-200 text-xs font-bold rounded-xl shadow-xl border border-rose-800/50 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200 backdrop-blur-md">
                Bloquear Sistema (Sair)
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
