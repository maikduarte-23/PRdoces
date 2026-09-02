/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, useEffect, useMemo } from 'react';
import { 
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
  Loader2,
  MapPin,
  Percent,
  CalendarDays,
  BellRing,
  Volume2,
  VolumeX,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  Layers,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './forms/ConfirmModal';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { compressImage } from '../utils/imageCompressor';
import { useAppData } from '../context/AppDataContext';

// Cores temáticas elegantes selecionadas para confeitaria e doceria
const PRESET_COLORS = [
  { name: 'Rosa Confeiteira', hex: '#db2777' },
  { name: 'Lavanda Doce', hex: '#8b5cf6' },
  { name: 'Azul Tiffany', hex: '#0ea5e9' },
  { name: 'Verde Menta', hex: '#10b981' },
  { name: 'Caramelo & Ouro', hex: '#f59e0b' },
  { name: 'Vermelho Morango', hex: '#e11d48' },
  { name: 'Chantilly Rose', hex: '#ec4899' },
  { name: 'Grafite Moderno', hex: '#0f172a' }
];

type SettingsSection = 'marca' | 'empresa' | 'orcamento' | 'preferencias' | 'seguranca' | 'backup';

export default function SettingsModule() {
  const { 
    settings, 
    refreshSettings, 
    isLoaded,
    customers,
    menuProducts,
    inventory,
    expenses
  } = useAppData();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Seção Ativa
  const [activeSection, setActiveSection] = useState<SettingsSection>('marca');

  // 1. Marca & Identidade Visual
  const [logo, setLogo] = useState<string | null>(settings.logo || null);
  const [color, setColor] = useState<string>(settings.color || '#db2777');
  const [companyName, setCompanyName] = useState<string>(settings.companyName || 'P.R_Doces');
  const [tagline, setTagline] = useState<string>(settings.tagline || 'Confeitaria Artesanal & Ateliê de Doces');

  // 2. Dados da Empresa & PIX
  const [companyPhone, setCompanyPhone] = useState<string>(settings.companyPhone || '');
  const [companyInstagram, setCompanyInstagram] = useState<string>(settings.companyInstagram || '');
  const [pixKey, setPixKey] = useState<string>(settings.pixKey || '');
  const [pixReceiverName, setPixReceiverName] = useState<string>(settings.pixReceiverName || '');
  const [pickupAddress, setPickupAddress] = useState<string>(settings.pickupAddress || '');

  // 3. Regras de Orçamento & Produção
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState<number>(Number(settings.defaultDeliveryFee) || 0);
  const [defaultDepositPercentage, setDefaultDepositPercentage] = useState<number>(Number(settings.defaultDepositPercentage) || 50);
  const [budgetValidityDays, setBudgetValidityDays] = useState<number>(Number(settings.budgetValidityDays) || 7);
  const [minLeadTimeDays, setMinLeadTimeDays] = useState<number>(Number(settings.minLeadTimeDays) || 2);
  const [defaultDailyOrderLimit, setDefaultDailyOrderLimit] = useState<number>(Number(settings.defaultDailyOrderLimit) || 5);
  const [receiptThankYouMessage, setReceiptThankYouMessage] = useState<string>(
    settings.receiptThankYouMessage || 'Agradecemos a preferência! Feito com carinho para adoçar o seu momento especial.'
  );
  const [dietaryWarning, setDietaryWarning] = useState<string>(
    settings.dietaryWarning || 'Atenção alérgicos: nossos produtos podem conter traços de glúten, lactose e oleaginosas.'
  );

  // 4. Preferências & Alertas
  const [enableStockAlerts, setEnableStockAlerts] = useState<boolean>(settings.enableStockAlerts !== 'false');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(settings.soundAlerts !== 'false');

  // 5. Segurança
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Controle e UI
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', desc: '', onConfirm: () => {} });

  const [isLoading, setIsLoading] = useState(!isLoaded);

  // Sincroniza dados com o context
  useEffect(() => {
    if (isLoaded) {
      setLogo(settings.logo || null);
      setColor(settings.color || '#db2777');
      setCompanyName(settings.companyName || 'P.R_Doces');
      setTagline(settings.tagline || 'Confeitaria Artesanal & Ateliê de Doces');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyInstagram(settings.companyInstagram || '');
      setPixKey(settings.pixKey || '');
      setPixReceiverName(settings.pixReceiverName || '');
      setPickupAddress(settings.pickupAddress || '');
      setDefaultDeliveryFee(Number(settings.defaultDeliveryFee) || 0);
      setDefaultDepositPercentage(Number(settings.defaultDepositPercentage) || 50);
      setBudgetValidityDays(Number(settings.budgetValidityDays) || 7);
      setMinLeadTimeDays(Number(settings.minLeadTimeDays) || 2);
      setDefaultDailyOrderLimit(Number(settings.defaultDailyOrderLimit) || 5);
      setReceiptThankYouMessage(settings.receiptThankYouMessage || 'Agradecemos a preferência! Feito com carinho para adoçar o seu momento especial.');
      setDietaryWarning(settings.dietaryWarning || 'Atenção alérgicos: nossos produtos podem conter traços de glúten, lactose e oleaginosas.');
      setEnableStockAlerts(settings.enableStockAlerts !== 'false');
      setSoundAlerts(settings.soundAlerts !== 'false');
      setIsLoading(false);
    }
  }, [settings, isLoaded]);

  // Detector de mudanças não salvas (Dirty State)
  const isDirty = useMemo(() => {
    return (
      logo !== (settings.logo || null) ||
      color !== (settings.color || '#db2777') ||
      companyName !== (settings.companyName || 'P.R_Doces') ||
      tagline !== (settings.tagline || 'Confeitaria Artesanal & Ateliê de Doces') ||
      companyPhone !== (settings.companyPhone || '') ||
      companyInstagram !== (settings.companyInstagram || '') ||
      pixKey !== (settings.pixKey || '') ||
      pixReceiverName !== (settings.pixReceiverName || '') ||
      pickupAddress !== (settings.pickupAddress || '') ||
      defaultDeliveryFee !== (Number(settings.defaultDeliveryFee) || 0) ||
      defaultDepositPercentage !== (Number(settings.defaultDepositPercentage) || 50) ||
      budgetValidityDays !== (Number(settings.budgetValidityDays) || 7) ||
      minLeadTimeDays !== (Number(settings.minLeadTimeDays) || 2) ||
      defaultDailyOrderLimit !== (Number(settings.defaultDailyOrderLimit) || 5) ||
      receiptThankYouMessage !== (settings.receiptThankYouMessage || 'Agradecemos a preferência! Feito com carinho para adoçar o seu momento especial.') ||
      dietaryWarning !== (settings.dietaryWarning || 'Atenção alérgicos: nossos produtos podem conter traços de glúten, lactose e oleaginosas.') ||
      enableStockAlerts !== (settings.enableStockAlerts !== 'false') ||
      soundAlerts !== (settings.soundAlerts !== 'false')
    );
  }, [
    logo, color, companyName, tagline, companyPhone, companyInstagram, pixKey, pixReceiverName,
    pickupAddress, defaultDeliveryFee, defaultDepositPercentage, budgetValidityDays, minLeadTimeDays,
    defaultDailyOrderLimit, receiptThankYouMessage, dietaryWarning, enableStockAlerts, soundAlerts, settings
  ]);

  // Atalho de Teclado Ctrl+S / Cmd+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logo, color, companyName, tagline, companyPhone, companyInstagram, pixKey, pixReceiverName, pickupAddress, defaultDeliveryFee, defaultDepositPercentage, budgetValidityDays, minLeadTimeDays, defaultDailyOrderLimit, receiptThankYouMessage, dietaryWarning, enableStockAlerts, soundAlerts]);

  // Upload e Otimização de Logo
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading('Processando e otimizando logo...');
      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.88, mimeType: 'image/png' });
        setLogo(compressedBase64);
        toast.success('Logo carregada com sucesso!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar imagem.', { id: toastId });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Logo removida.');
  };

  // Salvar Todas as Configurações
  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Salvando alterações...');
    try {
      const settingsToSave = [
        { key: 'logo', value: logo },
        { key: 'color', value: color },
        { key: 'companyName', value: companyName },
        { key: 'tagline', value: tagline },
        { key: 'companyPhone', value: companyPhone },
        { key: 'companyInstagram', value: companyInstagram },
        { key: 'pixKey', value: pixKey },
        { key: 'pixReceiverName', value: pixReceiverName },
        { key: 'pickupAddress', value: pickupAddress },
        { key: 'defaultDeliveryFee', value: defaultDeliveryFee.toString() },
        { key: 'defaultDepositPercentage', value: defaultDepositPercentage.toString() },
        { key: 'budgetValidityDays', value: budgetValidityDays.toString() },
        { key: 'minLeadTimeDays', value: minLeadTimeDays.toString() },
        { key: 'defaultDailyOrderLimit', value: defaultDailyOrderLimit.toString() },
        { key: 'receiptThankYouMessage', value: receiptThankYouMessage },
        { key: 'dietaryWarning', value: dietaryWarning },
        { key: 'enableStockAlerts', value: enableStockAlerts ? 'true' : 'false' },
        { key: 'soundAlerts', value: soundAlerts ? 'true' : 'false' },
      ];

      await Promise.all(settingsToSave.map(setting => api.saveSetting(setting)));
      
      window.dispatchEvent(new Event('prdoces_settings_update'));
      await refreshSettings();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success('Todas as configurações foram salvas com sucesso!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Alteração de Senha
  const handleChangePassword = () => {
    const savedPassword = localStorage.getItem('prdoces_password') || 'admin';
    if (currentPasswordInput !== savedPassword) {
      toast.error('Senha atual incorreta!');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação da nova senha não confere!');
      return;
    }
    localStorage.setItem('prdoces_password', newPassword);
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Senha de segurança atualizada com sucesso!');
  };

  // Exportar Backup Completo
  const exportData = async () => {
    const toastId = toast.loading('Gerando arquivo de backup...');
    try {
      const ordersResponse = await api.getOrders({ limit: 9999 });
      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        companyName,
        settings,
        customers: await api.getCustomers(),
        inventory: await api.getInventory(),
        menu: await api.getMenuProducts(),
        orders: ordersResponse.orders,
        dailyLimits: await (api.getDailyLimits ? api.getDailyLimits() : Promise.resolve([])),
        expenses: await (api.getExpenses ? api.getExpenses() : Promise.resolve([])),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado e salvo com sucesso!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar backup completo.', { id: toastId });
    }
  };

  // Importar Backup
  const handleImportData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        setConfirmDialog({
          isOpen: true,
          title: 'Restaurar Base de Dados?',
          desc: 'Atenção: Os dados do arquivo de backup serão mesclados e sincronizados com a base atual. Deseja prosseguir?',
          onConfirm: async () => {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            const toastId = toast.loading('Restaurando e sincronizando dados...');
            try {
              if (data.customers) for (const c of data.customers) await api.saveCustomer(c);
              if (data.inventory) for (const i of data.inventory) await api.saveInventoryItem(i);
              if (data.menu) for (const m of data.menu) await api.saveMenuProduct(m);
              if (data.orders) for (const o of data.orders) await api.saveOrder(o);
              if (data.dailyLimits && api.saveDailyLimit) {
                for (const l of data.dailyLimits) await api.saveDailyLimit(l);
              }
              if (data.expenses && api.saveExpense) {
                for (const exp of data.expenses) await api.saveExpense(exp);
              }
              toast.success('Backup importado com sucesso! Recarregando sistema...', { id: toastId });
              setTimeout(() => window.location.reload(), 1500);
            } catch (err) { 
              console.error(err);
              toast.error('Ocorreu um erro durante a restauração do backup.', { id: toastId }); 
            }
          }
        });
      } catch (err) {
        console.error(err);
        toast.error('Arquivo de backup inválido ou corrompido.');
      }
      if (importFileInputRef.current) importFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Resetar Cache Local
  const handleClearLocalCache = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Cache Temporário?',
      desc: 'Isso limpará preferências de abas e logs temporários do navegador sem apagar os dados do banco de dados.',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        localStorage.removeItem('prdoces_current_tab');
        localStorage.removeItem('prdoces_error_logs');
        toast.success('Cache temporário limpo com sucesso!');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-brand-primary">
        <Loader2 className="animate-spin mb-4" size={36} />
        <p className="text-sm font-bold text-slate-500">Carregando configurações do sistema...</p>
      </div>
    );
  }

  const sections = [
    { id: 'marca' as SettingsSection, label: 'Identidade & Marca', icon: <Palette size={18} /> },
    { id: 'empresa' as SettingsSection, label: 'Dados da Confeitaria & PIX', icon: <Store size={18} /> },
    { id: 'orcamento' as SettingsSection, label: 'Orçamentos & Produção', icon: <MessageSquare size={18} /> },
    { id: 'preferencias' as SettingsSection, label: 'Alertas & Preferências', icon: <BellRing size={18} /> },
    { id: 'seguranca' as SettingsSection, label: 'Segurança & Senha', icon: <ShieldCheck size={18} /> },
    { id: 'backup' as SettingsSection, label: 'Base de Dados & Backup', icon: <Database size={18} /> },
  ];

  return (
    <div className="space-y-8 pb-28 w-full max-w-6xl mx-auto">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Configurações do Ateliê</span>
            {isDirty && (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full animate-pulse border border-amber-200">
                Alterações não salvas
              </span>
            )}
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Personalize a marca, regras de pedidos, meios de pagamento e segurança da sua confeitaria.
          </p>
        </div>

        {/* Botão de Salvar Rápido no Topo */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Navegação por Abas / Seções */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {section.icon}
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* 1. SEÇÃO: IDENTIDADE & MARCA */}
      {activeSection === 'marca' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Coluna Esquerda: Configurações de Logo e Tema */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card Logo */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Logomarca do Ateliê</h3>
                  <p className="text-xs text-slate-500">Exibida no menu, tela de login e recibos dos clientes.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group shrink-0 shadow-inner">
                  {logo ? (
                    <>
                      <img src={logo} alt="Logo Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md hover:scale-105 transition-all"
                        >
                          Trocar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center gap-1.5 p-2 text-center">
                      <ImageIcon size={28} className="opacity-40" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Sem Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1 w-full">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <Upload size={16} /> Enviar Nova Imagem
                    </button>

                    {logo && (
                      <button
                        onClick={handleRemoveLogo}
                        className="flex items-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Formatos aceitos: PNG, JPG ou WebP. Dimensão recomendada de 512x512px (formato 1:1).
                  </p>
                </div>
              </div>
            </div>

            {/* Card Cores & Temas */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl">
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Cor de Destaque</h3>
                  <p className="text-xs text-slate-500">Define o tom principal de botões, destaques e cards.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paleta Recomendada</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_COLORS.map(preset => (
                    <button
                      key={preset.hex}
                      onClick={() => setColor(preset.hex)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-left ${
                        color.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-slate-900 bg-slate-50 shadow-sm ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span 
                        className="w-6 h-6 rounded-xl shrink-0 shadow-xs flex items-center justify-center text-white"
                        style={{ backgroundColor: preset.hex }}
                      >
                        {color.toLowerCase() === preset.hex.toLowerCase() && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Cor Personalizada (HEX)</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-slate-200 shrink-0">
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                        className="absolute -inset-2 w-16 h-16 cursor-pointer" 
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">#</span>
                      <input 
                        type="text"
                        value={color.replace('#', '')}
                        onChange={(e) => setColor(`#${e.target.value.replace('#', '')}`)}
                        className="w-full bg-slate-50 border border-slate-200 pl-8 pr-4 py-2.5 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none uppercase"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Live Preview da Marca */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> Pré-visualização da Marca
                </span>
                <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-mono">Live Preview</span>
              </div>

              {/* Header Preview */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3.5">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={24} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-sm uppercase tracking-tight truncate text-white">{companyName}</h4>
                  <p className="text-xs text-slate-400 truncate">{tagline}</p>
                </div>
              </div>

              {/* Botões Preview com a cor */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amostra de Elementos</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: color }}
                  >
                    <Save size={14} /> Salvar Pedido
                  </button>
                  <button 
                    className="w-full py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5"
                    style={{ borderColor: color, color: color }}
                  >
                    <Download size={14} /> Recibo PNG
                  </button>
                </div>
              </div>

              {/* Card de Informações Rápidas */}
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/40 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">WhatsApp:</span>
                  <span className="font-medium">{companyPhone || 'Não configurado'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Instagram:</span>
                  <span className="font-medium">{companyInstagram || 'Não configurado'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chave PIX:</span>
                  <span className="font-medium font-mono truncate max-w-[150px]">{pixKey || 'Não configurada'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. SEÇÃO: DADOS DA CONFEITARIA & PIX */}
      {activeSection === 'empresa' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Store size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Informações Comerciais & Pagamentos</h3>
              <p className="text-xs text-slate-500">Dados exibidos nos orçamentos, catálogo e instruções de pagamento.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome da Confeitaria / Ateliê</label>
              <input 
                type="text" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                placeholder="Ex: P.R_Doces" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Slogan ou Subtítulo</label>
              <input 
                type="text" 
                value={tagline} 
                onChange={e => setTagline(e.target.value)} 
                placeholder="Ex: Confeitaria Artesanal & Bolos Decorados" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">WhatsApp Comercial</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={companyPhone} 
                  onChange={e => setCompanyPhone(e.target.value)} 
                  placeholder="(00) 00000-0000" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Instagram (@)</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={companyInstagram} 
                  onChange={e => setCompanyInstagram(e.target.value)} 
                  placeholder="@pr_doces" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Chave PIX para Depósito</label>
              <div className="relative">
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={pixKey} 
                  onChange={e => setPixKey(e.target.value)} 
                  placeholder="E-mail, CPF, Celular ou Chave Aleatória" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome do Titular da Conta PIX</label>
              <input 
                type="text" 
                value={pixReceiverName} 
                onChange={e => setPixReceiverName(e.target.value)} 
                placeholder="Nome completo exibido no comprovante" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Endereço / Ponto de Retirada</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={pickupAddress} 
                  onChange={e => setPickupAddress(e.target.value)} 
                  placeholder="Rua, Número, Bairro, Cidade - Ponto de referência" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Utilizado na geração automática de instruções quando a entrega for do tipo "Retirada".
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. SEÇÃO: ORÇAMENTOS & PRODUÇÃO */}
      {activeSection === 'orcamento' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Regras de Pedidos & Orçamentos</h3>
              <p className="text-xs text-slate-500">Valores padrão, porcentagens de sinal e limites diários.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sinal Padrão de Entrada (%)</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={defaultDepositPercentage} 
                  onChange={e => setDefaultDepositPercentage(Number(e.target.value))} 
                  placeholder="50" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Porcentagem padrão cobrada para confirmação da encomenda.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Taxa de Entrega Inicial (R$)</label>
              <div className="relative">
                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  step="0.50" 
                  min="0" 
                  value={defaultDeliveryFee === 0 ? '' : defaultDeliveryFee} 
                  onChange={e => setDefaultDeliveryFee(Number(e.target.value))} 
                  placeholder="0.00" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Valor inicial sugerido em orçamentos com entrega Uber/Motoboy.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Validade do Orçamento (Dias)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  min="1" 
                  value={budgetValidityDays} 
                  onChange={e => setBudgetValidityDays(Number(e.target.value))} 
                  placeholder="7" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Período que os preços e a data ficam pré-reservados.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Antecedência Mínima (Dias)</label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  min="0" 
                  value={minLeadTimeDays} 
                  onChange={e => setMinLeadTimeDays(Number(e.target.value))} 
                  placeholder="2" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Prazo de segurança para compras e preparo de massas/recheios.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Limite Padrão de Encomendas/Dia</label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  min="1" 
                  value={defaultDailyOrderLimit} 
                  onChange={e => setDefaultDailyOrderLimit(Number(e.target.value))} 
                  placeholder="5" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Capacidade diária utilizada quando uma data não tiver limite customizado no calendário.</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mensagem de Agradecimento (Rodapé do Recibo)</label>
              <textarea 
                value={receiptThankYouMessage} 
                onChange={e => setReceiptThankYouMessage(e.target.value)} 
                rows={2} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" 
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Aviso Padrão de Restrições Alimentares / Alergias</label>
              <textarea 
                value={dietaryWarning} 
                onChange={e => setDietaryWarning(e.target.value)} 
                rows={2} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" 
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. SEÇÃO: ALERTAS & PREFERÊNCIAS */}
      {activeSection === 'preferencias' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <BellRing size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Alertas & Notificações</h3>
              <p className="text-xs text-slate-500">Configure avisos automáticos e comportamento do painel.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle Alerta de Estoque */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 block">Alertas de Estoque Baixo</span>
                <span className="text-xs text-slate-500">Destaca ingredientes e insumos que atingiram a quantidade mínima.</span>
              </div>
              <button
                onClick={() => setEnableStockAlerts(!enableStockAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableStockAlerts ? 'bg-brand-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableStockAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Toggle Alerta Sonoro */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  {soundAlerts ? <Volume2 size={16} className="text-brand-primary" /> : <VolumeX size={16} className="text-slate-400" />}
                  Notificações com Som
                </span>
                <span className="text-xs text-slate-500">Toca um bipe suave ao salvar ou alterar o status de um pedido.</span>
              </div>
              <button
                onClick={() => setSoundAlerts(!soundAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundAlerts ? 'bg-brand-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. SEÇÃO: SEGURANÇA & SENHA */}
      {activeSection === 'seguranca' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Segurança & Controle de Acesso</h3>
              <p className="text-xs text-slate-500">Altere a senha mestre de acesso ao sistema do ateliê.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Senha Atual</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={currentPasswordInput} 
                  onChange={e => setCurrentPasswordInput(e.target.value)} 
                  placeholder="Digite sua senha atual" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-10 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nova Senha</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Mínimo 4 caracteres" 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Confirmar Nova Senha</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Repita a nova senha" 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20" 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleChangePassword} 
              disabled={!currentPasswordInput || !newPassword || !confirmPassword} 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Atualizar Senha
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Console de Auditoria & Logs</h4>
              <p className="text-xs text-slate-500">Histórico de acessos, bloqueios de segurança e eventos do sistema.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/admin'} 
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              <Terminal size={16} /> Abrir Painel de Logs
            </button>
          </div>
        </motion.div>
      )}

      {/* 6. SEÇÃO: BASE DE DADOS & BACKUP */}
      {activeSection === 'backup' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Card de Estatísticas do Banco */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clientes</span>
              <p className="text-2xl font-black text-slate-900">{customers.length}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cardápio</span>
              <p className="text-2xl font-black text-slate-900">{menuProducts.length}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itens Estoque</span>
              <p className="text-2xl font-black text-slate-900">{inventory.length}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Despesas Fixas</span>
              <p className="text-2xl font-black text-slate-900">{expenses.length}</p>
            </div>
          </div>

          {/* Card Exportação / Importação */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Gerenciador de Backups</h3>
                <p className="text-xs text-slate-500">Exporte os dados completos do ateliê para manter cópias seguras no seu computador.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={exportData} 
                className="flex items-center gap-4 p-5 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-md transition-all text-left group"
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                  <Download size={24} />
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-900 group-hover:text-blue-600">Exportar Backup Completo</span>
                  <span className="text-xs text-slate-500">Gera arquivo JSON com todos os pedidos, clientes e receitas</span>
                </div>
              </button>

              <button 
                onClick={() => importFileInputRef.current?.click()} 
                className="flex items-center gap-4 p-5 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/70 hover:shadow-md transition-all text-left group"
              >
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-900 group-hover:text-emerald-600">Restaurar de Backup</span>
                  <span className="text-xs text-slate-500">Importa e sincroniza registros a partir de um arquivo JSON</span>
                </div>
              </button>
            </div>

            <input type="file" ref={importFileInputRef} className="hidden" accept=".json" onChange={handleImportData} />

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700">Limpeza de Cache Temporário</h4>
                <p className="text-[11px] text-slate-400">Libera memória local sem apagar nenhum dado do banco de dados.</p>
              </div>
              <button
                onClick={handleClearLocalCache}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <RefreshCw size={14} /> Limpar Cache
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* BARRA FLUTUANTE INFERIOR DE SALVAMENTO */}
      <div className="fixed bottom-4 left-4 right-4 lg:left-[300px] lg:right-8 z-30">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-emerald-400 font-bold text-sm"
                >
                  <CheckCircle2 size={18} /> Configurações atualizadas com sucesso!
                </motion.div>
              ) : isDirty ? (
                <motion.div 
                  key="dirty"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Você possui alterações não salvas (Pressione Ctrl+S para salvar).
                </motion.div>
              ) : (
                <motion.div 
                  key="saved"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium"
                >
                  <FileCheck size={16} className="text-emerald-500" />
                  Todas as configurações estão sincronizadas com o banco.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary hover:bg-pink-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.desc}
        confirmText="Sim, Continuar"
      />
    </div>
  );
}