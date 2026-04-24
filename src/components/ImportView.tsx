import React, { useState, useRef } from 'react';
import { Upload, FileCheck, X, AlertCircle,RefreshCw } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000/api`;

const ImportView: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) setFile(droppedFile);
      else setStatus({ type: 'error', msg: 'Formato inválido. Se requiere un archivo .csv' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: `Sincronización completa: ${data.inserted} registros procesados.` });
        setFile(null);
      } else {
        setStatus({ type: 'error', msg: data.detail || 'Error en el procesamiento del archivo.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Error de conexión con el motor de ingesta.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-2">
        <span className="tech-label-light">Data Ingestion // Node Sync</span>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Motor de Ingesta</h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">Sincronice los registros locales cargando archivos CSV con formato de exportación Hikvision.</p>
      </div>

      <div className="polaris-glass p-12 relative overflow-hidden">
        <form 
          onDragEnter={handleDrag} 
          onDragOver={handleDrag} 
          onDragLeave={handleDrag} 
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-16 transition-all duration-700 flex flex-col items-center justify-center space-y-8 ${
            dragActive ? 'border-blue-700 bg-blue-700/5' : 'border-slate-100 hover:border-slate-200 bg-white/30'
          }`}
        >
          <input ref={inputRef} type="file" className="hidden" accept=".csv" onChange={handleChange} />
          
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-700 shadow-xl shadow-blue-900/10 border border-slate-50">
            {uploading ? (
              <RefreshCw className="animate-spin" size={40} />
            ) : file ? (
              <FileCheck size={40} className="animate-bounce" />
            ) : (
              <Upload size={40} />
            )}
          </div>

          <div className="text-center">
            {file ? (
              <div className="space-y-4">
                <p className="text-lg font-black text-slate-800">{file.name}</p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setFile(null)} className="p-3 text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={20} />
                  </button>
                  <button 
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-10 py-3.5 bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                  >
                    {uploading ? 'PROCESANDO...' : 'INICIAR SINCRONIZACIÓN'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-lg font-black text-slate-700">Arrastre aquí su archivo .CSV</p>
                <button 
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                  Explorar Archivos
                </button>
              </div>
            )}
          </div>
        </form>

        {status && (
          <div className={`mt-10 p-6 rounded-2xl flex items-center gap-4 border animate-in zoom-in-95 duration-500 ${
            status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            {status.type === 'success' ? <FileCheck size={20} /> : <AlertCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-tight">{status.msg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
        <div className="polaris-card p-8 space-y-4 opacity-60">
          <span className="tech-label-light">REQUISITOS</span>
          <h4 className="font-black text-slate-800 tracking-tight">Formato del Archivo</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
            EL CSV DEBE CONTENER COLUMNAS ESTÁNDAR: NOMBRE, HORA, EVENTO Y LUGAR. CARACTERES ESPECIALES SERÁN NORMALIZADOS DURANTE LA INGESTA_
          </p>
        </div>
        <div className="polaris-card p-8 space-y-4 opacity-60">
          <span className="tech-label-light">PROCESAMIENTO</span>
          <h4 className="font-black text-slate-800 tracking-tight">Capa de Seguridad</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
            CADA REGISTRO ES VALIDADO PREVIAMENTE PARA EVITAR DUPLICADOS Y ASEGURAR LA INTEGRIDAD DE LA BASE DE DATOS CENTRALIZADA_
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportView;
