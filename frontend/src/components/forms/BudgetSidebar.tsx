import { useState } from 'react';
import { Calculator, User, MessageCircle, CheckCircle2, AlertTriangle, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderItem, Customer } from '../../types';
import toast from 'react-hot-toast';

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
  pixKey?: string;
}

export default function BudgetSidebar({
  items, subtotal, total, deposit, deliveryFee, setDeliveryFee, discount, setDiscount,
  customers, selectedCustomerId, handleSelectCustomer, customerName, setCustomerName, notes, setNotes,
  editingOrderId, resetForm, onOpenMessageModal, onSchedule, showOrderSuccess, isScheduleDisabled, pixKey
}: BudgetSidebarProps) {
  const [copiedPix, setCopiedPix] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const dietaryRestriction = selectedCustomer?.dietaryRestrictions;

  const handleCopyPix = () => {
    if (!pixKey) {
      toast.error('Nenhuma chave PIX cadastrada nas configurações.');
      return;
    }
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const sweetsBaseSubtotal = items.reduce((acc, c) => acc + (c.quantity * c.unitPrice), 0);
  const extrasSubtotal = subtotal - sweetsBaseSubtotal;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:sticky lg:top-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Calculator className="text-brand-primary" size={20} />
          <h3 className="font-black text-base">Resumo Financeiro</h3>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={resetForm}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
            title="Limpar formulário"
          >
            <RotateCcw size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Alerta de Restrições Alimentares do Cliente */}
      {dietaryRestriction && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800"
        >
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-black block uppercase tracking-wider text-[10px]">Restrição Alimentar:</span>
            <span className="font-bold">{dietaryRestriction}</span>
          </div>
        </motion.div>
      )}

      {/* Caixa de Valores & Detalhamento */}
      <div className="bg-pink-50/70 p-5 rounded-2xl border border-pink-100/90 space-y-3">
        <div className="flex justify-between text-xs text-slate-600 font-medium">
          <span>Subtotal Doces</span>
          <span className="font-mono font-bold text-slate-800">R$ {sweetsBaseSubtotal.toFixed(2)}</span>
        </div>
        
        {extrasSubtotal > 0 && (
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Extras (Decoração / Forminhas)</span>
            <span className="font-mono font-bold text-slate-800">R$ {extrasSubtotal.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-slate-600 items-center">
          <span>Taxa de Entrega</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-pink-400 font-mono text-[10px]">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee === 0 ? '' : deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="0.00"
              className="w-24 bg-white border border-pink-200 rounded-lg pl-6 pr-2 py-1 text-right text-brand-primary font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-slate-600 items-center">
          <span>Desconto</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500 font-mono text-[10px]">-R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount === 0 ? '' : discount}
              onChange={(e) => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="0.00"
              className="w-24 bg-white border border-pink-200 rounded-lg pl-7 pr-2 py-1 text-right text-emerald-600 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
        </div>

        <div className="flex justify-between pt-3 border-t border-pink-200 font-black text-brand-primary items-end">
          <span className="text-sm">Total Estimado</span>
          <span className="text-2xl font-mono">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Caixa de Sinal PIX (50%) */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Sinal PIX (50%)</span>
          <span className="text-xl font-black font-mono text-amber-900">R$ {deposit.toFixed(2)}</span>
        </div>
        {pixKey && (
          <button
            type="button"
            onClick={handleCopyPix}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
            title="Copiar Chave PIX"
          >
            {copiedPix ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copiedPix ? 'Copiado' : 'Chave PIX'}
          </button>
        )}
      </div>

      {/* Seleção do Cliente e Tema */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Vincular Cliente Cadastrado
          </label>
          <select 
            value={selectedCustomerId || ""}
            onChange={(e) => handleSelectCustomer(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pink-500/20 outline-none"
          >
            <option value="">-- Cliente Avulso / Digitar Nome --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.dietaryRestrictions ? `(⚠️ ${c.dietaryRestrictions})` : ''}
              </option>
            ))}
          </select>
          
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Nome do cliente..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Tema da Decoração / Observações
          </label>
          <input 
            type="text" 
            placeholder="Ex: Safari Baby, Flores Rosas, Sem Glúten..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 outline-none"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3 pt-2">
          {editingOrderId && (
            <button 
              type="button"
              onClick={resetForm} 
              className="w-full bg-rose-50 text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-100 transition-colors text-xs uppercase tracking-wider"
            >
              Cancelar Edição
            </button>
          )}

          <button 
            type="button"
            disabled={items.length === 0 || !customerName} 
            onClick={onOpenMessageModal} 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-wider cursor-pointer"
          >
            <MessageCircle size={18} /> Gerar Texto WhatsApp
          </button>

          <button 
            type="button"
            disabled={isScheduleDisabled} 
            onClick={onSchedule} 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-wider cursor-pointer"
          >
            <CheckCircle2 size={18} /> {editingOrderId ? 'Atualizar Pedido' : 'Confirmar e Agendar'}
          </button>
        </div>

        {showOrderSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-center text-xs font-bold border border-emerald-200"
          >
            ✅ Pedido salvo e agendado com sucesso!
          </motion.div>
        )}
      </div>
    </div>
  );
}