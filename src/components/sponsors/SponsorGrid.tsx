import React, { useMemo } from 'react';
import { Sponsor } from '../../types';
import { SponsorCard } from './SponsorCard';
import { Crown, Gift } from 'lucide-react';
import { sortSponsors } from '../../lib/sponsorUtils';

interface SponsorGridProps {
  sponsors: Sponsor[];
  loading?: boolean;
  title?: string;
  showFilters?: boolean; // kept for interface compatibility if passed
  defaultViewMode?: 'list' | 'grid';
}

export const SponsorGrid: React.FC<SponsorGridProps> = ({
  sponsors,
  loading = false,
  title = 'GÜVENİLİR SPONSORLAR & BONUSLAR',
}) => {
  // Sorted sponsors: strictly by sort_order
  const sortedSponsors = useMemo(() => {
    const active = sponsors.filter((s) => s.active !== false);
    return sortSponsors(active);
  }, [sponsors]);

  return (
    <section className="my-8 space-y-4">
      {/* Clean Header Bar */}
      <div className="flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#150d2c] via-[#100922] to-[#0c071a] border border-violet-800/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-violet-600/30 shrink-0">
            <div className="w-full h-full bg-[#0e081f] rounded-[14px] flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Lisanslı, doğrulanmış ve anında çekim garantili sponsor listesi
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-950/50 border border-violet-800/30 text-xs font-bold text-violet-300">
          <span>{sortedSponsors.length} Sponsor Listelendi</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-24 md:h-28 rounded-2xl md:rounded-3xl bg-[#120b24]/50 border border-violet-900/30 animate-pulse p-4 flex items-center justify-between gap-4"
            >
              <div className="h-16 w-32 bg-violet-900/30 rounded-xl" />
              <div className="h-8 flex-1 bg-violet-900/20 rounded-lg hidden sm:block" />
              <div className="h-10 w-28 bg-violet-900/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : sortedSponsors.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-[#120b24]/40 border border-violet-900/30">
          <div className="w-12 h-12 rounded-full bg-violet-900/30 text-violet-400 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Henüz Aktif Sponsor Bulunmuyor</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Yönetim panelinden sponsorları aktif edebilir veya yeni sponsor ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        /* Alt Alta Sıralı Liste */
        <div className="space-y-3">
          {sortedSponsors.map((sponsor, idx) => (
            <SponsorCard
              key={sponsor.id}
              sponsor={sponsor}
              variant="row"
              rank={idx + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
};
