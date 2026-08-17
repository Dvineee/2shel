import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import {
  getStoredSupabaseConfig,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  SUPABASE_SQL_SCHEMA,
} from '../../lib/supabase';
import { SiteSetting, SocialLink, StreakDayConfig } from '../../types';
import { initialSiteSettings } from '../../lib/initialData';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Send,
  Globe,
  Mail,
  Bot,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Megaphone,
  Coins,
  Database,
  Activity,
  HardDrive,
  Server,
  AlertCircle,
  Clock,
  Link,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Eye,
  Sparkles,
  RotateCcw,
  Wand2,
  Flame,
  Trophy,
  Gift,
  X,
  Disc,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';

export const SettingsManager: React.FC = () => {
  const { settings, socialLinks, refreshAll, updateSettings } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);

  // Supabase Configuration State
  const initialSupaConfig = getStoredSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(initialSupaConfig.url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(initialSupaConfig.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [seedingDb, setSeedingDb] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  // Loading and dirty state
  const [isSaving, setIsSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // 7-Day Streak In-Place Modal State
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [streakEnabled, setStreakEnabled] = useState<boolean>(settings.streak_bonus_enabled ?? true);
  const [streakDays, setStreakDays] = useState<StreakDayConfig[]>(
    settings.streak_rewards && settings.streak_rewards.length === 7
      ? settings.streak_rewards
      : (initialSiteSettings.streak_rewards || [
          { day: 1, reward_coins: 50, label: '50 Coin' },
          { day: 2, reward_coins: 100, label: '100 Coin' },
          { day: 3, reward_coins: 150, label: '150 Coin' },
          { day: 4, reward_coins: 200, label: '200 Coin' },
          { day: 5, reward_coins: 300, label: '300 Coin' },
          { day: 6, reward_coins: 500, label: '500 Coin' },
          { day: 7, reward_coins: 1000, label: '1000 VIP + Sandık', vip: true },
        ])
  );
  const [savingStreakInModal, setSavingStreakInModal] = useState(false);

  // Database Diagnostics State
  const [testingDb, setTestingDb] = useState(false);
  const [dbDiagResult, setDbDiagResult] = useState<{
    connected: boolean;
    type: 'supabase' | 'local';
    latencyMs: number;
    message: string;
    stats?: {
      sponsorsCount: number;
      profilesCount: number;
      giveawaysCount: number;
      settingsFound: boolean;
    };
  } | null>(null);

  // Settings Form State
  const [siteName, setSiteName] = useState(settings.site_name || 'SHELBYONLINE');
  const [siteTitle, setSiteTitle] = useState(settings.site_title || 'ShelbyOnline | Premium Sponsor Platformu');
  const [siteDescription, setSiteDescription] = useState(settings.site_description || '');
  const [logoTagline, setLogoTagline] = useState(settings.logo_tagline || 'PREMIUM SPONSOR & GAMING NETWORK');
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');
  const [supportEmail, setSupportEmail] = useState(settings.support_email || 'destek@shelbyonline.com');
  const [footerText, setFooterText] = useState(settings.footer_text || '');
  const [telegramChannel, setTelegramChannel] = useState(settings.telegram_channel_url || settings.telegram_url || 'https://t.me/shelbyonline');
  const [telegramChat, setTelegramChat] = useState(settings.telegram_chat_url || 'https://t.me/shelbyonline_chat');
  const [twitterUrl, setTwitterUrl] = useState(settings.twitter_url || '');
  const [instagramUrl, setInstagramUrl] = useState(settings.instagram_url || '');

  // Announcement Banner
  const [announcementEnabled, setAnnouncementEnabled] = useState(settings.announcement_enabled ?? true);
  const [announcementText, setAnnouncementText] = useState(
    settings.announcement_text || '🔥 Yeni Sezon Çekilişi Başladı! Telegram ile giriş yapıp +250 Hoş Geldin Coini anında kapın!'
  );
  const [announcementLink, setAnnouncementLink] = useState(settings.announcement_link || '/giveaways');
  const [announcementBadge, setAnnouncementBadge] = useState(settings.announcement_badge || 'YENİ ETKİNLİK');

  // Economy & Coins
  const [welcomeCoins, setWelcomeCoins] = useState(settings.welcome_coin_bonus || 250);
  const [dailySpins, setDailySpins] = useState(settings.daily_wheel_free_spins || 1);

  // Telegram Bot Settings
  const [botUsername, setBotUsername] = useState(settings.telegram_bot_username || 'ShelbyOnlineBot');
  const [botToken, setBotToken] = useState(settings.telegram_bot_token || '');
  const [botUrl, setBotUrl] = useState(settings.telegram_bot_url || 'https://t.me/ShelbyOnlineBot');
  const [telegramLoginEnabled, setTelegramLoginEnabled] = useState(settings.telegram_login_enabled ?? true);

  // Social Links state
  const [links, setLinks] = useState<SocialLink[]>(socialLinks);

  // Synchronize form when settings are first loaded
  useEffect(() => {
    if (!isInitializedRef.current && settings.site_name) {
      setSiteName(settings.site_name || 'SHELBYONLINE');
      setSiteTitle(settings.site_title || 'ShelbyOnline | Premium Sponsor Platformu');
      setSiteDescription(settings.site_description || '');
      setLogoTagline(settings.logo_tagline || 'PREMIUM SPONSOR & GAMING NETWORK');
      setLogoUrl(settings.logo_url || '');
      setSupportEmail(settings.support_email || 'destek@shelbyonline.com');
      setFooterText(settings.footer_text || '');
      setTelegramChannel(settings.telegram_channel_url || settings.telegram_url || 'https://t.me/shelbyonline');
      setTelegramChat(settings.telegram_chat_url || 'https://t.me/shelbyonline_chat');
      setTwitterUrl(settings.twitter_url || '');
      setInstagramUrl(settings.instagram_url || '');
      setAnnouncementEnabled(settings.announcement_enabled ?? true);
      setAnnouncementText(settings.announcement_text || '🔥 Yeni Sezon Çekilişi Başladı! Telegram ile giriş yapıp +250 Hoş Geldin Coini anında kapın!');
      setAnnouncementLink(settings.announcement_link || '/giveaways');
      setAnnouncementBadge(settings.announcement_badge || 'YENİ ETKİNLİK');
      setWelcomeCoins(settings.welcome_coin_bonus || 250);
      setDailySpins(settings.daily_wheel_free_spins || 1);
      if (settings.streak_rewards && settings.streak_rewards.length === 7) {
        setStreakDays(settings.streak_rewards);
      }
      if (settings.streak_bonus_enabled !== undefined) {
        setStreakEnabled(settings.streak_bonus_enabled);
      }
      setBotUsername(settings.telegram_bot_username || 'ShelbyOnlineBot');
      setBotToken(settings.telegram_bot_token || '');
      setBotUrl(settings.telegram_bot_url || 'https://t.me/ShelbyOnlineBot');
      setTelegramLoginEnabled(settings.telegram_login_enabled ?? true);
      setLinks(socialLinks);
      isInitializedRef.current = true;
    }
  }, [settings, socialLinks]);

  const handleResetToSaved = () => {
    soundEngine.playClick();
    setSiteName(settings.site_name || 'SHELBYONLINE');
    setSiteTitle(settings.site_title || 'ShelbyOnline | Premium Sponsor Platformu');
    setSiteDescription(settings.site_description || '');
    setLogoTagline(settings.logo_tagline || 'PREMIUM SPONSOR & GAMING NETWORK');
    setLogoUrl(settings.logo_url || '');
    setSupportEmail(settings.support_email || 'destek@shelbyonline.com');
    setFooterText(settings.footer_text || '');
    setTelegramChannel(settings.telegram_channel_url || settings.telegram_url || 'https://t.me/shelbyonline');
    setTelegramChat(settings.telegram_chat_url || 'https://t.me/shelbyonline_chat');
    setTwitterUrl(settings.twitter_url || '');
    setInstagramUrl(settings.instagram_url || '');
    setAnnouncementEnabled(settings.announcement_enabled ?? true);
    setAnnouncementText(settings.announcement_text || '🔥 Yeni Sezon Çekilişi Başladı! Telegram ile giriş yapıp +250 Hoş Geldin Coini anında kapın!');
    setAnnouncementLink(settings.announcement_link || '/giveaways');
    setAnnouncementBadge(settings.announcement_badge || 'YENİ ETKİNLİK');
    setWelcomeCoins(settings.welcome_coin_bonus || 250);
    setDailySpins(settings.daily_wheel_free_spins || 1);
    setBotUsername(settings.telegram_bot_username || 'ShelbyOnlineBot');
    setBotToken(settings.telegram_bot_token || '');
    setBotUrl(settings.telegram_bot_url || 'https://t.me/ShelbyOnlineBot');
    setTelegramLoginEnabled(settings.telegram_login_enabled ?? true);
    setLinks(socialLinks);
    toast.info('Formdaki değişiklikler son kaydedilen ayarlara sıfırlandı.');
  };

  const handleFillDemoValues = () => {
    soundEngine.playClick();
    setSiteName('SHELBYONLINE');
    setSiteTitle('ShelbyOnline | Doğrulanmış Sponsor & Bonus Platformu');
    setSiteDescription('En yüksek deneme bonusları, VIP sponsorluklar ve haftalık dev nakit çekilişlerinin buluşma noktası.');
    setLogoTagline('PREMIUM GAMING & SPONSOR NETWORK');
    setSupportEmail('destek@shelbyonline.com');
    setAnnouncementEnabled(true);
    setAnnouncementBadge('DEV KAMPANYA');
    setAnnouncementText('🎁 Telegram ile bağlanın, anında 250 Coin ve 1 Ücretsiz Çark hakkı kazanın!');
    setAnnouncementLink('/wheel');
    setWelcomeCoins(250);
    setDailySpins(1);
    toast.success('Örnek şablon bilgileri forma yerleştirildi. "Tüm Ayarları Kaydet" butonuna basabilirsiniz.');
  };

  const runDbTest = async (showToast = true) => {
    setTestingDb(true);
    try {
      const res = await db.testConnection();
      setDbDiagResult(res);
      if (showToast) {
        if (res.connected) {
          toast.success(`Supabase veritabanı bağlantısı başarılı! (${res.latencyMs}ms)`);
        } else {
          toast.error(`Veritabanı bağlantı uyarısı: ${res.message}`);
        }
      }
    } catch (err: any) {
      setDbDiagResult({
        connected: false,
        type: getStoredSupabaseConfig().isConfigured ? 'supabase' : 'local',
        latencyMs: 0,
        message: err?.message || 'Bağlantı testi başarısız oldu.',
      });
      if (showToast) toast.error('Veritabanı testi çalıştırılamadı');
    } finally {
      setTestingDb(false);
    }
  };

  useEffect(() => {
    runDbTest(false);
  }, []);

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      toast.error('Lütfen geçerli bir Supabase URL ve Anon Key giriniz.');
      return;
    }

    try {
      saveSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      soundEngine.playWin();
      toast.success('Supabase bağlantı bilgileri kaydedildi. Bağlantı test ediliyor...');
      await runDbTest(true);
      await refreshAll();
    } catch (err) {
      toast.error('Bağlantı kaydedilemedi');
    }
  };

  const handleResetSupabaseConfig = async () => {
    if (confirm('Supabase bağlantısını kaldırmak ve yerel veritabanı moduna geçmek istiyor musunuz?')) {
      clearSupabaseCredentials();
      setSupabaseUrlInput('');
      setSupabaseKeyInput('');
      soundEngine.playClick();
      toast.info('Supabase bağlantısı kaldırıldı.');
      await runDbTest(true);
      await refreshAll();
    }
  };

  const handleCopySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    soundEngine.playClick();
    toast.success('Supabase SQL Şeması panoya kopyalandı! Supabase Dashboard > SQL Editor alanına yapıştırıp RUN yapabilirsiniz.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSeedSupabase = async () => {
    if (!getStoredSupabaseConfig().isConfigured) {
      toast.error('Lütfen önce Supabase URL ve Anon Key bilgilerini kaydediniz.');
      return;
    }

    setSeedingDb(true);
    try {
      const res = await db.seedSupabaseDatabase();
      if (res.success) {
        soundEngine.playWin();
        toast.success(res.message);
        await runDbTest(false);
        await refreshAll();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(`Aktarım hatası: ${err?.message || 'Bilinmeyen hata'}`);
    } finally {
      setSeedingDb(false);
    }
  };

  const handleProcessLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, SVG, WebP, GIF)');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      toast.warning('Görsel boyutu 2.5MB üzerinde. Web sitesi hızı için optimize edilmiş şeffaf PNG veya SVG önerilir.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        soundEngine.playWin();
        toast.success(`"${file.name}" logosu yüklendi! "Tüm Ayarları Kaydet" butonuna basarak yayınlayabilirsiniz.`);
      }
    };
    reader.onerror = () => {
      toast.error('Görsel okunurken bir hata oluştu.');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleRemoveLogo = () => {
    soundEngine.playClick();
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Logo görseli kaldırıldı. Varsayılan tipografik logo aktif edildi.');
  };

  // Master Save Handler: Saves all settings & social links safely
  // Streak in-modal handlers
  const handleStreakDayChange = (dayIndex: number, field: keyof StreakDayConfig, value: any) => {
    const updated = [...streakDays];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value,
    };
    if (field === 'reward_coins' && (!updated[dayIndex].label || updated[dayIndex].label.includes('Coin'))) {
      if (updated[dayIndex].vip) {
        updated[dayIndex].label = `${value} VIP + Sandık`;
      } else {
        updated[dayIndex].label = `${value} Coin`;
      }
    }
    setStreakDays(updated);
  };

  const applyStreakPreset = (preset: 'balanced' | 'generous' | 'starter') => {
    soundEngine.playClick();
    if (preset === 'balanced') {
      setStreakDays([
        { day: 1, reward_coins: 50, label: '50 Coin' },
        { day: 2, reward_coins: 100, label: '100 Coin' },
        { day: 3, reward_coins: 150, label: '150 Coin' },
        { day: 4, reward_coins: 200, label: '200 Coin' },
        { day: 5, reward_coins: 300, label: '300 Coin' },
        { day: 6, reward_coins: 500, label: '500 Coin' },
        { day: 7, reward_coins: 1000, label: '1000 VIP + Sandık', vip: true },
      ]);
      toast.success('Dengeli Giriş Bonusu Şablonu Yüklendi');
    } else if (preset === 'generous') {
      setStreakDays([
        { day: 1, reward_coins: 100, label: '100 Coin' },
        { day: 2, reward_coins: 200, label: '200 Coin' },
        { day: 3, reward_coins: 350, label: '350 Coin' },
        { day: 4, reward_coins: 500, label: '500 Coin' },
        { day: 5, reward_coins: 750, label: '750 Coin' },
        { day: 6, reward_coins: 1200, label: '1200 Coin' },
        { day: 7, reward_coins: 2500, label: '2500 VIP + Süper Sandık', vip: true },
      ]);
      toast.success('Yüksek Ödüllü VIP Şablonu Yüklendi');
    } else if (preset === 'starter') {
      setStreakDays([
        { day: 1, reward_coins: 25, label: '25 Coin' },
        { day: 2, reward_coins: 50, label: '50 Coin' },
        { day: 3, reward_coins: 75, label: '75 Coin' },
        { day: 4, reward_coins: 100, label: '100 Coin' },
        { day: 5, reward_coins: 150, label: '150 Coin' },
        { day: 6, reward_coins: 250, label: '250 Coin' },
        { day: 7, reward_coins: 500, label: '500 VIP Bonus', vip: true },
      ]);
      toast.success('Ekonomik Başlangıç Şablonu Yüklendi');
    }
  };

  const handleSaveStreakInModal = async () => {
    setSavingStreakInModal(true);
    try {
      await updateSettings({
        streak_bonus_enabled: streakEnabled,
        streak_rewards: streakDays,
      });
      soundEngine.playWin();
      toast.success('7 Günlük Giriş Bonusu ödülleri başarıyla kaydedildi!');
      await refreshAll();
      setIsStreakModalOpen(false);
    } catch {
      toast.error('Ödüller kaydedilirken bir hata oluştu.');
    } finally {
      setSavingStreakInModal(false);
    }
  };

  const handleSaveAll = async (sectionName?: string) => {
    soundEngine.playClick();
    setIsSaving(true);
    setSavingSection(sectionName || 'all');

    const updated: SiteSetting = {
      ...settings,
      site_name: siteName.trim() || 'SHELBYONLINE',
      logo_text: siteName.trim() || 'SHELBYONLINE',
      site_title: siteTitle.trim() || 'ShelbyOnline | Premium Sponsor Platformu',
      site_description: siteDescription.trim(),
      logo_tagline: logoTagline.trim(),
      logo_url: logoUrl.trim(),
      support_email: supportEmail.trim() || 'destek@shelbyonline.com',
      footer_text: footerText.trim(),
      telegram_channel_url: telegramChannel.trim(),
      telegram_url: telegramChannel.trim(),
      telegram_chat_url: telegramChat.trim(),
      twitter_url: twitterUrl.trim(),
      instagram_url: instagramUrl.trim(),
      telegram_bot_username: botUsername.replace('@', '').trim(),
      telegram_bot_token: botToken.trim(),
      telegram_bot_url: botUrl.trim(),
      telegram_login_enabled: telegramLoginEnabled,
      announcement_enabled: announcementEnabled,
      announcement_text: announcementText.trim(),
      announcement_link: announcementLink.trim() || '/giveaways',
      announcement_badge: announcementBadge.trim() || 'YENİ',
      welcome_coin_bonus: Number(welcomeCoins) || 250,
      daily_wheel_free_spins: Number(dailySpins) || 1,
      streak_bonus_enabled: streakEnabled,
      streak_rewards: streakDays,
    };

    try {
      await updateSettings(updated);
      if (links && links.length > 0) {
        await db.setSocialLinks(links);
      }
      soundEngine.playWin();
      toast.success(
        sectionName
          ? `✅ ${sectionName} başarıyla güncellendi!`
          : '🎉 Site Ayarları, Telegram Botu ve Sosyal Linkler başarıyla kaydedildi!'
      );
      await refreshAll();
    } catch (err: any) {
      console.error('Settings save error:', err);
      toast.error(err?.message || 'Ayarlar kaydedilirken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
      setSavingSection(null);
    }
  };

  const handleAddSocial = () => {
    soundEngine.playClick();
    const newLink: SocialLink = {
      id: 'social_' + Date.now(),
      platform: 'telegram',
      title: 'Telegram Sohbet',
      subtitle: '+25.000 Aktif Üye',
      url: 'https://t.me/shelbyonline_chat',
      icon: 'Send',
      active: true,
      sort_order: links.length + 1,
    };
    setLinks([...links, newLink]);
  };

  const handleSocialChange = (index: number, field: keyof SocialLink, value: any) => {
    const updated = [...links];
    (updated[index] as any)[field] = value;
    setLinks(updated);
  };

  const handleRemoveSocial = (index: number) => {
    soundEngine.playClick();
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl pb-24">
      {/* Top Header & Global Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#120b24] via-[#160c33] to-[#0d071e] p-6 rounded-3xl border border-violet-800/40 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-violet-400" />
            Site Ayarları & Özelleştirme Merkezi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Marka ismi, logo, üst duyuru çubuğu, Telegram Botu ve sosyal medya butonlarını anında güncelleyin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFillDemoValues}
            className="px-3 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/80 border border-violet-700/50 text-violet-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Örnek Bilgileri Yükle"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Örnek Bilgiler</span>
          </button>

          <button
            type="button"
            onClick={handleResetToSaved}
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Formu Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Geri Al</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-950 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* 1. Üst Duyuru & Kampanya Şeridi */}
      <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-900/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-300 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Üst Duyuru & Kampanya Şeridi</h2>
              <p className="text-xs text-slate-400">Web sitesinin en üstünde dikkat çekici duyuru bandı.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-violet-700 bg-slate-900 text-violet-600 focus:ring-0 cursor-pointer"
              />
              <span>Duyuru Çubuğu Aktif</span>
            </label>

            <button
              type="button"
              onClick={() => handleSaveAll('Duyuru Ayarları')}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving && savingSection === 'Duyuru Ayarları' ? 'Kaydediliyor...' : 'Duyuruyu Kaydet'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-3">
            <label className="block text-slate-300 font-semibold mb-1">Rozet Metni</label>
            <input
              type="text"
              value={announcementBadge}
              onChange={(e) => setAnnouncementBadge(e.target.value)}
              placeholder="YENİ ETKİNLİK"
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-bold focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-6">
            <label className="block text-slate-300 font-semibold mb-1">Duyuru Metni</label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Duyuru içeriği..."
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-slate-300 font-semibold mb-1">Tıklama Linki (URL)</label>
            <input
              type="text"
              value={announcementLink}
              onChange={(e) => setAnnouncementLink(e.target.value)}
              placeholder="/giveaways"
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-mono text-xs focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Telegram Bot Entegrasyon Ayarları */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e172b] via-[#120b24] to-[#070510] border border-[#24A1DE]/40 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#24A1DE] to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-[#24A1DE]/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Telegram Bot & Doğrulama Ayarları
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  AKTİF SİSTEM
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Kullanıcıların Telegram hesaplarıyla tek tıkla giriş yapmasını ve profil fotoğrafı çekmesini sağlar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAll('Telegram Bot Ayarları')}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg bg-[#24A1DE] hover:bg-[#208fca] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving && savingSection === 'Telegram Bot Ayarları' ? 'Kaydediliyor...' : 'Bot Ayarlarını Kaydet'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-200 font-semibold mb-1">
              Telegram Bot Kullanıcı Adı
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold">@</span>
              <input
                type="text"
                value={botUsername.replace('@', '')}
                onChange={(e) => {
                  const clean = e.target.value.replace('@', '');
                  setBotUsername(clean);
                  setBotUrl(`https://t.me/${clean}`);
                }}
                placeholder="ShelbyOnlineBot"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#090514] border border-cyan-800/40 text-white font-mono font-bold focus:outline-none focus:border-[#24A1DE]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1">
              Telegram Bot Deep-Link URL
            </label>
            <input
              type="text"
              value={botUrl}
              onChange={(e) => setBotUrl(e.target.value)}
              placeholder="https://t.me/ShelbyOnlineBot"
              className="w-full p-2.5 rounded-xl bg-[#090514] border border-cyan-800/40 text-white font-mono text-xs focus:outline-none focus:border-[#24A1DE]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-bold text-xs">
            <input
              type="checkbox"
              checked={telegramLoginEnabled}
              onChange={(e) => setTelegramLoginEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-violet-700 bg-slate-900 text-[#24A1DE] focus:ring-0 cursor-pointer"
            />
            <span>Telegram ile Doğrulanmış Giriş Modülü Aktif</span>
          </label>
        </div>
      </div>

      {/* 3. Genel Marka, Logo & İletişim Bilgileri */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-900/30 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" />
            Genel Marka, Logo & İletişim Bilgileri
          </h2>

          <button
            type="button"
            onClick={() => handleSaveAll('Marka ve Logo Ayarları')}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving && savingSection === 'Marka ve Logo Ayarları' ? 'Kaydediliyor...' : 'Marka Ayarlarını Kaydet'}</span>
          </button>
        </div>

        {/* LOGO UPLOAD & BRAND IDENTITY SECTION */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#100a26] via-[#160c33] to-[#0d071e] border border-violet-600/40 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Web Sitesi Logo Yükleme & Marka Görseli
                  <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold">
                    CANLI YAYIN
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Üst menü (Header), sol kenar çubuğu (Sidebar) ve alt bilgide (Footer) yayınlanacak ana logo.
                </p>
              </div>
            </div>

            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Logoyu Kaldır</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Upload Area & Direct URL Input */}
            <div className="lg:col-span-7 space-y-3">
              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(true);
                }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={handleLogoDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  isDraggingLogo
                    ? 'border-violet-400 bg-violet-900/30 scale-[1.01]'
                    : 'border-violet-700/50 hover:border-violet-500/80 bg-[#090514]/70 hover:bg-[#0d0820]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp, image/gif"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-950/60">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Bilgisayarınızdan / Telefonunuzdan Logo Seçin
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    veya görsel dosyasını buraya sürükleyip bırakın
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-violet-300/80 font-medium">
                  <span className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/40">PNG</span>
                  <span className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/40">SVG</span>
                  <span className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/40">WEBP</span>
                  <span className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/40">JPG</span>
                  <span className="text-slate-500">• Önerilen: Şeffaf (Transparent) Arka Plan</span>
                </div>
              </div>

              {/* Direct Image URL Option */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Veya Direkt Logo Görsel URL'si Girin
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://siteniz.com/logo.png veya https://i.imgur.com/..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090514] border border-violet-800/40 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Dual Preview Card */}
            <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-[#080512] border border-violet-900/50 space-y-3">
              <div className="flex items-center justify-between border-b border-violet-900/30 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Eye className="w-3.5 h-3.5 text-violet-400" />
                  <span>Canlı Logo Önizleme</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {logoUrl ? 'Özel Logo Aktif' : 'Tipografik Rozet Aktif'}
                </span>
              </div>

              {/* Navbar / Dark Header Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Üst Menüde Görünüm (Koyu Tema)
                </span>
                <div className="h-14 px-4 rounded-xl bg-[#0b0816] border border-violet-900/40 flex items-center justify-between">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Önizleme"
                      className="h-8 max-w-[170px] object-contain"
                      onError={() => toast.error('Girilen logo URL adresi yüklenemedi.')}
                    />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-sm text-white tracking-wider">
                        {siteName || 'SHELBYONLINE'}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    Menü Barı
                  </span>
                </div>
              </div>

              {/* Light/Checkered Background Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Şeffaflık & Detay Kontrolü
                </span>
                <div
                  className="h-14 px-4 rounded-xl flex items-center justify-center border border-slate-700/50"
                  style={{
                    backgroundImage:
                      'radial-gradient(#334155 1px, transparent 1px), radial-gradient(#334155 1px, #0f172a 1px)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 6px 6px',
                  }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Detay Önizleme" className="h-8 max-w-[180px] object-contain" />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Henüz özel bir logo yüklenmedi
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-tight">
                💡 <span className="text-slate-300 font-semibold">İpucu:</span> Yatay orantılı (örnek: 200x50 piksel) ve şeffaf PNG logolar tüm cihazlarda en yüksek netlikte görünür.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Site Adı</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-bold focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Logo Alt Sloganı</label>
            <input
              type="text"
              value={logoTagline}
              onChange={(e) => setLogoTagline(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Destek E-posta Adresi</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tarayıcı Başlığı (Site Title)</label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-medium focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Site Açıklaması (Meta Description)</label>
            <input
              type="text"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Economy & Coins Section */}
        <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-900/30 space-y-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-amber-300">Ekonomi, Bakiye & Çark Hakları</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Telegram Girişi Hoş Geldin Coin Bonusu
              </label>
              <input
                type="number"
                value={welcomeCoins}
                onChange={(e) => setWelcomeCoins(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-amber-500/40 text-amber-300 font-bold text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Günlük Ücretsiz Çark Çevirme Hakkı
              </label>
              <input
                type="number"
                value={dailySpins}
                onChange={(e) => setDailySpins(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white font-bold text-xs focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔥</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">7 Günlük Giriş Serisi Bonusu</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${streakEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                    {streakEnabled ? 'Aktif (1-7. Gün)' : 'Pasif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Her gün için belirlenen Coin ödülleri ve 7. gün VIP büyük ödülü.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsStreakModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-violet-950 font-black text-xs transition-all shadow-md shadow-amber-950/40 hover:scale-105 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ödülleri Düzenle</span>
              </button>

              <RouterLink
                to="/admin/wheel?tab=streak"
                className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900 border border-violet-700/50 text-violet-200 font-bold text-xs transition-all hover:text-white flex items-center gap-1"
              >
                <span>Çark & Seri Sayfası →</span>
              </RouterLink>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Telegram Resmi Duyuru Kanalı URL</label>
            <input
              type="text"
              value={telegramChannel}
              onChange={(e) => setTelegramChannel(e.target.value)}
              placeholder="https://t.me/shelbyonline"
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Telegram VIP Sohbet Grubu URL</label>
            <input
              type="text"
              value={telegramChat}
              onChange={(e) => setTelegramChat(e.target.value)}
              placeholder="https://t.me/shelbyonline_chat"
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">X / Twitter Hesabı URL</label>
            <input
              type="text"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/shelbyonline"
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Instagram Hesabı URL</label>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/shelbyonline"
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-slate-300 font-semibold mb-1">Footer Açıklama Metni</label>
          <textarea
            rows={2}
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Telegram & Topluluk Butonları */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-900/30 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Topluluk Butonları & Hızlı Linkler
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSocial}
              className="px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Buton Ekle
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll('Sosyal Linkler')}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving && savingSection === 'Sosyal Linkler' ? 'Kaydediliyor...' : 'Linkleri Kaydet'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={link.id || idx} className="p-3.5 rounded-2xl bg-[#0d0918] border border-violet-800/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <div className="sm:col-span-3">
                <label className="block text-[10px] text-slate-400 mb-0.5">Başlık</label>
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => handleSocialChange(idx, 'title', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#160e2e] border border-violet-800/30 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] text-slate-400 mb-0.5">Alt Metin</label>
                <input
                  type="text"
                  value={link.subtitle || ''}
                  onChange={(e) => handleSocialChange(idx, 'subtitle', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#160e2e] border border-violet-800/30 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] text-slate-400 mb-0.5">Yönlendirme URL'si</label>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#160e2e] border border-violet-800/30 text-white text-xs focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-3 sm:pt-0">
                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={link.active}
                    onChange={(e) => handleSocialChange(idx, 'active', e.target.checked)}
                    className="rounded border-violet-700 bg-slate-900 text-violet-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Aktif</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial(idx)}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Database Connection & Infrastructure Status Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#120b24] via-[#100c22] to-[#070510] border border-violet-800/40 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Supabase PostgreSQL Bulut Veritabanı</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border flex items-center gap-1 ${
                    dbDiagResult?.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dbDiagResult?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {dbDiagResult?.connected ? 'Supabase Bağlantısı Aktif' : 'Yapılandırma Gerekli'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {getStoredSupabaseConfig().isConfigured
                  ? 'Supabase PostgreSQL Bulut Motoru ile canlı ve kalıcı veri senkronizasyonu devrede.'
                  : 'Supabase URL ve Anon Key bilgilerinizi girerek doğrudan PostgreSQL bulut veritabanınıza bağlanın.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => runDbTest(true)}
              disabled={testingDb}
              className="px-4 py-2 rounded-xl bg-violet-700/80 hover:bg-violet-600 border border-violet-500/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
              <span>{testingDb ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#090514] border border-violet-900/40 flex items-center gap-3">
            <Server className="w-4 h-4 text-violet-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Aktif Motor</span>
              <span className="font-bold text-slate-200">
                {getStoredSupabaseConfig().isConfigured ? 'Supabase PostgreSQL (Cloud)' : 'Yerel Yedekleme Modu'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#090514] border border-violet-900/40 flex items-center gap-3">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Tepki Süresi (Ping)</span>
              <span className="font-bold text-cyan-300">
                {dbDiagResult ? `${dbDiagResult.latencyMs} ms` : 'Ölçülüyor...'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#090514] border border-violet-900/40 flex items-center gap-3">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Kayıtlı Sponsor / Çekiliş</span>
              <span className="font-bold text-amber-300">
                {dbDiagResult?.stats
                  ? `${dbDiagResult.stats.sponsorsCount} Sponsor / ${dbDiagResult.stats.giveawaysCount} Çekiliş`
                  : 'Yükleniyor...'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#090514] border border-violet-900/40 flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Senkronizasyon</span>
              <span className="font-bold text-emerald-300">Tam & Çift Katmanlı</span>
            </div>
          </div>
        </div>

        {/* Supabase Config Form */}
        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-cyan-400" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                required
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white font-mono text-xs placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Supabase Anon Public Key</span>
              </label>
              <input
                type="text"
                required
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white font-mono text-xs placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Supabase'e Bağlan ve Kaydet</span>
              </button>

              {getStoredSupabaseConfig().isConfigured && (
                <button
                  type="button"
                  onClick={handleResetSupabaseConfig}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bağlantıyı Kaldır</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySqlSchema}
                className="px-4 py-2.5 rounded-xl bg-violet-900/60 hover:bg-violet-800 border border-violet-700/60 text-violet-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-violet-300" />}
                <span>{copiedSql ? 'SQL Kopyalandı!' : 'Supabase SQL Şemasını Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={handleSeedSupabase}
                disabled={seedingDb || !getStoredSupabaseConfig().isConfigured}
                className="px-4 py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 border border-amber-400/50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seedingDb ? 'animate-spin' : ''}`} />
                <span>{seedingDb ? 'Aktarılıyor...' : 'İlk Verileri Supabase\'e Yükle'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Step by step Supabase Setup Guide */}
        <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-800/30 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-violet-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Supabase 3 Adımda Kolay Kurulum Kılavuzu:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
            <li>
              <strong className="text-slate-200">Supabase Projenizi Açın:</strong>{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-violet-400 underline hover:text-violet-300 inline-flex items-center gap-1">
                Supabase Dashboard <ExternalLink className="w-3 h-3 inline" />
              </a>{' '}
              üzerinden projenizi oluşturun veya seçin.
            </li>
            <li>
              <strong className="text-slate-200">SQL Şemasını Çalıştırın:</strong> Yukarıdaki <em>"Supabase SQL Şemasını Kopyala"</em> butonuna basın. Supabase sol menüsündeki <strong>SQL Editor</strong> alanına yapıştırıp <strong>RUN</strong> butonuna tıklayın.
            </li>
            <li>
              <strong className="text-slate-200">API Anahtarlarını Girin:</strong> Supabase sol menüsündeki <strong>Project Settings &gt; API</strong> sekmesinden <em>Project URL</em> ve <em>anon public key</em> kopyalayıp yukarıdaki kutulara yapıştırın ve <em>"Supabase'e Bağlan ve Kaydet"</em> butonuna basın.
            </li>
          </ol>
        </div>

        {dbDiagResult && (
          <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
            dbDiagResult.connected
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          }`}>
            {dbDiagResult.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">
              <span className="font-semibold">Durum Detayı: </span>
              {dbDiagResult.message}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Quick Action Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#0c0818]/95 backdrop-blur-xl border border-violet-600/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
        <span className="text-xs font-bold text-slate-300 hidden sm:inline">
          Ayarları güncellemek için:
        </span>
        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-950 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      {/* 7-DAY STREAK REWARDS IN-PLACE EDIT MODAL */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="max-w-4xl w-full my-8 rounded-3xl bg-[#120b24] border border-amber-500/40 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-violet-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
                  <Flame className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>7 Günlük Giriş Serisi Ödüllerini Düzenle</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Kullanıcıların her gün kazanacağı Coin miktarını, rozet metinlerini ve VIP ödüllerini ayarlayın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStreakModalOpen(false)}
                className="p-1.5 rounded-xl bg-violet-950/60 text-slate-400 hover:text-white border border-violet-800/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Presets */}
            <div className="p-4 rounded-2xl bg-[#0d0918] border border-violet-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 font-bold text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={streakEnabled}
                  onChange={(e) => setStreakEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span>Sistem {streakEnabled ? 'Aktif (Açık)' : 'Pasif (Kapalı)'}</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Hızlı Şablon:
                </span>
                <button
                  type="button"
                  onClick={() => applyStreakPreset('balanced')}
                  className="px-2.5 py-1 rounded-xl bg-violet-950/80 hover:bg-violet-900 text-slate-300 hover:text-white border border-violet-800/50 font-semibold cursor-pointer text-[11px]"
                >
                  Dengeli (50-1000)
                </button>
                <button
                  type="button"
                  onClick={() => applyStreakPreset('generous')}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold cursor-pointer text-[11px]"
                >
                  VIP Cömert (100-2500)
                </button>
                <button
                  type="button"
                  onClick={() => applyStreakPreset('starter')}
                  className="px-2.5 py-1 rounded-xl bg-violet-950/80 hover:bg-violet-900 text-slate-300 hover:text-white border border-violet-800/50 font-semibold cursor-pointer text-[11px]"
                >
                  Ekonomik (25-500)
                </button>
              </div>
            </div>

            {/* 7 Days Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {streakDays.map((dayItem, index) => {
                const isGrandPrize = dayItem.day === 7 || dayItem.vip;
                return (
                  <div
                    key={dayItem.day}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-lg relative ${
                      isGrandPrize
                        ? 'bg-gradient-to-b from-amber-950/40 via-[#140b2a] to-[#0d0918] border-amber-500/50'
                        : 'bg-[#0d0918] border-violet-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isGrandPrize
                            ? 'bg-amber-500 text-violet-950'
                            : 'bg-violet-950 text-violet-300 border border-violet-800/40'
                        }`}
                      >
                        {dayItem.day}. GÜN
                      </span>
                      {isGrandPrize ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Gift className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">
                        Coin Tutarı
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={dayItem.reward_coins}
                        onChange={(e) =>
                          handleStreakDayChange(index, 'reward_coins', Number(e.target.value))
                        }
                        className={`w-full p-2 rounded-xl bg-[#090514] border text-xs font-black focus:outline-none ${
                          isGrandPrize
                            ? 'border-amber-500/60 text-amber-300 focus:border-amber-400'
                            : 'border-violet-800/50 text-white focus:border-violet-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">
                        Rozet Metni
                      </label>
                      <input
                        type="text"
                        value={dayItem.label}
                        onChange={(e) => handleStreakDayChange(index, 'label', e.target.value)}
                        placeholder={`${dayItem.reward_coins} Coin`}
                        className="w-full p-1.5 rounded-xl bg-[#090514] border border-violet-800/40 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(dayItem.vip)}
                        onChange={(e) => handleStreakDayChange(index, 'vip', e.target.checked)}
                        className="w-3 h-3 rounded text-amber-500"
                      />
                      <span>{isGrandPrize ? '👑 VIP Ödül' : 'Özel Vurgu'}</span>
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-violet-900/40">
              <RouterLink
                to="/admin/wheel?tab=wheel"
                onClick={() => setIsStreakModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900 border border-violet-800/50 text-violet-300 text-xs font-bold flex items-center gap-2 transition-all hover:text-white"
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Şans Çarkı Dilimlerini de Yönet →</span>
              </RouterLink>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStreakModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-violet-800/60 hover:bg-violet-950 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleSaveStreakInModal}
                  disabled={savingStreakInModal}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-violet-950 font-black text-xs shadow-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingStreakInModal ? 'Kaydediliyor...' : 'Ödülleri Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
