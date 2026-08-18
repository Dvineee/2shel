import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { HeroSlider } from '../components/banners/HeroSlider';
import { SocialBar } from '../components/common/SocialBar';
import { FeaturedCards } from '../components/common/FeaturedCards';
import { SponsorGrid } from '../components/sponsors/SponsorGrid';
import { formatTimeLeft, formatCoin } from '../lib/utils';
import { db } from '../lib/db';
import { Gift, ShoppingBag, Trophy, ArrowRight, Clock, Crown } from 'lucide-react';

export const Home: React.FC = () => {
  const {
    heroSlides,
    socialLinks,
    activeSponsors,
    giveaways,
    storeProducts,
    topBanners,
    bottomBanners,
    settings,
    loading,
  } = useData();

  const handleBannerClick = (bannerId: string) => {
    db.trackBannerClick(bannerId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Showcase Slider OR Top Banner fallback */}
      {heroSlides && heroSlides.length > 0 ? (
        <HeroSlider slides={heroSlides} />
      ) : topBanners && topBanners.length > 0 ? (
        <div className="w-full rounded-2xl overflow-hidden border border-violet-800/30 shadow-lg hover:border-violet-500/50 transition-all">
          <a
            href={topBanners[0].target_url}
            onClick={() => handleBannerClick(topBanners[0].id)}
            target={topBanners[0].target_url.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block w-full"
          >
            <img
              src={topBanners[0].image_url}
              alt={topBanners[0].name}
              className="w-full h-auto max-h-[160px] object-cover hover:scale-[1.01] transition-transform duration-300"
            />
          </a>
        </div>
      ) : null}

      {/* 2. Social / Telegram Community Quick Access */}
      {socialLinks && socialLinks.length > 0 && (
        <SocialBar links={socialLinks} />
      )}

      {/* 3. Featured Category Cards */}
      <FeaturedCards />

      {/* 4. Sponsor Cards Grid (Main Core Section) */}
      {settings.page_sponsors_enabled !== false && (
        <SponsorGrid
          sponsors={activeSponsors}
          loading={loading}
          title="GÜVENİLİR SPONSORLAR & BONUSLAR"
          showFilters={true}
        />
      )}

      {/* 5. Promotional Middle / Bottom Banner (If configured) */}
      {bottomBanners && bottomBanners.length > 0 && (
        <div className="w-full rounded-2xl overflow-hidden border border-violet-800/30 shadow-lg hover:border-violet-500/50 transition-all my-4">
          <a
            href={bottomBanners[0].target_url}
            onClick={() => handleBannerClick(bottomBanners[0].id)}
            target={bottomBanners[0].target_url.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block w-full"
          >
            <img
              src={bottomBanners[0].image_url}
              alt={bottomBanners[0].name}
              className="w-full h-auto max-h-[150px] object-cover hover:scale-[1.01] transition-transform duration-300"
            />
          </a>
        </div>
      )}

      {/* 6. Featured Giveaways Section */}
      {settings.page_giveaways_enabled !== false && giveaways && giveaways.length > 0 && (
        <section className="my-8 p-6 rounded-3xl bg-gradient-to-br from-[#130b26] via-[#0d0918] to-[#120b24] border border-violet-800/30 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/30">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                  ÖDÜLLÜ TOPLULUK ÇEKİLİŞLERİ
                </h2>
                <p className="text-xs text-slate-400">
                  Katılmak tamamen ücretsiz! Şansınızı hemen deneyin.
                </p>
              </div>
            </div>
            <NavLink
              to="/giveaways"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-white transition-colors"
            >
              <span>Tüm Çekilişleri Gör</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {giveaways.slice(0, 3).map((giveaway) => (
              <div
                key={giveaway.id}
                className="rounded-2xl bg-violet-950/30 border border-violet-800/20 overflow-hidden flex flex-col hover:border-violet-600/40 transition-all group"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={giveaway.image_url}
                    alt={giveaway.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-200 text-[10px] font-black backdrop-blur-md flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                    <span>{giveaway.winner_count || 1} Kazanan</span>
                  </div>
                  {giveaway.is_completed ? (
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-violet-950 text-[10px] font-black flex items-center gap-1 shadow-md border border-amber-300/70">
                      <Trophy className="w-3 h-3 fill-violet-950 text-violet-950" />
                      <span>SONUÇLANAN ÇEKİLİŞ</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{formatTimeLeft(giveaway.end_at)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                    {giveaway.title}
                  </h3>
                  
                  {giveaway.is_completed && giveaway.winner_username ? (
                    <div className="my-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-bold flex items-center gap-1.5 flex-wrap">
                      <span>🏆 Kazananlar:</span>
                      <span className="text-white font-black">{giveaway.winner_username}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 flex-1">
                      {giveaway.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-violet-900/30 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {giveaway.entries_count || 0} Katılımcı
                    </span>
                    <NavLink
                      to="/giveaways"
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-colors ${
                        giveaway.is_completed
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40'
                      }`}
                    >
                      {giveaway.is_completed ? (
                        <>
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Kazananlar</span>
                        </>
                      ) : (
                        'Hemen Katıl'
                      )}
                    </NavLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Store Preview Section */}
      {settings.page_store_enabled !== false && storeProducts && storeProducts.length > 0 && (
        <section className="my-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                  COIN MAĞAZASI
                </h2>
                <p className="text-xs text-slate-400">
                  Kazandığınız coinleri dijital kodlara ve hediyelere dönüştürün
                </p>
              </div>
            </div>
            <NavLink
              to="/store"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Mağazaya Git</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {storeProducts.slice(0, 4).map((product) => (
              <NavLink
                key={product.id}
                to="/store"
                className="rounded-2xl bg-[#120b24] border border-violet-800/30 hover:border-amber-500/50 p-3 flex flex-col group transition-all hover:-translate-y-1"
              >
                <div className="h-28 w-full rounded-xl overflow-hidden bg-violet-950/40 mb-2.5">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {product.name}
                </h4>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400">
                    {formatCoin(product.coin_price)} Coin
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Stok: {product.stock}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
