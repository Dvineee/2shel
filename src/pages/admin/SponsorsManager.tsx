import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { Sponsor, SponsorFeature, SponsorStat } from '../../types';
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
  ArrowUpDown,
  RefreshCw,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';

export const SponsorsManager: React.FC = () => {
  const { sponsors, refreshAll } = useData();

  const [editingSponsor, setEditingSponsor] = useState<Partial<Sponsor> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive' | 'featured'>('all');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
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

  const openCreateModal = () => {
    soundEngine.playClick();
    setIsNew(true);
    setEditingSponsor({});
    setName('');
    setSlug('');
    setLogoUrl('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&h=100&q=80');
    setBannerUrl('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&h=400&q=80');
    setWebsiteUrl('https://t.me/shelbyonline');
    setButtonText('DETAYLARI GÖR');
    setRating(4.9);
    setShortDesc('En yüksek oranlar ve anında çekim imkanı.');
    setDescription('Lisanslı ve güvenilir bahis platformu.');
    setFeatured(false);
    setVerified(true);
    setActive(true);
    setSortOrder(sponsors.length + 1);
    setBonusCode('SHELBYVIP');
    setBadgeText('ÖZEL BONUS');
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
    setIsNew(false);
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setSlug(sponsor.slug);
    setLogoUrl(sponsor.logo_url);
    setBannerUrl(sponsor.banner_url || '');
    setWebsiteUrl(sponsor.website_url);
    setButtonText(sponsor.button_text || 'DETAYLARI GÖR');
    setRating(sponsor.rating || 4.9);
    setShortDesc(sponsor.short_description || '');
    setDescription(sponsor.description || '');
    setFeatured(sponsor.featured);
    setVerified(sponsor.verified);
    setActive(sponsor.active);
    setSortOrder(sponsor.sort_order);
    setBonusCode(sponsor.bonus_code || '');
    setBadgeText(sponsor.badge_text || '');
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

    const generatedSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, '-')
      : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const sponsorData: Partial<Sponsor> = {
      name,
      slug: generatedSlug,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      website_url: websiteUrl,
      button_text: buttonText,
      rating,
      short_description: shortDesc,
      description,
      featured,
      verified,
      active,
      sort_order: Number(sortOrder),
      bonus_code: bonusCode,
      badge_text: badgeText,
      min_deposit: minDeposit,
      withdrawal_speed: withdrawalSpeed,
      license,
      stats,
      features,
    };

    try {
      if (isNew) {
        await db.createSponsor(sponsorData as any);
        toast.success(`"${name}" sponsoru başarıyla oluşturuldu!`);
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

  const handleToggleFeatured = async (sponsor: Sponsor) => {
    soundEngine.playClick();
    const newFeatured = !sponsor.featured;
    await db.toggleSponsorFeatured(sponsor.id, newFeatured);
    toast.success(
      `${sponsor.name} ${newFeatured ? 'ÖNE ÇIKARILDI (VIP)' : 'Öne çıkarma kaldırıldı'}`
    );
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

  // Filtered sponsors
  const filteredSponsors = sponsors.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.bonus_code && s.bonus_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? s.active
        : statusFilter === 'passive'
        ? !s.active
        : s.featured;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-violet-400" />
            Sponsor Yönetimi & Aktif/Pasif Kontrolü
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Platformdaki tüm sponsor kartlarını yönetin, anlık aktif/pasif durumunu değiştirin ve detaylarını düzenleyin.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Sponsor Ekle</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30">
          <span className="text-xs text-slate-400 font-semibold">Kayıtlı Sponsor</span>
          <p className="text-xl font-black text-white mt-0.5">{sponsors.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#120b24] border border-emerald-800/30">
          <span className="text-xs text-slate-400 font-semibold">Yayında (Aktif)</span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">
            {sponsors.filter((s) => s.active).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#120b24] border border-rose-800/30">
          <span className="text-xs text-slate-400 font-semibold">Gizli (Pasif)</span>
          <p className="text-xl font-black text-rose-400 mt-0.5">
            {sponsors.filter((s) => !s.active).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#120b24] border border-amber-800/30">
          <span className="text-xs text-slate-400 font-semibold">Öne Çıkarılan (VIP)</span>
          <p className="text-xl font-black text-amber-400 mt-0.5">
            {sponsors.filter((s) => s.featured).length}
          </p>
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
            { id: 'active', label: `Aktif (${sponsors.filter((s) => s.active).length})` },
            { id: 'passive', label: `Pasif (${sponsors.filter((s) => !s.active).length})` },
            { id: 'featured', label: `Öne Çıkanlar (${sponsors.filter((s) => s.featured).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setStatusFilter(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
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
            <thead className="bg-violet-950/50 text-violet-300 uppercase text-[11px] font-bold border-b border-violet-900/40">
              <tr>
                <th className="px-4 py-3.5 w-14 text-center">Sıra</th>
                <th className="px-4 py-3.5">Logo & Sponsor</th>
                <th className="px-4 py-3.5">Bonus & İstatistikler</th>
                <th className="px-4 py-3.5">Puan</th>
                <th className="px-4 py-3.5">Tıklama</th>
                <th className="px-4 py-3.5 text-center">VIP Durumu</th>
                <th className="px-4 py-3.5 text-center">Yayın Durumu (Aktif/Pasif)</th>
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
                filteredSponsors.map((sponsor) => (
                  <tr
                    key={sponsor.id}
                    className={`hover:bg-violet-950/30 transition-colors ${
                      !sponsor.active ? 'opacity-65 bg-black/20' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-center font-bold text-slate-400">
                      #{sponsor.sort_order}
                    </td>
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
                          <span className="text-[11px] text-slate-400 font-mono">
                            /{sponsor.slug}
                          </span>
                        </div>
                      </div>
                    </td>
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
                    <td className="px-4 py-4 font-bold text-amber-400">
                      ★ {sponsor.rating?.toFixed(1) || '4.9'}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-300">
                      {sponsor.clicks_count || 0}
                    </td>

                    {/* VIP / Featured Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(sponsor)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 ${
                          sponsor.featured
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                            : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white'
                        }`}
                      >
                        <Award className="w-3 h-3" />
                        <span>{sponsor.featured ? 'Öne Çıkarıldı' : 'Standart'}</span>
                      </button>
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
                ))
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
              <h3 className="text-lg font-black text-white">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Logo Görsel URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Yönlendirme / Ortaklık Linki (Hedef URL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Buton Metni
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sıralama Önceliği
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
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
                <label className="flex items-center gap-2 text-xs text-amber-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded bg-violet-950 text-violet-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Öne Çıkarılan (VIP Rozet)</span>
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
