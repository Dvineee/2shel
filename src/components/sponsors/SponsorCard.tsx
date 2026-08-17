import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sponsor } from '../../types';
import { Check, ArrowRight, ExternalLink, Copy, CheckCheck, Zap, Clock, Users, Flame } from 'lucide-react';
import { db } from '../../lib/db';
import { soundEngine } from '../../lib/sound';
import { toast } from 'sonner';

interface SponsorCardProps {
  sponsor: Sponsor;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor }) => {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="flex flex-col h-full rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#160e2c] via-[#120b24] to-[#0d0918] border border-violet-800/30 hover:border-violet-500/60 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-900/30 group relative">
      {/* Top Header Badge Strip */}
      {(sponsor.badge_text || sponsor.online_players) && (
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            {sponsor.badge_text && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                {sponsor.badge_text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {sponsor.online_players && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-950/60 text-slate-300 text-[10px] font-semibold border border-violet-800/30" title="Aktif Oyuncu">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Users className="w-2.5 h-2.5 text-slate-400" />
                {sponsor.online_players}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sponsor Logo Banner */}
      <NavLink
        to={`/site/${sponsor.slug}`}
        onClick={handleCtaClick}
        className="block relative h-20 w-full rounded-xl overflow-hidden bg-black/40 border border-violet-900/40 flex items-center justify-center p-3 mb-3 group-hover:border-violet-600/50 transition-colors shadow-inner"
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
            className="text-base font-bold text-white group-hover:text-violet-300 transition-colors"
          >
            {sponsor.name}
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
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
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

      {/* Payment methods mini badges */}
      {sponsor.payment_methods && sponsor.payment_methods.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {sponsor.payment_methods.slice(0, 4).map((pm, idx) => (
            <span
              key={idx}
              className="text-[9px] font-semibold text-slate-400 bg-violet-950/40 border border-violet-900/30 px-1.5 py-0.5 rounded"
            >
              {pm}
            </span>
          ))}
          {sponsor.payment_methods.length > 4 && (
            <span className="text-[9px] font-semibold text-violet-400 bg-violet-950/40 border border-violet-900/30 px-1.5 py-0.5 rounded">
              +{sponsor.payment_methods.length - 4}
            </span>
          )}
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/40 hover:shadow-violet-600/40 transition-all hover:scale-[1.02]"
          >
            <span>{sponsor.button_text || 'BONUSU AL'}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <NavLink
            to={`/site/${sponsor.slug}`}
            onClick={handleCtaClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/40 hover:shadow-violet-600/40 transition-all hover:scale-[1.02]"
          >
            <span>{sponsor.button_text || 'BONUSU AL'}</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        )}

        <NavLink
          to={`/site/${sponsor.slug}`}
          onClick={handleCtaClick}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-violet-400 hover:text-white transition-colors"
        >
          <span>Sponsor Detayları & İnceleme</span>
          <ExternalLink className="w-3 h-3" />
        </NavLink>
      </div>
    </div>
  );
};

