import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, AlertCircle } from 'lucide-react';
import { Order, MenuProduct } from '../../types';
import { format, parseISO } from 'date-fns';
import { useModalBehavior } from '../../hooks/useModalBehavior';

interface LabelPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  menuProducts: MenuProduct[];
}

export default function LabelPrinterModal({ isOpen, onClose, order, menuProducts }: LabelPrinterModalProps) {
  useModalBehavior(isOpen, onClose);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderDate = order.date ? format(parseISO(order.date), 'dd/MM/yyyy') : '';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="label-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
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
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Printer size={20} className="text-pink-600" />
                Etiquetas (60x40mm)
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 flex flex-wrap gap-4 justify-center">
              {/* Prévia das Etiquetas na Tela (Simulação Visual) */}
              {(order.items || []).map((item, idx) => {
                const product = menuProducts.find(p => p.id === item.type);
                const labelName = product ? product.label : item.type;
                
                return (
                  <div key={idx} className="w-[226px] h-[151px] bg-white border-2 border-dashed border-slate-300 p-3 shadow-sm relative flex flex-col justify-between">
                    <div className="text-center border-b border-black/10 pb-1 mb-1">
                      <h4 className="font-black text-[12px] uppercase tracking-wider text-black">P.R_Doces</h4>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                       <p className="text-[14px] font-black leading-tight text-black line-clamp-2">{item.quantity}x {labelName}</p>
                       <p className="text-[10px] font-bold text-black/70 mt-1 uppercase truncate">Cliente: {order.customerName}</p>
                    </div>
                    <div className="text-[9px] font-bold border-t border-black/10 pt-1 mt-1 flex justify-between uppercase text-black/70">
                       <span>{orderDate} {order.time}</span>
                       <span>{order.deliveryType === 'retirada' ? 'Retirada' : 'Uber'}</span>
                    </div>
                    <div className="text-center mt-0.5">
                       <span className="text-[7px] uppercase tracking-widest font-bold text-black/50">⚠️ Conservar em geladeira</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
               <div className="flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-50 px-3 py-2 rounded-lg">
                 <AlertCircle size={16} />
                 Configure sua impressora térmica para 60x40mm sem margens.
               </div>
               <button 
                 onClick={handlePrint}
                 className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-all shadow-lg"
               >
                 <Printer size={18} /> Imprimir Agora
               </button>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
      
      {/* Área Oculta: Só aparece na hora de fato da Impressão (via CSS Mágico) */}
      <div className="hidden print:block print-area">
        <style type="text/css" media="print">
          {`
            @page { size: 60mm 40mm; margin: 0; }
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area {
              position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white;
            }
            .print-label-container {
              width: 60mm; height: 40mm; padding: 2mm; box-sizing: border-box;
              display: flex; flex-direction: column; justify-content: space-between;
              page-break-after: always; overflow: hidden; background: white; color: black; font-family: sans-serif;
            }
            .print-header { text-align: center; border-bottom: 1px solid black; padding-bottom: 1mm; margin-bottom: 1mm; }
            .print-title { font-size: 10pt; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 1px; color: black; }
            .print-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
            .print-item { font-size: 11pt; font-weight: 900; margin: 0; line-height: 1.2; color: black; }
            .print-customer {
              font-size: 8pt; font-weight: bold; margin-top: 1mm; text-transform: uppercase;
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: black;
            }
            .print-footer {
              border-top: 1px dashed black; padding-top: 1mm; margin-top: 1mm;
              display: flex; justify-content: space-between; font-size: 7pt; font-weight: bold; text-transform: uppercase; color: black;
            }
            .print-warning { text-align: center; font-size: 6pt; font-weight: bold; text-transform: uppercase; margin-top: 0.5mm; color: black; }
          `}
        </style>
        
        {isOpen && order && (order.items || []).map((item, idx) => {
          const product = menuProducts.find(p => p.id === item.type);
          const labelName = product ? product.label : item.type;
          
          return (
            <div key={idx} className="print-label-container">
              <div className="print-header">
                <h4 className="print-title">P.R_Doces</h4>
              </div>
              <div className="print-body">
                 <p className="print-item">{item.quantity}x {labelName}</p>
                 <p className="print-customer">Cliente: {order.customerName}</p>
              </div>
              <div>
                <div className="print-footer">
                   <span>{orderDate} {order.time}</span>
                   <span>{order.deliveryType === 'retirada' ? 'Retirada' : 'Uber'}</span>
                </div>
                <div className="print-warning">⚠️ Conservar em geladeira</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}