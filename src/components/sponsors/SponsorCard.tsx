import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sponsor } from '../../types';
import {
  Check,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCheck,
  Crown,
  Award,
  ShieldCheck,
  Flame,
  Users,
  Star,
} from 'lucide-react';
import { db } from '../../lib/db';
import { soundEngine } from '../../lib/sound';
import { toast } from 'sonner';
import { getSponsorCategory, SPONSOR_CATEGORIES } from '../../lib/sponsorUtils';

interface SponsorCardProps {
  sponsor: Sponsor;
  variant?: 'row' | 'grid';
  rank?: number;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({
  sponsor,
  variant = 'row',
  rank,
}) => {
  const [copied, setCopied] = useState(false);

  const cat = getSponsorCategory(sponsor);
  const catConfig = SPONSOR_CATEGORIES[cat];

  const handleCtaClick = () => {
    soundEngine.playClick();
    db.trackSponsorClick(sponsor.id);
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sponsor.bonus_code) return;
    navigator.clipboard.writeText(sponsor.bonus_code);
    soundEngine.playCopy();
    setCopied(true);
    toast.success(`${sponsor.name} Promosyon Kodu (${sponsor.bonus_code}) Kopyalandı!`);
    setTimeout(() => setCopied(false), 2500);
  };

  // Top 3 dynamic stats
  const displayStats = (sponsor.stats || []).slice(0, 3);
  // Features (up to 4)
  const displayFeatures = (sponsor.features || []).slice(0, 4);

  // Category specific styles
  const cardBorderClass =
    cat === 'main'
      ? 'border-amber-500/40 hover:border-amber-400/80 shadow-amber-950/20 hover:shadow-amber-600/20'
      : cat === 'vip'
      ? 'border-purple-500/40 hover:border-purple-400/80 shadow-purple-950/20 hover:shadow-purple-600/20'
      : 'border-emerald-500/30 hover:border-emerald-400/70 shadow-emerald-950/20 hover:shadow-emerald-600/20';

  const badgeIcon =
    cat === 'main' ? (
      <Crown className="w-3 h-3 text-amber-300" />
    ) : cat === 'vip' ? (
      <Award className="w-3 h-3 text-purple-300" />
    ) : (
      <ShieldCheck className="w-3 h-3 text-emerald-300" />
    );

  const badgeStyle =
    cat === 'main'
      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
      : cat === 'vip'
      ? 'bg-gradient-to-r from-purple-500/25 to-violet-500/25 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
      : 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20';

  const buttonStyle =
    cat === 'main'
      ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-900/40 hover:shadow-amber-500/40'
      : cat === 'vip'
      ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40 hover:shadow-purple-600/40'
      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 hover:shadow-emerald-600/40';

  // ----------------------------------------------------
  // ROW VARIANT: ALT ALTA (FULL-WIDTH STACKED LIST ITEM)
  // ----------------------------------------------------
  if (variant === 'row') {
    return (
      <div
        className={`w-full rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#120b24] to-[#0c0818] border ${cardBorderClass} p-4 md:p-5 transition-all duration-300 hover:translate-x-1 md:hover:-translate-y-0.5 hover:shadow-2xl group relative`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
          
          {/* Section 1: Rank / Category Badge + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Rank Number if provided */}
            {typeof rank === 'number' && (
              <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-800/40 text-violet-300 font-black text-xs flex items-center justify-center shrink-0 shadow-inner">
                #{rank}
              </div>
            )}

            {/* Logo Box */}
            <NavLink
              to={`/site/${sponsor.slug}`}
              onClick={handleCtaClick}
              className="relative h-16 w-32 sm:h-20 sm:w-40 rounded-xl overflow-hidden bg-black/60 border border-violet-900/40 flex items-center justify-center p-2.5 group-hover:border-violet-500/50 transition-colors shrink-0 shadow-inner"
            >
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </NavLink>

            {/* Mobile-only Quick Title and Rating */}
            <div className="lg:hidden flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide border ${badgeStyle}`}
                >
                  {badgeIcon}
                  <span>{sponsor.badge_text || catConfig.badgeText}</span>
                </span>
                {sponsor.online_players && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-950/60 text-slate-300 text-[9px] font-semibold border border-violet-800/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {sponsor.online_players}
                  </span>
                )}
              </div>
              <NavLink
                to={`/site/${sponsor.slug}`}
                onClick={handleCtaClick}
                className="text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate block mt-0.5"
              >
                {sponsor.name}
              </NavLink>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{sponsor.rating?.toFixed(1) || '4.9'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Desktop Title, Highlights & Feature Badges */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Desktop Badge & Name */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-wide border ${badgeStyle}`}
              >
                {badgeIcon}
                <span>{sponsor.badge_text || catConfig.badgeText}</span>
              </span>

              <NavLink
                to={`/site/${sponsor.slug}`}
                onClick={handleCtaClick}
                className="text-lg font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5"
              >
                <span>{sponsor.name}</span>
                {sponsor.verified && (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Doğrulanmış Lisanslı Sponsor" />
                )}
              </NavLink>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-xs font-bold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{sponsor.rating?.toFixed(1) || '4.9'}</span>
              </div>

              {sponsor.rtp_rate && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  RTP: {sponsor.rtp_rate}
                </span>
              )}

              {sponsor.online_players && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-950/60 text-slate-300 text-[10px] font-semibold border border-violet-800/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Users className="w-2.5 h-2.5 text-slate-400" />
                  {sponsor.online_players} Aktif Oyuncu
                </span>
              )}
            </div>

            {sponsor.short_description && (
              <p className="text-xs text-slate-400 line-clamp-1">
                {sponsor.short_description}
              </p>
            )}

            {/* Feature Bullets in Row format */}
            {displayFeatures.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {displayFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 px-2 py-0.5 rounded-md bg-violet-950/40 border border-violet-800/30"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{feat.text}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Dynamic 3 Statistics Trio */}
          {displayStats.length > 0 && (
            <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-violet-950/50 border border-violet-900/40 shrink-0 w-full sm:w-auto lg:min-w-[280px]">
              {displayStats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center text-center px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-medium truncate w-full">
                    {stat.label}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 truncate w-full">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Section 4: Promo Code & Big CTA Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2 shrink-0 lg:min-w-[180px]">
            {/* Promo Code Box */}
            {sponsor.bonus_code && (
              <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 w-full">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-amber-400 tracking-wider">
                    PROMO KOD
                  </span>
                  <span className="text-xs font-black tracking-widest text-amber-200 font-mono">
                    {sponsor.bonus_code}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-white" />
                      <span>KOPYALANDI</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-amber-400" />
                      <span>KOPYALA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Direct CTA Action Button */}
            {sponsor.website_url ? (
              <a
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCtaClick}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${buttonStyle}`}
              >
                <span>{sponsor.button_text || 'BONUSU AL'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <NavLink
                to={`/site/${sponsor.slug}`}
                onClick={handleCtaClick}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${buttonStyle}`}
              >
                <span>{sponsor.button_text || 'BONUSU AL'}</span>
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            )}

            {/* Details sub-link */}
            <NavLink
              to={`/site/${sponsor.slug}`}
              onClick={handleCtaClick}
              className="text-center text-[10px] sm:text-[11px] font-semibold text-violet-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>İnceleme & Detaylar</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </NavLink>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GRID VARIANT: COMPACT CARD FOR GRID VIEW
  // ----------------------------------------------------
  return (
    <div
      className={`flex flex-col h-full rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#160e2c] via-[#120b24] to-[#0d0918] border ${cardBorderClass} p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl group relative`}
    >
      {/* Top Header Badge Strip */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {typeof rank === 'number' && (
            <span className="w-6 h-6 rounded-lg bg-violet-950/90 text-violet-300 font-black text-[10px] flex items-center justify-center border border-violet-800/40">
              #{rank}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border ${badgeStyle}`}
          >
            {badgeIcon}
            <span>{sponsor.badge_text || catConfig.badgeText}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {sponsor.online_players ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-950/60 text-slate-300 text-[10px] font-semibold border border-violet-800/30"
              title="Aktif Oyuncu"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Users className="w-2.5 h-2.5 text-slate-400" />
              {sponsor.online_players}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-400/80 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
              ★ {sponsor.rating?.toFixed(1) || '4.9'}
            </span>
          )}
        </div>
      </div>

      {/* Sponsor Logo Banner */}
      <NavLink
        to={`/site/${sponsor.slug}`}
        onClick={handleCtaClick}
        className="block relative h-20 w-full rounded-xl overflow-hidden bg-black/50 border border-violet-900/40 flex items-center justify-center p-3 mb-3 group-hover:border-violet-500/50 transition-colors shadow-inner"
      >
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </NavLink>

      {/* Title, License & Fast Info */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between">
          <NavLink
            to={`/site/${sponsor.slug}`}
            onClick={handleCtaClick}
            className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5"
          >
            <span>{sponsor.name}</span>
            {sponsor.verified && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Doğrulanmış Lisanslı Sponsor" />
            )}
          </NavLink>
          {sponsor.rtp_rate && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {sponsor.rtp_rate}
            </span>
          )}
        </div>
        {sponsor.short_description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
            {sponsor.short_description}
          </p>
        )}
      </div>

      {/* Middle: 3 Dynamic Statistic Boxes */}
      {displayStats.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-violet-950/40 border border-violet-900/40 mb-3">
          {displayStats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center p-1">
              <span className="text-[10px] text-slate-400 font-medium truncate w-full">
                {stat.label}
              </span>
              <span className="text-xs font-black text-amber-300 mt-0.5 truncate w-full">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bonus Code Copy Bar */}
      {sponsor.bonus_code && (
        <div className="mb-3 p-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-amber-400/90 tracking-wider">
              PROMOSYON KODU
            </span>
            <span className="text-xs font-black tracking-widest text-amber-200 font-mono">
              {sponsor.bonus_code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
            }`}
          >
            {copied ? (
              <>
                <CheckCheck className="w-3 h-3 text-white" />
                <span>KOPYALANDI</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-amber-400" />
                <span>KOPYALA</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Feature Bullet Points */}
      {displayFeatures.length > 0 && (
        <div className="space-y-1.5 mb-3 flex-grow">
          {displayFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span className="truncate">{feat.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA Buttons */}
      <div className="mt-auto pt-2 space-y-2">
        {sponsor.website_url ? (
          <a
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCtaClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs md:text-sm shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${buttonStyle}`}
          >
            <span>{sponsor.button_text || 'BONUSU AL'}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <NavLink
            to={`/site/${sponsor.slug}`}
            onClick={handleCtaClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs md:text-sm shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${buttonStyle}`}
          >
            <span>{sponsor.button_text || 'BONUSU AL'}</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        )}

        <NavLink
          to={`/site/${sponsor.slug}`}
          onClick={handleCtaClick}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-violet-400 hover:text-white transition-colors cursor-pointer"
        >
          <span>Sponsor Detayları & İnceleme</span>
          <ExternalLink className="w-3 h-3" />
        </NavLink>
      </div>
    </div>
  );
};
