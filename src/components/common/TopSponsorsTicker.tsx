import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { soundEngine } from '../../lib/sound';
import { Flame } from 'lucide-react';

export const TopSponsorsTicker: React.FC = () => {
  const { activeSponsors } = useData();
  const [isPaused, setIsPaused] = useState(false);

  // If there are no sponsors yet, return null
  if (!activeSponsors || activeSponsors.length === 0) {
    return null;
  }

  // Duplicate sponsors list to ensure seamless infinite looping without blank gaps
  const tickerItems = [...activeSponsors, ...activeSponsors, ...activeSponsors, ...activeSponsors];

  const handleSponsorClick = (sponsor: (typeof activeSponsors)[0]) => {
    soundEngine.playClick();
    db.trackSponsorClick(sponsor.id);
  };

  return (
    <div
      className="w-full bg-[#080512] border-b border-violet-900/30 h-8 flex items-center overflow-hidden relative z-30 select-none marquee-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sleek Static Prefix Badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 h-full bg-[#0e081f] border-r border-violet-900/40 text-[11px] font-black tracking-wider uppercase text-violet-300 shrink-0 z-20 shadow-md">
        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Sponsorlar</span>
      </div>

      {/* Edge Gradient Mask for Clean Reading Fade */}
      <div className="pointer-events-none absolute left-0 sm:left-[105px] inset-y-0 w-8 bg-gradient-to-r from-[#080512] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-[#080512] to-transparent z-10" />

      {/* Infinite Scrolling Ticker Track */}
      <div className="relative w-full overflow-hidden h-full flex items-center">
        <div
          className={`flex items-center gap-6 whitespace-nowrap animate-marquee ${
            isPaused ? 'animate-marquee-paused' : ''
          }`}
          style={{
            animationDuration: '40s',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tickerItems.map((sponsor, idx) => (
            <div
              key={`${sponsor.id}-${idx}`}
              className="inline-flex items-center gap-6 text-xs text-slate-300 transition-colors"
            >
              <NavLink
                to={`/site/${sponsor.slug}`}
                onClick={() => handleSponsorClick(sponsor)}
                className="inline-flex items-center gap-2 group hover:text-white transition-colors"
              >
                {/* Clean Sponsor Logo */}
                {sponsor.logo_url && (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="w-4 h-4 object-contain rounded shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all"
                  />
                )}

                {/* Sponsor Name Only */}
                <span className="font-bold text-slate-200 group-hover:text-white transition-colors text-xs tracking-wider uppercase">
                  {sponsor.name}
                </span>
              </NavLink>

              {/* Clean Dot Separator */}
              <span className="text-violet-700/60 font-bold select-none">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

