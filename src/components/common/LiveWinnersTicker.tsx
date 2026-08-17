import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Trophy, Flame, Coins, Zap, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../../lib/sound';
import { useData } from '../../context/DataContext';

interface LiveEvent {
  id: string;
  user: string;
  avatar: string;
  action: string;
  amount: string;
  badge: string;
  sponsor: string;
  type: 'win' | 'wheel' | 'store' | 'jackpot';
}

export const LiveWinnersTicker: React.FC = () => {
  const { activeSponsors, settings } = useData();
  const [onlineCount, setOnlineCount] = useState(1482);
  const [muted, setMuted] = useState(soundEngine.isMuted());

  useEffect(() => {
    // Realistic fluctuation in online user count
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 7) - 3;
      setOnlineCount((prev) => Math.max(1350, Math.min(1650, prev + delta)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const liveEvents = useMemo(() => {
    const siteName = settings.site_name || 'ShelbyOnline';
    const sponsor1 = activeSponsors[0]?.name || siteName;
    const sponsor2 = activeSponsors[1]?.name || activeSponsors[0]?.name || siteName;
    const sponsor3 = activeSponsors[2]?.name || activeSponsors[0]?.name || siteName;

    const events: LiveEvent[] = [
      {
        id: 'ev-1',
        user: 'KralCaner',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80',
        action: "Gates of Olympus 1000'de",
        amount: '42.500 ₺',
        badge: 'JACKPOT',
        sponsor: sponsor1,
        type: 'jackpot',
      },
      {
        id: 'ev-2',
        user: 'ZeusSlotMaster',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80&q=80',
        action: 'Günlük VIP Çarktan',
        amount: '500 Coin',
        badge: 'VIP ÇARK',
        sponsor: siteName,
        type: 'wheel',
      },
      {
        id: 'ev-3',
        user: 'VipOyuncu99',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=80&h=80&q=80',
        action: "Sweet Bonanza'da 100x ile",
        amount: '28.400 ₺',
        badge: 'BIG WIN',
        sponsor: sponsor2,
        type: 'win',
      },
      {
        id: 'ev-4',
        user: 'KuzeyRuzgari',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80',
        action: "Aviator'da 45.20x ile",
        amount: '18.900 ₺',
        badge: 'CRASH',
        sponsor: sponsor3,
        type: 'win',
      },
      {
        id: 'ev-5',
        user: 'MatrixCasino',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80',
        action: 'Coin Mağazasından',
        amount: '250 TL Alışveriş Çeki',
        badge: 'MAĞAZA',
        sponsor: siteName,
        type: 'store',
      },
      {
        id: 'ev-6',
        user: 'EfsaneBahisci',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80',
        action: 'Canlı Bahis Kuponundan',
        amount: '31.200 ₺',
        badge: 'SPOR WIN',
        sponsor: sponsor1,
        type: 'win',
      },
    ];
    return events;
  }, [activeSponsors, settings.site_name]);

  const toggleSound = () => {
    const isNowMuted = soundEngine.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      soundEngine.playClick();
    }
  };

  return (
    <div className="w-full bg-[#0a0614] border-b border-violet-900/30 text-xs text-slate-300 py-1.5 px-3 sm:px-4 flex items-center justify-between gap-3 overflow-hidden shadow-inner select-none">
      {/* Left: Online Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{onlineCount.toLocaleString('tr-TR')} Çevrimiçi</span>
        </div>
      </div>

      {/* Center: Live Scrolling Ticker */}
      <div className="relative flex-1 overflow-hidden h-6 flex items-center mask-linear">
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee hover:[animation-play-state:paused] cursor-default">
          {liveEvents.concat(liveEvents).map((ev, i) => (
            <div key={`${ev.id}-${i}`} className="inline-flex items-center gap-2 text-xs">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  ev.type === 'jackpot'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                    : ev.type === 'wheel'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                    : ev.type === 'store'
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                    : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {ev.badge}
              </span>
              <img
                src={ev.avatar}
                alt={ev.user}
                className="w-4 h-4 rounded-full object-cover border border-violet-500/40"
              />
              <span className="font-bold text-white">@{ev.user}</span>
              <span className="text-slate-400">{ev.action}</span>
              <span className="font-extrabold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                {ev.amount}
              </span>
              <span className="text-[10px] text-violet-400 font-medium">({ev.sponsor})</span>
              <span className="text-slate-600 ml-3">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Sound Control Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={toggleSound}
          className={`p-1.5 rounded-lg border text-xs transition-all flex items-center gap-1 font-semibold ${
            muted
              ? 'bg-slate-900/60 border-slate-700/40 text-slate-400 hover:text-slate-200'
              : 'bg-violet-600/20 border-violet-500/40 text-violet-300 hover:bg-violet-600/30'
          }`}
          title={muted ? 'Sesleri Aç' : 'Sesleri Kapat'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-violet-400 animate-pulse" />}
          <span className="text-[10px] hidden md:inline">{muted ? 'Ses Kapalı' : 'Ses Açık'}</span>
        </button>
      </div>
    </div>
  );
};
