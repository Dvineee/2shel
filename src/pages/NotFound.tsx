import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../lib/sound';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#120b24] border border-violet-800/40 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto shadow-lg shadow-violet-900/30">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 inline-block mb-2">
            404 - Sayfa Bulunamadı
          </span>
          <h1 className="text-2xl font-black text-white">Aradığınız Sayfa Mevcut Değil</h1>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-mono bg-violet-950/60 p-2.5 rounded-xl border border-violet-800/30 break-all">
          {location.pathname}
        </p>

        <p className="text-xs text-slate-400">
          Ulaşmak istediğiniz sayfa adresi taşınmış, değiştirilmiş veya geçici olarak erişilemiyor olabilir.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <NavLink
            to="/"
            onClick={() => soundEngine.playClick()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfaya Git</span>
          </NavLink>

          <NavLink
            to="/admin"
            onClick={() => soundEngine.playClick()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-950/70 hover:bg-violet-900 border border-violet-700/50 text-violet-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Yönetim Paneli</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
