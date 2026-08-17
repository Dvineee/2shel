import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { HeroSlide, Banner } from '../../types';
import { Image, Plus, Edit2, Trash2, X, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const BannersManager: React.FC = () => {
  const { heroSlides, banners, refreshAll } = useData();

  // Tab: 'hero' | 'vertical'
  const [activeTab, setActiveTab] = useState<'hero' | 'vertical'>('hero');

  // Hero Modal
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideImage, setSlideImage] = useState('');
  const [slideTargetUrl, setSlideTargetUrl] = useState('');
  const [slideButtonText, setSlideButtonText] = useState('Hemen Katıl');
  const [slideActive, setSlideActive] = useState(true);

  // Vertical Banner Modal
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);
  const [bannerName, setBannerName] = useState('');
  const [bannerPosition, setBannerPosition] = useState<'left' | 'right'>('left');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerTargetUrl, setBannerTargetUrl] = useState('');
  const [bannerActive, setBannerActive] = useState(true);

  const openNewSlide = () => {
    setIsNewSlide(true);
    setEditingSlide({});
    setSlideTitle('Haftalık 500.000 TL Turnuva');
    setSlideSubtitle('Katılmak için giriş yap ve yarışmaya dahil ol!');
    setSlideImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=500&q=80');
    setSlideTargetUrl('/giveaways');
    setSlideButtonText('Hemen Katıl');
    setSlideActive(true);
  };

  const openEditSlide = (s: HeroSlide) => {
    setIsNewSlide(false);
    setEditingSlide(s);
    setSlideTitle(s.title);
    setSlideSubtitle(s.subtitle || '');
    setSlideImage(s.desktop_image);
    setSlideTargetUrl(s.target_url);
    setSlideButtonText(s.button_text || 'Hemen Katıl');
    setSlideActive(s.active);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<HeroSlide> = {
      title: slideTitle,
      subtitle: slideSubtitle,
      desktop_image: slideImage,
      mobile_image: slideImage,
      target_url: slideTargetUrl,
      button_text: slideButtonText,
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

  const openNewBanner = () => {
    setIsNewBanner(true);
    setEditingBanner({});
    setBannerName('Özel VIP Dikey Banner');
    setBannerPosition('left');
    setBannerImage('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&h=800&q=80');
    setBannerTargetUrl('/sponsors');
    setBannerActive(true);
  };

  const openEditBanner = (b: Banner) => {
    setIsNewBanner(false);
    setEditingBanner(b);
    setBannerName(b.name);
    setBannerPosition(b.position as 'left' | 'right');
    setBannerImage(b.image_url);
    setBannerTargetUrl(b.target_url);
    setBannerActive(b.active);
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
        toast.success('Yeni Dikey Banner eklendi!');
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

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Banner & Slider Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hero slider manşetlerini ve yan dikey sponsor reklamlarını yönetin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#120b24] border border-violet-800/30">
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
          <button
            onClick={() => setActiveTab('vertical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vertical'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yan Dikey Bannerlar ({banners.length})
          </button>
        </div>
      </div>

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
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120b24] via-transparent to-black/30" />
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      slide.active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {slide.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{slide.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{slide.subtitle}</p>

                  <div className="mt-4 pt-3 border-t border-violet-900/30 flex items-center justify-between">
                    <span className="text-[11px] text-violet-400 truncate max-w-[200px]">
                      Hedef: {slide.target_url}
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

      {/* VERTICAL BANNERS TAB */}
      {activeTab === 'vertical' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/60 to-purple-950/40 border border-violet-800/40">
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Bilgi:</strong> Sitenizde en az <strong>1 aktif dikey banner</strong> olması yayına girmesi için yeterlidir.
              </span>
            </div>
            <button
              onClick={openNewBanner}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Dikey Reklam Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="rounded-3xl bg-[#120b24] border border-violet-800/30 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase">
                    Konum: {banner.position === 'left' ? 'Sol Banner' : 'Sağ Banner'}
                  </span>
                  <span className="text-[11px] text-amber-300 font-bold">
                    {banner.clicks_count || 0} tık
                  </span>
                </div>

                <div className="h-44 w-full rounded-2xl overflow-hidden bg-violet-950/40 border border-violet-900/30">
                  <img
                    src={banner.image_url}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h4 className="text-xs font-bold text-white truncate">{banner.name}</h4>

                <div className="pt-2 border-t border-violet-900/30 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {banner.target_url}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditBanner(banner)}
                      className="p-2 rounded-xl bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 rounded-xl bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Hero Slide */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-lg w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNewSlide ? 'Yeni Hero Slayt Ekle' : 'Slaytı Düzenle'}
              </h3>
              <button onClick={() => setEditingSlide(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Başlık *</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alt Açıklama</label>
                <input
                  type="text"
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görsel URL *</label>
                <input
                  type="text"
                  required
                  value={slideImage}
                  onChange={(e) => setSlideImage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
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
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Buton Metni</label>
                  <input
                    type="text"
                    value={slideButtonText}
                    onChange={(e) => setSlideButtonText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={slideActive}
                  onChange={(e) => setSlideActive(e.target.checked)}
                />
                Aktif (Yayında Göster)
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Vertical Banner */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNewBanner ? 'Yeni Dikey Banner Ekle' : 'Bannerı Düzenle'}
              </h3>
              <button onClick={() => setEditingBanner(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Banner Başlığı *</label>
                <input
                  type="text"
                  required
                  value={bannerName}
                  onChange={(e) => setBannerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Konum *</label>
                <select
                  value={bannerPosition}
                  onChange={(e) => setBannerPosition(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                >
                  <option value="left">Sol Taraf Dikey Banner</option>
                  <option value="right">Sağ Taraf Dikey Banner</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görsel URL *</label>
                <input
                  type="text"
                  required
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yönlendirme Linki (URL) *</label>
                <input
                  type="text"
                  required
                  value={bannerTargetUrl}
                  onChange={(e) => setBannerTargetUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                />
                Aktif (Yayında Göster)
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
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
