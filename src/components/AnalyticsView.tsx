import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsViewProps {
  charts: {
    hourly: any[];
    lane: any[];
    pie: any[];
    heatmap: any[];
    sequence: any[];
    escuela: any[];
    summary: any;
  };
}

const COLORS = ['#1d4ed8', '#10b981', '#f97316', '#6366f1', '#64748b', '#ec4899', '#8b5cf6'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ charts }) => {
  const [sequenceSearch, setSequenceSearch] = useState('');

  const safeCharts = useMemo(() => ({
    hourly: charts?.hourly || [],
    lane: charts?.lane || [],
    pie: charts?.pie || [],
    heatmap: charts?.heatmap || [],
    sequence: charts?.sequence || [],
    escuela: charts?.escuela || [],
    summary: charts?.summary || { peak_hour: 'N/A', unique_users: 0 }
  }), [charts]);

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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20 overflow-y-auto custom-scrollbar">
      
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="polaris-card bg-blue-700 p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">Hora de Mayor Tráfico</span>
          <h2 className="text-3xl font-black text-white mt-4">{safeCharts.summary.peak_hour}</h2>
        </div>
        <div className="polaris-card p-6 flex flex-col justify-between border-blue-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usuarios Únicos</span>
          <h2 className="text-3xl font-black text-slate-800 mt-4">{safeCharts.summary.unique_users}</h2>
        </div>
      </div>

      {/* 1. Flow Density & Career Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 polaris-glass p-8 group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-blue-700 rounded-full animate-ping"></div>
              <span className="tech-label-light">Densidad de Flujo Temporal</span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeCharts.hourly}>
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
                <Line type="monotone" dataKey="ingresos" stroke="#1d4ed8" strokeWidth={4} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0, fill: '#1d4ed8'}} />
                <Line type="monotone" dataKey="salidas" stroke="#e2e8f0" strokeWidth={2} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0, fill: '#94a3b8'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="polaris-glass p-8">
          <span className="tech-label-light block mb-4">Ingresos por Carrera</span>
          <span className="text-[10px] font-bold text-slate-400 block mb-8 uppercase">Top Facultades con mayor flujo</span>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeCharts.escuela.slice(0, 5)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{fontSize: 9, fontWeight: '900', fill: '#64748b'}}
                />
                <Tooltip contentStyle={customTooltipStyle} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#1d4ed8" radius={[0, 4, 4, 0]} barSize={16}>
                  {safeCharts.escuela.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Lane Matrix - Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 polaris-glass p-8">
          <span className="tech-label-light mb-10 block">Utilización de Carriles por Nodo</span>
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
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px'}} />
                <Bar dataKey="ingresos" fill="#1d4ed8" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="salidas" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="polaris-glass p-8 bg-slate-50/50">
          <span className="tech-label-light block mb-10 text-center">Distribución Global</span>
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
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: '900', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Pulse Map - Heatmap */}
      <div className="polaris-glass p-8 overflow-hidden relative">
        <div className="flex items-center justify-between mb-10">
          <span className="tech-label-light">Mapa de Calor Operativo (Intensidad de Signal)</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-50 border border-slate-200 rounded"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase">Bajo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-700/50 rounded"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase">Medio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-700 rounded"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase">Pico</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            <div className="flex mb-6">
              <div className="w-24"></div>
              <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2">
                {Array.from({length: 24}).map((_, i) => (
                  <span key={i} className="text-[8px] font-black text-slate-300 text-center uppercase tabular-nums">
                    {i.toString().padStart(2, '0')}H
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              {heatmapGrid.map((row) => (
                <div key={row.fecha} className="flex items-center group/row">
                  <span className="w-24 text-[10px] font-bold text-slate-400 group-hover/row:text-primary-500 transition-colors uppercase">
                    {row.fecha.split('-').slice(1).join('/')}
                  </span>
                  <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2">
                    {row.hours.map((val, i) => {
                      const isActive = val > 0;
                      const intensity = isActive ? Math.min(1, (val / maxHeatValue) + 0.1) : 0;
                      return (
                        <div 
                          key={i}
                          className={`aspect-square rounded-md transition-all duration-300 hover:scale-[1.4] hover:z-10 shadow-sm border border-slate-100 ${isActive ? 'bg-blue-700' : 'bg-slate-50'}`}
                          style={{ opacity: isActive ? intensity : 1 }}
                          title={`${row.fecha} ${i}:00 - ${val} UNIDADES`}
                        />
                      );
                    })}
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
    </div>
  );
};

export default AnalyticsView;
