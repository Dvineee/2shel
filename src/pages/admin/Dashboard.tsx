import React from 'react';
import { useData } from '../../context/DataContext';
import { getStoredSupabaseConfig } from '../../lib/supabase';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Image,
  Gift,
  ShoppingBag,
  MousePointerClick,
  Database,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { formatCoin } from '../../lib/utils';

export const AdminDashboard: React.FC = () => {
  const { sponsors, banners, heroSlides, giveaways, storeProducts, wheelRewards } = useData();

  const totalClicks = sponsors.reduce((acc, s) => acc + (s.clicks_count || 0), 0);

  const kpis = [
    {
      title: 'Kayıtlı Sponsorlar',
      value: sponsors.length,
      sub: `${sponsors.filter((s) => s.active).length} tanesi yayında`,
      icon: ShieldCheck,
      color: 'from-violet-600 to-purple-600',
      to: '/admin/sponsors',
    },
    {
      title: 'Toplam Sponsor Tıklaması',
      value: totalClicks,
      sub: 'Tüm zamanlar tekil/toplam yönlendirme',
      icon: MousePointerClick,
      color: 'from-emerald-500 to-teal-600',
      to: '/admin/sponsors',
    },
    {
      title: 'Banner & Sliderlar',
      value: banners.length + heroSlides.length,
      sub: `${heroSlides.length} Hero, ${banners.length} Dikey Reklam`,
      icon: Image,
      color: 'from-blue-600 to-indigo-600',
      to: '/admin/banners',
    },
    {
      title: 'Aktif Çekilişler',
      value: giveaways.length,
      sub: `${giveaways.reduce((acc, g) => acc + (g.entries_count || 0), 0)} toplam katılım`,
      icon: Gift,
      color: 'from-pink-600 to-rose-600',
      to: '/admin/giveaways',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner / System Status */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Yönetim Paneli & Genel Durum</h1>
          <p className="text-xs text-slate-400 mt-1">
            İçerikleri anında düzenleyin, ekleyin veya kaldırın. Tüm değişiklikler anında web sitesine yansır.
          </p>
        </div>

        <NavLink
          to="/admin/settings"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-violet-950/80 hover:bg-violet-900 border border-violet-700/40 hover:border-violet-500/50 text-xs transition-all shadow-md group"
          title="Veritabanı detayları ve tanı merkezini aç"
        >
          <Database className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-300">Veritabanı:</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {getStoredSupabaseConfig().isConfigured ? 'Supabase Bulut Aktif' : 'Dinamik Depolama (Local DB)'}
          </span>
        </NavLink>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <NavLink
              key={idx}
              to={kpi.to}
              className="p-5 rounded-3xl bg-[#120b24] border border-violet-800/30 hover:border-violet-500/50 p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-2xl font-black text-white group-hover:text-violet-300 transition-colors">
                  {kpi.value}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Sponsors Quick View */}
        <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              Sponsorlar & Tıklamalar
            </h3>
            <NavLink to="/admin/sponsors" className="text-xs text-violet-400 font-bold hover:underline">
              Yönet →
            </NavLink>
          </div>

          <div className="space-y-2.5">
            {sponsors.slice(0, 5).map((sponsor) => (
              <div
                key={sponsor.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-violet-950/30 border border-violet-900/30 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="w-8 h-8 rounded-lg object-contain bg-violet-950 p-1"
                  />
                  <span className="font-bold text-white">{sponsor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-300 font-bold">
                    {sponsor.clicks_count || 0} tık
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sponsor.active ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Yönetim İpuçları
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="p-3 rounded-2xl bg-violet-950/30 border border-violet-900/30">
              📌 <b>Sıralama Değiştirme:</b> Sponsorlar sayfasında <code className="text-violet-300">sort_order</code> alanına 1, 2, 3 vererek ana sayfada en başta çıkmasını sağlayabilirsiniz.
            </li>
            <li className="p-3 rounded-2xl bg-violet-950/30 border border-violet-900/30">
              🎯 <b>Dikey Bannerlar:</b> Dikey reklamlar 2560x1440 ve geniş ekranlarda sol ve sağ tarafta sabit şekilde gösterilir.
            </li>
            <li className="p-3 rounded-2xl bg-violet-950/30 border border-violet-900/30">
              🎁 <b>Çark Oranları:</b> Çark yönetiminden her ödülün kazanma ihtimalini yüzde (%) olarak ayarlayabilirsiniz.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
