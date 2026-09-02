/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  BarChart3, 
  Tag, 
  Thermometer,
  Edit2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { InventoryItem, MenuProduct } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import InventoryItemModal from './forms/InventoryItemModal';
import MenuProductModal from './forms/MenuProductModal';
import ConfirmModal from './forms/ConfirmModal';
import toast from 'react-hot-toast';

const generateId = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'menu'>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingMenuProduct, setEditingMenuProduct] = useState<MenuProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, desc: string, onConfirm: () => void}>({ isOpen: false, title: '', desc: '', onConfirm: () => {} });
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invData, menuData] = await Promise.all([api.getInventory(), api.getMenuProducts()]);
      setItems(invData);
      setMenuProducts(menuData);
    } catch (error) {
      console.error('Erro ao conectar na API', error);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Volta para a primeira página sempre que o usuário digitar algo na busca
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const openForm = (item?: InventoryItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const openMenuForm = (product?: MenuProduct) => {
    setEditingMenuProduct(product || null);
    setIsMenuModalOpen(true);
  };

  const saveItem = async (itemData: any) => {
    const newItem: InventoryItem = {
      id: editingItem?.id || generateId(),
      ...itemData
    };
    try {
      await api.saveInventoryItem(newItem);
      await fetchData();
      setIsModalOpen(false);
      toast.success('Item salvo com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar item no banco de dados!');
    }
  };

  const saveMenuProduct = async (productData: any) => {
    const newProduct: MenuProduct = {
      id: editingMenuProduct?.id || generateId(),
      ...productData
    };
    try {
      await api.saveMenuProduct(newProduct);
      await fetchData();
      setIsMenuModalOpen(false);
      toast.success('Produto salvo com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar produto no banco de dados!');
    }
  };

  const deleteMenuProduct = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Produto?',
      desc: 'Deseja realmente excluir este produto do cardápio? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await api.deleteMenuProduct(id);
          await fetchData();
          toast.success('Produto excluído com sucesso!');
        } catch (err) { toast.error('Erro ao deletar produto!'); }
      }
    });
  };

  const adjustQuantity = async (id: string, amount: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const updated = { ...item, quantity: Math.max(0, Number(item.quantity || 0) + amount) };
      // Atualização Otimista (Muda a tela imediatamente sem esperar o banco)
      setItems(items.map(i => i.id === id ? updated : i));
      try {
        await api.saveInventoryItem(updated);
      } catch (err) {
        await fetchData(); // Se falhar, desfaz a alteração local buscando do banco
      }
    }
  };

  const deleteItem = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Insumo?',
      desc: 'Tem certeza que deseja excluir este item do estoque?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await api.deleteInventoryItem(id);
          await fetchData();
          toast.success('Item excluído com sucesso!');
        } catch (err) { toast.error('Erro ao deletar item!'); }
      }
    });
  };

  const filtered = useMemo(() => {
    return items
      .filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [items, search]);

  const sortedMenuProducts = useMemo(() => {
    return [...menuProducts].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [menuProducts]);

  useEffect(() => {
    const maxPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > maxPages && maxPages > 0) {
      setCurrentPage(maxPages);
    }
  }, [filtered.length, currentPage]);

  const totalValue = useMemo(() => {
    return items.reduce((acc, curr) => acc + ((Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0)), 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter(i => (Number(i.quantity) || 0) <= (Number(i.minQuantity) || 0)).length;
  }, [items]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Migration Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Insumos & Estoque
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cardápio (Menu)
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-pink-100 p-3 rounded-xl text-pink-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total de Itens</p>
            <h4 className="text-2xl font-bold text-slate-900">{items.length}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Estoque Baixo</p>
            <h4 className="text-2xl font-bold text-slate-900">{lowStockCount}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Valor em Estoque</p>
            <h4 className="text-2xl font-bold text-slate-900">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-2.5 text-sm rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
        <button 
          onClick={() => openForm()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          Novo Item
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Carregando estoque...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop View Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Item</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest text-center">Qtd Atual</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Preço Un.</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      Estoque vazio ou nenhum item encontrado.
                    </td>
                  </tr>
                )}
                {paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        {(Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0) && (
                          <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                            <AlertCircle size={10} /> REPOR LOGO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${item.category === 'insumo' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <button 
                            onClick={() => adjustQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            -
                          </button>
                          <span className={`font-mono font-bold min-w-[3rem] ${(Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0) ? 'text-red-600' : 'text-slate-700'}`}>
                            {item.quantity} {item.unit}
                          </span>
                          <button 
                            onClick={() => adjustQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[9px] text-slate-400">Min: {item.minQuantity} {item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">R$ {Number(item.unitPrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">R$ {((Number(item.quantity) || 0) * Number(item.unitPrice || 0)).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openForm(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
            {filtered.length === 0 && (
               <div className="py-12 text-center text-slate-400 italic text-sm">
                 Estoque vazio ou nenhum item encontrado.
               </div>
            )}
            {paginatedItems.map(item => (
              <div key={item.id} className="p-4 space-y-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 leading-tight mb-1.5">{item.name}</h4>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${item.category === 'insumo' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button onClick={() => openForm(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Qtd Atual</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button onClick={() => adjustQuantity(item.id, -1)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 hover:bg-slate-100 transition-colors text-lg sm:text-base">-</button>
                      <span className={`font-mono font-bold text-sm text-center flex-1 ${(Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0) ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity} {item.unit}</span>
                      <button onClick={() => adjustQuantity(item.id, 1)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 hover:bg-slate-100 transition-colors text-lg sm:text-base">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-right">Custo Total</p>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-medium">R$ {Number(item.unitPrice || 0).toFixed(2)}/un</p>
                      <p className="font-mono font-black text-slate-900 text-sm">R$ {((Number(item.quantity) || 0) * Number(item.unitPrice || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {(Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0) && (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                    <AlertCircle size={14} className="text-amber-500" /> Repor (Mín: {item.minQuantity} {item.unit})
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-500 font-medium">
                Mostrando <span className="font-bold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> de <span className="font-bold text-slate-700">{filtered.length}</span> itens
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Produtos do Cardápio</h3>
              <p className="text-xs text-slate-500">Gerencie os doces que aparecem no orçamento</p>
            </div>
            <button 
              onClick={() => openMenuForm()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-pink-600/20 hover:scale-105 transition-all"
            >
              <Plus size={20} />
              Novo Doce no Menu
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold text-slate-500">Carregando cardápio...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {sortedMenuProducts.map(product => (
                <motion.div 
                  layout
                  key={product.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-pink-200 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div className="bg-pink-50 p-2.5 rounded-xl text-pink-600">
                      <Tag size={18} />
                    </div>
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openMenuForm(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteMenuProduct(product.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-tight">{product.label}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Mínimo: {product.minQty} unidades
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-900">
                      R$ {Number(product.price || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      / {product.isByHundred ? 'cada (centena)' : 'cada (unid)'}
                    </span>
                  </div>
                  {product.isByHundred && (
                     <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-1 rounded w-fit mt-1">
                       PREÇO PROPORCIONAL AO CENTO
                     </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <InventoryItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveItem}
        initialData={editingItem}
      />

      <MenuProductModal 
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSave={saveMenuProduct}
        initialData={editingMenuProduct}
        inventoryItems={items}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.desc}
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
