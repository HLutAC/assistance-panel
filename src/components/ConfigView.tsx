import React, { useState, useEffect } from 'react';
import { Server, Shield, Scan, Cpu, Network } from 'lucide-react';

const devicesConfig = [
  {
    category: 'Control de Acceso',
    icon: 'shield',
    items: [
      { name: 'Controladora Principal', ip: '172.18.7.100' },
      { name: 'Relé Barrera Norte', ip: '172.18.7.101' },
      { name: 'Relé Barrera Sur', ip: '172.18.7.102' }
    ]
  },
  {
    category: 'Terminales Biométricas',
    icon: 'scan',
    items: [
      { name: 'FaceID - Entrada', ip: '172.18.7.110' },
      { name: 'FaceID - Salida', ip: '172.18.7.111' },
      { name: 'Scanner QR Aux', ip: '172.18.7.112' }
    ]
  },
  {
    category: 'Infraestructura Core',
    icon: 'server',
    items: [
      { name: 'Servidor Hikvision', ip: '172.18.7.50' },
      { name: 'Database Relay', ip: '172.18.7.60' },
      { name: 'Gateway VPN', ip: '172.18.7.1' }
    ]
  }
];

const ConfigView: React.FC = () => {
  const [deviceStatus, setDeviceStatus] = useState<Record<string, 'online' | 'offline'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = () => {
      const statuses: Record<string, 'online' | 'offline'> = {};
      devicesConfig.forEach(group => {
        group.items.forEach(item => {
          statuses[item.ip] = Math.random() > 0.1 ? 'online' : 'offline';
        });
      });
      setDeviceStatus(statuses);
      setLoading(false);
    };

    const timer = setTimeout(checkStatus, 1500);
    return () => clearTimeout(timer);
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
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-500 border border-slate-100 group-hover:bg-primary-50 transition-all duration-500">
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
                    className={`flex items-center justify-between p-5 bg-white rounded-2xl border transition-all duration-500 group/item ${
                      isClickable ? 'cursor-pointer border-slate-100 hover:border-primary-500/20 hover:shadow-lg hover:shadow-primary-500/5 active:scale-[0.98]' : 'border-slate-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 group-hover/item:text-primary-500 transition-colors">{item.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-300 group-hover/item:text-slate-400 transition-colors">{item.ip}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.3)]' : 'bg-slate-200'} ${isOnline && 'animate-pulse'}`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-tight ${isOnline ? 'text-primary-600' : 'text-slate-300'}`}>
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

      {/* Network Blueprint Footer */}
      <div className="polaris-glass p-10 overflow-hidden relative group">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-[0.03] group-hover:opacity-20 transition-opacity duration-1000 rotate-12">
          <Network size={220} className="text-primary-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping"></div>
            <span className="tech-label-light">INFRAESTRUCTURA_CORE_V2.5</span>
          </div>
          <h3 className="text-4xl font-black tracking-tight mb-6 text-slate-800">Topología de Red Resiliente</h3>
          <p className="text-slate-500 text-sm font-bold max-w-4xl leading-loose uppercase tracking-wide">
            SISTEMA DISTRIBUIDO EN SUBRED <span className="bg-indigo-50 text-primary-600 px-3 py-1 rounded-lg border border-indigo-100">172.18.7.0/24</span>. 
            EL SERVIDOR CENTRAL ADMINISTRA EL FLUJO DE EVENTOS Y LA CONMUTACIÓN DE BARRERAS DE ACCESO PERIMETRAL MEDIANTE PROTOCOLOS ENCRIPTADOS_
          </p>
          <div className="mt-10 flex gap-10">
            <div className="flex flex-col">
              <span className="tech-label-light !text-[8px]">ESTADO ENCRIPTACIÓN</span>
              <span className="text-xs font-black text-slate-700 mt-1">AES_256_ACTIVE</span>
            </div>
            <div className="flex flex-col">
              <span className="tech-label-light !text-[8px]">LATENCIA GATEWAY</span>
              <span className="text-xs font-black text-primary-600 mt-1">&lt; 1.2MS_OPTIMO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigView;
