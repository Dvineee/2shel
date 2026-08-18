import React, { useState, useEffect } from 'react';
import { Banner } from '../../types';
import { db } from '../../lib/db';
import { ExternalLink, Sparkles } from 'lucide-react';
import { soundEngine } from '../../lib/sound';

interface VerticalAdBannersProps {
  position: 'left' | 'right';
  banners: Banner[];
}

export const VerticalAdBanner: React.FC<VerticalAdBannersProps> = ({ position, banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const activeBanners = banners.filter((b) => b.active !== false);

  // Auto-rotate if multiple banners exist for this side
  useEffect(() => {
    if (!activeBanners || activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      setImgError(false);
    }, 6500);
    return () => clearInterval(timer);
  }, [activeBanners]);

  if (!activeBanners || activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex % activeBanners.length] || activeBanners[0];
  if (!currentBanner) return null;

  const handleClick = () => {
    soundEngine.playClick();
    if (currentBanner.id) {
      db.trackBannerClick(currentBanner.id);
    }
  };

  const isExternal = currentBanner.target_url?.startsWith('http://') || currentBanner.target_url?.startsWith('https://');

  return (
    <aside
      aria-label={position === 'left' ? 'Sol Sponsor Reklam' : 'Sağ Sponsor Reklam'}
      className={`hidden xl:flex flex-col w-[120px] 2xl:w-[150px] flex-shrink-0 sticky top-20 h-[calc(100vh-95px)] py-1.5 z-20 ${
        position === 'left' ? 'mr-3' : 'ml-3'
      }`}
    >
      {/* Top Sponsor Eyebrow Tag */}
      <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-300 mb-1.5 px-2 py-0.5 rounded-full bg-violet-950/70 border border-violet-700/40 shadow-sm">
        <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0 animate-pulse" />
        <span className="truncate">{position === 'left' ? 'VIP SPONSOR' : 'ÖZEL REKLAM'}</span>
      </div>

      {/* Main Banner Anchor Card */}
      <a
        href={currentBanner.target_url || '#'}
        target={isExternal ? '_blank' : '_self'}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        className="group relative flex-1 flex flex-col w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#170e30] via-[#0d071c] to-[#080413] border border-violet-800/40 hover:border-violet-400 shadow-xl transition-all duration-300 hover:shadow-violet-600/30 cursor-pointer"
      >
        {/* Banner Graphic / Poster */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-violet-950/30">
          {!imgError && currentBanner.image_url ? (
            <img
              src={currentBanner.image_url}
              alt={currentBanner.name || 'Sponsor Reklam'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            // Fallback decorative graphic if image fails or missing
            <div className="w-full h-full p-3 flex flex-col justify-between items-center text-center bg-gradient-to-b from-violet-900/40 via-purple-950/30 to-black">
              <div className="p-2 rounded-xl bg-violet-800/30 border border-violet-600/30 mt-4">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div className="my-auto">
                <p className="text-xs font-black text-white leading-tight uppercase">
                  {currentBanner.name || 'ÖZEL VIP SPONSOR'}
                </p>
                <p className="text-[10px] text-violet-300 mt-1 font-semibold">
                  Giriş Yap & Bonusu Al
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black uppercase mb-4 shadow-md">
                HEMEN KATIL
              </span>
            </div>
          )}

          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090514]/95 via-transparent to-black/30 pointer-events-none" />

          {/* Bottom Info Bar */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            <span className="text-[11px] font-black text-white leading-tight drop-shadow-md truncate group-hover:text-amber-300 transition-colors">
              {currentBanner.name}
            </span>
            <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-400 group-hover:underline">
              <span>Hemen İncele</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </div>
          </div>
        </div>

        {/* Shine Animation Hover Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </a>

      {/* Multi-banner Pagination Dots */}
      {activeBanners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-1.5 py-0.5">
          {activeBanners.map((b, idx) => (
            <button
              key={b.id || idx}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setCurrentIndex(idx);
                setImgError(false);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex % activeBanners.length
                  ? 'w-4 bg-violet-400 shadow-sm shadow-violet-400'
                  : 'w-1.5 bg-violet-900/60 hover:bg-violet-700'
              }`}
              title={b.name}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </aside>
  );
};
