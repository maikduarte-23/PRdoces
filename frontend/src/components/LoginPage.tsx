/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  ChefHat, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast, { Toaster } from 'react-hot-toast';

interface LoginPageProps {
  customLogo?: string | null;
  customColor?: string | null;
  companyName: string;
  onLoginSuccess: () => void;
}

export default function LoginPage({
  customLogo,
  customColor,
  companyName,
  onLoginSuccess
}: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(() => Number(localStorage.getItem('prdoces_login_attempts')) || 0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(() => Number(localStorage.getItem('prdoces_lockout_time')) || null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Saudação dinâmica conforme o horário
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Bom dia', emoji: '✨' };
    if (hour >= 12 && hour < 18) return { text: 'Boa tarde', emoji: '🧁' };
    return { text: 'Boa noite', emoji: '🌙' };
  }, []);

  // Contador regressivo do bloqueio de segurança
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();

    if (lockoutTime && Date.now() < lockoutTime) {
      toast.error(`Sistema bloqueado. Aguarde ${Math.ceil((lockoutTime - Date.now()) / 1000)}s.`);
      return;
    }

    const currentPassword = localStorage.getItem('prdoces_password') || 'admin';

    if (password === currentPassword) {
      localStorage.setItem('prdoces_auth', 'true');
      setLoginAttempts(0);
      setLockoutTime(null);
      localStorage.removeItem('prdoces_login_attempts');
      localStorage.removeItem('prdoces_lockout_time');
      toast.success('Bem-vinda de volta! 🧁');
      onLoginSuccess();
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('prdoces_login_attempts', newAttempts.toString());
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setPassword('');

      if (newAttempts >= 5) {
        const unlockTime = Date.now() + 60000;
        setLockoutTime(unlockTime);
        localStorage.setItem('prdoces_lockout_time', unlockTime.toString());
        toast.error('Muitas tentativas incorretas! Sistema bloqueado por 60 segundos.');
      } else {
        toast.error(`Senha incorreta! (${5 - newAttempts} tentativas restantes)`);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', fontWeight: 'bold' } }} />

      {/* Injeção de Cores Customizadas */}
      {customColor && (
        <style>{`
          .bg-brand-primary { background-color: ${customColor} !important; }
          .text-brand-primary { color: ${customColor} !important; }
          .border-brand-primary { border-color: ${customColor} !important; }
          .ring-brand-primary\\/20 { --tw-ring-color: color-mix(in srgb, ${customColor} 20%, transparent) !important; }
          .shadow-brand-primary\\/30 { box-shadow: 0 15px 25px -5px color-mix(in srgb, ${customColor} 30%, transparent) !important; }
        `}</style>
      )}

      {/* Elementos Luminosos de Fundo (Glow Blobs) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Card de Login Glassmorphic */}
      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/[0.97] backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-black/40 border border-white/20 relative z-10"
      >
        {/* Topo: Logo & Saudação */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-3xl bg-pink-50 border-2 border-pink-100 flex items-center justify-center mx-auto shadow-md overflow-hidden relative group">
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ChefHat size={44} className="text-brand-primary" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
              <Sparkles size={12} />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            <span>{greeting.text}</span>
            <span>{greeting.emoji}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {companyName}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Painel de Gestão & Confeitaria
          </p>
        </div>

        {/* Formulário de Autenticação */}
        <motion.form 
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}} 
          transition={{ duration: 0.4 }}
          onSubmit={handleLogin} 
          className="space-y-4"
        >
          <div>
            <div className="flex justify-between items-center mb-1.5 px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Senha de Acesso
              </label>
              {loginAttempts > 0 && !lockoutTime && (
                <span className="text-[10px] font-bold text-rose-500">
                  {5 - loginAttempts} {5 - loginAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'}
                </span>
              )}
            </div>

            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                autoFocus
                type={showPassword ? "text" : "password"} 
                placeholder="Digite sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!!lockoutTime}
                className="w-full bg-slate-50 border border-slate-200 pl-11 pr-11 py-3.5 sm:py-4 rounded-2xl text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:border-brand-primary transition-all disabled:opacity-50 disabled:bg-slate-100"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!!lockoutTime}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!!lockoutTime || !password.trim()}
            className="w-full min-h-[50px] bg-brand-primary hover:brightness-110 active:scale-[0.98] text-white font-black uppercase tracking-wider text-xs sm:text-sm py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/30 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
          >
            <Lock size={16} /> 
            {lockoutTime ? `Bloqueado (${timeLeft}s)` : 'Acessar Sistema'}
          </button>
        </motion.form>

        {/* Rodapé do Card: Dica de Senha & Selo de Segurança */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 hover:text-slate-600 transition-colors font-medium text-[11px]"
          >
            <HelpCircle size={14} /> Esqueci a senha
          </button>

          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/60">
            <ShieldCheck size={13} /> Seguro
          </div>
        </div>
      </motion.div>

      {/* Modal de Ajuda / Recuperação de Senha */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-brand-primary font-black text-base">
                  <Key size={18} /> Dica de Senha
                </div>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-amber-800">
                  <AlertCircle size={15} /> Senha Padrão de Instalação:
                </div>
                <p>
                  A senha padrão inicial do sistema é: <strong className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-amber-300">admin</strong>
                </p>
                <p className="text-[11px] text-amber-700">
                  Você pode alterá-la a qualquer momento na aba <strong>Configurações</strong> após entrar.
                </p>
              </div>

              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-wider"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
