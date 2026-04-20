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
  };
}

const COLORS = ['#4f46e5', '#06b6d4', '#6366f1', '#22d3ee', '#818cf8'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ charts }) => {
  const [sequenceSearch, setSequenceSearch] = useState('');

  const safeCharts = useMemo(() => ({
    hourly: charts?.hourly || [],
    lane: charts?.lane || [],
    pie: charts?.pie || [],
    heatmap: charts?.heatmap || [],
    sequence: charts?.sequence || []
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
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    padding: '12px'
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20 overflow-y-auto custom-scrollbar">
      
      {/* 1. Flow Density - Forensic Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 polaris-glass p-8 group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-ping"></div>
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
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8', fontFamily: 'Inter'}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8', fontFamily: 'Inter'}}
                />
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  itemStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4f46e5'}}
                  labelStyle={{color: '#1e293b', marginBottom: '8px', fontSize: '11px', fontWeight: '900'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px', letterSpacing: '0.1em'}} />
                <Line type="monotone" dataKey="ingresos" stroke="#4f46e5" strokeWidth={4} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0, fill: '#4f46e5'}} />
                <Line type="monotone" dataKey="salidas" stroke="#e2e8f0" strokeWidth={2} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0, fill: '#94a3b8'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="polaris-glass p-8">
          <span className="tech-label-light block mb-10 text-center">Distribución de Volumen</span>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeCharts.pie}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {safeCharts.pie.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Lane Matrix - Bar Chart */}
      <div className="polaris-glass p-8">
        <span className="tech-label-light mb-10 block">Utilización de Carriles por Nodo</span>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeCharts.lane}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={customTooltipStyle}
              />
              <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
              <Bar dataKey="ingresos" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="salidas" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Pulse Map - Heatmap */}
      <div className="polaris-glass p-8">
        <span className="tech-label-light mb-10 block">Mapa de Calor Operativo</span>
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
                          className={`aspect-square rounded-md transition-all duration-300 hover:scale-[1.4] hover:z-10 shadow-sm border border-slate-100 ${isActive ? 'bg-primary-500' : 'bg-slate-50'}`}
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Buscar ráfaga..."
              value={sequenceSearch}
              onChange={(e) => setSequenceSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-primary-500/50 transition-all text-slate-700"
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
                      className={`absolute w-1 h-full rounded-full transition-all hover:scale-y-[2] ${evt.tipo === 1 ? 'bg-primary-500' : 'bg-secondary-500 opacity-40'}`}
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
