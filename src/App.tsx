import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPIStats from './components/KPIStats';
import DataTable from './components/DataTable';
import AnalyticsView from './components/AnalyticsView';
import ImportView from './components/ImportView';
import ConfigView from './components/ConfigView';

const API_BASE = "http://localhost:8000/api";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [summary, setSummary] = useState<any>(null);
  const [personas, setPersonas] = useState<any>([]);
  const [personasClean, setPersonasClean] = useState<any>([]);
  const [charts, setCharts] = useState<any>({ hourly: [], lane: [], pie: [], heatmap: [], sequence: [] });
  const [loading, setLoading] = useState(true);
  
  // Pagination, Search & Size State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = `page=${page}&size=${pageSize}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
        
        const [summaryRes, personasRes, personasCleanRes, hourlyRes, laneRes, heatmapRes, sequenceRes] = await Promise.all([
          fetch(`${API_BASE}/summary`),
          fetch(`${API_BASE}/personas?${queryParams}`),
          fetch(`${API_BASE}/personas?${queryParams}&clean=true`),
          fetch(`${API_BASE}/charts/hourly`),
          fetch(`${API_BASE}/charts/lane`),
          fetch(`${API_BASE}/charts/heatmap`),
          fetch(`${API_BASE}/charts/sequence`)
        ]);

        const summaryData = await summaryRes.json();
        const personasData = await personasRes.json();
        const personasCleanData = await personasCleanRes.json();
        
        setSummary(summaryData);
        setPersonas(personasData.items);
        setPersonasClean(personasCleanData.items);
        setTotal(personasData.total);
        setCharts({
          hourly: await hourlyRes.json(),
          lane: await laneRes.json(),
          pie: [
            { name: "Ingresos", value: summaryData.ingresos },
            { name: "Salidas", value: summaryData.salidas }
          ],
          heatmap: await heatmapRes.json(),
          sequence: await sequenceRes.json()
        });
      } catch (error) {
        console.error("Error fetching data from API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, page, searchTerm, pageSize]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

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
                {activeTab === 'importar' && 'Centro de Ingesta'}
                {activeTab === 'configuracion' && 'Ajustes del Sistema'}
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-2xl leading-relaxed">
                Plataforma de visualización de datos de alta precisión respaldada por PostgreSQL para la gestión de informes operativos.
              </p>
            </div>

            {/* Content Switcher based on tab */}
            {activeTab === 'resumen' ? (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
                <div className="mb-4">
                  <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Métricas Globales (Histórico)</h2>
                  <KPIStats summary={summary} />
                </div>
                <div>
                  <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Resumen de Accesos Recientes (Depurado)</h2>
                  <DataTable 
                    data={personasClean} 
                    page={page} 
                    setPage={setPage} 
                    total={total} 
                    searchTerm={searchTerm}
                    onSearch={handleSearch}
                    pageSize={pageSize}
                    onSizeChange={handleSizeChange}
                  />
                </div>
              </div>
            ) : activeTab === 'registros' ? (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out">
                <div className="mb-4">
                  <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Bitácora Completa de Eventos desde PostgreSQL</h2>
                  <DataTable 
                    data={personas} 
                    page={page} 
                    setPage={setPage} 
                    total={total} 
                    searchTerm={searchTerm}
                    onSearch={handleSearch}
                    pageSize={pageSize}
                    onSizeChange={handleSizeChange}
                  />
                </div>
              </div>
            ) : activeTab === 'graficos' ? (
              <AnalyticsView charts={charts} />
            ) : activeTab === 'importar' ? (
              <ImportView />
            ) : activeTab === 'configuracion' ? (
              <ConfigView />
            ) : (
              <div className="premium-card p-24 text-center">
                <div className="mx-auto w-24 h-24 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center text-zinc-300 mb-8 soft-shadow">
                  <span className="text-4xl animate-pulse font-black italic">...</span>
                </div>
                <h3 className="text-3xl font-black text-zinc-950 tracking-tight">PostgreSQL Backend</h3>
                <p className="text-zinc-500 mt-4 max-w-md mx-auto text-lg font-medium leading-relaxed">
                  Sistema conectado exitosamente. Los datos se sirven ahora de forma dinámica desde el servidor administrado.
                </p>
              </div>
            )}
            
            {/* Print Only Footer */}
            <div className="hidden print:block mt-12 pt-8 border-t border-zinc-100">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Generado el: {new Date().toLocaleString()}</span>
                <span>Página 1 de 1</span>
                <span>SmartAccess Dashboard Suite v4.0.0 (PG)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
