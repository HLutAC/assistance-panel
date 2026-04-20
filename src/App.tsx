import React, { useState, useEffect } from 'react';
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
  const [escuela, setEscuela] = useState('Todas');
  const [escuelas, setEscuelas] = useState<string[]>([]);
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/config/escuelas`)
      .then(r => r.json())
      .then(setEscuelas)
      .catch(console.error);
  }, []);

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
        const queryParams = `page=${page}&size=${pageSize}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}${escuela !== 'Todas' ? `&escuela=${encodeURIComponent(escuela)}` : ''}&fecha=${fecha}`;
        
        const [summaryRes, personasRes, personasCleanRes, hourlyRes, laneRes, heatmapRes, sequenceRes] = await Promise.all([
          fetch(`${API_BASE}/summary?fecha=${fecha}`),
          fetch(`${API_BASE}/personas?${queryParams}`),
          fetch(`${API_BASE}/personas?${queryParams}&clean=true`),
          fetch(`${API_BASE}/charts/hourly?fecha=${fecha}`),
          fetch(`${API_BASE}/charts/lane?fecha=${fecha}`),
          fetch(`${API_BASE}/charts/heatmap?fecha=${fecha}`),
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
  }, [activeTab, page, searchTerm, pageSize, escuela, fecha]);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 shadow-sm"></div>
        <span className="tech-label-light animate-pulse">CARGANDO RECURSOS...</span>
      </div>
    );
  }

  return (
    <div className="polaris-container bg-slate-50/50">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Navigation Dock */}
      <div className="nav-dock">
        <div 
          onClick={() => setActiveTab('resumen')}
          className={`nav-item ${activeTab === 'resumen' ? 'active' : ''}`}
        >
          RESUMEN
        </div>
        <div 
          onClick={() => setActiveTab('registros')}
          className={`nav-item ${activeTab === 'registros' ? 'active' : ''}`}
        >
          BITÁCORA
        </div>
        <div 
          onClick={() => setActiveTab('graficos')}
          className={`nav-item ${activeTab === 'graficos' ? 'active' : ''}`}
        >
          ANÁLISIS
        </div>
        <div 
          onClick={() => setActiveTab('importar')}
          className={`nav-item ${activeTab === 'importar' ? 'active' : ''}`}
        >
          INGESTA
        </div>
        <div 
          onClick={() => setActiveTab('configuracion')}
          className={`nav-item ${activeTab === 'configuracion' ? 'active' : ''}`}
        >
          SISTEMA
        </div>
      </div>

      {/* Primary Application Stage */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col items-center py-4">
        <div className="w-full max-w-7xl h-[calc(100vh-80px)] polaris-glass p-10 flex flex-col animate-in slide-in-from-bottom-4 duration-700">
          
          {/* Polaris Header */}
          <div className="polaris-header">
            <div className="flex items-center space-x-5">
              <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                <span className="font-black text-lg">S</span>
              </div>
              <div>
                <span className="tech-label-light">SmartAccess // 2.0</span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  {activeTab === 'resumen' && 'Dashboard Operativo'}
                  {activeTab === 'registros' && 'Control de Tráfico'}
                  {activeTab === 'graficos' && 'Analítica Avanzada'}
                  {activeTab === 'importar' && 'Motor de Ingesta'}
                  {activeTab === 'configuracion' && 'Configuración de Nodos'}
                </h1>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <span className="tech-label-light">SISTEMA EN LÍNEA</span>
              <p className="text-sm font-bold text-slate-500">{new Date().toLocaleDateString()} — {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Module Stage Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
            {activeTab === 'resumen' ? (
              <div className="space-y-10">
                <div>
                  <KPIStats summary={summary} />
                </div>
                <div>
                  <DataTable 
                    data={personasClean} 
                    page={page} 
                    setPage={setPage} 
                    total={total} 
                    searchTerm={searchTerm}
                    onSearch={handleSearch}
                    pageSize={pageSize}
                    onSizeChange={handleSizeChange}
                    escuela={escuela}
                    onEscuelaChange={(val) => { setEscuela(val); setPage(1); }}
                    escuelas={escuelas}
                    fecha={fecha}
                    onFechaChange={(val) => { setFecha(val); setPage(1); }}
                  />
                </div>
              </div>
            ) : activeTab === 'registros' ? (
              <div className="h-full flex flex-col">
                <DataTable 
                  data={personas} 
                  page={page} 
                  setPage={setPage} 
                  total={total} 
                  searchTerm={searchTerm}
                  onSearch={handleSearch}
                  pageSize={pageSize}
                  onSizeChange={handleSizeChange}
                  escuela={escuela}
                  onEscuelaChange={(val) => { setEscuela(val); setPage(1); }}
                  escuelas={escuelas}
                  fecha={fecha}
                  onFechaChange={(val) => { setFecha(val); setPage(1); }}
                />
              </div>
            ) : activeTab === 'graficos' ? (
              <AnalyticsView charts={charts} />
            ) : activeTab === 'importar' ? (
              <ImportView />
            ) : activeTab === 'configuracion' ? (
              <ConfigView />
            ) : null}
          </div>
        </div>
      </div>

      {/* Decorative Footprint */}
      <div className="fixed bottom-4 left-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">
        © 2026 Oficina de Tecnologia e Informacion // Polaris Interface
      </div>
    </div>
  );
};

export default App;
