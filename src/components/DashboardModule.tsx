import { useState, useEffect, useMemo } from 'react';
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
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { Order, Customer, InventoryItem, MenuProduct } from '../types';
import { format, isToday, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
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

export default function DashboardModule({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { inventory, menuProducts, expenses, settings, isLoaded } = useAppData();
  const [orders, setOrders] = useState<Order[]>([]);
  const companyNameSys = settings.companyName || 'P.R_Doces';
  const [isLoading, setIsLoading] = useState(!isLoaded);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const paginatedOrders = await api.getOrders({ limit: 9999 });
        setOrders(paginatedOrders.orders);
      } catch (err) {
        console.error('Erro ao conectar na API.', err);
        toast.error('Erro ao conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Otimização: Gera os dados do gráfico, receita, custo e contagem de hoje simultaneamente
  const { monthlyChartData, monthRevenue, monthCost, todayOrdersCount } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
    
    let revenue = 0;
    let cost = 0;
    let todayCount = 0;

    const data = daysInMonth.map(day => {
      const dayOrders = orders.filter(o => {
        if (o.status === 'cancelado') return false;
        if (!o.date) return false;
        try {
          return isSameDay(parseISO(o.date), day);
        } catch {
          return false;
        }
      });
      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
      
      let dayCost = 0;
      dayOrders.forEach(o => {
        (o.items || []).forEach(item => {
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
          dayCost += itemCost * item.quantity;
        });
      });

      revenue += dayRevenue; // Acumula de forma eficiente a receita do mês
      cost += dayCost;
      if (isToday(day)) todayCount = dayOrders.length;

      return {
        date: format(day, 'dd/MM'),
        Faturamento: dayRevenue,
        Custo: dayCost,
        'Lucro Bruto': Math.max(0, dayRevenue - dayCost) // Evita lucro negativo no gráfico
      };
    });

    return { monthlyChartData: data, monthRevenue: revenue, monthCost: cost, todayOrdersCount: todayCount };
  }, [orders, menuProducts, inventory]);

  const lowStockItems = useMemo(() => inventory.filter(item => item.quantity <= item.minQuantity), [inventory]);

  // Otimização: Busca e ordena os próximos pedidos agendados
  const upcomingOrders = useMemo(() => {
    const today = startOfDay(new Date());
    return orders
      .filter(o => {
        if (!o.date || o.status === 'entregue' || o.status === 'cancelado') return false;
        try {
          return parseISO(o.date) >= today;
        } catch { return false; }
      })
      .sort((a, b) => (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0))
      .slice(0, 4); // Pega os 4 mais próximos
  }, [orders]);

  // Otimização: Calcula os doces mais vendidos do mês atual
  const topSellingProducts = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const monthOrders = orders.filter(o => {
      if (o.status === 'cancelado' || !o.date) return false;
      try {
        const date = parseISO(o.date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      } catch { return false; }
    });

    const productCounts: Record<string, number> = {};
    monthOrders.forEach(o => {
      o.items?.forEach(item => {
        productCounts[item.type] = (productCounts[item.type] || 0) + item.quantity;
      });
    });

    return Object.entries(productCounts)
      .map(([id, quantity]) => ({ id, name: menuProducts.find(p => p.id === id)?.label || 'Doce Excluído', quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Pega apenas os Top 5
  }, [orders, menuProducts]);

  const fixedExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [expenses]);

  const netProfit = monthRevenue - monthCost - fixedExpenses;
  const profitMargin = monthRevenue > 0 ? ((netProfit / monthRevenue) * 100).toFixed(0) : 0;

  const stats = useMemo(() => [
    { 
      label: 'Faturamento Mensal', 
      value: `R$ ${monthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: <DollarSign className="text-emerald-500" />, 
      trend: '+12%',
      positive: true
    },
    { 
      label: 'Lucro Líquido (Est.)', 
      value: `R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: <TrendingUp className="text-blue-500" />, 
      trend: `${profitMargin}% margem`,
      positive: netProfit >= 0
    },
    { 
      label: 'Pedidos Hoje', 
      value: todayOrdersCount, 
      icon: <Users className="text-violet-500" />, 
      trend: '+4',
      positive: true
    },
    { 
      label: 'Alertas Estoque', 
      value: lowStockItems.length, 
      icon: <AlertCircle className="text-rose-500" />, 
      trend: lowStockItems.length > 0 ? 'Atenção' : 'OK',
      positive: lowStockItems.length === 0
    },
  ], [monthRevenue, netProfit, profitMargin, todayOrdersCount, lowStockItems.length]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 font-medium italic">Boas-vindas, {companyNameSys}!</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Sistema Online</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-brand-primary">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500">Carregando dashboard...</p>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-brand-primary/30 transition-all duration-300 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-50 group-hover:bg-brand-primary/5 rounded-2xl flex items-center justify-center transition-colors">
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Vendas do Mês</h3>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Area type="monotone" dataKey="Faturamento" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Lucro vs Custo */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Lucro Bruto vs. Custo</h3>
                <p className="text-xs text-slate-400">Análise diária de lucratividade sobre os produtos vendidos.</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} stackOffset="expand">
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: number, name) => [`R$ ${value.toFixed(2)}`, name]} />
                  <Legend iconSize={8} wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                  <Area type="monotone" dataKey="Lucro Bruto" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorProfit)" />
                  <Area type="monotone" dataKey="Custo" stackId="1" stroke="#f43f5e" strokeWidth={2} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lista de Próximos Pedidos */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar size={18} className="text-brand-primary" /> Próximos Pedidos
              </h3>
              <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-brand-primary hover:text-pink-700 transition-colors">Ver Agenda Completa</button>
            </div>
            <div className="space-y-3">
              {upcomingOrders.length > 0 ? upcomingOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-primary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-brand-primary border border-slate-100 shrink-0">
                      <span className="text-[9px] font-bold uppercase leading-none mb-0.5">{format(parseISO(order.date), 'MMM', { locale: ptBR })}</span>
                      <span className="text-base font-black leading-none">{format(parseISO(order.date), 'dd')}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate max-w-[120px] sm:max-w-[200px]">{order.customerName}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                        <Clock size={12} /> {order.time}
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className={`hidden sm:inline ${order.depositPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {order.depositPaid ? 'SINAL PAGO' : 'AGUARDANDO SINAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm block whitespace-nowrap">R$ {order.totalPrice.toFixed(2)}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{(order.items || []).reduce((acc, curr) => acc + curr.quantity, 0)} itens</span>
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
                <p className="text-sm text-slate-400 italic text-center py-6">Nenhum pedido agendado para os próximos dias.</p>
              )}
            </div>
          </div>
        </div> 

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden group">
            <PlusCircle className="absolute -right-8 -top-8 text-white/5 z-0" size={160} />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-1">Estoque Crítico</h3>
              <div className="space-y-4 pt-6">
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between p-3 rounded-2xl bg-white/10 border border-white/20 text-xs shadow-sm">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-rose-400 font-black">{item.quantity} {item.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center mt-2">
                    <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={24} />
                    <p className="text-sm font-bold text-slate-300">Estoque regularizado.</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => onNavigate?.('estoque')}
                className="w-full mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors text-center block"
              >
                Ver Estoque Completo →
              </button>
            </div>
          </div>

          {/* Produtos Mais Vendidos */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-primary" /> Top 5 Mais Vendidos
            </h3>
            <div className="space-y-4">
              {topSellingProducts.length > 0 ? topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-black text-xs shrink-0">
                    {index + 1}º
                  </div>
                  <div className="flex-1 truncate">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-brand-primary text-sm">{product.quantity}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">un</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma venda registrada este mês.</p>
              )}
            </div>
          </div>

          <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white">
             <h3 className="text-lg font-black mb-4">Novo Orçamento</h3>
             <button 
               onClick={() => onNavigate?.('orçamentos')}
               className="w-full bg-white text-brand-primary py-3 rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
             >
                Criar Agora
             </button>
          </div>
        </div>
      </div>
        </>
      )}

      <LabelPrinterModal 
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        menuProducts={menuProducts}
      />
    </div>
  );
}
