import React from 'react';
import { useData } from '../context/DataContext';
import { SponsorGrid } from '../components/sponsors/SponsorGrid';
import { ShieldCheck, Crown, Award } from 'lucide-react';

export const SponsorsPage: React.FC = () => {
  const { activeSponsors, loading } = useData();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            DOĞRULANMIŞ SPONSOR KATALOĞU
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Tüm Sponsorlar ve Güncel Bonuslar
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            En yüksek ilk yatırım promosyonları, çevrimsiz deneme bonusları ve anında çekim garantili lisanslı platformlar.
          </p>

          <div className="flex items-center gap-3 mt-4 flex-wrap text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1 text-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Ana Sponsorlar
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-purple-300">
              <Award className="w-3.5 h-3.5 text-purple-400" /> VIP Sponsorlar
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Güvenilir Sponsorlar
            </span>
          </div>
        </div>
      </div>

      {/* Sponsors Categorized Grid */}
      <SponsorGrid
        sponsors={activeSponsors}
        loading={loading}
        title="SPONSORLAR & PROMOSYONLAR"
        showFilters={true}
      />
    </div>
  );
};
