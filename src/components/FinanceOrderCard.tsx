import { memo } from 'react';
import { Order } from '../../types';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Edit2, Printer, Download, Trash2, DollarSign, CheckCircle2 } from 'lucide-react';

interface FinanceOrderCardProps {
  order: Order;
  status: { label: string; color: string; progress: number };
  safeFormatDate: (dateString?: string) => string;
  onQuickEdit: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onDownloadReceipt: (order: Order) => void;
  onDelete: (id: string) => void;
  onToggleDeposit: (order: Order) => void;
  onMarkAsPaid: (order: Order) => void;
}

const FinanceOrderCard = ({
  order,
  status,
  safeFormatDate,
  onQuickEdit,
  onPrintLabel,
  onDownloadReceipt,
  onDelete,
  onToggleDeposit,
  onMarkAsPaid,
}: FinanceOrderCardProps) => {
  const half = order.totalPrice / 2;

  return (
    <motion.div
      layout
      key={order.id}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-900 text-lg truncate pr-2">{order.customerName}</h4>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mt-1">
            <CalendarIcon size={12} /> {safeFormatDate(order.date)} às {order.time}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${status.color}`}>
            {status.label}
          </span>
          <button
            onClick={() => onQuickEdit(order)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar Pedido"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onPrintLabel(order)}
            className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            title="Imprimir Etiquetas"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={() => onDownloadReceipt(order)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Baixar Recibo"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir Pedido"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500 font-medium">Valor Total</span>
          <span className="font-black text-slate-900 font-mono">R$ {order.totalPrice.toFixed(2)}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200/60">
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${status.progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Sinal: R$ {half.toFixed(2)}</span>
            <span>Restante: R$ {half.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {!order.depositPaid && (
          <button onClick={() => onToggleDeposit(order)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-2.5 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1">
            <DollarSign size={14} /> Dar Baixa Sinal
          </button>
        )}
        {order.depositPaid && order.status !== 'entregue' && (
          <button onClick={() => onMarkAsPaid(order)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-1">
            <CheckCircle2 size={14} /> Quitar Pedido
          </button>
        )}
        {order.status === 'entregue' && (
          <div className="flex-1 bg-slate-50 text-slate-400 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1 cursor-default border border-slate-100">
            <CheckCircle2 size={14} /> Pagamento Concluído
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Envolvemos o componente com React.memo para otimização de performance.
// Ele só será re-renderizado se as props (order, status, etc.) mudarem.
export default memo(FinanceOrderCard);