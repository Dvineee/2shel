import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { Profile } from '../types';
import { Trophy, Crown, Medal, Flame, Coins, ShieldCheck } from 'lucide-react';
import { formatCoin } from '../lib/utils';

export const LeaderboardPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await db.getProfiles();
      // Sort by coin balance descending
      const sorted = [...all].sort((a, b) => b.coin_balance - a.coin_balance);
      setProfiles(sorted);
      setLoading(false);
    };
    load();
  }, []);

  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#120b24] to-[#070510] border border-amber-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          EN ÇOK COIN SAHİBİ OYUNCULAR
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          SponsorHub Leaderboard
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Şans çarkını çevirerek ve etkinliklere katılarak en çok coin toplayan haftanın VIP şampiyonları.
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div className="order-2 md:order-1 rounded-3xl bg-gradient-to-b from-[#19142c] to-[#0d0918] border border-slate-400/40 p-6 flex flex-col items-center text-center relative shadow-xl hover:-translate-y-1 transition-all">
              <div className="absolute -top-4 px-3 py-1 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1">
                <Medal className="w-3.5 h-3.5" /> 2. SIRA
              </div>
              <img
                src={top3[1].avatar_url}
                alt={top3[1].username}
                className="w-20 h-20 rounded-full border-4 border-slate-300 shadow-xl object-cover mb-3 mt-2"
              />
              <h3 className="text-base font-bold text-white truncate max-w-full">
                {top3[1].username}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-950/60 border border-violet-800/40 text-amber-300 font-black text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{formatCoin(top3[1].coin_balance)} Coin</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Champion) */}
          {top3[0] && (
            <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-amber-950/50 via-[#1e1438] to-[#0d0918] border-2 border-amber-400/60 p-8 flex flex-col items-center text-center relative shadow-2xl shadow-amber-500/20 hover:-translate-y-2 transition-all">
              <div className="absolute -top-5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-xl flex items-center gap-1.5 animate-bounce">
                <Crown className="w-4 h-4 text-slate-950" /> ŞAMPİYON 1.
              </div>
              <div className="relative mb-3 mt-2">
                <img
                  src={top3[0].avatar_url}
                  alt={top3[0].username}
                  className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-2xl object-cover"
                />
                <Crown className="w-8 h-8 text-amber-400 absolute -top-4 right-1/2 translate-x-1/2 drop-shadow-md" />
              </div>
              <h3 className="text-lg font-black text-white truncate max-w-full">
                {top3[0].username}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-base">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>{formatCoin(top3[0].coin_balance)} Coin</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div className="order-3 rounded-3xl bg-gradient-to-b from-[#19142c] to-[#0d0918] border border-amber-700/40 p-6 flex flex-col items-center text-center relative shadow-xl hover:-translate-y-1 transition-all">
              <div className="absolute -top-4 px-3 py-1 rounded-full bg-amber-700 text-amber-100 font-black text-xs shadow-lg flex items-center gap-1">
                <Medal className="w-3.5 h-3.5" /> 3. SIRA
              </div>
              <img
                src={top3[2].avatar_url}
                alt={top3[2].username}
                className="w-20 h-20 rounded-full border-4 border-amber-700 shadow-xl object-cover mb-3 mt-2"
              />
              <h3 className="text-base font-bold text-white truncate max-w-full">
                {top3[2].username}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-950/60 border border-violet-800/40 text-amber-300 font-black text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{formatCoin(top3[2].coin_balance)} Coin</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Ranking Table */}
      <div className="rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-violet-900/30 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Genel Sıralama</h3>
          <span className="text-xs text-slate-400">Toplam {profiles.length} Üye</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-violet-950/40 text-violet-300 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">Sıra</th>
                <th className="px-5 py-3.5">Kullanıcı</th>
                <th className="px-5 py-3.5">Rol</th>
                <th className="px-5 py-3.5 text-right">Coin Bakiyesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-900/20">
              {profiles.map((p, index) => (
                <tr key={p.id} className="hover:bg-violet-950/30 transition-colors">
                  <td className="px-5 py-4 text-center font-black text-sm">
                    {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar_url}
                        alt={p.username}
                        className="w-9 h-9 rounded-full object-cover border border-violet-600/40"
                      />
                      <span className="font-bold text-white text-sm">{p.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {p.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-black text-amber-300 text-sm">
                    {formatCoin(p.coin_balance)} COIN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
