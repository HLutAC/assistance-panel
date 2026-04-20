import React, { useState, useEffect } from 'react';
import { Server, Shield, Scan, Cpu, Network } from 'lucide-react';

const ConfigView: React.FC = () => {
  const [deviceStatus, setDeviceStatus] = useState<Record<string, 'online' | 'offline'>>({});
  const [devicesConfig, setDevicesConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/config/devices');
      const data = await resp.json();
      setDevicesConfig(data);
    } catch (err) {
      console.error("Error fetching config:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/devices/status');
      const data = await resp.json();
      setDeviceStatus(data);
    } catch (err) {
      console.error("Error fetching device status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Cada 30 seg
    return () => clearInterval(interval);
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'shield': return <Shield className="text-primary-500" size={24} />;
      case 'scan': return <Scan className="text-secondary-500" size={24} />;
      case 'server': return <Server className="text-zinc-600" size={24} />;
      default: return <Cpu size={24} />;
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devicesConfig.map((group, idx) => (
          <div key={idx} className="premium-card p-6 flex flex-col h-full bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-zinc-50 rounded-2xl">
                {getIcon(group.icon)}
              </div>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest">{group.category}</h3>
            </div>
            
            <div className="space-y-3 flex-1">
              {group.items.map((item: any, i: number) => {
                const isOnline = deviceStatus[item.ip] === 'online';
                const isClickable = group.icon === 'scan' || group.icon === 'server';
                
                return (
                  <div 
                    key={i} 
                    onClick={() => isClickable && window.open(`http://${item.ip}`, '_blank')}
                    className={`flex items-center justify-between p-3 bg-zinc-50/50 rounded-xl border border-zinc-100/50 group transition-all duration-300 ${
                      isClickable ? 'cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 active:scale-[0.98]' : 'cursor-default'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">{item.name}</span>
                      <span className="text-sm font-mono font-bold text-zinc-900">{item.ip}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {loading ? '---' : isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="premium-card p-8 bg-zinc-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Network size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="text-primary-400" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Estado del Sistema</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Configuración de Red Unificada</h3>
          <p className="text-zinc-400 text-sm font-medium max-w-xl leading-relaxed">
            Todos los dispositivos están sincronizados con la subred administrativa <span className="text-white font-mono">172.18.7.0/24</span>. 
            El servidor Hikvision centraliza la gestión de eventos faciales y el control de relevadores para las barreras vehiculares.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigView;
