import React, { useState, useEffect } from 'react';
import KPIStats from './components/KPIStats';
import DataTable from './components/DataTable';
import AnalyticsView from './components/AnalyticsView';
import ImportView from './components/ImportView';
import ConfigView from './components/ConfigView';
import EditView from './components/EditView';
import ReportView from './components/ReportView';
import LoginView from './components/LoginView';
import { LogOut } from 'lucide-react';


const API_BASE = `http://${window.location.hostname}:8000/api`;

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('polaris_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('polaris_user') || 'null'));
  const [activeTab, setActiveTab] = useState('resumen');

  const [summary, setSummary] = useState<any>(null);
  const [personas, setPersonas] = useState<any>([]);
  const [personasClean, setPersonasClean] = useState<any>([]);
  const [charts, setCharts] = useState<{
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
  }>({
    hourly: [],
    lane: [],
    pie: [],
    heatmap: [],
    sequence: [],
    escuela: [],
    duration: [],
    durationEscuela: [],
    hourlyEscuela: [],
    durationHourlyEscuela: [],
    summary: null
  });
  const [loading, setLoading] = useState(true);
  
  // Pagination, Search & Size State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [escuela, setEscuela] = useState('Todas');
  const [escuelas, setEscuelas] = useState<string[]>([]);
  const [fecha, setFecha] = useState('');
  const [analyticsSearch, setAnalyticsSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/config/escuelas`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(setEscuelas)
      .catch(console.error);
  }, [token]);


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
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        const today = new Date().toISOString().split('T')[0];
        // Only use 'today' for display purposes if needed, but let API handle empty fecha for global view
        const summaryDate = fecha;

        
        const queryParams = `page=${page}&size=${pageSize}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}${escuela !== 'Todas' ? `&escuela=${encodeURIComponent(escuela)}` : ''}&fecha=${fecha || ''}`;
        const analyticParams = new URLSearchParams({
          fecha: summaryDate,
          search: analyticsSearch
        }).toString();
        
        const responses = await Promise.all([
          fetch(`${API_BASE}/summary?fecha=${summaryDate}`, { headers }),
          fetch(`${API_BASE}/personas?${queryParams}`, { headers }),
          fetch(`${API_BASE}/personas?${queryParams}&clean=true`, { headers }),
          fetch(`${API_BASE}/charts/hourly?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/lane?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/pie?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/heatmap?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/sequence`, { headers }),
          fetch(`${API_BASE}/charts/escuela?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/summary-stats?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/duration?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/duration-escuela?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/hourly-escuela?${analyticParams}`, { headers }),
          fetch(`${API_BASE}/charts/duration-hourly-escuela?${analyticParams}`, { headers })
        ]);

        if (responses.some(r => r.status === 401)) {
          handleLogout();
          return;
        }

        const [
          summaryRes, 
          personasRes, 
          personasCleanRes, 
          hourlyRes, 
          laneRes, 
          pieRes, 
          heatmapRes, 
          sequenceRes, 
          escuelaRes, 
          summaryStatsRes,
          durationRes,
          durationEscuelaRes,
          hourlyEscuelaRes,
          durationHourlyEscuelaRes
        ] = responses;



        const summaryData = await summaryRes.json();
        const personasData = await personasRes.json();
        const personasCleanData = await personasCleanRes.json();
        
        const hourlyData = await hourlyRes.json();
        const laneData = await laneRes.json();
        const pieData = await pieRes.json();
        const heatmapData = await heatmapRes.json();
        const sequenceData = await sequenceRes.json();
        const escuelaData = await escuelaRes.json();
        const summaryStats = await summaryStatsRes.json();
        const durationData = await durationRes.json();
        const durationEscuelaData = await durationEscuelaRes.json();
        const hourlyEscuelaData = await hourlyEscuelaRes.json();
        const durationHourlyEscuelaData = await durationHourlyEscuelaRes.json();

        setSummary(summaryData);
        setPersonas(personasData.items || []);
        setPersonasClean(personasCleanData.items || []);
        setTotal(personasData.total || 0);

        setCharts({ 
          hourly: Array.isArray(hourlyData) ? hourlyData : [],
          lane: Array.isArray(laneData) ? laneData : [],
          pie: Array.isArray(pieData) ? pieData : [],
          heatmap: Array.isArray(heatmapData) ? heatmapData : [],
          sequence: Array.isArray(sequenceData) ? sequenceData : [],
          escuela: Array.isArray(escuelaData) ? escuelaData : [],
          duration: Array.isArray(durationData) ? durationData : [],
          durationEscuela: Array.isArray(durationEscuelaData) ? durationEscuelaData : [],
          hourlyEscuela: Array.isArray(hourlyEscuelaData) ? hourlyEscuelaData : [],
          durationHourlyEscuela: Array.isArray(durationHourlyEscuelaData) ? durationHourlyEscuelaData : [],
          summary: summaryStats || { peak_hour: 'N/A', unique_users: 0 }
        });

      } catch (error) {
        console.error("Error fetching data from API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Configurar auto-refresco cada 30 segundos para monitoreo en tiempo real
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeTab, page, searchTerm, pageSize, escuela, fecha, analyticsSearch, token]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('polaris_token', newToken);
    localStorage.setItem('polaris_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('polaris_token');
    localStorage.removeItem('polaris_user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (loading && !summary) {

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-700 shadow-sm"></div>
        <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] animate-pulse">CARGANDO RECURSOS...</span>
      </div>
    );
  }

  return (
    <div className="polaris-container bg-slate-50/50">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-700/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>

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
        <div 
          onClick={() => setActiveTab('gestion')}
          className={`nav-item ${activeTab === 'gestion' ? 'active' : ''}`}
        >
          GESTIÓN
        </div>
        <div 
          onClick={() => setActiveTab('reporte')}
          className={`nav-item ${activeTab === 'reporte' ? 'active' : ''}`}
        >
          REPORTE
        </div>
      </div>

      {/* Primary Application Stage */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col items-center py-2 md:py-4">
        <div className="w-full max-w-[98%] h-full md:h-[calc(100vh-80px)] polaris-glass p-4 md:p-10 flex flex-col animate-in slide-in-from-bottom-4 duration-700">
          
          {/* Module Stage Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4">
            
            {/* Polaris Header */}
            <div className="polaris-header flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center space-x-3 md:space-x-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-700 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                  <span className="font-black text-sm md:text-lg">S</span>
                </div>
                <div>
                  <span className="tech-label-light">SmartAccess // 2.0</span>
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                    {activeTab === 'resumen' && 'Dashboard Operativo'}
                    {activeTab === 'registros' && 'Control de Tráfico'}
                    {activeTab === 'graficos' && 'Monitor de Tráfico Dinámico'}
                    {activeTab === 'importar' && 'Motor de Ingesta'}
                    {activeTab === 'configuracion' && 'Configuración de Nodos'}
                    {activeTab === 'gestion' && 'Gestión y Normalización'}
                    {activeTab === 'reporte' && 'Generación de Reportes'}
                  </h1>
                </div>
              </div>
              <div className="text-left md:text-right flex flex-col items-start md:items-end gap-1">
                <span className="tech-label-light">SISTEMA EN LÍNEA</span>
                <p className="text-[10px] md:text-sm font-bold text-slate-400">{new Date().toLocaleDateString()} — {new Date().toLocaleTimeString()}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user?.nombre || user?.username}</span>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>

            </div>

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
              <AnalyticsView 
                charts={charts} 
                selectedDate={fecha} 
                analyticsSearch={analyticsSearch}
                onAnalyticsSearch={setAnalyticsSearch}
                token={token}
              />

            ) : activeTab === 'importar' ? (
              <ImportView token={token} />

            ) : activeTab === 'configuracion' ? (
              <ConfigView token={token} />

            ) : activeTab === 'gestion' ? (
              <EditView token={token} />

            ) : activeTab === 'reporte' ? (
              <ReportView 
                summary={summary} 
                charts={charts} 
                selectedDate={fecha}
                token={token}
              />

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
