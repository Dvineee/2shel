import React, { useState } from 'react';
import { Gamepad2, Sparkles, Flame, Play, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export const GamesPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'slots' | 'crash' | 'roulette'>('slots');
  const [slotItems, setSlotItems] = useState(['🍒', '💎', '7️⃣']);
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);

  const symbols = ['🍒', '💎', '7️⃣', '👑', '🍋', '⭐'];

  const playDemoSlot = () => {
    if (isSlotSpinning) return;
    setIsSlotSpinning(true);

    let counter = 0;
    const interval = setInterval(() => {
      setSlotItems([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        // Determine final result (high chance of 3 match for fun demo)
        const win = Math.random() > 0.5;
        const chosen = win ? '💎' : symbols[Math.floor(Math.random() * symbols.length)];
        const final = win
          ? [chosen, chosen, chosen]
          : [
              symbols[Math.floor(Math.random() * symbols.length)],
              symbols[Math.floor(Math.random() * symbols.length)],
              symbols[Math.floor(Math.random() * symbols.length)],
            ];
        setSlotItems(final);
        setIsSlotSpinning(false);

        if (final[0] === final[1] && final[1] === final[2]) {
          confetti({ particleCount: 100, spread: 70 });
          toast.success('BÜYÜK KAZANÇ! 3x ' + final[0] + ' Jackpot!');
        } else {
          toast.info('Tekrar deneyin!');
        }
      }
    }, 100);
  };

  const gameCategories = [
    {
      id: 'slots',
      title: 'Slot Oyunları',
      desc: 'Gates of Olympus, Sweet Bonanza, Sugar Rush ve yüzlerce popüler slot oyunu.',
      icon: Sparkles,
      color: 'from-purple-600 to-violet-600',
    },
    {
      id: 'crash',
      title: 'Crash & Aviator',
      desc: 'Yükselen çarpanlar, anında nakit çekim ve yüksek adrenalinli hızlı oyunlar.',
      icon: Flame,
      color: 'from-amber-500 to-rose-600',
    },
    {
      id: 'roulette',
      title: 'Canlı Masa Oyunları',
      desc: 'Türkçe rulet, Blackjack, Baccarat ve Lightning serisi masalar.',
      icon: Trophy,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-3">
          <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
          OYUN VE STRATEJİ REHBERİ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Oyun Seçici & Demo Arena
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          En sevdiğiniz oyun kategorilerini keşfedin, demo alanında şansınızı ücretsiz test edin.
        </p>
      </div>

      {/* Interactive Demo Slot Machine */}
      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#160e2c] to-[#0d0918] border-2 border-violet-700/40 shadow-2xl max-w-xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-4">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          ÜCRETSİZ DEMO ÇEVİRME ARENASI
        </div>

        {/* 3 Reels Box */}
        <div className="flex items-center justify-center gap-4 my-6">
          {slotItems.map((symbol, idx) => (
            <div
              key={idx}
              className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-violet-950/80 border-2 border-violet-500/40 shadow-inner flex items-center justify-center text-4xl sm:text-5xl select-none"
            >
              <span className={isSlotSpinning ? 'animate-bounce' : ''}>{symbol}</span>
            </div>
          ))}
        </div>

        <button
          onClick={playDemoSlot}
          disabled={isSlotSpinning}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-violet-900/50 hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isSlotSpinning ? 'animate-spin' : ''}`} />
          <span>{isSlotSpinning ? 'DÖNÜYOR...' : 'DEMO ÇEVİR'}</span>
        </button>
      </div>

      {/* Game Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gameCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 hover:border-violet-600/50 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-violet-900/30">
                <span className="text-xs font-bold text-violet-400">
                  Doğrulanmış sponsorlarda mevcut
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
