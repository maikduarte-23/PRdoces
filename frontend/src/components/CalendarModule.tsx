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
  X,
  ChefHat,
  PlusCircle,
  Filter,
  Check,
  Layers,
  AlertTriangle,
  Sparkles
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
  isToday,
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
import { useModalBehavior } from '../hooks/useModalBehavior';

type FilterType = 'all' | 'pending_deposit' | 'uber' | 'retirada';

export default function CalendarModule({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { menuProducts, dailyLimits, setDailyLimits, isLoaded } = useAppData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(!isLoaded);
  const [limitModal, setLimitModal] = useState<{isOpen: boolean, limitStr: string}>({ isOpen: false, limitStr: '' });
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  useModalBehavior(limitModal.isOpen, () => setLimitModal(prev => ({ ...prev, isOpen: false })));

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
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Agrupa os pedidos por data com filtro aplicado
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders.forEach(o => {
      if (o.status === 'cancelado' || !o.date) return;
      
      // Aplica filtros seletivos
      if (filterType === 'pending_deposit' && (o.depositPaid || o.status === 'entregue')) return;
      if (filterType === 'uber' && o.deliveryType !== 'uber') return;
      if (filterType === 'retirada' && o.deliveryType !== 'retirada') return;

      try {
        const dateStr = format(parseISO(o.date), 'yyyy-MM-dd');
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(o);
      } catch (e) {
        console.warn('Data inválida no pedido:', o);
      }
    });
    return map;
  }, [orders, filterType]);

  // Mapa de limites diários por data
  const limitsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    dailyLimits.forEach(l => { 
      map[l.date] = l.limit ?? l.maxOrders ?? PRODUCTION_DAILY_LIMIT_DEFAULT; 
    });
    return map;
  }, [dailyLimits]);

  const getOrdersForDay = (day: Date) => ordersByDate[format(day, 'yyyy-MM-dd')] || [];
  const getLimitForDay = (day: Date) => limitsByDate[format(day, 'yyyy-MM-dd')] || PRODUCTION_DAILY_LIMIT_DEFAULT;

  const togglePayment = async (order: Order) => {
    if (order.status === 'entregue') {
      toast.error('Este pedido já foi quitado.');
      return;
    }
    const updated: Order = { 
      ...order, 
      depositPaid: !order.depositPaid, 
      status: !order.depositPaid ? 'confirmado' : 'pendente' 
    };
    setOrders(orders.map(o => o.id === order.id ? updated : o));
    try {
      await api.saveOrder(updated);
      toast.success(updated.depositPaid ? 'Sinal confirmado!' : 'Sinal marcado como pendente.');
    } catch {
      toast.error('Erro ao atualizar status de pagamento!');
      fetchOrders();
    }
  };

  const markAsDelivered = async (order: Order) => {
    const updated: Order = {
      ...order,
      status: 'entregue',
      depositPaid: true
    };
    setOrders(orders.map(o => o.id === order.id ? updated : o));
    try {
      await api.saveOrder(updated);
      toast.success('Pedido concluído e entregue!');
    } catch {
      toast.error('Erro ao concluir pedido.');
      fetchOrders();
    }
  };

  const selectedDayOrders = useMemo(() => {
    return getOrdersForDay(selectedDate).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [selectedDate, ordersByDate]);

  const selectedDayLimit = getLimitForDay(selectedDate);
  const selectedDayRevenue = selectedDayOrders.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Ficha de Produção Consolidada da Cozinha para o Dia Selecionado
  const kitchenProductionSummary = useMemo(() => {
    const counts: Record<string, { label: string; quantity: number; withFlowers: number; withDecor: number }> = {};
    let totalSweets = 0;

    selectedDayOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const prod = menuProducts.find(p => p.id === item.type);
        const name = prod?.label || item.type;
        const qty = Number(item.quantity) || 0;
        totalSweets += qty;

        if (!counts[item.type]) {
          counts[item.type] = { label: name, quantity: 0, withFlowers: 0, withDecor: 0 };
        }
        counts[item.type].quantity += qty;
        if (item.flowerWrappers) counts[item.type].withFlowers += qty;
        if (item.decorationPricePerUnit > 0) counts[item.type].withDecor += qty;
      });
    });

    return {
      items: Object.values(counts).sort((a, b) => b.quantity - a.quantity),
      totalSweets
    };
  }, [selectedDayOrders, menuProducts]);

  const handleUpdateLimit = () => {
    setLimitModal({ isOpen: true, limitStr: getLimitForDay(selectedDate).toString() });
  };

  const submitNewLimit = async () => {
    const newLimit = parseInt(limitModal.limitStr, 10);
    if (isNaN(newLimit) || newLimit <= 0) {
      toast.error('Informe um limite válido maior que zero.');
      return;
    }
    setLimitModal(prev => ({ ...prev, isOpen: false }));

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingLimit = dailyLimits.find(l => l.date === dateStr);
    const limitObj: DailyLimit = {
      id: existingLimit?.id || (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2)),
      date: dateStr,
      limit: newLimit,
      maxOrders: newLimit
    };

    try {
      if (api.saveDailyLimit) await api.saveDailyLimit(limitObj);
      setDailyLimits(prev => [...prev.filter(l => l.date !== dateStr), limitObj]);
      toast.success('Capacidade diária atualizada!');
    } catch {
      toast.error('Erro ao atualizar capacidade no servidor.');
    }
  };

  const handleCreateOrderForDay = () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const draft = {
        date: dateStr,
        items: [],
        customerName: '',
        deliveryType: 'retirada'
      };
      localStorage.setItem('prdoces_budget_draft', JSON.stringify(draft));
      if (onNavigate) {
        onNavigate('orçamentos');
      } else {
        window.location.hash = '#orçamentos';
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header do Módulo com Controles e Filtros Rápidos */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
              Controle de Produção
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="text-brand-primary" size={28} />
            Agenda & Entregas
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Gerencie datas de entrega, limites de produção e fichas de confeitaria.
          </p>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start lg:self-auto">
          {[
            { id: 'all', label: 'Todos os Pedidos' },
            { id: 'pending_deposit', label: 'Aguardando Sinal' },
            { id: 'retirada', label: 'Retiradas' },
            { id: 'uber', label: 'Uber Entrega' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as FilterType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Grid Principal: Calendário (8 cols) + Painel do Dia e Ficha de Produção (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Calendário Mensal */}
        <div className="xl:col-span-8 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-sm border border-slate-100 text-brand-primary">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold text-slate-500">Carregando agendamentos...</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              {/* Controles de Navegação do Mês */}
              <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <input 
                    type="month"
                    value={format(currentMonth, 'yyyy-MM')}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month] = e.target.value.split('-');
                        setCurrentMonth(new Date(Number(year), Number(month) - 1, 1));
                      }
                    }}
                    className="text-xl md:text-2xl font-black text-slate-900 bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all uppercase"
                    title="Escolha o mês e ano"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    onClick={goToToday} 
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                  >
                    Hoje
                  </button>
                  <button 
                    onClick={prevMonth} 
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                    title="Mês Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={nextMonth} 
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                    title="Próximo Mês"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Cabeçalho dos Dias da Semana */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                  <div 
                    key={day} 
                    className={`py-3 text-center text-[10px] font-black uppercase tracking-widest ${
                      i === 0 || i === 6 ? 'text-brand-primary' : 'text-slate-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid de Dias do Calendário */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayOrders = getOrdersForDay(day);
                  const limit = getLimitForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isFull = dayOrders.length >= limit;
                  const isNearLimit = dayOrders.length >= limit - 1 && !isFull;
                  const percentFilled = Math.min(100, Math.round((dayOrders.length / limit) * 100));

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[90px] md:h-28 p-2 border-r border-b border-slate-100 flex flex-col justify-between transition-all relative text-left group ${
                        isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 opacity-40'
                      } ${
                        isSelected 
                          ? 'ring-2 ring-inset ring-brand-primary bg-pink-50/20 z-10' 
                          : 'hover:bg-pink-50/20'
                      }`}
                    >
                      {/* Topo do Dia: Número do Dia + Indicador de Lotação */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold leading-none ${
                          isToday(day) 
                            ? 'w-6 h-6 bg-brand-primary text-white flex items-center justify-center rounded-full font-black shadow-xs' 
                            : isSelected ? 'text-brand-primary font-black' : 'text-slate-700'
                        }`}>
                          {format(day, 'd')}
                        </span>

                        {isCurrentMonth && dayOrders.length > 0 && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                            isFull 
                              ? 'bg-rose-100 text-rose-700' 
                              : isNearLimit 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {dayOrders.length}/{limit}
                          </span>
                        )}
                      </div>
                      
                      {/* Lista de Pedidos no Dia */}
                      <div className="flex flex-col gap-1 w-full my-1 overflow-hidden">
                        {/* Mobile: Dots coloridos */}
                        <div className="md:hidden flex flex-wrap gap-1">
                          {dayOrders.map((o) => (
                            <div 
                              key={o.id} 
                              className={`w-2 h-2 rounded-full ${o.depositPaid ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                            />
                          ))}
                        </div>

                        {/* Desktop: Chips de Encomendas */}
                        <div className="hidden md:flex flex-col gap-1">
                          {dayOrders.slice(0, 2).map((o) => (
                            <div 
                              key={o.id} 
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold leading-tight truncate border ${
                                o.status === 'entregue'
                                  ? 'bg-slate-100 border-slate-200 text-slate-500 line-through'
                                  : o.depositPaid 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              {o.time ? `${o.time} ` : ''}{o.customerName.split(' ')[0]}
                            </div>
                          ))}
                          {dayOrders.length > 2 && (
                            <span className="text-[9px] text-brand-primary font-black pl-1">
                              +{dayOrders.length - 2} mais
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra de Progresso de Capacidade na Base */}
                      {isCurrentMonth && dayOrders.length > 0 ? (
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percentFilled}%` }}
                            className={`h-full ${
                              isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      ) : <div className="h-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Painel Detalhado do Dia Selecionado */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
            {/* Header do Dia Selecionado */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest block mb-1">
                Data Selecionada
              </span>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <span className="text-xs text-brand-primary font-bold capitalize">
                    {format(selectedDate, "eeee", { locale: ptBR })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateOrderForDay}
                  className="bg-brand-primary hover:bg-pink-700 text-white p-2.5 rounded-xl shadow-sm transition-all"
                  title="Novo Orçamento para esta data"
                >
                  <PlusCircle size={18} />
                </button>
              </div>
            </div>

            {/* Cards de Métricas do Dia (Capacidade e Faturamento) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card Capacidade */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Capacidade</span>
                  <button 
                    onClick={handleUpdateLimit}
                    className="text-slate-400 hover:text-brand-primary p-1 rounded-lg transition-colors"
                    title="Ajustar limite deste dia"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {selectedDayOrders.length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ {selectedDayLimit}</span>
                </div>
                <span className={`text-[9px] font-black uppercase mt-1 ${
                  selectedDayOrders.length >= selectedDayLimit ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {selectedDayOrders.length >= selectedDayLimit ? 'Lotação Atingida' : 'Vagas Disponíveis'}
                </span>
              </div>

              {/* Card Faturamento */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider mb-1">
                  Faturamento
                </span>
                <span className="text-base font-black text-emerald-950 font-mono">
                  R$ {selectedDayRevenue.toFixed(2)}
                </span>
                <span className="text-[9px] font-bold text-emerald-600">
                  {selectedDayOrders.length} {selectedDayOrders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
            </div>

            {/* 3. Ficha de Produção da Cozinha (Totais Agregados de Doces do Dia) */}
            <div className="bg-pink-50/60 p-4 rounded-2xl border border-pink-100/90 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat size={16} /> Ficha de Produção do Dia
                </h4>
                <span className="text-[10px] font-black bg-brand-primary text-white px-2 py-0.5 rounded-md font-mono">
                  {kitchenProductionSummary.totalSweets} doces
                </span>
              </div>

              {kitchenProductionSummary.items.length > 0 ? (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {kitchenProductionSummary.items.map((prod, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-pink-100 shadow-2xs"
                    >
                      <span className="font-bold text-slate-800 truncate pr-2">
                        {prod.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {prod.withFlowers > 0 && (
                          <span className="text-[9px] font-bold bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">
                            {prod.withFlowers} flor
                          </span>
                        )}
                        <span className="font-mono font-black text-brand-primary text-xs">
                          {prod.quantity} un
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  Nenhum doce a ser produzido nesta data.
                </p>
              )}
            </div>

            {/* 4. Lista de Encomendas / Janelas de Retirada do Dia */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Entregas & Retiradas Agendadas
              </h4>

              {selectedDayOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-slate-100">
                  Nenhuma encomenda agendada para este dia.
                </div>
              ) : (
                selectedDayOrders.map((order) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={order.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      order.status === 'entregue'
                        ? 'bg-slate-50 border-slate-200'
                        : order.depositPaid 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    {/* Cabeçalho da Encomenda */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className="text-sm font-black text-slate-900 truncate max-w-[150px]">
                          {order.customerName}
                        </h5>
                        <div className="flex items-center gap-2 text-xs font-bold mt-0.5">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock size={12} className="text-brand-primary" /> {order.time || '--:--'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            {order.deliveryType === 'retirada' ? <Package size={12} /> : <Truck size={12} />}
                            {order.deliveryType === 'retirada' ? 'Retirada' : 'Uber'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-slate-900 block">
                          R$ {Number(order.totalPrice).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => togglePayment(order)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md cursor-pointer transition-colors mt-0.5 ${
                            order.status === 'entregue'
                              ? 'bg-slate-200 text-slate-700'
                              : order.depositPaid 
                              ? 'bg-emerald-200 text-emerald-800' 
                              : 'bg-amber-200 text-amber-800'
                          }`}
                        >
                          {order.status === 'entregue' ? 'QUITADO' : order.depositPaid ? 'SINAL PAGO' : 'PENDENTE'}
                        </button>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div className="text-xs text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-xl border border-black/5">
                      {(order.items || []).map((item, idx) => {
                        const prod = menuProducts.find(p => p.id === item.type);
                        return (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="truncate">{item.quantity}x {prod?.label || item.type}</span>
                            {item.flowerWrappers && (
                              <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-1 rounded">Flor</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Ações da Encomenda */}
                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        onClick={() => setLabelOrder(order)}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 py-2 rounded-xl transition-colors"
                        title="Imprimir Etiquetas"
                      >
                        <Printer size={12} /> Etiquetas
                      </button>

                      {order.status !== 'entregue' ? (
                        <button 
                          onClick={() => markAsDelivered(order)}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2 rounded-xl transition-colors shadow-xs"
                        >
                          <Check size={12} /> Entregar
                        </button>
                      ) : (
                        <span className="flex-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 py-2 rounded-xl text-center">
                          Entregue
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Impressão de Etiquetas */}
      <LabelPrinterModal 
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        menuProducts={menuProducts}
      />

      {/* Modal para Ajuste de Capacidade Diária */}
      <AnimatePresence>
        {limitModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-lg">Capacidade do Dia</h3>
                <button 
                  onClick={() => setLimitModal(prev => ({ ...prev, isOpen: false }))} 
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Defina a quantidade máxima de encomendas para o dia <span className="font-bold text-slate-800">{format(selectedDate, 'dd/MM/yyyy')}</span>:
              </p>

              <input 
                type="number" 
                min="1"
                max="50"
                value={limitModal.limitStr}
                onChange={e => setLimitModal(prev => ({ ...prev, limitStr: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-2xl font-black text-center text-slate-900 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />

              <button 
                onClick={submitNewLimit} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-md"
              >
                Salvar Limite
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
