import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPIStats from './components/KPIStats';
import DataTable from './components/DataTable';
import AnalyticsView from './components/AnalyticsView';
import dashboardDataRaw from './data/dashboard_data.json';

const dashboardData = dashboardDataRaw as any;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  
  // Obtener fecha actual en formato YYYY-MM-DD
  // Usamos una fecha del dataset para la demo (2026-04-17)
  const today = '2026-04-17';

  // Lógica para calcular métricas del día de hoy
  const dailySummary = React.useMemo(() => {
    let ingresos = 0;
    let salidas = 0;
    const uniqueUsers = new Set();
    
    dashboardData.personas.forEach((p: any) => {
      const dailyEvents = p.EventosPorFecha[today];
      if (dailyEvents) {
        uniqueUsers.add(p.ID);
        dailyEvents.forEach((e: any) => {
          if (e.Movimiento === 'INGRESO') ingresos++;
          else if (e.Movimiento === 'SALIDA') salidas++;
        });
      }
    });

    return {
      total_raw: ingresos + salidas,
      total_clean: ingresos + salidas,
      ingresos,
      salidas,
      usuarios_unicos: uniqueUsers.size,
      eliminados: 0
    };
  }, [today]);

  return (
    <div className="flex min-h-screen bg-white font-sans text-zinc-950 selection:bg-primary-500/10">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 print:mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full soft-shadow"></div>
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">Módulo Administrativo</span>
              </div>
              <h1 className="text-5xl font-black text-zinc-950 tracking-tighter mb-4 leading-tight">
                {activeTab === 'resumen' && 'Resumen Ejecutivo'}
                {activeTab === 'registros' && 'Bitácora Completa'}
                {activeTab === 'graficos' && 'Análisis de Datos'}
                {activeTab === 'configuracion' && 'Ajustes del Sistema'}
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-2xl leading-relaxed">
                Plataforma de visualización de datos de alta precisión para la gestión de informes operativos y métricas críticas.
              </p>
            </div>

            {/* Content Switcher based on tab */}
            {activeTab === 'resumen' || activeTab === 'registros' ? (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
                <div className="mb-4">
                  <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Métricas del Día {today.split('-').reverse().join('/')}</h2>
                  <KPIStats summary={dailySummary} />
                </div>
                <div>
                  <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Resumen de Accesos por Persona</h2>
                  <DataTable data={dashboardData.personas} />
                </div>
              </div>
            ) : activeTab === 'graficos' ? (
              <AnalyticsView charts={dashboardData.charts} />
            ) : (
              <div className="premium-card p-24 text-center">
                <div className="mx-auto w-24 h-24 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center text-zinc-300 mb-8 soft-shadow">
                  <span className="text-4xl animate-pulse font-black italic">...</span>
                </div>
                <h3 className="text-3xl font-black text-zinc-950 tracking-tight">Módulo en Desarrollo</h3>
                <p className="text-zinc-500 mt-4 max-w-md mx-auto text-lg font-medium leading-relaxed">
                  Esta sección está siendo optimizada para ofrecerle una experiencia analítica superior.
                </p>
              </div>
            )}
            
            {/* Print Only Footer */}
            <div className="hidden print:block mt-12 pt-8 border-t border-zinc-100">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Generado el: {new Date().toLocaleString()}</span>
                <span>Página 1 de 1</span>
                <span>Admin Dashboard Suite v3.0.0</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
