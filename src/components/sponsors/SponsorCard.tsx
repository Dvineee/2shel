import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Sponsor } from '../../types';
import { ExternalLink, Sparkles, Crown, Info } from 'lucide-react';
import { db } from '../../lib/db';
import { soundEngine } from '../../lib/sound';
import { useData } from '../../context/DataContext';
import { getSponsorCategory, SPONSOR_CATEGORIES } from '../../lib/sponsorUtils';
import { getSponsorPalette } from '../../lib/colorExtractor';

interface SponsorCardProps {
  sponsor: Sponsor;
  variant?: 'auto' | 'row' | 'grid';
  rank?: number;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({
  sponsor,
}) => {
  const { settings } = useData();
  const [imgError, setImgError] = useState(false);

  const cat = getSponsorCategory(sponsor);
  const palette = useMemo(() => getSponsorPalette(sponsor), [sponsor]);

  // Direct Outbound Click Handler (Opens website_url instantly)
  const handleDirectSiteClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playClick();
    db.trackSponsorClick(sponsor.id);
    if (sponsor.website_url) {
      window.open(sponsor.website_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Badge text
  const badgeLabel =
    sponsor.badge_text ||
    (cat === 'main'
      ? 'ANA SPONSOR'
      : cat === 'vip'
      ? 'VIP SPONSOR'
      : 'GÜVENİLİR');

  // Harmonized Dark Purple / Violet / Cyan Theme
  const themeColors =
    cat === 'main'
      ? {
          cardBorder: 'border-violet-700/40 hover:border-violet-500/80 group-hover:shadow-violet-600/15',
          topBannerBg: 'from-[#1f1035] via-[#120822] to-[#0a0414]',
          glowGradient: 'from-violet-600/15 via-purple-600/5 to-transparent',
          badgeStyle: 'bg-violet-950/90 border-violet-500/50 text-violet-200 shadow-sm',
          boxBorder: 'border-violet-800/30 group-hover:border-violet-600/40',
          boxBg: 'bg-[#100722]/90',
          btnBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/30',
          accentDot: 'bg-violet-400',
        }
      : cat === 'vip'
      ? {
          cardBorder: 'border-purple-700/40 hover:border-purple-500/80 group-hover:shadow-purple-600/15',
          topBannerBg: 'from-[#1c0d32] via-[#110720] to-[#090313]',
          glowGradient: 'from-purple-600/15 via-violet-600/5 to-transparent',
          badgeStyle: 'bg-purple-950/90 border-purple-500/50 text-purple-200 shadow-sm',
          boxBorder: 'border-purple-800/30 group-hover:border-purple-600/40',
          boxBg: 'bg-[#100722]/90',
          btnBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/30',
          accentDot: 'bg-purple-400',
        }
      : {
          cardBorder: 'border-emerald-700/30 hover:border-emerald-500/80 group-hover:shadow-emerald-600/15',
          topBannerBg: 'from-[#0b1d24] via-[#0d091e] to-[#080413]',
          glowGradient: 'from-emerald-600/15 via-violet-600/5 to-transparent',
          badgeStyle: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-sm',
          boxBorder: 'border-emerald-800/30 group-hover:border-emerald-600/40',
          boxBg: 'bg-[#100722]/90',
          btnBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/30',
          accentDot: 'bg-emerald-400',
        };

  // Resolve card metric stats (supports dynamic stats: İlk Yatırım, Deneme Bonusu, Kayıp Bonusu, etc.)
  const cardStats = (sponsor.stats && Array.isArray(sponsor.stats) && sponsor.stats.length > 0)
    ? sponsor.stats.slice(0, 3)
    : [
        { label: 'İLK YATIRIM', value: sponsor.bonus_text || '%100' },
        { label: 'DENEME', value: '250 TL' },
        { label: 'KAYIP', value: '%20' },
      ];

  // Subtitle / promo explanation line
  const subtitle =
    sponsor.short_description ||
    (sponsor.bonus_code
      ? `(${sponsor.bonus_code}) Koduna Özel ${sponsor.bonus_text || '500 TL NAKİT'}`
      : sponsor.bonus_text || '%100 İlk Yatırım & Çevrimsiz Bonus');

  // Button text display: On desktop show full text (e.g. SİTEYE GİT & KAZAN), on mobile display compact 'SİTEYE GİT'
  const desktopButtonText =
    sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR'
      ? sponsor.button_text
      : 'SİTEYE GİT & KAZAN';

  const mobileButtonText =
    desktopButtonText.replace(/\s*&\s*KAZAN/gi, '').trim() || 'SİTEYE GİT';

  return (
    <div
      onClick={() => handleDirectSiteClick()}
      className={`w-full rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#130b26] via-[#0e071e] to-[#070310] border ${themeColors.cardBorder} transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg flex flex-col group relative overflow-hidden cursor-pointer`}
    >
      {/* Soft Hover Ambient Aura Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${themeColors.glowGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      {/* Subtle Shimmer Sweep on Card Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-50 pointer-events-none overflow-hidden z-20 transition-opacity duration-400">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-shimmer-sweep" />
      </div>

      {/* 1. STANDARDIZED SHELBYONLINE LOGO PRESENTATION CANVAS (1:1 ASPECT-SQUARE) */}
      <div
        className={`relative w-full aspect-square bg-gradient-to-b from-[#0e0620] via-[#080314] to-[#04010a] border-b border-violet-900/40 flex items-center justify-center overflow-hidden select-none`}
      >
        {/* MULTI-LAYERED ATMOSPHERIC SMOKE & VAPOR CLOUDS */}
        {/* Layer 1: Base Ambient Smoke Flow */}
        <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_30%_40%,rgba(168,85,247,0.32)_0%,rgba(126,34,206,0.18)_40%,transparent_75%)] blur-2xl pointer-events-none animate-smoke-1 z-0" />
        
        {/* Layer 2: Counter Swirling Neon Magenta/Purple Vapor Plume */}
        <div className="absolute -inset-6 bg-[radial-gradient(ellipse_at_70%_60%,rgba(192,38,211,0.28)_0%,rgba(147,51,234,0.15)_45%,transparent_80%)] blur-3xl pointer-events-none animate-smoke-2 z-0" />

        {/* Layer 3: Central Intense Neon Plasma Core behind Logo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.38)_0%,rgba(147,51,234,0.2)_35%,rgba(88,28,135,0.08)_65%,transparent_85%)] pointer-events-none animate-smoke-3 z-0" />

        {/* Dense Soft Mist Smoke Puffs */}
        <div className="absolute -bottom-4 -left-4 w-36 h-36 rounded-full bg-violet-600/25 blur-2xl pointer-events-none animate-pulse-glow z-0" />
        <div className="absolute -top-4 -right-4 w-36 h-36 rounded-full bg-fuchsia-600/20 blur-2xl pointer-events-none animate-pulse-glow z-0" />

        {/* BLURRED BACKGROUND LOGO ATMOSPHERE (Deep authentic brand depth - High Visibility) */}
        {sponsor.logo_url && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
            <img
              src={sponsor.logo_url}
              alt=""
              aria-hidden="true"
              className="w-[95%] h-[95%] object-contain object-center filter blur-xl scale-125 opacity-60 brightness-110 saturate-175 contrast-125 select-none pointer-events-none transition-all duration-500 group-hover:scale-135 group-hover:opacity-75"
              loading="lazy"
            />
          </div>
        )}

        {/* SHELBYONLINE DECORATIVE WATERMARK (Dense multi-line diagonal brand wallpaper) */}
        <div className="absolute -inset-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden select-none z-[2] -rotate-12 space-y-1.5 opacity-90">
          <span className="text-[11px] sm:text-[13px] font-black tracking-[0.35em] sm:tracking-[0.4em] text-violet-400/[0.045] uppercase whitespace-nowrap select-none">
            SHELBYONLINE &bull; SHELBYONLINE &bull; SHELBYONLINE
          </span>
          <span className="text-[15px] sm:text-[18px] font-black tracking-[0.3em] sm:tracking-[0.35em] text-white/[0.055] uppercase whitespace-nowrap select-none">
            SHELBYONLINE &bull; SHELBYONLINE &bull; SHELBYONLINE
          </span>
          <span className="text-[20px] sm:text-[26px] font-black tracking-[0.25em] sm:tracking-[0.3em] text-white/[0.07] uppercase whitespace-nowrap select-none">
            SHELBYONLINE &bull; SHELBYONLINE
          </span>
          <span className="text-[26px] sm:text-[34px] font-black tracking-[0.2em] sm:tracking-[0.25em] text-white/[0.09] uppercase whitespace-nowrap select-none my-0.5">
            SHELBYONLINE
          </span>
          <span className="text-[20px] sm:text-[26px] font-black tracking-[0.25em] sm:tracking-[0.3em] text-white/[0.07] uppercase whitespace-nowrap select-none">
            SHELBYONLINE &bull; SHELBYONLINE
          </span>
          <span className="text-[15px] sm:text-[18px] font-black tracking-[0.3em] sm:tracking-[0.35em] text-white/[0.055] uppercase whitespace-nowrap select-none">
            SHELBYONLINE &bull; SHELBYONLINE &bull; SHELBYONLINE
          </span>
          <span className="text-[11px] sm:text-[13px] font-black tracking-[0.35em] sm:tracking-[0.4em] text-violet-400/[0.045] uppercase whitespace-nowrap select-none">
            SHELBYONLINE &bull; SHELBYONLINE &bull; SHELBYONLINE
          </span>
        </div>

        {/* Top-Right Category / Tier Badge */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20">
          <span
            className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full border backdrop-blur-md font-black text-[7.5px] sm:text-[9px] uppercase tracking-wider shadow-sm transition-all duration-300 whitespace-nowrap ${themeColors.badgeStyle}`}
          >
            {cat === 'main' ? (
              <Crown className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-violet-300 shrink-0" />
            ) : (
              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-purple-300 shrink-0" />
            )}
            <span>{badgeLabel}</span>
          </span>
        </div>

        {/* LOGO CONTAINER: Clean, Crisp, Perfectly Preserved Aspect Ratio (No Glow Around Logo) */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-3 sm:p-4.5">
          {sponsor.logo_url && !imgError ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="max-w-[88%] max-h-[80%] w-auto h-auto object-contain object-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] select-none transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <span className="text-base sm:text-xl font-black text-white tracking-tight truncate max-w-full">
                {sponsor.name}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-0.5 text-slate-400">
                SPONSOR
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. CARD BODY - RESPONSIVE MOBILE 2-COLUMN OPTIMIZED */}
      <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between relative z-10">
        <div>
          {/* Sponsor Title in Crisp White & Online Players */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-base font-black tracking-tight uppercase text-white group-hover:text-violet-200 transition-colors truncate">
              {sponsor.name}
            </span>

            {sponsor.online_players && (
              <span className="inline-flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded bg-violet-950/60 text-slate-300 text-[8px] sm:text-[9px] font-semibold border border-violet-800/30 shrink-0 whitespace-nowrap">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="hidden xs:inline">{sponsor.online_players}</span>
              </span>
            )}
          </div>

          {/* Subtitle / Promo Explanation */}
          <p className="text-[9.5px] sm:text-[11px] text-slate-400 font-medium line-clamp-1 mt-0.5 mb-2">
            {subtitle}
          </p>

          {/* Dynamic Metric / Bonus Boxes */}
          <div className={`grid ${cardStats.length === 3 ? 'grid-cols-3 gap-1 sm:gap-1.5' : 'grid-cols-2 gap-1 sm:gap-2'} mb-2 sm:mb-3`}>
            {cardStats.map((stat, idx) => (
              <div
                key={idx}
                className={`${themeColors.boxBg} border ${themeColors.boxBorder} rounded-md sm:rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center text-center min-h-[38px] sm:min-h-[46px] shadow-sm transition-all duration-300 group-hover:bg-[#150a2b] overflow-hidden`}
              >
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full">
                  {stat.label}
                </span>
                <span className="text-[9.5px] sm:text-[12px] font-black text-white uppercase tracking-tight truncate w-full">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. BOTTOM ROW: Direct "SİTEYE GİT" Button and Optional "DETAYLAR" Link */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          {/* Dedicated Detaylar Button (Only shown if has_detail_page is true or undefined) */}
          {sponsor.has_detail_page !== false && (
            <NavLink
              to={`/site/${sponsor.slug}`}
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playClick();
              }}
              className="px-2 sm:px-2.5 py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10.5px] font-bold text-slate-300 hover:text-white bg-violet-950/60 hover:bg-violet-900/80 border border-violet-800/40 hover:border-violet-600 transition-all text-center flex items-center justify-center shrink-0 cursor-pointer min-h-[30px] sm:min-h-[34px]"
              title={`${sponsor.name} Detaylı İnceleme`}
            >
              <span>Detaylar</span>
            </NavLink>
          )}

          {/* Main SİTEYE GİT CTA Button */}
          <button
            type="button"
            onClick={(e) => handleDirectSiteClick(e)}
            className={`flex-1 group/btn relative overflow-hidden ${themeColors.btnBg} font-black text-[9.5px] sm:text-[11px] uppercase px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg flex items-center justify-center gap-1 shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap min-h-[30px] sm:min-h-[34px]`}
          >
            <span className="relative z-10 sm:hidden">{mobileButtonText}</span>
            <span className="relative z-10 hidden sm:inline">{desktopButtonText}</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 relative z-10 group-hover/btn:translate-x-0.5 transition-transform duration-300 shrink-0" />
            
            {/* Subtle soft sheen sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};
