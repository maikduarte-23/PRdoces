import { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, Filter, X } from 'lucide-react';
import { MenuProduct } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProductQuickPickerProps {
  products: MenuProduct[];
  onSelectProduct: (productId: string) => void;
}

export default function ProductQuickPicker({ products, onSelectProduct }: ProductQuickPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Extrai categorias únicas ou agrupa
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.label.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products, search, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Ação de Expandir Catálogo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar doce pelo nome..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value && !isExpanded) setIsExpanded(true);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-pink-500/20 focus:border-brand-primary outline-none transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            isExpanded
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-pink-50 text-brand-primary border border-pink-200 hover:bg-pink-100'
          }`}
        >
          <Sparkles size={14} />
          {isExpanded ? 'Ocultar Grade' : 'Ver Cardápio Visual'}
        </button>
      </div>

      {/* Grade Visual com Filtros de Categoria */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3 pt-2"
          >
            {/* Filtros de Categoria */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todos os Doces' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Grid de Cards de Doces */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto p-1 pr-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-pink-50/70 border border-slate-200/80 hover:border-brand-primary/40 text-left transition-all group"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-brand-primary">
                      {product.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      R$ {product.price.toFixed(2)} {product.isByHundred ? '/ cento' : '/ un'} • Mín: {product.minQty}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                    <Plus size={14} />
                  </div>
                </button>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
                  Nenhum doce encontrado com esse nome.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
