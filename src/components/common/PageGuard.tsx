import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Settings, Construction } from 'lucide-react';
import { soundEngine } from '../../lib/sound';

interface PageGuardProps {
  pageKey:
    | 'sponsors'
    | 'wheel'
    | 'giveaways'
    | 'leaderboard'
    | 'store'
    | 'games'
    | 'live'
    | 'about'
    | 'contact';
  pageName: string;
  children: React.ReactNode;
}

export const PageGuard: React.FC<PageGuardProps> = ({ pageKey, pageName, children }) => {
  const { settings } = useData();
  const { isAdmin, isEditor } = useAuth();

  // Check setting key
  const settingField = `page_${pageKey}_enabled` as keyof typeof settings;
  const isEnabled = settings[settingField] !== false;

  // If page is disabled and user is NOT admin
  if (!isEnabled && !isAdmin && !isEditor) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#120b24] border border-amber-500/30 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Construction className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
              Geçici Olarak Kapalı
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {pageName} Bakımda
            </h1>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {settings.maintenance_description ||
              'Bu sayfa yöneticilerimiz tarafından geçici olarak bakıma alınmıştır. Çok yakında yenilenmiş arayüz ve yeni ödüllerle tekrar aktif olacaktır.'}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <NavLink
              to="/"
              onClick={() => soundEngine.playClick()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // If page is disabled but user is Admin, show preview banner
  if (!isEnabled && (isAdmin || isEditor)) {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <b>Yönetici Bildirimi:</b> Bu sayfa <u>kullanıcılara kapalıdır</u> (Pasif durumdadır). Yönetici olduğunuz için önizleme yapmaktasınız.
            </span>
          </div>
          <NavLink
            to="/admin/pages"
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 flex items-center justify-center gap-1 shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Sayfayı Aktifleştir</span>
          </NavLink>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};
