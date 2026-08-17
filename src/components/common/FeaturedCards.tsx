import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const FeaturedCards: React.FC = () => {
  const { settings } = useData();

  const showSponsors = settings.page_sponsors_enabled !== false;
  const showStore = settings.page_store_enabled !== false;

  if (!showSponsors && !showStore) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 ${showSponsors && showStore ? 'md:grid-cols-2' : ''} gap-4 my-5`}>
      {/* 1. Güvenilir Siteler Card */}
      {showSponsors && (
        <NavLink
          to="/sponsors"
          className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-6 bg-gradient-to-br from-purple-950/60 via-[#120b24] to-[#0d0918] border border-violet-700/30 hover:border-violet-500/60 transition-all duration-300 shadow-xl hover:shadow-violet-900/30"
        >
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-violet-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/25 transition-all" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2 max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                %100 ONAYLI LİSTE
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-violet-200 transition-colors">
                GÜVENİLİR SPONSORLAR
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Özel deneme bonusları, anında çekim garantisi ve VIP avantajlarıyla onaylı platformları keşfet.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-violet-300 group-hover:text-white group-hover:translate-x-1 transition-all">
                <span>Platformları Gör</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/40 flex-shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        </NavLink>
      )}

      {/* 2. Özel Mağaza Card */}
      {showStore && (
        <NavLink
          to="/store"
          className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-6 bg-gradient-to-br from-amber-950/40 via-[#120b24] to-[#0d0918] border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 shadow-xl hover:shadow-amber-600/20"
        >
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2 max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                COIN HEDİYE DÜNYASI
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-200 transition-colors">
                ÖZEL COIN MAĞAZASI
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Çarktan kazandığın coinlerle Steam cüzdan kodları, hediye kartları ve VIP üyelikleri anında al.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-300 group-hover:text-white group-hover:translate-x-1 transition-all">
                <span>Ürünleri İncele</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/40 flex-shrink-0 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        </NavLink>
      )}
    </div>
  );
};
