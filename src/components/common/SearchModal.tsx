import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Crown,
  Star,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  Gamepad2,
  Tv,
  ArrowRight,
  TrendingUp,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { soundEngine } from '../../lib/sound';
import { Sponsor } from '../../types';
import { getSponsorCategory } from '../../lib/sponsorUtils';
import { db } from '../../lib/db';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface AppRouteItem {
  name: string;
  path: string;
  icon: React.ElementType;
  description: string;
  category: string;
  keywords: string[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const { activeSponsors, settings } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedCategory('all');
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      // Auto focus input
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, initialQuery]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Static App routes searchable
  const appRoutes: AppRouteItem[] = useMemo(() => {
    return [
      {
        name: 'Sponsorlar & Bonuslar',
        path: '/sponsors',
        icon: ShieldCheck,
        description: 'Tüm onaylı sponsorlar, yatırım & deneme bonusları',
        category: 'Sayfa',
        keywords: ['sponsor', 'bonus', 'site', 'liste', 'kampanya', 'oran'],
      },
      {
        name: 'Ödül Mağazası',
        path: '/store',
        icon: ShoppingBag,
        description: 'Shelby Coinlerini TRX veya Nakit IBAN bakiyesine dönüştür',
        category: 'Özellik',
        keywords: ['mağaza', 'magaza', 'store', 'market', 'satın al', 'trx', 'iban', 'çekim'],
      },
      {
        name: 'Liderlik Sıralaması',
        path: '/leaderboard',
        icon: Trophy,
        description: 'En çok coin kazanan haftalık ve aylık şampiyonlar',
        category: 'Sayfa',
        keywords: ['lider', 'sıralama', 'leaderboard', 'top', 'kazananlar'],
      },
      {
        name: 'Canlı Maç TV',
        path: '/live',
        icon: Tv,
        description: 'Kesintisiz HD canlı spor yayınları ve maç izleme',
        category: 'Medya',
        keywords: ['canlı', 'canli', 'tv', 'maç', 'futbol', 'yayın', 'izle'],
      },
      {
        name: 'Mini Oyunlar',
        path: '/games',
        icon: Gamepad2,
        description: 'Maden, Yazı Tura ve Çark mini oyunlarıyla coin katla',
        category: 'Oyun',
        keywords: ['oyun', 'game', 'mines', 'maden', 'yazı tura', 'kumar'],
      },
      {
        name: 'İletişim & Reklam',
        path: '/contact',
        icon: ArrowRight,
        description: 'Sponsorluk, reklam ve iş birliği talepleri',
        category: 'Destek',
        keywords: ['iletişim', 'iletisim', 'destek', 'reklam', 'sponsorluk', 'telegram'],
      },
    ];
  }, []);

  // Quick filter tags
  const popularKeywords: Array<{ label: string; category?: string; tag?: string; path?: string }> = [
    { label: '🔥 Deneme Bonusu', tag: 'deneme' },
    { label: '👑 Ana Sponsorlar', category: 'main' },
    { label: '⭐ VIP Siteler', category: 'vip' },
    { label: '🛡️ Güvenilir Siteler', category: 'trusted' },
  ];

  // Filtered Sponsors
  const filteredSponsors = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return activeSponsors.filter((sponsor: Sponsor) => {
      // Category filter check
      if (selectedCategory !== 'all') {
        const cat = getSponsorCategory(sponsor);
        if (selectedCategory === 'main' && cat !== 'main') return false;
        if (selectedCategory === 'vip' && cat !== 'vip') return false;
        if (selectedCategory === 'trusted' && cat !== 'trusted') return false;
      }

      if (!trimmed) return true;

      const nameMatch = sponsor.name.toLowerCase().includes(trimmed);
      const bonusMatch = sponsor.bonus_text?.toLowerCase().includes(trimmed);
      const headlineMatch = sponsor.bonus_headline?.toLowerCase().includes(trimmed);
      const codeMatch = sponsor.bonus_code?.toLowerCase().includes(trimmed);
      const badgeMatch = sponsor.badge_text?.toLowerCase().includes(trimmed);
      const descMatch = sponsor.description?.toLowerCase().includes(trimmed) || sponsor.short_description?.toLowerCase().includes(trimmed);
      const featuresMatch = sponsor.features?.some((f) => f.text.toLowerCase().includes(trimmed));
      const paymentMatch = sponsor.payment_methods?.some((p) => p.toLowerCase().includes(trimmed));

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
  }, [activeSponsors, query, selectedCategory]);

  // Filtered App Routes
  const filteredRoutes = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return appRoutes.filter((route) => {
      const nameMatch = route.name.toLowerCase().includes(trimmed);
      const descMatch = route.description.toLowerCase().includes(trimmed);
      const keyMatch = route.keywords.some((k) => k.includes(trimmed));
      return nameMatch || descMatch || keyMatch;
    });
  }, [appRoutes, query]);

  if (!isOpen) return null;

  const handleSelectRoute = (path: string) => {
    soundEngine.playClick();
    onClose();
    navigate(path);
  };

  const handleSelectSponsor = (slug: string) => {
    soundEngine.playClick();
    onClose();
    navigate(`/site/${slug}`);
  };

  const handleExternalVisit = (e: React.MouseEvent, sponsor: Sponsor) => {
    e.stopPropagation();
    soundEngine.playSuccess();
    db.trackSponsorClick(sponsor.id);
    window.open(sponsor.website_url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyBonusCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    soundEngine.playSuccess();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      soundEngine.playClick();
      onClose();
      navigate(`/sponsors?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto pt-10 sm:pt-16 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="search-modal-container"
        className="w-full max-w-2xl bg-gradient-to-b from-[#150d2c] via-[#0f0922] to-[#080514] border border-violet-700/50 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Search Input Header */}
        <div className="p-3.5 sm:p-4 border-b border-violet-800/30 bg-[#120b24]/90 sticky top-0 z-20">
          <form onSubmit={handleFullSearch} className="relative flex items-center">
            <Search className="w-5 h-5 text-violet-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              id="search-modal-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sponsor, bonus kodu veya kampanya ara..."
              className="w-full pl-11 pr-20 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-violet-950/40 border border-violet-700/40 text-white placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all font-medium"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-violet-800/40 transition-all cursor-pointer"
                  title="Temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-800/60 text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-semibold px-2 flex items-center gap-1"
                title="Kapat"
              >
                <span className="hidden sm:inline">ESC</span>
                <X className="w-4 h-4 sm:hidden" />
              </button>
            </div>
          </form>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                soundEngine.playClick();
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all cursor-pointer ${
                selectedCategory === 'all' && !query
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/50'
                  : 'bg-violet-950/50 text-slate-300 hover:bg-violet-900/50 hover:text-white border border-violet-800/30'
              }`}
            >
              Tümü ({activeSponsors.length})
            </button>

            {popularKeywords.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  if (item.path) {
                    handleSelectRoute(item.path);
                  } else if (item.category) {
                    setSelectedCategory(item.category);
                    setQuery('');
                  } else if (item.tag) {
                    setQuery(item.tag);
                  }
                }}
                className="px-2.5 py-1 rounded-full whitespace-nowrap bg-violet-950/40 hover:bg-violet-800/50 text-slate-300 hover:text-white border border-violet-800/25 transition-all cursor-pointer text-[11px] sm:text-xs font-medium shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body - Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
          {/* Matching Pages / Tools */}
          {filteredRoutes.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400 uppercase tracking-wider px-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Sayfa & Özellik Eşleşmeleri
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <button
                      key={route.path}
                      type="button"
                      onClick={() => handleSelectRoute(route.path)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-950/30 hover:bg-violet-900/40 border border-violet-800/30 hover:border-violet-600/50 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-105 transition-transform shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                          {route.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {route.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-300 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Sponsors Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {query.trim() ? (
                  <span>
                    Sponsor Sonuçları ({filteredSponsors.length})
                  </span>
                ) : (
                  <span>Öne Çıkan ve Popüler Sponsorlar</span>
                )}
              </div>

              {query.trim() && filteredSponsors.length > 0 && (
                <button
                  type="button"
                  onClick={handleFullSearch}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Tümünü Gör
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {filteredSponsors.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-violet-950/20 border border-violet-800/20">
                <Search className="w-10 h-10 text-violet-400/40 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Sonuç Bulunamadı</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  &quot;{query}&quot; için eşleşen sponsor veya kampanya bulunamadı. Başka bir kelime deneyebilir veya tüm listeye göz atabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-3.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shadow-md shadow-violet-700/30 cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSponsors.map((sponsor) => {
                  const category = getSponsorCategory(sponsor);
                  return (
                    <div
                      key={sponsor.id}
                      onClick={() => handleSelectSponsor(sponsor.slug)}
                      className="p-3 rounded-2xl bg-gradient-to-r from-[#170e30]/90 to-[#0e081f]/90 border border-violet-800/30 hover:border-violet-500/50 hover:bg-violet-900/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer shadow-sm"
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Logo */}
                        <div className="w-12 h-12 rounded-xl bg-[#090614] border border-violet-800/40 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-violet-500/60 transition-colors">
                          <img
                            src={sponsor.logo_url}
                            alt={sponsor.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-white group-hover:text-violet-300 transition-colors truncate">
                              {sponsor.name}
                            </h4>
                            {category === 'main' && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Crown className="w-2.5 h-2.5" /> Ana Sponsor
                              </span>
                            )}
                            {category === 'vip' && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <Star className="w-2.5 h-2.5" /> VIP
                              </span>
                            )}
                            {sponsor.verified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                                <ShieldCheck className="w-3 h-3" /> Doğrulandı
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                            {sponsor.bonus_headline ||
                              sponsor.bonus_text ||
                              sponsor.short_description ||
                              'Özel ShelbyOnline Hoş Geldin & Yatırım Bonusu'}
                          </p>

                          {sponsor.bonus_code && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-700/30">
                                <Tag className="w-2.5 h-2.5" />
                                Kod: {sponsor.bonus_code}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyBonusCode(e, sponsor.bonus_code!)}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 p-0.5 transition-colors"
                                title="Kodu Kopyala"
                              >
                                {copiedCode === sponsor.bonus_code ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Kopyalandı
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 hover:text-slate-200">
                                    <Copy className="w-2.5 h-2.5" /> Kopyala
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSelectSponsor(sponsor.slug)}
                          className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-700/40 text-violet-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          İncele
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleExternalVisit(e, sponsor)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <span>{sponsor.button_text || 'Siteye Git'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-3.5 border-t border-violet-900/30 bg-[#0a0614] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              İpucu: Sponsor adını veya bonus türünü yazarak anında bulun
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleFullSearch}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Tüm Sayfada Ara</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
