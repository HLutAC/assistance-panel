import React from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, LogIn, LogOut, Calendar, User } from 'lucide-react';

interface Evento {
  Hora: string;
  Movimiento: string;
  Carril: string;
  f?: string;
}

interface Persona {
  ID: string;
  Nombre: string;
  escuela?: string;
  id_persona?: number;
  EventosPorFecha?: Record<string, Evento[]>;
}

interface DataTableProps {
  data: Persona[];
  page: number;
  setPage: (p: number) => void;
  total: number;
  searchTerm: string;
  onSearch: (s: string) => void;
  pageSize: number;
  onSizeChange: (s: number) => void;
  escuela: string;
  onEscuelaChange: (e: string) => void;
  escuelas: string[];
  fecha: string;
  onFechaChange: (f: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ 
  data, page, setPage, total, searchTerm, onSearch, pageSize, onSizeChange, escuela, onEscuelaChange, escuelas, fecha, onFechaChange
}) => {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all text-slate-700"
            />
          </div>
          
          <div className="relative group">
            <select 
              value={escuela}
              onChange={(e) => onEscuelaChange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer"
            >
              <option value="Todas">Todas las Facultades</option>
              {escuelas.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group min-w-[160px]">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={14} />
              <input 
                type="date"
                value={fecha}
                onChange={(e) => onFechaChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer"
              />
            </div>
            {fecha && (
              <button 
                onClick={() => onFechaChange('')}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                title="Limpiar fecha"
              >
                <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">✕</div>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vista</span>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {[10, 20, 50, 100].map(size => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageSize === size ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Cards Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {data.map((row) => (
            <StudentCard key={row.ID} row={row} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-12 flex items-center justify-between bg-white/50 p-6 rounded-3xl border border-white/50 backdrop-blur-sm">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Mostrando <span className="text-slate-800">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</span> de <span className="text-slate-800">{total}</span> integrantes
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary-500 disabled:opacity-30 transition-all hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100"
          >
            Primero
          </button>
          
          <div className="flex items-center bg-slate-50/50 rounded-2xl p-1 border border-slate-100">
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 text-slate-500 hover:text-primary-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="px-4 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pág</span>
              <span className="text-sm font-black text-slate-800">{page}</span>
              <span className="text-[10px] font-black text-slate-300 uppercase">/ {Math.ceil(total / pageSize)}</span>
            </div>

            <button 
              onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="p-2 text-slate-500 hover:text-primary-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={() => setPage(Math.ceil(total / pageSize))}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary-500 disabled:opacity-30 transition-all hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100"
          >
            Último
          </button>
        </div>
      </div>
    </div>
  );
};

interface StudentCardProps {
  row: Persona;
}

const StudentCard: React.FC<StudentCardProps> = ({ row }) => {
  const dates = row.EventosPorFecha ? Object.keys(row.EventosPorFecha).sort((a, b) => b.localeCompare(a)) : [];
  const [activeDate, setActiveDate] = React.useState(dates[0] || '');

  const dayEvents = (row.EventosPorFecha && activeDate) ? row.EventosPorFecha[activeDate] : [];
  const dayIngresos = dayEvents.filter((e: any) => e.Movimiento?.toLowerCase().includes('ingreso'));
  const daySalidas = dayEvents.filter((e: any) => e.Movimiento?.toLowerCase().includes('salida'));

  return (
    <div className="polaris-card p-6 flex flex-col group animate-in zoom-in-95 duration-500">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 shrink-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-primary-50 group-hover:scale-110 transition-transform duration-500">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1 group-hover:text-primary-600 transition-colors">
              {row.Nombre}
            </h3>
            <div className="flex flex-col gap-1.5">
              <span className="tech-badge-indigo border-indigo-100 uppercase tracking-tighter w-fit">ID: {row.ID || '---'}</span>
              <span className="tech-badge-cyan border-cyan-100 uppercase tracking-tighter w-fit">
                {row.escuela && row.escuela !== 'None' ? row.escuela : 'Sin Facultad'}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector for Card */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
          <Calendar size={14} className="text-slate-400 ml-1.5" />
          <select 
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="bg-transparent border-none text-[10px] font-black text-slate-600 uppercase focus:ring-0 cursor-pointer pr-8"
          >
            {dates.length > 0 ? (
              dates.map(d => <option key={d} value={d}>{d}</option>)
            ) : (
              <option value="">Sin Datos</option>
            )}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Quick Stats for selected date */}
        <div className="flex flex-col gap-3 w-full lg:w-32 border-r border-slate-50 pr-8">
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            <div className="flex items-center justify-between mb-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <LogIn size={10} />
              </div>
              <span className="text-[8px] font-black text-emerald-600/50 uppercase">In</span>
            </div>
            <span className="text-xl font-black text-emerald-700">{dayIngresos.length}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                <LogOut size={10} />
              </div>
              <span className="text-[8px] font-black text-slate-500/50 uppercase">Out</span>
            </div>
            <span className="text-xl font-black text-slate-700">{daySalidas.length}</span>
          </div>
        </div>

        {/* Dual Stream Logs Flow for selected date */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Bitácora: {activeDate}</span>
          </div>
          <div className="grid grid-cols-2 gap-6 h-[160px]">
            {/* Column 1: Ingresos (ASC) */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-emerald-600 uppercase mb-2 ml-1">Ingresos</span>
              <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {dayIngresos.length > 0 ? (
                  dayIngresos.sort((a: any, b: any) => a.Hora.localeCompare(b.Hora)).map((evt: any, i: any) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-emerald-50/20 rounded-lg border border-emerald-100/30">
                      <span className="text-[10px] font-mono font-black text-emerald-700">{evt.Hora.slice(0, 5)}</span>
                      <span className="text-[8px] font-bold text-emerald-400">C{evt.Carril}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                    <span className="text-[8px] font-bold text-slate-300 italic">---</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Salidas (ASC) */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Salidas</span>
              <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {daySalidas.length > 0 ? (
                  daySalidas.sort((a: any, b: any) => a.Hora.localeCompare(b.Hora)).map((evt: any, i: any) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100/50">
                      <span className="text-[10px] font-mono font-black text-slate-700">{evt.Hora.slice(0, 5)}</span>
                      <span className="text-[8px] font-bold text-slate-400">C{evt.Carril}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                    <span className="text-[8px] font-bold text-slate-300 italic">---</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
