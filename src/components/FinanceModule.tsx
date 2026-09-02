import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Wallet,
  Receipt,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  Download,
  Loader2,
  X,
  Package,
  Printer,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Order, Customer, MenuProduct, InventoryItem, OrderItem } from '../types';
import { PRICING } from '../constants';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReceiptModal from './forms/ReceiptModal';
import LabelPrinterModal from './forms/LabelPrinterModal';
import toast from 'react-hot-toast';
import FinanceOrderCard from './FinanceOrderCard';
import PaginationControls from './forms/PaginationControls';
import BudgetItemCard from './forms/BudgetItemCard';

export default function FinanceModule({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useState<'recebimentos' | 'despesas'>('recebimentos');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'waiting_deposit' | 'pending_final' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 9;
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [summary, setSummary] = useState({ totalReceivable: 0, totalReceived: 0, expectedTotal: 0 });
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'P.R_Doces',
    logo: null as string | null,
  });
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [quickEditOrder, setQuickEditOrder] = useState<Order | null>(null);
  const [quickEditFormData, setQuickEditFormData] = useState({
    customerName: '',
    date: '',
    time: '',
    deliveryType: 'retirada' as 'retirada' | 'uber',
    notes: '',
    deliveryFee: 0,
    discount: 0,
    status: 'pendente' as 'pendente' | 'confirmado' | 'entregue' | 'cancelado',
    items: [] as OrderItem[]
  });

  const [expenses, setExpenses] = useState<{id: string, description: string, amount: number}[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('');

  // Busca os dados paginados, com filtros e busca
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Apenas os pedidos são paginados. O resto é carregado uma vez.
      const [paginatedOrders, summaryData, customersData, menuData, expensesData, settingsData, invData] = await Promise.all([
        api.getOrders({ page: currentPage, limit: itemsPerPage, search, filter }),
        api.getOrderSummary ? api.getOrderSummary() : Promise.resolve(summary),
        customers.length === 0 ? api.getCustomers() : Promise.resolve(customers),
        menuProducts.length === 0 ? api.getMenuProducts() : Promise.resolve(menuProducts),
        api.getExpenses ? api.getExpenses() : Promise.resolve([]),
        // Carrega as configurações apenas na primeira vez
        systemSettings.logo === null ? api.getSettings() : Promise.resolve(systemSettings),
        api.getInventory()
      ]);
      setOrders(paginatedOrders.orders);
      setTotalPages(Math.ceil(paginatedOrders.totalCount / itemsPerPage));
      setSummary(summaryData);
      if (settingsData.companyName) {
        setSystemSettings({ companyName: settingsData.companyName, logo: settingsData.logo });
      }
      if (customers.length === 0) setCustomers(customersData);
      if (menuProducts.length === 0) setMenuProducts(menuData);
      setExpenses(expensesData);
      setInventory(invData);
    } catch (err) {
      console.error('Erro na API', err);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reseta para a primeira página ao mudar o filtro ou a busca
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [search, filter]);


  // Ações de Pagamento
  const toggleDeposit = async (order: Order) => {
    const updated = { 
      ...order, 
      depositPaid: !order.depositPaid, 
      status: !order.depositPaid ? 'confirmado' as const : 'pendente' as const 
    };
    setOrders(orders.map(o => o.id === order.id ? updated : o));
    try { // A otimização aqui é não refazer o fetch da lista toda
      await api.saveOrder(updated);
      toast.success('Sinal dado baixa com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar pagamento no servidor.');
      await fetchData();
    }
  };

  const markAsFullyPaid = useCallback(async (order: Order) => {
    // Assumimos que "Entregue" significa que o pagamento final foi realizado
    const isCompleting = order.status !== 'entregue';
    const updated = { 
      ...order, 
      status: isCompleting ? 'entregue' as const : 'confirmado' as const,
      depositPaid: true // Garante que o sinal consta como pago se foi quitado
    };
    setOrders(orders.map(o => o.id === order.id ? updated : o));
    try { // A otimização aqui é não refazer o fetch da lista toda
      await api.saveOrder(updated);
      toast.success('Pedido quitado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar pagamento no servidor.');
      await fetchData();
    }
  }, [fetchData, orders]);

  const confirmDelete = useCallback((id: string) => {
    setOrderToDelete(id);
    setIsConfirmDeleteOpen(true);
  }, []);

  const handleDelete = async () => {
    if (orderToDelete) {
      const order = orders.find(o => o.id === orderToDelete);
      let currentInventory = [...inventory];
      const inventoryToUpdate = new Set<string>();

      // Se o pedido não estava cancelado, devolve os itens ao estoque
      if (order && order.status !== 'cancelado') {
        for (const oldItem of order.items || []) {
          const product = menuProducts.find(p => p.id === oldItem.type);
          if (product) {
            if (product.recipe && product.recipe.length > 0) {
              for (const rItem of product.recipe) {
                const invIndex = currentInventory.findIndex(i => i.id === rItem.inventoryId);
                if (invIndex >= 0) {
                  currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: currentInventory[invIndex].quantity + (rItem.amount * oldItem.quantity) };
                  inventoryToUpdate.add(currentInventory[invIndex].id);
                }
              }
            } else {
              const invIndex = currentInventory.findIndex(i => i.name.toLowerCase() === product.label.toLowerCase());
              if (invIndex >= 0) {
                currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: currentInventory[invIndex].quantity + oldItem.quantity };
                inventoryToUpdate.add(currentInventory[invIndex].id);
              }
            }
          }
          if (oldItem.flowerWrappers) {
             const fIndex = currentInventory.findIndex(i => i.name.toLowerCase().includes('forminha') || i.name.toLowerCase().includes('caixeta'));
             if (fIndex >= 0) {
                currentInventory[fIndex] = { ...currentInventory[fIndex], quantity: currentInventory[fIndex].quantity + oldItem.quantity };
                inventoryToUpdate.add(currentInventory[fIndex].id);
             }
          }
        }
      }

      const itemsToSync = currentInventory.filter(i => inventoryToUpdate.has(i.id));

      try {
        const syncPromises: Promise<any>[] = [api.deleteOrder(orderToDelete)];
        itemsToSync.forEach(item => syncPromises.push(api.saveInventoryItem(item)));
        await Promise.all(syncPromises);
        
        setInventory(currentInventory);
        setOrders(orders.filter(o => o.id !== orderToDelete));
        setIsConfirmDeleteOpen(false);
        setOrderToDelete(null);
        toast.success('Pedido excluído e estoque devolvido com sucesso!');
      } catch (err) {
        toast.error('Erro ao excluir pedido no servidor!');
      }
    }
  };

  const openQuickEdit = useCallback((order: Order) => {
    const subtotal = (order.items || []).reduce((acc, curr) => acc + curr.total, 0);
    let fee = 0;
    let disc = 0;
    const diff = order.totalPrice - subtotal;
    if (diff > 0.01) fee = diff;
    else if (diff < -0.01) disc = Math.abs(diff);

    const dateStr = order.date ? (order.date.includes('T') ? order.date.split('T')[0] : order.date.substring(0, 10)) : '';

    setQuickEditFormData({
      customerName: order.customerName,
      date: dateStr,
      time: order.time || '',
      deliveryType: order.deliveryType || 'retirada',
      notes: order.notes || '',
      deliveryFee: fee,
      discount: disc,
      status: (order.status as any) || 'pendente',
      items: order.items || []
    });
    setQuickEditOrder(order);
  }, []);

  const handleAddItem = (productId: string) => {
    const product = menuProducts.find(p => p.id === productId);
    if (!product) return;
    const unitPrice = product.isByHundred ? product.price / 100 : product.price;
    const newItem: OrderItem = {
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: productId,
      quantity: product.minQty,
      unitPrice: unitPrice,
      decorationPricePerUnit: 0,
      flowerWrappers: false,
      flowerWrapperPrice: PRICING?.FLOWER_WRAPPERS?.MIN || 0,
      total: product.minQty * unitPrice
    };
    setQuickEditFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleUpdateItem = (id: string, updates: Partial<OrderItem>) => {
    setQuickEditFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          const baseTotal = updated.quantity * updated.unitPrice;
          const decorationTotal = updated.decorationPricePerUnit * updated.quantity;
          const wrapperTotal = updated.flowerWrappers ? updated.flowerWrapperPrice : 0;
          updated.total = baseTotal + decorationTotal + wrapperTotal;
          return updated;
        }
        return item;
      })
    }));
  };

  const handleRemoveItem = (id: string) => {
    setQuickEditFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditOrder) return;
    
    const subtotal = quickEditFormData.items.reduce((acc, curr) => acc + curr.total, 0);
    const newTotal = Math.max(0, subtotal + quickEditFormData.deliveryFee - quickEditFormData.discount);

    const newStatus = quickEditFormData.status;
    const newDepositPaid = newStatus === 'entregue' || newStatus === 'confirmado' ? true : (newStatus === 'pendente' ? false : quickEditOrder.depositPaid);

    const updatedOrder = {
      ...quickEditOrder,
      customerName: quickEditFormData.customerName,
      date: quickEditFormData.date ? new Date(quickEditFormData.date + 'T12:00:00').toISOString() : quickEditOrder.date,
      time: quickEditFormData.time,
      deliveryType: quickEditFormData.deliveryType,
      notes: quickEditFormData.notes,
      totalPrice: newTotal,
      status: newStatus,
      depositPaid: newDepositPaid,
      items: quickEditFormData.items
    };

    // Estorno do estoque antigo e dedução do estoque novo
    let currentInventory = [...inventory];
    const inventoryToUpdate = new Set<string>();

    // Só estorna se o pedido anterior NÃO estava cancelado
    if (quickEditOrder.status !== 'cancelado') {
      for (const oldItem of quickEditOrder.items || []) {
        const product = menuProducts.find(p => p.id === oldItem.type);
        if (product) {
          if (product.recipe && product.recipe.length > 0) {
            for (const rItem of product.recipe) {
              const invIndex = currentInventory.findIndex(i => i.id === rItem.inventoryId);
              if (invIndex >= 0) {
                currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: currentInventory[invIndex].quantity + (rItem.amount * oldItem.quantity) };
                inventoryToUpdate.add(currentInventory[invIndex].id);
              }
            }
          } else {
            const invIndex = currentInventory.findIndex(i => i.name.toLowerCase() === product.label.toLowerCase());
            if (invIndex >= 0) {
              currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: currentInventory[invIndex].quantity + oldItem.quantity };
              inventoryToUpdate.add(currentInventory[invIndex].id);
            }
          }
        }
        if (oldItem.flowerWrappers) {
           const fIndex = currentInventory.findIndex(i => i.name.toLowerCase().includes('forminha') || i.name.toLowerCase().includes('caixeta'));
           if (fIndex >= 0) {
              currentInventory[fIndex] = { ...currentInventory[fIndex], quantity: currentInventory[fIndex].quantity + oldItem.quantity };
              inventoryToUpdate.add(currentInventory[fIndex].id);
           }
        }
      }
    }

    // Só deduz se o novo status NÃO for cancelado
    if (updatedOrder.status !== 'cancelado') {
      for (const item of quickEditFormData.items) {
        const product = menuProducts.find(p => p.id === item.type);
        if (product) {
          if (product.recipe && product.recipe.length > 0) {
            for (const rItem of product.recipe) {
              const invIndex = currentInventory.findIndex(i => i.id === rItem.inventoryId);
              if (invIndex >= 0) {
                currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: Math.max(0, currentInventory[invIndex].quantity - (rItem.amount * item.quantity)) };
                inventoryToUpdate.add(currentInventory[invIndex].id);
              }
            }
          } else {
            const invIndex = currentInventory.findIndex(i => i.name.toLowerCase() === product.label.toLowerCase());
            if (invIndex >= 0) {
              currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: Math.max(0, currentInventory[invIndex].quantity - item.quantity) };
              inventoryToUpdate.add(currentInventory[invIndex].id);
            }
          }
        }
        if (item.flowerWrappers) {
           const fIndex = currentInventory.findIndex(i => i.name.toLowerCase().includes('forminha') || i.name.toLowerCase().includes('caixeta'));
           if (fIndex >= 0) {
              currentInventory[fIndex] = { ...currentInventory[fIndex], quantity: Math.max(0, currentInventory[fIndex].quantity - item.quantity) };
              inventoryToUpdate.add(currentInventory[fIndex].id);
           }
        }
      }
    }
    
    const itemsToSync = currentInventory.filter(i => inventoryToUpdate.has(i.id));

    try {
      const syncPromises: Promise<any>[] = [api.saveOrder(updatedOrder)];
      itemsToSync.forEach(item => syncPromises.push(api.saveInventoryItem(item)));
      
      await Promise.all(syncPromises);
      
      setInventory(currentInventory);
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      toast.success('Pedido atualizado com sucesso!');
      setQuickEditOrder(null);
    } catch(err) {
      toast.error('Erro ao atualizar pedido no servidor.');
    }
  };

  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return 'Sem data';
    try {
      return format(parseISO(dateString), "dd/MM/yy");
    } catch (e) {
      return 'Data Inválida';
    }
  };

  const getPaymentStatus = (order: Order) => {
    if (order.status === 'entregue') return { label: 'Quitado', color: 'bg-emerald-100 text-emerald-700', progress: 100 };
    if (order.depositPaid) return { label: 'Sinal Pago (50%)', color: 'bg-blue-100 text-blue-700', progress: 50 };
    return { label: 'Aguardando Sinal', color: 'bg-amber-100 text-amber-700', progress: 0 };
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Financeiro</h2>
          <p className="text-slate-500 font-medium">Controle de pagamentos, recebimentos e despesas fixas.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('recebimentos')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'recebimentos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recebimentos
          </button>
          <button 
            onClick={() => setActiveTab('despesas')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'despesas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Despesas Fixas
          </button>
        </div>
      </div>

      {activeTab === 'recebimentos' ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-slate-100 p-4 rounded-2xl text-slate-600">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Previsto</p>
            <h4 className="text-2xl font-black text-slate-900">R$ {summary.expectedTotal.toFixed(2)}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-50" />
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 relative z-10">
            <Wallet size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase font-bold text-emerald-600">Já Recebido</p>
            <h4 className="text-2xl font-black text-emerald-900">R$ {summary.totalReceived.toFixed(2)}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-transparent opacity-50" />
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600 relative z-10">
            <AlertCircle size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase font-bold text-amber-600">Falta Receber</p>
            <h4 className="text-2xl font-black text-amber-900">R$ {summary.totalReceivable.toFixed(2)}</h4>
          </div>
        </div>
      </div>

      {/* Controles de Filtro e Busca */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'waiting_deposit', label: 'Sinal Pendente' },
            { id: 'pending_final', label: 'Restante Pendente' },
            { id: 'completed', label: 'Quitados' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-11 pr-4 py-2.5 text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Carregando dados financeiros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Lista de Pagamentos */}
          {orders.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 italic text-sm">
              Nenhum pedido encontrado com este filtro.
            </div>
          )}
          
          {orders.map(order => (
            <FinanceOrderCard
              key={order.id}
              order={order}
              status={getPaymentStatus(order)}
              safeFormatDate={safeFormatDate}
              onQuickEdit={openQuickEdit}
              onPrintLabel={setLabelOrder}
              onDownloadReceipt={setReceiptOrder}
              onDelete={confirmDelete}
              onToggleDeposit={toggleDeposit}
              onMarkAsPaid={markAsFullyPaid}
            />
          ))}
        </div>
      )}
      
      {totalPages > 1 && !isLoading && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="bg-rose-100 p-4 rounded-2xl text-rose-600 shrink-0">
                 <TrendingDown size={24} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Total de Despesas Fixas</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Custo mensal base</p>
               </div>
             </div>
             <div className="text-2xl font-black text-rose-600 bg-rose-50 px-6 py-3 rounded-2xl font-mono">
               R$ {expenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Adicionar Nova Despesa</h3>
            <div className="flex flex-col sm:flex-row gap-4">
               <input type="text" placeholder="Descrição (Ex: Energia, Aluguel, MEI)" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none" />
               <div className="relative sm:w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">R$</span>
                  <input type="number" placeholder="0.00" value={newExpenseAmount} onChange={e => setNewExpenseAmount(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none" />
               </div>
               <button onClick={async () => {
                 if (!newExpenseDesc || !newExpenseAmount) return toast.error('Preencha a descrição e o valor!');
                 const newExp = { id: window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2), description: newExpenseDesc, amount: Number(newExpenseAmount) };
                 try {
                   if (api.saveExpense) await api.saveExpense(newExp);
                   setExpenses([...expenses, newExp]);
                   setNewExpenseDesc('');
                   setNewExpenseAmount('');
                   toast.success('Despesa adicionada com sucesso!');
                 } catch (e) {
                   toast.error('Erro ao salvar despesa.');
                 }
               }} className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl hover:scale-105 transition-all shrink-0">Adicionar</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Descrição da Despesa</th>
                     <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest text-right">Valor (R$)</th>
                     <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest text-right w-20">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {expenses.length === 0 && (
                     <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic text-sm">Nenhuma despesa fixa cadastrada.</td></tr>
                   )}
                   {expenses.map(exp => (
                     <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 font-bold text-slate-900">{exp.description}</td>
                       <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">R$ {exp.amount.toFixed(2)}</td>
                       <td className="px-6 py-4 text-right">
                         <button onClick={async () => {
                           try {
                             if (api.deleteExpense) await api.deleteExpense(exp.id);
                             setExpenses(expenses.filter(e => e.id !== exp.id));
                             toast.success('Despesa excluída!');
                           } catch (e) {
                             toast.error('Erro ao excluir despesa.');
                           }
                         }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir">
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Pedido?</h3>
              <p className="text-sm text-slate-500 mb-8">Essa ação não pode ser desfeita. Os insumos deste pedido <b>serão devolvidos automaticamente</b> ao estoque.</p>
              
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

      {/* Quick Edit Modal */}
      <AnimatePresence>
        {quickEditOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickEditOrder(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <h3 className="text-xl font-bold text-slate-900">Editar Pedido</h3>
                 <button onClick={() => setQuickEditOrder(null)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-5">
                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nome do Cliente</label>
                   <input type="text" value={quickEditFormData.customerName} onChange={e => setQuickEditFormData({...quickEditFormData, customerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Data Prevista</label>
                     <input type="date" value={quickEditFormData.date} onChange={e => setQuickEditFormData({...quickEditFormData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Horário</label>
                     <input type="time" value={quickEditFormData.time} onChange={e => setQuickEditFormData({...quickEditFormData, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Taxa de Entrega (R$)</label>
                     <input type="number" step="0.01" min="0" value={quickEditFormData.deliveryFee === 0 ? '' : quickEditFormData.deliveryFee} onChange={e => setQuickEditFormData({...quickEditFormData, deliveryFee: Number(e.target.value)})} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Desconto (R$)</label>
                     <input type="number" step="0.01" min="0" value={quickEditFormData.discount === 0 ? '' : quickEditFormData.discount} onChange={e => setQuickEditFormData({...quickEditFormData, discount: Number(e.target.value)})} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Logística / Entrega</label>
                     <select value={quickEditFormData.deliveryType} onChange={e => setQuickEditFormData({...quickEditFormData, deliveryType: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none">
                       <option value="retirada">Retirada Local</option>
                       <option value="uber">Uber Entrega</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Status do Pedido</label>
                     <select value={quickEditFormData.status} onChange={e => setQuickEditFormData({...quickEditFormData, status: e.target.value as any})} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none font-bold ${quickEditFormData.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                       <option value="pendente">Pendente (Sem Sinal)</option>
                       <option value="confirmado">Confirmado (Sinal Pago)</option>
                       <option value="entregue">Quitado / Entregue</option>
                       <option value="cancelado">🚨 Cancelado</option>
                     </select>
                   </div>
                   {quickEditFormData.status === 'cancelado' && (
                     <div className="col-span-2 -mt-2">
                       <p className="text-[10px] text-emerald-600 font-medium leading-tight">
                         O estoque dos itens deste pedido será devolvido automaticamente ao salvar o cancelamento.
                       </p>
                     </div>
                   )}
                 </div>

                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Anotações / Tema</label>
                   <textarea value={quickEditFormData.notes} onChange={e => setQuickEditFormData({...quickEditFormData, notes: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none resize-none" />
                 </div>

                 <div className="pt-4 mt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-400 uppercase block">Itens do Pedido</label>
                      <select 
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleAddItem(e.target.value);
                        }}
                        className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="">+ Adicionar Doce</option>
                        {[...menuProducts].sort((a,b) => a.label.localeCompare(b.label)).map((product) => (
                          <option key={product.id} value={product.id}>{product.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {quickEditFormData.items.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl">Nenhum item no pedido.</p>
                      )}
                      {quickEditFormData.items.map(item => (
                        <BudgetItemCard 
                          key={item.id} 
                          item={item} 
                          product={menuProducts.find(p => p.id === item.type)} 
                          updateItem={handleUpdateItem} 
                          onRemove={handleRemoveItem} 
                        />
                      ))}
                    </div>
                    <div className="mt-3 text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase mr-2">Subtotal Doces:</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        R$ {quickEditFormData.items.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                      </span>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                 <button onClick={() => setQuickEditOrder(null)} className="w-1/3 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
                 <button onClick={handleSaveQuickEdit} className="w-2/3 bg-slate-900 text-white py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">Salvar Alterações</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReceiptModal 
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
        customer={receiptOrder ? customers.find(c => c.id === receiptOrder.customerId) || null : null}
        companyName={systemSettings.companyName}
        logo={systemSettings.logo}
      />

      <LabelPrinterModal 
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        menuProducts={menuProducts}
      />
    </div>
  );
}