import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { Sponsor, SponsorFeature, SponsorStat, SponsorCategory } from '../../types';
import {
  SPONSOR_CATEGORIES,
  getSponsorCategory,
  sortSponsors,
} from '../../lib/sponsorUtils';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  Star,
  Flame,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
  Award,
  Crown,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';
import { ImageUploadField } from '../../components/common/ImageUploadField';

export const SponsorsManager: React.FC = () => {
  const { sponsors, refreshAll } = useData();

  const [editingSponsor, setEditingSponsor] = useState<Partial<Sponsor> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SponsorCategory | 'active' | 'passive'>('all');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<SponsorCategory>('main');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [buttonText, setButtonText] = useState('DETAYLARI GÖR');
  const [rating, setRating] = useState(4.9);
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [verified, setVerified] = useState(true);
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [bonusCode, setBonusCode] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [withdrawalSpeed, setWithdrawalSpeed] = useState('');
  const [license, setLicense] = useState('');

  // Dynamic 3 stats
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
    setEditingSponsor({});
    setName('');
    setSlug('');
    setCategory(defaultCategory);
    setLogoUrl('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&h=100&q=80');
    setBannerUrl('');
    setWebsiteUrl('https://t.me/shelbyonline');
    setButtonText('DETAYLARI GÖR');
    setRating(4.9);
    setShortDesc('En yüksek oranlar ve anında çekim imkanı.');
    setDescription('Lisanslı ve güvenilir bahis platformu.');
    setFeatured(defaultCategory === 'vip');
    setVerified(true);
    setActive(true);
    setSortOrder(sponsors.length + 1);
    setBonusCode('SHELBYVIP');
    setBadgeText(SPONSOR_CATEGORIES[defaultCategory].badgeText);
    setMinDeposit('50 TL');
    setWithdrawalSpeed('5 Dakika');
    setLicense('Curacao eGaming');
    setStats([
      { label: 'İlk Yatırım', value: '%100' },
      { label: 'Deneme Bonusu', value: '250 TL' },
      { label: 'Kayıp Bonusu', value: '%20' },
    ]);
    setFeatures([
      { text: 'Anında Çekim' },
      { text: '7/24 Canlı Destek' },
      { text: 'Lisanslı Altyapı' },
    ]);
  };

  const openEditModal = (sponsor: Sponsor) => {
    soundEngine.playClick();
    const cat = getSponsorCategory(sponsor);
    setIsNew(false);
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setSlug(sponsor.slug);
    setCategory(cat);
    setLogoUrl(sponsor.logo_url);
    setBannerUrl(sponsor.banner_url || '');
    setWebsiteUrl(sponsor.website_url);
    setButtonText(sponsor.button_text || 'DETAYLARI GÖR');
    setRating(sponsor.rating || 4.9);
    setShortDesc(sponsor.short_description || '');
    setDescription(sponsor.description || '');
    setFeatured(sponsor.featured || cat === 'vip');
    setVerified(sponsor.verified !== false);
    setActive(sponsor.active !== false);
    setSortOrder(sponsor.sort_order || 1);
    setBonusCode(sponsor.bonus_code || '');
    setBadgeText(sponsor.badge_text || SPONSOR_CATEGORIES[cat].badgeText);
    setMinDeposit(sponsor.min_deposit || '');
    setWithdrawalSpeed(sponsor.withdrawal_speed || '');
    setLicense(sponsor.license || '');
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
        : [{ text: 'Anında Çekim' }, { text: '7/24 Destek' }]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!logoUrl.trim()) {
      toast.error('Lütfen bir sponsor logo görseli seçin veya yükleyin.');
      setLoading(false);
      return;
    }

    const generatedSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, '-')
      : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const sponsorData: Partial<Sponsor> = {
      name,
      slug: generatedSlug,
      category,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      website_url: websiteUrl,
      button_text: buttonText,
      rating,
      short_description: shortDesc,
      description,
      featured: category === 'vip' || featured,
      verified,
      active,
      sort_order: Number(sortOrder) || 1,
      bonus_code: bonusCode,
      badge_text: badgeText || SPONSOR_CATEGORIES[category].badgeText,
      min_deposit: minDeposit,
      withdrawal_speed: withdrawalSpeed,
      license,
      stats,
      features,
    };

    try {
      if (isNew) {
        await db.createSponsor(sponsorData as any);
        toast.success(`"${name}" sponsoru ${SPONSOR_CATEGORIES[category].name} kategorisine eklendi!`);
      } else if (editingSponsor && editingSponsor.id) {
        await db.updateSponsor(editingSponsor.id, sponsorData);
        toast.success(`"${name}" sponsoru başarıyla güncellendi!`);
      }
      setEditingSponsor(null);
      await refreshAll();
    } catch {
      toast.error('Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, sponsorName: string) => {
    soundEngine.playClick();
    if (window.confirm(`"${sponsorName}" sponsorunu silmek istediğinizden emin misiniz?`)) {
      try {
        await db.deleteSponsor(id);
        toast.success(`"${sponsorName}" sponsoru silindi`);
        await refreshAll();
      } catch {
        toast.error('Silme işlemi başarısız');
      }
    }
  };

  const handleToggleActive = async (sponsor: Sponsor) => {
    soundEngine.playClick();
    const newActive = !sponsor.active;
    await db.toggleSponsorActive(sponsor.id, newActive);
    toast.success(
      `${sponsor.name} ${newActive ? 'AKTİF yapıldı (Yayında)' : 'PASİFE alındı (Gizlendi)'}!`
    );
    await refreshAll();
  };

  const handleCategoryChangeQuick = async (sponsor: Sponsor, newCategory: SponsorCategory) => {
    soundEngine.playClick();
    try {
      await db.updateSponsor(sponsor.id, {
        category: newCategory,
        featured: newCategory === 'vip',
        badge_text: SPONSOR_CATEGORIES[newCategory].badgeText,
      });
      toast.success(`${sponsor.name} -> ${SPONSOR_CATEGORIES[newCategory].name} olarak güncellendi!`);
      await refreshAll();
    } catch {
      toast.error('Kategori değiştirilemedi');
    }
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    soundEngine.playClick();
    setReordering(true);
    try {
      await db.moveSponsorOrder(id, direction);
      toast.success('Sıralama güncellendi!');
      await refreshAll();
    } catch {
      toast.error('Sıralama değiştirilemedi');
    } finally {
      setReordering(false);
    }
  };

  const handleQuickSortChange = async (id: string, newOrder: number) => {
    soundEngine.playClick();
    setReordering(true);
    try {
      await db.setSponsorSortOrder(id, newOrder);
      toast.success(`Sıralama #${newOrder} olarak güncellendi!`);
      await refreshAll();
    } catch {
      toast.error('Sıra numarası güncellenemedi');
    } finally {
      setReordering(false);
    }
  };

  // Re-index all sponsors 1..N sequentially
  const handleAutoNormalizeSort = async () => {
    soundEngine.playClick();
    const sorted = sortSponsors(sponsors);
    const orderedIds = sorted.map((s) => s.id);
    await db.reorderSponsors(orderedIds);
    toast.success('Tüm sponsorların sıralama numaraları 1..N olarak yeniden düzenlendi!');
    await refreshAll();
  };

  // Stat handlers
  const handleStatChange = (index: number, field: 'label' | 'value', text: string) => {
    const updated = [...stats];
    updated[index][field] = text;
    setStats(updated);
  };

  // Feature handlers
  const handleAddFeature = () => {
    setFeatures([...features, { text: 'Yeni Avantaj' }]);
  };

  const handleFeatureChange = (index: number, text: string) => {
    const updated = [...features];
    updated[index].text = text;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Sorted and filtered list
  const sortedAll = sortSponsors(sponsors);

  const filteredSponsors = sortedAll.filter((s) => {
    const sCat = getSponsorCategory(s);
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.bonus_code && s.bonus_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'active'
        ? s.active !== false
        : categoryFilter === 'passive'
        ? s.active === false
        : sCat === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const mainCount = sponsors.filter((s) => getSponsorCategory(s) === 'main').length;
  const vipCount = sponsors.filter((s) => getSponsorCategory(s) === 'vip').length;
  const trustedCount = sponsors.filter((s) => getSponsorCategory(s) === 'trusted').length;
  const activeCount = sponsors.filter((s) => s.active !== false).length;
  const passiveCount = sponsors.filter((s) => s.active === false).length;

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            Sponsor Yönetimi & 3 Katmanlı Kategori Sistemi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sponsorları <span className="text-amber-300 font-bold">ANA SPONSORLAR</span>, <span className="text-purple-300 font-bold">VIP SPONSORLAR</span> ve <span className="text-emerald-300 font-bold">GÜVENİLİR SPONSORLAR</span> olarak yönetin ve sıralama önceliklerini belirleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoNormalizeSort}
            className="px-3.5 py-2.5 rounded-xl bg-violet-950/80 hover:bg-violet-900 border border-violet-700/50 text-violet-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
            title="Sıralama numaralarını 1'den başlayarak otomatik düzeltir"
          >
            <ArrowUpDown className="w-4 h-4 text-violet-400" />
            <span>Sıralamayı Sıfırla (1..N)</span>
          </button>

          <button
            onClick={() => openCreateModal('main')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Yeni Sponsor Ekle</span>
          </button>
        </div>
      </div>

      {/* 3 Categories Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setCategoryFilter('main')}
          className={`p-4 rounded-2xl bg-gradient-to-b from-[#1c1408] to-[#120b24] border transition-all cursor-pointer ${
            categoryFilter === 'main'
              ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-900/30'
              : 'border-amber-700/30 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              ANA SPONSORLAR
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black">
              1. SIRA
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{mainCount}</p>
          <span className="text-[11px] text-amber-400/70">En üst ana vitrin</span>
        </div>

        <div
          onClick={() => setCategoryFilter('vip')}
          className={`p-4 rounded-2xl bg-gradient-to-b from-[#1b0d2a] to-[#120b24] border transition-all cursor-pointer ${
            categoryFilter === 'vip'
              ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-900/30'
              : 'border-purple-700/30 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              VIP SPONSORLAR
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black">
              2. SIRA
            </span>
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{vipCount}</p>
          <span className="text-[11px] text-purple-400/70">Öne çıkan VIP siteler</span>
        </div>

        <div
          onClick={() => setCategoryFilter('trusted')}
          className={`p-4 rounded-2xl bg-gradient-to-b from-[#091a18] to-[#120b24] border transition-all cursor-pointer ${
            categoryFilter === 'trusted'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-900/30'
              : 'border-emerald-700/30 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              GÜVENİLİR SPONSORLAR
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
              3. SIRA
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{trustedCount}</p>
          <span className="text-[11px] text-emerald-400/70">Onaylı lisanslı platformlar</span>
        </div>

        <div
          onClick={() => setCategoryFilter('active')}
          className={`p-4 rounded-2xl bg-[#120b24] border transition-all cursor-pointer ${
            categoryFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : 'border-emerald-800/30 hover:border-emerald-600/40'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold">Yayında (Aktif)</span>
          <p className="text-2xl font-black text-emerald-400 mt-2">{activeCount}</p>
          <span className="text-[11px] text-slate-500">Ziyaretçilere açık</span>
        </div>

        <div
          onClick={() => setCategoryFilter('passive')}
          className={`p-4 rounded-2xl bg-[#120b24] border transition-all cursor-pointer ${
            categoryFilter === 'passive'
              ? 'border-rose-500 ring-2 ring-rose-500/30'
              : 'border-rose-800/30 hover:border-rose-600/40'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold">Gizli (Pasif)</span>
          <p className="text-2xl font-black text-rose-400 mt-2">{passiveCount}</p>
          <span className="text-[11px] text-slate-500">Geçici olarak yayından çekilmiş</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sponsor adı, slug veya bonus kodu ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090614] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `Tümü (${sponsors.length})` },
            { id: 'main', label: `👑 Ana Sponsorlar (${mainCount})` },
            { id: 'vip', label: `⭐ VIP Sponsorlar (${vipCount})` },
            { id: 'trusted', label: `🛡️ Güvenilir Sponsorlar (${trustedCount})` },
            { id: 'active', label: `Aktif (${activeCount})` },
            { id: 'passive', label: `Pasif (${passiveCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setCategoryFilter(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'bg-[#090614] text-slate-400 hover:text-white border border-violet-900/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sponsors Table */}
      <div className="rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-violet-950/60 text-violet-300 uppercase text-[11px] font-bold border-b border-violet-900/40">
              <tr>
                <th className="px-3 py-3.5 text-center w-24">Sıra & Öncelik</th>
                <th className="px-3 py-3.5 w-44">Kategori</th>
                <th className="px-4 py-3.5">Logo & Sponsor</th>
                <th className="px-4 py-3.5">Bonus & İstatistikler</th>
                <th className="px-3 py-3.5 text-center">Puan</th>
                <th className="px-3 py-3.5 text-center">Tıklama</th>
                <th className="px-4 py-3.5 text-center">Yayın Durumu</th>
                <th className="px-4 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-900/20">
              {filteredSponsors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Kriterlere uygun sponsor bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSponsors.map((sponsor, index) => {
                  const sponsorCat = getSponsorCategory(sponsor);
                  const catConfig = SPONSOR_CATEGORIES[sponsorCat];

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
                            max={sponsors.length + 10}
                            defaultValue={sponsor.sort_order}
                            key={`sort-${sponsor.id}-${sponsor.sort_order}`}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== sponsor.sort_order) {
                                handleQuickSortChange(sponsor.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseInt((e.target as HTMLInputElement).value);
                                if (!isNaN(val) && val !== sponsor.sort_order) {
                                  handleQuickSortChange(sponsor.id, val);
                                }
                              }
                            }}
                            className="w-10 h-7 rounded-lg bg-violet-950/90 border border-violet-800/50 text-white font-black text-xs text-center focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
                            title="Sıra numarasını değiştirmek için yazıp Enter'a veya dışarı tıklayın"
                          />
                        </div>
                      </td>

                      {/* Category Badge & Quick Switcher */}
                      <td className="px-3 py-4">
                        <select
                          value={sponsorCat}
                          onChange={(e) => handleCategoryChangeQuick(sponsor, e.target.value as SponsorCategory)}
                          className={`w-full text-[11px] font-black rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none transition-all ${
                            sponsorCat === 'main'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                              : sponsorCat === 'vip'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                          }`}
                        >
                          <option value="main" className="bg-[#120b24] text-amber-300 font-bold">
                            👑 ANA SPONSOR
                          </option>
                          <option value="vip" className="bg-[#120b24] text-purple-300 font-bold">
                            ⭐ VIP SPONSOR
                          </option>
                          <option value="trusted" className="bg-[#120b24] text-emerald-300 font-bold">
                            🛡️ GÜVENİLİR SPONSOR
                          </option>
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
                              {sponsor.badge_text && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                  {sponsor.badge_text}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /{sponsor.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(sponsor.stats || []).slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-violet-950/60 border border-violet-800/30 text-[10px] text-amber-300 font-bold"
                            >
                              {s.label}: {s.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-3 py-4 text-center font-bold text-amber-400">
                        ★ {sponsor.rating?.toFixed(1) || '4.9'}
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
                              <span>Yayında (Aktif)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Gizli (Pasif)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(sponsor)}
                            className="p-2 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-800/30 transition-colors cursor-pointer"
                            title="Düzenle"
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

      {/* Modal for Create/Edit */}
      {editingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full my-8 rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                {isNew ? 'Yeni Sponsor Kartı Ekle' : `${name} Sponsorunu Düzenle`}
              </h3>
              <button
                onClick={() => setEditingSponsor(null)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Category Selector (3 Categories) */}
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
                        ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-black/30 border-violet-800/40 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-amber-300">ANA SPONSOR</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      1. Kategori (En üstte altın çerçeve)
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setCategory('vip');
                      setBadgeText(SPONSOR_CATEGORIES.vip.badgeText);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      category === 'vip'
                        ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/30'
                        : 'bg-black/30 border-violet-800/40 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-purple-300">VIP SPONSOR</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      2. Kategori (Mor VIP rozet)
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setCategory('trusted');
                      setBadgeText(SPONSOR_CATEGORIES.trusted.badgeText);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      category === 'trusted'
                        ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-black/30 border-violet-800/40 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-emerald-300">GÜVENİLİR SPONSOR</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      3. Kategori (Onaylı platformlar)
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
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Slug (örn: casinomaxi)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Sponsor Logo with File Upload & URL support */}
              <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/30 space-y-3">
                <ImageUploadField
                  id="sponsor-logo-upload"
                  label="Sponsor Logo Görseli"
                  required
                  value={logoUrl}
                  onChange={setLogoUrl}
                  helpText="PNG, JPG, SVG veya WEBP yükleyin. Transparan veya koyu temaya uygun logolar önerilir."
                  aspectHint="Önerilen: 300x120px veya kare"
                  maxDimension={600}
                  previewClassName="h-12 w-28"
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
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
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
                    placeholder="Örn: DETAYLARI GÖR veya HEMEN OYNA"
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sıralama Önceliği (Sıra #) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-amber-500/50 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Küçük numaralar önde çıkar</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rozet Yazısı (Badge)
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="Örn: ANA SPONSOR"
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Puan (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Özel Bonus Kodu
                  </label>
                  <input
                    type="text"
                    value={bonusCode}
                    onChange={(e) => setBonusCode(e.target.value)}
                    placeholder="Örn: SHELBYVIP"
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min Yatırım
                  </label>
                  <input
                    type="text"
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(e.target.value)}
                    placeholder="Örn: 50 TL"
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Çekim Hızı
                  </label>
                  <input
                    type="text"
                    value={withdrawalSpeed}
                    onChange={(e) => setWithdrawalSpeed(e.target.value)}
                    placeholder="Örn: 5 Dakika"
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kısa Açıklama (Kart üzerinde görünür)
                </label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* 3 Dynamic Statistics */}
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-900/30 space-y-3">
                <label className="block text-xs font-bold text-amber-300">
                  Kart Üzerindeki 3 Dinamik İstatistik Kutusu
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {stats.slice(0, 3).map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                      <input
                        type="text"
                        placeholder="Başlık (örn: İlk Yatırım)"
                        value={stat.label}
                        onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                        className="w-full p-2 text-[11px] rounded-lg bg-[#0d0918] border border-violet-800/40 text-slate-300"
                      />
                      <input
                        type="text"
                        placeholder="Değer (örn: %100)"
                        value={stat.value}
                        onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                        className="w-full p-2 text-xs font-bold rounded-lg bg-[#0d0918] border border-amber-500/40 text-amber-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Feature Bullets */}
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Özellik Maddeleri (Checklist)
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
                      className="flex-1 p-2 text-xs rounded-lg bg-[#0d0918] border border-violet-800/40 text-white"
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
                  <span>Doğrulanmış Rozeti Göster</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingSponsor(null)}
                  className="px-5 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 text-xs font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/50 cursor-pointer transition-all active:scale-95"
                >
                  {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
