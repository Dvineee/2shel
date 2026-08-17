import React, { useState, useMemo } from 'react';
import { Sponsor } from '../../types';
import { SponsorCard } from './SponsorCard';
import { ShieldCheck, Search, Flame, Award, Gift } from 'lucide-react';

interface SponsorGridProps {
  sponsors: Sponsor[];
  loading?: boolean;
  title?: string;
  showFilters?: boolean;
}

export const SponsorGrid: React.FC<SponsorGridProps> = ({
  sponsors,
  loading = false,
  title = 'GÜVENİLİR SPONSORLAR',
  showFilters = true,
}) => {
  const [filter, setFilter] = useState<'all' | 'featured' | 'verified'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return sponsors.filter((s) => {
      if (filter === 'featured' && !s.featured) return false;
      if (filter === 'verified' && !s.verified) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(query);
        const descMatch = s.description?.toLowerCase().includes(query) || s.short_description?.toLowerCase().includes(query);
        const featMatch = s.features?.some((f) => f.text.toLowerCase().includes(query));
        return nameMatch || descMatch || featMatch;
      }
      return true;
    });
  }, [sponsors, filter, searchTerm]);

  return (
    <section className="my-6">
      {/* Header with Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-400">
              Lisanslı ve en yüksek bonuslu onaylı platformlar
            </p>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-[#120b24] border border-violet-800/30">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü ({sponsors.length})
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filter === 'featured'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Öne Çıkanlar
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filter === 'verified'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Doğrulanmış
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl md:rounded-3xl bg-[#120b24]/50 border border-violet-900/30 animate-pulse p-4 space-y-4"
            >
              <div className="h-6 w-24 bg-violet-900/30 rounded-md" />
              <div className="h-20 bg-violet-900/30 rounded-xl" />
              <div className="h-12 bg-violet-900/30 rounded-lg" />
              <div className="h-16 bg-violet-900/20 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-3xl bg-[#120b24]/40 border border-violet-900/30">
          <div className="w-12 h-12 rounded-full bg-violet-900/30 text-violet-400 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Eşleşen Sponsor Bulunamadı</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Arama kriterlerinize uygun sponsor bulunamadı. Lütfen filtrelerinizi kontrol edin.
          </p>
        </div>
      )}
    </section>
  );
};
