import React from 'react';
import { Search, Calendar, FileDown, Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-20 bg-zinc-950/40 backdrop-blur-3xl border-b border-primary-500/10 px-8 flex items-center justify-between sticky top-0 z-10 print:hidden">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50 group-focus-within:text-primary-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="ACCESS_COMMAND: BÚSQUEDA_GLOBAL..." 
            className="w-full pl-10 pr-4 py-2 bg-primary-500/5 border border-primary-500/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-xs text-white placeholder:text-zinc-600 font-mono tracking-wider"
          />
        </div>
      </div>

      <div className="flex items-center space-x-5">
        <div className="flex items-center bg-primary-500/5 border border-primary-500/10 rounded-xl px-4 py-2 text-[10px] text-primary-400 font-black uppercase tracking-widest space-x-2 transition-all hover:bg-primary-500/10">
          <Calendar size={14} className="text-primary-500" />
          <span>MAR 10 - ABR 20, 2026</span>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 print:hidden"
        >
          <FileDown size={16} />
          <span>Reporte_PDF</span>
        </button>

        <div className="h-4 w-px bg-primary-500/20 mx-2"></div>

        <button className="p-2.5 text-zinc-500 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl relative transition-all">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
        </button>

        <div className="flex items-center space-x-4 ml-2 pl-4 border-l border-primary-500/10">
          <div className="text-right flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-wider leading-none">Root_Admin</span>
            <span className="text-[9px] font-bold text-primary-500/70 uppercase tracking-[0.2em] mt-1.5">SYS_OPERATOR</span>
          </div>
          <div className="w-11 h-11 bg-primary-500/10 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] hover:border-primary-500 transition-colors cursor-pointer">
            <User size={22} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
