import React from 'react';
import { TrendingUp, TrendingDown, Users, LogIn, LogOut, UserCheck } from 'lucide-react';

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
  
  const total = summary.total_raw ?? summary.total_clean ?? 0;
  const stats = [
    {
      title: 'Tránsito Total',
      value: total.toLocaleString(),
      trend: `+${((total / 30) | 0)}/día`,
      trendPositive: true,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Ingresos',
      value: summary.ingresos.toLocaleString(),
      trend: 'Accesos validados',
      trendPositive: true,
      icon: LogIn,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Salidas',
      value: summary.salidas.toLocaleString(),
      trend: 'Salidas registradas',
      trendPositive: true,
      icon: LogOut,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    {
      title: 'Usuarios Únicos',
      value: summary.usuarios_unicos.toLocaleString(),
      trend: 'Total personas',
      trendPositive: true,
      icon: UserCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div key={stat.title} className="premium-card p-6 flex flex-col group hover:-translate-y-1 hover:border-primary-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.color} group-hover:opacity-80 transition-all`}>
              <stat.icon size={22} />
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
              stat.trendPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {stat.trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {stat.trend}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500 text-sm font-medium mb-1">{stat.title}</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-950 font-mono">
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIStats;
