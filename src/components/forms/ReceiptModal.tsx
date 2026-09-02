import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Order, Customer } from '../../types';
import { format, parseISO } from 'date-fns';
import { useModalBehavior } from '../../hooks/useModalBehavior';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  customer: Customer | null;
  companyName: string;
  logo: string | null;
}

export default function ReceiptModal({ isOpen, onClose, order, customer, companyName, logo }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  useModalBehavior(isOpen, onClose);

  if (!order) return null;

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            
            const propsToFix: string[] = [];
            for (let j = 0; j < style.length; j++) {
              const prop = style[j];
              if (style.getPropertyValue(prop).includes('oklch')) {
                propsToFix.push(prop);
              }
            }
            
            if (propsToFix.length > 0) {
              let baseColor = '#0f172a'; // slate-900
              const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
              
              if (cls.includes('emerald-600') || cls.includes('emerald-500')) baseColor = '#059669';
              else if (cls.includes('emerald-100')) baseColor = '#d1fae5';
              else if (cls.includes('emerald-50')) baseColor = '#ecfdf5';
              else if (cls.includes('rose-600')) baseColor = '#e11d48';
              else if (cls.includes('rose-400')) baseColor = '#fb7185';
              else if (cls.includes('rose-50')) baseColor = '#fff1f2';
              else if (cls.includes('slate-900')) baseColor = '#0f172a';
              else if (cls.includes('slate-600')) baseColor = '#475569';
              else if (cls.includes('slate-500')) baseColor = '#64748b';
              else if (cls.includes('slate-400')) baseColor = '#94a3b8';
              else if (cls.includes('slate-200')) baseColor = '#e2e8f0';
              else if (cls.includes('slate-100')) baseColor = '#f1f5f9';
              else if (cls.includes('slate-50')) baseColor = '#f8fafc';
              
              propsToFix.forEach(prop => {
                let fallback = baseColor;
                if (prop.includes('background')) fallback = '#ffffff';
                else if (prop.includes('border') || prop.includes('outline') || prop.includes('rule')) fallback = '#f1f5f9';
                else if (prop.includes('shadow')) fallback = 'none';
                
                el.style.setProperty(prop, fallback, 'important');
              });
            }
          }
        }
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `recibo-${order.customerName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar recibo:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Gerar Recibo</h3>
              <button onClick={onClose} className="text-slate-400 p-2 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 bg-slate-50 flex-1 overflow-y-auto">
              <div 
                ref={receiptRef}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative"
              >
                <div className="text-center mb-6 border-b border-dashed border-slate-200 pb-6 flex flex-col items-center">
                  {logo ? (
                    <div className="w-16 h-16 mb-4 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex items-center justify-center bg-white">
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                  )}
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">RECIBO</h2>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{companyName.toUpperCase()} CONFEITARIA</p>
                </div>

                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400">Cliente</span>
                    <span className="font-bold text-slate-900 text-right">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400">Telefone</span>
                    <span className="font-bold text-slate-900 text-right">{customer?.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400">Logística</span>
                    <span className="font-bold text-slate-900 text-right uppercase text-[10px] tracking-widest mt-0.5">{order.deliveryType === 'retirada' ? 'Retirada Local' : 'Uber Entrega'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400">Data do Pedido</span>
                    <span className="font-bold text-slate-900">{(order as any).createdAt ? format(parseISO((order as any).createdAt), 'dd/MM/yyyy') : (order.date ? format(parseISO(order.date), 'dd/MM/yyyy') : '-')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400">Data de Entrega</span>
                    <span className="font-bold text-slate-900">{order.date ? format(parseISO(order.date), 'dd/MM/yyyy') : '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400">Status</span>
                    <span className="font-bold text-emerald-600 uppercase text-[10px] tracking-widest bg-emerald-50 px-2 py-1 rounded-md">
                      {order.status === 'entregue' ? 'Pagamento Total' : (order.depositPaid ? 'Sinal 50% Pago' : 'Pendente')}
                    </span>
                  </div>
                  
                  {customer?.dietaryRestrictions && (
                    <div className="pt-2 pb-1 border-b border-slate-100 mb-2">
                      <span className="font-bold text-rose-400 block text-[10px] uppercase mb-1">⚠️ Restrições Alimentares:</span>
                      <span className="text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-lg block">{customer.dietaryRestrictions}</span>
                    </div>
                  )}
                  
                  <div className="pt-4 pb-2">
                    <span className="font-bold text-slate-400 block mb-2">Itens do Pedido:</span>
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs mb-1">
                        <span className="truncate pr-2">{item.quantity}x {item.type}</span>
                        <span className="font-mono whitespace-nowrap">R$ {item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const diff = order.totalPrice - (order.items || []).reduce((acc, item) => acc + item.total, 0);
                    if (Math.abs(diff) > 0.01) {
                      return (
                        <div className="flex justify-between text-xs mb-1 pt-2 border-t border-slate-100/50">
                          <span className="truncate pr-2 text-slate-500">{diff > 0 ? 'Taxa de Entrega / Acréscimos' : 'Descontos'}</span>
                          <span className="font-mono whitespace-nowrap text-slate-500">{diff > 0 ? '+' : '-'} R$ {Math.abs(diff).toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                    <span className="font-black text-slate-900">Total Pago</span>
                    <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">
                      R$ {(order.status === 'entregue' ? order.totalPrice : (order.depositPaid ? order.totalPrice / 2 : 0)).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-6 text-center">
                    <p className="text-[9px] text-slate-400 italic">Documento auxiliar impresso digitalmente.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                {isDownloading ? 'Gerando Imagem...' : 'Baixar Recibo (Imagem)'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}