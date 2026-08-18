import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sponsor } from '../../types';
import { ExternalLink, Sparkles, Crown, Info } from 'lucide-react';
import { db } from '../../lib/db';
import { soundEngine } from '../../lib/sound';
import { useData } from '../../context/DataContext';
import { getSponsorCategory, SPONSOR_CATEGORIES } from '../../lib/sponsorUtils';

interface SponsorCardProps {
  sponsor: Sponsor;
  variant?: 'auto' | 'row' | 'grid';
  rank?: number;
}

// Gentle & Soft Cosmic Starlight Rain Particles (Lavender, Cyan, Ice White & Violet)
const SOFT_COSMIC_DROPS = [
  { left: '6%', size: 'w-1 h-1', duration: '7.5s', delay: '0s', opacity: 'opacity-40', color: 'bg-violet-300', glow: 'shadow-[0_0_4px_rgba(196,181,253,0.4)]' },
  { left: '15%', size: 'w-1.5 h-1.5', duration: '6.2s', delay: '-3.2s', opacity: 'opacity-50', color: 'bg-indigo-300', glow: 'shadow-[0_0_4px_rgba(165,180,252,0.4)]' },
  { left: '26%', size: 'w-1 h-1', duration: '8.8s', delay: '-1.5s', opacity: 'opacity-35', color: 'bg-cyan-200', glow: 'shadow-[0_0_4px_rgba(165,243,252,0.4)]' },
  { left: '37%', size: 'w-1.5 h-1.5', duration: '7.0s', delay: '-4.8s', opacity: 'opacity-45', color: 'bg-white', glow: 'shadow-[0_0_4px_rgba(255,255,255,0.4)]' },
  { left: '48%', size: 'w-1 h-1', duration: '8.0s', delay: '-2.2s', opacity: 'opacity-40', color: 'bg-violet-200', glow: 'shadow-[0_0_4px_rgba(221,214,254,0.4)]' },
  { left: '59%', size: 'w-2 h-2', duration: '6.5s', delay: '-5.1s', opacity: 'opacity-45', color: 'bg-purple-300', glow: 'shadow-[0_0_4px_rgba(216,180,254,0.4)]' },
  { left: '70%', size: 'w-1 h-1', duration: '9.2s', delay: '-0.8s', opacity: 'opacity-35', color: 'bg-cyan-100', glow: 'shadow-[0_0_4px_rgba(207,250,254,0.4)]' },
  { left: '80%', size: 'w-1.5 h-1.5', duration: '7.2s', delay: '-3.9s', opacity: 'opacity-50', color: 'bg-indigo-200', glow: 'shadow-[0_0_4px_rgba(199,210,254,0.4)]' },
  { left: '91%', size: 'w-1 h-1', duration: '8.5s', delay: '-6.4s', opacity: 'opacity-35', color: 'bg-violet-300', glow: 'shadow-[0_0_4px_rgba(196,181,253,0.4)]' },
  { left: '20%', size: 'w-1 h-1', duration: '7.8s', delay: '-4.2s', opacity: 'opacity-40', color: 'bg-white', glow: 'shadow-[0_0_4px_rgba(255,255,255,0.4)]' },
  { left: '65%', size: 'w-1 h-1', duration: '8.6s', delay: '-2.8s', opacity: 'opacity-35', color: 'bg-purple-200', glow: 'shadow-[0_0_4px_rgba(233,213,255,0.4)]' },
  { left: '85%', size: 'w-1.5 h-1.5', duration: '6.8s', delay: '-1.9s', opacity: 'opacity-45', color: 'bg-violet-300', glow: 'shadow-[0_0_4px_rgba(196,181,253,0.4)]' },
];

export const SponsorCard: React.FC<SponsorCardProps> = ({
  sponsor,
}) => {
  const { settings } = useData();
  const [imgError, setImgError] = useState(false);

  const cat = getSponsorCategory(sponsor);

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

  // Derive Box 1 (Offer / Bonus)
  const box1Label = sponsor.stats?.[0]?.label || 'BONUS';
  const box1Value =
    sponsor.stats?.[0]?.value ||
    sponsor.bonus_text ||
    (sponsor.min_deposit ? `MİN. ${sponsor.min_deposit}` : '%100');

  // Derive Box 2 (Code / Secondary Bonus)
  const box2Label = sponsor.stats?.[1]?.label || (sponsor.bonus_code ? 'KOD' : 'BONUS');
  const box2Value = sponsor.bonus_code
    ? `(${sponsor.bonus_code})`
    : sponsor.stats?.[1]?.value || '%30';

  // Subtitle / promo explanation line
  const subtitle =
    sponsor.short_description ||
    (sponsor.bonus_code
      ? `(${sponsor.bonus_code}) Koduna Özel ${sponsor.bonus_text || '500 TL NAKİT'}`
      : sponsor.bonus_text || '%100 İlk Yatırım & Çevrimsiz Bonus');

  // Button text display (defaults to 'SİTEYE GİT' if empty or set to old default)
  const ctaButtonText =
    sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR'
      ? sponsor.button_text
      : 'SİTEYE GİT';

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

      {/* 1. TOP 400x400 (1:1 ASPECT-SQUARE) CONTAINER - DIRECT OUTBOUND CLICKABLE */}
      <div
        className={`relative w-full aspect-square bg-gradient-to-b ${themeColors.topBannerBg} border-b border-violet-900/25 flex items-center justify-center overflow-hidden select-none`}
      >
        {/* BLURRED BACKGROUND LOGO EFFECT */}
        {sponsor.logo_url && !imgError && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
            <img
              src={sponsor.logo_url}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover scale-150 blur-xl opacity-30 brightness-90 contrast-125 select-none"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e071e]/70 via-[#0a0516]/60 to-[#070310]/80" />
          </div>
        )}

        {/* Soft Radial Ambient Lighting */}
        <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Gentle Ambient Blur Spheres */}
        <div className="absolute -top-6 -right-6 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-violet-600/10 blur-xl sm:blur-2xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-6 -left-6 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-purple-600/10 blur-xl sm:blur-2xl pointer-events-none animate-pulse-glow" />

        {/* SOFT FLOATING COSMIC PARTICLES */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          {SOFT_COSMIC_DROPS.map((drop, i) => (
            <div
              key={i}
              className={`absolute top-0 rounded-full ${drop.size} ${drop.color} ${drop.opacity} ${drop.glow} blur-[0.5px] animate-circle-rain`}
              style={{
                left: drop.left,
                animationDuration: drop.duration,
                animationDelay: drop.delay,
              }}
            />
          ))}
        </div>

        {/* Top-Right Badge (Ultra Compact on Mobile) */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
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

        {/* 400x400 FULLY FITTED CRISP IMAGE CONTAINER */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-2.5 sm:p-4">
          {sponsor.logo_url && !imgError ? (
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              className="w-full h-full object-contain object-center drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)] filter select-none"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-1.5">
              <span className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-full">
                {sponsor.name}
              </span>
              <span className="text-[8px] sm:text-[9px] text-violet-300 font-bold uppercase tracking-wider mt-0.5">
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

          {/* 2-Box Metric Boxes */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2 sm:mb-3">
            {/* Box 1 */}
            <div
              className={`${themeColors.boxBg} border ${themeColors.boxBorder} rounded-md sm:rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center text-center min-h-[38px] sm:min-h-[46px] shadow-sm transition-all duration-300 group-hover:bg-[#150a2b] overflow-hidden`}
            >
              <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full">
                {box1Label}
              </span>
              <span className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-tight truncate w-full">
                {box1Value}
              </span>
            </div>

            {/* Box 2 */}
            <div
              className={`${themeColors.boxBg} border ${themeColors.boxBorder} rounded-md sm:rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center text-center min-h-[38px] sm:min-h-[46px] shadow-sm transition-all duration-300 group-hover:bg-[#150a2b] overflow-hidden`}
            >
              <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full">
                {box2Label}
              </span>
              <span className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-tight truncate w-full">
                {box2Value}
              </span>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM ROW: Direct "SİTEYE GİT" Button and "DETAYLAR" Link */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          {/* Dedicated Detaylar Button (Navigates to /site/:slug without bubbling) */}
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

          {/* Main SİTEYE GİT CTA Button */}
          <button
            type="button"
            onClick={(e) => handleDirectSiteClick(e)}
            className={`flex-1 group/btn relative overflow-hidden ${themeColors.btnBg} font-black text-[9.5px] sm:text-[11px] uppercase px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg flex items-center justify-center gap-1 shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap min-h-[30px] sm:min-h-[34px]`}
          >
            <span className="relative z-10">{ctaButtonText}</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 relative z-10 group-hover/btn:translate-x-0.5 transition-transform duration-300 shrink-0" />
            
            {/* Subtle soft sheen sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};
