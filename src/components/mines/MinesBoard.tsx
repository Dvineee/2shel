import React from 'react';
import { MinesCell } from './MinesCell';
import { MinesGame } from '../../types/mines';
import { calculateNextMultiplier } from '../../utils/minesMath';

interface MinesBoardProps {
  game: MinesGame | null;
  selectedMines: number;
  hitCell: number | null;
  revealedMines: number[];
  isRevealing: boolean;
  onRevealCell: (index: number) => void;
}

export const MinesBoard: React.FC<MinesBoardProps> = React.memo(({
  game,
  selectedMines,
  hitCell,
  revealedMines,
  isRevealing,
  onRevealCell,
}) => {
  const isPlaying = game !== null && game.status === 'active';
  const openedSet = new Set(game?.opened_cells || []);
  const minesSet = new Set(revealedMines);
  const activeMineCount = isPlaying ? game.mine_count : selectedMines;
  const openedCount = isPlaying ? game.opened_cells.length : 0;
  const nextMultiplier = calculateNextMultiplier(activeMineCount, openedCount);

  return (
    <div
      id="mines-board-container"
      className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] lg:max-w-[460px] mx-auto flex flex-col items-center"
    >
      {/* Top Header Strip: Sonraki [Multiplier]x & Mayınlar [Count] (Matching Screenshot) */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-[#171d26] rounded-t-2xl border-t border-x border-[#232c38] text-xs select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[#8c9ba5] font-medium text-[11px] sm:text-xs">Sonraki</span>
          <span className="text-white font-bold text-xs sm:text-sm tracking-tight">
            {nextMultiplier.toFixed(4)}x
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[#8c9ba5] font-medium text-[11px] sm:text-xs">Mayınlar</span>
          <span className="text-white font-bold text-xs sm:text-sm">
            {activeMineCount}
          </span>
        </div>
      </div>

      {/* 5x5 Grid Board (Matching Screenshot Dark Theme) */}
      <div
        id="mines-grid-frame"
        className="w-full p-2.5 xs:p-3 sm:p-4 bg-[#1b232e] border-x border-[#232c38] flex flex-col justify-center items-center shadow-xl"
      >
        <div
          id="mines-grid"
          className="grid grid-cols-5 gap-1.5 xs:gap-2 sm:gap-2.5 w-full"
        >
          {Array.from({ length: 25 }).map((_, index) => {
            const isOpened = openedSet.has(index);
            const isExploded = hitCell === index;
            const isMine = minesSet.has(index) && !isExploded;
            const isSafe = isOpened && !isExploded && !isMine;
            const cellDisabled = !isPlaying || isRevealing || isOpened;

            return (
              <MinesCell
                key={index}
                index={index}
                isOpened={isOpened}
                isMine={isMine}
                isExploded={isExploded}
                isSafe={isSafe}
                disabled={cellDisabled}
                onClick={onRevealCell}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Status / Mode Badge Strip (Matching Screenshot) */}
      <div className="w-full flex justify-center bg-[#171d26] rounded-b-2xl border-b border-x border-[#232c38] py-1.5">
        <span className="px-3 py-0.5 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-[#d95300] text-white shadow-sm">
          {isPlaying ? 'SHELBY MINES' : 'SHELBY MINES'}
        </span>
      </div>
    </div>
  );
});


