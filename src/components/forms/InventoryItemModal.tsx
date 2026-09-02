import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  initialData: InventoryItem | null;
}

const initialForm = { name: '', category: 'insumo' as 'insumo' | 'produto', quantity: 0, unit: 'kg', minQuantity: 1, unitPrice: 0 };

export default function InventoryItemModal({ isOpen, onClose, onSave, initialData }: InventoryItemModalProps) {
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          category: initialData.category,
          quantity: initialData.quantity,
          unit: initialData.unit,
          minQuantity: initialData.minQuantity,
          unitPrice: initialData.unitPrice
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!formData.name) return;
    onSave(initialData ? { ...formData, id: initialData.id } : formData);
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
                <h3 className="text-2xl">{initialData ? 'Editar Item' : 'Novo Item Estoque'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Item</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Leite Condensado"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Categoria</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as 'insumo' | 'produto' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    >
                      <option value="insumo">Insumo</option>
                      <option value="produto">Produto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Unidade</label>
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    >
                      <option value="kg">Quilograma (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="un">Unidade (un)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="l">Litro (l)</option>
                      <option value="caixa">Caixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Qtd em Estoque</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Alerta Estoque Baixo</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                     <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Preço de Custo (por {formData.unit})</label>
                     <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">R$</span>
                       <input 
                          type="number" 
                          step="0.01"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                        />
                     </div>
                  </div>
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
                  onClick={handleSave}
                  className="w-full sm:flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  Salvar Item
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}