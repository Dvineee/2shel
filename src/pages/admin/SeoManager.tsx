import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import {
  Globe,
  Share2,
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  MessageSquare,
  Search,
  Layers,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';
import { initialSiteSettings } from '../../lib/initialData';

export const SeoManager: React.FC = () => {
  const { settings, refreshAll, updateSettings } = useData();

  // SEO Form State
  const [siteName, setSiteName] = useState(settings.site_name || 'Shelby Online');
  const [siteTitle, setSiteTitle] = useState(settings.site_title || 'Shelby Online | Güncel Kampanyalar');
  const [metaDescription, setMetaDescription] = useState(
    settings.meta_description || settings.site_description || 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.'
  );
  const [ogTitle, setOgTitle] = useState(settings.og_title || settings.site_title || 'Shelby Online | Güncel Kampanyalar');
  const [ogDescription, setOgDescription] = useState(
    settings.og_description || settings.meta_description || settings.site_description || 'En güncel kampanyaları ve bonusları keşfet.'
  );
  const [ogImage, setOgImage] = useState(
    settings.og_image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=630&q=80'
  );
  const [ogUrl, setOgUrl] = useState(settings.og_url || 'https://shelbyonline.com');
  const [ogSiteName, setOgSiteName] = useState(settings.og_site_name || settings.site_name || 'Shelby Online');
  const [faviconUrl, setFaviconUrl] = useState(settings.favicon_url || '');
  const [twitterCard, setTwitterCard] = useState(settings.twitter_card || 'summary_large_image');

  // Preview tab simulator state: 'telegram' | 'whatsapp' | 'discord' | 'google'
  const [previewPlatform, setPreviewPlatform] = useState<'telegram' | 'whatsapp' | 'discord' | 'google'>('telegram');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeServerSeo, setActiveServerSeo] = useState<any>(null);

  // Sync state when context settings load
  useEffect(() => {
    if (settings) {
      setSiteName(settings.site_name || 'Shelby Online');
      setSiteTitle(settings.site_title || 'Shelby Online');
      setMetaDescription(
        settings.meta_description || settings.site_description || 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.'
      );
      setOgTitle(settings.og_title || settings.site_title || 'Shelby Online | Güncel Kampanyalar');
      setOgDescription(
        settings.og_description || settings.meta_description || 'En güncel kampanyaları ve bonusları keşfet.'
      );
      setOgImage(
        settings.og_image ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=630&q=80'
      );
      setOgUrl(settings.og_url || 'https://shelbyonline.com');
      setOgSiteName(settings.og_site_name || settings.site_name || 'Shelby Online');
      setFaviconUrl(settings.favicon_url || '');
      setTwitterCard(settings.twitter_card || 'summary_large_image');
    }
  }, [settings]);

  // Fetch current server SEO status
  const fetchCurrentServerSeo = async () => {
    try {
      setIsTesting(true);
      const res = await fetch('/api/seo/current');
      if (res.ok) {
        const data = await res.json();
        setActiveServerSeo(data.settings || data.preview);
        toast.success('Sunucudaki canlı SEO bilgileri kontrol edildi.');
      }
    } catch {
      toast.error('Sunucu durumuna ulaşılamadı.');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    fetchCurrentServerSeo();
  }, []);

  // Quick Preset Handlers
  const handleApplyPreset = (type: 'default' | 'campaign' | 'vip') => {
    soundEngine.playClick();
    if (type === 'default') {
      setSiteName('Shelby Online');
      setSiteTitle('Shelby Online');
      setMetaDescription('Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.');
      setOgTitle('Shelby Online | Güncel Kampanyalar');
      setOgDescription('En güncel kampanyaları ve bonusları keşfet.');
      setOgUrl('https://shelbyonline.com');
      setOgSiteName('Shelby Online');
      setOgImage('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=630&q=80');
      toast.info('Varsayılan SEO şablonu uygulandı.');
    } else if (type === 'campaign') {
      setSiteName('Shelby Online');
      setSiteTitle('Shelby Online | Bonus & Kampanya Ağı');
      setMetaDescription('Doğrulanmış resmi sponsorlar, özel yatırım ve deneme bonusları, hediye çarkı ve ödüllü çekilişler.');
      setOgTitle('Shelby Online | Özel Yatırım & Deneme Bonusları');
      setOgDescription('Doğrulanmış sponsorlar, anında çekim garantisi ve günlük ücretsiz çark çevirme hakkı!');
      setOgImage('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=630&q=80');
      toast.info('Kampanya & Bonus SEO şablonu uygulandı.');
    } else if (type === 'vip') {
      setSiteName('Shelby Online');
      setSiteTitle('Shelby Online VIP | Özel Sponsor & Ödül Platformu');
      setMetaDescription('VIP üyeler için özel etkinlikler, nakit ödüllü çekilişler ve limitsiz bonus oranları.');
      setOgTitle('Shelby Online VIP Kulübü');
      setOgDescription('En prestijli sponsorlar ve VIP üyelere özel haftalık büyük ödüllü çekilişler.');
      setOgImage('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&h=630&q=80');
      toast.info('VIP Prestij SEO şablonu uygulandı.');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    soundEngine.playClick();

    try {
      const payload = {
        site_name: siteName.trim() || 'Shelby Online',
        site_title: siteTitle.trim() || 'Shelby Online',
        meta_description: metaDescription.trim() || 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.',
        site_description: metaDescription.trim() || 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.',
        og_title: ogTitle.trim() || siteTitle.trim() || 'Shelby Online',
        og_description: ogDescription.trim() || metaDescription.trim() || 'En güncel kampanyaları keşfet.',
        og_image: ogImage.trim(),
        og_url: ogUrl.trim() || 'https://shelbyonline.com',
        og_site_name: ogSiteName.trim() || siteName.trim() || 'Shelby Online',
        favicon_url: faviconUrl.trim(),
        twitter_card: twitterCard || 'summary_large_image',
      };

      // 1. Direct Server API Call to ensure backend cache & Supabase table update
      const apiResp = await fetch('/api/seo/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!apiResp.ok) {
        throw new Error('Sunucu SEO kaydetme yanıtı başarısız');
      }

      // 2. DataContext & LocalStorage synchronization
      await updateSettings(payload);

      // 3. Update active server cache preview
      await fetchCurrentServerSeo();

      soundEngine.playSuccess();
      toast.success('SEO ve Link Önizleme ayarları başarıyla kaydedildi!', {
        description: 'Sosyal medya crawler botları artık doğrudan güncel meta etiketlerini görecek.',
      });
    } catch (err: any) {
      console.error('Save SEO error:', err);
      soundEngine.playError();
      toast.error('Kaydedilirken hata oluştu: ' + (err?.message || 'Sunucu hatası'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(ogUrl || 'https://shelbyonline.com');
    setCopiedUrl(true);
    toast.success('Site linki kopyalandı!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Clean domain display for previews
  const displayDomain = (() => {
    try {
      const u = new URL(ogUrl || 'https://shelbyonline.com');
      return u.hostname;
    } catch {
      return 'shelbyonline.com';
    }
  })();

  return (
    <div id="seo-manager" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/60 via-[#0d0918] to-indigo-950/60 p-6 rounded-2xl border border-violet-800/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                SEO & Link Önizleme Yönetimi
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sunucu Taraflı (SSR Meta)
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Telegram, WhatsApp, Discord, X ve Google için paylaşılan link başlıklarını, açıklamalarını ve görselini yönetin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchCurrentServerSeo}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-950/50 hover:bg-violet-900/60 text-slate-300 hover:text-white text-xs font-bold border border-violet-800/40 transition-all cursor-pointer disabled:opacity-50"
            title="Sunucudaki meta etiketlerini test et"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Yenile & Doğrula</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-violet-900/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Actions Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0d0918]/80 border border-violet-800/30 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Hızlı SEO Şablonları:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('default')}
            className="px-2.5 py-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-900/70 text-violet-200 border border-violet-700/30 font-medium transition-colors cursor-pointer"
          >
            Standart Şablon
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('campaign')}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-200 border border-indigo-700/30 font-medium transition-colors cursor-pointer"
          >
            Kampanya & Bonus Odaklı
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('vip')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/60 text-amber-200 border border-amber-700/30 font-medium transition-colors cursor-pointer"
          >
            VIP Kulüp Odaklı
          </button>
        </div>
      </div>

      {/* Main Grid: Left Form (60%) + Right Live Preview Simulator (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Card 1: Site & Arama Motoru Meta Ayarları */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0d0918] border border-violet-900/40 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-violet-900/30 pb-3">
              <Search className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Genel Site & Arama Motoru Başlıkları
              </h2>
            </div>

            <div className="space-y-4">
              {/* Site Adı & Site URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Site Adı (Marka)
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => {
                      setSiteName(e.target.value);
                      if (!ogSiteName || ogSiteName === siteName) {
                        setOgSiteName(e.target.value);
                      }
                    }}
                    placeholder="Örn: Shelby Online"
                    className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Sitenin genel marka adı.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Site URL Adresi
                  </label>
                  <input
                    type="url"
                    value={ogUrl}
                    onChange={(e) => setOgUrl(e.target.value)}
                    placeholder="https://shelbyonline.com"
                    className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Paylaşım linklerinde hedef gösterilecek ana domain.</p>
                </div>
              </div>

              {/* Site Başlığı (Title Tag) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Site Başlığı (Tarayıcı & Google &lt;title&gt;)
                  </label>
                  <span className={`text-[10px] ${siteTitle.length > 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {siteTitle.length} / 60 karakter
                  </span>
                </div>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => {
                    setSiteTitle(e.target.value);
                    if (!ogTitle || ogTitle === siteTitle) {
                      setOgTitle(e.target.value);
                    }
                  }}
                  placeholder="Örn: Shelby Online | Güncel Kampanyalar & Bonuslar"
                  className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Sekme başlığında ve Google arama sonuçlarında görünen ana başlık.
                </p>
              </div>

              {/* Meta Açıklaması */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Meta Açıklaması (&lt;meta name="description"&gt;)
                  </label>
                  <span className={`text-[10px] ${metaDescription.length > 160 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {metaDescription.length} / 160 karakter
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => {
                    setMetaDescription(e.target.value);
                    if (!ogDescription || ogDescription === metaDescription) {
                      setOgDescription(e.target.value);
                    }
                  }}
                  placeholder="Örn: Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online'da."
                  className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Arama motoru özetlerinde görünen açıklama metni.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Open Graph & Sosyal Medya Link Önizleme Ayarları */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0d0918] border border-violet-900/40 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-violet-900/30 pb-3">
              <Share2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Sosyal Medya Link Önizleme (Open Graph / OG)
              </h2>
            </div>

            <div className="space-y-4">
              {/* OG Başlığı */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    OG Başlığı (&lt;meta property="og:title"&gt;)
                  </label>
                  <span className="text-[10px] text-slate-500">{ogTitle.length} karakter</span>
                </div>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Örn: Shelby Online | Güncel Kampanyalar"
                  className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Telegram, WhatsApp ve Discord'da link paylaşıldığında kalın olarak çıkan başlık.
                </p>
              </div>

              {/* OG Açıklaması */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    OG Açıklaması (&lt;meta property="og:description"&gt;)
                  </label>
                  <span className="text-[10px] text-slate-500">{ogDescription.length} karakter</span>
                </div>
                <textarea
                  rows={2}
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  placeholder="Örn: En güncel kampanyaları ve bonusları keşfet."
                  className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Başlığın hemen altında yer alan açıklayıcı önizleme metni.
                </p>
              </div>

              {/* OG Paylaşım Görseli (Image Upload or URL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">OG Paylaşım Görseli</span>
                  {settings.logo_url && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setOgImage(settings.logo_url);
                        toast.success('Site logosu OG görseli olarak ayarlandı!');
                      }}
                      className="text-[11px] text-violet-400 hover:text-violet-300 underline font-medium cursor-pointer"
                    >
                      Site Logosunu Kullan
                    </button>
                  )}
                </div>
                <ImageUploadField
                  id="og-image-uploader"
                  label=""
                  value={ogImage}
                  onChange={(val) => setOgImage(val)}
                  aspectHint="Önerilen Oran: 1200x630 (1.91:1)"
                  placeholder="https://i.ibb.co/... veya https://..."
                  helpText="Telegram ve WhatsApp paylaşımlarında en üstte gösterilecek görsel. PNG, JPG veya WEBP formatında yükleyebilir veya doğrudan URL girebilirsiniz."
                  maxDimension={1200}
                  previewClassName="h-16 w-32"
                />
              </div>

              {/* OG Site Name & Twitter Card Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-violet-900/30">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    OG Site Adı (og:site_name)
                  </label>
                  <input
                    type="text"
                    value={ogSiteName}
                    onChange={(e) => setOgSiteName(e.target.value)}
                    placeholder="Shelby Online"
                    className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Twitter Kart Tipi (twitter:card)
                  </label>
                  <select
                    value={twitterCard}
                    onChange={(e) => setTwitterCard(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#070510] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="summary_large_image">Büyük Görsel (summary_large_image - Tavsiye Edilen)</option>
                    <option value="summary">Küçük Kare Görsel (summary)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Favicon & İkon Ayarları */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0d0918] border border-violet-900/40 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Tarayıcı Sekme İkonu (Favicon)
                </h2>
              </div>
              {settings.logo_url && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setFaviconUrl(settings.logo_url);
                    toast.success('Site logosu favicon olarak ayarlandı!');
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 underline font-medium cursor-pointer"
                >
                  Site Logosunu Kullan
                </button>
              )}
            </div>

            <ImageUploadField
              id="favicon-uploader"
              label="Favicon Görseli"
              value={faviconUrl}
              onChange={(val) => setFaviconUrl(val)}
              aspectHint="1:1 Kare (Örn: 32x32, 64x64, 128x128)"
              placeholder="/favicon.ico veya https://..."
              helpText="Tarayıcı sekmesinde site başlığının solunda gösterilecek ikon."
              maxDimension={256}
              previewClassName="h-10 w-10"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-extrabold shadow-lg shadow-violet-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Kaydediliyor...' : 'SEO & Meta Ayarlarını Kaydet'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Link Preview Simulator */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="p-5 rounded-2xl bg-[#0d0918] border border-violet-800/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Canlı Link Önizleme Simülasyonu
                </h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Canlı Önizleme
              </span>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#070510] border border-violet-900/40 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPreviewPlatform('telegram');
                }}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  previewPlatform === 'telegram'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3 h-3" />
                <span>Telegram</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPreviewPlatform('whatsapp');
                }}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  previewPlatform === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPreviewPlatform('discord');
                }}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  previewPlatform === 'discord'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Share2 className="w-3 h-3" />
                <span>Discord/X</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPreviewPlatform('google');
                }}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  previewPlatform === 'google'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3 h-3" />
                <span>Google</span>
              </button>
            </div>

            {/* Simulated Live Previews */}
            <div className="pt-2">
              {/* Telegram Preview */}
              {previewPlatform === 'telegram' && (
                <div className="p-3.5 rounded-2xl bg-[#17212b] border border-sky-900/30 text-white space-y-2 text-xs shadow-inner">
                  <div className="text-[11px] text-sky-400/90 font-mono flex items-center justify-between">
                    <span>Telegram Mesaj Önizlemesi</span>
                    <span className="text-[10px] text-slate-400">12:30</span>
                  </div>

                  <div className="p-1 rounded-xl bg-[#242f3d] border-l-4 border-sky-500 overflow-hidden space-y-2">
                    {/* OG Image */}
                    {ogImage ? (
                      <div className="w-full aspect-[1.91/1] bg-black/40 rounded-lg overflow-hidden relative">
                        <img
                          src={ogImage}
                          alt="OG Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null}

                    {/* Content */}
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                        {ogSiteName || siteName || 'Shelby Online'}
                      </div>
                      <div className="font-extrabold text-white text-xs leading-snug">
                        {ogTitle || siteTitle || 'Shelby Online'}
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                        {ogDescription || metaDescription || 'En güncel kampanyaları keşfet.'}
                      </div>
                      <div className="text-[10px] text-sky-300/80 pt-1 font-mono">
                        {ogUrl || 'https://shelbyonline.com'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Preview */}
              {previewPlatform === 'whatsapp' && (
                <div className="p-3.5 rounded-2xl bg-[#0b141a] border border-emerald-900/30 text-white space-y-2 text-xs shadow-inner">
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center justify-between">
                    <span>WhatsApp Paylaşım Balonu</span>
                    <span className="text-[10px] text-slate-500">12:30 ✓✓</span>
                  </div>

                  <div className="rounded-xl bg-[#202c33] overflow-hidden border border-emerald-900/30 shadow-md">
                    {ogImage ? (
                      <div className="w-full aspect-[1.91/1] bg-black/40 relative">
                        <img
                          src={ogImage}
                          alt="WhatsApp OG"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="p-3 space-y-1">
                      <div className="font-bold text-white text-xs">
                        {ogTitle || siteTitle || 'Shelby Online'}
                      </div>
                      <div className="text-[11px] text-slate-300 line-clamp-2">
                        {ogDescription || metaDescription || 'En güncel kampanyaları ve bonusları keşfet.'}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 font-mono flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>{displayDomain}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Discord / X (Twitter) Preview */}
              {previewPlatform === 'discord' && (
                <div className="p-3.5 rounded-2xl bg-[#2b2d31] border border-indigo-900/40 text-white space-y-2 text-xs shadow-inner">
                  <div className="text-[11px] text-indigo-300 font-mono">Discord Embed / X Kartı</div>

                  <div className="p-3 rounded-xl bg-[#1e1f22] border-l-4 border-indigo-500 space-y-2">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {ogSiteName || siteName || 'Shelby Online'}
                    </div>

                    <a
                      href={ogUrl || '#'}
                      onClick={(e) => e.preventDefault()}
                      className="font-bold text-indigo-400 hover:underline text-xs block leading-snug"
                    >
                      {ogTitle || siteTitle || 'Shelby Online'}
                    </a>

                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      {ogDescription || metaDescription || 'En güncel kampanyaları keşfet.'}
                    </div>

                    {ogImage ? (
                      <div className="w-full aspect-[1.91/1] rounded-lg overflow-hidden bg-black/40 relative mt-2">
                        <img
                          src={ogImage}
                          alt="Discord OG"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Google SERP Search Preview */}
              {previewPlatform === 'google' && (
                <div className="p-4 rounded-2xl bg-white text-slate-900 space-y-2 text-xs shadow-md">
                  <div className="text-[10px] text-slate-500 font-mono">Google Arama Sonucu</div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 truncate">
                      <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[9px] font-bold">
                        S
                      </div>
                      <span className="font-semibold text-slate-800">{siteName || 'Shelby Online'}</span>
                      <span className="text-slate-400">›</span>
                      <span className="truncate text-slate-500">{ogUrl || 'https://shelbyonline.com'}</span>
                    </div>

                    <div className="font-bold text-[#1a0dab] text-sm hover:underline cursor-pointer leading-snug">
                      {siteTitle || 'Shelby Online'}
                    </div>

                    <div className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                      {metaDescription || 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Verification & Test Links */}
            <div className="p-3.5 rounded-xl bg-[#070510] border border-violet-900/30 space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Önbellek Temizleme & Test Araçları
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                Telegram ve WhatsApp paylaşılan link önizlemelerini kendi sunucularında uzun süre <b>önbelleğe (cache)</b> alır. Yeni görselinizin hemen görünmesi için:
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href="https://t.me/WebpageBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 text-sky-200 hover:text-white text-[11px] font-bold border border-sky-800/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>Telegram Önbelleğini Sıfırla (@WebpageBot)</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                </a>

                <a
                  href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(ogUrl || 'https://shelbyonline.com')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 hover:text-white text-[11px] font-bold border border-emerald-800/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp / Meta Önbelleğini Temizle</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>

                <a
                  href={`https://www.opengraph.xyz/url/${encodeURIComponent(ogUrl || 'https://shelbyonline.com')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-violet-950/40 hover:bg-violet-900/60 text-slate-300 hover:text-white text-[11px] font-semibold border border-violet-800/30 transition-colors"
                >
                  <span>OpenGraph.xyz ile Test Et</span>
                  <ExternalLink className="w-3 h-3 text-violet-400" />
                </a>

                <a
                  href="/api/seo/og-image.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span>Canlı OG Görselini Doğrudan Aç (/api/seo/og-image.jpg)</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Crawler Bot SSR Info Box */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-2.5 text-[11px] text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-200">Sunucu Taraflı HTML Enjeksiyonu Aktif</span>
                Telegram, WhatsApp ve Discord crawler botları JavaScript çalıştırmasa dahi, sunucumuz (<code className="text-emerald-400 font-mono">server.ts</code>) HTML başlığına doğrudan güncel <code className="text-emerald-400 font-mono">&lt;meta&gt;</code> etiketlerini basmaktadır.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
