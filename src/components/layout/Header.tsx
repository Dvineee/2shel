import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
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

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      soundEngine.playClick();
      navigate(`/sponsors?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#070510]/90 backdrop-blur-xl border-b border-violet-900/20 px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Mobile Hamburger & Logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenMobileMenu();
          }}
          className="p-2 rounded-xl bg-violet-950/40 text-violet-300 hover:text-white border border-violet-800/30 transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>
        <NavLink to="/" onClick={() => soundEngine.playClick()} className="flex items-center gap-2">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.site_name || 'Logo'}
              className="h-7 max-w-[140px] object-contain"
            />
          ) : (
            <span className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-violet-400">
              {settings.site_name || 'SHELBYONLINE'}
            </span>
          )}
        </NavLink>
      </div>

      {/* Global Quick Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center relative max-w-md w-full"
      >
        <Search className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Sponsor, bonus kodu veya kampanya ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-full bg-violet-950/30 border border-violet-800/30 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
        />
      </form>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell - Active ONLY when user is logged in */}
        {user && settings.page_giveaways_enabled !== false && (
          <NavLink
            to="/giveaways"
            onClick={() => soundEngine.playClick()}
            className="p-2 rounded-xl bg-violet-950/40 text-violet-300 hover:text-white border border-violet-800/30 transition-colors relative hover:bg-violet-900/40"
            title="Çekilişler & Güncellemeler"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500" />
          </NavLink>
        )}

        {/* User Profile or Login */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2.5 p-1 pl-3 pr-2 rounded-full bg-violet-950/50 border border-violet-800/40 hover:border-violet-600 transition-all hover:bg-violet-900/40"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold text-white bg-gradient-to-r from-[#24A1DE] via-sky-500 to-blue-600 hover:from-[#1e88e5] hover:to-blue-500 shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>Telegram ile Giriş</span>
          </NavLink>
        )}
      </div>
    </header>
  );
};

