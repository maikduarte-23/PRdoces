/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PlusCircle, 
  Calculator, 
  User, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  MessageCircle, 
  Copy, 
  DollarSign, 
  X,
  Sparkles,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';
import { PRICING, DIETARY_WARNING, DELIVERY_RESIDENTIAL } from '../constants';
import { OrderItem, Order, Customer, MenuProduct, InventoryItem } from '../types';
import { api } from '../services/api';
import BudgetPreviewModal from './forms/BudgetPreviewModal';
import BudgetItemCard from './forms/BudgetItemCard';
import BudgetSidebar from './forms/BudgetSidebar';
import BudgetDeliveryForm from './forms/BudgetDeliveryForm';
import ProductQuickPicker from './forms/ProductQuickPicker';
import ConfirmModal from './forms/ConfirmModal';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';
import { isSameDay, parseISO } from 'date-fns';

const generateId = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

export default function BudgetModule() {
  const { customers, setCustomers, menuProducts, inventory, setInventory, settings, dailyLimits } = useAppData();

  // Recupera o rascunho salvo para não perder os dados ao trocar de aba
  const draft = useMemo(() => {
    try {
      const saved = localStorage.getItem('prdoces_budget_draft');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);

  const [items, setItems] = useState<OrderItem[]>(draft?.items || []);
  const [customerName, setCustomerName] = useState(draft?.customerName || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(draft?.selectedCustomerId || null);
  const [deliveryType, setDeliveryType] = useState<'retirada' | 'uber'>(draft?.deliveryType || 'retirada');
  const [notes, setNotes] = useState(draft?.notes || '');
  const [date, setDate] = useState(draft?.date || '');
  const [time, setTime] = useState(draft?.time || '');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [discount, setDiscount] = useState(draft?.discount || 0);
  const [deliveryFee, setDeliveryFee] = useState(draft?.deliveryFee ?? (settings.defaultDeliveryFee ? Number(settings.defaultDeliveryFee) : 0));
  const [editingOrderId, setEditingOrderId] = useState<string | null>(draft?.editingOrderId || null);
  const [originalItems, setOriginalItems] = useState<OrderItem[] | null>(draft?.originalItems || null);
  const [originalStatus, setOriginalStatus] = useState<string | null>(draft?.originalStatus || null);
  const [originalDepositPaid, setOriginalDepositPaid] = useState<boolean | null>(draft?.originalDepositPaid || null);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(draft?.originalCreatedAt || null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Carrega lista de pedidos para calcular capacidade da agenda na data selecionada
  useEffect(() => {
    const fetchOrdersForCapacity = async () => {
      try {
        const paginated = await api.getOrders({ limit: 9999 });
        setAllOrders(paginated.orders);
      } catch (err) {
        console.error('Erro ao carregar pedidos para verificação de capacidade:', err);
      }
    };
    fetchOrdersForCapacity();
  }, []);

  const systemSettings = {
    dietaryWarning: settings.dietaryWarning || DIETARY_WARNING,
    companyName: settings.companyName || 'P.R_Doces',
    pixKey: settings.pixKey || '',
    logo: settings.logo || null
  };

  // Salva automaticamente o rascunho sempre que algum campo for alterado
  useEffect(() => {
    localStorage.setItem('prdoces_budget_draft', JSON.stringify({ 
      items, customerName, selectedCustomerId, deliveryType, notes, date, time, discount, deliveryFee,
      editingOrderId, originalItems, originalStatus, originalDepositPaid, originalCreatedAt
    }));
  }, [items, customerName, selectedCustomerId, deliveryType, notes, date, time, discount, deliveryFee, editingOrderId, originalItems, originalStatus, originalDepositPaid, originalCreatedAt]);

  const handleSelectCustomer = (id: string) => {
    if (!id) {
      setSelectedCustomerId(null);
      setCustomerName('');
      return;
    }
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setSelectedCustomerId(customer.id);
      setCustomerName(customer.name);
    }
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    const match = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    setSelectedCustomerId(match ? match.id : null);
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Cálculo da Capacidade da Agenda na Data Selecionada
  const dateCapacityInfo = useMemo(() => {
    if (!date) return null;
    try {
      const selectedDay = parseISO(date);
      const dayOrders = allOrders.filter(o => {
        if (o.status === 'cancelado' || !o.date) return false;
        try {
          return isSameDay(parseISO(o.date), selectedDay);
        } catch { return false; }
      });

      const dayLimitConfig = (dailyLimits || []).find(l => l.date === date);
      const limit = dayLimitConfig ? dayLimitConfig.maxOrders : 5; // Padrão: 5 encomendas

      return {
        scheduledCount: dayOrders.length,
        limit: limit,
        isOverLimit: dayOrders.length >= limit,
        isNearLimit: dayOrders.length >= limit - 1 && dayOrders.length < limit
      };
    } catch {
      return null;
    }
  }, [date, allOrders, dailyLimits]);

  const resetForm = () => {
    setItems([]);
    setCustomerName('');
    setSelectedCustomerId(null);
    setNotes('');
    setDate('');
    setTime('');
    setDeliveryType('retirada');
    setDiscount(0);
    setDeliveryFee(settings.defaultDeliveryFee ? Number(settings.defaultDeliveryFee) : 0);
    setEditingOrderId(null);
    setOriginalItems(null);
    setOriginalStatus(null);
    setOriginalDepositPaid(null);
    setOriginalCreatedAt(null);
    localStorage.removeItem('prdoces_budget_draft');
    setIsConfirmResetOpen(false);
    toast.success('Rascunho limpo!');
  };

  const scheduleOrder = async () => {
    if (!customerName || !date || !time) return;

    let finalCustomerId = selectedCustomerId;
    let newCustomerToSave: Customer | null = null;
    let existingCustomerToUpdate: Customer | null = null;

    // 1. Definição do Cliente a salvar
    if (!finalCustomerId) {
      newCustomerToSave = {
        id: generateId(),
        name: customerName,
        phone: '',
        dietaryRestrictions: '',
        historyThemes: notes ? [notes] : []
      };
      
      setCustomers(prev => [...prev, newCustomerToSave!]); 
      finalCustomerId = newCustomerToSave.id;
    } else if (notes) {
      // Atualiza o histórico de temas do cliente existente
      const customer = customers.find(c => c.id === finalCustomerId);
      if (customer && !(customer.historyThemes || []).includes(notes)) {
         existingCustomerToUpdate = { ...customer, historyThemes: [...(customer.historyThemes || []), notes] };
         setCustomers(prev => prev.map(c => c.id === existingCustomerToUpdate!.id ? existingCustomerToUpdate! : c));
      }
    }

    // 2. Criação do Pedido
    const newOrder: Order = {
      id: editingOrderId || generateId(),
      customerId: finalCustomerId || 'anonymous',
      customerName,
      createdAt: originalCreatedAt || new Date().toISOString(),
      date: new Date(date + 'T12:00:00').toISOString(),
      time,
      deliveryType,
      items,
      totalPrice: total,
      depositPaid: originalDepositPaid ?? false,
      notes: notes,
      status: (originalStatus as any) ?? 'pendente'
    };
    
    // 3. Dedução Consolidada de Estoque
    let currentInventory = [...inventory];
    const inventoryToUpdate = new Set<string>();

    // Estorno do estoque do pedido antigo (se for edição e não estava cancelado)
    if (editingOrderId && originalItems && originalStatus !== 'cancelado') {
      for (const oldItem of originalItems) {
        const product = menuProducts.find(p => p.id === oldItem.type);
        if (product) {
          if (product.recipe && product.recipe.length > 0) {
            for (const rItem of product.recipe) {
              const invIndex = currentInventory.findIndex(i => i.id === rItem.inventoryId);
              if (invIndex >= 0) {
                const totalRestore = rItem.amount * oldItem.quantity;
                currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: currentInventory[invIndex].quantity + totalRestore };
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

    // Só deduz se o pedido não estiver sendo salvo como cancelado
    if (newOrder.status !== 'cancelado') {
      for (const item of items) {
        const product = menuProducts.find(p => p.id === item.type);
        
        if (product) {
          if (product.recipe && product.recipe.length > 0) {
            for (const rItem of product.recipe) {
              const invIndex = currentInventory.findIndex(i => i.id === rItem.inventoryId);
              if (invIndex >= 0) {
                const totalDeduction = rItem.amount * item.quantity;
                currentInventory[invIndex] = { ...currentInventory[invIndex], quantity: Math.max(0, currentInventory[invIndex].quantity - totalDeduction) };
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
    setInventory(currentInventory);

    // 4. Sincronização com API
    const isEditing = !!editingOrderId;
    try {
      const syncPromises: Promise<any>[] = [];
      
      if (newCustomerToSave) syncPromises.push(api.saveCustomer(newCustomerToSave));
      if (existingCustomerToUpdate) syncPromises.push(api.saveCustomer(existingCustomerToUpdate));
      syncPromises.push(api.saveOrder(newOrder));
      itemsToSync.forEach(item => syncPromises.push(api.saveInventoryItem(item)));

      await Promise.all(syncPromises);
      toast.success(isEditing ? 'Pedido atualizado com sucesso!' : 'Pedido agendado com sucesso!');
    } catch (err) {
      console.error('Erro na sincronização com servidor:', err);
      toast.error('Erro ao salvar no servidor.');
    }

    setShowOrderSuccess(true);
    resetForm();
    setTimeout(() => setShowOrderSuccess(false), 3000);
  };

  const addItem = (id: string) => {
    const product = menuProducts.find(p => p.id === id);
    if (!product) return;
    
    // Se o item já existir no orçamento, incrementa a quantidade
    const existingIndex = items.findIndex(i => i.type === id);
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + product.minQty;
      updateItem(existing.id, { quantity: newQty });
      toast.success(`+${product.minQty} un adicionadas a ${product.label}!`);
      return;
    }

    const unitPrice = product.isByHundred ? product.price / 100 : product.price;
    
    const newItem: OrderItem = {
      id: generateId(),
      type: id,
      quantity: product.minQty,
      unitPrice: unitPrice,
      decorationPricePerUnit: 0,
      flowerWrappers: false,
      flowerWrapperPrice: PRICING.FLOWER_WRAPPERS.MIN,
      total: product.minQty * unitPrice
    };
    setItems([...items, newItem]);
    toast.success(`${product.label} adicionado ao orçamento!`);
  };

  const updateItem = (id: string, updates: Partial<OrderItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        const baseTotal = updated.quantity * updated.unitPrice;
        const decorationTotal = updated.decorationPricePerUnit * updated.quantity;
        const wrapperTotal = updated.flowerWrappers ? updated.flowerWrapperPrice : 0;
        updated.total = baseTotal + decorationTotal + wrapperTotal;
        return updated;
      }
      return item;
    }));
  };

  const confirmRemoveItem = (id: string) => {
    setItemToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleRemoveItem = () => {
    if (itemToDelete) {
      setItems(items.filter(i => i.id !== itemToDelete));
      setIsConfirmDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  const subtotal = useMemo(() => items.reduce((acc, curr) => acc + curr.total, 0), [items]);
  const total = useMemo(() => Math.max(0, subtotal + deliveryFee - discount), [subtotal, deliveryFee, discount]);
  const deposit = useMemo(() => total * 0.5, [total]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Principal: Seletor de Doces, Itens e Dados de Entrega */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Principal: Itens do Orçamento */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-black text-slate-900 flex items-center text-lg">
                  <span className="bg-pink-100 text-brand-primary p-1.5 rounded-xl mr-2.5 text-sm">
                    ✨
                  </span>
                  Itens do Orçamento
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {items.length} {items.length === 1 ? 'doce adicionado' : 'doces adicionados'}
                </p>
              </div>

              <div className="w-full sm:w-64">
                <select 
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addItem(e.target.value);
                  }}
                  className="w-full bg-brand-primary text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer shadow-md shadow-brand-primary/20 transition-all text-center appearance-none"
                >
                  <option value="">+ Selecionar Doce...</option>
                  {[...menuProducts].sort((a,b) => a.label.localeCompare(b.label)).map((product) => (
                    <option key={product.id} value={product.id} className="text-slate-800 font-medium bg-white">
                      {product.label} (R$ {product.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seletor Visual com Busca Rápida e Categorias */}
            <ProductQuickPicker 
              products={menuProducts} 
              onSelectProduct={addItem} 
            />

            {/* Alerta de Restrição Alimentar do Cliente Selecionado */}
            {selectedCustomer?.dietaryRestrictions && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800">
                <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-black block uppercase tracking-wider text-[10px]">Alerta de Restrição Alimentar:</span>
                  <span className="font-bold">{selectedCustomer.name} possui restrição a "{selectedCustomer.dietaryRestrictions}".</span>
                </div>
              </div>
            )}

            {/* Lista de Itens do Orçamento */}
            <div className="space-y-3.5">
              {items.length === 0 && (
                <div className="text-center py-14 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <ShoppingBag className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="font-bold text-slate-700 text-sm">Seu orçamento está vazio</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecione um doce no menu acima ou busque pelo cardápio visual.
                  </p>
                </div>
              )}

              {items.map((item) => (
                <BudgetItemCard 
                  key={item.id} 
                  item={item} 
                  product={menuProducts.find(p => p.id === item.type)} 
                  updateItem={updateItem} 
                  onRemove={confirmRemoveItem} 
                />
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 italic flex items-center gap-2 border border-slate-100">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span>Aviso Padrão: "{systemSettings.dietaryWarning}"</span>
            </div>
          </section>

          {/* Dados de Logística e Entrega */}
          <BudgetDeliveryForm
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            capacityInfo={dateCapacityInfo}
          />
        </div>

        {/* Coluna Lateral: Resumo Financeiro, Cliente e Ações */}
        <div className="lg:col-span-4 space-y-6">
          <BudgetSidebar 
            items={items}
            subtotal={subtotal}
            total={total}
            deposit={deposit}
            deliveryFee={deliveryFee}
            setDeliveryFee={setDeliveryFee}
            discount={discount}
            setDiscount={setDiscount}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            handleSelectCustomer={handleSelectCustomer}
            customerName={customerName}
            setCustomerName={handleCustomerNameChange}
            notes={notes}
            setNotes={setNotes}
            editingOrderId={editingOrderId}
            resetForm={() => setIsConfirmResetOpen(true)}
            onOpenMessageModal={() => setIsMessageModalOpen(true)}
            onSchedule={scheduleOrder}
            showOrderSuccess={showOrderSuccess}
            isScheduleDisabled={items.length === 0 || !customerName || !date || !time}
            pixKey={systemSettings.pixKey}
          />
        </div>
      </div>
      
      {/* Modal de Confirmação para Remover Doce */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleRemoveItem}
        title="Remover Doce?"
        description="Essa ação removerá este doce do orçamento atual."
        confirmText="Sim, Remover"
      />

      {/* Modal de Confirmação para Limpar Rascunho */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        onConfirm={resetForm}
        title="Limpar Orçamento?"
        description="Tem certeza de que deseja apagar os dados do orçamento atual e começar um novo?"
        confirmText="Sim, Limpar"
      />

      {/* Modal de Prévia e Envio do Orçamento */}
      <BudgetPreviewModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        customerName={customerName}
        customerPhone={selectedCustomer?.phone}
        date={date}
        time={time}
        items={items}
        menuProducts={menuProducts}
        subtotal={subtotal}
        total={total}
        deposit={deposit}
        deliveryFee={deliveryFee}
        discount={discount}
        deliveryType={deliveryType}
        companyName={systemSettings.companyName}
        pixKey={systemSettings.pixKey}
        logo={systemSettings.logo}
        dietaryWarning={systemSettings.dietaryWarning}
      />
    </>
  );
}
