import React, { useState } from 'react';
import { Tv, Play, Radio, Volume2, ShieldCheck, Flame } from 'lucide-react';
import { useData } from '../context/DataContext';
import { NavLink } from 'react-router-dom';

export const LiveTvPage: React.FC = () => {
  const { activeSponsors } = useData();
  const [activeMatch, setActiveMatch] = useState('Real Madrid - Manchester City');

  const matches = [
    { id: 1, title: 'Real Madrid - Manchester City', league: 'UEFA Şampiyonlar Ligi', time: 'CANLI (72\')', score: '2 - 1' },
    { id: 2, title: 'Galatasaray - Fenerbahçe', league: 'Trendyol Süper Lig', time: 'CANLI (45\')', score: '1 - 0' },
    { id: 3, title: 'Arsenal - Liverpool', league: 'İngiltere Premier Lig', time: 'Bugün 22:00', score: '- : -' },
    { id: 4, title: 'Barcelona - Bayern Münih', league: 'UEFA Şampiyonlar Ligi', time: 'Yarın 22:00', score: '- : -' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-3 animate-pulse">
          <Radio className="w-3.5 h-3.5 text-rose-400" />
          CANLI YAYIN & MAÇ MERKEZİ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Sponsor TV Canlı Yayın
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Tüm popüler futbol ve basketbol karşılaşmalarını HD kalitede kesintisiz ve ücretsiz izleyin.
        </p>
      </div>

      {/* Main Stream Player Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Video Player (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl overflow-hidden bg-[#0d0918] border border-violet-800/40 shadow-2xl flex flex-col">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
            {/* Background simulated football arena */}
            <img
              src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&h=675&q=80"
              alt="Live Stream"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

            {/* Simulated Live Broadcast HUD */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-black text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" /> CANLI
              </span>
              <span className="px-3 py-1 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-xs">
                {activeMatch}
              </span>
            </div>

            <div className="absolute center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-white ml-1" />
              </div>
              <span className="text-xs text-white/90 font-bold mt-2 drop-shadow">Yayını Başlat (1080p HD)</span>
            </div>
          </div>

          <div className="p-4 bg-[#120b24] flex items-center justify-between border-t border-violet-900/30 text-xs">
            <span className="text-slate-300 font-semibold">Yayın Kalitesi: 1080p 60 FPS • Gecikmesiz</span>
            <span className="text-emerald-400 font-bold">● Canlı Sunucu Bağlantısı Aktif</span>
          </div>
        </div>

        {/* Live Matches List (1 col) */}
        <div className="p-5 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-3">
          <h3 className="text-sm font-bold text-white mb-2">Günün Canlı Karşılaşmaları</h3>
          <div className="space-y-2">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setActiveMatch(match.title)}
                className={`w-full text-left p-3 rounded-2xl border transition-all ${
                  activeMatch === match.title
                    ? 'bg-violet-900/40 border-violet-500 shadow-md'
                    : 'bg-violet-950/20 border-violet-900/30 hover:bg-violet-950/40'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-violet-400 font-medium">{match.league}</span>
                  <span className="font-bold text-rose-400">{match.time}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{match.title}</span>
                  <span className="text-amber-400">{match.score}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
