import React, { useState } from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'registros', label: 'Registros Detallados', icon: FileText },
    { id: 'graficos', label: 'Gráficos', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-white/80 backdrop-blur-2xl text-zinc-500 h-screen transition-all duration-300 flex flex-col border-r border-zinc-200/50 print:hidden ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shadow-lg shadow-zinc-950/20 text-white font-black text-xl leading-none">
              R
            </div>
            <span className="font-bold text-xl text-zinc-950 tracking-tight">Report<span className="text-primary-500">System</span></span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-all active:scale-95"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-primary-500/10 text-primary-600 soft-shadow border border-primary-500/20' 
                : 'hover:bg-zinc-100/80 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-primary-600' : 'text-zinc-400 group-hover:text-primary-500 transition-colors'} />
            {!collapsed && <span className="ml-3 font-semibold text-sm truncate uppercase tracking-wider">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-100">
        <button className="w-full flex items-center p-3 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all text-zinc-400">
          <LogOut size={20} />
          {!collapsed && <span className="ml-3 font-semibold text-sm uppercase tracking-wider">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
