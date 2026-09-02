import { Clock, Send, MapPin } from 'lucide-react';

interface BudgetDeliveryFormProps {
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  deliveryType: 'retirada' | 'uber';
  setDeliveryType: (v: 'retirada' | 'uber') => void;
}

export default function BudgetDeliveryForm({ date, setDate, time, setTime, deliveryType, setDeliveryType }: BudgetDeliveryFormProps) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Clock size={18} className="text-pink-600" />
        Dados da Entrega & Retirada
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data Prevista</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Horário</label>
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/20" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Modo de Logística</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => setDeliveryType('retirada')} className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${deliveryType === 'retirada' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-100 bg-slate-50 text-slate-500 opacity-60'}`}>
              <MapPin size={20} />
              <span className="text-sm font-bold">Retirada Local</span>
            </button>
            <button onClick={() => setDeliveryType('uber')} className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${deliveryType === 'uber' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-100 bg-slate-50 text-slate-500 opacity-60'}`}>
              <Send size={20} />
              <span className="text-sm font-bold">Uber Entrega</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}