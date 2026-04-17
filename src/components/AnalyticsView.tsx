import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
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
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out pb-20">
      
      {/* 1. Flujo por Hora y 3. Ingress vs Egress (Layout Row) */}
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
                  data={charts.pie}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.pie.map((_, index) => (
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

      {/* 5. Mapa de Calor (Heatmap Alternativo con Scatter o Grid personalizado) */}
      <div className="premium-card p-8">
        <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          Mapa de Calor: Intensidad Temporal (Hora vs Día)
        </h3>
        <div className="h-[400px] w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis 
                  type="number" 
                  dataKey="hora" 
                  name="Hora" 
                  domain={[0, 23]} 
                  tickCount={24}
                  axisLine={false}
                  tick={{fontSize: 10, fontWeight: 'bold'}}
                />
                <YAxis 
                  type="category" 
                  dataKey="fecha" 
                  name="Fecha" 
                  axisLine={false}
                  tick={{fontSize: 10, fontWeight: 'bold'}}
                />
                <ZAxis type="number" dataKey="value" range={[50, 400]} name="Accesos" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Scatter name="Accesos" data={charts.heatmap} fill="#09090b" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 8. Secuencia Cronológica Individual */}
      <div className="premium-card p-8">
        <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          Secuencia de Eventos: Top 10 Usuarios (Cronología)
        </h3>
        <div className="space-y-6">
          {charts.sequence.map((user) => (
            <div key={user.id} className="border-b border-zinc-50 pb-4 last:border-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-zinc-900">{user.nombre}</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">ID: {user.id}</span>
              </div>
              <div className="h-6 w-full flex items-center relative bg-zinc-50 rounded-full overflow-hidden">
                {user.eventos.map((evt: any, i: number) => {
                  const time = new Date(evt.t);
                  const minutesInDay = time.getHours() * 60 + time.getMinutes();
                  const percentage = (minutesInDay / 1440) * 100;
                  
                  return (
                    <div 
                      key={i}
                      className={`absolute w-1 h-4 rounded-full ${evt.tipo === 1 ? 'bg-zinc-950' : 'bg-zinc-300'}`}
                      style={{ left: `${percentage}%` }}
                      title={`${evt.label} - ${evt.t}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] font-bold text-zinc-300 mt-1 uppercase">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsView;
