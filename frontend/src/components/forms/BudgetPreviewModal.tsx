import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Download, Loader2, DollarSign, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';
import { OrderItem, MenuProduct } from '../../types';
import { DELIVERY_RESIDENTIAL, DIETARY_WARNING } from '../../constants';
import toast from 'react-hot-toast';
import { useModalBehavior } from '../../hooks/useModalBehavior';

interface BudgetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  items: OrderItem[];
  menuProducts: MenuProduct[];
  subtotal: number;
  total: number;
  deposit: number;
  deliveryFee: number;
  discount: number;
  deliveryType: 'retirada' | 'uber';
  companyName: string;
  pixKey?: string;
  logo?: string | null;
  dietaryWarning?: string;
}

export default function BudgetPreviewModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  date,
  time,
  items,
  menuProducts,
  subtotal,
  total,
  deposit,
  deliveryFee,
  discount,
  deliveryType,
  companyName,
  pixKey,
  logo,
  dietaryWarning
}: BudgetPreviewModalProps) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  
  useModalBehavior(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      const itemsText = items.map(i => {
        const product = menuProducts.find(p => p.id === i.type);
        const typeLabel = product ? product.label : i.type;
        let desc = `• ${i.quantity}x ${typeLabel} - R$ ${(i.quantity * i.unitPrice).toFixed(2)}`;
        if (i.decorationPricePerUnit > 0) desc += `\n  + Decoração (R$ ${i.decorationPricePerUnit}/un): R$ ${(i.decorationPricePerUnit * i.quantity).toFixed(2)}`;
        if (i.flowerWrappers) desc += `\n  + Forminhas Flores: R$ ${(i.flowerWrapperPrice || 0).toFixed(2)}`;
        return desc;
      }).join('\n\n');

      const formattedDate = date ? date.split('-').reverse().join('/') : 'A combinar';

      const message = `✨ *ORÇAMENTO ${companyName.toUpperCase()}* ✨\n\n` +
        `Olá, *${customerName || 'Cliente'}*!\nAqui está o seu orçamento para o dia ${formattedDate} às ${time || '...'}:\n\n` +
        `${itemsText}\n\n` +
        `---------------------------\n` +
        `📦 *Subtotal: R$ ${subtotal.toFixed(2)}*\n` +
        (deliveryFee > 0 ? `🛵 *Taxa de Entrega: R$ ${deliveryFee.toFixed(2)}*\n` : '') +
        (discount > 0 ? `🎁 *Desconto Especial: -R$ ${discount.toFixed(2)}*\n` : '') +
        `💰 *Total: R$ ${total.toFixed(2)}*\n` +
        `💳 *Sinal (50%): R$ ${deposit.toFixed(2)}*\n` +
        (pixKey ? `🔑 *Chave PIX:* ${pixKey}\n` : '') +
        `---------------------------\n\n` +
        `📍 ${deliveryType === 'retirada' ? `Retirada: ${DELIVERY_RESIDENTIAL}` : 'Entrega via Uber (Por conta do cliente)'}\n\n` +
        `⚠️ *Aviso:* ${dietaryWarning || DIETARY_WARNING}\n\n` +
        `Posso confirmar sua encomenda? 😊`;
        
      setWhatsappMessage(message);
    }
  }, [isOpen, items, menuProducts, customerName, date, time, subtotal, total, deposit, deliveryFee, discount, deliveryType, companyName, pixKey, logo, dietaryWarning]);

  const generateCanvas = async () => {
    if (!quoteRef.current) return null;
    return await html2canvas(quoteRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        removeContainer: true,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style.backdropFilter || (typeof el.className === 'string' && el.className.includes('backdrop-blur'))) {
              el.style.backdropFilter = 'none';
              if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba')) {
                el.style.backgroundColor = el.style.backgroundColor.replace(/0\.[0-9]+\)$/, '0.92)');
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
  };

  const handleDownloadQuote = async () => {
    try {
      setIsDownloading(true);
      const canvas = await generateCanvas();
      if (!canvas) return;

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `orcamento-${customerName || 'cliente'}-${Date.now()}.png`;
      link.href = image;
      link.click();
      toast.success('Imagem do orçamento baixada!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    toast.success('Texto copiado com sucesso!');
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyPix = () => {
    if (!pixKey) {
      toast.error('Nenhuma chave PIX cadastrada.');
      return;
    }
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    const encodedText = encodeURIComponent(whatsappMessage);
    const url = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 my-auto"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Prévia do Orçamento</h3>
                <p className="text-xs text-slate-500 font-medium">Pronto para envio no WhatsApp ou download em imagem.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body: 2 Colunas (Texto WhatsApp / Imagem Pronta) */}
          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Coluna 1: Texto Formatado WhatsApp */}
            <div className="space-y-4 flex flex-col">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Mensagem WhatsApp</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Formatado</span>
              </label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={12}
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
              />
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm shadow-emerald-500/20"
                >
                  {copiedMessage ? <Check size={16} /> : <Copy size={16} />}
                  {copiedMessage ? 'Copiado!' : 'Copiar Texto'}
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm"
                  title="Abrir diretamente no WhatsApp"
                >
                  <ExternalLink size={16} /> WhatsApp
                </button>
                {pixKey && (
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
                    title="Copiar apenas a chave PIX"
                  >
                    {copiedPix ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    PIX
                  </button>
                )}
              </div>
            </div>

            {/* Coluna 2: Cartão Visual para Download */}
            <div className="space-y-4 flex flex-col">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Imagem do Orçamento</span>
                <button
                  type="button"
                  onClick={handleDownloadQuote}
                  disabled={isDownloading}
                  className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                >
                  {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Baixar Imagem
                </button>
              </label>

              {/* Cartão Visual Capturável */}
              <div 
                ref={quoteRef}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                    <div className="flex items-center gap-2">
                      {logo && <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />}
                      <h4 className="font-black text-brand-primary text-base">{companyName}</h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orçamento</span>
                  </div>

                  <div className="pt-3 pb-2 text-xs space-y-1">
                    <p className="font-bold text-slate-900">Cliente: <span className="font-medium text-slate-700">{customerName || 'Cliente'}</span></p>
                    <p className="font-bold text-slate-900">Data/Hora: <span className="font-medium text-slate-700">{date ? date.split('-').reverse().join('/') : 'A combinar'} às {time || '--:--'}</span></p>
                    <p className="font-bold text-slate-900">Entrega: <span className="font-medium text-slate-700">{deliveryType === 'retirada' ? 'Retirada no Local' : 'Uber'}</span></p>
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-1.5 max-h-[160px] overflow-y-auto">
                    {items.map((item, idx) => {
                      const prod = menuProducts.find(p => p.id === item.type);
                      return (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                          <span>{item.quantity}x {prod?.label || item.type}</span>
                          <span className="font-mono font-bold">R$ {item.total.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-pink-100 pt-3 space-y-1.5 bg-pink-50/50 p-3 rounded-xl">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Taxa Entrega:</span>
                      <span className="font-mono font-bold">R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Desconto:</span>
                      <span className="font-mono">-R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-brand-primary pt-1 border-t border-pink-200">
                    <span>Total:</span>
                    <span className="font-mono">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-800 pt-1">
                    <span>Sinal PIX (50%):</span>
                    <span className="font-mono">R$ {deposit.toFixed(2)}</span>
                  </div>
                  {pixKey && (
                    <p className="text-[10px] text-slate-500 font-mono pt-1">PIX: {pixKey}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}