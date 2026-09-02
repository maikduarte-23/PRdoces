/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent, MouseEvent, useMemo } from 'react';
import { 
  Tag, 
  Download, 
  Layout, 
  Palette, 
  ChefHat, 
  MessageCircle, 
  Loader2, 
  X, 
  Upload, 
  Instagram, 
  Phone, 
  Smartphone, 
  Square, 
  FileText,
  Copy,
  Check,
  Search,
  Sparkles,
  Share2,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage, CatalogBg } from '../services/storage';
import { api } from '../services/api';
import { MenuProduct } from '../types';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageCompressor';

const DEFAULT_BG: CatalogBg = { 
  id: 'clean', 
  label: 'Padrão Rosa', 
  url: null, 
  gradient: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)' 
};

interface ThemePreset {
  id: string;
  name: string;
  accent: string;
  gradient: string;
  icon: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'rose_gold',
    name: 'Rosa Luxo',
    accent: '#db2777',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)',
    icon: '🌸'
  },
  {
    id: 'gourmet_choco',
    name: 'Chocolate Gourmet',
    accent: '#78350f',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    icon: '🍫'
  },
  {
    id: 'clean_minimal',
    name: 'Minimalista Clean',
    accent: '#0f172a',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
    icon: '✨'
  },
  {
    id: 'botanical_sage',
    name: 'Confeitaria Artesanal',
    accent: '#15803d',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)',
    icon: '🌿'
  },
  {
    id: 'sweet_lavender',
    name: 'Lavanda Doce',
    accent: '#7c3aed',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #f3e8ff 100%)',
    icon: '💜'
  }
];

const generateId = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

export default function CatalogModule() {
  const catalogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customBgs, setCustomBgs] = useState<CatalogBg[]>([]);
  const [selectedBg, setSelectedBg] = useState<CatalogBg>(DEFAULT_BG);
  const [accentColor, setAccentColor] = useState('#db2777');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState('Nossos Doces');
  const [subtitle, setSubtitle] = useState('P.R_Doces Confeitaria Artesanal');
  const [instagram, setInstagram] = useState('@pr_doces');
  const [phone, setPhone] = useState('(62) 9 9999-9999');
  const [isLoading, setIsLoading] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [hiddenProducts, setHiddenProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('prdoces_catalog_mapping') || '{}');
    } catch { return {}; }
  });
  const [catalogFormat, setCatalogFormat] = useState<'stories' | 'feed_portrait' | 'feed_square' | 'a4'>('stories');

  const FORMATS = {
    stories: { label: 'Stories (9:16)', ratio: '9/16', icon: <Smartphone size={14}/> },
    feed_portrait: { label: 'Feed (4:5)', ratio: '4/5', icon: <Layout size={14}/> },
    feed_square: { label: 'Feed Quadrado', ratio: '1/1', icon: <Square size={14}/> },
    a4: { label: 'Folha A4', ratio: '1/1.4141', icon: <FileText size={14}/> },
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const [data, settings] = await Promise.all([api.getMenuProducts(), api.getSettings()]);
        setProducts(data);
        if (settings.color) setAccentColor(settings.color);
        if (settings.logo) setCustomLogo(settings.logo);
        if (settings.companyName) setSubtitle(`${settings.companyName} Confeitaria Artesanal`);
        if (settings.companyInstagram) setInstagram(settings.companyInstagram);
        if (settings.companyPhone) setPhone(settings.companyPhone);
      } catch {
        toast.error('Erro ao carregar dados do catálogo.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
    setCustomBgs(storage.getCatalogBgs());
  }, []);

  useEffect(() => {
    localStorage.setItem('prdoces_catalog_mapping', JSON.stringify(categoryMapping));
  }, [categoryMapping]);

  const applyThemePreset = (preset: ThemePreset) => {
    setAccentColor(preset.accent);
    setSelectedBg({
      id: preset.id,
      label: preset.name,
      url: null,
      gradient: preset.gradient
    });
    toast.success(`Tema "${preset.name}" aplicado!`, { icon: preset.icon });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading('Otimizando imagem de fundo...');
      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.85 });
        const newBg: CatalogBg = {
          id: generateId(),
          label: 'Upload Personalizado',
          url: compressedBase64,
          gradient: ''
        };
        storage.saveCatalogBg(newBg);
        setCustomBgs(storage.getCatalogBgs());
        setSelectedBg(newBg);
        toast.success('Fundo salvo com sucesso!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Não foi possível salvar a imagem.', { id: toastId });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteBg = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    storage.deleteCatalogBg(id);
    const updated = storage.getCatalogBgs();
    setCustomBgs(updated);
    if (selectedBg.id === id) {
      setSelectedBg(DEFAULT_BG);
    }
  };

  const handleDownload = async () => {
    if (!catalogRef.current) return;
    
    try {
      setIsDownloading(true);
      
      const catalogEl = catalogRef.current;
      const listEl = catalogEl.querySelector('#catalog-list') as HTMLElement;
      
      const originalScrollY = window.scrollY;
      const origAspect = catalogEl.style.aspectRatio;
      const origHeight = catalogEl.style.height;
      const origOverflow = listEl ? listEl.style.overflow : '';
      const origListHeight = listEl ? listEl.style.height : '';
      const origFlex = listEl ? listEl.style.flex : '';

      window.scrollTo(0, 0);
      catalogEl.style.aspectRatio = 'auto';
      catalogEl.style.height = 'max-content';
      if (listEl) {
        listEl.style.overflow = 'visible';
        listEl.style.height = 'max-content';
        listEl.style.flex = 'none';
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(catalogEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        imageTimeout: 20000,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style.backdropFilter || (typeof el.className === 'string' && el.className.includes('backdrop-blur'))) {
              el.style.backdropFilter = 'none';
              if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba')) {
                el.style.backgroundColor = el.style.backgroundColor.replace(/0\.[0-9]+\)$/, '0.95)');
              }
            }
            const style = window.getComputedStyle(el);
            const propsToFix = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'boxShadow', 'stroke', 'fill'];
            propsToFix.forEach(prop => {
              if (style[prop as any] && style[prop as any].includes('oklch')) {
                let fallback = '#000000';
                if (prop.includes('background')) fallback = '#ffffff';
                else if (prop.includes('border')) fallback = '#f1f5f9';
                else if (prop.includes('Shadow')) fallback = 'none';
                (el.style as any)[prop] = fallback;
              }
            });
          }
        }
      });
      
      catalogEl.style.aspectRatio = origAspect;
      catalogEl.style.height = origHeight;
      if (listEl) {
        listEl.style.overflow = origOverflow;
        listEl.style.height = origListHeight;
        listEl.style.flex = origFlex;
      }
      window.scrollTo(0, originalScrollY);

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `catalogo-pr-doces-${Date.now()}.png`;
      link.href = image;
      link.click();
      toast.success('Catálogo baixado em alta resolução!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem do catálogo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const visibleProducts = useMemo(() => {
    return sortedProducts.filter(p => !hiddenProducts.includes(p.id));
  }, [sortedProducts, hiddenProducts]);

  // Agrupamento Inteligente com Fallback da Categoria do Banco
  const groupedProducts = useMemo(() => {
    const groups: Record<string, MenuProduct[]> = {};
    const ungrouped: MenuProduct[] = [];

    visibleProducts.forEach(p => {
      // Prioridade: Mapeamento customizado local -> Categoria salva no produto -> Sem categoria
      const cat = (categoryMapping[p.id] || p.category || '').trim();
      if (cat) {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
      } else {
        ungrouped.push(p);
      }
    });
    return { groups, ungrouped };
  }, [visibleProducts, categoryMapping]);

  // Gerador de Texto Formatado para WhatsApp
  const handleCopyWhatsappText = () => {
    let text = `🍰 *${subtitle}*\n✨ *${title}*\n\n`;

    Object.keys(groupedProducts.groups).sort().forEach(category => {
      text += `*─── ${category.toUpperCase()} ───*\n`;
      groupedProducts.groups[category].forEach(item => {
        const priceStr = showPrices ? ` - R$ ${item.price.toFixed(2)} ${item.isByHundred ? 'o cento' : 'un'}` : '';
        const minStr = item.minQty > 1 ? ` _(mín. ${item.minQty} un)_` : '';
        text += `• *${item.label}*${priceStr}${minStr}\n`;
      });
      text += `\n`;
    });

    if (groupedProducts.ungrouped.length > 0) {
      if (Object.keys(groupedProducts.groups).length > 0) {
        text += `*─── OUTROS DOCES ───*\n`;
      }
      groupedProducts.ungrouped.forEach(item => {
        const priceStr = showPrices ? ` - R$ ${item.price.toFixed(2)} ${item.isByHundred ? 'o cento' : 'un'}` : '';
        const minStr = item.minQty > 1 ? ` _(mín. ${item.minQty} un)_` : '';
        text += `• *${item.label}*${priceStr}${minStr}\n`;
      });
      text += `\n`;
    }

    text += `📲 *Faça sua encomenda:* ${phone}\n`;
    if (instagram) text += `📸 *Siga nosso Instagram:* ${instagram}\n`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    toast.success('Cardápio copiado para o WhatsApp!');
    setTimeout(() => setCopiedWhatsapp(false), 3000);
  };

  const handleSelectAll = () => setHiddenProducts([]);
  const handleDeselectAll = () => setHiddenProducts(sortedProducts.map(p => p.id));

  const filteredProductsForEditor = useMemo(() => {
    if (!productSearch) return sortedProducts;
    return sortedProducts.filter(p => p.label.toLowerCase().includes(productSearch.toLowerCase()));
  }, [sortedProducts, productSearch]);

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Header do Módulo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Marketing & Vendas
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo Digital</h2>
          <p className="text-slate-500 text-sm font-medium">
            Gere imagens de alta definição para o Instagram e compartilhe o cardápio formatado no WhatsApp.
          </p>
        </div>

        {/* Botões de Ações Principais */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Botão Copiar WhatsApp */}
          <button
            onClick={handleCopyWhatsappText}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border shadow-xs ${
              copiedWhatsapp 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Copiar texto pronto para o WhatsApp"
          >
            {copiedWhatsapp ? <CheckCheck size={16} /> : <Share2 size={16} />}
            <span>{copiedWhatsapp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
          </button>

          {/* Botão Personalizar */}
          <button 
            onClick={() => setShowEditor(!showEditor)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border shadow-xs ${
              showEditor 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Palette size={16} />
            <span>{showEditor ? 'Fechar Editor' : 'Personalizar'}</span>
          </button>
          
          {/* Botão Baixar Imagem HD */}
          <button 
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-primary hover:brightness-110 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Gerando HD...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Baixar Imagem</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-brand-primary">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Carregando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Lado Esquerdo: Área de Preview do Catálogo */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <div className="sticky top-6 space-y-4">
              {/* Barra de Formatos e Proporções */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 overflow-x-auto">
                {(Object.keys(FORMATS) as Array<keyof typeof FORMATS>).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCatalogFormat(fmt)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      catalogFormat === fmt 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {FORMATS[fmt].icon}
                    <span>{FORMATS[fmt].label}</span>
                  </button>
                ))}
              </div>

              {/* Moldura do Catálogo (Elemento Capturado pelo html2canvas) */}
              <div 
                ref={catalogRef}
                id="catalog-container"
                className={`mx-auto bg-white rounded-[2.5rem] relative overflow-hidden flex flex-col border-[10px] sm:border-[14px] border-white shadow-2xl transition-all duration-300 ${
                  catalogFormat === 'feed_square' ? 'max-w-lg' : 'max-w-md'
                }`}
                style={{ aspectRatio: FORMATS[catalogFormat].ratio }}
              >
                {/* Camada de Fundo */}
                <div 
                  id="catalog-img"
                  className="absolute inset-0 transition-all duration-700"
                  style={{ 
                    backgroundColor: selectedBg.url ? 'transparent' : (selectedBg.gradient ? undefined : '#ffffff'),
                    backgroundImage: selectedBg.url ? `url(${selectedBg.url})` : (selectedBg.gradient || undefined),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {selectedBg.url && (
                    <div className="absolute inset-0 backdrop-blur-[6px] bg-white/85 transition-all duration-500" />
                  )}
                </div>

                {/* Cabeçalho do Catálogo */}
                <div className="h-44 relative flex flex-col items-center justify-center px-6 text-center pt-6 shrink-0 z-10">
                   {customLogo ? (
                     <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border-4 border-white bg-white shrink-0">
                       <img src={customLogo} alt="Logo" className="w-full h-full object-contain" />
                     </div>
                   ) : (
                     <div 
                       className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl rotate-6 flex items-center justify-center mb-3 shrink-0 shadow-md"
                       style={{ backgroundColor: accentColor }}
                     >
                       <ChefHat className="text-white" size={28} />
                     </div>
                   )}
                   <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight" style={{ color: accentColor }}>
                     {title}
                   </h1>
                   <p className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 mt-1">
                     {subtitle}
                   </p>
                </div>

                {/* Lista de Itens do Catálogo */}
                <div id="catalog-list" className="flex-1 relative px-6 sm:px-8 py-3 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-hide z-10">
                   {Object.keys(groupedProducts.groups).sort().map((category) => (
                     <div key={category} className="space-y-2.5">
                       <div className="flex items-center gap-2.5 ml-1">
                         <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
                           {category}
                         </h3>
                         <div className="flex-1 h-[1.5px] rounded-full" style={{ backgroundColor: `${accentColor}30` }} />
                       </div>
                       <div className="space-y-2">
                         {groupedProducts.groups[category].sort((a, b) => a.label.localeCompare(b.label)).map((p, idx) => (
                           <div 
                             key={p.id || idx} 
                             className="flex justify-between items-center bg-white/90 border border-slate-100/90 p-3 sm:p-3.5 rounded-2xl shadow-xs"
                           >
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                                  <Tag size={15} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{p.label}</h4>
                                  {p.minQty > 1 && (
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Mín: {p.minQty} un</p>
                                  )}
                                </div>
                             </div>
                             {showPrices && (
                               <div className="text-right shrink-0 pl-2">
                                  <p className="font-black text-sm sm:text-base text-slate-900 font-mono leading-none">R$ {Number(p.price).toFixed(2)}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{p.isByHundred ? 'cento' : 'unidade'}</p>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}

                   {/* Itens Sem Categoria */}
                   {groupedProducts.ungrouped.length > 0 && (
                     <div className="space-y-2.5">
                       {Object.keys(groupedProducts.groups).length > 0 && (
                         <div className="flex items-center gap-2.5 ml-1">
                           <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>Outros Doces</h3>
                           <div className="flex-1 h-[1.5px] rounded-full" style={{ backgroundColor: `${accentColor}30` }} />
                         </div>
                       )}
                       <div className="space-y-2">
                         {groupedProducts.ungrouped.sort((a, b) => a.label.localeCompare(b.label)).map((p, idx) => (
                           <div 
                             key={p.id || idx} 
                             className="flex justify-between items-center bg-white/90 border border-slate-100/90 p-3 sm:p-3.5 rounded-2xl shadow-xs"
                           >
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                                  <Tag size={15} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{p.label}</h4>
                                  {p.minQty > 1 && (
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Mín: {p.minQty} un</p>
                                  )}
                                </div>
                             </div>
                             {showPrices && (
                               <div className="text-right shrink-0 pl-2">
                                  <p className="font-black text-sm sm:text-base text-slate-900 font-mono leading-none">R$ {Number(p.price).toFixed(2)}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{p.isByHundred ? 'cento' : 'unidade'}</p>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>

                {/* Rodapé do Catálogo */}
                <div className="p-6 text-center relative z-10 shrink-0">
                   <div className="flex flex-wrap justify-center items-center gap-4 mb-2">
                      {instagram && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <Instagram size={13} className="text-brand-primary" /> {instagram}
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <Phone size={13} className="text-emerald-600" /> {phone}
                        </div>
                      )}
                   </div>
                   <div className="h-1 w-20 bg-slate-200/80 mx-auto rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Barra Lateral de Personalização e Filtros */}
          <div className={`lg:col-span-4 space-y-6 order-1 lg:order-2 ${showEditor ? 'block' : 'hidden lg:block'}`}>
             <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-pink-50 text-brand-primary rounded-xl">
                      <Palette size={18} />
                    </div>
                    <h3 className="font-black text-slate-900 text-base">Personalização</h3>
                  </div>
                </div>

                {/* 1. Temas Prontos em 1 Clique */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                    Temas Prontos (1 Clique)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyThemePreset(preset)}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                          selectedBg.id === preset.id
                            ? 'border-brand-primary ring-2 ring-brand-primary/20 bg-pink-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="text-base">{preset.icon}</span>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
                            {preset.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono uppercase">
                            {preset.accent}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Textos do Topo */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                     Títulos do Cabeçalho
                   </label>
                   <div>
                     <span className="text-[10px] font-bold text-slate-500 mb-1 block">Título Principal</span>
                     <input 
                       type="text" 
                       value={title} 
                       onChange={(e) => setTitle(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-pink-500/20 outline-none" 
                     />
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-slate-500 mb-1 block">Subtítulo / Nome da Marca</span>
                     <input 
                       type="text" 
                       value={subtitle} 
                       onChange={(e) => setSubtitle(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-pink-500/20 outline-none" 
                     />
                   </div>
                </div>

                {/* 3. Cor de Destaque Customizada */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Cor dos Detalhes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['#db2777', '#78350f', '#0f172a', '#15803d', '#7c3aed', '#2563eb', '#dc2626'].map(color => (
                       <button 
                         key={color}
                         onClick={() => setAccentColor(color)}
                         className={`w-8 h-8 rounded-xl transition-transform ${accentColor === color ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'}`}
                         style={{ backgroundColor: color }}
                       />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input 
                      type="color" 
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" 
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase flex-1">{accentColor}</span>
                  </div>
                </div>

                {/* 4. Fundo Personalizado / Upload */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                       Fundo Personalizado
                     </label>
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="text-[10px] font-bold text-brand-primary uppercase flex items-center gap-1 hover:underline"
                     >
                       <Upload size={12} /> Upload Foto
                     </button>
                   </div>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleFileUpload} 
                   />
                   {customBgs.length > 0 && (
                     <div className="grid grid-cols-2 gap-2">
                       {customBgs.map(bg => (
                         <div
                           key={bg.id}
                           onClick={() => setSelectedBg(bg)}
                           className={`cursor-pointer relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                             selectedBg.id === bg.id ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-sm' : 'border-transparent hover:border-slate-300'
                           }`}
                         >
                           {bg.url && <img src={bg.url} className="w-full h-full object-cover" alt="Custom" />}
                           <button 
                             onClick={(e) => handleDeleteBg(bg.id, e)}
                             className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-md transition-all"
                             title="Excluir fundo"
                           >
                             <X size={10} />
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>

                {/* 5. Dados de Contato */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                     Contatos no Rodapé
                   </label>
                   <div className="relative">
                     <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input 
                       type="text" 
                       value={instagram} 
                       onChange={(e) => setInstagram(e.target.value)}
                       placeholder="@seu.instagram"
                       className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-pink-500/20 outline-none" 
                     />
                   </div>
                   <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input 
                       type="text" 
                       value={phone} 
                       onChange={(e) => setPhone(e.target.value)}
                       placeholder="(00) 00000-0000"
                       className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-pink-500/20 outline-none" 
                     />
                   </div>
                </div>

                {/* 6. Seleção e Categorias de Produtos */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                       Itens do Catálogo ({visibleProducts.length}/{sortedProducts.length})
                     </label>
                     <div className="flex gap-2">
                       <button 
                         onClick={handleSelectAll} 
                         className="text-[10px] font-bold text-brand-primary hover:underline"
                       >
                         Todos
                       </button>
                       <span className="text-slate-300">•</span>
                       <button 
                         onClick={handleDeselectAll} 
                         className="text-[10px] font-bold text-slate-400 hover:underline"
                       >
                         Nenhum
                       </button>
                     </div>
                   </div>

                   {/* Toggle de Preços */}
                   <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                     <input 
                       type="checkbox" 
                       checked={showPrices} 
                       onChange={e => setShowPrices(e.target.checked)} 
                       className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary" 
                     />
                     <span className="text-xs font-bold text-slate-700">Exibir Preços em Reais (R$)</span>
                   </label>

                   {/* Busca de Produtos */}
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input 
                       type="text" 
                       placeholder="Filtrar doces..."
                       value={productSearch}
                       onChange={e => setProductSearch(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500/20"
                     />
                   </div>
                   
                   {/* Lista de Produtos com Categoria */}
                   <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2 max-h-64 overflow-y-auto">
                     {filteredProductsForEditor.map(p => (
                       <div key={p.id} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                         <label className="flex items-center justify-between cursor-pointer">
                           <span className={`text-xs font-bold truncate pr-2 ${
                             hiddenProducts.includes(p.id) ? 'text-slate-400 line-through' : 'text-slate-800'
                           }`}>
                             {p.label}
                           </span>
                           <input 
                             type="checkbox" 
                             checked={!hiddenProducts.includes(p.id)}
                             onChange={(e) => {
                               if (e.target.checked) setHiddenProducts(prev => prev.filter(id => id !== p.id));
                               else setHiddenProducts(prev => [...prev, p.id]);
                             }}
                             className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                           />
                         </label>
                         {!hiddenProducts.includes(p.id) && (
                           <input 
                             type="text"
                             placeholder={`Categoria: ${p.category || 'Geral'}`}
                             value={categoryMapping[p.id] || ''}
                             onChange={(e) => setCategoryMapping(prev => ({ ...prev, [p.id]: e.target.value }))}
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-primary"
                           />
                         )}
                       </div>
                     ))}
                   </div>
                </div>
             </section>
          </div>
        </div>
      )}
    </div>
  );
}
