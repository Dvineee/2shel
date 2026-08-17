import React from 'react';
import { Banner } from '../../types';
import { db } from '../../lib/db';
import { ExternalLink } from 'lucide-react';

interface VerticalAdBannersProps {
  position: 'left' | 'right';
  banners: Banner[];
}

export const VerticalAdBanner: React.FC<VerticalAdBannersProps> = ({ position, banners }) => {
  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[0];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Non-blocking asynchronous click tracking
    db.trackBannerClick(currentBanner.id);

    if (currentBanner.target_url) {
      if (currentBanner.target_url.startsWith('http')) {
        window.open(currentBanner.target_url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = currentBanner.target_url;
      }
    }
  };

  return (
    <div
      className={`hidden 2xl:flex flex-col w-[140px] flex-shrink-0 sticky top-20 h-[calc(100vh-100px)] py-2 ${
        position === 'left' ? 'mr-3' : 'ml-3'
      }`}
    >
      <div className="text-[10px] uppercase font-bold tracking-widest text-violet-400/60 text-center mb-1">
        SPONSOR
      </div>
      <a
        href={currentBanner.target_url}
        onClick={handleClick}
        className="group relative block w-full h-full rounded-2xl overflow-hidden border border-violet-800/30 hover:border-violet-500/60 shadow-xl transition-all duration-300 hover:shadow-violet-600/20"
      >
        <img
          src={currentBanner.image_url}
          alt={currentBanner.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-end p-2.5">
          <span className="text-[11px] font-bold text-white leading-tight drop-shadow-md">
            {currentBanner.name}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-amber-300">
            Hemen İncele <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </a>
    </div>
  );
};
