import React from 'react';
import { useData } from '../context/DataContext';
import { HeroSlider } from '../components/banners/HeroSlider';
import { SocialBar } from '../components/common/SocialBar';
import { FeaturedCards } from '../components/common/FeaturedCards';
import { SponsorGrid } from '../components/sponsors/SponsorGrid';
import { db } from '../lib/db';

export const Home: React.FC = () => {
  const {
    heroSlides,
    socialLinks,
    activeSponsors,
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
          title="GÜVENİLİR SPONSORLAR"
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
    </div>
  );
};
