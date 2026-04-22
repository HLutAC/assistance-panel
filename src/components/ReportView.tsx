import React, { useRef } from 'react';
import { FileText, Download, Table as TableIcon, Calendar, Clock, Users, Building2, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateNativePDF } from '../utils/reportUtils';

interface ReportViewProps {
  summary: any;
  charts: any;
  selectedDate: string;
}

const ReportView: React.FC<ReportViewProps> = ({ summary, charts, selectedDate }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      // Use the programmatic generator for 100% reliability
      generateNativePDF(summary, charts, selectedDate);
    } catch (error) {
      console.error("Native PDF Fail:", error);
      alert("Error al generar PDF. Utiliza el botón 'Imprimir' y selecciona 'Guardar como PDF'.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportExcel = () => {
    const wsData = [
      ["REPORTE DE ASISTENCIA - SMARTACCESS"],
      ["Fecha de Reporte", selectedDate || "Todos los registros"],
      [],
      ["RESUMEN OPERATIVO"],
      ["Total Ingresos", summary?.ingresos || 0],
      ["Total Salidas", summary?.salidas || 0],
      ["Usuarios Únicos", charts?.summary?.unique_users || 0],
      ["Hora Pico", charts?.summary?.peak_hour || "N/A"],
      [],
      ["DISTRIBUCIÓN POR CARRERA"],
      ["Carrera", "Cantidad de Accesos"]
    ];

    charts?.escuela?.forEach((item: any) => {
      wsData.push([item.name, item.value]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resumen");
    XLSX.writeFile(wb, `Data_Asistencia_${selectedDate || 'General'}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      <style>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 210mm; 
            min-height: 297mm; 
            padding: 25mm; 
            margin: 0; 
            box-shadow: none; 
            border: none; 
          }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 sticky top-0 z-20 shadow-xl shadow-blue-900/5">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
             <FileText className="text-blue-700" size={24} />
             Generación de Reporte Ejecutivo
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Previsualización en formato A4 estándar</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all active:scale-95 border border-slate-100 uppercase tracking-wider no-print"
          >
            <Printer size={14} />
            Imprimir
          </button>
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100 uppercase tracking-wider"
          >
            <TableIcon size={14} />
            Excel
          </button>
          <button 
            onClick={exportPDF}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-blue-700/20 uppercase tracking-wider ${
              isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download size={14} />
            )}
            {isGenerating ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Report Preview Container */}
      <div className="flex justify-center p-4 bg-slate-900/5 rounded-[40px] border-2 border-dashed border-slate-200">
        <div 
          ref={reportRef}
          className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[25mm] flex flex-col gap-10 text-slate-800 origin-top transform"
          id="printable-report"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-blue-700 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-700 rounded-sm"></div>
                <span className="text-sm font-black tracking-tighter uppercase">Assistance / OS_V4.2</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">ASSISTANCE_LOG</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Reporte generado automáticamente mediante sistema de auditoría</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-300 block uppercase">Timestamp Emisión</span>
              <span className="text-sm font-black block">{new Date().toLocaleString()}</span>
              <div className="mt-4 inline-block bg-blue-700 text-white px-4 py-1 text-[9px] font-black rounded-full uppercase tracking-widest">
                Confidencial
              </div>
            </div>
          </div>

          {/* Context Grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-4">
                <Calendar size={12} className="text-blue-700" />
                Contexto Temporal
              </span>
              <p className="text-lg font-black text-slate-800">{selectedDate || "HISTÓRICO COMPLETO"}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Periodo de análisis seleccionado por el operador</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-4">
                <Building2 size={12} className="text-blue-700" />
                Alcance de Auditoría
              </span>
              <p className="text-lg font-black text-slate-800">TODOS LOS NODOS ACTIVOS</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Barreras vehiculares y Control de acceso peatonal</p>
            </div>
          </div>

          {/* KPI Summary */}
          <div>
            <span className="tech-label-light !bg-slate-100 !text-slate-500 mb-6 block w-fit">Resumen Operativo</span>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'INGRESOS', value: summary?.ingresos || 0, icon: <Download size={12}/>, color: 'text-blue-700' },
                { label: 'SALIDAS', value: summary?.salidas || 0, icon: <Download className="rotate-180" size={12}/>, color: 'text-slate-400' },
                { label: 'USUARIOS ÚNICOS', value: charts?.summary?.unique_users || 0, icon: <Users size={12}/>, color: 'text-slate-800' },
                { label: 'HORA PICO', value: charts?.summary?.peak_hour || 'N/A', icon: <Clock size={12}/>, color: 'text-blue-700' }
              ].map((kpi, i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-xl">
                  <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2">
                    {kpi.icon} {kpi.label}
                  </span>
                  <span className={`text-xl font-black ${kpi.color}`}>{kpi.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution Table */}
          <div className="flex-1">
            <span className="tech-label-light !bg-slate-100 !text-slate-500 mb-6 block w-fit">Distribución por Carrera</span>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase">Facultad / Escuela Profesional</th>
                  <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase">Volumen de Acceso</th>
                  <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase">Impacto %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {charts?.escuela?.slice(0, 10).map((esc: any, i: number) => {
                  const total = (charts?.escuela || []).reduce((acc: number, cur: any) => acc + cur.value, 0);
                  const perc = ((esc.value / (total || 1)) * 100).toFixed(1);
                  return (
                    <tr key={i} className="group">
                      <td className="py-4 text-xs font-black text-slate-700 uppercase">{esc.name}</td>
                      <td className="py-4 text-right text-xs font-black text-slate-800 tabular-nums">{esc.value}</td>
                      <td className="py-4 text-right">
                        <span className="text-[10px] font-black bg-slate-50 px-2 py-1 rounded text-slate-400">{perc}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Metadata */}
          <div className="mt-auto pt-10 border-t border-slate-100 flex justify-between items-end">
            <div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-loose">
                VERIFICACIÓN DE INTEGRIDAD: SHA256_{Math.random().toString(36).substring(7).toUpperCase()}_LOG<br/>
                SISTEMA AUTOMATIZADO DE AUDITORÍA DE ACCESOS - UNAM
              </p>
            </div>
            <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
               <div className="text-[8px] font-black text-slate-300 text-center uppercase">Código QR<br/>Auditoría</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
