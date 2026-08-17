import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { HeroSlide } from '../../types';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

interface HeroSliderProps {
  slides: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused, slides.length]);

  if (!slides || slides.length === 0) return null;

  const current = slides[currentIndex] || slides[0];

  return (
    <div
      className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-violet-800/30 bg-[#0d0918] shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Gradient Overlays */}
      <div className="relative h-[220px] sm:h-[260px] md:h-[300px] w-full overflow-hidden">
        <img
          src={current.desktop_image}
          alt={current.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Deep luxury radial and linear gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070510] via-[#070510]/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070510] via-transparent to-black/30 z-10" />

        {/* Slide Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/30 border border-violet-400/40 text-violet-300 text-xs font-bold w-fit mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ÖNE ÇIKAN ETKİNLİK</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
            {current.title}
          </h2>

          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-300 line-clamp-2 drop-shadow">
            {current.subtitle}
          </p>

          <div className="mt-5 flex items-center gap-3">
            {current.target_url.startsWith('http') ? (
              <a
                href={current.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-900/50 hover:shadow-violet-600/50 hover:scale-105 transition-all"
              >
                <span>{current.button_text || 'Hemen Katıl'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <NavLink
                to={current.target_url}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-900/50 hover:shadow-violet-600/50 hover:scale-105 transition-all"
              >
                <span>{current.button_text || 'Hemen Katıl'}</span>
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Önceki Slayt"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Sonraki Slayt"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Pagination Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-6 z-30 flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-violet-400' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
