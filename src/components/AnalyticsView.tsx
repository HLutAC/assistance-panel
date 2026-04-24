import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Users, Clock, MapPin, ChevronRight, TrendingUp, Filter } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface AnalyticsViewProps {
  charts: {
    hourly: any[];
    lane: any[];
    pie: any[];
    heatmap: any[];
    sequence: any[];
    escuela: any[];
    duration: any[];
    durationEscuela: any[];
    hourlyEscuela: any[];
    durationHourlyEscuela: any[];
    summary: any;
  };
  selectedDate: string;
  analyticsSearch: string;
  onAnalyticsSearch: (val: string) => void;
}

const COLORS = [
  '#1d4ed8', '#10b981', '#f97316', '#6366f1', '#64748b', 
  '#ec4899', '#8b5cf6', '#0ea5e9', '#f43f5e', '#fbbf24',
  '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#06b6d4', '#10b981', '#84cc16', '#eab308', '#f97316'
];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ charts, selectedDate, analyticsSearch, onAnalyticsSearch }) => {
  const [sequenceSearch, setSequenceSearch] = useState('');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [loadingDrill, setLoadingDrill] = useState(false);
  const [localSearch, setLocalSearch] = useState(analyticsSearch);
  
  const [hoveredCell, setHoveredCell] = useState<{fecha: string, hora: number, val: number, x: number, y: number} | null>(null);

  const safeCharts = useMemo(() => ({
    hourly: charts?.hourly || [],
    lane: charts?.lane || [],
    pie: charts?.pie || [],
    heatmap: charts?.heatmap || [],
    sequence: charts?.sequence || [],
    escuela: charts?.escuela || [],
    duration: charts?.duration || [],
    durationEscuela: charts?.durationEscuela || [],
    hourlyEscuela: charts?.hourlyEscuela || [],
    durationHourlyEscuela: charts?.durationHourlyEscuela || [],
    summary: charts?.summary || { peak_hour: 'N/A', unique_users: 0 }
  }), [charts]);

  // Pivot data for school trends (SHOW ALL)
  const allSchoolNames = useMemo(() => {
    const names = new Set<string>();
    safeCharts.hourlyEscuela.forEach(d => names.add(d.escuela));
    return Array.from(names).sort();
  }, [safeCharts.hourlyEscuela]);

  const schoolTrendData = useMemo(() => {
    if (!safeCharts.hourlyEscuela.length) return [];
    
    const hours = Array.from({length: 24}).map((_, i) => ({
      hora: `${i.toString().padStart(2, '0')}:00`,
      horaNum: i
    }));

    return hours.map(h => {
      const row: any = { ...h };
      safeCharts.hourlyEscuela
        .filter(d => d.hora === h.horaNum)
        .forEach(d => {
          row[d.escuela] = d.value;
        });
      return row;
    });
  }, [safeCharts.hourlyEscuela]);

  const schoolDurationTrendData = useMemo(() => {
    if (!safeCharts.durationHourlyEscuela.length) return [];
    
    const hours = Array.from({length: 24}).map((_, i) => ({
      hora: `${i.toString().padStart(2, '0')}:00`,
      horaNum: i
    }));

    return hours.map(h => {
      const row: any = { ...h };
      safeCharts.durationHourlyEscuela
        .filter(d => d.hora === h.horaNum)
        .forEach(d => {
          row[d.escuela] = parseFloat(d.value.toFixed(2));
        });
      return row;
    });
  }, [safeCharts.durationHourlyEscuela]);

  const heatmapGrid = useMemo(() => {
    if (!safeCharts.heatmap.length) return [];
    const dates = Array.from(new Set(safeCharts.heatmap.map(d => d.fecha))).sort((a, b) => b.localeCompare(a));
    return dates.map(fecha => {
      const hours = Array(24).fill(0);
      safeCharts.heatmap.filter(d => d.fecha === fecha).forEach(d => { hours[d.hora] = d.value; });
      return { fecha, hours };
    });
  }, [safeCharts.heatmap]);

  const maxHeatValue = Math.max(...safeCharts.heatmap.map(d => d.value), 1);

  const getHeatColor = (val: number, max: number) => {
    if (val === 0) return 'bg-slate-100/40';
    const ratio = val / max;
    if (ratio < 0.2) return 'bg-blue-200';
    if (ratio < 0.4) return 'bg-blue-500';
    if (ratio < 0.6) return 'bg-indigo-500';
    if (ratio < 0.8) return 'bg-purple-500';
    if (ratio < 0.9) return 'bg-rose-500';
    return 'bg-pink-600';
  };

  const filteredSequences = useMemo(() => {
    if (!sequenceSearch) return safeCharts.sequence;
    const term = sequenceSearch.toLowerCase();
    return safeCharts.sequence.filter(s => 
      s.nombre.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  }, [safeCharts.sequence, sequenceSearch]);

  const customTooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    boxShadow: '0 4px 20px -4px rgba(203,213,225,0.4)',
    padding: '12px'
  };

  useEffect(() => {
    if (selectedHour !== null) {
      setLoadingDrill(true);
      const API_BASE = `http://${window.location.hostname}:8000/api`;
      fetch(`${API_BASE}/events/drill-down?hour=${selectedHour}&fecha=${selectedDate || ''}`)
        .then(r => r.json())
        .then(data => {
          setDrillDownData(data);
          setLoadingDrill(false);
        })
        .catch(() => setLoadingDrill(false));
    }
  }, [selectedHour, selectedDate]);

  const handleApplySearch = () => {
    onAnalyticsSearch(localSearch);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20 overflow-y-auto custom-scrollbar p-6 md:p-1 relative">
      
      {/* 4. Custom Heatmap Tooltip (Floating) */}
      {hoveredCell && (
        <div 
          className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 px-4 py-3 polaris-glass border-blue-500/20 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-200"
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{hoveredCell.fecha} • {hoveredCell.hora}:00H</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getHeatColor(hoveredCell.val, maxHeatValue)}`}></div>
              <span className="text-xl font-black text-slate-800">{hoveredCell.val} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Eventos</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Header & Global Search */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex-1 gap-6">
          <div className="polaris-card bg-blue-700 p-6 flex flex-col justify-between">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">Hora de Mayor Tráfico</span>
            <h2 className="text-3xl font-black text-white mt-4">{safeCharts.summary.peak_hour}</h2>
          </div>
          <div className="polaris-card p-6 flex flex-col justify-between border-blue-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usuarios Únicos</span>
            <h2 className="text-3xl font-black text-slate-800 mt-4">{safeCharts.summary.unique_users}</h2>
          </div>
        </div>

        <div className="polaris-glass p-6 md:w-96 flex flex-col justify-center gap-4 bg-white/40">
           <span className="tech-label-light flex items-center gap-2"><Filter size={10} /> Filtro de Trazado (Monitor)</span>
           <div className="flex gap-2">
             <div className="relative flex-1 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" size={14} />
               <input 
                 type="text"
                 placeholder="ID, Nombre or Carrera..."
                 value={localSearch}
                 onChange={(e) => setLocalSearch(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                 className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-700/10 transition-all text-slate-800"
               />
             </div>
             <button 
               onClick={handleApplySearch}
               className="px-4 py-2.5 bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-700/20"
             >
               Aplicar
             </button>
           </div>
           {analyticsSearch && (
             <button 
               onClick={() => { setLocalSearch(''); onAnalyticsSearch(''); }}
               className="text-[9px] font-black text-rose-500 uppercase flex items-center justify-center gap-1 hover:text-rose-600 transition-colors self-start"
             >
               <X size={10} /> Limpiar Filtro: "{analyticsSearch}"
             </button>
           )}
        </div>
      </div>

      {/* 1. Global Flow Monitor */}
      <div className="polaris-glass p-8 group">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-blue-700 rounded-full animate-ping"></div>
            <span className="tech-label-light">Monitor de Tráfico Dinámico (Real-Time Flows)</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-blue-700 rounded-sm"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salidas</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-300 italic">Haz clic en un punto para ver detalles</span>
          </div>
        </div>
        
        <div className="h-96 w-full cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={safeCharts.hourly}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  setSelectedHour(parseInt(String(data.activeLabel).split(':')[0]));
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="hora" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8', fontFamily: 'Inter'}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8', fontFamily: 'Inter'}}
              />
              <Tooltip 
                contentStyle={customTooltipStyle}
                itemStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#1d4ed8'}}
                labelStyle={{color: '#1e293b', marginBottom: '8px', fontSize: '11px', fontWeight: '900'}}
              />
              <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px', letterSpacing: '0.1em'}} />
              <Line type="monotone" dataKey="ingresos" stroke="#1d4ed8" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8, strokeWidth: 0, fill: '#1d4ed8'}} />
              <Line type="monotone" dataKey="salidas" stroke="#e2e8f0" strokeWidth={2} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0, fill: '#94a3b8'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. School Trends (All Faculties) */}
      <div className="grid grid-cols-1 gap-10">
        {/* Trend: Ingresos por Escuela */}
        <div className="polaris-glass p-8 group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-blue-700" />
              <span className="tech-label-light">Flujos de Tráfico por Facultad (Vista Universal)</span>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase">Analizando {allSchoolNames.length} Escuelas</span>
          </div>
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={schoolTrendData}>
                <defs>
                  {allSchoolNames.map((school, i) => (
                    <linearGradient key={`grad-${i}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.05}/>
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hora" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}}
                />
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  itemStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '30px'}} layout="horizontal" align="center" verticalAlign="bottom" />
                {allSchoolNames.map((school, i) => (
                  <Area 
                    key={school}
                    type="monotone" 
                    dataKey={school} 
                    stroke={COLORS[i % COLORS.length]} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={`url(#color-${i})`}
                    stackId="1"
                    activeDot={{r: 4}}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend: Permanencia por Escuela */}
        <div className="polaris-glass p-8 group border-orange-100">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-orange-500" />
              <span className="tech-label-light">Curvas de Permanencia Universal por Carrera</span>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={schoolDurationTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hora" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}}
                  unit="h"
                />
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  itemStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase'}}
                  formatter={(value: any) => [`${value} horas`, 'Promedio']}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '30px'}} layout="horizontal" align="center" verticalAlign="bottom" />
                {allSchoolNames.map((school, i) => (
                  <Line 
                    key={school}
                    type="monotone" 
                    dataKey={school} 
                    stroke={COLORS[i % COLORS.length]} 
                    strokeWidth={2.5}
                    dot={{r: 0}}
                    activeDot={{r: 4}}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Global Stats Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 polaris-glass p-8">
          <span className="tech-label-light mb-10 block">Distribución Operativa por Carriles</span>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeCharts.lane}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [`${value} Movimientos`, 'Total']}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px'}} />
                <Bar dataKey="ingresos" fill="#1d4ed8" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="salidas" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="polaris-glass p-8 bg-slate-50/50">
          <span className="tech-label-light block mb-10 text-center">Resumen de Movimientos</span>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeCharts.pie}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {safeCharts.pie.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [`${value} Registros`, 'Total']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: '900', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Pulse Map - Heatmap */}
      <div className="polaris-glass p-8 overflow-hidden relative border-rose-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            <span className="tech-label-light">Densidad Operativa (Pulse Map V2)</span>
          </div>
          <div className="flex flex-wrap gap-3 bg-white/40 backdrop-blur-sm p-3 rounded-2xl border border-white/60">
            {[
              { label: 'Base', color: 'bg-blue-200' },
              { label: 'Medio', color: 'bg-blue-500' },
              { label: 'Frecuente', color: 'bg-purple-500' },
              { label: 'Crítico', color: 'bg-pink-600' }
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 ${l.color} rounded-sm`}></div>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[900px] pr-4">
            <div className="flex mb-8 border-b border-slate-100/50 pb-4">
              <div className="w-24"></div>
              <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2">
                {Array.from({length: 24}).map((_, i) => (
                  <span key={i} className="text-[8px] font-black text-slate-300 text-center uppercase tabular-nums">
                    {i.toString().padStart(2, '0')}
                    <span className="opacity-30">h</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {heatmapGrid.map((row) => (
                <div key={row.fecha} className="flex items-center group/row">
                  <div className="w-24 text-[10px] font-black text-slate-400 group-hover/row:text-blue-600 transition-colors uppercase pr-6 text-right tabular-nums">
                    {row.fecha.split('-').slice(1).reverse().join('/')}
                  </div>
                  <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2">
                    {row.hours.map((val, i) => (
                      <div 
                        key={i}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            fecha: row.fecha,
                            hora: i,
                            val,
                            x: rect.left + rect.width / 2,
                            y: rect.top
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`aspect-square rounded-[4px] transition-all duration-300 hover:scale-[1.4] hover:z-10 shadow-sm border border-black/[0.01] cursor-pointer ${getHeatColor(val, maxHeatValue)}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Sequence List */}
      <div className="polaris-glass p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <span className="tech-label-light">Ráfagas de Señal por Usuario</span>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Buscar ráfaga..."
              value={sequenceSearch}
              onChange={(e) => setSequenceSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-700/10 transition-all text-slate-800"
            />
          </div>
        </div>
        
        <div className="space-y-10">
          {filteredSequences.length > 0 ? filteredSequences.map((user) => (
            <div key={user.id} className="border-b border-slate-50 pb-10 last:border-0 last:pb-0 group/seq">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-black text-slate-700 group-hover/seq:text-primary-500 transition-colors uppercase">{user.nombre}</span>
                <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-full">UID: {user.id}</span>
              </div>
              <div className="h-2 w-full flex items-center relative bg-slate-50 rounded-full overflow-hidden">
                  {user.eventos.map((evt: any, i: number) => {
                    const time = new Date(evt.t);
                    const percentage = ((time.getHours() * 60 + time.getMinutes()) / 1440) * 100;
                    return (
                      <div 
                        key={i}
                        className={`absolute w-1 h-full rounded-full transition-all hover:scale-y-[2] ${evt.tipo === 1 ? 'bg-blue-700' : 'bg-emerald-500 opacity-40'}`}
                        style={{ left: `${percentage}%` }}
                        title={`${evt.label} - ${evt.t}`}
                      />
                    );
                  })}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Sin coincidencias registradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Drill-down Modal */}
      {selectedHour !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedHour(null)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-slate-100">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-700/20">
                  <Clock size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Intervalo: {selectedHour}:00 - {selectedHour}:59H</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros Detectados:</span>
                    <span className="tech-label bg-emerald-50 text-emerald-600 px-2 py-0.5">{drillDownData.length}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHour(null)}
                className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
              {loadingDrill ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-blue-700/20 border-t-blue-700 rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando registros...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drillDownData.map((evt, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100/60 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${evt.tipo_movimiento === 'INGRESO' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-600'}`}>
                          <ChevronRight size={18} strokeWidth={3} className={evt.tipo_movimiento === 'INGRESO' ? 'rotate-0' : 'rotate-180'} />
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-800 uppercase leading-none mb-1">{evt.nombre} {evt.apellido}</p>
                          <div className="flex items-center gap-2 opacity-60">
                            <Users size={10} />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{evt.escuela}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                           <Clock size={10} className="text-slate-300" />
                           <span className="text-[11px] font-black text-slate-700 tabular-nums">{new Date(evt.t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <MapPin size={9} className="text-slate-300" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{evt.carril}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {drillDownData.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-white/50">
                      <p className="text-slate-300 text-xs font-black uppercase tracking-widest">No se encontraron ráfagas en este periodo</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-50 bg-white/80 backdrop-blur-md flex justify-center">
               <button 
                onClick={() => setSelectedHour(null)}
                className="px-8 py-3 bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/30 active:scale-95"
               >
                 Entendido
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
