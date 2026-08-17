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
} from 'lucide-react';
import { soundEngine } from '../../lib/sound';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { to: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
    { to: '/admin/pages', label: 'Sayfa Yönetimi (Aktif/Pasif)', icon: Layers },
    { to: '/admin/sponsors', label: 'Sponsor Yönetimi', icon: ShieldCheck },
    { to: '/admin/banners', label: 'Banner & Slider', icon: Image },
    { to: '/admin/wheel', label: 'Çark Ödülleri', icon: Disc },
    { to: '/admin/giveaways', label: 'Çekiliş Yönetimi', icon: Gift },
    { to: '/admin/store', label: 'Mağaza Ürünleri', icon: ShoppingBag },
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
                {user.role} Modu
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

