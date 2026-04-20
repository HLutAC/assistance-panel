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

const COLORS = ['#09090b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ charts }) => {
  const [sequenceSearch, setSequenceSearch] = useState('');

  // Asegurar que charts y sus miembros existan para evitar bloqueos
  const safeCharts = useMemo(() => ({
    hourly: charts?.hourly || [],
    lane: charts?.lane || [],
    pie: charts?.pie || [],
    heatmap: charts?.heatmap || [],
    sequence: charts?.sequence || []
  }), [charts]);

  // Lógica para el Heatmap (Grid real)
  const heatmapGrid = useMemo(() => {
    if (!safeCharts.heatmap.length) return [];
    
    const dates = Array.from(new Set(safeCharts.heatmap.map(d => d.fecha))).sort((a, b) => a.localeCompare(b));
    
    return dates.map(fecha => {
      const hours = Array(24).fill(0);
      safeCharts.heatmap
        .filter(d => d.fecha === fecha)
        .forEach(d => {
          hours[d.hora] = d.value;
        });
      return { fecha, hours };
    });
  }, [charts.heatmap]);

  const maxHeatValue = Math.max(...safeCharts.heatmap.map(d => d.value), 1);

  // Filtrado de secuencias
  const filteredSequences = useMemo(() => {
    if (!sequenceSearch) return safeCharts.sequence;
    const term = sequenceSearch.toLowerCase();
    return safeCharts.sequence.filter(s => 
      s.nombre.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  }, [safeCharts.sequence, sequenceSearch]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out pb-20">
      
      {/* 1. Flujo por Hora y 3. Ingress vs Egress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 premium-card p-8">
          <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            Flujo de Personas por Hora
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.hourly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="hora" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#a1a1aa'}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#a1a1aa'}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 'black', marginBottom: '4px'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                <Line type="monotone" dataKey="ingresos" stroke="#09090b" strokeWidth={3} dot={false} activeDot={{r: 6, strokeWidth: 0}} />
                <Line type="monotone" dataKey="salidas" stroke="#71717a" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-8">
          <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
            Distribución Global
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeCharts.pie}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {safeCharts.pie.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Uso por Carril */}
      <div className="premium-card p-8">
        <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          Uso de Carriles por Sentido
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.lane}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold', fill: '#a1a1aa'}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold', fill: '#a1a1aa'}}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
              <Bar dataKey="ingresos" fill="#09090b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salidas" fill="#71717a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Mapa de Calor Mejorado */}
      <div className="premium-card p-8">
        <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          Intensidad Temporal (Hora vs Día)
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            {/* Header de horas */}
            <div className="flex mb-2">
              <div className="w-20 shrink-0"></div>
              <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
                {Array.from({length: 24}).map((_, i) => (
                  <span key={i} className="text-[8px] font-black text-zinc-400 text-center uppercase tracking-tighter">
                    {i}h
                  </span>
                ))}
              </div>
            </div>
            {/* Filas de días */}
            <div className="space-y-1">
              {heatmapGrid.map((row) => (
                <div key={row.fecha} className="flex items-center group">
                  <span className="w-20 shrink-0 text-[10px] font-bold text-zinc-500 uppercase tracking-widest tabular-nums">
                    {row.fecha}
                  </span>
                  <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
                    {row.hours.map((val, i) => {
                      const opacity = val === 0 ? 0.03 : (val / maxHeatValue) * 0.9 + 0.1;
                      return (
                        <div 
                          key={i}
                          className="aspect-square rounded-sm transition-all duration-500 group-hover:scale-[1.1] hover:!scale-[1.3] hover:z-10 hover:shadow-xl cursor-help"
                          style={{ 
                            backgroundColor: val > 0 ? '#09090b' : '#f4f4f5',
                            opacity: opacity
                          }}
                          title={`${row.fecha} ${i}:00 - ${val} registros`}
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

      {/* 5. Secuencia Cronológica Individual con Buscador */}
      <div className="premium-card p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            Secuencia de Eventos (Cronología)
          </h3>
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Buscar colaborador o ID..."
              value={sequenceSearch}
              onChange={(e) => setSequenceSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-500/10 focus:border-zinc-300 transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-8">
          {filteredSequences.length > 0 ? filteredSequences.map((user) => (
            <div key={user.id} className="border-b border-zinc-50 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-zinc-900">{user.nombre}</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2 py-1 rounded-md">ID: {user.id}</span>
              </div>
              <div className="h-4 w-full flex items-center relative bg-zinc-50 rounded-full overflow-hidden">
                {user.eventos.map((evt: any, i: number) => {
                  const time = new Date(evt.t);
                  const minutesInDay = time.getHours() * 60 + time.getMinutes();
                  const percentage = (minutesInDay / 1440) * 100;
                  
                  return (
                    <div 
                      key={i}
                      className={`absolute w-1 h-3 rounded-full transition-all hover:scale-y-150 hover:w-1.5 ${evt.tipo === 1 ? 'bg-zinc-950' : 'bg-zinc-400'}`}
                      style={{ left: `${percentage}%` }}
                      title={`${evt.label} - ${evt.t}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] font-bold text-zinc-300 mt-2 uppercase tracking-tighter">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsView;
