import React, { useState, useEffect } from 'react';
import { Search, Edit2, Check, X, RefreshCw, ArrowRight } from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

const EditView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'normalization'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ Nombre: '', escuela: '' });
  const [normForm, setNormForm] = useState({ old_name: '', new_name: '' });
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'confirm' | null }>({ msg: '', type: null });

  const showStatus = (msg: string, type: 'success' | 'error', duration = 3000) => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: null }), duration);
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/personas?search=${encodeURIComponent(searchTerm)}&size=100`);
      const data = await res.json();
      setStudents(data.items);
    } catch (e) {
      showStatus('Error al cargar estudiantes', 'error');
    }
  };

  const fetchEscuelas = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/escuelas`);
      const data = await res.json();
      setEscuelas(data.filter((e: string) => e !== 'Todas'));
    } catch (e) {
      showStatus('Error al cargar escuelas', 'error');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'students') fetchStudents();
    fetchEscuelas();
  }, [activeSubTab]);

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/personas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        showStatus('Registro actualizado con éxito', 'success');
        fetchStudents();
        fetchEscuelas();
      } else {
        showStatus('Error al actualizar registro', 'error');
      }
    } catch (e) {
      showStatus('Error de conexión', 'error');
    }
  };

  const requestNormalization = () => {
    if (!normForm.old_name || !normForm.new_name) return;
    setStatus({ 
      msg: `¿Renombrar todas las ocurrencias de "${normForm.old_name}" a "${normForm.new_name}"?`, 
      type: 'confirm' 
    });
  };

  const executeNormalize = async () => {
    setStatus({ msg: 'Procesando...', type: null });
    try {
      const res = await fetch(`${API_BASE}/personas/normalize-escuela`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normForm)
      });
      if (res.ok) {
        setNormForm({ old_name: '', new_name: '' });
        showStatus('Normalización completada con éxito', 'success');
        fetchEscuelas();
        if (activeSubTab === 'students') fetchStudents();
      } else {
        const err = await res.json();
        showStatus(err.detail || 'Fallo en la normalización', 'error');
      }
    } catch (e: any) {
      showStatus(`Error de red: ${e.message}`, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Sub-navigation */}
      <div className="flex bg-slate-100/50 p-1 rounded-2xl w-fit border border-slate-200">
        <button 
          onClick={() => setActiveSubTab('students')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'students' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Corregir Estudiantes
        </button>
        <button 
          onClick={() => setActiveSubTab('normalization')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'normalization' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Normalizar Carreras
        </button>
      </div>

      {/* Status Notifications & Confirmations Overlay */}
      {status.type && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              status.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
              status.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {status.type === 'success' ? <Check size={24} /> : status.type === 'error' ? <X size={24} /> : <RefreshCw size={24} className="animate-spin" />}
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">
              {status.type === 'confirm' ? 'Confirmar Acción' : status.type === 'success' ? '¡Éxito!' : 'Notificación'}
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{status.msg}</p>
            
            <div className="flex gap-3">
              {status.type === 'confirm' ? (
                <>
                  <button 
                    onClick={executeNormalize}
                    className="flex-1 py-3 bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.95] transition-all"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => setStatus({ msg: '', type: null })}
                    className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setStatus({ msg: '', type: null })}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'students' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar por nombre o ID para editar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/10 transition-all text-slate-800 shadow-sm"
              />
            </div>
            <button 
              onClick={fetchStudents}
              className="p-3 bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrera / Facultad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">{p.id}</td>
                    <td className="px-6 py-4">
                      {editingId === p.id ? (
                        <input 
                          type="text"
                          value={editForm.Nombre}
                          onChange={(e) => setEditForm({ ...editForm, Nombre: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-800"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-700">{p.Nombre}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === p.id ? (
                        <input 
                          type="text"
                          list="escuelas-list"
                          value={editForm.escuela}
                          onChange={(e) => setEditForm({ ...editForm, escuela: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-800"
                        />
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase">
                          {p.escuela || 'Sin asignar'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === p.id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleUpdate(p.id)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-md"><Check size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-400 text-white rounded-xl shadow-md"><X size={14} /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingId(p.id);
                            setEditForm({ Nombre: p.Nombre, escuela: p.escuela || '' });
                          }}
                          className="p-2 text-slate-300 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="polaris-card p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6">Herramienta de Normalización</h3>
            <p className="text-slate-500 text-xs mb-8 uppercase font-bold tracking-wide">Renombrar carreras existentes para corregir tildes, espacios o errores tipográficos de forma masiva.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original (Mal escrito)</label>
                <select 
                  value={normForm.old_name}
                  onChange={(e) => setNormForm({ ...normForm, old_name: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700"
                >
                  <option value="">Seleccione carrera a corregir...</option>
                  {escuelas.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="text-slate-200" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nuevo Nombre (Correcto)</label>
                <input 
                  type="text"
                  list="escuelas-list"
                  placeholder="Ej. Ingeniería de Sistemas"
                  value={normForm.new_name}
                  onChange={(e) => setNormForm({ ...normForm, new_name: e.target.value })}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 shadow-sm"
                />
              </div>

              <button 
                onClick={requestNormalization}
                disabled={!normForm.old_name || !normForm.new_name}
                className="w-full py-4 bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all mt-4"
              >
                Ejecutar Normalización
              </button>
            </div>
          </div>

          <div className="polaris-card p-8 bg-slate-50/50">
            <h3 className="text-xl font-black text-slate-800 mb-6">Carreras Detectadas</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {escuelas.map((e, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setNormForm({ ...normForm, old_name: e })}
                  className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between group cursor-pointer hover:border-blue-700/30 hover:shadow-md transition-all"
                >
                  <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{e}</span>
                  <Edit2 className="text-slate-300 group-hover:text-blue-700 transition-colors" size={14} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <datalist id="escuelas-list">
        {escuelas.map(e => <option key={e} value={e} />)}
      </datalist>
    </div>
  );
};

export default EditView;
