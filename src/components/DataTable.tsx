import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

interface Evento {
  Hora: string;
  Movimiento: string;
  Carril: string;
}

interface Persona {
  Nombre: string;
  Apellido: string;
  ID: string;
  Departamento: string;
  EventosPorFecha: Record<string, Evento[]>;
}

interface DataTableProps {
  data: Persona[];
  page?: number;
  setPage?: (page: number) => void;
  total?: number;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  pageSize?: number;
  onSizeChange?: (size: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ 
  data, page = 1, setPage, total = 0, 
  searchTerm = '', onSearch, 
  pageSize = 50, onSizeChange 
}) => {
  if (!data || !Array.isArray(data)) return null;
  const [expandedDate, setExpandedDate] = useState<{ [personId: string]: string | null }>({});
  const [openDateMenu, setOpenDateMenu] = useState<string | null>(null);

  const toggleDate = (personId: string, date: string) => {
    setExpandedDate(prev => ({
      ...prev,
      [personId]: prev[personId] === date ? null : date
    }));
    setOpenDateMenu(null);
  };

  // El filtrado y paginación ahora ocurren en el servidor
  const paginatedData = data;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col space-y-4">
      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por colaborador, ID o escuela..."
            value={searchTerm}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Registros por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onSizeChange?.(Number(e.target.value))}
            className="bg-white border border-zinc-200 rounded-lg text-xs font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-zinc-700 cursor-pointer"
          >
            {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse font-sans">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Colaborador</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">ID / Escuela</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500 text-center">Frecuencia</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Fechas con Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedData.map((row) => {
                const dates = Object.keys(row.EventosPorFecha).sort((a, b) => b.localeCompare(a));
                const totalEvents = Object.values(row.EventosPorFecha).reduce((acc, curr) => acc + curr.length, 0);
                
                return (
                  <React.Fragment key={row.ID}>
                    <tr className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-zinc-900 group-hover:text-primary-600 transition-colors">
                          {row.Nombre} {row.Apellido}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-zinc-600">{row.ID}</span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[180px]">{row.Departamento}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-zinc-950">{totalEvents}</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Eventos</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm items-center">
                          {dates.slice(0, 2).map((date) => (
                            <button 
                              key={date}
                              onClick={() => toggleDate(row.ID, date)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 ${
                                expandedDate[row.ID] === date
                                  ? 'bg-zinc-950 text-white border-zinc-950'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                              }`}
                            >
                              {date.split('-').slice(1).reverse().join('/')}
                            </button>
                          ))}
                          
                          {dates.length > 2 && (
                            <div className="relative">
                              <button 
                                onClick={() => setOpenDateMenu(openDateMenu === row.ID ? null : row.ID)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all hover:bg-zinc-50 ${
                                  openDateMenu === row.ID ? 'bg-zinc-100 border-zinc-400 text-zinc-900' : 'bg-white text-zinc-400 border-zinc-200'
                                }`}
                              >
                                {openDateMenu === row.ID ? 'Cerrar' : `+${dates.length - 2} días`}
                                <ChevronDown size={12} className={`transition-transform duration-200 ${openDateMenu === row.ID ? 'rotate-180' : ''}`} />
                              </button>

                              {openDateMenu === row.ID && (
                                <div className="absolute left-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 p-2 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95 duration-200">
                                  {dates.slice(2).map((date) => (
                                    <button
                                      key={date}
                                      onClick={() => toggleDate(row.ID, date)}
                                      className={`text-[9px] font-bold px-2 py-1.5 rounded-lg border transition-colors flex items-center justify-between ${
                                        expandedDate[row.ID] === date
                                          ? 'bg-zinc-900 text-white border-zinc-900'
                                          : 'bg-zinc-50 text-zinc-600 border-transparent hover:bg-zinc-100'
                                      }`}
                                    >
                                      {date.split('-').slice(1).reverse().join('/')}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Detalles Expandidos */}
                    {expandedDate[row.ID] && (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={4} className="px-6 py-4 border-l-4 border-zinc-900 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex flex-col">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2">
                              Historial del {expandedDate[row.ID]?.split('-').slice(1).reverse().join('/')}
                              <div className="h-px flex-1 bg-zinc-200"></div>
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {row.EventosPorFecha[expandedDate[row.ID]!]?.map((evt, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-xl border border-zinc-100 shadow-sm flex flex-col items-center">
                                  <span className="text-xs font-black text-zinc-950 font-mono mb-1">{evt.Hora.slice(0, 5)}</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    evt.Movimiento === 'INGRESO' 
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}>
                                    {evt.Movimiento}
                                  </span>
                                  <span className="text-[8px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">CARRIL {evt.Carril}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-4 border border-zinc-100">
                        <Search size={32} />
                      </div>
                      <p className="text-zinc-500 font-medium text-lg">No se encontraron resultados</p>
                      <p className="text-zinc-400 text-sm">Intenta con otro nombre o documento de identidad</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center sm:text-left">
              Página <span className="text-zinc-950">{page}</span> de <span className="text-zinc-950">{totalPages || 1}</span>
              <span className="mx-2 text-zinc-200">|</span>
              Mostrando <span className="text-zinc-950">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}</span> de <span className="text-zinc-950">{total}</span> resultados
          </div>
          
          <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage?.(1)}
                disabled={page === 1}
                className="p-2 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setPage?.(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center px-4">
                <span className="text-xs font-black text-zinc-950 w-8 text-center">{page}</span>
              </div>
              
              <button 
                onClick={() => setPage?.(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-2 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setPage?.(totalPages)}
                disabled={page === totalPages || totalPages === 0}
                className="p-2 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <ChevronsRight size={16} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
