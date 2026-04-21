import React from 'react';
import { Users, LogIn, LogOut, UserCheck } from 'lucide-react';

interface KPIStatsProps {
  summary: {
    total_raw?: number;
    total_clean?: number;
    ingresos: number;
    salidas: number;
    usuarios_unicos: number;
    eliminados?: number;
  } | null;
}

const KPIStats: React.FC<KPIStatsProps> = ({ summary }) => {
  if (!summary) return null;
  
  const total = summary?.total_clean ?? summary?.total_raw ?? 0;
  const stats = [
    {
      title: 'Transacciones Totales',
      value: total.toLocaleString(),
      trend: summary?.eliminados ? `-${summary.eliminados} Depurados` : `+${((total / 30) | 0)}/D`,
      trendPositive: !summary?.eliminados,
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50/50',
      accentColor: 'bg-indigo-500'
    },
    {
      title: 'Flujo de Ingresos',
      value: (summary?.ingresos ?? 0).toLocaleString(),
      trend: 'Acceso Válido',
      trendPositive: true,
      icon: LogIn,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50/50',
      accentColor: 'bg-emerald-500'
    },
    {
      title: 'Registros de Salida',
      value: (summary?.salidas ?? 0).toLocaleString(),
      trend: 'Salida Registrada',
      trendPositive: true,
      icon: LogOut,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50/50',
      accentColor: 'bg-orange-500'
    },
    {
      title: 'Usuarios Únicos',
      value: (summary?.usuarios_unicos ?? 0).toLocaleString(),
      trend: 'Directorio Root',
      trendPositive: true,
      icon: UserCheck,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50/50',
      accentColor: 'bg-indigo-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="polaris-card p-7 group">
          <div className="flex items-center justify-between mb-8">
            <div className={`p-3 ${stat.bgColor} rounded-2xl ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon size={20} />
            </div>
            <div className="flex flex-col items-end">
              <span className="tech-label-light">NODE_0{idx + 1}</span>
              <div className="w-10 h-1 bg-slate-50 rounded-full overflow-hidden mt-1.5">
                <div className={`h-full ${stat.accentColor} opacity-20`} style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.title}</span>
            <div className="flex items-baseline space-x-3">
              <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
                {stat.value}
              </h3>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${stat.accentColor} animate-pulse`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-tight ${stat.color}`}>
                {stat.trend}
              </span>
            </div>
            <span className="text-[9px] font-black text-slate-200 uppercase tracking-tighter">SYS_OK</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIStats;
