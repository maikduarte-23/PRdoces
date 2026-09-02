import { useState, useEffect } from 'react';
import { AlertOctagon, Trash2, ArrowLeft, Terminal, Download, RefreshCw, Search, Monitor, Server, Database as DbIcon, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Log {
  timestamp: string;
  message: string;
}

export default function AdminLogsModule() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState('');
  const [sysStatus, setSysStatus] = useState({ frontend: 'online', backend: 'checking', db: 'checking' });

  const loadLogs = () => {
    try {
      const saved = localStorage.getItem('prdoces_error_logs');
      if (saved) setLogs(JSON.parse(saved));
    } catch { }
  };

  const checkSystemHealth = async () => {
    setSysStatus(prev => ({ ...prev, backend: 'checking', db: 'checking' }));
    const apiUrl = `/api`;
    
    let isBackendUp = false;
    try {
      const backRes = await fetch(apiUrl);
      if (backRes.ok) isBackendUp = true;
    } catch (e) { }

    let isDbUp = false;
    if (isBackendUp) {
      try {
        const dbRes = await fetch(`${apiUrl}/daily-limits`);
        if (dbRes.ok) isDbUp = true;
      } catch (e) { }
    }

    setSysStatus({ frontend: 'online', backend: isBackendUp ? 'online' : 'offline', db: isDbUp ? 'online' : 'offline' });
  };

  useEffect(() => { 
    loadLogs(); 
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Checa a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const refreshAll = () => {
    loadLogs();
    checkSystemHealth();
  };

  const clearLogs = () => {
    if (confirm('Tem certeza que deseja apagar todos os logs de erro?')) {
      localStorage.removeItem('prdoces_error_logs');
      setLogs([]);
    }
  };

  const exportLogs = () => {
    if (logs.length === 0) return;
    const content = logs.map(l => `[${format(parseISO(l.timestamp), 'dd/MM/yyyy HH:mm:ss')}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prdoces-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => log.message.toLowerCase().includes(search.toLowerCase()));

  const formatLogMessage = (msg: string) => {
    if (msg.startsWith('[Global Error]')) {
      return <><span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded mr-2">[ERROR]</span>{msg.replace('[Global Error]', '')}</>;
    }
    if (msg.startsWith('[Promise Rejection]')) {
      return <><span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded mr-2">[PROMISE]</span>{msg.replace('[Promise Rejection]', '')}</>;
    }
    if (msg.startsWith('[Security]')) {
      return <><span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded mr-2">[SECURITY]</span>{msg.replace('[Security]', '')}</>;
    }
    return msg;
  };

  return (
    <div className="space-y-8 pb-10 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Console de Administração</h2>
          <p className="text-slate-500 font-medium">Monitoramento de Erros, Exceções e Debug do Sistema</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={refreshAll} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors text-xs font-bold text-slate-700 shadow-sm">
            <RefreshCw size={14} /> Atualizar
          </button>
          <button onClick={exportLogs} disabled={logs.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors text-xs font-bold text-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={14} /> Exportar
          </button>
          <button onClick={clearLogs} disabled={logs.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors text-xs font-bold text-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Trash2 size={16} /> Limpar
          </button>
          <button onClick={() => window.location.href = '/'} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl transition-all text-xs font-bold text-white shadow-lg shadow-slate-900/20">
            <ArrowLeft size={16} /> Voltar ao App
          </button>
        </div>
      </div>

      {/* Monitoramento de Status (Health Check) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Monitor size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Frontend App (Vite)</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-900 font-bold">Online</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${sysStatus.backend === 'online' ? 'bg-emerald-50 text-emerald-600' : sysStatus.backend === 'checking' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            <Server size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Backend API (Node)</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${sysStatus.backend === 'online' ? 'bg-emerald-500 animate-pulse' : sysStatus.backend === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-900 font-bold capitalize">{sysStatus.backend === 'checking' ? 'Verificando...' : sysStatus.backend}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${sysStatus.db === 'online' ? 'bg-emerald-50 text-emerald-600' : sysStatus.db === 'checking' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            <DbIcon size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">PostgreSQL DB</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${sysStatus.db === 'online' ? 'bg-emerald-500 animate-pulse' : sysStatus.db === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-900 font-bold capitalize">{sysStatus.db === 'checking' ? 'Verificando...' : sysStatus.db}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Filtrar logs por mensagem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium shadow-sm"
        />
      </div>

      <div className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Total: {filteredLogs.length} Registros
          </span>
        </div>
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-4">
            <Terminal size={48} className="opacity-20" />
            <p className="font-medium text-sm">{logs.length === 0 ? 'Nenhum log registrado.' : 'Nenhum resultado para o filtro atual.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto font-mono">
            {filteredLogs.map((log, i) => (
              <div key={i} className="p-4 hover:bg-white/5 transition-colors flex flex-col sm:flex-row gap-3 sm:gap-6 group">
                <div className="text-xs text-slate-500 shrink-0 flex items-center gap-2">
                  <span className="text-slate-700 group-hover:text-slate-500 transition-colors">▶</span>
                  {format(parseISO(log.timestamp), 'dd/MM/yy HH:mm:ss')}
                </div>
                <div className="text-xs text-slate-300 break-words whitespace-pre-wrap leading-relaxed">
                  {formatLogMessage(log.message)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}