import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import { MenuProduct, InventoryItem } from '../../types';

interface MenuProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  initialData: MenuProduct | null;
  inventoryItems: InventoryItem[];
}

const initialForm = { label: '', price: 0, minQty: 1, isByHundred: false, recipe: [] as {inventoryId: string, amount: number}[] };

export default function MenuProductModal({ isOpen, onClose, onSave, initialData, inventoryItems }: MenuProductModalProps) {
  const [formData, setFormData] = useState(initialForm);
  const [newRecipeId, setNewRecipeId] = useState('');
  const [newRecipeAmount, setNewRecipeAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          label: initialData.label,
          price: initialData.price,
          minQty: initialData.minQty,
          isByHundred: initialData.isByHundred,
          recipe: initialData.recipe || []
        });
      } else {
        setFormData(initialForm);
      }
      setNewRecipeId('');
      setNewRecipeAmount(0);
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!formData.label) return;
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
                <h3 className="text-2xl">{initialData ? 'Editar Doce' : 'Novo Doce no Cardápio'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Doce (Rótulo)</label>
                  <input 
                    type="text" 
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ex: Brigadeiro Belga"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-bold" 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Preço Base (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Pedido Mínimo</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={formData.minQty}
                      onChange={(e) => setFormData({ ...formData, minQty: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" 
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                  <input 
                    type="checkbox"
                    checked={formData.isByHundred}
                    onChange={(e) => setFormData({ ...formData, isByHundred: e.target.checked })}
                    className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Preço por Cento?</span>
                    <span className="text-[10px] text-slate-500">Se marcado, o preço será dividido por 100 para cálculo unitário (Ex: R$ 140,00 o cento)</span>
                  </div>
                </label>

                {/* SEÇÃO DA FICHA TÉCNICA */}
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Ficha Técnica (Por 1 unidade)</label>
                  </div>
                  <div className="space-y-2 mb-3">
                    {formData.recipe.length === 0 && <p className="text-[10px] text-slate-400 italic">Nenhum insumo cadastrado. O sistema usará o nome do doce para baixar o estoque.</p>}
                    {formData.recipe.map((r, idx) => {
                      const inv = inventoryItems.find(i => i.id === r.inventoryId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                          <span className="font-bold text-slate-700">{inv?.name || 'Insumo Excluído'}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-pink-600 font-mono font-bold">{r.amount} {inv?.unit}</span>
                            <button onClick={() => setFormData({...formData, recipe: formData.recipe.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={newRecipeId} onChange={e => setNewRecipeId(e.target.value)} className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20">
                      <option value="">Adicionar insumo...</option>
                      {inventoryItems.filter(i => i.category === 'insumo').sort((a, b) => a.name.localeCompare(b.name)).map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input type="number" step="0.001" placeholder="Qtd" value={newRecipeAmount || ''} onChange={e => setNewRecipeAmount(Number(e.target.value))} className="flex-1 sm:w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20" />
                      <button onClick={() => {
                        if(newRecipeId && newRecipeAmount > 0) {
                          setFormData({...formData, recipe: [...formData.recipe, { inventoryId: newRecipeId, amount: newRecipeAmount }]});
                          setNewRecipeId('');
                          setNewRecipeAmount(0);
                        }
                      }} className="bg-slate-200 text-slate-700 px-4 rounded-xl font-bold hover:bg-slate-300 transition-colors">+</button>
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
                  className="w-full sm:flex-1 bg-pink-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  Salvar no Cardápio
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}