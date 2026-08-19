import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sponsor } from '../../types';
import { SponsorCard } from './SponsorCard';
import { Gift, Star, Sparkles, Crown, Search, X } from 'lucide-react';
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
  title = 'GÜVENİLİR SPONSORLAR',
  showFilters = false,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';

  // Filter and sort sponsors
  const filteredSponsors = useMemo(() => {
    let result = sponsors.filter((s) => s.active !== false);

    // Apply category filter if specified
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((s) => getSponsorCategory(s) === selectedCategory);
    }

    // Apply text search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const bonusMatch = s.bonus_text?.toLowerCase().includes(q);
        const headlineMatch = s.bonus_headline?.toLowerCase().includes(q);
        const codeMatch = s.bonus_code?.toLowerCase().includes(q);
        const badgeMatch = s.badge_text?.toLowerCase().includes(q);
        const descMatch = s.description?.toLowerCase().includes(q) || s.short_description?.toLowerCase().includes(q);
        const featuresMatch = s.features?.some((f) => f.text.toLowerCase().includes(q));
        const paymentMatch = s.payment_methods?.some((p) => p.toLowerCase().includes(q));
        return (
          nameMatch ||
          bonusMatch ||
          headlineMatch ||
          codeMatch ||
          badgeMatch ||
          descMatch ||
          featuresMatch ||
          paymentMatch
        );
      });
    }

    return sortSponsors(result);
  }, [sponsors, searchQuery, selectedCategory]);

  // Group sponsors by category (only when not searching by specific text)
  const categorized = useMemo(() => {
    const main = filteredSponsors.filter((s) => getSponsorCategory(s) === 'main');
    const vip = filteredSponsors.filter((s) => getSponsorCategory(s) === 'vip');
    const trusted = filteredSponsors.filter((s) => getSponsorCategory(s) === 'trusted');

    return { main, vip, trusted };
  }, [filteredSponsors]);

  const isCategorizedView =
    !searchQuery.trim() &&
    selectedCategory === 'all' &&
    (categorized.main.length > 0 || categorized.vip.length > 0 || categorized.trusted.length > 0);

  const clearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams);
  };

  const handleCategoryChange = (cat: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', cat);
    }
    setSearchParams(nextParams);
  };

  if (loading && filteredSponsors.length === 0) {
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

  return (
    <section className="my-5 sm:my-6 space-y-5 sm:space-y-7">
      {/* Category filter tabs and active search badge */}
      {(showFilters || searchQuery) && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-violet-950/30 border border-violet-800/30 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-700/40'
                  : 'bg-violet-900/30 text-slate-300 hover:text-white hover:bg-violet-800/40'
              }`}
            >
              Tüm Sponsorlar
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('main')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'main'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-700/40'
                  : 'bg-violet-900/30 text-amber-300 hover:text-amber-200 hover:bg-violet-800/40'
              }`}
            >
              <Crown className="w-3 h-3" /> Ana Sponsorlar
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('vip')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'vip'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-700/40'
                  : 'bg-violet-900/30 text-purple-300 hover:text-purple-200 hover:bg-violet-800/40'
              }`}
            >
              <Star className="w-3 h-3" /> VIP
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('trusted')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'trusted'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                  : 'bg-violet-900/30 text-emerald-300 hover:text-emerald-200 hover:bg-violet-800/40'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Güvenilir
            </button>
          </div>

          {searchQuery && (
            <div className="flex items-center gap-2 bg-violet-900/40 border border-violet-700/40 px-3 py-1 rounded-xl text-xs">
              <Search className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-slate-300 font-medium truncate max-w-[160px] sm:max-w-xs">
                Arama: <strong className="text-white">&quot;{searchQuery}&quot;</strong> ({filteredSponsors.length})
              </span>
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-violet-800/60 transition-colors cursor-pointer"
                title="Aramayı Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {filteredSponsors.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-gradient-to-b from-[#140c29] via-[#0f0920] to-[#080512] border border-violet-900/30">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-2">
            <Gift className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {searchQuery || selectedCategory !== 'all' ? 'Eşleşen Sponsor Bulunamadı' : 'Henüz Sponsor Eklenmedi'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Arama kriterlerinize uygun aktif sponsor bulunamadı. Filtreleri temizleyerek tüm listeyi görebilirsiniz.'
              : 'Veritabanında henüz kayıtlı sponsor bulunmuyor. Yönetici panelinden yeni sponsorlar ekleyebilirsiniz.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchParams({});
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shadow-md shadow-violet-700/30 cursor-pointer"
            >
              Tüm Sponsorları Göster
            </button>
          )}
        </div>
      ) : isCategorizedView ? (
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
        /* Unified List if not categorized or searching */
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-sm shrink-0">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-white font-black text-xs sm:text-base md:text-lg uppercase tracking-wider">
              {searchQuery
                ? `ARAMA SONUÇLARI (${filteredSponsors.length})`
                : selectedCategory === 'main'
                ? 'ANA SPONSORLAR'
                : selectedCategory === 'vip'
                ? 'VIP SPONSORLAR'
                : 'GÜVENİLİR SPONSORLAR'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
            {filteredSponsors.map((sponsor, idx) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

