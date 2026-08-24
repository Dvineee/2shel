import React from 'react';
import { TrendingUp, ShieldAlert, Coins, Sparkles } from 'lucide-react';
import { MinesGame } from '../../types/mines';
import {
  calculateNextMultiplier,
  calculatePotentialWin,
  getNextTileWinProbability,
} from '../../utils/minesMath';

interface MinesMultiplierProps {
  game: MinesGame | null;
  selectedMineCount: number;
  selectedBetAmount: number;
}

export const MinesMultiplier: React.FC<MinesMultiplierProps> = React.memo(({
  game,
  selectedMineCount,
  selectedBetAmount,
}) => {
  const isPlaying = game !== null && game.status === 'active';

  const mineCount = isPlaying ? game.mine_count : selectedMineCount;
  const betAmount = isPlaying ? game.bet_amount : selectedBetAmount;
  const safeOpened = isPlaying ? game.opened_cells.length : 0;
  const currentMultiplier = isPlaying ? game.multiplier : 1.0;
  const nextMultiplier = calculateNextMultiplier(mineCount, safeOpened);
  const potentialWin = calculatePotentialWin(betAmount, currentMultiplier);
  const nextPotentialWin = calculatePotentialWin(betAmount, nextMultiplier);
  const winChance = getNextTileWinProbability(mineCount, safeOpened);
  const remainingSafe = 25 - mineCount - safeOpened;

  return (
    <div
      id="mines-multiplier-banner"
      className="w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] lg:max-w-[460px] mx-auto bg-[#171d26] border border-[#232c38] rounded-2xl p-2 sm:p-3 mb-2.5 shadow-lg select-none"
    >
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center items-center">
        {/* 1. Mevcut Çarpan */}
        <div className="p-1.5 sm:p-2 rounded-xl bg-[#12161d] border border-[#1f2733] flex flex-col justify-center items-center min-w-0">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#8c9ba5] mb-0.5 truncate">
            <TrendingUp className="w-3 h-3 text-[#8c9ba5] shrink-0" />
            <span className="truncate">Çarpan</span>
          </div>
          <span className="text-xs sm:text-base font-black text-white">
            x{currentMultiplier.toFixed(2)}
          </span>
        </div>

        {/* 2. Sonraki Kutu Çarpanı */}
        <div className="p-1.5 sm:p-2 rounded-xl bg-[#12161d] border border-[#1f2733] flex flex-col justify-center items-center min-w-0">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-400 mb-0.5 truncate">
            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">Sonraki</span>
          </div>
          <span className="text-xs sm:text-base font-black text-emerald-400">
            x{nextMultiplier.toFixed(2)}
          </span>
        </div>

        {/* 3. Kazanç */}
        <div className="p-1.5 sm:p-2 rounded-xl bg-[#12161d] border border-[#1f2733] flex flex-col justify-center items-center min-w-0">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#f5a623] mb-0.5 truncate">
            <Coins className="w-3 h-3 text-[#f5a623] shrink-0" />
            <span className="truncate">{isPlaying ? 'Kazanç' : 'Potansiyel'}</span>
          </div>
          <span className="text-xs sm:text-base font-black text-[#f5a623] truncate">
            {isPlaying ? potentialWin.toFixed(1) : nextPotentialWin.toFixed(1)}
          </span>
        </div>

        {/* 4. Kalan Güvenli Kutular */}
        <div className="p-1.5 sm:p-2 rounded-xl bg-[#12161d] border border-[#1f2733] flex flex-col justify-center items-center min-w-0">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-sky-400 mb-0.5 truncate">
            <ShieldAlert className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">Kalan</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs sm:text-base font-black text-sky-300">
              {remainingSafe}
            </span>
            <span className="text-[9px] text-sky-400/60 hidden xs:inline">
              /{25 - mineCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});


