import React, { useState } from 'react';
import { Minus, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { MinesGame } from '../../types/mines';
import { soundEngine } from '../../lib/sound';

interface MinesControlsProps {
  userCoins: number;
  selectedBet: number;
  onSelectBet: (bet: number) => void;
  selectedMines: number;
  onSelectMines: (mines: number) => void;
  game: MinesGame | null;
  isLoading: boolean;
  isStarting?: boolean;
  isCashingOut?: boolean;
  onStartGame: () => void;
  onCashOut: () => void;
}

const MINE_OPTIONS = [
  { count: 3, label: '3' },
  { count: 5, label: '5' },
  { count: 10, label: '10' },
];

export const MinesControls: React.FC<MinesControlsProps> = React.memo(({
  userCoins,
  selectedBet,
  onSelectBet,
  selectedMines,
  onSelectMines,
  game,
  isLoading,
  isStarting = false,
  isCashingOut = false,
  onStartGame,
  onCashOut,
}) => {
  const [isMinesDropdownOpen, setIsMinesDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');

  const isPlaying = game !== null && game.status === 'active';
  const openedCount = isPlaying ? game.opened_cells.length : 0;
  const canCashOut = isPlaying && openedCount > 0;
  const currentWinAmount = isPlaying ? Math.round(game.bet_amount * game.multiplier * 100) / 100 : 0;
  const hasEnoughCoins = userCoins >= selectedBet;
  const isAnyLoading = isLoading || isStarting || isCashingOut;

  // Handlers for Stepper & Multipliers
  const handleIncreaseBet = () => {
    if (isPlaying || isAnyLoading) return;
    soundEngine.playClick();
    onSelectBet(Math.min(userCoins || 500, selectedBet + 10));
  };

  const handleDecreaseBet = () => {
    if (isPlaying || isAnyLoading) return;
    soundEngine.playClick();
    onSelectBet(Math.max(5, selectedBet - 10));
  };

  const handleDoubleBet = () => {
    if (isPlaying || isAnyLoading) return;
    soundEngine.playClick();
    onSelectBet(Math.min(userCoins || 500, selectedBet * 2));
  };

  const handleHalfBet = () => {
    if (isPlaying || isAnyLoading) return;
    soundEngine.playClick();
    onSelectBet(Math.max(5, Math.floor(selectedBet / 2)));
  };

  const handleMaxBet = () => {
    if (isPlaying || isAnyLoading) return;
    soundEngine.playClick();
    onSelectBet(Math.max(5, Math.min(userCoins, 250)));
  };

  return (
    <div
      id="mines-controls-panel"
      className="w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] lg:max-w-[460px] mx-auto bg-[#171d26] rounded-2xl border border-[#232c38] p-3 sm:p-4 shadow-xl select-none"
    >
      {/* 1. Mode Tab Header (Manuel / Otomatik Bahis) */}
      <div className="grid grid-cols-2 gap-1 bg-[#12161d] p-1 rounded-xl border border-[#1f2733] mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'manual'
              ? 'bg-[#222b37] text-white shadow-sm'
              : 'text-[#627284] hover:text-[#94a3b8]'
          }`}
        >
          Manuel
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('auto')}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'auto'
              ? 'bg-[#222b37] text-white shadow-sm'
              : 'text-[#627284] hover:text-[#94a3b8]'
          }`}
        >
          Otomatik Bahis
        </button>
      </div>

      {/* 2. Main Controls Grid: Left Inputs + Right Orange Action CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        {/* Left Column: Bet Stepper + Quick Mults */}
        <div className="space-y-2">
          {/* Stepper Input: [ - ] 10.00 [ + ] */}
          <div className="flex items-center justify-between bg-[#12161d] rounded-xl border border-[#1f2733] p-1">
            <button
              type="button"
              disabled={isPlaying || isAnyLoading || selectedBet <= 5}
              onClick={handleDecreaseBet}
              className="w-8 h-8 rounded-lg bg-[#1b232e] hover:bg-[#252f3e] disabled:opacity-40 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="text-white font-black text-sm tracking-wide">
              {(isPlaying ? game.bet_amount : selectedBet).toFixed(2)}
            </span>

            <button
              type="button"
              disabled={isPlaying || isAnyLoading || selectedBet >= userCoins}
              onClick={handleIncreaseBet}
              className="w-8 h-8 rounded-lg bg-[#1b232e] hover:bg-[#252f3e] disabled:opacity-40 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Bet Buttons: X2, /2, Max */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              disabled={isPlaying || isAnyLoading}
              onClick={handleDoubleBet}
              className="py-1.5 rounded-lg bg-[#1b232e] hover:bg-[#252f3e] border border-[#242e3d] text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              X2
            </button>
            <button
              type="button"
              disabled={isPlaying || isAnyLoading}
              onClick={handleHalfBet}
              className="py-1.5 rounded-lg bg-[#1b232e] hover:bg-[#252f3e] border border-[#242e3d] text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              /2
            </button>
            <button
              type="button"
              disabled={isPlaying || isAnyLoading}
              onClick={handleMaxBet}
              className="py-1.5 rounded-lg bg-[#1b232e] hover:bg-[#252f3e] border border-[#242e3d] text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              Max
            </button>
          </div>
        </div>

        {/* Right Column: Massive Orange Action CTA Button */}
        <div className="flex">
          {isPlaying ? (
            /* CASHOUT (PARA ÇEK) BUTTON */
            <button
              type="button"
              id="mines-cashout-button"
              disabled={!canCashOut || isAnyLoading}
              onClick={onCashOut}
              className={`w-full h-full min-h-[72px] rounded-xl flex flex-col items-center justify-center transition-all select-none shadow-lg ${
                isCashingOut
                  ? 'bg-[#b34400] text-white cursor-wait opacity-90'
                  : canCashOut && !isAnyLoading
                  ? 'bg-gradient-to-b from-[#ff6b00] via-[#e65100] to-[#cc4400] hover:from-[#ff7b1a] hover:to-[#d94900] text-white shadow-orange-950/60 active:scale-95 cursor-pointer border border-[#ff8f3d]'
                  : 'bg-[#3b281c] border border-[#4d3222] text-[#8c6b54] cursor-not-allowed'
              }`}
            >
              {isCashingOut ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-xs font-black">ÇEKİLİYOR...</span>
                </div>
              ) : canCashOut ? (
                <>
                  <span className="text-sm font-black tracking-wider uppercase drop-shadow-sm">
                    PARA ÇEK
                  </span>
                  <span className="text-xs font-bold text-amber-200 mt-0.5">
                    {currentWinAmount.toFixed(2)} COIN
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-black tracking-wider uppercase text-amber-400/80">
                    KUTU SEÇİN
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/50 mt-0.5">
                    0.00 COIN
                  </span>
                </>
              )}
            </button>
          ) : (
            /* START GAME (BAHİS YAP / OYNA) BUTTON */
            <button
              type="button"
              id="mines-start-button"
              disabled={isAnyLoading || !hasEnoughCoins}
              onClick={onStartGame}
              className={`w-full h-full min-h-[72px] rounded-xl flex flex-col items-center justify-center transition-all select-none shadow-lg ${
                isStarting
                  ? 'bg-[#b34400] text-white cursor-wait opacity-90'
                  : hasEnoughCoins && !isAnyLoading
                  ? 'bg-gradient-to-b from-[#ff6b00] via-[#e65100] to-[#cc4400] hover:from-[#ff7b1a] hover:to-[#d94900] text-white shadow-orange-950/60 active:scale-95 cursor-pointer border border-[#ff8f3d]'
                  : 'bg-[#291f1a] border border-[#3b2a22] text-slate-500 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-xs font-black">BAŞLATILIYOR...</span>
                </div>
              ) : hasEnoughCoins ? (
                <>
                  <span className="text-sm font-black tracking-wider uppercase drop-shadow-sm">
                    BAHİS YAP
                  </span>
                  <span className="text-xs font-bold text-amber-200 mt-0.5">
                    {selectedBet.toFixed(2)} COIN
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-black tracking-wider uppercase text-rose-400">
                    YETERSİZ BAKİYE
                  </span>
                  <span className="text-[10px] font-semibold text-rose-300/80 mt-0.5">
                    {selectedBet.toFixed(2)} COIN
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3. Mayınlar Dropdown Selector (Bottom Row) */}
      <div className="mt-3 relative">
        <button
          type="button"
          disabled={isPlaying || isAnyLoading}
          onClick={() => setIsMinesDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#12161d] hover:bg-[#161c24] disabled:opacity-50 rounded-xl border border-[#1f2733] text-left transition-colors"
        >
          <div>
            <span className="block text-[10px] font-medium text-[#8c9ba5]">
              Mayınlar
            </span>
            <span className="block text-xs font-bold text-white">
              {isPlaying ? game.mine_count : selectedMines}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#8c9ba5] transition-transform ${
              isMinesDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Options */}
        {isMinesDropdownOpen && !isPlaying && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#161c24] border border-[#232c38] rounded-xl overflow-hidden shadow-2xl z-30">
            {MINE_OPTIONS.map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onSelectMines(opt.count);
                  setIsMinesDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                  selectedMines === opt.count
                    ? 'bg-[#222b37] text-white'
                    : 'text-slate-300 hover:bg-[#1b222c]'
                }`}
              >
                <span>{opt.count} Mayın</span>
                <span className="text-[10px] text-slate-400">
                  ({opt.count === 3 ? 'Kolay' : opt.count === 5 ? 'Orta' : 'Zor'})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});


