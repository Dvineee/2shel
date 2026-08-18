import React, { useMemo } from 'react';
import { Sponsor } from '../../types';
import { SponsorCard } from './SponsorCard';
import { Gift, Star, Sparkles, Crown } from 'lucide-react';
import { sortSponsors, getSponsorCategory } from '../../lib/sponsorUtils';

interface SponsorGridProps {
  sponsors: Sponsor[];
  loading?: boolean;
  title?: string;
  showFilters?: boolean;
  defaultViewMode?: 'list' | 'grid';
}

export const SponsorGrid: React.FC<SponsorGridProps> = ({
  sponsors,
  loading = false,
  title = 'GÜVENİLİR SPONSORLAR & BONUSLAR',
}) => {
  // Sorted active sponsors
  const activeSponsors = useMemo(() => {
    const active = sponsors.filter((s) => s.active !== false);
    return sortSponsors(active);
  }, [sponsors]);

  // Group sponsors by category
  const categorized = useMemo(() => {
    const main = activeSponsors.filter((s) => getSponsorCategory(s) === 'main');
    const vip = activeSponsors.filter((s) => getSponsorCategory(s) === 'vip');
    const trusted = activeSponsors.filter((s) => getSponsorCategory(s) === 'trusted');

    return { main, vip, trusted };
  }, [activeSponsors]);

  const hasMultipleCategories =
    (categorized.main.length > 0 ? 1 : 0) +
    (categorized.vip.length > 0 ? 1 : 0) +
    (categorized.trusted.length > 0 ? 1 : 0) > 1;

  if (loading) {
    return (
      <section className="my-5 sm:my-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#140c29] via-[#0f0920] to-[#080512] border border-violet-900/30 animate-pulse p-2 sm:p-3 flex flex-col justify-between"
            >
              <div className="w-full aspect-square bg-violet-900/20 rounded-lg sm:rounded-xl" />
              <div className="h-3.5 w-1/2 bg-violet-900/20 rounded mt-2" />
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <div className="h-8 sm:h-10 bg-violet-900/15 rounded-md" />
                <div className="h-8 sm:h-10 bg-violet-900/15 rounded-md" />
              </div>
              <div className="h-7 w-20 bg-violet-900/30 rounded-md ml-auto mt-2.5" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (activeSponsors.length === 0) {
    return (
      <section className="my-5 sm:my-6 text-center py-8 sm:py-10 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#140c29] via-[#0f0920] to-[#080512] border border-violet-900/30">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-2">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-white">Henüz Aktif Sponsor Bulunmuyor</h3>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
          Yönetim panelinden sponsorları aktif edebilir veya yeni sponsor ekleyebilirsiniz.
        </p>
      </section>
    );
  }

  return (
    <section className="my-5 sm:my-6 space-y-5 sm:space-y-7">
      {/* If multiple categories are populated, render categorized sections with 2 cards side by side on mobile */}
      {hasMultipleCategories ? (
        <>
          {/* 1. ANA SPONSORLAR */}
          {categorized.main.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-sm shrink-0">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-white font-black text-xs sm:text-base md:text-lg uppercase tracking-wider">
                  ANA SPONSORLAR
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
                {categorized.main.map((sponsor, idx) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* 2. VIP SPONSORLAR */}
          {categorized.vip.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-sm shrink-0">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-white font-black text-xs sm:text-base md:text-lg uppercase tracking-wider">
                  VIP SPONSORLAR
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
                {categorized.vip.map((sponsor, idx) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* 3. GÜVENİLİR SPONSORLAR */}
          {categorized.trusted.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-sm shrink-0">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-white font-black text-xs sm:text-base md:text-lg uppercase tracking-wider">
                  GÜVENİLİR SPONSORLAR
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
                {categorized.trusted.map((sponsor, idx) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Unified List if not categorized */
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-sm shrink-0">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-white font-black text-xs sm:text-base md:text-lg uppercase tracking-wider">
              {title}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
            {activeSponsors.map((sponsor, idx) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
