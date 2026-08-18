import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShieldCheck,
  Image,
  Disc,
  Gift,
  ShoppingBag,
  Settings,
  ArrowLeft,
  Crown,
  Layers,
  FileText,
  Users,
} from 'lucide-react';
import { soundEngine } from '../../lib/sound';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070510] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070510] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#120b24] border border-violet-800/40 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Yönetici Girişi Gerekli</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Yönetim paneline erişmek için yetkili bir yönetici hesabıyla (Örn: <strong>@kajju66</strong> veya yönetici hesabı) giriş yapmanız gerekmektedir.
          </p>
          <div className="flex gap-3 pt-2">
            <NavLink
              to="/login"
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center justify-center"
            >
              Giriş Yap
            </NavLink>
            <NavLink
              to="/"
              className="flex-1 py-2.5 rounded-xl bg-violet-950/60 border border-violet-800/40 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center"
            >
              Ana Sayfa
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { to: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Kullanıcılar & Yetkiler', icon: Users },
    { to: '/admin/pages', label: 'Sayfa Yönetimi (Aktif/Pasif)', icon: Layers },
    { to: '/admin/sponsors', label: 'Sponsor Yönetimi', icon: ShieldCheck },
    { to: '/admin/banners', label: 'Banner & Slider', icon: Image },
    { to: '/admin/wheel', label: 'Çark Ödülleri', icon: Disc },
    { to: '/admin/giveaways', label: 'Çekiliş Yönetimi', icon: Gift },
    { to: '/admin/store', label: 'Mağaza & Siparişler', icon: ShoppingBag },
    { to: '/admin/settings', label: 'Site Ayarları & Sosyal', icon: Settings },
    { to: '/admin/logs', label: 'Sistem & Güvenlik Logları', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#070510] text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#0d0918] border-r border-violet-900/30 flex flex-col flex-shrink-0">
        {/* Admin Brand */}
        <div className="p-5 border-b border-violet-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">YÖNETİM PANELİ</span>
              <span className="block text-[10px] text-violet-400 font-bold uppercase">
                {user?.role || 'admin'} Modu
              </span>
            </div>
          </div>
        </div>

        {/* Admin Nav */}
        <nav className="p-3 space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => soundEngine.playClick()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-violet-950/40'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Back to Public Site */}
        <div className="p-4 border-t border-violet-900/30">
          <NavLink
            to="/"
            onClick={() => soundEngine.playClick()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/40 border border-violet-800/30 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Siteye Geri Dön</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Admin Content Stage */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};

