import { useState, useEffect, useRef, ChangeEvent, MouseEvent, useMemo } from 'react';
import { 
  Tag, 
  Download, 
  Camera, 
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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage, CatalogBg } from '../services/storage';
import { api } from '../services/api';
import { MenuProduct } from '../types';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageCompressor';

const DEFAULT_BG: CatalogBg = { id: 'clean', label: 'Padrão', url: null, gradient: 'linear-gradient(to bottom right, #ffffff, #fdf2f8)' };

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
      } catch (err) {
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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading('Otimizando imagem...');
      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
        const newBg: CatalogBg = {
          id: generateId(),
          label: 'Upload',
          url: compressedBase64,
          gradient: ''
        };
        storage.saveCatalogBg(newBg);
        setCustomBgs(storage.getCatalogBgs());
        setSelectedBg(newBg);
        toast.success('Fundo adicionado e otimizado!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Não foi possível salvar o fundo. Tente outra imagem.', { id: toastId });
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
      
      // 1. Salva a posição do scroll e os estilos originais
      const originalScrollY = window.scrollY;
      const origAspect = catalogEl.style.aspectRatio;
      const origHeight = catalogEl.style.height;
      const origOverflow = listEl ? listEl.style.overflow : '';
      const origListHeight = listEl ? listEl.style.height : '';
      const origFlex = listEl ? listEl.style.flex : '';

      // 2. Rola para o topo e expande o DOM real temporariamente
      window.scrollTo(0, 0);
      catalogEl.style.aspectRatio = 'auto';
      catalogEl.style.height = 'max-content';
      if (listEl) {
        listEl.style.overflow = 'visible';
        listEl.style.height = 'max-content';
        listEl.style.flex = 'none';
      }

      // 3. Aguarda o navegador renderizar a tela expandida
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. Tira a foto exata do container expandido
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
            // Remove backdrop-blur (it's very slow and often crashes html2canvas)
            if (el.style.backdropFilter || (typeof el.className === 'string' && el.className.includes('backdrop-blur'))) {
              el.style.backdropFilter = 'none';
              // Fallback to solid background if blurred area was intended to be transparent
              if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba')) {
                el.style.backgroundColor = el.style.backgroundColor.replace(/0\.[0-9]+\)$/, '0.95)');
              }
            }
            // Ensure no oklch leaks from external stylesheets during clone
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
      
      // 5. Restaura o catálogo para o tamanho normal com barra de rolagem
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
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Ocorreu um erro ao gerar a imagem. Tente novamente.');
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

  const groupedProducts = useMemo(() => {
    const groups: Record<string, MenuProduct[]> = {};
    const ungrouped: MenuProduct[] = [];

    visibleProducts.forEach(p => {
      const cat = categoryMapping[p.id]?.trim();
      if (cat) {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
      } else {
        ungrouped.push(p);
      }
    });
    return { groups, ungrouped };
  }, [visibleProducts, categoryMapping]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo Digital</h2>
          <p className="text-slate-500">Transforme seu cardápio em imagens lindas para o Instagram e WhatsApp</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEditor(!showEditor)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border ${
              showEditor 
                ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Palette size={16} />
            {showEditor ? 'Fechar Editor' : 'Personalizar'}
          </motion.button>
          
          <motion.button 
            whileHover={!isDownloading ? { scale: 1.02, translateY: -2 } : {}}
            whileTap={!isDownloading ? { scale: 0.98 } : {}}
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-pink-600 text-white px-4 sm:px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-600/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {isDownloading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="animate-spin" size={16} />
                  <span>Gerando HD...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>Baixar Catálogo</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-pink-600">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Carregando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preview Area */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          <div className="sticky top-8">
            <div 
              ref={catalogRef}
              id="catalog-container"
              className={`mx-auto bg-white rounded-[2.5rem] relative overflow-hidden flex flex-col border-[12px] border-white transition-all duration-300 ${catalogFormat === 'feed_square' ? 'max-w-lg' : 'max-w-md'}`}
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', aspectRatio: FORMATS[catalogFormat].ratio }}
            >
              {/* Background Layer */}
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

              {/* Header Decoration */}
              <div className="h-40 relative flex flex-col items-center justify-center px-8 text-center pt-8">
                 {customLogo ? (
                   <div className="w-20 h-20 mb-4 rounded-[1.5rem] overflow-hidden shadow-lg border-4 border-white bg-white z-10 shrink-0">
                     <img src={customLogo} alt="Logo" className="w-full h-full object-contain" />
                   </div>
                 ) : (
                   <div 
                     className="w-16 h-16 rounded-3xl rotate-12 flex items-center justify-center mb-4 shrink-0"
                     style={{ backgroundColor: accentColor, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                   >
                     <ChefHat style={{ color: '#ffffff' }} size={32} />
                   </div>
                 )}
                 <h1 className="text-3xl font-black text-[#0f172a] leading-tight tracking-tighter" style={{ color: accentColor }}>
                   {title}
                 </h1>
                 <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[#94a3b8] mt-2">
                   {subtitle}
                 </p>
              </div>

              {/* Items List */}
              <div id="catalog-list" className="flex-1 relative px-8 py-4 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
                 {Object.keys(groupedProducts.groups).sort().map((category) => (
                   <div key={category} className="space-y-3">
                     <div className="flex items-center gap-3 ml-2">
                       <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: accentColor }}>{category}</h3>
                       <div className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: `${accentColor}30` }} />
                     </div>
                     <div className="space-y-3">
                       {groupedProducts.groups[category].sort((a, b) => a.label.localeCompare(b.label)).map((p, idx) => (
                         <motion.div 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           key={p.id} 
                           className="flex justify-between items-center bg-white border border-[#f1f5f9] p-4 rounded-3xl"
                           style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                         >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                <Tag size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-[#0f172a] text-sm">{p.label}</h4>
                                <p className="text-[9px] text-[#64748b] font-bold uppercase">Mín: {p.minQty} un</p>
                              </div>
                           </div>
                           {showPrices && (
                             <div className="text-right">
                                <p className="font-black text-lg text-[#0f172a] tracking-tight">R$ {p.price.toFixed(2)}</p>
                                <p className="text-[9px] text-[#94a3b8] font-bold uppercase">{p.isByHundred ? 'por cento' : 'unidade'}</p>
                             </div>
                           )}
                         </motion.div>
                       ))}
                     </div>
                   </div>
                 ))}

                 {/* Outros / Sem Categoria */}
                 {groupedProducts.ungrouped.length > 0 && (
                   <div className="space-y-3">
                     {Object.keys(groupedProducts.groups).length > 0 && (
                       <div className="flex items-center gap-3 ml-2">
                         <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: accentColor }}>Outros</h3>
                         <div className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: `${accentColor}30` }} />
                       </div>
                     )}
                     <div className="space-y-3">
                       {groupedProducts.ungrouped.sort((a, b) => a.label.localeCompare(b.label)).map((p, idx) => (
                         <motion.div 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           key={p.id} 
                           className="flex justify-between items-center bg-white border border-[#f1f5f9] p-4 rounded-3xl"
                           style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                         >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                <Tag size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-[#0f172a] text-sm">{p.label}</h4>
                                <p className="text-[9px] text-[#64748b] font-bold uppercase">Mín: {p.minQty} un</p>
                              </div>
                           </div>
                           {showPrices && (
                             <div className="text-right">
                                <p className="font-black text-lg text-[#0f172a] tracking-tight">R$ {p.price.toFixed(2)}</p>
                                <p className="text-[9px] text-[#94a3b8] font-bold uppercase">{p.isByHundred ? 'por cento' : 'unidade'}</p>
                             </div>
                           )}
                         </motion.div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              {/* Footer */}
              <div className="p-8 text-center relative">
                 <div className="flex justify-center gap-4 mb-4">
                    <a 
                      href={`https://instagram.com/${instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold uppercase transition-colors hover:text-pink-600" 
                      style={{ color: '#94a3b8' }}
                    >
                      <Instagram size={12} /> {instagram}
                    </a>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase" style={{ color: '#94a3b8' }}>
                      <MessageCircle size={12} /> {phone}
                    </div>
                 </div>
                 <div className="h-1.5 w-24 bg-[#f1f5f9] mx-auto rounded-full" />
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                 {FORMATS[catalogFormat].icon} Formato atual: {FORMATS[catalogFormat].label}
              </p>
            </div>
          </div>
        </div>

        {/* Editor Sidebar */}
        <div className={`lg:col-span-4 space-y-6 order-1 lg:order-2 ${showEditor ? 'block' : 'hidden lg:block'}`}>
           <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                  <Palette size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Customização</h3>
              </div>

              <div className="space-y-6">
                {/* Formato do Catálogo */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Formato / Tamanho</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FORMATS) as Array<keyof typeof FORMATS>).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setCatalogFormat(fmt)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${catalogFormat === fmt ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {FORMATS[fmt].icon}
                        {FORMATS[fmt].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-4">
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Título Principal</label>
                     <input 
                       type="text" 
                       value={title} 
                       onChange={(e) => setTitle(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-bold" 
                     />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Subtítulo</label>
                     <input 
                       type="text" 
                       value={subtitle} 
                       onChange={(e) => setSubtitle(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                     />
                   </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Cor de Destaque</label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {['#db2777', '#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0f172a'].map(color => (
                       <button 
                         key={color}
                         onClick={() => setAccentColor(color)}
                         className={`w-10 h-10 rounded-xl transition-all ${accentColor === color ? 'scale-110 ring-4 ring-slate-100' : 'hover:scale-105'}`}
                         style={{ backgroundColor: color }}
                       />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-inner border border-slate-200 shrink-0">
                      <input 
                        type="color" 
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="absolute -inset-2 w-12 h-12 cursor-pointer" 
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase flex-1">{accentColor}</span>
                    <button onClick={async () => {
                      const s = await api.getSettings().catch(() => ({}));
                      setAccentColor(s.color || '#db2777');
                    }} className="text-[10px] font-bold text-slate-400 hover:text-pink-600 uppercase">
                      Restaurar Padrão
                    </button>
                  </div>
                </div>

                {/* Background Selection */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-bold text-slate-400 uppercase block">Fundo da Imagem</label>
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="text-[10px] font-bold text-pink-600 uppercase flex items-center gap-1 hover:text-pink-700"
                     >
                       <Upload size={12} /> Upload
                     </button>
                   </div>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleFileUpload} 
                   />
                   <div className="grid grid-cols-2 gap-3">
                     {/* Default Option */}
                     <div
                       onClick={() => setSelectedBg(DEFAULT_BG)}
                       className={`cursor-pointer relative h-20 rounded-2xl overflow-hidden border-2 transition-all ${selectedBg.id === DEFAULT_BG.id ? 'border-pink-600 shadow-lg scale-105' : 'border-transparent hover:border-slate-200'}`}
                     >
                       <div className="w-full h-full" style={{ background: DEFAULT_BG.gradient }} />
                       <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                         <span className="text-[8px] font-bold text-white uppercase tracking-wider">{DEFAULT_BG.label}</span>
                       </div>
                     </div>

                     {/* Uploaded History */}
                     {customBgs.map(bg => (
                       <div
                         key={bg.id}
                         onClick={() => setSelectedBg(bg)}
                         className={`cursor-pointer relative h-20 rounded-2xl overflow-hidden border-2 transition-all ${selectedBg.id === bg.id ? 'border-pink-600 shadow-lg scale-105' : 'border-transparent hover:border-slate-200'}`}
                       >
                         {bg.url && <img src={bg.url} className="w-full h-full object-cover" alt="Custom" />}
                         <div className="absolute inset-0 bg-black/10 hover:bg-black/30 transition-colors" />
                         
                         {/* Delete Button */}
                         <button 
                           onClick={(e) => handleDeleteBg(bg.id, e)}
                           className="absolute top-1 right-1 p-1 bg-white/20 hover:bg-white/40 text-white rounded-md backdrop-blur-sm transition-all"
                         >
                           <X size={12} />
                         </button>

                         <div className="absolute inset-0 flex items-end p-2 pointer-events-none">
                           <span className="text-[8px] font-bold text-white uppercase tracking-wider">Histórico</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Brand Info */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-bold text-slate-400 uppercase block">Informações de Contato</label>
                   <div className="relative">
                     <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input 
                       type="text" 
                       value={instagram} 
                       onChange={(e) => setInstagram(e.target.value)}
                       placeholder="Ex: @seu.instagram"
                       className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                     />
                   </div>
                   <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input 
                       type="text" 
                       value={phone} 
                       onChange={(e) => setPhone(e.target.value)}
                       placeholder="Ex: (62) 9 9999-9999"
                       className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                     />
                   </div>
                </div>

                {/* Visibility Options */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-bold text-slate-400 uppercase block">Exibição de Produtos</label>
                   <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200 transition-colors hover:bg-slate-100">
                     <input 
                       type="checkbox" 
                       checked={showPrices} 
                       onChange={e => setShowPrices(e.target.checked)} 
                       className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 cursor-pointer" 
                     />
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-700">Mostrar Preços</span>
                       <span className="text-[10px] text-slate-500">Exibe ou oculta os valores em reais (R$) no catálogo.</span>
                     </div>
                   </label>
                   
                   <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-1 max-h-72 overflow-y-auto">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Itens Inclusos ({visibleProducts.length}/{sortedProducts.length})</span>
                     {sortedProducts.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum produto cadastrado.</p>}
                     {sortedProducts.map(p => (
                       <div key={p.id} className="flex flex-col gap-1 py-2 border-b border-slate-200/60 last:border-0">
                         <label className="flex items-center justify-between cursor-pointer group">
                           <span className={`text-xs font-bold transition-colors ${hiddenProducts.includes(p.id) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{p.label}</span>
                           <input 
                             type="checkbox" 
                             checked={!hiddenProducts.includes(p.id)}
                             onChange={(e) => {
                               if (e.target.checked) setHiddenProducts(prev => prev.filter(id => id !== p.id));
                               else setHiddenProducts(prev => [...prev, p.id]);
                             }}
                             className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 cursor-pointer shrink-0 ml-2"
                           />
                         </label>
                         {!hiddenProducts.includes(p.id) && (
                           <input 
                             type="text"
                             placeholder="Categoria (Ex: Brigadeiros)"
                             value={categoryMapping[p.id] || ''}
                             onChange={(e) => setCategoryMapping(prev => ({...prev, [p.id]: e.target.value}))}
                             className="text-[10px] w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-pink-300 font-medium text-slate-600 placeholder:text-slate-300 transition-colors"
                           />
                         )}
                       </div>
                     ))}
                   </div>
                </div>
              </div>
           </section>

           <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
              <div className="text-amber-600 mt-1">
                <Layout size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 text-sm">Organize seu Cardápio</h4>
                <p className="text-xs text-amber-700 leading-relaxed">Os produtos são carregados automaticamente do seu **Estoque**. Edite-os lá para atualizar este catálogo.</p>
              </div>
           </div>
        </div>
      </div>
      )}
    </div>
  );
}
