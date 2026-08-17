import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Megaphone, ArrowRight, X, Sparkles } from 'lucide-react';
import { soundEngine } from '../../lib/sound';

export const AnnouncementBanner: React.FC = () => {
  const { settings } = useData();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !settings.announcement_enabled || !settings.announcement_text) {
    return null;
  }

  const isExternal =
    settings.announcement_link?.startsWith('http://') ||
    settings.announcement_link?.startsWith('https://');

  return (
    <div className="w-full bg-gradient-to-r from-violet-950 via-[#180a33] to-indigo-950 border-b border-violet-700/40 text-xs py-2 px-3 sm:px-6 relative z-40 shadow-lg text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 justify-center sm:justify-start">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/40 border border-violet-400/40 text-[10px] font-black tracking-wider text-violet-200 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            {settings.announcement_badge || 'DUYURU'}
          </span>

          <p className="text-xs text-slate-200 font-medium truncate sm:whitespace-normal">
            {settings.announcement_text}
          </p>

          {settings.announcement_link && (
            isExternal ? (
              <a
                href={settings.announcement_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.playClick()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 shrink-0 ml-1"
              >
                <span>İncele</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            ) : (
              <NavLink
                to={settings.announcement_link}
                onClick={() => soundEngine.playClick()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 shrink-0 ml-1"
              >
                <span>İncele</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            )
          )}
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            setDismissed(true);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
