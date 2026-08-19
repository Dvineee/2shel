import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { Sponsor, SponsorFeature, SponsorStat, SponsorCategory, SponsorFAQ } from '../../types';
import {
  SPONSOR_CATEGORIES,
  getSponsorCategory,
  sortSponsors,
} from '../../lib/sponsorUtils';
import { SUPABASE_SQL_SCHEMA, SUPABASE_RECREATE_SPONSORS_SQL } from '../../lib/supabase';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  Flame,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Award,
  Crown,
  Layers,
  FileText,
  CreditCard,
  Zap,
  Clock,
  Headphones,
  Image as ImageIcon,
  Database,
  Copy,
  CheckCheck,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';
import { ImageUploadField } from '../../components/common/ImageUploadField';

export const SponsorsManager: React.FC = () => {
  const { sponsors, refreshAll, refreshSponsorsOnly, updateSponsorsDirectly } = useData();

  const [editingSponsor, setEditingSponsor] = useState<Partial<Sponsor> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SponsorCategory | 'active' | 'passive'>('all');
  const [modalTab, setModalTab] = useState<'general' | 'details' | 'stats_features'>('general');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlViewMode, setSqlViewMode] = useState<'clean' | 'migration' | 'full'>('clean');
  const [sqlCopied, setSqlCopied] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleTestDatabase = async () => {
    soundEngine.playClick();
    setTestingDb(true);
    try {
      const res = await fetch('/api/sponsors/test-connection');
      const data = await res.json();
      setDbTestResult(data);
      setShowTestModal(true);
      if (data.write_test?.status === 'success' && data.read_test?.status === 'success') {
        toast.success('Veritabanı bağlantısı ve yazma testi başarılı!');
      } else {
        toast.error('Veritabanı testinde hata tespit edildi.');
      }
    } catch (e: any) {
      toast.error('Test isteği başarısız: ' + (e?.message || 'Bilinmeyen hata'));
    } finally {
      setTestingDb(false);
    }
  };

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<SponsorCategory>('main');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [buttonText, setButtonText] = useState('SİTEYE GİT');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [verified, setVerified] = useState(true);
  const [active, setActive] = useState(true);
  const [hasDetailPage, setHasDetailPage] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [bonusCode, setBonusCode] = useState('');
  const [bonusHeadline, setBonusHeadline] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [withdrawalSpeed, setWithdrawalSpeed] = useState('');
  const [license, setLicense] = useState('');
  const [rtpRate, setRtpRate] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState('');
  const [liveSupport, setLiveSupport] = useState('7/24 Türkçe Canlı Destek');
  const [paymentMethodsText, setPaymentMethodsText] = useState('');
  const [prosText, setProsText] = useState('');
  const [consText, setConsText] = useState('');
  const [faqList, setFaqList] = useState<SponsorFAQ[]>([]);

  // Dynamic stats
  const [stats, setStats] = useState<SponsorStat[]>([
    { label: 'İlk Yatırım', value: '%100' },
    { label: 'Deneme Bonusu', value: '250 TL' },
    { label: 'Kayıp Bonusu', value: '%20' },
  ]);

  // Feature bullets
  const [features, setFeatures] = useState<SponsorFeature[]>([
    { text: 'Anında Çekim' },
    { text: '7/24 Canlı Destek' },
    { text: 'Lisanslı Altyapı' },
  ]);

  const openCreateModal = (defaultCategory: SponsorCategory = 'main') => {
    soundEngine.playClick();
    setIsNew(true);
    setModalTab('general');
    setEditingSponsor({});
    setName('');
    setSlug('');
    setCategory(defaultCategory);
    setLogoUrl('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&h=200&q=80');
    setBannerUrl('');
    setWebsiteUrl('https://');
    setButtonText('SİTEYE GİT & KAZAN');
    setShortDesc('%100 İlk Yatırım & Çevrimsiz Bonus Fırsatı');
    setDescription('Lisanslı ve güvenilir bahis platformu. Yüksek bonus oranları, anında para çekme ve 7/24 kesintisiz canlı destek hattıyla güvenli bir oyun deneyimi sunar.');
    setFeatured(defaultCategory === 'vip');
    setVerified(true);
    setActive(true);
    setHasDetailPage(true);
    setSortOrder(sponsors.length + 1);
    setBonusCode('VIP100');
    setBonusHeadline('Kayıt Olurken (VIP100) Kodunu Kullan, Özel Fırsatları Yakala!');
    setBadgeText(SPONSOR_CATEGORIES[defaultCategory].badgeText);
    setMinDeposit('50 ₺');
    setWithdrawalSpeed('3 - 15 Dakika');
    setLicense('Curacao eGaming');
    setRtpRate('%97.8');
    setOnlinePlayers('1.420');
    setLiveSupport('7/24 Türkçe Canlı Destek');
    setPaymentMethodsText('Papara, Havale / EFT, Kripto (USDT), Payfix, Kredi Kartı, Mefete');
    setProsText('Anında Para Çekme Garantisi\nYüksek Bahis Oranları & Zengin Slotlar\n7/24 Kesintisiz Türkçe Canlı Destek\nLisanslı & Güvenilir Altyapı');
    setConsText('Hafta sonu yoğunluğunda canlı destek birkaç dakika gecikebilir');
    setFaqList([
      { question: 'Nasıl kayıt olabilirim ve bonus kazanabilirim?', answer: 'Yukarıdaki SİTEYE GİT butonuna tıklayarak resmi siteye ulaşabilir, kayıt formundaki promosyon kodu alanına ilgili kodu yazarak bonusunuzu alabilirsiniz.' },
      { question: 'Para çekim süresi ne kadardır?', answer: 'Çekim talepleri ortalama 3 ile 15 dakika içerisinde otomatik onaylanarak hesabınıza aktarılır.' }
    ]);
    setStats([
      { label: 'İlk Yatırım', value: '%100' },
      { label: 'Deneme Bonusu', value: '250 TL' },
      { label: 'Kayıp Bonusu', value: '%20' },
    ]);
    setFeatures([
      { text: 'Anında Çekim İmkanı' },
      { text: '7/24 Türkçe Canlı Destek' },
      { text: 'Lisanslı & Güvenilir Altyapı' },
      { text: 'Zengin Slot & Casino Oyunları' },
    ]);
  };

  const openEditModal = (sponsor: Sponsor) => {
    soundEngine.playClick();
    const cat = getSponsorCategory(sponsor);
    setIsNew(false);
    setModalTab('general');
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setSlug(sponsor.slug);
    setCategory(cat);
    setLogoUrl(sponsor.logo_url);
    setBannerUrl(sponsor.banner_url || '');
    setWebsiteUrl(sponsor.website_url);
    setButtonText(sponsor.button_text || 'SİTEYE GİT & KAZAN');
    setShortDesc(sponsor.short_description || sponsor.bonus_text || '');
    setDescription(sponsor.description || '');
    setFeatured(cat === 'vip');
    setVerified(sponsor.verified !== false);
    setActive(sponsor.active !== false);
    setHasDetailPage(sponsor.has_detail_page !== false);
    setSortOrder(sponsor.sort_order || 1);
    setBonusCode(sponsor.bonus_code || '');
    setBonusHeadline(sponsor.bonus_headline || '');
    setBadgeText(sponsor.badge_text || SPONSOR_CATEGORIES[cat].badgeText);
    setMinDeposit(sponsor.min_deposit || '50 ₺');
    setWithdrawalSpeed(sponsor.withdrawal_speed || '3 - 15 Dakika');
    setLicense(sponsor.license || 'Curacao eGaming');
    setRtpRate(sponsor.rtp_rate || '%97.8');
    setOnlinePlayers(sponsor.online_players ? String(sponsor.online_players) : '');
    setLiveSupport(sponsor.live_support || '7/24 Türkçe Canlı Destek');
    setPaymentMethodsText(
      sponsor.payment_methods && sponsor.payment_methods.length > 0
        ? sponsor.payment_methods.join(', ')
        : 'Papara, Havale / EFT, Kripto (USDT), Payfix, Kredi Kartı, Mefete'
    );
    setProsText(
      sponsor.pros && Array.isArray(sponsor.pros) && sponsor.pros.length > 0
        ? sponsor.pros.join('\n')
        : 'Anında Para Çekme Garantisi\nYüksek Bahis Oranları & Zengin Slotlar\n7/24 Kesintisiz Türkçe Canlı Destek\nLisanslı & Güvenilir Altyapı'
    );
    setConsText(
      sponsor.cons && Array.isArray(sponsor.cons) && sponsor.cons.length > 0
        ? sponsor.cons.join('\n')
        : 'Hafta sonu yoğunluğunda canlı destek birkaç dakika gecikebilir'
    );
    setFaqList(
      sponsor.faq && Array.isArray(sponsor.faq) && sponsor.faq.length > 0
        ? sponsor.faq
        : [
            { question: 'Nasıl kayıt olabilirim ve bonus kazanabilirim?', answer: 'Yukarıdaki SİTEYE GİT butonuna tıklayarak resmi siteye ulaşabilir, kayıt formundaki promosyon kodu alanına ilgili kodu yazarak bonusunuzu alabilirsiniz.' },
            { question: 'Para çekim süresi ne kadardır?', answer: 'Çekim talepleri ortalama 3 ile 15 dakika içerisinde otomatik onaylanarak hesabınıza aktarılır.' }
          ]
    );
    setStats(
      sponsor.stats && sponsor.stats.length > 0
        ? sponsor.stats
        : [
            { label: 'İlk Yatırım', value: '%100' },
            { label: 'Deneme Bonusu', value: '250 TL' },
            { label: 'Kayıp Bonusu', value: '%20' },
          ]
    );
    setFeatures(
      sponsor.features && sponsor.features.length > 0
        ? sponsor.features
        : [
            { text: 'Anında Çekim İmkanı' },
            { text: '7/24 Türkçe Canlı Destek' },
            { text: 'Lisanslı & Güvenilir Altyapı' },
          ]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name.trim()) {
      toast.error('Lütfen bir sponsor adı girin.');
      setLoading(false);
      return;
    }

    const sanitizeSlug = (text: string) => {
      return text
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const finalLogoUrl =
      logoUrl.trim() ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&h=200&q=80';

    const generatedSlug = slug.trim()
      ? sanitizeSlug(slug.trim())
      : sanitizeSlug(name) || `sponsor-${Date.now()}`;

    const paymentMethodsParsed = paymentMethodsText
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const prosParsed = prosText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const consParsed = consText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const faqParsed = faqList.filter(
      (f) => f.question.trim().length > 0 && f.answer.trim().length > 0
    );

    const sponsorData: Partial<Sponsor> = {
      name: name.trim(),
      slug: generatedSlug,
      category,
      logo_url: finalLogoUrl,
      banner_url: bannerUrl,
      website_url: websiteUrl.trim() && websiteUrl.trim() !== 'https://' ? websiteUrl.trim() : 'https://example.com',
      button_text: buttonText || 'SİTEYE GİT & KAZAN',
      short_description: shortDesc,
      description,
      featured: category === 'vip',
      is_vip: category === 'vip',
      verified,
      active,
      has_detail_page: hasDetailPage,
      sort_order: Number(sortOrder) || 1,
      bonus_code: bonusCode,
      bonus_headline: bonusHeadline,
      badge_text: badgeText || SPONSOR_CATEGORIES[category].badgeText,
      min_deposit: minDeposit,
      withdrawal_speed: withdrawalSpeed,
      license,
      rtp_rate: rtpRate,
      online_players: onlinePlayers ? (parseInt(onlinePlayers.replace(/[^0-9]/g, '')) || 0) : undefined,
      live_support: liveSupport,
      payment_methods: paymentMethodsParsed,
      pros: prosParsed,
      cons: consParsed,
      faq: faqParsed,
      stats,
      features,
    };

    try {
      if (isNew || !editingSponsor?.id) {
        const saved = await db.createSponsor(sponsorData as any);
        updateSponsorsDirectly([...sponsors, saved]);
        toast.success(`"${name}" sponsoru başarıyla eklendi!`);
      } else {
        const saved = await db.updateSponsor(editingSponsor.id, sponsorData);
        updateSponsorsDirectly(sponsors.map((s) => (s.id === editingSponsor.id ? saved : s)));
        toast.success(`"${name}" sponsorunun tüm detayları güncellendi!`);
      }
      setEditingSponsor(null);
    } catch (err: any) {
      console.error('Sponsor save error:', err);
      toast.error('Kayıt sırasında bir hata oluştu: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (sponsor: Sponsor) => {
    soundEngine.playClick();
    try {
      const duplicateData: Partial<Sponsor> = {
        ...sponsor,
        name: `${sponsor.name} (Kopya)`,
        slug: `${sponsor.slug}-kopya-${Math.random().toString(36).substring(2, 6)}`,
        sort_order: (sponsor.sort_order || sponsors.length) + 1,
      };
      delete (duplicateData as any).id;
      const created = await db.createSponsor(duplicateData as any);
      updateSponsorsDirectly([...sponsors, created]);
      toast.success(`"${sponsor.name}" başarıyla çoğaltıldı!`);
    } catch (err: any) {
      toast.error('Çoğaltma sırasında hata: ' + (err?.message || ''));
    }
  };

  const handleDelete = async (id: string, sponsorName: string) => {
    soundEngine.playClick();
    if (window.confirm(`"${sponsorName}" sponsorunu silmek istediğinizden emin misiniz?`)) {
      try {
        updateSponsorsDirectly(sponsors.filter((s) => s.id !== id));
        await db.deleteSponsor(id);
        toast.success(`"${sponsorName}" sponsoru silindi`);
      } catch {
        toast.error('Silme işlemi başarısız');
        await refreshSponsorsOnly();
      }
    }
  };

  const handleToggleActive = async (sponsor: Sponsor) => {
    soundEngine.playClick();
    const newActive = !sponsor.active;
    updateSponsorsDirectly(
      sponsors.map((s) => (s.id === sponsor.id ? { ...s, active: newActive } : s))
    );
    await db.toggleSponsorActive(sponsor.id, newActive);
    toast.success(
      `${sponsor.name} ${newActive ? 'AKTİF yapıldı (Yayında)' : 'PASİFE alındı (Gizlendi)'}!`
    );
  };

  const handleCategoryChangeQuick = async (sponsor: Sponsor, newCategory: SponsorCategory) => {
    soundEngine.playClick();
    try {
      const updatedSponsors = sponsors.map((s) =>
        s.id === sponsor.id
          ? {
              ...s,
              category: newCategory,
              featured: newCategory === 'vip',
              badge_text: SPONSOR_CATEGORIES[newCategory].badgeText,
            }
          : s
      );
      updateSponsorsDirectly(updatedSponsors);
      await db.updateSponsor(sponsor.id, {
        category: newCategory,
        featured: newCategory === 'vip',
        badge_text: SPONSOR_CATEGORIES[newCategory].badgeText,
      });
      toast.success(`${sponsor.name} -> ${SPONSOR_CATEGORIES[newCategory].name} olarak güncellendi!`);
    } catch {
      toast.error('Kategori değiştirilemedi');
      await refreshSponsorsOnly();
    }
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    soundEngine.playClick();
    setReordering(true);
    try {
      const updated = await db.moveSponsorOrder(id, direction);
      updateSponsorsDirectly(updated);
      toast.success('Sıralama güncellendi');
    } catch {
      toast.error('Sıralama güncellenemedi');
    } finally {
      setReordering(false);
    }
  };

  const handleQuickSortChange = async (id: string, newOrder: number) => {
    try {
      const updated = await db.setSponsorSortOrder(id, newOrder);
      updateSponsorsDirectly(updated);
      toast.success('Sıra numarası kaydedildi');
    } catch {
      toast.error('Sıra güncellenemedi');
    }
  };

  const handleStatChange = (index: number, field: 'label' | 'value', value: string) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    setStats(updated);
  };

  const handleAddStat = () => {
    setStats([...stats, { label: 'Yeni Başlık', value: 'Değer' }]);
  };

  const handleRemoveStat = (index: number) => {
    if (stats.length <= 1) {
      toast.error('En az bir istatistik kutusu bulunmalıdır.');
      return;
    }
    setStats(stats.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    setFeatures([...features, { text: 'Yeni Avantaj / Özellik' }]);
  };

  const handleFeatureChange = (index: number, text: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], text };
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddFaq = () => {
    setFaqList([...faqList, { question: '', answer: '' }]);
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqList];
    updated[index] = { ...updated[index], [field]: value };
    setFaqList(updated);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqList(faqList.filter((_, i) => i !== index));
  };

  // Filter sponsors
  const safeSponsors = Array.isArray(sponsors) ? sponsors : [];
  const filteredSponsors = sortSponsors(safeSponsors).filter((s) => {
    if (!s) return false;
    const nameStr = String(s.name || '').toLowerCase();
    const slugStr = String(s.slug || '').toLowerCase();
    const bonusStr = String(s.bonus_code || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !query ||
      nameStr.includes(query) ||
      slugStr.includes(query) ||
      bonusStr.includes(query);

    if (!matchesSearch) return false;

    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'active') return s.active !== false;
    if (categoryFilter === 'passive') return s.active === false;
    return getSponsorCategory(s) === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-violet-400" />
            Sponsor Yönetim Paneli
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ana sayfa kartlarını ve <strong>Sponsor Detay Sayfası</strong>ndaki tüm verileri (Çekim Hızı, Min. Yatırım, Ödeme Yöntemleri, İnceleme) buradan düzenleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-900/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="Supabase Canlı Yazma & Okuma Testi"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-400 ${testingDb ? 'animate-spin' : ''}`} />
            <span>{testingDb ? 'Test Ediliyor...' : 'DB Testi'}</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowSqlModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-violet-950/70 border border-violet-700/60 text-violet-300 hover:text-white hover:bg-violet-900/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Supabase SQL Tablo Kodu"
          >
            <Database className="w-3.5 h-3.5 text-violet-400" />
            <span>SQL Tablo Kodu</span>
          </button>
          <button
            onClick={() => refreshAll()}
            className="p-2.5 rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-300 hover:text-white hover:bg-violet-900/50 transition-colors cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openCreateModal('main')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-900/40 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sponsor Ekle</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#120b24] p-3 rounded-2xl border border-violet-800/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-violet-950/60'
            }`}
          >
            Tümü ({safeSponsors.length})
          </button>
          <button
            onClick={() => setCategoryFilter('main')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'main'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-violet-300 hover:bg-violet-950/60'
            }`}
          >
            👑 Ana Sponsorlar
          </button>
          <button
            onClick={() => setCategoryFilter('vip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'vip'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:bg-violet-950/60'
            }`}
          >
            ⭐ VIP Sponsorlar
          </button>
          <button
            onClick={() => setCategoryFilter('trusted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'trusted'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-300 hover:bg-violet-950/60'
            }`}
          >
            🛡️ Güvenilir
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Sponsor veya kod ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-violet-950/50 border border-violet-800/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Sponsors Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-violet-950/60 text-violet-300 uppercase text-[11px] font-bold border-b border-violet-900/40">
              <tr>
                <th className="px-3 py-3.5 text-center w-24">Sıra #</th>
                <th className="px-3 py-3.5 w-44">Kategori</th>
                <th className="px-4 py-3.5">Logo & Sponsor</th>
                <th className="px-4 py-3.5">Bonus & Detay Bilgileri</th>
                <th className="px-3 py-3.5 text-center">Tıklama</th>
                <th className="px-4 py-3.5 text-center">Yayın Durumu</th>
                <th className="px-4 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-900/20">
              {filteredSponsors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Kriterlere uygun sponsor bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSponsors.map((sponsor, index) => {
                  const sponsorCat = getSponsorCategory(sponsor);

                  return (
                    <tr
                      key={sponsor.id}
                      className={`hover:bg-violet-950/30 transition-colors ${
                        !sponsor.active ? 'opacity-65 bg-black/20' : ''
                      }`}
                    >
                      {/* Priority and Move buttons */}
                      <td className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={reordering || index === 0}
                              onClick={() => handleMoveOrder(sponsor.id, 'up')}
                              className="p-1 rounded bg-violet-950/80 hover:bg-violet-800 disabled:opacity-20 text-violet-300 hover:text-white transition-colors cursor-pointer"
                              title="1 Sıra Yukarı Taşı"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={reordering || index === filteredSponsors.length - 1}
                              onClick={() => handleMoveOrder(sponsor.id, 'down')}
                              className="p-1 rounded bg-violet-950/80 hover:bg-violet-800 disabled:opacity-20 text-violet-300 hover:text-white transition-colors cursor-pointer"
                              title="1 Sıra Aşağı Taşı"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={(sponsors?.length || 0) + 10}
                            defaultValue={sponsor.sort_order}
                            key={`sort-${sponsor.id}-${sponsor.sort_order}`}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== sponsor.sort_order) {
                                handleQuickSortChange(sponsor.id, val);
                              }
                            }}
                            className="w-10 h-7 rounded-lg bg-violet-950/90 border border-violet-800/50 text-white font-black text-xs text-center focus:outline-none focus:border-violet-400 shadow-inner"
                          />
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-3 py-4">
                        <select
                          value={sponsorCat}
                          onChange={(e) => handleCategoryChangeQuick(sponsor, e.target.value as SponsorCategory)}
                          className="w-full text-[11px] font-black rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none transition-all bg-[#120b24] text-violet-200 border-violet-700/50"
                        >
                          <option value="main">👑 ANA SPONSOR</option>
                          <option value="vip">⭐ VIP SPONSOR</option>
                          <option value="trusted">🛡️ GÜVENİLİR SPONSOR</option>
                        </select>
                      </td>

                      {/* Logo and Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-violet-950/80 p-1.5 flex items-center justify-center shrink-0 border border-violet-800/30 shadow-inner">
                            <img
                              src={sponsor.logo_url}
                              alt={sponsor.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-sm">{sponsor.name}</span>
                              {sponsor.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {sponsor.has_detail_page !== false ? (
                                <a
                                  href={`/site/${sponsor.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 hover:underline font-mono bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-800/40"
                                  title="Detay Sayfasını Yeni Sekmede Aç"
                                >
                                  <FileText className="w-3 h-3 text-violet-400" />
                                  <span>/site/{sponsor.slug}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                                  <Zap className="w-2.5 h-2.5" />
                                  <span>Doğrudan Link</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stats & Details */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(sponsor.stats || []).slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-violet-950/60 border border-violet-800/30 text-[10px] text-violet-200 font-bold"
                            >
                              {s.label}: {s.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="px-3 py-4 text-center font-bold text-slate-300">
                        {sponsor.clicks_count || 0}
                      </td>

                      {/* Active / Passive Toggle */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(sponsor)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow ${
                            sponsor.active
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/40'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {sponsor.active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Yayında</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Gizli</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDuplicate(sponsor)}
                            className="p-2 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-800/30 transition-colors cursor-pointer"
                            title="Sponsoru Çoğalt / Kopyala"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(sponsor)}
                            className="p-2 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-800/30 transition-colors cursor-pointer"
                            title="Tüm Detayları Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sponsor.id, sponsor.name)}
                            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/30 transition-colors cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Modal for Create / Edit */}
      {editingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="max-w-3xl w-full my-6 rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  {isNew ? 'Yeni Sponsor Ekle' : `${name} Sponsorunu & Detaylarını Düzenle`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kart bilgilerini ve detay sayfasındaki tüm inceleme, lisans ve ödeme verilerini yapılandırın.
                </p>
              </div>
              <button
                onClick={() => setEditingSponsor(null)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-violet-950/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-violet-900/40 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'general'
                    ? 'border-violet-500 text-white bg-violet-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>1. Genel & Kart Bilgileri</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'details'
                    ? 'border-violet-500 text-white bg-violet-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Detay Sayfası Verileri (RTP, Lisans, vb.)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('stats_features')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'stats_features'
                    ? 'border-violet-500 text-white bg-violet-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. İstatistik & Avantajlar</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-h-[68vh] overflow-y-auto pr-2">
              {/* TAB 1: GENEL & KART BİLGİLERİ */}
              {modalTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200">
                      Sponsor Kategorisi *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => {
                          setCategory('main');
                          setBadgeText(SPONSOR_CATEGORIES.main.badgeText);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          category === 'main'
                            ? 'bg-violet-950/80 border-violet-500 ring-2 ring-violet-500/30'
                            : 'bg-black/30 border-violet-800/40 hover:border-violet-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-black text-violet-200">ANA SPONSOR</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          1. Kategori (En üst sıralarda yer alır)
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setCategory('vip');
                          setBadgeText(SPONSOR_CATEGORIES.vip.badgeText);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          category === 'vip'
                            ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/30'
                            : 'bg-black/30 border-violet-800/40 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-black text-purple-200">VIP SPONSOR</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          2. Kategori (Özel VIP rozeti)
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setCategory('trusted');
                          setBadgeText(SPONSOR_CATEGORIES.trusted.badgeText);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          category === 'trusted'
                            ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-black/30 border-violet-800/40 hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black text-emerald-200">GÜVENİLİR SPONSOR</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          3. Kategori (Doğrulanmış platformlar)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sponsor Adı *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: Bets10"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL Slug (Detay sayfası adresi: /site/slug)
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="Örn: bets10"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Logo 400x400 Upload */}
                  <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/30 space-y-3">
                    <ImageUploadField
                      id="sponsor-logo-upload"
                      label="Sponsor Logo / 400x400 Görseli *"
                      required
                      value={logoUrl}
                      onChange={setLogoUrl}
                      helpText="400x400 piksel kare görsel yükleyebilir veya bağlantı girebilirsiniz. Kartın üst kısmına tam oturur."
                      aspectHint="400x400 Kare (1:1)"
                      maxDimension={600}
                      previewClassName="h-16 w-16"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Yönlendirme / Ortaklık Linki (Hedef URL) *
                      </label>
                      <input
                        type="text"
                        required
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Buton Metni
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Örn: SİTEYE GİT & KAZAN"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sıralama Önceliği (Sıra #) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-700/50 text-violet-200 font-bold text-xs focus:outline-none focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Rozet Yazısı (Sağ Üst Rozet)
                      </label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="Örn: ANA SPONSOR"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Detail Page Optional Toggle in Tab 1 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 to-purple-950/40 border border-violet-700/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-black text-white">
                          Özel Detay Sayfası Oluştur (/site/{slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'sponsor'})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasDetailPage(!hasDetailPage)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          hasDetailPage
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
                        }`}
                      >
                        {hasDetailPage ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Detay Sayfası Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Kapalı (Doğrudan Link)</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {hasDetailPage
                        ? 'Bu sponsora özel detaylı inceleme sayfası (/site/:slug) oluşturulacaktır. 2. sekmeden banner, lisans, artılar/eksiler ve SSS verilerini girebilirsiniz.'
                        : 'Detay sayfası kapalı. Ziyaretçiler kart üzerindeki "SİTEYE GİT" butonuna tıkladıklarında doğrudan belirlediğiniz hedef bağlantıya yönlendirilir.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kısa Açıklama (Kart Üzerindeki Slogan)
                    </label>
                    <input
                      type="text"
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      placeholder="Örn: %100 İlk Yatırım & Çevrimsiz Kayıp Bonusu"
                      className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: DETAY SAYFASI VERİLERİ */}
              {modalTab === 'details' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Detail page enable / disable bar */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    hasDetailPage
                      ? 'bg-violet-950/40 border-violet-700/50'
                      : 'bg-amber-950/30 border-amber-800/40'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            Detay Sayfası Durumu:
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            hasDetailPage
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {hasDetailPage ? 'Aktif (Yayında)' : 'Devre Dışı (Sadece Doğrudan Link)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {hasDetailPage
                            ? 'Ziyaretçiler detay butonuna basarak bu sponsorun özel inceleme sayfasını görüntüleyebilir.'
                            : 'Detay sayfası kapalı olduğu için inceleme sayfası açılmaz, kullanıcılar doğrudan hedef web sitesine gider.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasDetailPage && slug && (
                          <a
                            href={`/site/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-violet-200 text-xs font-bold flex items-center gap-1.5 border border-violet-700/50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Önizle</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setHasDetailPage(!hasDetailPage)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            hasDetailPage
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                          }`}
                        >
                          {hasDetailPage ? 'Detay Sayfasını Kapat' : 'Detay Sayfasını Aktif Et'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner / Cover image for detail page */}
                  <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/30 space-y-3">
                    <ImageUploadField
                      id="sponsor-banner-upload"
                      label="Detay Sayfası Kapak Banner Görseli (İsteğe Bağlı)"
                      value={bannerUrl}
                      onChange={setBannerUrl}
                      helpText="Detay sayfasının en üstündeki geniş yatay kapak görseli. Boş bırakılırsa logodan estetik bir arka plan oluşturulur."
                      aspectHint="1200x400 Yatay Banner"
                      maxDimension={1200}
                      previewClassName="h-16 w-36"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Özel Bonus / Promosyon Kodu
                      </label>
                      <input
                        type="text"
                        value={bonusCode}
                        onChange={(e) => setBonusCode(e.target.value)}
                        placeholder="Örn: VIP100"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Bonus Başlığı / Sloganı (Detay Kod Çubuğu)
                      </label>
                      <input
                        type="text"
                        value={bonusHeadline}
                        onChange={(e) => setBonusHeadline(e.target.value)}
                        placeholder="Örn: Kayıt Olurken Bu Kodu Kullan, Ekstra %30 Bonus Kazan!"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                        Çekim Hızı
                      </label>
                      <input
                        type="text"
                        value={withdrawalSpeed}
                        onChange={(e) => setWithdrawalSpeed(e.target.value)}
                        placeholder="Örn: 3 - 15 Dakika"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                        Minimum Yatırım
                      </label>
                      <input
                        type="text"
                        value={minDeposit}
                        onChange={(e) => setMinDeposit(e.target.value)}
                        placeholder="Örn: 50 ₺"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Headphones className="w-3.5 h-3.5 text-violet-400" />
                        Canlı Destek
                      </label>
                      <input
                        type="text"
                        value={liveSupport}
                        onChange={(e) => setLiveSupport(e.target.value)}
                        placeholder="Örn: 7/24 Türkçe Canlı Destek"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                        Lisans Bilgisi
                      </label>
                      <input
                        type="text"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        placeholder="Örn: Curacao eGaming (8048/JAZ)"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-violet-400" />
                        Ortalama RTP Oranı
                      </label>
                      <input
                        type="text"
                        value={rtpRate}
                        onChange={(e) => setRtpRate(e.target.value)}
                        placeholder="Örn: %97.8"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        Aktif Oyuncu Sayısı
                      </label>
                      <input
                        type="text"
                        value={onlinePlayers}
                        onChange={(e) => setOnlinePlayers(e.target.value)}
                        placeholder="Örn: 1.420"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Desteklenen Ödeme Yöntemleri (Virgülle Ayırın)
                    </label>
                    <input
                      type="text"
                      value={paymentMethodsText}
                      onChange={(e) => setPaymentMethodsText(e.target.value)}
                      placeholder="Papara, Havale / EFT, Kripto (USDT), Payfix, Kredi Kartı, Mefete"
                      className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Detay sayfasının sağ kenar çubuğunda rozetler halinde listelenir.
                    </span>
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 space-y-1.5">
                      <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Platformun Artıları (Her satıra bir madde)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={prosText}
                        onChange={(e) => setProsText(e.target.value)}
                        placeholder="Anında Para Çekme Garantisi&#10;Yüksek Bahis Oranları&#10;7/24 Canlı Destek"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-emerald-800/40 text-emerald-100 text-xs focus:outline-none focus:border-emerald-400 leading-relaxed"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/30 space-y-1.5">
                      <label className="block text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>Platformun Eksileri (Her satıra bir madde)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={consText}
                        onChange={(e) => setConsText(e.target.value)}
                        placeholder="Hafta sonu yoğunluğunda canlı destek birkaç dakika gecikebilir"
                        className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-rose-800/40 text-rose-100 text-xs focus:outline-none focus:border-rose-400 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* FAQ (Q&A) Manager */}
                  <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-violet-200 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-violet-400" />
                        <span>Sıkça Sorulan Sorular (SSS)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="text-[11px] text-violet-300 font-bold bg-violet-900/60 hover:bg-violet-800 px-2.5 py-1 rounded-lg border border-violet-700/50 cursor-pointer"
                      >
                        + Soru Ekle
                      </button>
                    </div>

                    {faqList.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        Henüz soru eklenmedi. &quot;+ Soru Ekle&quot; butonuna basarak detay sayfasına özel SSS ekleyebilirsiniz.
                      </p>
                    ) : (
                      faqList.map((faq, fIdx) => (
                        <div key={fIdx} className="p-3 rounded-xl bg-[#0d0918] border border-violet-800/40 space-y-2 relative">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              placeholder="Soru (örn: Bonus nasıl alınır?)"
                              value={faq.question}
                              onChange={(e) => handleFaqChange(fIdx, 'question', e.target.value)}
                              className="w-full p-2 text-xs font-bold rounded-lg bg-black/40 border border-violet-900/60 text-white focus:outline-none focus:border-violet-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(fIdx)}
                              className="p-2 text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Soruyu Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Cevap metni..."
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(fIdx, 'answer', e.target.value)}
                            className="w-full p-2 text-xs rounded-lg bg-black/30 border border-violet-900/40 text-slate-300 focus:outline-none focus:border-violet-500 leading-relaxed"
                          />
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Detaylı Platform İnceleme & Açıklama Metni
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Platformun lisansı, güvenilirliği, oyun sağlayıcıları ve ödeme yöntemleri hakkında detaylı inceleme metni..."
                      className="w-full p-3 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: İSTATİSTİKLER & ÖNE ÇIKAN AVANTAJLAR */}
              {modalTab === 'stats_features' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Dynamic Statistics Boxes */}
                  <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-900/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-violet-200">
                        Kart & Detay İstatistik / Bonus Kutuları
                      </label>
                      <button
                        type="button"
                        onClick={handleAddStat}
                        className="text-[11px] text-violet-400 font-bold hover:underline cursor-pointer"
                      >
                        + Kutu Ekle
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {stats.map((stat, idx) => (
                        <div key={idx} className="space-y-1.5 p-2 rounded-xl bg-[#0d0918] border border-violet-800/40 relative">
                          <input
                            type="text"
                            placeholder="Başlık (örn: İlk Yatırım)"
                            value={stat.label}
                            onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                            className="w-full p-1.5 text-[11px] rounded-lg bg-black/40 border border-violet-900/50 text-slate-300 focus:outline-none focus:border-violet-500"
                          />
                          <input
                            type="text"
                            placeholder="Değer (örn: %100 veya 500 TL)"
                            value={stat.value}
                            onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                            className="w-full p-1.5 text-xs font-bold rounded-lg bg-black/40 border border-violet-700/50 text-white focus:outline-none focus:border-violet-400"
                          />
                          {stats.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStat(idx)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer text-right block w-full mt-1"
                            >
                              Kaldır
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feature Bullets (Checklist) */}
                  <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-900/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        Detay Sayfası Öne Çıkan Özellikler (Avantaj Listesi)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="text-[11px] text-violet-400 font-bold hover:underline cursor-pointer"
                      >
                        + Madde Ekle
                      </button>
                    </div>
                    {features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat.text}
                          onChange={(e) => handleFeatureChange(idx, e.target.value)}
                          placeholder="Örn: Anında Para Çekme & Çevrimsiz Bonus"
                          className="flex-1 p-2 text-xs rounded-lg bg-[#0d0918] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-2 text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Toggles in Form */}
              <div className="flex flex-wrap gap-6 pt-2 p-3 bg-violet-950/20 rounded-xl border border-violet-900/30">
                <label className="flex items-center gap-2 text-xs text-white font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-violet-950 text-violet-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Yayında Göster (Aktif)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-emerald-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="w-4 h-4 rounded bg-violet-950 text-violet-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Doğrulanmış Lisanslı Sponsor Rozeti</span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-violet-900/30">
                <div className="flex gap-2">
                  {modalTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'stats_features' ? 'details' : 'general')}
                      className="px-3.5 py-2 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 text-xs font-bold cursor-pointer"
                    >
                      ← Önceki Adım
                    </button>
                  )}
                  {modalTab !== 'stats_features' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'general' ? 'details' : 'stats_features')}
                      className="px-3.5 py-2 rounded-xl border border-violet-700 bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 text-xs font-bold cursor-pointer"
                    >
                      Sonraki Adım →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSponsor(null)}
                    className="px-4 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 text-xs font-bold cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-900/40 cursor-pointer transition-all active:scale-95"
                  >
                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQL Migration & Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#120b24] border border-violet-800/60 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-violet-800/40 flex items-center justify-between bg-violet-950/40">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Supabase PostgreSQL Şema ve SQL Kodları
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Veritabanı anlık senkronizasyonu ve tüm tablolar için gerekli SQL komutları
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-violet-900/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-violet-800/30 bg-[#0f091e] overflow-x-auto">
              <button
                onClick={() => setSqlViewMode('clean')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  sqlViewMode === 'clean'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🔥 Sıfırdan Temiz Sponsors Tablosu (Önerilen)
              </button>
              <button
                onClick={() => setSqlViewMode('migration')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  sqlViewMode === 'migration'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Eksik Kolonları Ekle (Migration)
              </button>
              <button
                onClick={() => setSqlViewMode('full')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  sqlViewMode === 'full'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🏗️ Tüm Tablolar & İzinler (Full Schema)
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {sqlViewMode === 'clean' ? (
                <>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                    ✨ <strong>Sıfırdan Kusursuz Kurulum:</strong> Bu kod eski <code>sponsors</code> tablosunu kaldırıp otomatik ID üretimi, tüm detay kolonları (çekim hızı, bonus kodu, istatistikler, özellikler) ve RLS tam izinleriyle sıfırdan kurar.
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-[#090514] border border-emerald-900/60 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto select-all max-h-72">
                      {SUPABASE_RECREATE_SPONSORS_SQL}
                    </pre>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_RECREATE_SPONSORS_SQL);
                        setSqlCopied(true);
                        toast.success('Sıfırdan Temiz Kurulum SQL kodu kopyalandı!');
                        setTimeout(() => setSqlCopied(false), 2000);
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      {sqlCopied ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Kopyalandı!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>SQL Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : sqlViewMode === 'migration' ? (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Eğer mevcut sponsorlarınızı silmeden sadece yeni kolonları (çekim hızı, bonus kodu, istatistikler, özellikler, ödeme yöntemleri vs.) eklemek isterseniz aşağıdaki kodu çalıştırabilirsiniz:
                  </p>

                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-[#090514] border border-violet-900/60 text-indigo-300 font-mono text-[11px] leading-relaxed overflow-x-auto select-all max-h-72">
{`-- Sponsors Tablosu Kolon Güncellemesi
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS has_detail_page boolean DEFAULT true;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS bonus_code text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS bonus_headline text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS min_deposit text DEFAULT '50 ₺';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS withdrawal_speed text DEFAULT '3 - 15 Dakika';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS license text DEFAULT 'Curacao eGaming';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS rtp_rate text DEFAULT '%97.8';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS online_players text DEFAULT '1420';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS live_support text DEFAULT '7/24 Türkçe Canlı Destek';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS pros jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS cons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb;`}
                    </pre>

                    <button
                      onClick={() => {
                        const sqlText = `-- Sponsors Tablosu Kolon Güncellemesi
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS has_detail_page boolean DEFAULT true;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS bonus_code text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS bonus_headline text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS min_deposit text DEFAULT '50 ₺';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS withdrawal_speed text DEFAULT '3 - 15 Dakika';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS license text DEFAULT 'Curacao eGaming';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS rtp_rate text DEFAULT '%97.8';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS online_players text DEFAULT '1420';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS live_support text DEFAULT '7/24 Türkçe Canlı Destek';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS pros jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS cons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb;`;
                        navigator.clipboard.writeText(sqlText);
                        setSqlCopied(true);
                        toast.success('Migration SQL kodu kopyalandı!');
                        setTimeout(() => setSqlCopied(false), 2000);
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      {sqlCopied ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Kopyalandı!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sıfırdan tam kurulum için tüm tabloları, RLS izinlerini ve migration fonksiyonlarını içeren eksiksiz SQL şeması:
                  </p>

                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-[#090514] border border-violet-900/60 text-indigo-300 font-mono text-[11px] leading-relaxed overflow-x-auto select-all max-h-72">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                        setSqlCopied(true);
                        toast.success('Tam Supabase SQL şeması kopyalandı!');
                        setTimeout(() => setSqlCopied(false), 2000);
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      {sqlCopied ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Kopyalandı!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Tümünü Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/30 text-xs text-slate-400">
                💡 <strong>Nasıl Çalıştırılır:</strong> Supabase Dashboard &gt; Projeniz &gt; Sol Menüden <strong>SQL Editor</strong> &gt; <strong>New query</strong> &gt; Kodu Yapıştırın &gt; Yeşil <strong>RUN</strong> butonuna basın.
              </div>
            </div>

            <div className="p-4 border-t border-violet-800/40 flex justify-end bg-violet-950/30">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB Test Result Modal */}
      {showTestModal && dbTestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#120b24] border border-violet-800/60 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 border-b border-violet-800/40 flex items-center justify-between bg-violet-950/40">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  Veritabanı Canlı Teşhis & Test Sonucu
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-violet-900/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#090514] border border-violet-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Supabase Bağlantısı:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Aktif & Doğrulandı
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Okuma (Select) Testi:</span>
                  <span className={dbTestResult.read_test?.status === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {dbTestResult.read_test?.status === 'success'
                      ? `Başarılı (${dbTestResult.read_test.count} kayıt)`
                      : `Hata: ${dbTestResult.read_test?.message || 'Başarısız'}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Yazma (Insert/Delete) Testi:</span>
                  <span className={dbTestResult.write_test?.status === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {dbTestResult.write_test?.status === 'success'
                      ? 'Başarılı (Kayıt eklendi ve silindi)'
                      : `Hata: ${dbTestResult.write_test?.message || 'Başarısız'}`}
                  </span>
                </div>
              </div>

              {dbTestResult.columns_detected && dbTestResult.columns_detected.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold">Mevcut Kolonlar ({dbTestResult.columns_detected.length}):</span>
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto">
                    {dbTestResult.columns_detected.map((col: string) => (
                      <span key={col} className="px-2 py-0.5 rounded-md bg-violet-950/80 border border-violet-800/40 text-[10px] text-violet-300 font-mono">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dbTestResult.errors && dbTestResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 space-y-1">
                  <div className="font-bold">Hata Detayları:</div>
                  {dbTestResult.errors.map((err: string, i: number) => (
                    <div key={i} className="text-[11px] font-mono">{err}</div>
                  ))}
                  <div className="mt-2 text-[11px] text-slate-300">
                    💡 Çözüm: "SQL Tablo Kodu" butonuna tıklayıp <strong>Sıfırdan Temiz Sponsors Tablosu</strong> kodunu Supabase SQL Editor'de çalıştırınız.
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-violet-800/40 flex justify-end bg-violet-950/30">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
