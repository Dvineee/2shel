import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ShieldCheck,
  Tv,
  Disc,
  Gift,
  Trophy,
  ShoppingBag,
  Gamepad2,
  Info,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Crown,
  X,
  Flame,
  User,
  LogOut,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { soundEngine } from '../../lib/sound';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  highlight?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { isEditor, user, logout } = useAuth();
  const { settings } = useData();
  const location = useLocation();

  // Close mobile drawer on route navigation
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  }, [location.pathname]);

  const isPageEnabled = (to: string) => {
    if (to === '/') return true;
    if (to === '/admin' || to.startsWith('/admin/')) return true;
    if (to.startsWith('/sponsors') || to.startsWith('/site')) return settings.page_sponsors_enabled !== false;
    if (to === '/wheel' || to === '/reward-wheel') return settings.page_wheel_enabled !== false;
    if (to.startsWith('/giveaways')) return settings.page_giveaways_enabled !== false;
    if (to === '/leaderboard') return settings.page_leaderboard_enabled !== false;
    if (to === '/store') return settings.page_store_enabled !== false;
    if (to === '/games') return settings.page_games_enabled !== false;
    if (to === '/live') return settings.page_live_enabled !== false;
    if (to === '/about') return settings.page_about_enabled !== false;
    if (to === '/contact') return settings.page_contact_enabled !== false;
    return true;
  };

  const rawMenuSections: MenuSection[] = [
    {
      title: 'KEŞFET',
      items: [
        { label: 'Ana Sayfa', to: '/', icon: Home, exact: true },
        { label: 'Sponsorlar', to: '/sponsors', icon: ShieldCheck, badge: 'VIP', badgeColor: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40' },
      ],
    },
    {
      title: 'ETKİNLİKLER & KAZANÇ',
      items: [
        { label: 'Günlük Çark', to: '/wheel', icon: Disc, highlight: true, badge: 'ÜCRETSİZ', badgeColor: 'from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/40' },
        { label: 'Çekilişler', to: '/giveaways', icon: Gift },
        { label: 'Canlı TV', to: '/live', icon: Tv },
      ],
    },
    {
      title: 'TOPLULUK & MAĞAZA',
      items: [
        { label: 'Liderlik Tablosu', to: '/leaderboard', icon: Trophy },
        { label: 'Ödül Mağazası', to: '/store', icon: ShoppingBag },
        { label: 'Oyun Seçici', to: '/games', icon: Gamepad2 },
      ],
    },
    {
      title: 'BİLGİ & DESTEK',
      items: [
        { label: 'Hakkımızda', to: '/about', icon: Info },
        { label: 'İletişim & Reklam', to: '/contact', icon: Mail },
      ],
    },
  ];

  if (isEditor) {
    rawMenuSections.push({
      title: 'YÖNETİM',
      items: [
        { label: 'Admin Paneli', to: '/admin', icon: LayoutDashboard, badge: 'CMS', badgeColor: 'from-purple-500/30 to-indigo-500/30 text-purple-200 border-purple-400/40' },
      ],
    });
  }

  const menuSections = rawMenuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isPageEnabled(item.to)),
    }))
    .filter((section) => section.items.length > 0);

  const renderContent = (forMobile = false) => {
    const collapsed = !forMobile && isCollapsed;

    return (
      <div className="h-full flex flex-col justify-between bg-[#0b0816] text-slate-200 select-none overflow-hidden">
        {/* Top Header / Brand Logo */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-violet-900/25 bg-[#0e0a1c]/60">
            {!collapsed ? (
              <NavLink
                to="/"
                onClick={() => soundEngine.playClick()}
                className="flex items-center gap-3 group overflow-hidden"
              >
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.site_name || 'Logo'}
                    className="h-9 max-w-[180px] object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform shrink-0">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-black tracking-wider text-base bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-violet-300 truncate">
                        {settings.site_name || 'SHELBYONLINE'}
                      </span>
                      <span className="text-[9px] tracking-widest text-violet-400 font-bold uppercase truncate">
                        {settings.logo_tagline || 'PREMIUM SPONSOR NETWORK'}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            ) : (
              <NavLink
                to="/"
                onClick={() => soundEngine.playClick()}
                className="mx-auto flex items-center justify-center"
                title={settings.site_name || 'SHELBYONLINE'}
              >
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.site_name || 'Logo'}
                    className="w-8 h-8 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                )}
              </NavLink>
            )}

            {/* Close Button on Mobile, Collapse Button on Desktop */}
            {forMobile ? (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-2 rounded-xl bg-violet-950/60 text-slate-400 hover:text-white border border-violet-800/40"
                aria-label="Menüyü Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  if (onToggleCollapse) onToggleCollapse();
                }}
                className="hidden lg:flex p-1.5 rounded-xl bg-violet-950/40 hover:bg-violet-800/50 text-violet-300 hover:text-white transition-colors border border-violet-800/30"
                title={collapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="py-4 px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-extrabold tracking-wider text-violet-400/60 uppercase">
                    {section.title}
                  </div>
                )}

                {section.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={iIdx}
                      to={item.to}
                      end={item.exact}
                      onClick={() => soundEngine.playClick()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-900/40 border border-violet-400/30 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-violet-950/50 border border-transparent'
                        } ${collapsed ? 'justify-center px-2' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          item.highlight ? 'text-amber-400' : ''
                        }`}
                      />

                      {!collapsed && <span className="truncate flex-1">{item.label}</span>}

                      {!collapsed && item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-md border bg-gradient-to-r ${
                            item.badgeColor || 'from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {collapsed && item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0b0816]"></span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-violet-900/25 bg-[#0e0a1c]/60">
          {user ? (
            !collapsed ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-violet-950/40 border border-violet-800/30">
                <NavLink
                  to="/profile"
                  onClick={() => soundEngine.playClick()}
                  className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border border-violet-500/40 object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-200 truncate">{user.username}</span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {user.coin_balance || 0} COIN
                    </span>
                  </div>
                </NavLink>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    logout();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/profile"
                onClick={() => soundEngine.playClick()}
                className="flex items-center justify-center py-1"
                title="Profilim"
              >
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-violet-500/40 object-cover"
                />
              </NavLink>
            )
          ) : !collapsed ? (
            <NavLink
              to="/login"
              onClick={() => soundEngine.playClick()}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#24A1DE] to-sky-600 hover:from-[#1e88e5] hover:to-sky-500 shadow-md shadow-sky-700/30 transition-all"
            >
              <Send className="w-3.5 h-3.5 fill-current" />
              Telegram Girişi
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              onClick={() => soundEngine.playClick()}
              className="flex items-center justify-center p-2 rounded-xl bg-[#24A1DE] text-white"
              title="Telegram ile Giriş Yap"
            >
              <Send className="w-4 h-4 fill-current" />
            </NavLink>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 border-r border-violet-900/25 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 max-w-[280px] w-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
