import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Download, Loader2, DollarSign, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { OrderItem, MenuProduct } from '../../types';
import { DELIVERY_RESIDENTIAL, DIETARY_WARNING } from '../../constants';
import toast from 'react-hot-toast';
import { useModalBehavior } from '../../hooks/useModalBehavior';

interface BudgetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
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
}

export default function BudgetPreviewModal({
  isOpen,
  onClose,
  customerName,
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
  useModalBehavior(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      const itemsText = items.map(i => {
        const product = menuProducts.find(p => p.id === i.type);
        const typeLabel = product ? product.label : i.type;
        let desc = `• ${i.quantity}x ${typeLabel} - R$ ${(i.quantity * i.unitPrice).toFixed(2)}`;
        if (i.decorationPricePerUnit > 0) desc += `\n  + Decoração (R$ ${i.decorationPricePerUnit}/un): R$ ${(i.decorationPricePerUnit * i.quantity).toFixed(2)}`;
        if (i.flowerWrappers) desc += `\n  + Forminhas Flores: R$ ${i.flowerWrapperPrice.toFixed(2)}`;
        return desc;
      }).join('\n\n');

      const message = `✨ *ORÇAMENTO ${companyName.toUpperCase()}* ✨\n\n` +
        `Olá, *${customerName || 'Cliente'}*!\nAqui está o orçamento para o dia ${date ? date.split('-').reverse().join('/') : '...'} às ${time || '...'}:\n\n` +
        `${itemsText}\n\n` +
        `---------------------------\n` +
        `📦 *Subtotal: R$ ${subtotal.toFixed(2)}*\n` +
        (deliveryFee > 0 ? `🛵 *Taxa de Entrega: R$ ${deliveryFee.toFixed(2)}*\n` : '') +
        (discount > 0 ? `🎁 *Desconto: -R$ ${discount.toFixed(2)}*\n` : '') +
        `💰 *Total: R$ ${total.toFixed(2)}*\n` +
        `💳 *Sinal (50%): R$ ${deposit.toFixed(2)}*\n` +
        (pixKey ? `🔑 *Chave PIX:* ${pixKey}\n` : '') +
        `---------------------------\n\n` +
        `📍 ${deliveryType === 'retirada' ? `Retirada: ${DELIVERY_RESIDENTIAL}` : 'Entrega via Uber (Por conta do cliente)'}\n\n` +
        `⚠️ *Aviso:* ${dietaryWarning}\n\n` +
        `Posso confirmar sua encomenda? 😊`;
        
      setWhatsappMessage(message);
    }
  }, [isOpen, items, menuProducts, customerName, date, time, subtotal, total, deposit, deliveryFee, discount, deliveryType, companyName, pixKey, logo, dietaryWarning]);

  const generateCanvas = async () => {
    if (!quoteRef.current) return null;
    return await html2canvas(quoteRef.current, {
        scale: 3, // Reduzido de 4 para 3 para evitar crashes por falta de memória em celulares (iOS/Android)
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
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsDownloading(true);
      const canvas = await generateCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Falha ao gerar imagem');
      
      const file = new File([blob], `orcamento-${customerName || 'cliente'}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          // Tenta copiar o texto para a área de transferência silenciosamente.
          // Evita o bug do Android onde o WhatsApp ignora o texto ao compartilhar uma imagem.
          // Se sumir, o usuário só precisa dar "Colar".
          await navigator.clipboard.writeText(whatsappMessage).catch(() => {});
          await navigator.share({ files: [file], title: 'Orçamento P.R_Doces', text: whatsappMessage });
        } catch (err) {
          console.log('Compartilhamento cancelado', err);
        }
      } else {
        try {
          await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
          toast.success('Imagem copiada! Cole no WhatsApp.');
        } catch (err) {
          // Apenas segue o fluxo se não conseguir copiar
        }
        const encoded = encodeURIComponent(whatsappMessage);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error('Erro ao preparar envio.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <style type="text/css" media="print">
            {`
              @page { size: auto; margin: 10mm; }
              body * { visibility: hidden; }
              #visual-quote, #visual-quote * { visibility: visible; }
              #visual-quote {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                box-shadow: none !important;
                border: none !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            `}
          </style>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col h-[90vh] md:h-auto"
          >
            {/* Visual Quote Preview */}
            <div className="flex-1 bg-slate-50 p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h3 className="text-xl font-bold text-slate-900">Prévia Visual (Card)</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 transition-colors"><X size={20} /></button>
              </div>
              
              <div 
                ref={quoteRef}
                id="visual-quote" 
                className="bg-white rounded-3xl p-8 border border-[#f1f5f9] relative overflow-hidden flex flex-col min-h-[500px]"
                style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              >
                <div className="absolute top-0 left-0 w-full h-2" style={{ background: 'linear-gradient(to right, #f472b6, #db2777)' }} />
                
                <div className="text-center mb-8 flex flex-col items-center">
                  {logo && (
                    <div className="w-20 h-20 mb-3 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex items-center justify-center bg-white">
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <h2 className="text-2xl font-black text-[#0f172a] tracking-tighter">{companyName.toUpperCase()}</h2>
                  <p className="text-[10px] uppercase font-bold text-[#db2777] tracking-[0.2em] mt-1">Orçamento Digital</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="flex justify-between items-end border-b border-[#f1f5f9] pb-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#64748b] uppercase">Cliente</p>
                      <p className="font-bold text-[#0f172a]">{customerName || 'Cliente'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#64748b] uppercase">Data/Hora</p>
                      <p className="font-bold text-[#0f172a]">{date ? date.split('-').reverse().join('/') : 'A combinar'} - {time || '...'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map(item => {
                       const product = menuProducts.find(p => p.id === item.type);
                       return (
                         <div key={item.id} className="flex justify-between text-sm">
                           <span className="text-[#475569]">
                             <span className="font-bold text-[#0f172a]">{item.quantity}un</span> {product?.label || item.type}
                           </span>
                           <span className="font-mono font-bold text-[#0f172a]">R$ {item.total.toFixed(2)}</span>
                         </div>
                       );
                    })}
                  </div>

                  <div className="space-y-2 pt-6 border-t border-[#f1f5f9]">
                    <div className="flex justify-between items-center text-[#64748b] uppercase text-[10px] font-bold">
                      <span>Subtotal</span>
                      <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between items-center text-[#64748b] uppercase text-[10px] font-bold">
                        <span>Taxa de Entrega</span>
                        <span className="font-mono">+ R$ {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-500 uppercase text-[10px] font-bold">
                        <span>Desconto Especial</span>
                        <span className="font-mono">- R$ {discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[#db2777]">
                      <span className="font-bold uppercase text-[12px]">Total Orçado</span>
                      <span className="text-2xl font-black font-mono tracking-tight text-[#0f172a]">R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#f8fafc] p-4 rounded-2xl flex justify-between items-center gap-3 border border-[#e2e8f0]">
                      <div>
                        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Sinal (50%)</p>
                        <p className="text-xl font-black text-[#0f172a] font-mono mt-0.5">R$ {deposit.toFixed(2)}</p>
                      </div>
                      {pixKey ? (
                        <div className="bg-[#ecfdf5] border border-[#d1fae5] px-3 py-2 rounded-xl text-right">
                          <p className="text-[9px] font-bold text-[#059669] flex items-center justify-end gap-1 uppercase tracking-widest mb-1">
                            <DollarSign size={12} /> Chave PIX
                          </p>
                          <p className="text-[11px] text-[#064e3b] font-black font-mono select-all tracking-tight bg-white px-2 py-1 rounded-md shadow-sm border border-[#d1fae5] inline-block">{pixKey}</p>
                        </div>
                      ) : (
                        <div className="text-right">
                           <div className="bg-[#e2e8f0] h-8 w-8 rounded-full flex items-center justify-center ml-auto mb-1">
                             <DollarSign size={16} className="text-[#64748b]" />
                           </div>
                           <p className="text-[9px] font-bold text-[#64748b] font-mono tracking-widest">VIA PIX</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-[#e2e8f0] text-center">
                  <p className="text-[9px] text-[#94a3b8] italic">Este orçamento é válido por 3 dias. Sujeito a disponibilidade de agenda.</p>
                </div>
              </div>

            <div className="mt-6 flex flex-col gap-3 print:hidden">
              <button 
                onClick={() => window.print()}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50"
              >
                <Printer size={18} /> Imprimir / Salvar como PDF
              </button>
              
                <button 
                  onClick={handleDownloadQuote}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  {isDownloading ? 'Gerando Imagem...' : 'Baixar Orçamento como Imagem'}
                </button>
                
                <button 
                  onClick={handleShareWhatsApp}
                  disabled={isDownloading}
                  className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                  {isDownloading ? 'Preparando...' : 'Enviar direto pro WhatsApp'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}