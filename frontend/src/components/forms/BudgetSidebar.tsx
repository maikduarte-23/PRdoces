import { Calculator, User, MessageCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { OrderItem, Customer } from '../../types';

interface BudgetSidebarProps {
  items: OrderItem[];
  subtotal: number;
  total: number;
  deposit: number;
  deliveryFee: number;
  setDeliveryFee: (val: number) => void;
  discount: number;
  setDiscount: (val: number) => void;
  customers: Customer[];
  selectedCustomerId: string | null;
  handleSelectCustomer: (id: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  editingOrderId: string | null;
  resetForm: () => void;
  onOpenMessageModal: () => void;
  onSchedule: () => void;
  showOrderSuccess: boolean;
  isScheduleDisabled: boolean;
}

export default function BudgetSidebar({
  items, subtotal, total, deposit, deliveryFee, setDeliveryFee, discount, setDiscount,
  customers, selectedCustomerId, handleSelectCustomer, customerName, setCustomerName, notes, setNotes,
  editingOrderId, resetForm, onOpenMessageModal, onSchedule, showOrderSuccess, isScheduleDisabled
}: BudgetSidebarProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:sticky lg:top-4">
      <div className="flex items-center gap-2 mb-6 text-slate-900">
        <Calculator className="text-pink-600" size={20} />
        <h3 className="font-bold">Resumo Financeiro</h3>
      </div>

      <div className="bg-pink-50 p-5 rounded-xl border border-pink-100 mb-8 space-y-3">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal Doces</span>
          <span className="font-mono">R$ {items.reduce((acc, c) => acc + (c.quantity * c.unitPrice), 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Extras (Decoração/Forminhas)</span>
          <span className="font-mono">R$ {(subtotal - items.reduce((acc, c) => acc + (c.quantity * c.unitPrice), 0)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600 items-center">
          <span>Taxa de Entrega (R$)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={deliveryFee === 0 ? '' : deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0.00"
            className="w-24 bg-white border border-pink-200 rounded-md px-2 py-1 text-right text-pink-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
        <div className="flex justify-between text-sm text-slate-600 items-center">
          <span>Desconto Adicional (R$)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount === 0 ? '' : discount}
            onChange={(e) => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0.00"
            className="w-24 bg-white border border-pink-200 rounded-md px-2 py-1 text-right text-pink-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
        <div className="flex justify-between pt-3 border-t border-pink-200 font-bold text-pink-700 items-end">
          <span>Total Estimado</span>
          <span className="text-xl">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase block">Selecionar Cliente</label>
          <select 
            value={selectedCustomerId || ""}
            onChange={(e) => handleSelectCustomer(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 mb-2"
          >
            <option value="">-- Cliente Avulso --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Nome para o texto..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase block">Tema da Decoração / Notas</label>
          <input 
            type="text" 
            placeholder="Ex: Jardim Encantado"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-2">
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-xs font-bold uppercase">Sinal PIX (50%)</span>
            <span className="text-lg font-bold">R$ {deposit.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {editingOrderId && (
            <button onClick={resetForm} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors shadow-sm">
              Cancelar Edição
            </button>
          )}
          <button disabled={items.length === 0 || !customerName} onClick={onOpenMessageModal} className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 disabled:opacity-50">
            <MessageCircle size={20} /> Gerar Texto WhatsApp
          </button>
          <button disabled={isScheduleDisabled} onClick={onSchedule} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 disabled:opacity-50">
            <CheckCircle2 size={20} /> {editingOrderId ? 'Atualizar Pedido' : 'Confirmar e Agendar'}
          </button>
        </div>
        {showOrderSuccess && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 text-blue-700 p-4 rounded-xl text-center text-sm font-bold border border-blue-100">
            ✅ Salvo com sucesso!
          </motion.div>
        )}
      </div>
    </div>
  );
}