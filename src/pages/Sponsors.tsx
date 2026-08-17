import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { SponsorCard } from '../components/sponsors/SponsorCard';
import { ShieldCheck, Search, SlidersHorizontal, Star } from 'lucide-react';

export const SponsorsPage: React.FC = () => {
  const { activeSponsors, loading } = useData();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState<'all' | 'casino' | 'sports' | 'crypto'>('all');
  const [sortBy, setSortBy] = useState<'sort_order' | 'rating' | 'clicks'>('sort_order');

  const filtered = activeSponsors
    .filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q) || s.short_description?.toLowerCase().includes(q);
        const matchFeat = s.features?.some((f) => f.text.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchFeat) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'clicks') return (b.clicks_count || 0) - (a.clicks_count || 0);
      return a.sort_order - b.sort_order;
    });

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
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#120b24] border border-violet-800/30">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Sponsor adı veya bonus ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-violet-950/40 border border-violet-800/30 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sıralama:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sıralama kriteri"
            className="px-3 py-2 text-xs rounded-xl bg-violet-950/40 border border-violet-800/30 text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="sort_order">Önerilen Sıralama</option>
            <option value="rating">En Yüksek Puan</option>
            <option value="clicks">En Popüler</option>
          </select>
        </div>
      </div>

      {/* Sponsors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 rounded-3xl bg-[#120b24]/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-4 rounded-3xl bg-[#120b24]/30 border border-violet-900/30">
          <h3 className="text-base font-bold text-white">Aramanıza uygun sponsor bulunamadı</h3>
          <p className="text-xs text-slate-400 mt-1">Farklı bir arama terimi deneyin.</p>
        </div>
      )}
    </div>
  );
};
