import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Crown, ShieldCheck, Send, Twitter, Instagram, Mail, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useData();

  return (
    <footer className="mt-16 border-t border-violet-900/30 bg-[#070510] text-slate-400 text-xs">
      {/* 18+ and Responsible Gaming Banner */}
      <div className="border-b border-violet-900/20 bg-violet-950/20 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-center text-[11px] text-amber-300/80">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-5 h-5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-[10px]">
              18+
            </span>
            <span>Yalnızca 18 yaşından büyük yetişkinler içindir.</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Kumar bağımlılık yapabilir. Lütfen sorumlu ve bütçenize göre oynayınız.</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Description */}
        <div className="space-y-3 md:col-span-1">
          <NavLink to="/" className="flex items-center space-x-2.5">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name || 'Logo'}
                className="h-8 max-w-[160px] object-contain"
              />
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white tracking-wider">
                  {settings.site_name || 'SHELBYONLINE'}
                </span>
              </>
            )}
          </NavLink>
          <p className="text-slate-400 text-xs leading-relaxed">
            {settings.footer_text ||
              'ShelbyOnline, doğrulanmış güvenilir sponsorlar, özel promosyonlar, günlük hediye çarkı ve topluluk çekilişleri.'}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
            Hızlı Menü
          </h4>
          <ul className="space-y-2">
            {settings.page_sponsors_enabled !== false && (
              <li>
                <NavLink to="/sponsors" className="hover:text-violet-300 transition-colors">
                  Tüm Sponsorlar
                </NavLink>
              </li>
            )}
            {settings.page_wheel_enabled !== false && (
              <li>
                <NavLink to="/wheel" className="hover:text-violet-300 transition-colors">
                  Günlük Şans Çarkı
                </NavLink>
              </li>
            )}
            {settings.page_giveaways_enabled !== false && (
              <li>
                <NavLink to="/giveaways" className="hover:text-violet-300 transition-colors">
                  Ödüllü Çekilişler
                </NavLink>
              </li>
            )}
            {settings.page_store_enabled !== false && (
              <li>
                <NavLink to="/store" className="hover:text-violet-300 transition-colors">
                  Coin Mağazası
                </NavLink>
              </li>
            )}
            {settings.page_leaderboard_enabled !== false && (
              <li>
                <NavLink to="/leaderboard" className="hover:text-violet-300 transition-colors">
                  Leaderboard
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* Corporate & Information */}
        <div>
          <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
            Kurumsal & Bilgi
          </h4>
          <ul className="space-y-2">
            {settings.page_about_enabled !== false && (
              <li>
                <NavLink to="/about" className="hover:text-violet-300 transition-colors">
                  Hakkımızda
                </NavLink>
              </li>
            )}
            {settings.page_contact_enabled !== false && (
              <li>
                <NavLink to="/contact" className="hover:text-violet-300 transition-colors">
                  İletişim & Reklam
                </NavLink>
              </li>
            )}
            {settings.page_live_enabled !== false && (
              <li>
                <NavLink to="/live" className="hover:text-violet-300 transition-colors">
                  Canlı Maç TV
                </NavLink>
              </li>
            )}
            {settings.page_games_enabled !== false && (
              <li>
                <NavLink to="/games" className="hover:text-violet-300 transition-colors">
                  Oyun Seçici
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* Community & Socials */}
        <div>
          <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
            Topluluk & İletişim
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {settings.telegram_chat_url && (
              <a
                href={settings.telegram_chat_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-800/30 transition-colors"
                title="Telegram VIP Sohbet"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
            {settings.twitter_url && (
              <a
                href={settings.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-800/30 transition-colors"
                title="X / Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-800/30 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Destek: <span className="text-violet-300 font-semibold">{settings.support_email}</span>
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-violet-900/20 py-4 text-center text-[11px] text-slate-500">
        © 2026 {settings.site_name || 'ShelbyOnline'}. Tüm hakları saklıdır.
      </div>
    </footer>
  );
};
