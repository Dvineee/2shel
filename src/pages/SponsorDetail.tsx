import React, { useEffect, useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { Sponsor } from '../types';
import { useData } from '../context/DataContext';
import { soundEngine } from '../lib/sound';
import { toast } from 'sonner';
import {
  ShieldCheck,
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
  Flame,
  Users,
  BadgeCheck,
  HelpCircle,
  Wallet,
  Sparkles,
  Crown,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  XCircle,
} from 'lucide-react';
import { getSponsorCategory } from '../lib/sponsorUtils';
import { getSponsorPalette } from '../lib/colorExtractor';

export const SponsorDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { sponsors, activeSponsors } = useData();
  const [sponsor, setSponsor] = useState<Sponsor | null>(() => {
    return sponsors.find((s) => s.slug === slug || s.id === slug) || null;
  });
  const [loading, setLoading] = useState(!sponsor);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const palette = sponsor ? getSponsorPalette(sponsor) : null;

  useEffect(() => {
    if (!slug) return;
    const match = sponsors.find((s) => s.slug === slug || s.id === slug);
    if (match) {
      setSponsor(match);
      setLoading(false);
    } else {
      const fetchSponsor = async () => {
        setLoading(true);
        const data = await db.getSponsorBySlug(slug);
        setSponsor(data);
        setLoading(false);
      };
      fetchSponsor();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, sponsors]);

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
        <p className="text-xs text-slate-400">Sponsor bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Sponsor Bulunamadı</h2>
        <p className="text-xs text-slate-400 mb-6">Aradığınız sponsor mevcut değil veya yayından kaldırılmış.</p>
        <button
          onClick={() => navigate('/sponsors')}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Sponsorlar Sayfasına Dön
        </button>
      </div>
    );
  }

  // If detail page is disabled for this sponsor
  if (sponsor.has_detail_page === false) {
    return (
      <div className="py-12 sm:py-20 max-w-lg mx-auto text-center px-4">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#120b24] border border-violet-800/40 shadow-2xl space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-violet-950/80 p-3 mx-auto flex items-center justify-center border border-violet-700/40 shadow-inner">
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {sponsor.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Bu sponsor için özel inceleme sayfası devre dışı bırakılmıştır. Doğrudan resmi siteye erişebilirsiniz.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={handleJoinClick}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-violet-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{(sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR') ? sponsor.button_text : `${sponsor.name} Sitesine Git`}</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/sponsors')}
              className="w-full py-2.5 rounded-xl border border-violet-800/60 hover:bg-violet-900/30 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Tüm Sponsorları Görüntüle
            </button>
          </div>
        </div>
      </div>
    );
  }

  const otherSponsors = activeSponsors
    .filter((s) => s.id !== sponsor.id && s.has_detail_page !== false)
    .slice(0, 4);
  const cat = getSponsorCategory(sponsor);

  const defaultPaymentMethods = [
    'Papara',
    'Havale / EFT',
    'Kripto (USDT)',
    'Payfix',
    'Kredi Kartı',
    'Mefete',
  ];

  const paymentList =
    sponsor.payment_methods && sponsor.payment_methods.length > 0
      ? sponsor.payment_methods
      : defaultPaymentMethods;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400">
        <NavLink to="/" className="hover:text-white transition-colors">
          Ana Sayfa
        </NavLink>
        <ChevronRight className="w-3.5 h-3.5 text-violet-500" />
        <NavLink to="/sponsors" className="hover:text-white transition-colors">
          Sponsorlar
        </NavLink>
        <ChevronRight className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-violet-300 font-bold truncate max-w-[160px] sm:max-w-none">
          {sponsor.name}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-violet-800/30 bg-[#0d0918] shadow-2xl">
        {/* Cover Banner Image */}
        <div className="relative h-44 sm:h-60 md:h-68 w-full overflow-hidden bg-gradient-to-r from-[#190c2e] via-[#100720] to-[#0a0414]">
          {sponsor.banner_url ? (
            <img
              src={sponsor.banner_url}
              alt={sponsor.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
              <img
                src={sponsor.logo_url}
                alt=""
                className="w-full h-full object-cover scale-150 blur-3xl opacity-20"
              />
              <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0918] via-[#0d0918]/60 to-transparent" />
        </div>

        {/* Profile Details Bar */}
        <div className="p-4 sm:p-6 md:p-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-6">
            {/* Logo Box with ShelbyOnline Standardized Background System */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e0620] via-[#080314] to-[#04010a] border-2 border-violet-500/50 p-2.5 sm:p-3.5 shadow-2xl flex items-center justify-center shrink-0 relative overflow-hidden backdrop-blur-md">
              {/* Atmospheric Smoke Clouds */}
              <div className="absolute -inset-2 bg-[radial-gradient(ellipse_at_30%_40%,rgba(168,85,247,0.32)_0%,transparent_75%)] blur-xl pointer-events-none animate-smoke-1" />
              <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_70%_60%,rgba(192,38,211,0.28)_0%,transparent_80%)] blur-xl pointer-events-none animate-smoke-2" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35)_0%,rgba(88,28,135,0.1)_65%,transparent_85%)] pointer-events-none" />

              {/* Blurred Background Logo Atmosphere - High Visibility */}
              {sponsor.logo_url && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
                  <img
                    src={sponsor.logo_url}
                    alt=""
                    aria-hidden="true"
                    className="w-[95%] h-[95%] object-contain object-center filter blur-xl scale-125 opacity-60 brightness-110 saturate-175 contrast-125 select-none pointer-events-none"
                  />
                </div>
              )}

              {/* ShelbyOnline Subtle Background Watermark */}
              <div className="absolute -inset-6 flex flex-col items-center justify-center pointer-events-none overflow-hidden select-none -rotate-12 space-y-1 opacity-85">
                <span className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-violet-400/[0.045] uppercase whitespace-nowrap">
                  SHELBYONLINE &bull; SHELBYONLINE
                </span>
                <span className="text-[11px] sm:text-[13px] font-black tracking-[0.25em] text-white/[0.06] uppercase whitespace-nowrap">
                  SHELBYONLINE &bull; SHELBYONLINE
                </span>
                <span className="text-[15px] sm:text-[19px] font-black tracking-[0.2em] text-white/[0.09] uppercase whitespace-nowrap my-0.5">
                  SHELBYONLINE
                </span>
                <span className="text-[11px] sm:text-[13px] font-black tracking-[0.25em] text-white/[0.06] uppercase whitespace-nowrap">
                  SHELBYONLINE &bull; SHELBYONLINE
                </span>
                <span className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-violet-400/[0.045] uppercase whitespace-nowrap">
                  SHELBYONLINE &bull; SHELBYONLINE
                </span>
              </div>
              
              {sponsor.logo_url ? (
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="max-w-[90%] max-h-[82%] w-auto h-auto object-contain object-center drop-shadow-[0_8px_18px_rgba(0,0,0,0.95)] select-none"
                  />
                </div>
              ) : (
                <span className="relative z-10 text-sm font-black text-white">{sponsor.name}</span>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  {sponsor.name}
                </h1>
                {sponsor.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-bold border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Doğrulanmış Sponsor
                  </span>
                )}
                {sponsor.online_players && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-950/80 text-slate-300 text-[11px] sm:text-xs font-semibold border border-violet-700/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    {sponsor.online_players} Aktif Oyuncu
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {sponsor.short_description || sponsor.bonus_text || 'Lisanslı ve güvenilir bahis platformu.'}
              </p>
            </div>
          </div>

          {/* Right Action CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleJoinClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-900/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <span className="sm:hidden">
                {((sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR' ? sponsor.button_text : 'SİTEYE GİT & KAZAN').replace(/\s*&\s*KAZAN/gi, '').trim()) || 'SİTEYE GİT'}
              </span>
              <span className="hidden sm:inline">
                {(sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR') ? sponsor.button_text : 'SİTEYE GİT & KAZAN'}
              </span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Code Exclusive Bar */}
      {sponsor.bonus_code && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-[#0e071e] border border-violet-600/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-black tracking-widest text-violet-300 block">
                ÖZEL KAMPANYA KODU
              </span>
              <h3 className="text-xs sm:text-sm font-black text-white">
                {sponsor.bonus_headline ||
                  `Kayıt Olurken (${sponsor.bonus_code}) Kodunu Kullan, Özel Fırsatları Yakala!`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="px-4 py-2.5 rounded-xl bg-black/60 border border-violet-700/40 font-mono text-sm sm:text-base font-black text-violet-200 tracking-wider text-center flex-1 sm:flex-initial select-all">
              {sponsor.bonus_code}
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md'
              }`}
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>KOPYALANDI</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>KODU KOPYALA</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Statistics Grid */}
      {sponsor.stats && sponsor.stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {sponsor.stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#120b24] border border-violet-800/30 text-center flex flex-col justify-center"
            >
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                {stat.label}
              </span>
              <p className="text-sm sm:text-base font-black text-white mt-0.5 truncate">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Main Review and Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2 Cols: Detailed Overview, Pros & Cons, FAQs */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Detailed Platform Review */}
          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <Award className="w-5 h-5 text-violet-400 shrink-0" />
              Platform İncelemesi & Avantajları
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {sponsor.description ||
                `${sponsor.name}, lisanslı altyapısı ve sunduğu yüksek bonus oranlarıyla öne çıkan yetkili sponsorumuzdur. Çevrimsiz yatırım promosyonları ve 7/24 kesintisiz canlı destek hattıyla güvenli bir deneyim sunmaktadır.`}
            </p>

            {/* Feature Checklist */}
            {sponsor.features && sponsor.features.length > 0 && (
              <div className="pt-4 border-t border-violet-900/30">
                <h3 className="text-xs sm:text-sm font-black text-white mb-3 uppercase tracking-wider">
                  Öne Çıkan Özellikler
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sponsor.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-violet-950/30 border border-violet-900/30 text-xs text-slate-200"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pros & Cons Section (Artılar & Eksiler) */}
          {((sponsor.pros && sponsor.pros.length > 0) || (sponsor.cons && sponsor.cons.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pros */}
              {sponsor.pros && sponsor.pros.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#120b24] border border-emerald-800/30 space-y-3">
                  <h3 className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span>Platform Artıları</span>
                  </h3>
                  <ul className="space-y-2">
                    {sponsor.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cons */}
              {sponsor.cons && sponsor.cons.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#120b24] border border-rose-800/30 space-y-3">
                  <h3 className="text-xs sm:text-sm font-black text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-rose-400" />
                    <span>Platform Eksileri</span>
                  </h3>
                  <ul className="space-y-2">
                    {sponsor.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sıkça Sorulan Sorular (FAQ) */}
          {sponsor.faq && sponsor.faq.length > 0 && (
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <HelpCircle className="w-5 h-5 text-violet-400 shrink-0" />
                Sıkça Sorulan Sorular (SSS)
              </h2>
              <div className="space-y-2.5">
                {sponsor.faq.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl bg-violet-950/30 border border-violet-900/30 overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-violet-200 transition-colors cursor-pointer"
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-violet-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 text-xs text-slate-300 leading-relaxed border-t border-violet-900/20 pt-2.5">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step-by-Step How to Register Guide */}
          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <HelpCircle className="w-5 h-5 text-violet-400 shrink-0" />
              Nasıl Üye Olunur ve Bonus Alınır?
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Sitemize Özel Link ile Giriş Yapın
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    "{(sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR') ? sponsor.button_text : 'SİTEYE GİT'}" butonuna tıklayarak {sponsor.name} resmi ve güncel adresine yönlenin.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Üyelik Formunu Doldurun & Kodu Girin
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    {sponsor.bonus_code ? (
                      <>
                        Kayıt formundaki promosyon kodu alanına{' '}
                        <strong className="text-violet-300 font-bold">({sponsor.bonus_code})</strong> yazın.
                      </>
                    ) : (
                      'Kayıt formundaki bilgileri eksiksiz doldurarak üyeliğinizi hemen tamamlayın.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    İlk Yatırımınızı Yapın & Bonusu Kapın
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    {sponsor.min_deposit ? (
                      <>
                        Minimum <strong className="text-white">{sponsor.min_deposit}</strong> tutarında yatırım yaparak bonusunuzu canlı destekten veya promosyonlar sekmesinden talep edin.
                      </>
                    ) : (
                      'Hesabınıza ilk yatırımınızı gerçekleştirerek hoş geldin bonusunuzu anında hesabınıza tanımlatın.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Specifications Sidebar */}
        <div className="space-y-5 sm:space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Platform & İşlem Bilgileri
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  Çekim Hızı
                </span>
                <span className="font-bold text-white">{sponsor.withdrawal_speed || '3 - 15 Dakika'}</span>
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
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  Lisans
                </span>
                <span className="font-bold text-emerald-400">{sponsor.license || 'Curacao eGaming'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                  Ortalama RTP
                </span>
                <span className="font-bold text-amber-400">{sponsor.rtp_rate || '%97.8'}</span>
              </div>
              {sponsor.online_players && (
                <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    Aktif Oyuncu
                  </span>
                  <span className="font-bold text-white">{sponsor.online_players}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-violet-900/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-violet-400" />
                  Canlı Destek
                </span>
                <span className="font-bold text-violet-300">
                  {sponsor.live_support || '7/24 Türkçe Canlı Destek'}
                </span>
              </div>
            </div>

            {/* Accepted Payment Methods Chips */}
            {paymentList && paymentList.length > 0 && (
              <div className="pt-2 border-t border-violet-900/30">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">
                  Desteklenen Ödeme Yöntemleri
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {paymentList.map((pm, idx) => (
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
              className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{(sponsor.button_text && sponsor.button_text !== 'DETAYLARI GÖR') ? sponsor.button_text : 'SİTEYE GİT'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Other Sponsors */}
      {otherSponsors.length > 0 && (
        <div className="pt-6 sm:pt-8 border-t border-violet-900/30">
          <h3 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4 uppercase tracking-wider">
            Diğer Popüler Sponsorlar
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {otherSponsors.map((other) => (
              <NavLink
                key={other.id}
                to={`/site/${other.slug}`}
                onClick={() => soundEngine.playClick()}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#120b24] border border-violet-800/30 hover:border-violet-500/50 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-violet-950/60 p-2 flex items-center justify-center shrink-0">
                  <img
                    src={other.logo_url}
                    alt={other.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="truncate w-full">
                  <span className="text-xs sm:text-sm font-black text-white group-hover:text-violet-300 truncate block uppercase">
                    {other.name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate block mt-0.5">
                    {other.stats?.[0]?.value || other.bonus_text || 'Özel Promosyon'}
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
