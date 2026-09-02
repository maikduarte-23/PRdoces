import { motion } from 'motion/react';
import { Trash2, Plus, Minus, Sparkles, Flower2 } from 'lucide-react';
import { OrderItem, MenuProduct } from '../../types';

interface BudgetItemCardProps {
  item: OrderItem;
  product?: MenuProduct;
  updateItem: (id: string, updates: Partial<OrderItem>) => void;
  onRemove: (id: string) => void;
}

export default function BudgetItemCard({ item, product, updateItem, onRemove }: BudgetItemCardProps) {
  const label = product ? product.label : item.type;
  const minQty = product ? product.minQty : 1;

  const handleStepQuantity = (delta: number) => {
    const nextQty = Math.max(minQty, item.quantity + delta);
    updateItem(item.id, { quantity: nextQty });
  };

  const handleAddPreset = (amount: number) => {
    updateItem(item.id, { quantity: item.quantity + amount });
  };

  const baseTotal = item.quantity * item.unitPrice;
  const decorationTotal = (item.decorationPricePerUnit || 0) * item.quantity;
  const wrapperTotal = item.flowerWrappers ? (item.flowerWrapperPrice || 0) : 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 sm:p-5 border border-slate-200/90 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Lado Esquerdo: Título, Controles de Quantidade e Opcionais */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h4 className="text-base font-black text-slate-900 truncate">
              {label}
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              R$ {item.unitPrice.toFixed(2)} / un
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Controle de Quantidade com Stepper e Atalhos */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Quantidade
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity(-1)}
                    disabled={item.quantity <= minQty}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:text-brand-primary disabled:opacity-30 disabled:hover:text-slate-700 shadow-xs transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input 
                    type="number"
                    min={minQty}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Math.max(minQty, Number(e.target.value)) })}
                    className="w-16 bg-transparent text-center text-sm font-mono font-black text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepQuantity(1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:text-brand-primary shadow-xs transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Atalhos Rápidos de Cento */}
                <div className="flex items-center gap-1">
                  {[25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="px-2 py-1.5 bg-pink-50 hover:bg-pink-100 text-brand-primary text-[10px] font-black rounded-lg border border-pink-200/70 transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Decoração Personalizada */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" /> Decor / un
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">R$</span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={item.decorationPricePerUnit === 0 ? '' : item.decorationPricePerUnit}
                  onChange={(e) => updateItem(item.id, { decorationPricePerUnit: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-24 bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2.5 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pink-500/20 focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Forminhas Especiais de Flor */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Flower2 size={11} className="text-pink-500" /> Forminha Flor
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer bg-slate-50 hover:bg-pink-50/60 border border-slate-200 px-3 py-2 rounded-xl transition-colors">
                  <input 
                    type="checkbox"
                    checked={item.flowerWrappers}
                    onChange={(e) => updateItem(item.id, { flowerWrappers: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary/30 cursor-pointer border-slate-300"
                  />
                  <span>Adicionar</span>
                </label>
                {item.flowerWrappers && (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pink-400 font-mono text-[10px]">R$</span>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.flowerWrapperPrice === 0 ? '' : item.flowerWrapperPrice}
                      onChange={(e) => updateItem(item.id, { flowerWrapperPrice: Number(e.target.value) })}
                      placeholder="Valor total"
                      className="w-24 bg-pink-50 border border-pink-200 rounded-xl pl-7 pr-2.5 py-2 text-xs font-bold text-pink-700 focus:ring-2 focus:ring-pink-500/20 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Totalizador do Item e Botão de Remover */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
          <button 
            type="button"
            onClick={() => onRemove(item.id)} 
            className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors"
            title="Remover item"
          >
            <Trash2 size={18} />
          </button>
          
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total do Item</span>
            <span className="font-mono font-black text-slate-900 text-lg sm:text-xl block">
              R$ {item.total.toFixed(2)}
            </span>
            {(decorationTotal > 0 || wrapperTotal > 0) && (
              <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                (Base: R$ {baseTotal.toFixed(2)}{decorationTotal > 0 ? ` + Decor: R$ ${decorationTotal.toFixed(2)}` : ''}{wrapperTotal > 0 ? ` + Flor: R$ ${wrapperTotal.toFixed(2)}` : ''})
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}