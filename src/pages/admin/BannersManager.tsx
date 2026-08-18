import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { HeroSlide, Banner, BannerPosition } from '../../types';
import { Image, Plus, Edit2, Trash2, X, ExternalLink, Sparkles, Layout, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploadField } from '../../components/common/ImageUploadField';

export const BannersManager: React.FC = () => {
  const { heroSlides, banners, refreshAll } = useData();

  // Tab: 'hero' | 'banners'
  const [activeTab, setActiveTab] = useState<'hero' | 'banners'>('banners');
  const [bannerFilter, setBannerFilter] = useState<'all' | 'left' | 'right' | 'horizontal'>('all');

  // Hero Modal
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideImage, setSlideImage] = useState('');
  const [slideTargetUrl, setSlideTargetUrl] = useState('');
  const [slideButtonText, setSlideButtonText] = useState('Hemen Katıl');
  const [slideActive, setSlideActive] = useState(true);

  // Banner Modal
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);
  const [bannerName, setBannerName] = useState('');
  const [bannerPosition, setBannerPosition] = useState<BannerPosition>('left');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerTargetUrl, setBannerTargetUrl] = useState('');
  const [bannerActive, setBannerActive] = useState(true);

  // Quick Preset Images
  const sampleVerticalImages = [
    { label: 'Marsbahis VIP', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&h=800&q=80' },
    { label: 'Casino Gold', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&h=800&q=80' },
    { label: 'Neon Cyber', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&h=800&q=80' },
    { label: 'Slot Magic', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&h=800&q=80' },
  ];

  const openNewSlide = () => {
    setIsNewSlide(true);
    setEditingSlide({});
    setSlideTitle('');
    setSlideSubtitle('');
    setSlideImage('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&h=500&q=80');
    setSlideTargetUrl('/giveaways');
    setSlideButtonText('');
    setSlideActive(true);
  };

  const openEditSlide = (s: HeroSlide) => {
    setIsNewSlide(false);
    setEditingSlide(s);
    setSlideTitle(s.title || '');
    setSlideSubtitle(s.subtitle || '');
    setSlideImage(s.desktop_image);
    setSlideTargetUrl(s.target_url);
    setSlideButtonText(s.button_text || '');
    setSlideActive(s.active);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<HeroSlide> = {
      title: slideTitle.trim() || undefined,
      subtitle: slideSubtitle.trim() || undefined,
      desktop_image: slideImage.trim(),
      mobile_image: slideImage.trim(),
      target_url: slideTargetUrl.trim() || '/giveaways',
      button_text: slideButtonText.trim() || undefined,
      active: slideActive,
      sort_order: 1,
    };
    try {
      if (isNewSlide) {
        await db.createHeroSlide(data as any);
        toast.success('Yeni Hero Slaytı eklendi!');
      } else if (editingSlide?.id) {
        await db.updateHeroSlide(editingSlide.id, data);
        toast.success('Hero Slaytı güncellendi!');
      }
      setEditingSlide(null);
      await refreshAll();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (window.confirm('Bu slaytı silmek istediğinizden emin misiniz?')) {
      await db.deleteHeroSlide(id);
      toast.success('Slayt silindi');
      await refreshAll();
    }
  };

  const openNewBanner = (positionChoice: BannerPosition = 'left') => {
    setIsNewBanner(true);
    setEditingBanner({});
    setBannerName(positionChoice === 'left' ? 'Sol Taraf VIP Sponsor Reklam' : positionChoice === 'right' ? 'Sağ Taraf VIP Sponsor Reklam' : 'Özel Kampanya Bannerı');
    setBannerPosition(positionChoice);
    setBannerImage(positionChoice === 'left' ? sampleVerticalImages[0].url : sampleVerticalImages[1].url);
    setBannerTargetUrl('https://marsbahis.com');
    setBannerActive(true);
  };

  const openEditBanner = (b: Banner) => {
    setIsNewBanner(false);
    setEditingBanner(b);
    setBannerName(b.name);
    setBannerPosition(b.position || 'left');
    setBannerImage(b.image_url);
    setBannerTargetUrl(b.target_url);
    setBannerActive(b.active !== false);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Banner> = {
      name: bannerName,
      position: bannerPosition,
      image_url: bannerImage,
      target_url: bannerTargetUrl,
      active: bannerActive,
    };
    try {
      if (isNewBanner) {
        await db.createBanner(data as any);
        toast.success('Yeni Banner eklendi!');
      } else if (editingBanner?.id) {
        await db.updateBanner(editingBanner.id, data);
        toast.success('Banner güncellendi!');
      }
      setEditingBanner(null);
      await refreshAll();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Bu bannerı silmek istediğinizden emin misiniz?')) {
      await db.deleteBanner(id);
      toast.success('Banner silindi');
      await refreshAll();
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (bannerFilter === 'left') return b.position === 'left';
    if (bannerFilter === 'right') return b.position === 'right';
    if (bannerFilter === 'horizontal') return b.position === 'home_top' || b.position === 'home_bottom' || b.position === 'top' || b.position === 'bottom';
    return true;
  });

  const getPositionLabel = (pos: string) => {
    if (pos === 'left') return { text: 'Sol Dikey Banner', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' };
    if (pos === 'right') return { text: 'Sağ Dikey Banner', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    if (pos === 'home_top' || pos === 'top') return { text: 'Ana Sayfa Üst Banner', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    if (pos === 'home_bottom' || pos === 'bottom') return { text: 'Ana Sayfa Alt Banner', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    return { text: 'Sol Dikey Banner', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' };
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Banner & Reklam Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Masaüstü sağ ve sol dikey sponsor bannerlarını, manşet slaytlarını ve yatay reklam alanlarını yönetin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#120b24] border border-violet-800/30">
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'banners'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sağ / Sol & Yatay Bannerlar ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hero'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hero Slider ({heroSlides.length})
          </button>
        </div>
      </div>

      {/* BANNERS TAB (RIGHT / LEFT / HORIZONTAL) */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          {/* Top Info Banner & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl bg-gradient-to-r from-violet-950/70 via-[#160d2e] to-purple-950/60 border border-violet-800/40">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  Canlı Görünüm Bilgisi:
                </p>
                <p className="text-[11px] text-slate-300">
                  Sol ve Sağ dikey reklamlar <strong>1280px ve üzeri masaüstü ekranlarda</strong> ekranın her iki yanında sabit (sticky) olarak ziyaretçilere kesintisiz eşlik eder.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openNewBanner('left')}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sol Dikey Ekle</span>
              </button>
              <button
                onClick={() => openNewBanner('right')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sağ Dikey Ekle</span>
              </button>
              <button
                onClick={() => openNewBanner('home_top')}
                className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yatay Banner</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setBannerFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bannerFilter === 'all'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tüm Bannerlar ({banners.length})
            </button>
            <button
              onClick={() => setBannerFilter('left')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bannerFilter === 'left'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sol Dikey Bannerlar ({banners.filter((b) => b.position === 'left').length})
            </button>
            <button
              onClick={() => setBannerFilter('right')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bannerFilter === 'right'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sağ Dikey Bannerlar ({banners.filter((b) => b.position === 'right').length})
            </button>
            <button
              onClick={() => setBannerFilter('horizontal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bannerFilter === 'horizontal'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yatay Bannerlar ({banners.filter((b) => b.position === 'home_top' || b.position === 'home_bottom').length})
            </button>
          </div>

          {/* Banners Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBanners.map((banner) => {
              const posBadge = getPositionLabel(banner.position || 'left');
              return (
                <div
                  key={banner.id}
                  className="rounded-3xl bg-[#120b24] border border-violet-800/30 p-4 flex flex-col justify-between space-y-3 hover:border-violet-600/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${posBadge.color}`}>
                      {posBadge.text}
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold">
                      {banner.clicks_count || 0} tık
                    </span>
                  </div>

                  <div className="h-52 w-full rounded-2xl overflow-hidden bg-violet-950/40 border border-violet-900/30 relative">
                    <img
                      src={banner.image_url}
                      alt={banner.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          banner.active !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {banner.active !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{banner.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {banner.target_url}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-violet-900/30 flex items-center justify-between">
                    <a
                      href={banner.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3 h-3" /> Önizle
                    </a>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditBanner(banner)}
                        className="p-1.5 rounded-xl bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-1.5 rounded-xl bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HERO SLIDER TAB */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openNewSlide}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Hero Slayt Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heroSlides.map((slide) => (
              <div
                key={slide.id}
                className="rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden flex flex-col group"
              >
                <div className="relative h-44 w-full bg-violet-950/40">
                  <img
                    src={slide.desktop_image}
                    alt={slide.title || 'Hero Banner'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120b24] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        slide.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {slide.active ? 'Aktif' : 'Pasif'}
                    </span>
                    {!slide.title && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Yazısız Sade Afiş
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {slide.title || <span className="text-slate-400 italic">Yazısız Görsel Afiş (Sadece Banner)</span>}
                  </h3>
                  {slide.subtitle ? (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{slide.subtitle}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">Yazı içermeyen doğrudan tıklanabilir görsel.</p>
                  )}

                  <div className="mt-4 pt-3 border-t border-violet-900/30 flex items-center justify-between">
                    <span className="text-[11px] text-violet-400 truncate max-w-[200px]">
                      Hedef: {slide.target_url || '/'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditSlide(slide)}
                        className="p-2 rounded-xl bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-2 rounded-xl bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Banner (Left/Right/Horizontal) */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNewBanner ? 'Yeni Reklam Bannerı Ekle' : 'Bannerı Düzenle'}
              </h3>
              <button onClick={() => setEditingBanner(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Banner Adı / Başlığı *</label>
                <input
                  type="text"
                  required
                  value={bannerName}
                  onChange={(e) => setBannerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  placeholder="Örn: Marsbahis VIP Özel Reklam"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yayınlanacağı Konum *</label>
                <select
                  value={bannerPosition}
                  onChange={(e) => setBannerPosition(e.target.value as BannerPosition)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-medium"
                >
                  <option value="left">Sol Taraf Dikey Banner (Masaüstü Sol)</option>
                  <option value="right">Sağ Taraf Dikey Banner (Masaüstü Sağ)</option>
                  <option value="home_top">Ana Sayfa Üst Yatay Banner</option>
                  <option value="home_bottom">Ana Sayfa Alt Yatay Banner</option>
                </select>
                <p className="text-[10px] text-violet-400 mt-1">
                  Sol veya Sağ dikey seçildiğinde sitenin kenarlarında kayan sponsor alanı olarak görüntülenir.
                </p>
              </div>

              <div className="space-y-2">
                <ImageUploadField
                  id="banner-image-upload"
                  label="Banner Görseli"
                  required
                  value={bannerImage}
                  onChange={setBannerImage}
                  helpText="PNG, JPG veya WEBP görseli yükleyin veya URL yapıştırın."
                  aspectHint="Dikey afişler için önerilen oran: 300x800px"
                  maxDimension={1200}
                  previewClassName="h-16 w-12"
                />

                {/* Quick Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">Hızlı Hazır Dikey Görseller:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleVerticalImages.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBannerImage(s.url)}
                        className="px-2 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-800/60 border border-violet-800/30 text-[10px] text-violet-300 cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yönlendirme Linki (Hedef URL) *</label>
                <input
                  type="text"
                  required
                  value={bannerTargetUrl}
                  onChange={(e) => setBannerTargetUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  placeholder="https://sponsorlinki.com veya /sponsors"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <span>Aktif (Sitede Yayında Göster)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer shadow-lg shadow-violet-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Hero Slide */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-lg w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNewSlide ? 'Yeni Hero Slayt Ekle' : 'Slaytı Düzenle'}
              </h3>
              <button onClick={() => setEditingSlide(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-800/30 text-slate-300 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Yazısız Sade Afiş Desteği:
                </p>
                <p className="text-[11px] text-slate-400">
                  Başlık, açıklama ve buton alanlarını boş bırakırsanız manşet alanı tamamen yazısız, temiz görsel afiş olarak yayınlanır ve tıklandığında hedef linke yönlendirir.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Başlık <span className="text-slate-500 font-normal">(İsteğe Bağlı - Yazısız için boş bırakın)</span>
                </label>
                <input
                  type="text"
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600"
                  placeholder="Örn: Haftalık 500.000 TL Turnuva (veya boş)"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alt Açıklama <span className="text-slate-500 font-normal">(İsteğe Bağlı)</span>
                </label>
                <input
                  type="text"
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600"
                  placeholder="Örn: Katılmak için hemen giriş yapın (veya boş)"
                />
              </div>

              <div>
                <ImageUploadField
                  id="hero-slide-image-upload"
                  label="Manşet Afiş Görseli"
                  required
                  value={slideImage}
                  onChange={setSlideImage}
                  helpText="PNG, JPG veya WEBP afiş görseli yükleyin veya URL yapıştırın."
                  aspectHint="Önerilen Boyut: 1400x500px"
                  maxDimension={1600}
                  previewClassName="h-14 w-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hedef Link *</label>
                  <input
                    type="text"
                    required
                    value={slideTargetUrl}
                    onChange={(e) => setSlideTargetUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                    placeholder="/giveaways veya https://..."
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Buton Metni <span className="text-slate-500 font-normal">(İsteğe Bağlı)</span>
                  </label>
                  <input
                    type="text"
                    value={slideButtonText}
                    onChange={(e) => setSlideButtonText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600"
                    placeholder="Örn: Hemen Katıl (veya boş)"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={slideActive}
                  onChange={(e) => setSlideActive(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <span>Aktif (Yayında Göster)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer shadow-lg shadow-violet-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
