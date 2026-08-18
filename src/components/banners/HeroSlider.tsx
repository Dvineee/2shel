import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { HeroSlide } from '../../types';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { soundEngine } from '../../lib/sound';

interface HeroSliderProps {
  slides: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activeSlides = slides.filter((s) => s.active !== false);

  const nextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    setImgError(false);
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    setImgError(false);
  }, [activeSlides.length]);

  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide, isPaused, activeSlides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        soundEngine.playClick();
        nextSlide();
      } else {
        soundEngine.playClick();
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!activeSlides || activeSlides.length === 0) return null;

  const current = activeSlides[currentIndex % activeSlides.length] || activeSlides[0];
  const isExternal = current.target_url?.startsWith('http://') || current.target_url?.startsWith('https://');

  const hasTitle = Boolean(current.title && current.title.trim() !== '');
  const hasSubtitle = Boolean(current.subtitle && current.subtitle.trim() !== '');
  const hasButton = Boolean(current.button_text && current.button_text.trim() !== '');
  const hasTextContent = hasTitle || hasSubtitle || hasButton;

  const renderSlideMedia = () => (
    <div className="relative h-[200px] sm:h-[240px] md:h-[290px] w-full overflow-hidden select-none">
      <img
        key={current.id || currentIndex}
        src={!imgError && current.desktop_image ? current.desktop_image : 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&h=500&q=80'}
        alt={current.title || 'Manşet Afişi'}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
        loading="eager"
      />

      {/* Gradients: dark gradient when text overlay is present, or subtle bottom shadow for indicators */}
      {hasTextContent ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#070412]/95 via-[#070412]/75 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070412]/80 via-transparent to-transparent z-10" />
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070412]/70 via-[#070412]/20 to-transparent z-10 pointer-events-none" />
      )}

      {/* Minimalist Slide Content */}
      {hasTextContent && (
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-10 md:px-12 max-w-2xl">
          {hasTitle && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight drop-shadow-md">
              {current.title}
            </h2>
          )}

          {hasSubtitle && (
            <p className="mt-2 text-xs sm:text-sm text-slate-200/90 line-clamp-2 max-w-xl font-normal leading-relaxed drop-shadow">
              {current.subtitle}
            </p>
          )}

          {hasButton && (
            <div className="mt-4 sm:mt-5 flex items-center gap-3">
              {isExternal ? (
                <a
                  href={current.target_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playClick()}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-lg"
                >
                  <span>{current.button_text}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-900" />
                </a>
              ) : (
                <NavLink
                  to={current.target_url || '/giveaways'}
                  onClick={() => soundEngine.playClick()}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-lg"
                >
                  <span>{current.button_text}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-900" />
                </NavLink>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      aria-label="Manşet Slider"
      className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#0c0817] border border-white/[0.08] shadow-2xl group transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* If no text content and target_url exists, whole slide is a direct clickable link */}
      {!hasTextContent && current.target_url ? (
        isExternal ? (
          <a
            href={current.target_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundEngine.playClick()}
            className="block w-full h-full cursor-pointer hover:opacity-95 transition-opacity"
          >
            {renderSlideMedia()}
          </a>
        ) : (
          <NavLink
            to={current.target_url}
            onClick={() => soundEngine.playClick()}
            className="block w-full h-full cursor-pointer hover:opacity-95 transition-opacity"
          >
            {renderSlideMedia()}
          </NavLink>
        )
      ) : (
        renderSlideMedia()
      )}

      {/* Sleek Minimalist Arrow Controls */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playClick();
              prevSlide();
            }}
            aria-label="Önceki Slayt"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playClick();
              nextSlide();
            }}
            aria-label="Sonraki Slayt"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Clean Linear Progress & Page Tabs at Bottom */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-3.5 right-6 z-30 flex items-center gap-1.5 pointer-events-auto bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          {activeSlides.map((_, idx) => {
            const isActive = idx === currentIndex % activeSlides.length;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  soundEngine.playClick();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 bg-violet-400'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slayt ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};


