import React from 'react';
import { Search, Calendar, FileDown, Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-zinc-200/50 px-8 flex items-center justify-between sticky top-0 z-10 print:hidden">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar reportes, usuarios, estados..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/50 border border-zinc-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-zinc-100/50 border border-zinc-200/60 rounded-xl px-3 py-2 text-sm text-zinc-600 font-medium space-x-2 transition-colors hover:bg-zinc-100">
          <Calendar size={16} className="text-primary-500" />
          <span>Abril 01 - Abril 17, 2026</span>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all soft-shadow active:scale-95 print:hidden"
        >
          <FileDown size={18} />
          <span>Exportar PDF</span>
        </button>

        <div className="h-6 w-px bg-zinc-200 mx-2"></div>

        <button className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center space-x-3 ml-2 border-l pl-4 border-zinc-200">
          <div className="text-right flex flex-col">
            <span className="text-sm font-bold text-zinc-950 leading-none">Admin User</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Super Administrador</span>
          </div>
          <div className="w-10 h-10 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-950 font-bold shadow-sm">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
