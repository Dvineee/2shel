import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { formatCoin } from '../lib/utils';
import {
  Coins,
  LogOut,
  Disc,
  Send,
  Megaphone,
  ExternalLink,
  Sparkles,
  Crown,
  Trophy,
  Flame,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { soundEngine } from '../lib/sound';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-900/30 border border-violet-700/40 flex items-center justify-center text-violet-400 mx-auto mb-3">
          <UserCheck className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-white mb-1">Oturum Açılmadı</p>
        <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
          Profilinizi görüntülemek ve ödüllerinizi yönetmek için lütfen giriş yapın.
        </p>
        <NavLink
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-violet-900/40"
        >
          Giriş Yap
        </NavLink>
      </div>
    );
  }

  const telegramChannelUrl =
    settings.telegram_channel_url ||
    settings.telegram_url ||
    'https://t.me/ShelbyOnline';

  const fullName = [user.telegram_first_name, user.telegram_last_name].filter(Boolean).join(' ');
  const displayTitle = fullName || (user.telegram_username ? `@${user.telegram_username}` : user.username);
  const isSuperAdmin = user.role === 'super_admin' || user.role === 'admin';

  const handleLogout = () => {
    soundEngine.playClick();
    logout();
    navigate('/');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 space-y-3 sm:space-y-4 pb-20 sm:pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card - VIP Telegram Member Profile */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-950/80 via-[#120b24] to-[#090518] border border-violet-700/40 shadow-xl relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#24A1DE]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={user.avatar_url}
                alt={displayTitle}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 sm:border-3 border-[#24A1DE] shadow-xl object-cover bg-violet-950"
                referrerPolicy="no-referrer"
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#24A1DE] border-2 border-[#120b24] flex items-center justify-center text-white shadow-lg"
                title="Telegram Doğrulanmış Hesap"
              >
                <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white -translate-x-0.5 translate-y-0.5" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-white truncate max-w-[200px] sm:max-w-none">
                  {displayTitle}
                </h1>
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 uppercase text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    <Crown className="w-3 h-3 text-amber-400" />
                    SÜPER YÖNETİCİ
                  </span>
                ) : (
                  <span className="uppercase text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#24A1DE]/20 text-cyan-300 border border-[#24A1DE]/30 shrink-0">
                    DOĞRULANMIŞ ÜYE
                  </span>
                )}
              </div>

              {/* Telegram Handle & Status */}
              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                {user.telegram_username && (
                  <a
                    href={`https://t.me/${user.telegram_username.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs sm:text-sm text-[#24A1DE] hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline transition-all"
                  >
                    <Send className="w-3 h-3 shrink-0 fill-[#24A1DE]" />
                    @{user.telegram_username.replace('@', '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleLogout}
              className="py-2 px-3.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
              title="Oturumu Kapat"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid - 3 Columns */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {/* Coin Balance */}
        <NavLink
          to="/store"
          onClick={() => soundEngine.playClick()}
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0e0820] border border-amber-500/30 hover:border-amber-500/60 transition-all text-center flex flex-col items-center justify-center group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Coins className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[11px] text-slate-400 font-semibold leading-tight">Toplam Bakiye</span>
          <p className="text-xs sm:text-lg font-black text-amber-300 font-mono mt-0.5 truncate w-full">
            {formatCoin(user.coin_balance)}
          </p>
        </NavLink>

        {/* Daily Wheel */}
        <NavLink
          to="/wheel"
          onClick={() => soundEngine.playClick()}
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0e0820] border border-violet-800/40 hover:border-violet-600/60 transition-all text-center flex flex-col items-center justify-center group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Disc className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[11px] text-slate-400 font-semibold leading-tight">Günlük Çark</span>
          <p className="text-xs sm:text-sm font-bold text-white mt-0.5">Ücretsiz Hak</p>
        </NavLink>

        {/* Giveaways */}
        <NavLink
          to="/giveaways"
          onClick={() => soundEngine.playClick()}
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0e0820] border border-emerald-800/40 hover:border-emerald-600/60 transition-all text-center flex flex-col items-center justify-center group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[11px] text-slate-400 font-semibold leading-tight">Çekilişler</span>
          <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">Katıl & Kazan</p>
        </NavLink>
      </div>

      {/* 4. Quick Actions Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <NavLink
          to="/wheel"
          onClick={() => soundEngine.playClick()}
          className="p-3 rounded-xl bg-gradient-to-r from-violet-900/40 to-indigo-900/40 hover:from-violet-900/60 hover:to-indigo-900/60 border border-violet-700/40 text-white flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center shrink-0">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Günlük Çark Çevir</p>
              <p className="text-[10px] text-slate-400">Günün ücretsiz ödülünü hemen kap</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
        </NavLink>

        <NavLink
          to="/store"
          onClick={() => soundEngine.playClick()}
          className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 to-orange-950/40 hover:from-amber-950/60 hover:to-orange-950/60 border border-amber-700/40 text-white flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-300 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Coin Mağazası</p>
              <p className="text-[10px] text-slate-400">Coinlerini nakit & bonus koduna çevir</p>
            </div>
          </div>
          <Flame className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
        </NavLink>
      </div>

      {/* 5. Telegram Announcement Channel Banner */}
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0a1324] via-[#100c22] to-[#070510] border border-[#24A1DE]/40 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#24A1DE] to-blue-600 flex items-center justify-center text-white shadow shadow-[#24A1DE]/30 shrink-0">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-white">
                  Resmi Duyuru & Çekiliş Kanalı
                </h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Ödüllü Kodlar
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                Haftalık nakit turnuva sonuçları ve anlık bonus kodları için duyuru kanalımıza katılın.
              </p>
            </div>
          </div>

          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundEngine.playClick()}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#24A1DE] via-[#0088cc] to-[#1e88e5] hover:from-[#1e88e5] text-white text-xs font-bold shadow-md shadow-[#24A1DE]/25 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 fill-white -translate-x-0.5 shrink-0" />
            <span>Kanala Katıl</span>
            <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
