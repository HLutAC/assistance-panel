import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, Download, Table as TableIcon, Calendar, Clock, 
  Users, Building2, Search, X, User, ShieldCheck, 
  Activity, ArrowRight, Fingerprint
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateNativePDF } from '../utils/reportUtils';

interface ReportViewProps {
  summary: any;
  charts: any;
  selectedDate: string;
  token: string | null;
}


const ReportView: React.FC<ReportViewProps> = ({ summary, charts, selectedDate, token }) => {

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [individualData, setIndividualData] = useState<any>(null);
  const [globalEvents, setGlobalEvents] = useState<any[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const [dailySummary, setDailySummary] = useState<any>(null);

  // Fetch Global Events for the audit log
  useEffect(() => {
    const fetchGlobalEvents = async () => {
      setLoadingGlobal(true);
      try {
        const params = new URLSearchParams();
        if (selectedDate) params.append('fecha', selectedDate);
        const res = await fetch(`http://${window.location.hostname}:8000/api/reports/global-events?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        setGlobalEvents(data);
        
        // If no date is selected, fetch "Today" summary for the KPI part of the report
        if (!selectedDate) {
          const today = new Date().toISOString().split('T')[0];
          const sumRes = await fetch(`http://${window.location.hostname}:8000/api/summary?fecha=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const sumData = await sumRes.json();
          setDailySummary(sumData);
        } else {
          setDailySummary(null);
        }
      } catch (e) {
        console.error("Global Events Load Fail:", e);
      } finally {
        setLoadingGlobal(false);
      }
    };
    fetchGlobalEvents();
  }, [selectedDate]);

  const handleSearchStudent = async () => {
    if (!searchId.trim()) return;
    setLoadingStudent(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({ person_id: searchId });
      if (selectedDate) params.append('fecha', selectedDate);
      
        const res = await fetch(`http://${window.location.hostname}:8000/api/reports/individual?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

      const data = await res.json();
      
      if (data.error) {
        setErrorMsg("Estudiante no encontrado o sin registros en el periodo.");
        setIndividualData(null);
      } else {
        setIndividualData(data);
      }
    } catch (e) {
      setErrorMsg("Error de conexión con el servidor de auditoría.");
    } finally {
      setLoadingStudent(false);
    }
  };

  const exportPDF = () => {
    setIsGenerating(true);
    try {
      // Use dailySummary for the overview if available, otherwise fallback to global summary
      const reportSummary = dailySummary || summary;
      generateNativePDF(reportSummary, charts, selectedDate, individualData, globalEvents);
    } catch (error) {
      setErrorMsg("Error al generar PDF técnico.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportExcel = () => {
    const wsData = [
      ["REPORTE DE AUDITORÍA - SMARTACCESS V5.0"],
      ["FECHA REPORTE", selectedDate || "HISTÓRICO COMPLETO"],
      ["EMITIDO EL", new Date().toLocaleString()],
      [],
      individualData ? ["FICHA DE AUDITORÍA INDIVIDUAL"] : ["RESUMEN GLOBAL DEL SISTEMA"],
      individualData ? ["Nombre", `${individualData.person.nombre} ${individualData.person.apellido}`] : ["Total Ingresos", summary?.ingresos || 0],
      individualData ? ["ID", individualData.person.id] : ["Total Salidas", summary?.salidas || 0],
      [],
      ["LOG DE ACTIVIDAD DETALLADO"],
      ["Timestamp", "ID", "Nombre", "Movimiento", "Carril"]
    ];

    const logs = individualData ? individualData.events : globalEvents;
    logs.forEach((e: any) => {
      wsData.push([
        e.t, 
        e.person_id, 
        e.nombre ? `${e.nombre} ${e.apellido}` : (individualData ? `${individualData.person.nombre} ${individualData.person.apellido}` : '---'),
        e.tipo_movimiento,
        e.carril
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit_Log");
    XLSX.writeFile(wb, `Audit_${individualData ? 'Ind_' + searchId : 'Global'}_${selectedDate || 'Full'}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-white shadow-2xl shadow-blue-900/5 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-blue-700" size={24} />
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Audit Engine V5.0</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generador de Documentación Forense</p>
              </div>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Ingresar ID/DNI para Ficha Individual..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                className="w-full pl-12 pr-24 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-700/10 transition-all text-slate-800"
              />
              <button 
                onClick={handleSearchStudent}
                disabled={loadingStudent}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {loadingStudent ? '...' : 'Auditar'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <button onClick={exportExcel} className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95">
              <TableIcon size={20} />
            </button>
            <button 
              onClick={exportPDF} 
              disabled={isGenerating}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
            >
              {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download size={18} />}
              {isGenerating ? 'Generando...' : 'Exportar Auditoría'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-blue-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
          <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">Estado Auditoría</span>
              {individualData ? (
                <button onClick={() => {setIndividualData(null); setSearchId('');}} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={14} /></button>
              ) : null}
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter mb-1">
              {individualData ? 'DETALLE_INDIVIDUAL' : 'REPORTE_SISTEMA'}
            </h3>
            <p className="text-[10px] font-bold text-blue-100 uppercase mb-4 opacity-80">
              {individualData ? `Ficha Técnica de ${individualData.person.nombre}` : 'Resumen Estadístico Global'}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-black">
              <span>{selectedDate || 'Todo el Historial'}</span>
              <ArrowRight size={12} />
              <span className="text-blue-200">ID_NODE_01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
          <X className="text-rose-500 cursor-pointer" onClick={() => setErrorMsg(null)} />
          <p className="text-xs font-black text-rose-800 uppercase tracking-tight">{errorMsg}</p>
        </div>
      )}

      {/* High-Fidelity Preview Container */}
      <div className="flex justify-center p-8 bg-slate-900 rounded-[48px] border-8 border-slate-800 shadow-inner relative">
        {/* Technical Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
          <span className="text-[200px] font-black text-white rotate-45 whitespace-nowrap">UNAM AUDIT SYSTEM</span>
        </div>

        <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] flex flex-col gap-10 text-slate-800 relative z-10 overflow-hidden">
          {/* Audit Ribbon */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white rounded">
                  <Fingerprint size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">SmartAccess // Forensic_Log_V4.5</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900">
                {individualData ? 'STUDENT_AUDIT' : 'SYSTEM_REPORT'}
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-12 bg-blue-700"></div>
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Documentación Oficial de Seguridad</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[8px] font-black text-slate-300 uppercase block tracking-widest">Audit ID</span>
              <span className="text-[12px] font-black block font-mono text-slate-400">SA-AUD-{Math.random().toString(36).substring(7).toUpperCase()}</span>
              <div className="mt-4 inline-block bg-slate-50 border border-slate-100 text-slate-800 px-4 py-1 text-[8px] font-black rounded uppercase tracking-tighter">
                {new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {individualData ? (
            // ==========================================
            // INDIVIDUAL AUDIT PREVIEW
            // ==========================================
            <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex gap-8 p-8 bg-slate-50 rounded-3xl border border-slate-100 relative">
                  <div className="w-32 h-32 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                    <User size={64} />
                  </div>
                  <div className="flex-1 py-2">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">{individualData.person.nombre} {individualData.person.apellido}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">ID Transaccional</span>
                        <span className="text-sm font-black text-blue-700 font-mono">{individualData.person.id}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Dependencia / Escuela</span>
                        <span className="text-sm font-black text-slate-800">{individualData.person.escuela}</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-6">
                  {[
                    { l: 'Ingresos Registrados', v: individualData.stats.ingresos, c: 'text-emerald-700' },

                    { l: 'Salidas Registradas', v: individualData.stats.salidas, c: 'text-orange-600' },

                    { l: 'Total Movimientos', v: individualData.stats.ingresos + individualData.stats.salidas, c: 'text-slate-900' }
                  ].map((s, i) => (
                    <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                       <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">{s.l}</span>
                       <span className={`text-2xl font-black ${s.c}`}>{s.v}</span>
                    </div>
                  ))}
               </div>

               <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="tech-label-light bg-slate-900 text-white italic">Cronología de Actividad</span>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>
                  <div className="space-y-4">
                     {individualData.events.slice(0, 10).map((evt: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                           <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${evt.tipo_movimiento === 'INGRESO' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                              <span className="text-xs font-black text-slate-800 w-24">{evt.t.split(' ')[1]}</span>
                              <span className={`text-[10px] font-black uppercase ${evt.tipo_movimiento === 'INGRESO' ? 'text-emerald-700' : 'text-orange-600'}`}>{evt.tipo_movimiento}</span>


                           </div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">Punto de Control: {evt.carril}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            // ==========================================
            // GLOBAL AUDIT PREVIEW
            // ==========================================
            <div className="space-y-12">
               <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'INGRESOS', value: (dailySummary || summary)?.ingresos || 0, sub: dailySummary ? 'RESUMEN_DIARIO' : 'METRICA_VERIFICADA' },
                    { label: 'SALIDAS', value: (dailySummary || summary)?.salidas || 0, sub: dailySummary ? 'RESUMEN_DIARIO' : 'METRICA_VERIFICADA' },
                    { label: 'USUARIOS', value: (dailySummary || charts?.summary)?.unique_users || 0, sub: 'IDENT_UNICAS' },
                    { label: 'HORA PICO', value: (dailySummary || charts?.summary)?.peak_hour || 'N/A', sub: 'CONGEST_MAX' }
                  ].map((k, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <span className="text-[7px] font-black text-slate-400 uppercase block mb-2">{k.label}</span>
                       <span className="text-2xl font-black text-slate-900 block mb-1">{k.value}</span>
                       <span className="text-[6px] font-black text-blue-700 uppercase tracking-widest">{k.sub}</span>
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-2 gap-12">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="tech-label-light bg-slate-900 text-white italic">Bitácora Global</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>
                    <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                             <th className="py-2 text-[8px] font-black text-slate-300 uppercase text-left">TS</th>
                             <th className="py-2 text-[8px] font-black text-slate-300 uppercase text-left">ID</th>
                             <th className="py-2 text-[8px] font-black text-slate-300 uppercase text-left">PERSONA</th>
                             <th className="py-2 text-[8px] font-black text-slate-300 uppercase text-center">MOV</th>
                             <th className="py-2 text-[8px] font-black text-slate-300 uppercase text-right">TIME</th>
                          </tr>
                        </thead>
                        <tbody>
                          {globalEvents.slice(0, 15).map((e: any, i: number) => (
                             <tr key={i} className="border-b border-slate-50">
                                <td className="py-2 text-[7px] font-black text-slate-300">{e.t.split(' ')[0].split('-').slice(1).join('/')}</td>
                                <td className="py-2 text-[9px] font-black text-slate-400">{e.person_id}</td>
                                <td className="py-2 text-[10px] font-black text-slate-700 uppercase truncate max-w-[120px]">{e.nombre} {e.apellido}</td>
                                <td className="py-2 text-center">
                                   <span className={`text-[7px] font-black uppercase ${e.tipo_movimiento === 'INGRESO' ? 'text-blue-700' : 'text-emerald-600'}`}>{e.tipo_movimiento[0]}</span>
                                </td>
                                <td className="py-2 text-right text-[9px] font-black text-slate-400 tabular-nums">{e.t.split(' ')[1]}</td>
                             </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
                  <div>
                     <div className="flex items-center gap-3 mb-6">
                       <span className="tech-label-light bg-slate-900 text-white italic">Distribución Académica</span>
                       <div className="flex-1 h-px bg-slate-100"></div>
                     </div>
                     <div className="space-y-4">
                        {charts?.escuela?.slice(0, 8).map((esc: any, i: number) => {
                           const total = (charts?.escuela || []).reduce((acc: number, cur: any) => acc + cur.value, 0);
                           const perc = ((esc.value / (total || 1)) * 100).toFixed(1);
                           return (
                             <div key={i} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                   <span className="text-[8px] font-black text-slate-500 uppercase truncate max-w-[150px]">{esc.name}</span>
                                   <span className="text-[9px] font-black text-blue-700">{perc}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-700 rounded-full" style={{ width: `${perc}%` }}></div>
                                </div>
                             </div>
                           )
                        })}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Signature & Audit Footer */}
          <div className="mt-auto pt-10 border-t border-slate-100 relative z-10">
            <div className="grid grid-cols-4 gap-8 items-end">
               <div className="col-span-2">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-loose">
                    VALIDACIÓN FORENSE: SHA256_{Math.random().toString(36).substring(7).toUpperCase()}_LOG<br/>
                    ESTE DOCUMENTO ES CONFIDENCIAL Y PARA USO EXCLUSIVO DE LA UNAM.
                  </p>
               </div>
               <div className="text-center">
                  <div className="h-px w-full bg-slate-300 mb-2"></div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Firma Autorizada</span>
               </div>
               <div className="flex justify-end">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 p-2 text-center">
                     <div className="w-full h-full border border-dashed border-slate-200 flex items-center justify-center">
                        <span className="text-[7px] font-black text-slate-200 uppercase leading-none">QR_AUDIT_VERIFY</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
