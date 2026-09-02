import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  Settings, 
  Palette, 
  Image as ImageIcon, 
  Upload,
  Save,
  Trash2,
  CheckCircle2,
  Sparkles,
  Check,
  Database,
  Download,
  UploadCloud,
  Store,
  Phone,
  AtSign,
  MessageSquare,
  Truck,
  QrCode,
  Lock,
  ShieldCheck,
  Terminal,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './forms/ConfirmModal';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const PRESET_COLORS = ['#db2777', '#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#e11d48', '#0f172a'];

export default function SettingsModule() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [color, setColor] = useState<string>('#db2777');
  const [companyName, setCompanyName] = useState<string>('P.R_Doces');
  const [pixKey, setPixKey] = useState<string>('');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [companyInstagram, setCompanyInstagram] = useState<string>('');
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState<number>(0);
  const [dietaryWarning, setDietaryWarning] = useState<string>('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, desc: string, onConfirm: () => void}>({ isOpen: false, title: '', desc: '', onConfirm: () => {} });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await api.getSettings();
        setLogo(settings.logo || null);
        setColor(settings.color || '#db2777');
        setCompanyName(settings.companyName || 'P.R_Doces');
        setPixKey(settings.pixKey || '');
        setCompanyPhone(settings.companyPhone || '');
        setCompanyInstagram(settings.companyInstagram || '');
        setDefaultDeliveryFee(Number(settings.defaultDeliveryFee) || 0);
        setDietaryWarning(settings.dietaryWarning || 'Atenção alérgicos: nossos produtos podem conter traços de glúten, lactose e nozes.');
      } catch (error) {
        toast.error('Não foi possível carregar as configurações do sistema.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      const settingsToSave = [
        { key: 'logo', value: logo },
        { key: 'color', value: color },
        { key: 'companyName', value: companyName },
        { key: 'pixKey', value: pixKey },
        { key: 'companyPhone', value: companyPhone },
        { key: 'companyInstagram', value: companyInstagram },
        { key: 'defaultDeliveryFee', value: defaultDeliveryFee.toString() },
        { key: 'dietaryWarning', value: dietaryWarning },
      ];

      await Promise.all(settingsToSave.map(setting => api.saveSetting(setting)));
      
      window.dispatchEvent(new Event('prdoces_settings_update'));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar. A imagem da logo pode ser muito grande.');
    }
  };

  const handleChangePassword = () => {
    const savedPassword = localStorage.getItem('prdoces_password') || 'admin';
    if (currentPasswordInput !== savedPassword) {
      toast.error('Senha atual incorreta!');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As novas senhas não coincidem!');
      return;
    }
    localStorage.setItem('prdoces_password', newPassword);
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Senha de acesso alterada com sucesso!');
  };

  const exportData = async () => {
    try {
      const data = {
        customers: await api.getCustomers(),
        inventory: await api.getInventory(),
        menu: await api.getMenuProducts(),
        orders: (await api.getOrders({ limit: 9999 })).orders, // Busca todos os pedidos para o backup
        dailyLimits: await (api.getDailyLimits ? api.getDailyLimits() : Promise.resolve([])),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prdoces_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar backup.');
    }
  };

  const handleImportData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        setConfirmDialog({
          isOpen: true,
          title: 'Importar Backup?',
          desc: 'Atenção: Isso irá mesclar os dados do arquivo de backup com o sistema atual. Deseja continuar?',
          onConfirm: async () => {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            try {
              if (data.customers) for (const c of data.customers) await api.saveCustomer(c);
              if (data.inventory) for (const i of data.inventory) await api.saveInventoryItem(i);
              if (data.menu) for (const m of data.menu) await api.saveMenuProduct(m);
              if (data.orders) for (const o of data.orders) await api.saveOrder(o);
              if (data.dailyLimits) for (const l of data.dailyLimits) {
                if (api.saveDailyLimit) await api.saveDailyLimit(l);
              }
              toast.success('Backup importado com sucesso!');
              setTimeout(() => window.location.reload(), 1500);
            } catch (err) { toast.error('Erro durante a importação.'); }
          }
        });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao ler ou importar o arquivo de backup.');
      }
      if (importFileInputRef.current) importFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-brand-primary">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm font-bold text-slate-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 w-full">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h2>
        <p className="text-slate-500 font-medium mt-1">Personalize a identidade visual e gerencie os dados do sistema.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 pl-3 border-l-2 border-red-500">Segurança & Acesso</h3>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-8">
            <div className="flex items-center gap-3 text-slate-900 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-black text-xl tracking-tight">Alterar Senha</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Senha Atual</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="password" value={currentPasswordInput} onChange={e => setCurrentPasswordInput(e.target.value)} placeholder="Sua senha atual" className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 4 caracteres" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Confirmar Nova Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleChangePassword} disabled={!currentPasswordInput || !newPassword || !confirmPassword} className="w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Atualizar Senha
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Console de Administração</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Acesso aos logs de erro do sistema</p>
              </div>
              <button onClick={() => window.location.href = '/admin'} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors">
                <Terminal size={16} /> Abrir Painel Admin
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 pl-3 border-l-2 border-pink-500">Aparência & Marca</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
        {/* Card: Configuração de Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-8 flex-1">
            <div className="flex items-center gap-3 text-slate-900 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <ImageIcon size={20} />
              </div>
              <h3 className="font-black text-xl tracking-tight">Logo da Marca</h3>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-40 h-40 rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                {logo ? (
                  <>
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transform hover:scale-105 transition-all">
                        Trocar Imagem
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-2">
                    <ImageIcon size={32} className="opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-widest">Sem Logo</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 w-full">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                
                {!logo && (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all">
                    <Upload size={18} /> Enviar Imagem da Logo
                  </button>
                )}

                {logo && (
                  <button onClick={handleRemoveLogo} className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-bold px-6 py-3 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
                    <Trash2 size={18} /> Remover Logo Atual
                  </button>
                )}
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl inline-block w-full">
                  Recomendado: Imagem quadrada (1:1) em PNG transparente ou JPG.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card: Configuração de Cores */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-8 flex-1">
            <div className="flex items-center gap-3 text-slate-900 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <Palette size={20} />
              </div>
              <h3 className="font-black text-xl tracking-tight">Cores & Temas</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Paleta Rápida</label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map(preset => (
                    <button 
                      key={preset}
                      onClick={() => setColor(preset)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${color.toLowerCase() === preset.toLowerCase() ? 'scale-110 ring-4 ring-slate-100 shadow-lg' : 'hover:scale-105 hover:shadow-md'}`}
                      style={{ backgroundColor: preset }}
                    >
                      {color.toLowerCase() === preset.toLowerCase() && <Check size={20} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Cor Personalizada (HEX)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-inner border-2 border-slate-200 shrink-0">
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="absolute -inset-2 w-20 h-20 cursor-pointer" 
                    />
                  </div>
                  <div className="flex-1 w-full">
                     <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">#</span>
                       <input 
                         type="text"
                         value={color.replace('#', '')}
                         onChange={(e) => setColor(`#${e.target.value.replace('#', '')}`)}
                         className="w-full bg-white border border-slate-200 pl-8 pr-4 py-2.5 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none uppercase"
                         maxLength={6}
                       />
                     </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5 font-medium">
                  <Sparkles size={12} className="text-amber-500" />
                  Esta cor substituirá o tom padrão em todo o sistema.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 pl-3 border-l-2 border-emerald-500">Informações da Empresa</h3>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-8">
            <div className="flex items-center gap-3 text-slate-900 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <Store size={20} />
              </div>
              <h3 className="font-black text-xl tracking-tight">Dados do Negócio</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome da Empresa</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: P.R_Doces" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">WhatsApp Comercial</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Instagram</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={companyInstagram} onChange={e => setCompanyInstagram(e.target.value)} placeholder="@seu.instagram" className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Chave PIX</label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="E-mail, CPF, Celular..." className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 pl-3 border-l-2 border-purple-500">Preferências do Sistema</h3>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-8">
            <div className="flex items-center gap-3 text-slate-900 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-black text-xl tracking-tight">Orçamentos & Alertas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Taxa de Entrega Padrão (R$)</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="number" step="0.01" min="0" value={defaultDeliveryFee === 0 ? '' : defaultDeliveryFee} onChange={e => setDefaultDeliveryFee(Number(e.target.value))} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Valor inicial sugerido em novos orçamentos.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Aviso de Restrição Alimentar Padrão</label>
                <textarea value={dietaryWarning} onChange={e => setDietaryWarning(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
                <p className="text-[10px] text-slate-400 mt-1">Aparecerá automaticamente no rodapé dos orçamentos.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 pl-3 border-l-2 border-blue-500">Banco de Dados & Backup</h3>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
              <Database size={20} />
            </div>
            <h3 className="font-black text-xl tracking-tight">Gerenciamento de Dados</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={exportData} className="flex flex-col items-center justify-center p-5 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all gap-3 text-slate-600 hover:text-blue-600 shadow-sm">
              <Download size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Exportar Backup</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Salvar dados no PC</span>
              </div>
            </button>
            
            <button onClick={() => importFileInputRef.current?.click()} className="flex flex-col items-center justify-center p-5 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md transition-all gap-3 text-slate-600 hover:text-emerald-600 shadow-sm">
              <UploadCloud size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Importar Backup</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Restaurar de arquivo</span>
              </div>
            </button>
          </div>
          <input type="file" ref={importFileInputRef} className="hidden" accept=".json" onChange={handleImportData} />
        </div>
      </motion.div>
      </section>

      <div className="sticky bottom-4 z-40 bg-slate-900 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl mt-8 border border-slate-800">
        <div className="flex-1 w-full text-center sm:text-left">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 font-bold text-sm"
              >
                <CheckCircle2 size={18} /> Identidade visual salva com sucesso!
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-slate-400 text-sm font-medium"
              >
                Lembre-se de salvar para aplicar as mudanças.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          onClick={handleSave} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary text-white px-6 sm:px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          <Save size={18} /> Salvar Alterações
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.desc}
        confirmText="Sim, Confirmar"
      />
    </div>
  );
}