import React from 'react';
import { Search, Calendar, FileDown, Bell } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-10 print:hidden">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por comando o ID..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700/10 transition-all text-sm text-slate-800 placeholder:text-slate-400 font-bold"
          />
        </div>
      </div>

      <div className="flex items-center space-x-5">
        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] text-slate-500 font-black uppercase tracking-widest space-x-2">
          <Calendar size={14} className="text-slate-400" />
          <span>MAR 10 - ABR 20, 2026</span>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20 active:scale-95 print:hidden"
        >
          <FileDown size={16} />
          <span>Reporte_PDF</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-2"></div>

        <button className="p-2.5 text-slate-400 hover:text-blue-700 hover:bg-slate-50 rounded-xl relative transition-all">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-900/20"></span>
        </button>

        <div className="flex items-center space-x-4 ml-2 pl-4 border-l border-slate-100">
          <div className="text-right flex flex-col">
            <span className="text-sm font-black text-slate-800 uppercase tracking-wider leading-none">Root_Admin</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">SYS_OPERATOR</span>
          </div>
          <div className="w-11 h-11 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all cursor-pointer group">
            <span className="font-black text-sm">S</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
