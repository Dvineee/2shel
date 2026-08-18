import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  User as UserIcon,
  LogOut,
  Shield,
  Search,
  Sparkles,
  ChevronDown,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { soundEngine } from '../../lib/sound';
import { SearchModal } from '../common/SearchModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Keyboard shortcut: Ctrl+K or Cmd+K or "/" to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundEngine.playClick();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#070510]/90 backdrop-blur-xl border-b border-violet-900/20 px-3 sm:px-4 md:px-6 flex items-center justify-between transition-all">
        {/* Mobile Hamburger & ShelbyOnline Logo with Energy Effects */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenMobileMenu();
            }}
            className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-[13px] text-[#c5a0ff] hover:text-white transition-all active:scale-95 cursor-pointer shadow-md"
            style={{
              background:
                'linear-gradient(145deg, rgba(87, 31, 145, 0.38), rgba(35, 13, 61, 0.75))',
            }}
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          <NavLink
            to="/"
            onClick={() => soundEngine.playClick()}
            className="shelby-logo"
          >
            <div className="effects-clip">
              <div className="energy-stream" />
              <div className="energy-line" />
              <div className="bottom-streak" />
              <div className="scanner" />
            </div>

            <span
              className="logo-text"
              data-text={settings.site_name || 'SHELBYONLINE'}
            >
              {settings.site_name || 'SHELBYONLINE'}
            </span>
          </NavLink>
        </div>

        {/* Global Quick Search Bar (Desktop Trigger for Search Modal) */}
        <div
          onClick={() => {
            soundEngine.playClick();
            setIsSearchModalOpen(true);
          }}
          className="hidden md:flex items-center relative max-w-md w-full cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsSearchModalOpen(true);
            }
          }}
          aria-label="Arama Modalını Aç"
        >
          <Search className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none group-hover:text-violet-300 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Sponsor, bonus kodu veya kampanya ara..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-full bg-violet-950/30 border border-violet-800/30 text-slate-200 placeholder-slate-400 group-hover:border-violet-600/50 group-hover:bg-violet-900/30 focus:outline-none transition-all cursor-pointer select-none"
          />
        </div>

        {/* Right Controls: Mobile Search Button + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button (Visible on mobile/tablet) */}
          <button
            type="button"
            id="mobile-header-search-button"
            onClick={() => {
              soundEngine.playClick();
              setIsSearchModalOpen(true);
            }}
            className="flex md:hidden items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-950/60 border border-violet-700/40 text-violet-300 hover:text-white hover:bg-violet-900/60 hover:border-violet-500/60 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
            aria-label="Sitede Arama Yap"
            title="Sponsor ve Bonus Ara"
          >
            <Search className="w-4 h-4 text-violet-300" />
          </button>

          {/* User Profile or Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center gap-2.5 p-1 pl-3 pr-2 rounded-full bg-violet-950/50 border border-violet-800/40 hover:border-violet-600 transition-all hover:bg-violet-900/40 cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 hidden md:inline">
                  {user.username}
                </span>
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-7 h-7 rounded-full object-cover border border-violet-500/40"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#120b24] border border-violet-700/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-violet-900/30">
                    <p className="text-sm font-bold text-white truncate">{user.username}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <div className="py-1 space-y-1">
                    <NavLink
                      to="/profile"
                      onClick={() => {
                        soundEngine.playClick();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-violet-900/30 rounded-xl transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-violet-400" />
                      Profilim
                    </NavLink>

                    <NavLink
                      to="/wheel"
                      onClick={() => {
                        soundEngine.playClick();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-violet-900/30 rounded-xl transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Günlük Şans Çarkı
                    </NavLink>

                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => {
                          soundEngine.playClick();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-900/30 rounded-xl transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-400" />
                        Yönetici Paneli (CMS)
                      </NavLink>
                    )}
                  </div>

                  <div className="pt-1 border-t border-violet-900/30">
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#24A1DE] via-sky-500 to-blue-600 hover:from-[#1e88e5] hover:to-blue-500 shadow-md shadow-sky-600/25 transition-all hover:scale-105 active:scale-95 shrink-0 border border-sky-400/20"
            >
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
              <span className="hidden sm:inline">Telegram ile </span>
              <span>Giriş</span>
            </NavLink>
          )}
        </div>
      </header>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

