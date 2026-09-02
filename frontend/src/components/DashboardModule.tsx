import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart,
  Loader2,
  Printer,
  Sparkles,
  Truck,
  Wallet,
  ChefHat,
  BarChart3,
  CalendarDays,
  Check,
  Receipt
} from 'lucide-react';
import { api } from '../services/api';
import { Order, Customer, InventoryItem, MenuProduct } from '../types';
import { 
  format, 
  isToday, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  startOfDay, 
  endOfDay, 
  subDays,
  eachDayOfInterval, 
  isSameDay, 
  isWithinInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import LabelPrinterModal from './forms/LabelPrinterModal';
import { useAppData } from '../context/AppDataContext';

type PeriodFilter = 'today' | '7days' | 'month' | 'last_month';
type ChartView = 'revenue_profit' | 'production_volume' | 'cost_breakdown';

export default function DashboardModule({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { inventory, menuProducts, expenses, settings, isLoaded } = useAppData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [chartView, setChartView] = useState<ChartView>('revenue_profit');
  const [isLoading, setIsLoading] = useState(!isLoaded);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  const companyNameSys = settings.companyName || 'P.R_Doces';

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

  // Intervalo de datas selecionado
  const dateInterval = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case '7days':
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'last_month': {
        const prev = subMonths(now, 1);
        return { start: startOfMonth(prev), end: endOfMonth(prev) };
      }
      case 'month':
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  // Pedidos filtrados pelo período selecionado
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelado' || !o.date) return false;
      try {
        const orderDate = parseISO(o.date);
        return isWithinInterval(orderDate, { start: dateInterval.start, end: dateInterval.end });
      } catch {
        return false;
      }
    });
  }, [orders, dateInterval]);

  // Pedidos de Hoje (Live Tracker)
  const todayOrders = useMemo(() => {
    const today = new Date();
    return orders
      .filter(o => {
        if (o.status === 'cancelado' || !o.date) return false;
        try {
          return isSameDay(parseISO(o.date), today);
        } catch {
          return false;
        }
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [orders]);

  // Próximas encomendas a partir de hoje
  const upcomingOrders = useMemo(() => {
    const today = startOfDay(new Date());
    return orders
      .filter(o => {
        if (!o.date || o.status === 'cancelado' || o.status === 'entregue') return false;
        try {
          return parseISO(o.date) >= today;
        } catch { return false; }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [orders]);

  // Dados consolidados do período selecionado
  const { 
    totalRevenue, 
    totalCost, 
    totalUnits, 
    receivedAmount, 
    receivableAmount,
    chartData 
  } = useMemo(() => {
    const days = eachDayOfInterval({ start: dateInterval.start, end: dateInterval.end });
    
    let revenueSum = 0;
    let costSum = 0;
    let unitsSum = 0;
    let receivedSum = 0;
    let receivableSum = 0;

    const data = days.map(day => {
      const dayOrders = filteredOrders.filter(o => {
        try {
          return isSameDay(parseISO(o.date), day);
        } catch { return false; }
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
      
      let dayCost = 0;
      let dayUnits = 0;

      dayOrders.forEach(o => {
        // Cálculo de valor recebido / a receber
        if (o.status === 'entregue') {
          receivedSum += o.totalPrice;
        } else if (o.depositPaid) {
          receivedSum += o.totalPrice / 2;
          receivableSum += o.totalPrice / 2;
        } else {
          receivableSum += o.totalPrice;
        }

        (o.items || []).forEach(item => {
          dayUnits += Number(item.quantity) || 0;
          let itemCost = 0;
          const product = menuProducts.find(p => p.id === item.type);
          if (product?.recipe && product.recipe.length > 0) {
            product.recipe.forEach(r => {
              const invItem = inventory.find(i => i.id === r.inventoryId);
              if (invItem) itemCost += r.amount * (Number(invItem.unitPrice) || 0);
            });
          } else if (product) {
            const invItem = inventory.find(i => i.name.toLowerCase() === product.label.toLowerCase());
            if (invItem) itemCost += (Number(invItem.unitPrice) || 0);
          }
          dayCost += itemCost * (Number(item.quantity) || 0);
        });
      });

      revenueSum += dayRevenue;
      costSum += dayCost;
      unitsSum += dayUnits;

      const grossProfit = Math.max(0, dayRevenue - dayCost);

      return {
        date: format(day, period === 'today' ? 'HH:mm' : 'dd/MM'),
        fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
        Faturamento: dayRevenue,
        Custo: dayCost,
        'Lucro Bruto': grossProfit,
        'Doces Produzidos': dayUnits
      };
    });

    return {
      totalRevenue: revenueSum,
      totalCost: costSum,
      totalUnits: unitsSum,
      receivedAmount: receivedSum,
      receivableAmount: receivableSum,
      chartData: data
    };
  }, [dateInterval, filteredOrders, menuProducts, inventory, period]);

  // Itens com estoque baixo
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => (Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0));
  }, [inventory]);

  // Top 5 Doces Mais Vendidos no Período
  const topSellingProducts = useMemo(() => {
    const productCounts: Record<string, { qty: number; revenue: number }> = {};
    
    filteredOrders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productCounts[item.type]) {
          productCounts[item.type] = { qty: 0, revenue: 0 };
        }
        productCounts[item.type].qty += Number(item.quantity) || 0;
        productCounts[item.type].revenue += (Number(item.total) || (Number(item.quantity) * Number(item.unitPrice))) || 0;
      });
    });

    const maxQty = Math.max(...Object.values(productCounts).map(p => p.qty), 1);

    return Object.entries(productCounts)
      .map(([id, stats]) => {
        const prod = menuProducts.find(p => p.id === id);
        return {
          id,
          name: prod?.label || 'Doce Personalizado',
          quantity: stats.qty,
          revenue: stats.revenue,
          percentage: Math.round((stats.qty / maxQty) * 100)
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders, menuProducts]);

  // Cálculos financeiros finais
  const fixedExpensesTotal = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  // Se o período for mensal, deduz as despesas fixas; senão, calcula proporcional
  const appliedFixedExpenses = period === 'month' || period === 'last_month' 
    ? fixedExpensesTotal 
    : (period === '7days' ? (fixedExpensesTotal / 30) * 7 : fixedExpensesTotal / 30);

  const netProfit = totalRevenue - totalCost - appliedFixedExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(0) : '0';
  const averageTicket = filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length) : 0;

  const quickToggleDeposit = async (order: Order) => {
    const updated: Order = {
      ...order,
      depositPaid: !order.depositPaid,
      status: !order.depositPaid ? 'confirmado' : 'pendente'
    };
    setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
    try {
      await api.saveOrder(updated);
      toast.success(updated.depositPaid ? 'Sinal confirmado!' : 'Sinal marcado como pendente.');
    } catch {
      toast.error('Erro ao atualizar pagamento.');
      fetchOrders();
    }
  };

  const quickMarkDelivered = async (order: Order) => {
    const updated: Order = {
      ...order,
      status: 'entregue',
      depositPaid: true
    };
    setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
    try {
      await api.saveOrder(updated);
      toast.success('Pedido entregue e quitado!');
    } catch {
      toast.error('Erro ao concluir pedido.');
      fetchOrders();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header com Boas-Vindas, Filtro de Período e Ações Rápidas */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
              Visão Geral
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ao vivo
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Olá, {companyNameSys}!
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Aqui está o resumo da sua produção e do desempenho financeiro.
          </p>
        </div>

        {/* Filtros de Período */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7days', label: '7 Dias' },
            { id: 'month', label: 'Este Mês' },
            { id: 'last_month', label: 'Mês Passado' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === item.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Barra de Ações Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate?.('orçamentos')}
          className="flex items-center justify-center gap-2.5 p-3.5 bg-brand-primary text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand-primary/20"
        >
          <PlusCircle size={16} /> Novo Orçamento
        </button>
        <button
          onClick={() => onNavigate?.('clientes')}
          className="flex items-center justify-center gap-2.5 p-3.5 bg-white border border-slate-200 text-slate-700 hover:border-brand-primary/40 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <Users size={16} className="text-brand-primary" /> Novo Cliente
        </button>
        <button
          onClick={() => onNavigate?.('agenda')}
          className="flex items-center justify-center gap-2.5 p-3.5 bg-white border border-slate-200 text-slate-700 hover:border-brand-primary/40 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <CalendarDays size={16} className="text-blue-500" /> Ver Agenda
        </button>
        <button
          onClick={() => onNavigate?.('catálogo')}
          className="flex items-center justify-center gap-2.5 p-3.5 bg-white border border-slate-200 text-slate-700 hover:border-brand-primary/40 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <Sparkles size={16} className="text-amber-500" /> Criar Catálogo
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-brand-primary">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Atualizando dashboard...</p>
        </div>
      ) : (
        <>
          {/* 3. Grid de Métricas Principais (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Faturamento */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-colors">
                  <DollarSign size={22} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Faturamento Total
              </p>
            </motion.div>

            {/* Card 2: Lucro Líquido */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-colors">
                  <TrendingUp size={22} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                  netProfit >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {profitMargin}% margem
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Lucro Líquido Estimado
              </p>
            </motion.div>

            {/* Card 3: Ticket Médio & Volume */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-violet-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 transition-colors">
                  <Receipt size={22} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg">
                  {totalUnits} doces
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Ticket Médio por Pedido
              </p>
            </motion.div>

            {/* Card 4: Alertas de Estoque */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => onNavigate?.('estoque')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-rose-300 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  <AlertCircle size={22} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                  lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold'
                }`}>
                  {lowStockItems.length > 0 ? `${lowStockItems.length} Repor` : '100% OK'}
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'insumo' : 'insumos'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Abaixo do Mínimo
              </p>
            </motion.div>
          </div>

          {/* 4. Painel de Produção de Hoje (Destaque Principal) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Clock size={20} className="text-pink-400" />
                    Produção & Entregas de Hoje
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })} • {todayOrders.length} {todayOrders.length === 1 ? 'encomenda' : 'encomendas'}
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('agenda')}
                className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors self-start sm:self-auto"
              >
                Abrir Agenda Completa →
              </button>
            </div>

            {todayOrders.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={32} />
                <p className="font-bold text-white text-base">Nenhuma entrega agendada para hoje!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Aproveite para adiantar orçamentos, preparar insumos ou conferir o estoque.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {todayOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white/10 border border-white/10 hover:border-white/20 p-4 rounded-2xl transition-all flex flex-col justify-between gap-3 backdrop-blur-sm"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs font-black text-white truncate max-w-[160px]">
                          {order.customerName}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                          R$ {Number(order.totalPrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-300 font-medium mb-3">
                        <span className="flex items-center gap-1 font-bold text-pink-300">
                          <Clock size={12} /> {order.time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {order.deliveryType === 'retirada' ? <Package size={12} /> : <Truck size={12} />}
                          {order.deliveryType === 'retirada' ? 'Retirada' : 'Uber'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-1 border-t border-white/10 pt-2">
                        {(order.items || []).slice(0, 2).map((item, idx) => {
                          const prod = menuProducts.find(p => p.id === item.type);
                          return (
                            <div key={idx} className="flex justify-between truncate">
                              <span className="truncate">{item.quantity}x {prod?.label || item.type}</span>
                            </div>
                          );
                        })}
                        {(order.items || []).length > 2 && (
                          <span className="text-[10px] text-slate-400 italic block">
                            +{(order.items || []).length - 2} outros doces...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => setLabelOrder(order)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                        title="Imprimir Etiquetas"
                      >
                        <Printer size={12} /> Etiquetas
                      </button>
                      {order.status !== 'entregue' ? (
                        <button
                          onClick={() => quickMarkDelivered(order)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                        >
                          <Check size={12} /> Entregar
                        </button>
                      ) : (
                        <span className="flex-1 bg-white/5 text-emerald-400 text-[10px] font-bold py-2 rounded-xl text-center">
                          Entregue
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Área Principal (Gráficos + Top Doces + Próximos Pedidos) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Gráficos Interativos */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <BarChart3 size={18} className="text-brand-primary" />
                      Análise de Desempenho
                    </h3>
                    <p className="text-xs text-slate-400">
                      Métricas diárias para o período selecionado.
                    </p>
                  </div>

                  {/* Alternador de visualização do gráfico */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto">
                    <button
                      onClick={() => setChartView('revenue_profit')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        chartView === 'revenue_profit'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Faturamento & Lucro
                    </button>
                    <button
                      onClick={() => setChartView('production_volume')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        chartView === 'production_volume'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Volume (Unidades)
                    </button>
                  </div>
                </div>

                {/* Renderização do Gráfico */}
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartView === 'revenue_profit' ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          formatter={(value: number, name) => [`R$ ${value.toFixed(2)}`, name]}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                        />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="Faturamento" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="Lucro Bruto" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value} doces`, 'Produção']}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                        />
                        <Bar dataKey="Doces Produzidos" fill="#db2777" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lista de Próximas Encomendas da Semana */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar size={18} className="text-brand-primary" /> Próximas Encomendas
                  </h3>
                  <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-brand-primary hover:text-pink-700 transition-colors">
                    Ver Agenda Completa →
                  </button>
                </div>

                <div className="space-y-3">
                  {upcomingOrders.length > 0 ? upcomingOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-primary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-brand-primary border border-slate-100 shrink-0">
                          <span className="text-[9px] font-bold uppercase leading-none mb-0.5">
                            {format(parseISO(order.date), 'MMM', { locale: ptBR })}
                          </span>
                          <span className="text-base font-black leading-none">
                            {format(parseISO(order.date), 'dd')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm truncate max-w-[120px] sm:max-w-[200px]">
                            {order.customerName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                            <Clock size={12} /> {order.time}
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className={`hidden sm:inline ${order.depositPaid ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}`}>
                              {order.depositPaid ? 'SINAL PAGO' : 'AGUARDANDO SINAL'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm block whitespace-nowrap">
                            R$ {Number(order.totalPrice).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {(order.items || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} itens
                          </span>
                        </div>
                        <button 
                          onClick={() => setLabelOrder(order)}
                          className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-pink-600 bg-white hover:bg-pink-50 border border-slate-200 hover:border-pink-200 px-2 py-1 rounded-md transition-colors"
                          title="Imprimir Etiquetas"
                        >
                          <Printer size={10} /> ETIQUETAS
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 italic text-center py-6">
                      Nenhuma encomenda agendada para os próximos dias.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Top Doces + Previsão Financeira + Estoque Crítico */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card de Previsão de Caixa */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-500" /> Previsão de Caixa
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {period === 'month' ? 'Mensal' : 'Período'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Já Recebido</span>
                      <span className="text-base font-black font-mono text-emerald-900">R$ {receivedAmount.toFixed(2)}</span>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  </div>

                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">A Receber</span>
                      <span className="text-base font-black font-mono text-amber-900">R$ {receivableAmount.toFixed(2)}</span>
                    </div>
                    <Clock size={20} className="text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Top 5 Doces Mais Vendidos com Barras de Progresso */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-brand-primary" /> Top 5 Mais Vendidos
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Qtd</span>
                </div>

                <div className="space-y-4">
                  {topSellingProducts.length > 0 ? topSellingProducts.map((product, index) => (
                    <div key={product.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-700' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-pink-50 text-pink-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{product.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-brand-primary font-mono">{product.quantity}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">un</span>
                        </div>
                      </div>
                      {/* Barra de Progresso */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${product.percentage}%` }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            index === 0 ? 'bg-brand-primary' : 'bg-pink-400'
                          }`}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 italic text-center py-4">
                      Nenhuma venda registrada no período selecionado.
                    </p>
                  )}
                </div>
              </div>

              {/* Estoque Crítico */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Package size={18} className="text-rose-500" /> Insumos em Alerta
                  </h3>
                  <button
                    onClick={() => onNavigate?.('estoque')}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    Ver Tudo →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lowStockItems.length > 0 ? (
                    lowStockItems.slice(0, 4).map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs">
                        <span className="font-bold text-slate-800 truncate pr-2">{item.name}</span>
                        <span className="text-rose-600 font-black font-mono shrink-0">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                      <CheckCircle2 className="text-emerald-500 mx-auto mb-1.5" size={20} />
                      <p className="text-xs font-bold text-emerald-800">Estoque 100% regularizado!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Impressão de Etiquetas */}
      <LabelPrinterModal 
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        menuProducts={menuProducts}
      />
    </div>
  );
}
