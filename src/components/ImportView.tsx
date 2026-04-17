import React, { useState, useCallback } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2 } from 'lucide-react';

const ImportView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<any>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setStatus('idle');
    } else {
      setStatus('error');
      setMessage('Solo se permiten archivos CSV.');
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setStats(result);
        setFile(null);
      } else {
        setStatus('error');
        setMessage(result.detail || 'Error al procesar el archivo');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
      <div className="mb-12">
        <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Módulo de Ingesta Inteligente</h2>
        <h3 className="text-4xl font-black text-zinc-950 tracking-tighter mb-4 leading-tight">Carga de Transacciones</h3>
        <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-2xl">
          Sincroniza los últimos registros de acceso con el sistema central. El motor de procesamiento validará y deduplicará los datos automáticamente.
        </p>
      </div>

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`premium-card p-12 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center ${
          status === 'error' ? 'border-rose-200 bg-rose-50/10' : 
          status === 'success' ? 'border-emerald-200 bg-emerald-50/10' : 
          'border-zinc-200 hover:border-primary-500 bg-zinc-50/30'
        }`}
      >
        <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center soft-shadow transition-transform duration-500 ${
          status === 'uploading' ? 'animate-bounce' : 'group-hover:scale-110'
        } ${
          status === 'success' ? 'bg-emerald-500 text-white' : 
          status === 'error' ? 'bg-rose-500 text-white' : 
          'bg-white text-zinc-400'
        }`}>
          {status === 'uploading' ? <Loader2 size={32} className="animate-spin" /> : 
           status === 'success' ? <FileCheck size={32} /> : 
           status === 'error' ? <AlertCircle size={32} /> : 
           <Upload size={32} />}
        </div>

        {file ? (
          <div className="space-y-4">
            <h4 className="text-xl font-black text-zinc-950 tracking-tight">{file.name}</h4>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{(file.size / 1024).toFixed(2)} KB</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setFile(null)}
                className="px-6 py-2.5 rounded-xl border border-zinc-200 text-xs font-black uppercase text-zinc-600 hover:bg-zinc-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpload}
                disabled={status === 'uploading'}
                className="px-8 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                Iniciar Sincronización
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-xl font-black text-zinc-950 tracking-tight mb-2">
              {status === 'success' ? '¡Sincronización Completada!' : 'Arrastra tu archivo CSV aquí'}
            </h4>
            <p className="text-zinc-500 font-medium mb-8">O haz clic para buscar en tu equipo</p>
            <input 
              type="file" 
              className="hidden" 
              id="file-upload" 
              accept=".csv"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
            <label 
              htmlFor="file-upload"
              className="px-10 py-3 rounded-2xl bg-zinc-950 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-zinc-950/20 transition-all cursor-pointer active:scale-95"
            >
              Seleccionar Archivo
            </label>
          </div>
        )}
      </div>

      {status === 'success' && stats && (
        <div className="mt-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="premium-card p-6 bg-emerald-500/5 border-emerald-500/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resultado de Ingesta</p>
              <h5 className="text-lg font-black text-zinc-950 tracking-tight">
                Se han sincronizado <span className="text-emerald-600">{stats.records}</span> eventos exitosamente.
              </h5>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Origen</p>
              <p className="text-xs font-mono font-bold text-zinc-600">{stats.source}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-8 animate-in shake-x duration-500">
          <div className="premium-card p-6 bg-rose-500/5 border-rose-500/10">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Error de Sincronización</p>
            <p className="text-sm font-bold text-zinc-950">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportView;
