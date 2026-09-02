import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Customer } from '../../types';
import { useModalBehavior } from '../../hooks/useModalBehavior';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerForm: any) => void;
  initialData: Customer | null;
}

const initialForm = { name: '', phone: '', restrictions: '', theme: '', themes: [] as string[] };

export default function CustomerModal({ isOpen, onClose, onSave, initialData }: CustomerModalProps) {
  const [formData, setFormData] = useState(initialForm);
  useModalBehavior(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          phone: initialData.phone,
          restrictions: initialData.dietaryRestrictions || '',
          theme: '',
          themes: initialData.historyThemes || []
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, initialData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"
          >
            <div className="p-5 sm:p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl">{initialData ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
              </div>

              <div className="space-y-5">
                 <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome Completo</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">WhatsApp / Telefone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Restrições (Ex: Lactose, Glúten)</label>
                  <textarea 
                    value={formData.restrictions}
                    onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Adicionar Novo Tema</label>
                  <input 
                    type="text" 
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    placeholder="Ex: Hulk, Fundo do Mar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" 
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10">
                <button 
                  onClick={onClose}
                  className="w-full sm:flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => onSave(formData)}
                  className="w-full sm:flex-1 bg-brand-primary text-white py-3 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Salvar Cliente
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}