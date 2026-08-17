import React, { useEffect, useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { Sponsor } from '../types';
import { useData } from '../context/DataContext';
import { soundEngine } from '../lib/sound';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Star,
  ExternalLink,
  CheckCircle,
  Zap,
  CreditCard,
  Headphones,
  Award,
  ChevronRight,
  ArrowLeft,
  Copy,
  CheckCheck,
  Clock,
  Coins,
  Flame,
  Users,
  BadgeCheck,
  HelpCircle,
  Wallet,
} from 'lucide-react';

export const SponsorDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { activeSponsors } = useData();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchSponsor = async () => {
      setLoading(true);
      const data = await db.getSponsorBySlug(slug);
      setSponsor(data);
      setLoading(false);
    };
    fetchSponsor();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleJoinClick = () => {
    soundEngine.playClick();
    if (sponsor) {
      db.trackSponsorClick(sponsor.id);
      if (sponsor.website_url) {
        window.open(sponsor.website_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleCopyCode = () => {
    if (!sponsor?.bonus_code) return;
    navigator.clipboard.writeText(sponsor.bonus_code);
    soundEngine.playCopy();
    setCopied(true);
    toast.success(`${sponsor.name} Promosyon Kodu (${sponsor.bonus_code}) Kopyalandı!`);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Sponsor bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Sponsor Bulunamadı</h2>
        <p className="text-xs text-slate-400 mb-6">Aradığınız sponsor mevcut değil veya kaldırılmış.</p>
        <button
          onClick={() => navigate('/sponsors')}
          className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs"
        >
          Sponsorlar Sayfasına Dön
        </button>
      </div>
    );
  }

  const otherSponsors = activeSponsors.filter((s) => s.id !== sponsor.id).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <NavLink to="/" className="hover:text-white transition-colors">
          Ana Sayfa
        </NavLink>
        <ChevronRight className="w-3.5 h-3.5 text-violet-500" />
        <NavLink to="/sponsors" className="hover:text-white transition-colors">
          Sponsorlar
        </NavLink>
        <ChevronRight className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-violet-300 font-bold">{sponsor.name}</span>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-violet-800/30 bg-[#0d0918] shadow-2xl">
        {/* Cover Banner Image */}
        <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-gradient-to-r from-violet-950 via-[#160e2c] to-purple-950">
          <img
            src={sponsor.banner_url || sponsor.logo_url}
            alt={sponsor.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0918] via-[#0d0918]/60 to-transparent" />
        </div>

        {/* Profile Details Bar */}
        <div className="p-6 md:p-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            {/* Logo Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#160e2c] border-2 border-violet-500/50 p-3 shadow-2xl flex items-center justify-center flex-shrink-0">
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{sponsor.name}</h1>
                {sponsor.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Doğrulanmış Lisanslı Sponsor
                  </span>
                )}
                {sponsor.online_players && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/80 text-slate-300 text-xs font-semibold border border-violet-700/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {sponsor.online_players} Aktif Oyuncu
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {sponsor.short_description || sponsor.description}
              </p>
            </div>
          </div>

          {/* Right Action CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-950/60 border border-violet-800/30 text-amber-400 font-black text-sm">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{sponsor.rating?.toFixed(1) || '4.9'} / 5.0</span>
            </div>

            <button
              onClick={handleJoinClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-900/50 hover:scale-105 transition-all"
            >
              <span>{sponsor.button_text || 'SİTEYE GİT & KAZAN'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Code Exclusive Bar */}
      {sponsor.bonus_code && (
        <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-900/30 to-[#120b24] border-2 border-amber-400/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-violet-950 flex items-center justify-center font-black shadow-lg flex-shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                ÖZEL VIP KAMPANYA KODU
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Kayıt Olurken Bu Kodu Kullan, Ekstra %30 Bonus Kazan!
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="px-5 py-3 rounded-2xl bg-black/60 border border-amber-400/30 font-mono text-base font-black text-amber-200 tracking-widest text-center flex-1 sm:flex-initial">
              {sponsor.bonus_code}
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-violet-950 shadow-lg shadow-amber-500/30'
              }`}
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>KOPYALANDI</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>KODU KOPYALA</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Statistics Grid */}
      {sponsor.stats && sponsor.stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sponsor.stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30 text-center"
            >
              <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
              <p className="text-base sm:text-lg font-black text-amber-300 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Review and Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Platform Review */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-400" />
              Platform İncelemesi & Avantajları
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {sponsor.description ||
                `${sponsor.name}, lisanslı altyapısı ve sunduğu yüksek bonus oranlarıyla öne çıkan yetkili sponsorumuzdur. Çevrimsiz yatırım promosyonları ve 7/24 kesintisiz canlı destek hattıyla güvenli bir deneyim sunmaktadır.`}
            </p>

            <div className="pt-4 border-t border-violet-900/30">
              <h3 className="text-sm font-bold text-white mb-3">Öne Çıkan Özellikler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(sponsor.features || []).map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-violet-950/30 border border-violet-900/30 text-xs text-slate-200"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feat.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step-by-Step How to Register Guide */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Nasıl Üye Olunur ve Bonus Alınır?
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3 p-3.5 rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Sitemize Özel Link ile Giriş Yapın</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    "Siteye Git" butonuna tıklayarak resmi ve güncel adrese yönlenin.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Üyelik Formunu Doldurun & Kodu Girin</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kayıt formundaki promosyon kodu alanına <strong className="text-amber-300">{sponsor.bonus_code || 'VIP100'}</strong> yazın.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">İlk Yatırımınızı Yapın & Bonusu Kapın</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Minimum {sponsor.min_deposit || '50 ₺'} tutarında yatırım yaparak %100 hoş geldin bonusunuzu canlı destekten talep edin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Summary & Casino Specs Sidebar */}
        <div className="space-y-6">
          {/* Quick Specifications */}
          <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h3 className="text-sm font-bold text-white">Güvenilirlik & Lisans Bilgileri</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Lisans
                </span>
                <span className="font-bold text-emerald-400">{sponsor.license || 'Curacao eGaming'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  RTP Oranı
                </span>
                <span className="font-bold text-emerald-400">{sponsor.rtp_rate || '%97.8'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  Çekim Hızı
                </span>
                <span className="font-bold text-amber-300">{sponsor.withdrawal_speed || '3 - 15 Dakika'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-violet-400" />
                  Min. Yatırım
                </span>
                <span className="font-bold text-white">{sponsor.min_deposit || '50 ₺'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-violet-400" />
                  Canlı Destek
                </span>
                <span className="font-bold text-violet-300">7/24 Türkçe</span>
              </div>
            </div>

            {/* Accepted Payment Methods Chips */}
            {sponsor.payment_methods && sponsor.payment_methods.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Desteklenen Ödeme Yöntemleri</span>
                <div className="flex flex-wrap gap-1.5">
                  {sponsor.payment_methods.map((pm, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold text-slate-300 bg-violet-950/60 border border-violet-900/40 px-2 py-1 rounded-lg"
                    >
                      {pm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleJoinClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-900/50 transition-all flex items-center justify-center gap-2"
            >
              <span>{sponsor.button_text || 'Siteye Git'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Other Sponsors */}
      {otherSponsors.length > 0 && (
        <div className="pt-8 border-t border-violet-900/30">
          <h3 className="text-lg font-black text-white mb-4">Diğer Popüler Sponsorlar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherSponsors.map((other) => (
              <NavLink
                key={other.id}
                to={`/site/${other.slug}`}
                onClick={() => soundEngine.playClick()}
                className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30 hover:border-violet-500/50 transition-all flex items-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-xl bg-violet-950/60 p-2 flex items-center justify-center flex-shrink-0">
                  <img
                    src={other.logo_url}
                    alt={other.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-white group-hover:text-violet-300 truncate">
                    {other.name}
                  </span>
                  <span className="text-xs text-amber-400 font-semibold">
                    {other.stats?.[0]?.value || 'VIP Promosyon'}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

