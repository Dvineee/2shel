import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ShieldCheck,
  Disc,
  Gift,
  ShoppingBag,
  Trophy,
  Gamepad2,
  Tv,
  Menu,
} from 'lucide-react';
import { soundEngine } from '../../lib/sound';
import { useData } from '../../context/DataContext';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const location = useLocation();
  const { settings } = useData();

  // Potential nav items
  const candidates = [
    {
      to: '/',
      label: 'Ana Sayfa',
      icon: Home,
      isActive: location.pathname === '/',
      enabled: true,
    },
    {
      to: '/sponsors',
      label: 'Sponsorlar',
      icon: ShieldCheck,
      isActive: location.pathname.startsWith('/sponsors') || location.pathname.startsWith('/site'),
      enabled: settings.page_sponsors_enabled !== false,
    },
    {
      to: '/wheel',
      label: 'ÇARK',
      icon: Disc,
      isSpecial: true,
      isActive: location.pathname === '/wheel' || location.pathname === '/reward-wheel',
      enabled: settings.page_wheel_enabled !== false,
    },
    {
      to: '/giveaways',
      label: 'Çekiliş',
      icon: Gift,
      isActive: location.pathname.startsWith('/giveaways'),
      enabled: settings.page_giveaways_enabled !== false,
    },
    {
      to: '/store',
      label: 'Mağaza',
      icon: ShoppingBag,
      isActive: location.pathname === '/store',
      enabled: settings.page_store_enabled !== false,
    },
    {
      to: '/leaderboard',
      label: 'Liderler',
      icon: Trophy,
      isActive: location.pathname === '/leaderboard',
      enabled: settings.page_leaderboard_enabled !== false,
    },
    {
      to: '/live',
      label: 'Canlı TV',
      icon: Tv,
      isActive: location.pathname === '/live',
      enabled: settings.page_live_enabled !== false,
    },
    {
      to: '/games',
      label: 'Oyunlar',
      icon: Gamepad2,
      isActive: location.pathname === '/games',
      enabled: settings.page_games_enabled !== false,
    },
  ];

  // Pick up to 4 items + 1 Menu button
  const enabledItems = candidates.filter((item) => item.enabled);
  // Keep up to 4 items before the menu
  const displayItems = enabledItems.slice(0, 4);

  return (
    <nav
      aria-label="Mobil Alt Menü"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0c0817]/95 backdrop-blur-2xl border-t border-violet-900/30 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] safe-area-bottom"
    >
      <div
        className="grid items-center w-full max-w-lg mx-auto px-1 h-14"
        style={{ gridTemplateColumns: `repeat(${displayItems.length + 1}, minmax(0, 1fr))` }}
      >
        {displayItems.map((item) => {
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <div key={item.to} className="flex items-center justify-center h-full w-full">
                <NavLink
                  to={item.to}
                  onClick={() => soundEngine.playClick()}
                  className="flex flex-col items-center justify-center -translate-y-3 group focus:outline-none"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center p-0.5 transition-all duration-300 ${
                      item.isActive
                        ? 'bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                        : 'bg-gradient-to-tr from-amber-500/80 via-yellow-500/80 to-amber-600/80 shadow-md shadow-amber-500/20 group-hover:scale-105'
                    }`}
                  >
                    <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-amber-400 animate-spin-slow transition-transform" />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-300 mt-0.5 tracking-wider uppercase">
                    {item.label}
                  </span>
                </NavLink>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => soundEngine.playClick()}
              className="flex flex-col items-center justify-center h-full w-full py-1 group transition-all"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    item.isActive
                      ? 'text-violet-400 scale-110 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {item.isActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-violet-400" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight font-medium transition-colors ${
                  item.isActive ? 'text-violet-300 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* Menu (Drawer) Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenMenu();
          }}
          className="flex flex-col items-center justify-center h-full w-full py-1 group transition-all focus:outline-none cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Menu className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
            Menü
          </span>
        </button>
      </div>
    </nav>
  );
};
