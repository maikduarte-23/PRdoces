import { useState, useEffect, useCallback, lazy, Suspense, ReactNode } from 'react';
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
  Menu,
  X as CloseIcon,
  ChefHat,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import { useAppData } from './context/AppDataContext';
import LoginPage from './components/LoginPage';

// Lazy Loaded Components for Maximum Bundle Performance
const BudgetModule = lazy(() => import('./components/BudgetModule'));
const CalendarModule = lazy(() => import('./components/CalendarModule'));
const CustomerModule = lazy(() => import('./components/CustomerModule'));
const DashboardModule = lazy(() => import('./components/DashboardModule'));
const InventoryModule = lazy(() => import('./components/InventoryModule'));
const CatalogModule = lazy(() => import('./components/CatalogModule'));
const FinanceModule = lazy(() => import('./components/FinanceModule'));
const SettingsModule = lazy(() => import('./components/SettingsModule'));
const AdminLogsModule = lazy(() => import('./components/AdminLogsModule'));

type Tab = 'dashboard' | 'orçamentos' | 'agenda' | 'clientes' | 'estoque' | 'catálogo' | 'financeiro' | 'configurações' | 'admin';

function ModuleSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-2xl" />
          <div className="h-4 w-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3">
            <div className="h-6 w-6 bg-slate-100 rounded-xl" />
            <div className="h-6 w-24 bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-80 bg-white border border-slate-200/80 rounded-[2.5rem]" />
        <div className="lg:col-span-4 h-80 bg-white border border-slate-200/80 rounded-[2.5rem]" />
      </div>
    </div>
  );
}

// Interceptador de Erros Globais (Monitoramento Silencioso)
if (typeof window !== 'undefined' && !(window as any)._prdoces_logger_setup) {
  (window as any)._prdoces_logger_setup = true;
  
  const saveLog = (msg: string) => {
    try {
      const logs = JSON.parse(localStorage.getItem('prdoces_error_logs') || '[]');
      logs.unshift({ timestamp: new Date().toISOString(), message: msg });
      localStorage.setItem('prdoces_error_logs', JSON.stringify(logs.slice(0, 200)));
    } catch (e) {}
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
    const msg = args.map(a => a instanceof Error ? a.stack || a.message : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    saveLog(msg);
  };

  window.addEventListener('error', (e) => saveLog(`[Global Error] ${e.message} em ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => saveLog(`[Promise Rejection] ${e.reason}`));
}

export default function App() {
  const { settings, isLoaded, refreshSettings } = useAppData();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (window.location.pathname.startsWith('/admin')) return 'admin';
    const saved = localStorage.getItem('prdoces_current_tab');
    return (saved as Tab) || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const customLogo = settings.logo || null;
  const customColor = settings.color || null;
  const companyNameSys = settings.companyName || 'P.R_Doces';

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('prdoces_auth') === 'true');
  const isAppLoading = !isLoaded;

  // Ouve quando a página de configurações salva os dados para atualizar instantaneamente
  useEffect(() => {
    window.addEventListener('prdoces_settings_update', refreshSettings);
    return () => window.removeEventListener('prdoces_settings_update', refreshSettings);
  }, [refreshSettings]);

  useEffect(() => {
    localStorage.setItem('prdoces_current_tab', activeTab);
    setIsMobileMenuOpen(false);
    
    if (activeTab === 'admin' && window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    } else if (activeTab !== 'admin' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, [activeTab]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    // Rola para o topo ao trocar de aba no mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('prdoces_auth');
    toast.success('Sistema bloqueado com segurança.');
  };

  if (!isAuthenticated) {
    return (
      <LoginPage 
        customLogo={customLogo}
        customColor={customColor}
        companyName={companyNameSys}
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans selection:bg-brand-primary/10">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '16px', fontWeight: 'bold' } }} />
      {customColor && (
        <style>{`
          .bg-brand-primary { background-color: ${customColor} !important; }
          .text-brand-primary { color: ${customColor} !important; }
          .border-brand-primary { border-color: ${customColor} !important; }
          .ring-brand-primary\\/20 { --tw-ring-color: color-mix(in srgb, ${customColor} 20%, transparent) !important; }
          .shadow-brand-primary\\/20 { box-shadow: 0 10px 15px -3px color-mix(in srgb, ${customColor} 20%, transparent), 0 4px 6px -4px color-mix(in srgb, ${customColor} 20%, transparent) !important; }
          .selection\\:bg-brand-primary\\/10 *::selection { background-color: color-mix(in srgb, ${customColor} 10%, transparent) !important; }
        `}</style>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`bg-[#0f172a] text-white flex flex-col z-50 fixed lg:relative h-full transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:shadow-none border-r border-white/5
          ${isSidebarOpen ? 'w-[260px]' : 'lg:w-[80px] w-0'}
          ${isMobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Cabeçalho da Sidebar */}
        <div className={`flex items-center h-16 shrink-0 bg-white/5 transition-all ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center'}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen ? 'lg:hidden' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20 overflow-hidden">
               {customLogo ? (
                 <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 <ChefHat size={18} className="text-white" />
               )}
            </div>
            <h1 className="text-sm font-black tracking-tighter text-white uppercase whitespace-nowrap">
              {companyNameSys}
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <CloseIcon size={20} />
          </button>
          <button 
            onClick={toggleSidebar} 
            className={`hidden lg:flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all ${isSidebarOpen ? 'p-2' : 'w-10 h-10'}`}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleNavigate('dashboard')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Calculator size={20} />} 
            label="Orçamentos" 
            active={activeTab === 'orçamentos'} 
            onClick={() => handleNavigate('orçamentos')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label="Agenda" 
            active={activeTab === 'agenda'} 
            onClick={() => handleNavigate('agenda')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Clientes" 
            active={activeTab === 'clientes'} 
            onClick={() => handleNavigate('clientes')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<DollarSign size={20} />} 
            label="Financeiro" 
            active={activeTab === 'financeiro'} 
            onClick={() => handleNavigate('financeiro')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<ClipboardList size={20} />} 
            label="Catálogo" 
            active={activeTab === 'catálogo'} 
            onClick={() => handleNavigate('catálogo')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Package size={20} />} 
            label="Estoque" 
            active={activeTab === 'estoque'} 
            onClick={() => handleNavigate('estoque')}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<SettingsIcon size={20} />} 
            label="Configurações" 
            active={activeTab === 'configurações'} 
            onClick={() => handleNavigate('configurações')}
            collapsed={!isSidebarOpen}
          />
        </nav>

        {/* Rodapé da Sidebar */}
        <div className={`p-4 mt-auto transition-all duration-300 ${isSidebarOpen || isMobileMenuOpen ? 'opacity-100' : 'opacity-0 scale-90 invisible h-0 overflow-hidden'}`}>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-rose-400 transition-all group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] uppercase tracking-wider">Bloquear Sistema</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors active:scale-95"
              title="Menu Principal"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight capitalize truncate">
                {activeTab}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex text-xs text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full items-center gap-2 font-medium">
              <Clock size={14} className="text-brand-primary" />
              {format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
        </header>

        {/* Viewport dos Módulos com Scroll Protegido */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-8 pb-28 lg:pb-8 bg-slate-50 scroll-smooth">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ 
                duration: 0.18,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="w-full h-full max-w-7xl mx-auto"
            >
              <Suspense fallback={<ModuleSkeleton />}>
                {activeTab === 'dashboard' && <DashboardModule onNavigate={(tab) => handleNavigate(tab as Tab)} />}
                {activeTab === 'orçamentos' && <BudgetModule />}
                {activeTab === 'agenda' && <CalendarModule onNavigate={(tab) => handleNavigate(tab as Tab)} />}
                {activeTab === 'clientes' && <CustomerModule />}
                {activeTab === 'financeiro' && <FinanceModule onNavigate={(tab) => handleNavigate(tab as Tab)} />}
                {activeTab === 'catálogo' && <CatalogModule />}
                {activeTab === 'estoque' && <InventoryModule />}
                {activeTab === 'configurações' && <SettingsModule />}
                {activeTab === 'admin' && <AdminLogsModule />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 📱 Barra de Navegação Inferior Fixa para Celular (Bottom Navigation Bar) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg">
          <MobileNavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Início" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleNavigate('dashboard')} 
          />
          <MobileNavItem 
            icon={<Calculator size={20} />} 
            label="Orçamento" 
            active={activeTab === 'orçamentos'} 
            onClick={() => handleNavigate('orçamentos')} 
          />
          <MobileNavItem 
            icon={<Calendar size={20} />} 
            label="Agenda" 
            active={activeTab === 'agenda'} 
            onClick={() => handleNavigate('agenda')} 
          />
          <MobileNavItem 
            icon={<DollarSign size={20} />} 
            label="Financeiro" 
            active={activeTab === 'financeiro'} 
            onClick={() => handleNavigate('financeiro')} 
          />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-90"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-bold mt-1">Mais</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  onClick, 
  collapsed 
}: { 
  icon: ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  collapsed?: boolean; 
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
        active 
          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
      title={collapsed ? label : undefined}
    >
      <div className="shrink-0">{icon}</div>
      <span className={`font-bold text-sm tracking-tight truncate transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
        {label}
      </span>
      {active && !collapsed && (
        <motion.div 
          layoutId="activeIndicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </button>
  );
}

function MobileNavItem({
  icon,
  label,
  active,
  onClick
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90 ${
        active 
          ? 'text-brand-primary font-black' 
          : 'text-slate-400 hover:text-slate-600 font-medium'
      }`}
    >
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-pink-50 text-brand-primary shadow-xs' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] leading-tight mt-0.5">{label}</span>
    </button>
  );
}
