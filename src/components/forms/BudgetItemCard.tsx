import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
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

  return (
    <motion.div 
      layout
      className="p-3 sm:p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col relative group transition-colors hover:border-pink-200"
    >
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate pr-6 mb-2">{label}</h4>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {/* Quantidade */}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">Qtd:</label>
              <input 
                type="number"
                min={minQty}
                step="0.001"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Math.max(minQty, Number(e.target.value)) })}
                className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
              <span className="text-[9px] text-slate-400 font-medium">Mín: {minQty}</span>
            </div>

            {/* Decoração */}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">Decor/un:</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">R$</span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={item.decorationPricePerUnit === 0 ? '' : item.decorationPricePerUnit}
                  onChange={(e) => updateItem(item.id, { decorationPricePerUnit: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
            </div>

            {/* Forminhas */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={item.flowerWrappers}
                  onChange={(e) => updateItem(item.id, { flowerWrappers: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500 cursor-pointer border-slate-300"
                />
                Forminha Flor
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
                    className="w-20 bg-pink-50 border border-pink-200 rounded-lg pl-7 pr-2 py-1.5 text-xs font-bold text-pink-700 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between shrink-0 h-full gap-2 sm:gap-4 mt-0.5">
          <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
            <Trash2 size={16} />
          </button>
          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Total</span>
            <span className="font-mono font-black text-slate-900 text-sm">R$ {item.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}