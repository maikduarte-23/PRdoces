import { Clock, Send, MapPin, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetDeliveryFormProps {
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  deliveryType: 'retirada' | 'uber';
  setDeliveryType: (v: 'retirada' | 'uber') => void;
  capacityInfo?: {
    scheduledCount: number;
    limit: number;
    isOverLimit: boolean;
    isNearLimit: boolean;
  } | null;
}

export default function BudgetDeliveryForm({ 
  date, 
  setDate, 
  time, 
  setTime, 
  deliveryType, 
  setDeliveryType,
  capacityInfo
}: BudgetDeliveryFormProps) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900 flex items-center gap-2 text-base">
          <Clock size={18} className="text-brand-primary" />
          Dados da Entrega & Retirada
        </h3>
        {date && capacityInfo && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            capacityInfo.isOverLimit 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : capacityInfo.isNearLimit 
              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {capacityInfo.isOverLimit ? (
              <>
                <AlertTriangle size={13} className="text-rose-500" />
                <span>Agenda Lotada ({capacityInfo.scheduledCount}/{capacityInfo.limit})</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>{capacityInfo.scheduledCount} de {capacityInfo.limit} encomendas no dia</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Data Prevista
          </label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 focus:border-brand-primary outline-none transition-all" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Horário Combinado
          </label>
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 focus:border-brand-primary outline-none transition-all" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
            Modo de Logística
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setDeliveryType('retirada')} 
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                deliveryType === 'retirada' 
                  ? 'border-brand-primary bg-pink-50/80 text-brand-primary font-black shadow-xs' 
                  : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300'
              }`}
            >
              <MapPin size={20} />
              <span className="text-sm">Retirada no Local</span>
            </button>
            <button 
              type="button"
              onClick={() => setDeliveryType('uber')} 
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                deliveryType === 'uber' 
                  ? 'border-brand-primary bg-pink-50/80 text-brand-primary font-black shadow-xs' 
                  : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300'
              }`}
            >
              <Send size={20} />
              <span className="text-sm">Entrega via Uber / Entregador</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}