import React, { useState } from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Upload } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'registros', label: 'Bitácora Completa', icon: FileText },
    { id: 'graficos', label: 'Gráficos', icon: BarChart3 },
    { id: 'importar', label: 'Importar Datos', icon: Upload },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-zinc-950/60 backdrop-blur-3xl text-zinc-400 h-screen transition-all duration-500 flex flex-col border-r border-primary-500/10 print:hidden ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-8 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <span className="font-black text-xl text-white tracking-widest uppercase">
              Smart<span className="text-primary-500 glow-text">Access</span>
            </span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl bg-primary-500/5 hover:bg-primary-500/10 text-primary-500 border border-primary-500/20 transition-all active:scale-95"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-3 mt-8">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
              activeTab === item.id 
                ? 'bg-primary-500/10 text-primary-400 glow-border' 
                : 'hover:bg-primary-500/5 hover:text-white'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-primary-500' : 'text-zinc-500 group-hover:text-primary-400 transition-colors'} />
            {!collapsed && (
              <span className="ml-3 font-bold text-[11px] truncate uppercase tracking-[0.2em]">
                {item.label}
              </span>
            )}
            {activeTab === item.id && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-primary-500/5">
        <button className="w-full flex items-center p-3.5 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-all text-zinc-500 group">
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          {!collapsed && <span className="ml-3 font-bold text-[11px] uppercase tracking-[0.2em]">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
