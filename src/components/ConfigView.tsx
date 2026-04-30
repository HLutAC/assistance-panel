import React, { useState, useEffect } from 'react';
import { Server, Shield, Scan, Cpu, Settings, Key, Check, Users } from 'lucide-react';

const devicesConfig = [
  {
    category: 'Control de Acceso',
    icon: 'shield',
    items: [
      { name: 'BARRERA CARRIL 01', ip: '172.18.7.150' },
      { name: 'BARRERA CARRIL 02', ip: '172.18.7.151' }
    ]
  },
  {
    category: 'Terminales Biométricas',
    icon: 'scan',
    items: [
      { name: 'REC. FACIAL INGRESO 01', ip: '172.18.7.152' },
      { name: 'REC. FACIAL SALIDA 01', ip: '172.18.7.153' },
      { name: 'REC. FACIAL INGRESO 02', ip: '172.18.7.154' },
      { name: 'REC. FACIAL SALIDA 02', ip: '172.18.7.155' }
    ]
  },
  {
    category: 'Infraestructura Core',
    icon: 'server',
    items: [
      { name: 'Servidor Hikvision', ip: '172.18.7.5' }
    ]
  }
];

interface ConfigViewProps {
  token: string | null;
}

const ConfigView: React.FC<ConfigViewProps> = ({ token }) => {

  const [deviceStatus, setDeviceStatus] = useState<Record<string, 'online' | 'offline'>>({});
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('device_creds');
    return saved ? JSON.parse(saved) : { user: '', pass: '' };
  });
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    localStorage.setItem('device_creds', JSON.stringify(credentials));
  }, [credentials]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:8000/api/devices/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const statuses = await response.json();
          setDeviceStatus(statuses);
        }
      } catch (error) {
        console.error("Error fetching device status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus({ ...copyStatus, [id]: true });
    setTimeout(() => setCopyStatus({ ...copyStatus, [id]: false }), 2000);
  };

  const handleTest = async (ip: string) => {
    setTestResult({ ...testResult, [ip]: 'probando...' });
    try {
      const res = await fetch(`http://localhost:8000/api/devices/proxy/${ip}?user=${credentials.user}&password=${credentials.pass}`);
      const data = await res.json();
      if (data.status === 'authenticated') {
        setTestResult({ ...testResult, [ip]: 'OK' });
      } else {
        setTestResult({ ...testResult, [ip]: 'ERROR' });
      }
    } catch (e) {
      setTestResult({ ...testResult, [ip]: 'FAIL' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server size={20} />;
      case 'shield': return <Shield size={20} />;
      case 'scan': return <Scan size={20} />;
      default: return <Cpu size={20} />;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 overflow-y-auto custom-scrollbar">
      
      {/* Credentials Config */}
      <div className="flex justify-end pr-4">
        <button 
          onClick={() => setShowCreds(!showCreds)}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-2"
        >
          <Settings size={12} />
          {showCreds ? 'Ocultar Configuración de Acceso' : 'Configurar Acceso Directo'}
        </button>
      </div>

      {showCreds && (
        <div className="polaris-glass p-8 flex flex-col md:flex-row gap-6 mb-8 border-blue-100/50 bg-blue-50/10">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Usuario de Dispositivos</label>
            <input 
              type="text" 
              value={credentials.user}
              onChange={(e) => setCredentials({...credentials, user: e.target.value})}
              className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-700/10"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Contraseña de Dispositivos</label>
            <input 
              type="password" 
              value={credentials.pass}
              onChange={(e) => setCredentials({...credentials, pass: e.target.value})}
              className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-700/10"
            />
          </div>
          <div className="md:w-64 flex items-end">
            <p className="text-[8px] font-bold text-slate-400 leading-relaxed uppercase bg-slate-100 p-3 rounded-lg border border-slate-200">
              <Shield className="inline mb-1 mr-1 text-slate-500" size={10} />
              SEGURIDAD: Las credenciales se guardan solo en este navegador (localStorage).
            </p>
          </div>
        </div>
      )}

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {devicesConfig.map((group, idx) => (
          <div key={idx} className="polaris-card p-8 flex flex-col h-full relative group">
            <div className="absolute top-0 right-0 p-5 font-bold text-[9px] text-slate-200 uppercase tracking-widest pointer-events-none">NODE_SYS_0{idx + 1}</div>
            
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-700 border border-slate-100 group-hover:bg-blue-50 transition-all duration-500">
                {getIcon(group.icon)}
              </div>
              <span className="tech-label-light !text-[10px]">{group.category}</span>
            </div>
            
            <div className="space-y-4 flex-1 relative z-10">
              {group.items.map((item: any, i: number) => {
                const isOnline = deviceStatus[item.ip] === 'online';
                const isClickable = group.icon === 'scan' || group.icon === 'server';
                
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (isClickable) {
                        const url = `http://${credentials.user}:${credentials.pass}@${item.ip}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className={`flex items-center justify-between p-5 bg-white rounded-2xl border transition-all duration-500 group/item shadow-sm ${
                      isClickable ? 'cursor-pointer border-slate-100 hover:border-blue-700/20 hover:shadow-lg hover:shadow-blue-900/5 active:scale-[0.98]' : 'border-slate-50'
                    }`}
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover/item:text-blue-700 transition-colors">{item.name}</span>
                        {isClickable && (
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCopy(credentials.user, `${item.ip}-u`); }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400"
                              title="Copiar Usuario"
                            >
                              {copyStatus[`${item.ip}-u`] ? <Check size={10} /> : <Users size={10} />}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCopy(credentials.pass, `${item.ip}-p`); }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400"
                              title="Copiar Contraseña"
                            >
                              {copyStatus[`${item.ip}-p`] ? <Check size={10} /> : <Key size={10} />}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-300 group-hover/item:text-slate-400 transition-colors uppercase">{item.ip}</span>
                        {isClickable && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleTest(item.ip); }}
                             className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                               testResult[item.ip] === 'OK' ? 'bg-emerald-50 text-emerald-600' : 
                               testResult[item.ip] === 'ERROR' || testResult[item.ip] === 'FAIL' ? 'bg-red-50 text-red-600' :
                               'bg-slate-50 text-slate-400 hover:bg-slate-100'
                             }`}
                           >
                             {testResult[item.ip] || 'Test Auth'}
                           </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 ml-4">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-200'} ${isOnline && 'animate-pulse'}`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-tight ${isOnline ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {loading ? 'Sincronizando...' : isOnline ? 'Conectado' : 'Link Caído'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigView;
