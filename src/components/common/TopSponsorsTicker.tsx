import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { soundEngine } from '../../lib/sound';
import { Star, ShieldCheck, ChevronRight, Copy, CheckCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const TopSponsorsTicker: React.FC = () => {
  const { activeSponsors } = useData();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const handleCopyCode = (e: React.MouseEvent, code: string, sponsorName: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    soundEngine.playCopy();
    setCopiedCode(code);
    toast.success(`${sponsorName} Promosyon Kodu (${code}) Kopyalandı!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  return (
    <div
      className="w-full bg-[#0b0817] border-b border-violet-800/40 text-xs py-2 px-2 sm:px-4 flex items-center overflow-hidden shadow-xl relative z-30 select-none marquee-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Full-width Dynamic Scrolling Sponsor Marquee */}
      <div className="relative w-full overflow-hidden h-7 flex items-center mask-linear">
        <div
          className={`flex items-center gap-4 sm:gap-6 whitespace-nowrap animate-marquee ${
            isPaused ? 'animate-marquee-paused' : ''
          } cursor-pointer`}
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {tickerItems.map((sponsor, idx) => {
            const primaryStat = sponsor.stats?.[0];
            const bonusHighlight =
              sponsor.badge_text ||
              (primaryStat ? `${primaryStat.label}: ${primaryStat.value}` : sponsor.short_description || '%100 Hoş Geldin');

            return (
              <div
                key={`${sponsor.id}-${idx}`}
                onClick={() => handleSponsorClick(sponsor)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#160e2c]/90 border border-violet-800/40 hover:border-violet-400/80 hover:bg-violet-900/50 transition-all group shadow-sm"
              >
                <NavLink
                  to={`/site/${sponsor.slug}`}
                  className="inline-flex items-center gap-2"
                >
                  {/* Sponsor Logo Icon */}
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-black/60 border border-violet-700/60 flex-shrink-0 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Sponsor Name */}
                  <span className="font-extrabold text-white text-xs group-hover:text-violet-300 transition-colors flex items-center gap-1">
                    {sponsor.name}
                    {sponsor.verified && (
                      <ShieldCheck className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                    )}
                  </span>

                  {/* Bonus Highlight Tag */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/25">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    {bonusHighlight}
                  </span>

                  {/* Rating */}
                  {sponsor.rating && (
                    <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-300">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {sponsor.rating.toFixed(1)}
                    </span>
                  )}
                </NavLink>

                {/* Bonus Code Copy Badge (if available) */}
                {sponsor.bonus_code && (
                  <button
                    onClick={(e) => handleCopyCode(e, sponsor.bonus_code!, sponsor.name)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black font-mono tracking-wider transition-all ${
                      copiedCode === sponsor.bonus_code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-violet-950 text-violet-200 border border-violet-600/40 hover:border-amber-400 hover:text-amber-300'
                    }`}
                    title="Kodu Kopyala"
                  >
                    {copiedCode === sponsor.bonus_code ? (
                      <>
                        <CheckCheck className="w-2.5 h-2.5 text-emerald-300" />
                        <span>KOPYALANDI</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5 text-amber-400" />
                        <span>{sponsor.bonus_code}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Quick Link Chevron */}
                <NavLink
                  to={`/site/${sponsor.slug}`}
                  className="text-[10px] font-bold text-violet-400 group-hover:text-white transition-colors flex items-center pl-0.5"
                >
                  <ChevronRight className="w-3 h-3 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                </NavLink>

                <span className="text-violet-900 ml-0.5">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

