import React, { useState, useEffect } from 'react';
import { Server, Shield, Scan, Cpu, Network } from 'lucide-react';

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

const ConfigView: React.FC = () => {
  const [deviceStatus, setDeviceStatus] = useState<Record<string, 'online' | 'offline'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/devices/status');
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
                    onClick={() => isClickable && window.open(`http://${item.ip}`, '_blank')}
                    className={`flex items-center justify-between p-5 bg-white rounded-2xl border transition-all duration-500 group/item shadow-sm ${
                      isClickable ? 'cursor-pointer border-slate-100 hover:border-blue-700/20 hover:shadow-lg hover:shadow-blue-900/5 active:scale-[0.98]' : 'border-slate-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 group-hover/item:text-blue-700 transition-colors">{item.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-300 group-hover/item:text-slate-400 transition-colors">{item.ip}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
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
