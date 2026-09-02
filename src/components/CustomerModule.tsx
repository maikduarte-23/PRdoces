/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  History, 
  AlertCircle, 
  Phone, 
  Trash2,
  Edit2,
  CheckCircle2,
  Package,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomerModal from './forms/CustomerModal';
import toast from 'react-hot-toast';

const generateId = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

export default function CustomerModule() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pedidos são necessários para o histórico, então buscamos todos
      const [custData, paginatedOrders] = await Promise.all([api.getCustomers(), api.getOrders({ limit: 9999 })]);
      setCustomers(custData);
      setOrders(paginatedOrders.orders);
    } catch (err) {
      console.error('Erro ao buscar da API', err);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openForm = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setIsModalOpen(true);
  };

  const saveCustomer = async (formData: any) => {
    const newCustomer: Customer = {
      id: editingCustomer?.id || generateId(),
      name: formData.name,
      phone: formData.phone,
      dietaryRestrictions: formData.restrictions,
      historyThemes: formData.theme ? [...formData.themes, formData.theme] : formData.themes
    };

    try {
      await api.saveCustomer(newCustomer);
      await fetchData(); 
      setIsModalOpen(false);
      toast.success('Cliente salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao comunicar com o servidor!');
    }
  };

  const confirmDelete = (id: string) => {
    const customerOrders = ordersByCustomer[id] || [];
    if (customerOrders.length > 0) {
      toast.error('Não é possível excluir um cliente que já possui pedidos registrados.');
      return;
    }
    setCustomerToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (customerToDelete) {
      try {
        await api.deleteCustomer(customerToDelete);
        await fetchData(); // Recarrega do banco
        setIsConfirmDeleteOpen(false);
        setCustomerToDelete(null);
        toast.success('Cliente excluído com sucesso!');
      } catch (err) {
        toast.error('Erro ao excluir cliente no banco de dados!');
      }
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
  }, [customers, search]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  // Otimização: Cria um dicionário atrelando pedidos aos IDs de seus donos
  const ordersByCustomer = useMemo(() => {
    const map: Record<string, Order[]> = {};
    sortedOrders.forEach(o => {
      if (!map[o.customerId]) map[o.customerId] = [];
      map[o.customerId].push(o);
    });
    return map;
  }, [sortedOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* ... (search and button remains same) */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-2.5 text-sm rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
        <button 
          onClick={() => openForm()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all"
        >
          <UserPlus size={20} />
          Novo Cliente
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Carregando clientes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              Nenhum cliente encontrado.
            </div>
          )}
        {filtered.map(customer => {
          const customerOrders = ordersByCustomer[customer.id] || [];
          
          return (
            <motion.div 
              layout
              key={customer.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center font-display text-xl font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openForm(customer)} className="p-1.5 text-slate-400 hover:text-pink-600 transition-colors hover:bg-slate-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => confirmDelete(customer.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{customer.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                <Phone size={14} className="text-slate-300" />
                {customer.phone}
              </div>

              {customer.dietaryRestrictions && (
                <div className="mb-4 p-3 bg-pink-50 rounded-xl border border-pink-100 flex gap-3 text-pink-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="text-[11px] font-bold leading-relaxed">{customer.dietaryRestrictions}</span>
                </div>
              )}

              <div className="space-y-3 pt-3 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Histórico de Temas</span>
                <span className="text-[9px] bg-slate-100 px-2 rounded-full text-slate-500">{(customer.historyThemes || []).length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                {(!customer.historyThemes || customer.historyThemes.length === 0) && <span className="text-[10px] italic text-slate-300">Sem histórico de temas...</span>}
                {(customer.historyThemes || []).slice(-4).map((theme, i) => (
                    <span key={i} className="text-[9px] font-bold bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-tight">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Order History Section */}
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Últimos Pedidos</span>
                <div className="space-y-2">
                  {customerOrders.length === 0 ? (
                    <span className="text-[10px] italic text-slate-300 block">Nenhum pedido realizado.</span>
                  ) : (
                    customerOrders.slice(0, 2).map(order => (
                      <div key={order.id} className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package size={10} className="text-pink-400" />
                          <span className="font-bold text-slate-600">{format(parseISO(order.date), 'dd/MM/yy')}</span>
                        </div>
                        <span className="font-mono text-slate-500">R$ {order.totalPrice.toFixed(2)}</span>
                      <span className={order.status === 'cancelado' ? 'text-red-500 font-bold' : (order.depositPaid ? 'text-green-500 font-bold' : 'text-amber-500 font-bold')}>
                        {order.status === 'cancelado' ? 'CANC' : (order.depositPaid ? 'OK' : 'PEND')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Cliente?</h3>
              <p className="text-sm text-slate-500 mb-8">Essa ação não pode ser desfeita e removerá todos os dados deste cliente.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveCustomer}
        initialData={editingCustomer}
      />
    </div>
  );
}
