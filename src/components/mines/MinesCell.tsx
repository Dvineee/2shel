import React from 'react';
import { Bomb } from 'lucide-react';
import { soundEngine } from '../../lib/sound';

interface MinesCellProps {
  index: number;
  isOpened: boolean;
  isMine?: boolean;
  isExploded?: boolean;
  isSafe?: boolean;
  disabled: boolean;
  onClick: (index: number) => void;
}

export const MinesCell: React.FC<MinesCellProps> = React.memo(({
  index,
  isOpened,
  isMine,
  isExploded,
  isSafe,
  disabled,
  onClick,
}) => {
  const handleClick = () => {
    if (disabled || isOpened) return;
    soundEngine.playClick();
    onClick(index);
  };

  // 1. Exploded Mine (Triggered Loss)
  if (isExploded) {
    return (
      <div
        id={`mines-cell-${index}`}
        className="relative aspect-square w-full rounded-xl flex flex-col items-center justify-center bg-[#2b1419] border-2 border-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-shake select-none cursor-not-allowed"
      >
        <Bomb className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-rose-400 animate-bounce" />
        <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-black text-rose-300 mt-0.5 uppercase tracking-wider">
          BOOM
        </span>
      </div>
    );
  }

  // 2. Revealed Mine (Post-game)
  if (isMine) {
    return (
      <div
        id={`mines-cell-${index}`}
        className="relative aspect-square w-full rounded-xl flex flex-col items-center justify-center bg-[#1e1c24]/90 border border-rose-950/60 text-rose-400/70 opacity-70 select-none cursor-not-allowed"
      >
        <Bomb className="w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 text-rose-400/60" />
      </div>
    );
  }

  // 3. Opened Safe Tile -> Gold Bordered Sparkling Diamond (Matching Screenshot)
  if (isSafe || isOpened) {
    return (
      <div
        id={`mines-cell-${index}`}
        className="relative aspect-square w-full rounded-xl flex items-center justify-center bg-[#201d16] border-2 border-[#f5a623] shadow-[0_0_14px_rgba(245,166,35,0.35)] select-none cursor-default p-1.5 animate-in zoom-in-90 duration-150"
      >
        {/* Golden Diamond Graphic with Sparkles matching screenshot */}
        <div className="relative flex items-center justify-center w-full h-full">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 drop-shadow-[0_2px_8px_rgba(245,166,35,0.4)]"
          >
            {/* Top-Left Sparkle Star */}
            <path
              d="M8 8L9.5 12L13.5 13.5L9.5 15L8 19L6.5 15L2.5 13.5L6.5 12L8 8Z"
              fill="#FCD34D"
            />
            {/* Bottom-Right Sparkle Star */}
            <path
              d="M40 30L41 33L44 34L41 35L40 38L39 35L36 34L39 33L40 30Z"
              fill="#FCD34D"
            />
            {/* Main Diamond Facets */}
            {/* Top Crown Facet */}
            <path
              d="M17 17L24 15L31 17L37 23L24 23L11 23L17 17Z"
              fill="#F59E0B"
            />
            {/* Top Left Triangle */}
            <path
              d="M17 17L11 23L18 23L17 17Z"
              fill="#FDE68A"
            />
            {/* Top Center Triangle */}
            <path
              d="M17 17L24 15L31 17L24 23L17 17Z"
              fill="#FCD34D"
            />
            {/* Top Right Triangle */}
            <path
              d="M31 17L30 23L37 23L31 17Z"
              fill="#D97706"
            />
            {/* Bottom Left Pavilion */}
            <path
              d="M11 23L24 37L18 23H11Z"
              fill="#D97706"
            />
            {/* Bottom Center Pavilion */}
            <path
              d="M18 23L24 37L30 23H18Z"
              fill="#F59E0B"
            />
            {/* Bottom Right Pavilion */}
            <path
              d="M30 23L24 37L37 23H30Z"
              fill="#B45309"
            />
            {/* Diamond Outline */}
            <path
              d="M17 17L24 15L31 17L37 23L24 37L11 23L17 17Z"
              stroke="#FDE68A"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  // 4. Unopened Tile -> Calligraphic/Script Monogram "S" (Matching Screenshot)
  return (
    <button
      type="button"
      id={`mines-cell-${index}`}
      disabled={disabled}
      onClick={handleClick}
      aria-label={`Kutu ${index + 1}`}
      className={`group relative aspect-square w-full rounded-xl flex items-center justify-center transition-all duration-150 select-none overflow-hidden ${
        disabled
          ? 'bg-[#1b222c]/80 border border-[#232c38] cursor-not-allowed opacity-60'
          : 'bg-[#222a36] hover:bg-[#283240] border border-[#2c3645] hover:border-[#3c4a5d] active:scale-95 cursor-pointer shadow-sm'
      }`}
    >
      {/* Calligraphic Script Monogram "S" / "Z" inspired symbol */}
      <span
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        className="text-lg xs:text-xl sm:text-2xl font-normal text-[#485363] group-hover:text-[#6b7b91] transition-colors select-none drop-shadow-sm"
      >
        𝒮
      </span>
    </button>
  );
});



