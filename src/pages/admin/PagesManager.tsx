import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import {
  Layers,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  ShieldCheck,
  Disc,
  Gift,
  Trophy,
  ShoppingBag,
  Gamepad2,
  Tv,
  Info,
  Mail,
  Home,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';

interface PageItem {
  key: string;
  name: string;
  path: string;
  settingKey: string;
  category: 'Ana Modüller' | 'Etkinlik & Oyun' | 'Topluluk' | 'Kurumsal';
  icon: React.ElementType;
  description: string;
}

export const PagesManager: React.FC = () => {
  const { settings, updateSettings, refreshAll } = useData();
  const [maintenanceTitle, setMaintenanceTitle] = useState(
    settings.maintenance_title || 'Sayfa Geçici Olarak Bakımdadır'
  );
  const [maintenanceDesc, setMaintenanceDesc] = useState(
    settings.maintenance_description ||
      'Yöneticilerimiz bu sayfayı güncelliyor. Lütfen kısa bir süre sonra tekrar ziyaret ediniz.'
  );
  const [isSaving, setIsSaving] = useState(false);

  const pages: PageItem[] = [
    {
      key: 'sponsors',
      name: 'Sponsorlar & Bonuslar',
      path: '/sponsors',
      settingKey: 'page_sponsors_enabled',
      category: 'Ana Modüller',
      icon: ShieldCheck,
      description: 'Sponsor listesi, bonus filtreleme ve detaylı inceleme sayfaları.',
    },
    {
      key: 'wheel',
      name: 'Günlük Çark',
      path: '/wheel',
      settingKey: 'page_wheel_enabled',
      category: 'Etkinlik & Oyun',
      icon: Disc,
      description: 'Kullanıcıların her gün ücretsiz coin ve özel ödüller çevirdiği çark sayfası.',
    },
    {
      key: 'giveaways',
      name: 'Ödüllü Çekilişler',
      path: '/giveaways',
      settingKey: 'page_giveaways_enabled',
      category: 'Etkinlik & Oyun',
      icon: Gift,
      description: 'Nakit ve hediye çekilişleri, katılım formu ve kazanan listeleri.',
    },
    {
      key: 'leaderboard',
      name: 'Liderlik Tablosu',
      path: '/leaderboard',
      settingKey: 'page_leaderboard_enabled',
      category: 'Topluluk',
      icon: Trophy,
      description: 'En yüksek coin sahipleri, haftalık ve aylık liderler sıralaması.',
    },
    {
      key: 'store',
      name: 'Coin Ödül Mağazası',
      path: '/store',
      settingKey: 'page_store_enabled',
      category: 'Topluluk',
      icon: ShoppingBag,
      description: 'Coinlerle satın alınabilen hediyeler, nakit kodlar ve teslimat takibi.',
    },
    {
      key: 'games',
      name: 'Oyun Seçici & Demo',
      path: '/games',
      settingKey: 'page_games_enabled',
      category: 'Etkinlik & Oyun',
      icon: Gamepad2,
      description: 'Popüler slot ve masa oyunları seçici ve tavsiye modülü.',
    },
    {
      key: 'live',
      name: 'Canlı Maç & TV',
      path: '/live',
      settingKey: 'page_live_enabled',
      category: 'Etkinlik & Oyun',
      icon: Tv,
      description: 'Canlı maç yayınları, spor kanalları ve günün maçları rehberi.',
    },
    {
      key: 'about',
      name: 'Hakkımızda',
      path: '/about',
      settingKey: 'page_about_enabled',
      category: 'Kurumsal',
      icon: Info,
      description: 'Platform vizyonu, topluluk ilkeleri ve rehberlik metinleri.',
    },
    {
      key: 'contact',
      name: 'İletişim & Reklam',
      path: '/contact',
      settingKey: 'page_contact_enabled',
      category: 'Kurumsal',
      icon: Mail,
      description: 'Sponsorluk teklifleri, iletişim formu ve resmi Telegram destek kanalları.',
    },
  ];

  const handleTogglePage = async (settingKey: string, currentStatus: boolean, pageName: string) => {
    soundEngine.playClick();
    const newStatus = !currentStatus;
    try {
      await updateSettings({ [settingKey]: newStatus });
      await db.logAdminAction(
        newStatus ? `Sayfa Aktifleştirildi: ${pageName}` : `Sayfa Pasife Alındı: ${pageName}`,
        'pages',
        settingKey,
        { status: newStatus }
      );
      toast.success(
        `${pageName} sayfası ${newStatus ? 'AKTİF edildi' : 'PASİF (Bakım) moduna alındı'}!`
      );
    } catch (err) {
      console.error(err);
      toast.error('Sayfa durumu güncellenirken bir hata oluştu');
    }
  };

  const handleSaveMaintenanceText = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        maintenance_title: maintenanceTitle,
        maintenance_description: maintenanceDesc,
      });
      await db.logAdminAction('Bakım Modu Mesajları Güncellendi', 'settings');
      toast.success('Bakım modu bildirim metinleri başarıyla kaydedildi!');
    } catch {
      toast.error('Kayıt başarısız oldu.');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['Ana Modüller', 'Etkinlik & Oyun', 'Topluluk', 'Kurumsal'] as const;

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-violet-400" />
            Sayfa Yönetimi & Aktif/Pasif Kontrolü
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Web sitesindeki tüm sayfaları tek dokunuşla yayına alabilir veya bakım moduna geçirebilirsiniz.
          </p>
        </div>

        <button
          onClick={async () => {
            soundEngine.playClick();
            await refreshAll();
            toast.success('Sayfa durumları yenilendi');
          }}
          className="px-4 py-2 rounded-xl bg-violet-950/50 hover:bg-violet-900/60 border border-violet-800/40 text-violet-300 text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Yenile</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#120b24] border border-violet-800/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold">Toplam Modül</span>
            <p className="text-xl font-black text-white">{pages.length} Sayfa</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#120b24] border border-emerald-800/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold">Yayındaki Sayfalar</span>
            <p className="text-xl font-black text-emerald-400">
              {pages.filter((p) => (settings as any)[p.settingKey] !== false).length} Aktif
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#120b24] border border-amber-800/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold">Bakımdaki Sayfalar</span>
            <p className="text-xl font-black text-amber-400">
              {pages.filter((p) => (settings as any)[p.settingKey] === false).length} Pasif
            </p>
          </div>
        </div>
      </div>

      {/* Pages Grid by Category */}
      {categories.map((cat) => {
        const catPages = pages.filter((p) => p.category === cat);
        if (catPages.length === 0) return null;

        return (
          <div key={cat} className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-violet-400 px-1">
              {cat}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catPages.map((page) => {
                const Icon = page.icon;
                const isEnabled = (settings as any)[page.settingKey] !== false;

                return (
                  <div
                    key={page.key}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      isEnabled
                        ? 'bg-[#120b24] border-violet-800/40 shadow-lg'
                        : 'bg-[#0f0b1a]/70 border-amber-500/30 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isEnabled
                              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white">{page.name}</h3>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {isEnabled ? '● YAYINDA (AKTİF)' : '○ BAKIMDA (PASİF)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {page.description}
                          </p>
                          <span className="text-[11px] font-mono text-slate-500 mt-1 inline-block">
                            URL: {page.path}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-violet-900/30">
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-400 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Sayfayı Önizle</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {/* Live Toggle Switch */}
                      <button
                        onClick={() => handleTogglePage(page.settingKey, isEnabled, page.name)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow cursor-pointer active:scale-95 ${
                          isEnabled
                            ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Yayını Durdur (Pasif Yap)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-amber-400" />
                            <span>Yayına Al (Aktifleştir)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Customizable Maintenance Screen Message Form */}
      <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
        <div className="flex items-center gap-3 border-b border-violet-900/30 pb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Bakım Modu Ekranı Metin Özelleştirmesi
            </h3>
            <p className="text-xs text-slate-400">
              Pasife alınan bir sayfaya giren ziyaretçilere gösterilecek başlık ve bilgilendirme yazısı.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveMaintenanceText} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Bakım Başlığı
            </label>
            <input
              type="text"
              value={maintenanceTitle}
              onChange={(e) => setMaintenanceTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
              placeholder="Örn: Sayfa Geçici Olarak Bakımdadır"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Bakım Açıklama Metni
            </label>
            <textarea
              rows={2}
              value={maintenanceDesc}
              onChange={(e) => setMaintenanceDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
              placeholder="Ziyaretçilere gösterilecek açıklama..."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Bakım Metinlerini Kaydet'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
