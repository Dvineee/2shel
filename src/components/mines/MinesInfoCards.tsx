import React, { useState } from 'react';
import { Sparkles, Bomb, ArrowUpRight, HelpCircle, ChevronDown, ChevronUp, Percent } from 'lucide-react';

export const MinesInfoCards: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div id="mines-info-section" className="mt-4 sm:mt-8 w-full">
      {/* Mobile Toggle Bar */}
      <button
        type="button"
        id="mines-rules-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full sm:hidden flex items-center justify-between p-2.5 rounded-xl bg-violet-950/40 border border-violet-800/30 text-xs font-bold text-violet-300 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
          <span>Mines Oyun Kuralları & %17 House Edge Detayları</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Info Cards Grid (Always visible on desktop, toggleable on mobile) */}
      <div
        id="mines-info-cards"
        className={`${
          isOpen ? 'grid' : 'hidden sm:grid'
        } grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 mt-2.5 sm:mt-0 w-full`}
      >
        {/* Card 1: Güvenli Kutu */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#120a24]/90 via-[#0e071c]/80 to-[#090414] border border-violet-800/30 flex items-start gap-3 backdrop-blur-sm shadow-md">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1 flex items-center gap-1.5">
              <span>💎</span> Güvenli Kutu
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Her açtığınız güvenli elmas kutusu çarpanınızı katlar ve potansiyel kazancınızı artırır.
            </p>
          </div>
        </div>

        {/* Card 2: Mayın */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#120a24]/90 via-[#0e071c]/80 to-[#090414] border border-violet-800/30 flex items-start gap-3 backdrop-blur-sm shadow-md">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1 flex items-center gap-1.5">
              <span>💣</span> Mayın & Risk
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Mayına basarsanız patlama gerçekleşir ve oyun sona erer, yatırdığınız bahis tutarı yanar.
            </p>
          </div>
        </div>

        {/* Card 3: Kazancı Al & %17 House Edge */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#120a24]/90 via-[#0e071c]/80 to-[#090414] border border-violet-800/30 flex items-start gap-3 backdrop-blur-sm shadow-md">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1 flex items-center gap-1.5">
              <span>💰</span> Kazancı Al (%17 Edge)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              İstediğiniz adımda kazancınızı anında çekebilirsiniz. Matematiksel adil olasılık & %17 kasa marjı uygulanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

