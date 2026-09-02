/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode, useCallback, lazy, Suspense } from 'react';
import { 
  Calculator, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  ChefHat, 
  ClipboardList,
  PlusCircle,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Menu,
  X as CloseIcon,
  Package,
  DollarSign,
  Settings as SettingsIcon,
  Lock,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import { useAppData } from './context/AppDataContext';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      localStorage.setItem('prdoces_error_logs', JSON.stringify(logs.slice(0, 200))); // Mantém os últimos 200 erros
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('prdoces_auth') === 'true');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(() => Number(localStorage.getItem('prdoces_login_attempts')) || 0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(() => Number(localStorage.getItem('prdoces_lockout_time')) || null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false);
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

  // Contador regressivo do bloqueio de segurança
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTime) {
      setTimeLeft(Math.ceil((lockoutTime - Date.now()) / 1000));
      interval = setInterval(() => {
        const left = Math.ceil((lockoutTime - Date.now()) / 1000);
        if (left <= 0) {
          setLockoutTime(null);
          setLoginAttempts(0);
          setTimeLeft(0);
          localStorage.removeItem('prdoces_lockout_time');
          localStorage.removeItem('prdoces_login_attempts');
        } else {
          setTimeLeft(left);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

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
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutTime && Date.now() < lockoutTime) {
      toast.error(`Sistema bloqueado. Aguarde ${Math.ceil((lockoutTime - Date.now()) / 1000)}s.`);
      return;
    }

    const currentPassword = localStorage.getItem('prdoces_password') || 'admin';
    
    if (password === currentPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('prdoces_auth', 'true');
      setLoginAttempts(0);
      setLockoutTime(null);
      localStorage.removeItem('prdoces_login_attempts');
      localStorage.removeItem('prdoces_lockout_time');
      toast.success('Bem-vinda de volta!');
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('prdoces_login_attempts', newAttempts.toString());
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPassword('');

      if (newAttempts >= 5) {
        const unlockTime = Date.now() + 60000; // 1 minuto
        setLockoutTime(unlockTime);
        localStorage.setItem('prdoces_lockout_time', unlockTime.toString());
        toast.error('Muitas tentativas. Sistema bloqueado por 1 minuto.');
        
        try {
          const logs = JSON.parse(localStorage.getItem('prdoces_error_logs') || '[]');
          logs.unshift({ timestamp: new Date().toISOString(), message: '[Security] Múltiplas tentativas de login falhas. Sistema bloqueado.' });
          localStorage.setItem('prdoces_error_logs', JSON.stringify(logs.slice(0, 200)));
        } catch(e) {}
      } else {
        toast.error(`Senha incorreta! Restam ${5 - newAttempts} tentativas.`);
        try {
          const logs = JSON.parse(localStorage.getItem('prdoces_error_logs') || '[]');
          logs.unshift({ timestamp: new Date().toISOString(), message: `[Security] Tentativa de login inválida (${newAttempts}/5).` });
          localStorage.setItem('prdoces_error_logs', JSON.stringify(logs.slice(0, 200)));
        } catch(e) {}
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('prdoces_auth');
    toast.success('Sistema bloqueado com segurança.');
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {/* Pode ser um spinner mais elaborado depois */}
        <Lock className="text-slate-300 animate-pulse" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 selection:bg-brand-primary/10 p-4">
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
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 w-full max-w-md text-center"
        >
          <div className="w-24 h-24 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner overflow-hidden">
            {customLogo ? (
              <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={48} className="text-brand-primary" />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">P.R_Doces</h1>
          <p className="text-slate-500 text-sm font-medium mb-8">Digite sua senha para acessar o sistema.</p>

          <motion.form 
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} 
            transition={{ duration: 0.4 }}
            onSubmit={handleLogin} 
            className="space-y-4"
          >
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Senha de acesso..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!!lockoutTime}
                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-12 py-4 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all disabled:opacity-50 disabled:bg-slate-100"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!!lockoutTime}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none disabled:opacity-50"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button 
              type="submit"
              disabled={!!lockoutTime}
              className="w-full bg-brand-primary text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Lock size={18} /> {lockoutTime ? `Bloqueado (${timeLeft}s)` : 'Entrar no Sistema'}
            </button>
          </motion.form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans selection:bg-brand-primary/10">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '16px', fontWeight: 'bold' } }} />
      {/* Injeta as cores customizadas em tempo de execução para substituir a cor primária padrão */}
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
            className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop & Mobile) */}
      <aside 
        className={`bg-[#0f172a] text-white flex flex-col z-40 fixed lg:relative h-full transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:shadow-none border-r border-white/5
          ${isSidebarOpen ? 'w-[260px]' : 'lg:w-[80px] w-0'}
          ${isMobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'}
        `}
      >
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
              P.R_Doces
            </h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <CloseIcon size={20} />
          </button>
          <button 
            onClick={toggleSidebar} 
            className={`hidden lg:flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all ${isSidebarOpen ? 'p-2' : 'w-10 h-10'}`}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
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

        <div className={`p-4 mt-auto transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 scale-90 invisible h-0 overflow-hidden'}`}>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] uppercase tracking-widest">Bloquear Sistema</span>
          </button>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capacidade</span>
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">80%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                className="bg-brand-primary h-full"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors active:scale-90"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight capitalize truncate">
              {activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full items-center gap-2">
               <Clock size={14} />
               {format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 scroll-smooth">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.2,
                ease: [0.23, 1, 0.32, 1]
              }}
            className="w-full h-full"
            >
            <Suspense fallback={<ModuleSkeleton />}>
              {activeTab === 'dashboard' && <DashboardModule onNavigate={(tab) => handleNavigate(tab as Tab)} />}
              {activeTab === 'orçamentos' && <BudgetModule />}
              {activeTab === 'agenda' && <CalendarModule />}
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
    >
      <div className={`flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <div className={`flex-1 text-left transition-all duration-300 overflow-hidden ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
        <span className="font-bold text-[11px] uppercase tracking-widest whitespace-nowrap">{label}</span>
      </div>
      
      {active && !collapsed && (
        <motion.div 
          layoutId="activeTabIndicator"
          className="w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </button>
  );
}
