/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Package,
  DollarSign,
  Loader2,
  Edit2,
  Printer,
  X
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  isSaturday,
  isSunday,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';
import { Order, DailyLimit, MenuProduct } from '../types';
import { PRODUCTION_DAILY_LIMIT_DEFAULT, WORKING_HOURS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import LabelPrinterModal from './forms/LabelPrinterModal';
import { useAppData } from '../context/AppDataContext';

export default function CalendarModule() {
  const { menuProducts, dailyLimits, setDailyLimits, isLoaded } = useAppData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isLoaded);
  const [limitModal, setLimitModal] = useState<{isOpen: boolean, limitStr: string}>({ isOpen: false, limitStr: '' });
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const paginatedOrders = await api.getOrders({ limit: 9999 });
      setOrders(paginatedOrders.orders);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Otimização: Agrupa os pedidos por data apenas uma vez
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders.forEach(o => {
      if (o.status === 'cancelado') return;
      if (!o.date) return; // Ignora se não houver data
      try {
        const dateStr = format(parseISO(o.date), 'yyyy-MM-dd');
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(o);
      } catch (e) {
        console.warn('Data inválida no pedido:', o);
      }
    });
    return map;
  }, [orders]);

  // Otimização: Agrupa os limites do banco para acesso instantâneo (O(1))
  const limitsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    dailyLimits.forEach(l => { map[l.date] = l.limit; });
    return map;
  }, [dailyLimits]);

  const getOrdersForDay = (day: Date) => ordersByDate[format(day, 'yyyy-MM-dd')] || [];
  const getLimitForDay = (day: Date) => limitsByDate[format(day, 'yyyy-MM-dd')] || PRODUCTION_DAILY_LIMIT_DEFAULT;

  const togglePayment = async (order: Order) => {
    if (order.status === 'entregue') {
      toast.error('Este pedido já foi quitado. Use a aba Financeiro para alterações.');
      return;
    }
    const updated = { ...order, depositPaid: !order.depositPaid, status: !order.depositPaid ? 'confirmado' as const : 'pendente' as const };
    setOrders(orders.map(o => o.id === order.id ? updated : o)); // Atualização otimista na tela
    try {
      await api.saveOrder(updated);
      toast.success(updated.depositPaid ? 'Sinal confirmado!' : 'Sinal marcado como pendente.');
    } catch (err) {
      toast.error('Erro ao atualizar status de pagamento!');
      await fetchData(); // Reverte caso falhe
    }
  };

  const selectedDayOrders = getOrdersForDay(selectedDate);
  const selectedDayLimit = getLimitForDay(selectedDate);
  const selectedDayRevenue = selectedDayOrders.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const getWorkingHours = (date: Date) => {
    if (isSaturday(date)) return WORKING_HOURS.SATURDAY;
    if (isSunday(date)) return { start: 'Fechado', end: 'Fechado' };
    return WORKING_HOURS.WEEKDAY;
  };

  const handleUpdateLimit = () => {
    setLimitModal({ isOpen: true, limitStr: getLimitForDay(selectedDate).toString() });
  };

  const submitNewLimit = async () => {
    const newLimit = parseInt(limitModal.limitStr, 10);
    if (isNaN(newLimit) || newLimit < 0) {
      toast.error('Valor inválido!');
      return;
    }
    setLimitModal(prev => ({ ...prev, isOpen: false }));

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingLimit = dailyLimits.find(l => l.date === dateStr);
    const limitObj: DailyLimit = {
      id: existingLimit?.id || (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2)),
      date: dateStr,
      limit: newLimit
    };

    try {
      if (api.saveDailyLimit) await api.saveDailyLimit(limitObj);
      setDailyLimits(prev => [...prev.filter(l => l.date !== dateStr), limitObj]);
      toast.success('Capacidade atualizada!');
    } catch (err) {
      toast.error('Erro ao atualizar capacidade no servidor.');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Calendar Grid */}
      <div className="xl:col-span-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-sm border border-slate-100 text-pink-600">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm font-bold text-slate-500">Carregando agenda...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50">
              <div className="flex items-center">
                <input 
                  type="month"
                  value={format(currentMonth, 'yyyy-MM')}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month] = e.target.value.split('-');
                      setCurrentMonth(new Date(Number(year), Number(month) - 1, 1));
                    }
                  }}
                  className="text-xl md:text-2xl font-black text-slate-800 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all uppercase"
                  title="Escolha o mês e ano"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button onClick={goToToday} className="px-4 py-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                  Hoje
                </button>
                <button onClick={prevMonth} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={nextMonth} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-50">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-2 md:py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayOrders = getOrdersForDay(day);
                const limit = getLimitForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isFull = dayOrders.length >= limit;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] md:h-24 p-1.5 md:p-2 border-r border-b border-slate-100 flex flex-col gap-1 transition-all relative overflow-hidden ${
                      isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 grayscale opacity-40'
                    } ${isSelected ? 'ring-2 ring-inset ring-pink-500 z-10 shadow-sm' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`text-xs md:text-sm font-bold ${isSameDay(day, new Date()) ? 'w-6 h-6 md:w-7 md:h-7 bg-pink-500 text-white flex items-center justify-center rounded-full' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="flex flex-col gap-1 overflow-hidden w-full">
                      {/* Dots for mobile */}
                      <div className="md:hidden flex flex-wrap gap-0.5 mt-1">
                        {dayOrders.map((o) => (
                          <div key={o.id} className={`w-1.5 h-1.5 rounded-full ${o.depositPaid ? 'bg-green-500' : 'bg-amber-400'}`} />
                        ))}
                      </div>
                      {/* Labels for desktop */}
                      <div className="hidden md:flex flex-col gap-1">
                        {dayOrders.slice(0, 2).map((o) => (
                          <div key={o.id} className={`text-[9px] px-1.5 py-0.5 rounded border leading-none truncate w-full text-left ${o.depositPaid ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                            {o.customerName.split(' ')[0]}
                          </div>
                        ))}
                        {dayOrders.length > 2 && (
                          <span className="text-[8px] text-slate-400 font-bold ml-1 text-left">+{dayOrders.length - 2} mais...</span>
                        )}
                      </div>
                    </div>

                    {isFull && isCurrentMonth && (
                      <div className="absolute top-1.5 right-1.5">
                        <AlertCircle size={14} className="text-red-500" />
                      </div>
                    )}

                    {dayOrders.length > 0 && (
                      <span className="absolute bottom-1 right-1.5 text-[9px] font-bold text-slate-400">
                        {dayOrders.length}/{limit}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="xl:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h4 className="text-slate-400 uppercase text-[10px] font-bold mb-1 tracking-widest">Resumo do Dia</h4>
            <div className="flex justify-between items-baseline">
              <h3 className="text-xl text-slate-900">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</h3>
            </div>
          </div>

          <div className="space-y-3 mb-8">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
               <Clock className="text-blue-600" size={18} />
               <div>
                 <span className="text-[10px] uppercase font-bold text-blue-400 block">Horário de Pico</span>
                 <span className="text-sm font-bold text-blue-900">{getWorkingHours(selectedDate).start} às {getWorkingHours(selectedDate).end}</span>
               </div>
             </div>
             
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="text-slate-400" size={18} />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacidade</span>
                    <span className="text-sm font-bold text-slate-700">{selectedDayOrders.length} / {selectedDayLimit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDayOrders.length >= selectedDayLimit && (
                    <span className="bg-red-100 text-red-600 font-bold text-[10px] px-2 py-1 rounded-full uppercase">LOTADO</span>
                  )}
                  <button onClick={handleUpdateLimit} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Alterar capacidade do dia">
                    <Edit2 size={16} />
                  </button>
                </div>
             </div>

             <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
               <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                 <DollarSign size={18} />
               </div>
               <div>
                 <span className="text-[10px] uppercase font-bold text-emerald-600 block">Faturamento do Dia</span>
                 <span className="text-sm font-bold text-emerald-900">R$ {selectedDayRevenue.toFixed(2)}</span>
               </div>
             </div>
          </div>

          <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest">Janelas de Retirada</h5>
          <div className="space-y-3">
            {selectedDayOrders.length === 0 && (
              <p className="text-center py-8 text-slate-300 italic text-xs">Sem agendamentos.</p>
            )}
            {selectedDayOrders.map(order => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={order.id}
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${order.depositPaid ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${order.depositPaid ? 'text-green-900' : 'text-slate-900'}`}>{order.customerName}</span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${order.depositPaid ? 'text-green-600' : 'text-slate-500'}`}>
                      <Clock size={10} /> {order.time}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePayment(order); }}
                    className={`px-2 py-1 rounded-full text-[9px] font-bold transition-all ${order.depositPaid ? 'bg-green-200 text-green-800' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {order.depositPaid ? 'SINAL OK' : 'PENDENTE'}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="py-3 space-y-2 border-t border-black/5 mt-2">
                        {(order.items || []).map((item, idx) => {
                          const product = menuProducts.find(p => p.id === item.type);
                          const label = product ? product.label : item.type;
                          return (
                            <div key={idx} className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-600 font-medium">
                                {item.quantity}un - {label}
                              </span>
                              {item.flowerWrappers && <span className="text-[9px] bg-pink-100 text-pink-600 px-1 rounded font-bold">FLORES</span>}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/5 uppercase">
                  <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                    {order.deliveryType === 'retirada' ? <Package size={12} /> : <Truck size={12} />}
                    {order.deliveryType === 'retirada' ? 'Retirada' : 'Uber'}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLabelOrder(order); }}
                    className="ml-auto flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-pink-600 bg-slate-100 hover:bg-pink-50 px-2 py-1 rounded-md transition-colors"
                    title="Imprimir Etiquetas"
                  >
                    <Printer size={10} /> ETIQUETAS
                  </button>
                  <span className="ml-3 text-xs font-mono font-bold text-slate-700">R$ {order.totalPrice.toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <LabelPrinterModal 
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        menuProducts={menuProducts}
      />

      <AnimatePresence>
        {limitModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLimitModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-xs shadow-2xl relative overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Capacidade do Dia</h3>
                <button onClick={() => setLimitModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Defina o limite de pedidos para {format(selectedDate, 'dd/MM/yyyy')}:</p>
              <input 
                type="number" 
                value={limitModal.limitStr}
                onChange={e => setLimitModal(prev => ({ ...prev, limitStr: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-bold mb-6 text-center text-xl"
              />
              <button onClick={submitNewLimit} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                Salvar Limite
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
