import React, { useState, useEffect, useRef } from 'react';
import { activityTracker } from '../../lib/activityTracker';
import { VisitorLog, VisitorStats, DeviceCategory, DailyVisitorLog } from '../../types';
import {
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Download,
  Trash2,
  Globe,
  Clock,
  User,
  CheckCircle2,
  Radio,
  Eye,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  MousePointerClick,
  Disc,
  Gift,
  ShoppingBag,
  Info,
  X,
  Laptop,
  Maximize2,
  ChevronRight,
  TrendingUp,
  Database,
  Copy,
  Check,
  Code2,
  Calendar,
  CalendarDays,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  BarChart3,
  CalendarRange,
  Users,
  Flame,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';

export const VISITOR_LOGS_SQL_SCHEMA = `-- ========================================================
-- 17. ZİYARETÇİ, CİHAZ & GİRİŞ LOGLARI (TÜM ZAMANLARIN KAYITLARI)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  user_id TEXT,
  username TEXT,
  is_authenticated BOOLEAN DEFAULT FALSE,
  device_type TEXT DEFAULT 'desktop', -- 'mobile', 'desktop', 'tablet', 'bot'
  os TEXT,
  os_version TEXT,
  browser TEXT,
  browser_version TEXT,
  screen_resolution TEXT,
  ip_address TEXT,
  path TEXT DEFAULT '/',
  page_title TEXT,
  referrer TEXT,
  action_type TEXT DEFAULT 'page_view',
  action_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. GÜNLÜK TOPLAM ZİYARETÇİ LOGLARI & ARŞİVİ
CREATE TABLE IF NOT EXISTS public.daily_visitor_logs (
  date TEXT PRIMARY KEY, -- 'YYYY-MM-DD'
  unique_visitors INT DEFAULT 0,
  total_page_views INT DEFAULT 0,
  total_events INT DEFAULT 0,
  mobile_count INT DEFAULT 0,
  desktop_count INT DEFAULT 0,
  tablet_count INT DEFAULT 0,
  bot_count INT DEFAULT 0,
  authenticated_users INT DEFAULT 0,
  top_page TEXT,
  top_page_views INT DEFAULT 0,
  peak_hour TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hızlı Sorgulama ve Filtreleme İndeksleri
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON public.visitor_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_device_type ON public.visitor_logs (device_type);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_action_type ON public.visitor_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_user_id ON public.visitor_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_session_id ON public.visitor_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_daily_visitor_logs_date ON public.daily_visitor_logs (date DESC);

-- RLS (Row Level Security) & Güvenlik Politikası
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visitor_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access on visitor_logs" ON public.visitor_logs;
CREATE POLICY "Public Full Access on visitor_logs" 
ON public.visitor_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access on daily_visitor_logs" ON public.daily_visitor_logs;
CREATE POLICY "Public Full Access on daily_visitor_logs" 
ON public.daily_visitor_logs FOR ALL USING (true) WITH CHECK (true);
`;

export const VisitorLogsManager: React.FC = () => {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyVisitorLog[]>([]);
  const [liveVisitors, setLiveVisitors] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  
  // View Tabs: 'stream' (Raw / Live Logs) | 'daily' (Daily Summary & Archives) | 'devices' (Device & Tech Breakdown)
  const [activeTab, setActiveTab] = useState<'stream' | 'daily' | 'devices'>('stream');
  const [dailySearchTerm, setDailySearchTerm] = useState<string>('');
  const [dailyDaysLimit, setDailyDaysLimit] = useState<number>(30);

  // Time Range Filter (Default is 24 hours as requested by user)
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDatePanel, setShowCustomDatePanel] = useState<boolean>(false);

  // Other Filters
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals & Panels
  const [selectedLog, setSelectedLog] = useState<VisitorLog | null>(null);
  const [showLiveDrawer, setShowLiveDrawer] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(VISITOR_LOGS_SQL_SCHEMA);
    setCopiedSql(true);
    toast.success('SQL kodları panoya kopyalandı!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isMountedRef = useRef(true);

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const isCustom = selectedTimeRange === 'custom';
      const [logsData, statsData, liveData, dailyData] = await Promise.all([
        activityTracker.getLogs({
          device: selectedDevice !== 'all' ? selectedDevice : undefined,
          action: selectedAction !== 'all' ? selectedAction : undefined,
          user_type: selectedUserType !== 'all' ? selectedUserType : undefined,
          time_range: selectedTimeRange,
          start_date: isCustom && customStartDate ? customStartDate : undefined,
          end_date: isCustom && customEndDate ? customEndDate : undefined,
          search: searchTerm.trim() || undefined,
          limit: 250,
        }),
        activityTracker.getStats({
          time_range: selectedTimeRange,
          start_date: isCustom && customStartDate ? customStartDate : undefined,
          end_date: isCustom && customEndDate ? customEndDate : undefined,
        }),
        activityTracker.getLiveStatus(),
        activityTracker.getDailyLogs(60),
      ]);

      if (isMountedRef.current) {
        setLogs(logsData.logs || []);
        if (statsData) setStats(statsData);
        if (dailyData?.daily_logs) {
          setDailyLogs(dailyData.daily_logs);
        } else if (statsData?.daily_history) {
          setDailyLogs(statsData.daily_history);
        }
        if (liveData) {
          setActiveCount(Math.max(1, liveData.active_count));
          setLiveVisitors(liveData.active_visitors || []);
        }
      }
    } catch (err) {
      console.error('Error fetching visitor data:', err);
      if (!silent) toast.error('Ziyaretçi verileri alınamadı.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [selectedTimeRange, customStartDate, customEndDate, selectedDevice, selectedAction, selectedUserType, searchTerm]);

  // Live Auto Refresh every 3.5 seconds if Live Mode is ON
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveMode, selectedTimeRange, customStartDate, customEndDate, selectedDevice, selectedAction, selectedUserType, searchTerm]);

  const setQuickDateRange = (rangeType: 'today' | 'yesterday' | 'last3days' | 'this_week' | 'this_month') => {
    soundEngine.playClick();
    const now = new Date();
    const start = new Date();
    const end = new Date();

    if (rangeType === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (rangeType === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (rangeType === 'last3days') {
      start.setDate(start.getDate() - 3);
      start.setHours(0, 0, 0, 0);
    } else if (rangeType === 'this_week') {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
    } else if (rangeType === 'this_month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatToLocalInput = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setSelectedTimeRange('custom');
    setCustomStartDate(formatToLocalInput(start));
    setCustomEndDate(formatToLocalInput(end));
    toast.success('Özel tarih aralığı belirlendi.');
  };

  const resetToDefault24Hours = () => {
    soundEngine.playClick();
    setSelectedTimeRange('24h');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDatePanel(false);
    toast.success('Zaman filtresi standart Son 24 Saat olarak ayarlandı.');
  };

  const getTimeRangeLabel = () => {
    switch (selectedTimeRange) {
      case '1h':
        return 'Son 1 Saat';
      case '6h':
        return 'Son 6 Saat';
      case '12h':
        return 'Son 12 Saat';
      case '24h':
        return 'Son 24 Saat (Standart)';
      case '7d':
        return 'Son 7 Gün';
      case '30d':
        return 'Son 30 Gün';
      case 'all':
        return 'Tüm Zamanlar (Tüm Kayıtlar)';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate.replace('T', ' ')} → ${customEndDate.replace('T', ' ')}`;
        }
        return 'Özel Tarih Aralığı';
      default:
        return 'Son 24 Saat';
    }
  };

  const handleClearLogs = async () => {
    soundEngine.playClick();
    if (window.confirm('Tüm ziyaretçi ve aktivite loglarını silmek istediğinizden emin misiniz?')) {
      const ok = await activityTracker.clearLogs();
      if (ok) {
        toast.success('Ziyaretçi logları temizlendi.');
        await fetchData();
      } else {
        toast.error('Loglar temizlenemedi.');
      }
    }
  };

  const handleExportCsv = () => {
    soundEngine.playClick();
    if (!logs.length) {
      toast.error('İndirilecek log kaydı bulunamadı.');
      return;
    }

    const headers = ['ID', 'Tarih', 'Cihaz', 'İşletim Sistemi', 'Tarayıcı', 'Ekran', 'IP Adresi', 'Kullanıcı', 'İşlem', 'Sayfa URL', 'Referrer'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        `"${log.id}"`,
        `"${log.created_at}"`,
        `"${log.device_type?.toUpperCase()}"`,
        `"${log.os || ''}"`,
        `"${log.browser || ''}"`,
        `"${log.screen_resolution || ''}"`,
        `"${log.ip_address || ''}"`,
        `"${log.username || 'Misafir'}"`,
        `"${log.action_name || log.action_type}"`,
        `"${log.path || ''}"`,
        `"${log.referrer || ''}"`,
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ziyaretci_loglari_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV Raporu başarıyla indirildi!');
  };

  const handleExportJson = () => {
    soundEngine.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `ziyaretci_detayli_loglar_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success('JSON Raporu başarıyla indirildi!');
  };

  const handleExportDailyCsv = () => {
    soundEngine.playClick();
    if (!dailyLogs.length) {
      toast.error('İndirilecek günlük log kaydı bulunamadı.');
      return;
    }

    const headers = ['Tarih', 'Tekil Ziyaretci', 'Sayfa Goruntuleme', 'Toplam Olay', 'Mobil', 'Masaustu', 'Tablet', 'Bot', 'Uye Sayisi', 'En Cok Gezilen'];
    const csvRows = [headers.join(',')];

    for (const item of dailyLogs) {
      const row = [
        `"${item.date}"`,
        item.unique_visitors,
        item.total_page_views,
        item.total_events,
        item.mobile_count,
        item.desktop_count,
        item.tablet_count,
        item.bot_count,
        item.authenticated_users,
        `"${item.top_page || '/'}"`,
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gunluk_ziyaretci_ozeti_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Günlük Ziyaretçi CSV Raporu başarıyla indirildi!');
  };

  const handleExportDailyJson = () => {
    soundEngine.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dailyLogs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `gunluk_ziyaretci_arsivi_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success('Günlük Ziyaretçi JSON Arşivi indirildi!');
  };

  const handleInspectDay = (dateStr: string) => {
    soundEngine.playClick();
    setSelectedTimeRange('custom');
    setCustomStartDate(`${dateStr}T00:00`);
    setCustomEndDate(`${dateStr}T23:59`);
    setShowCustomDatePanel(true);
    setActiveTab('stream');
    toast.success(`${dateStr} tarihinin detaylı ham logları açıldı.`);
  };

  const getDeviceIcon = (type: DeviceCategory) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-violet-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-amber-400" />;
      case 'bot':
        return <Radio className="w-4 h-4 text-rose-400" />;
      default:
        return <Monitor className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getDeviceBadge = (type: DeviceCategory) => {
    switch (type) {
      case 'mobile':
        return { label: 'Mobil', bg: 'bg-violet-950/80 text-violet-300 border-violet-700/50' };
      case 'tablet':
        return { label: 'Tablet', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/50' };
      case 'bot':
        return { label: 'Bot', bg: 'bg-rose-950/80 text-rose-300 border-rose-700/50' };
      default:
        return { label: 'Masaüstü', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50' };
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'sponsor_click':
        return { label: 'Sponsor Tıklama', icon: Sparkles, color: 'bg-purple-950/80 text-purple-300 border-purple-700/50' };
      case 'banner_click':
        return { label: 'Banner Tıklama', icon: MousePointerClick, color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50' };
      case 'wheel_spin':
        return { label: 'Çark Çevirme', icon: Disc, color: 'bg-pink-950/80 text-pink-300 border-pink-700/50' };
      case 'giveaway_entry':
        return { label: 'Çekiliş Katılımı', icon: Gift, color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' };
      case 'store_purchase':
        return { label: 'Mağaza Sipariş', icon: ShoppingBag, color: 'bg-amber-950/80 text-amber-300 border-amber-700/50' };
      case 'login':
        return { label: 'Giriş Yapıldı', icon: User, color: 'bg-blue-950/80 text-blue-300 border-blue-700/50' };
      case 'register':
        return { label: 'Yeni Kayıt', icon: CheckCircle2, color: 'bg-teal-950/80 text-teal-300 border-teal-700/50' };
      default:
        return { label: 'Sayfa Ziyareti', icon: Globe, color: 'bg-slate-800/80 text-slate-300 border-slate-700/50' };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 5) return 'Az önce';
      if (diff < 60) return `${diff} sn önce`;
      if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
      return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const deviceBreakdown = stats?.device_breakdown || {
    mobile_count: 0,
    mobile_percent: 0,
    desktop_count: 0,
    desktop_percent: 0,
    tablet_count: 0,
    tablet_percent: 0,
    bot_count: 0,
    bot_percent: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-[#0e0a1f] p-6 rounded-2xl border border-violet-900/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-violet-600 to-cyan-600 rounded-xl text-white shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                Canlı Ziyaretçi & Cihaz Analizi
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Canlı Takip
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Siteye giriş yapan kullanıcıların mobil / masaüstü dağılımı, anlık sayfaları ve detaylı işlem geçmişi.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Mode Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsLiveMode(!isLiveMode);
              toast.info(isLiveMode ? 'Canlı otomatik akış duraklatıldı.' : 'Canlı otomatik akış açıldı (3.5s)');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-md ${
              isLiveMode
                ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60 shadow-emerald-950/50'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveMode ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isLiveMode ? 'Canlı Akış: AÇIK' : 'Canlı Akış: KAPALI'}</span>
          </button>

          {/* Active Drawer Trigger */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowLiveDrawer(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-violet-950/70 border border-violet-700/60 text-violet-300 hover:text-white hover:bg-violet-900/60 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <span>{activeCount} Çevrimiçi Kişi</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => {
              soundEngine.playClick();
              fetchData();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* SQL Schema Code Trigger */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowSqlModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Supabase SQL Tablo Kodlarını Görüntüle & Kopyala"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>SQL Kodları</span>
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 hover:text-white hover:bg-cyan-900/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="CSV olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="JSON olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-900/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Tüm Ziyaretçi Loglarını Sıfırla"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Temizle</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0e0a1f] rounded-2xl border border-violet-900/40 shadow-lg">
        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('stream');
          }}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'stream'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/80 border border-violet-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Radio className={`w-4 h-4 ${activeTab === 'stream' ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
          <span>Canlı Akış & Ham Loglar</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
            activeTab === 'stream' ? 'bg-violet-950/80 text-cyan-300 border-cyan-400/40' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {logs.length} Kayıt
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('daily');
          }}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/80 border border-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <CalendarRange className={`w-4 h-4 ${activeTab === 'daily' ? 'text-amber-300' : 'text-slate-400'}`} />
          <span>Günlük Toplam Ziyaretçiler</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
            activeTab === 'daily' ? 'bg-cyan-950/80 text-amber-300 border-amber-400/40' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {dailyLogs.length} Gün
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('devices');
          }}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'devices'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/80 border border-emerald-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <PieChart className={`w-4 h-4 ${activeTab === 'devices' ? 'text-emerald-300' : 'text-slate-400'}`} />
          <span>Cihaz & Tarayıcı Analitiği</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
            activeTab === 'devices' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/40' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            %{deviceBreakdown.mobile_percent} Mobil
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE STREAM & RAW LOGS */}
      {activeTab === 'stream' && (
        <div className="space-y-6 animate-in fade-in duration-200">
      {/* Time & Date Range Filter Section (Default 24 Hours) */}
      <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-violet-900/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Zaman & Tarih Filtresi</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  {getTimeRangeLabel()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Standart olarak son 24 saatin logları listelenir; dilediğiniz zaman aralığını seçebilir veya özel tarih sorgulayabilirsiniz.
              </p>
            </div>
          </div>

          {/* Quick Reset to 24h Button if changed */}
          {selectedTimeRange !== '24h' && (
            <button
              onClick={resetToDefault24Hours}
              className="px-3 py-1.5 rounded-xl bg-violet-950/80 hover:bg-violet-900 border border-violet-700/50 text-violet-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md self-start md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standart 24 Saate Sıfırla</span>
            </button>
          )}
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-violet-900/20">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('1h');
              setShowCustomDatePanel(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === '1h'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/50 border border-violet-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Son 1 Saat</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('6h');
              setShowCustomDatePanel(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === '6h'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/50 border border-violet-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Son 6 Saat</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('24h');
              setShowCustomDatePanel(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === '24h'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-950/70 border border-cyan-400/50 ring-2 ring-violet-500/20'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-violet-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Son 24 Saat (Standart)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('7d');
              setShowCustomDatePanel(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === '7d'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/50 border border-violet-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Son 7 Gün</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('30d');
              setShowCustomDatePanel(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === '30d'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/50 border border-violet-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Son 30 Gün</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('all');
              setShowCustomDatePanel(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/50 border border-emerald-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span>Tüm Zamanlar ({stats?.all_time_total_events || logs.length})</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedTimeRange('custom');
              setShowCustomDatePanel(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTimeRange === 'custom'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-900/50 border border-amber-400/40'
                : 'bg-slate-900/90 text-amber-300/80 hover:text-amber-200 border border-amber-900/40 hover:border-amber-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>📅 Özel Tarih Aralığı Seç</span>
          </button>
        </div>

        {/* Custom Date Picker Subpanel */}
        {(selectedTimeRange === 'custom' || showCustomDatePanel) && (
          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Özel Tarih & Saat Aralığı Belirle:
              </span>

              {/* Quick Preset Date Buttons */}
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-slate-400 font-medium mr-1">Hızlı Seçim:</span>
                <button
                  onClick={() => setQuickDateRange('today')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                >
                  Bugün
                </button>
                <button
                  onClick={() => setQuickDateRange('yesterday')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                >
                  Dün
                </button>
                <button
                  onClick={() => setQuickDateRange('last3days')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                >
                  Son 3 Gün
                </button>
                <button
                  onClick={() => setQuickDateRange('this_week')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                >
                  Bu Hafta
                </button>
                <button
                  onClick={() => setQuickDateRange('this_month')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                >
                  Bu Ay
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <span>Başlangıç Tarihi ve Saati:</span>
                </label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <span>Bitiş Tarihi ve Saati:</span>
                </label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Submit / Reset Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedTimeRange('custom');
                    fetchData();
                    toast.success('Özel tarih filtresi uygulandı.');
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/50"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtrele</span>
                </button>
                <button
                  onClick={resetToDefault24Hours}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Son 24 Saate Sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>24 Saat</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Online Visitors */}
        <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-emerald-900/40 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Radio className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Şu An Çevrimiçi</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{activeCount}</span>
            <span className="text-xs text-emerald-500/80 font-bold">Aktif Ziyaretçi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Son 5 dakikada sitede etkileşimde olanlar</p>
        </div>

        {/* Card 2: Mobile Users Breakdown */}
        <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-violet-900/40 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smartphone className="w-16 h-16 text-violet-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-violet-400" />
              Mobil Girişler
            </span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-black text-[10px] border border-violet-500/40">
              %{deviceBreakdown.mobile_percent || 0}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-violet-400">{deviceBreakdown.mobile_count}</span>
            <span className="text-xs text-violet-400/80 font-bold">Mobil Cihaz</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Akıllı telefonlar (iOS & Android)</p>
        </div>

        {/* Card 3: Desktop Users Breakdown */}
        <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-cyan-900/40 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Monitor className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              Masaüstü Girişler
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-[10px] border border-cyan-500/40">
              %{deviceBreakdown.desktop_percent || 0}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">{deviceBreakdown.desktop_count}</span>
            <span className="text-xs text-cyan-400/80 font-bold">Masaüstü PC/Mac</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Windows, macOS ve Linux sistemler</p>
        </div>

        {/* Card 4: Total Events & Pageviews */}
        <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-indigo-900/40 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Toplam Aktivite
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-[10px] border border-indigo-500/40">
              {stats?.total_unique_visitors || 1} Tekil
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-400">{stats?.total_events || logs.length}</span>
            <span className="text-xs text-indigo-400/80 font-bold">İşlem Kaydı</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Sayfa görüntüleme, tıklama ve etkileşimler</p>
        </div>
      </div>

      {/* Visual Device Distribution Bar & OS / Browser Badges */}
      <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-violet-900/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Cihaz Dağılımı & Oran Grafiği
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-violet-500"></span>
              <span className="text-slate-300 font-bold">Mobil (%{deviceBreakdown.mobile_percent} - {deviceBreakdown.mobile_count})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
              <span className="text-slate-300 font-bold">Masaüstü (%{deviceBreakdown.desktop_percent} - {deviceBreakdown.desktop_count})</span>
            </div>
            {deviceBreakdown.tablet_count > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-300 font-bold">Tablet (%{deviceBreakdown.tablet_percent})</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Visualizer */}
        <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
          <div
            style={{ width: `${Math.max(deviceBreakdown.mobile_percent || (deviceBreakdown.desktop_count ? 0 : 100), 2)}%` }}
            className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-l-full transition-all duration-500"
            title={`Mobil: %${deviceBreakdown.mobile_percent}`}
          />
          <div
            style={{ width: `${Math.max(deviceBreakdown.desktop_percent || 0, 0)}%` }}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
            title={`Masaüstü: %${deviceBreakdown.desktop_percent}`}
          />
          {deviceBreakdown.tablet_percent > 0 && (
            <div
              style={{ width: `${deviceBreakdown.tablet_percent}%` }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-r-full transition-all duration-500"
              title={`Tablet: %${deviceBreakdown.tablet_percent}`}
            />
          )}
        </div>

        {/* OS and Browser Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-violet-900/20 text-xs">
          {/* Top OS */}
          <div>
            <span className="text-slate-400 font-bold block mb-2">İşletim Sistemleri:</span>
            <div className="flex flex-wrap gap-1.5">
              {stats?.os_breakdown?.length ? (
                stats.os_breakdown.map((os) => (
                  <span
                    key={os.name}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-200 font-bold flex items-center gap-1.5"
                  >
                    <span className="text-violet-400">●</span>
                    <span>{os.name}</span>
                    <span className="text-slate-400 font-normal">({os.count})</span>
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Kayıt bekleniyor...</span>
              )}
            </div>
          </div>

          {/* Top Browsers */}
          <div>
            <span className="text-slate-400 font-bold block mb-2">Kullanılan Tarayıcılar:</span>
            <div className="flex flex-wrap gap-1.5">
              {stats?.browser_breakdown?.length ? (
                stats.browser_breakdown.map((br) => (
                  <span
                    key={br.name}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-200 font-bold flex items-center gap-1.5"
                  >
                    <span className="text-cyan-400">●</span>
                    <span>{br.name}</span>
                    <span className="text-slate-400 font-normal">({br.count})</span>
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Kayıt bekleniyor...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e0a1f] p-4 rounded-2xl border border-violet-900/30 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Device Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedDevice('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDevice === 'all'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tüm Cihazlar
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedDevice('mobile');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedDevice === 'mobile'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-violet-300" />
              <span>📱 Mobil ({deviceBreakdown.mobile_count})</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedDevice('desktop');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedDevice === 'desktop'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-300" />
              <span>💻 Masaüstü ({deviceBreakdown.desktop_count})</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedDevice('tablet');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedDevice === 'tablet'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5 text-amber-300" />
              <span>📟 Tablet ({deviceBreakdown.tablet_count})</span>
            </button>
          </div>

          {/* Action Type Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tüm Olay Türleri</option>
              <option value="page_view">🌐 Sayfa Ziyareti</option>
              <option value="login">🔑 Giriş Yapıldı</option>
              <option value="register">Teal Yeni Kayıt</option>
              <option value="sponsor_click">⚡ Sponsor Tıklama</option>
              <option value="banner_click">🖼️ Banner Tıklama</option>
              <option value="wheel_spin">🎡 Çark Çevirme</option>
              <option value="giveaway_entry">🎁 Çekiliş Katılımı</option>
              <option value="store_purchase">🛒 Mağaza Sipariş</option>
            </select>

            <select
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tüm Kullanıcılar</option>
              <option value="member">👤 Yalnızca Üyeler</option>
              <option value="guest">🕵️ Yalnızca Misafirler</option>
            </select>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="IP Adresi, Kullanıcı Adı, Ziyaret Edilen Sayfa, OS, Tarayıcı veya Çözünürlük Ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0e0a1f] rounded-2xl border border-violet-900/30 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-violet-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-violet-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Detaylı Ziyaretçi & İşlem Akışı ({logs.length} Kayıt)
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
              📅 {getTimeRangeLabel()}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isLiveMode ? '🟢 Canlı akış aktif (her 3.5 sn güncellenir)' : '⚪ Canlı akış duraklatıldı'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
            <p className="text-xs font-bold">Ziyaretçi ve cihaz logları yükleniyor...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Henüz eşleşen log kaydı bulunamadı.</p>
            <p className="text-xs text-slate-500">Filtreleri temizleyebilir veya sayfayı yenileyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-violet-900/20 bg-slate-900/40 text-[11px] text-slate-400 font-bold uppercase">
                  <th className="px-4 py-3">Cihaz / Tür</th>
                  <th className="px-4 py-3">Kullanıcı & Durum</th>
                  <th className="px-4 py-3">Yapılan İşlem / Olay</th>
                  <th className="px-4 py-3">Ziyaret Edilen Sayfa</th>
                  <th className="px-4 py-3">IP & Çözünürlük</th>
                  <th className="px-4 py-3">Sistem & Tarayıcı</th>
                  <th className="px-4 py-3 text-right">Zaman</th>
                  <th className="px-3 py-3 text-center">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-900/15 text-xs">
                {logs.map((log) => {
                  const devBadge = getDeviceBadge(log.device_type);
                  const actBadge = getActionBadge(log.action_type);
                  const ActIcon = actBadge.icon;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-violet-950/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Device Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            {getDeviceIcon(log.device_type)}
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${devBadge.bg}`}>
                              {devBadge.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User & Online State */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              log.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            }`}
                            title={log.is_online ? 'Şu An Aktif (Çevrimiçi)' : 'Geçmiş Oturum'}
                          />
                          <div>
                            <span className="font-extrabold text-white block">
                              {log.username || (log.user_id ? 'Üye' : 'Misafir Ziyaretçi')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.is_authenticated ? 'Kayıtlı Üye' : 'Misafir'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action / Event */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1.5 ${actBadge.color}`}>
                            <ActIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{log.action_name || actBadge.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* Path / Page URL */}
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900/30 block truncate" title={log.path}>
                          {log.path || '/'}
                        </span>
                      </td>

                      {/* IP & Resolution */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                        <span className="text-slate-300 font-bold block">{log.ip_address || '127.0.0.1'}</span>
                        <span className="text-[10px] text-slate-500">{log.screen_resolution || 'Bilinmiyor'}</span>
                      </td>

                      {/* OS & Browser */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                        <span className="text-slate-200 font-bold block">{log.os || 'Bilinmiyor'}</span>
                        <span className="text-[10px] text-slate-400">{log.browser || 'Bilinmiyor'}</span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-slate-300 font-bold block">{formatTimeAgo(log.created_at)}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                        </span>
                      </td>

                      {/* Detail Button */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          title="Detaylı Teknik Bilgiyi Görüntüle"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}

      {/* TAB 2: DAILY VISITOR LOGS (GÜNLÜK TOPLAM ZİYARETÇİLER) */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Daily KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Total Visitors */}
            <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-cyan-900/40 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-16 h-16 text-cyan-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Bugünkü Toplam
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-[10px] border border-cyan-500/40">
                  Canlı Gün
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-400">
                  {stats?.today_unique_visitors || (dailyLogs[0]?.unique_visitors || 0)}
                </span>
                <span className="text-xs text-cyan-400/80 font-bold">Tekil Kişi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Bugün toplam <span className="text-white font-bold">{stats?.today_page_views || (dailyLogs[0]?.total_page_views || 0)}</span> sayfa görüntülendi
              </p>
            </div>

            {/* Card 2: Yesterday's Visitors */}
            <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-violet-900/40 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarRange className="w-16 h-16 text-violet-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  Dünkü Ziyaretçi
                </span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-black text-[10px] border border-violet-500/40">
                  Önceki Gün
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-violet-400">
                  {stats?.yesterday_unique_visitors || (dailyLogs[1]?.unique_visitors || 0)}
                </span>
                <span className="text-xs text-violet-400/80 font-bold">Tekil Kişi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Dün toplam <span className="text-white font-bold">{dailyLogs[1]?.total_page_views || 0}</span> sayfa görüntülendi
              </p>
            </div>

            {/* Card 3: Daily Average */}
            <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-indigo-900/40 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-16 h-16 text-indigo-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  Günlük Ortalama
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-[10px] border border-indigo-500/40">
                  {dailyLogs.length} Günlük Veri
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-400">
                  {stats?.daily_average_visitors || Math.round(dailyLogs.reduce((a, b) => a + b.unique_visitors, 0) / (dailyLogs.length || 1))}
                </span>
                <span className="text-xs text-indigo-400/80 font-bold">Ziyaretçi / Gün</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Sitenin ortalama günlük tekil trafiği</p>
            </div>

            {/* Card 4: Peak Day */}
            <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-amber-900/40 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-16 h-16 text-amber-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Zirve Gün (Rekor)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
                  En Yüksek
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-400">
                  {stats?.peak_day?.visitors || Math.max(...dailyLogs.map((d) => d.unique_visitors), 0)}
                </span>
                <span className="text-xs text-amber-400/80 font-bold">Ziyaretçi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Tarih: <span className="text-white font-mono font-bold">{stats?.peak_day?.date || (dailyLogs[0]?.date || '-')}</span>
              </p>
            </div>
          </div>

          {/* Visual Daily Trend Bar Graph */}
          {dailyLogs.length > 0 && (
            <div className="bg-[#0e0a1f] p-5 rounded-2xl border border-cyan-900/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Günlük Tekil Ziyaretçi & Sayfa Gösterim Trendi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gün bazında toplam tekil ziyaretçi sayıları ve sayfa gösterim yoğunlukları. Çubuklara tıklayarak o günü filtreleyebilirsiniz.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-cyan-500"></span>
                    <span className="text-slate-300">Tekil Ziyaretçi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-500"></span>
                    <span className="text-slate-300">Sayfa Gösterimi</span>
                  </div>
                </div>
              </div>

              {/* Responsive Bar Chart Canvas */}
              <div className="pt-4 pb-2 overflow-x-auto">
                <div className="min-w-[600px] h-48 flex items-end gap-3 px-2 border-b border-violet-900/30">
                  {dailyLogs.slice(0, 14).reverse().map((day) => {
                    const maxVal = Math.max(...dailyLogs.map((d) => Math.max(d.unique_visitors, d.total_page_views / 2)), 10);
                    const visitorHeight = Math.max((day.unique_visitors / maxVal) * 100, 8);
                    const pageHeight = Math.max(((day.total_page_views / 2) / maxVal) * 100, 6);
                    const isToday = day.date === new Date().toISOString().slice(0, 10);

                    return (
                      <div
                        key={day.date}
                        onClick={() => handleInspectDay(day.date)}
                        className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                        title={`${day.date}: ${day.unique_visitors} Tekil Ziyaretçi, ${day.total_page_views} Sayfa Gösterimi (İncelemek için tıkla)`}
                      >
                        {/* Hover Tooltip Label */}
                        <div className="text-[10px] font-black text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1.5 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap shadow-lg -translate-y-1">
                          {day.unique_visitors} kişi
                        </div>

                        {/* Bar Pillars */}
                        <div className="w-full flex items-end justify-center gap-1 h-32">
                          {/* Unique Visitors Bar */}
                          <div
                            style={{ height: `${visitorHeight}%` }}
                            className={`w-1/2 rounded-t-md transition-all duration-500 group-hover:brightness-125 ${
                              isToday
                                ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-md shadow-cyan-900/50 ring-1 ring-cyan-300'
                                : 'bg-gradient-to-t from-cyan-800 to-cyan-600'
                            }`}
                          />
                          {/* Page Views Bar */}
                          <div
                            style={{ height: `${pageHeight}%` }}
                            className="w-1/2 rounded-t-md bg-gradient-to-t from-indigo-800 to-indigo-500 transition-all duration-500 group-hover:brightness-125 opacity-70 group-hover:opacity-100"
                          />
                        </div>

                        {/* Date Label */}
                        <span className={`text-[10px] font-mono font-bold transition-colors ${
                          isToday ? 'text-cyan-300 underline' : 'text-slate-400 group-hover:text-white'
                        }`}>
                          {isToday ? 'Bugün' : day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Daily Controls Toolbar */}
          <div className="bg-[#0e0a1f] p-4 rounded-2xl border border-violet-900/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Days Limit Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setDailyDaysLimit(7);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyDaysLimit === 7
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Son 7 Gün
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setDailyDaysLimit(14);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyDaysLimit === 14
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Son 14 Gün
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setDailyDaysLimit(30);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyDaysLimit === 30
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Son 30 Gün
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setDailyDaysLimit(60);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyDaysLimit === 60
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Son 60 Gün
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setDailyDaysLimit(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyDaysLimit === 0
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tüm Günler ({dailyLogs.length})
              </button>
            </div>

            {/* Daily Search & Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dailySearchTerm}
                  onChange={(e) => setDailySearchTerm(e.target.value)}
                  placeholder="Tarih ara (örn: 2026-08)..."
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                onClick={handleExportDailyCsv}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 hover:text-white hover:bg-cyan-900/70 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Günlük Raporu CSV İndir"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Günlük CSV</span>
              </button>

              <button
                onClick={handleExportDailyJson}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Günlük Raporu JSON İndir"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Daily Detailed Table */}
          <div className="bg-[#0e0a1f] rounded-2xl border border-cyan-900/30 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-cyan-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-cyan-950/20">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Gün Bazında Toplam Ziyaretçi Kayıtları ({dailyLogs.length} Gün Arşivlendi)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Her gün 00:00'dan 23:59'a kadar olan tekil ziyaretçi, sayfa ve cihaz istatistikleri
              </span>
            </div>

            {dailyLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Info className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-300">Henüz günlük log kaydı bulunamadı.</p>
                <p className="text-xs text-slate-500">Ziyaretçiler siteye girdikçe günlük özetler otomatik olarak derlenecektir.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyan-900/20 bg-slate-900/40 text-[11px] text-slate-400 font-bold uppercase">
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3">Tekil Ziyaretçi</th>
                      <th className="px-4 py-3">Sayfa Gösterimi</th>
                      <th className="px-4 py-3">Toplam Olay</th>
                      <th className="px-4 py-3">Cihaz Dağılımı (Mobil / PC)</th>
                      <th className="px-4 py-3">Kayıtlı Üye</th>
                      <th className="px-4 py-3">En Çok Gezilen Sayfa</th>
                      <th className="px-4 py-3 text-right">Detaylı İncele</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-900/15 text-xs">
                    {dailyLogs
                      .filter((item) => {
                        if (!dailySearchTerm) return true;
                        const term = dailySearchTerm.toLowerCase();
                        return item.date.toLowerCase().includes(term) || (item.top_page && item.top_page.toLowerCase().includes(term));
                      })
                      .slice(0, dailyDaysLimit === 0 ? undefined : dailyDaysLimit)
                      .map((day) => {
                        const isToday = day.date === new Date().toISOString().slice(0, 10);
                        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                        const isYesterday = day.date === yesterdayStr;

                        const totalDev = (day.mobile_count + day.desktop_count + day.tablet_count + day.bot_count) || 1;
                        const mobilePercent = Math.round((day.mobile_count / totalDev) * 100);
                        const desktopPercent = Math.round((day.desktop_count / totalDev) * 100);

                        return (
                          <tr
                            key={day.date}
                            className="hover:bg-cyan-950/20 transition-colors group cursor-pointer"
                            onClick={() => handleInspectDay(day.date)}
                          >
                            {/* Date Column */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-extrabold text-white font-mono block text-sm">
                                    {day.date}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {isToday && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                                        ● Bugün
                                      </span>
                                    )}
                                    {isYesterday && (
                                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/40">
                                        Dün
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'long' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Unique Visitors */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 text-cyan-300 font-black text-sm border border-cyan-700/50 shadow-sm flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{day.unique_visitors}</span>
                                </span>
                                <span className="text-[10px] text-slate-400">Tekil Kişi</span>
                              </div>
                            </td>

                            {/* Page Views */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-black text-slate-200 text-sm block">
                                {day.total_page_views}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Sayfa Ziyareti</span>
                            </td>

                            {/* Total Events */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-extrabold text-indigo-300 block">
                                {day.total_events}
                              </span>
                              <span className="text-[10px] text-slate-400">Tıklama / İşlem</span>
                            </td>

                            {/* Device Breakdown */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="space-y-1.5 max-w-[180px]">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-violet-400 flex items-center gap-1">
                                    <Smartphone className="w-3 h-3" /> Mobil: {day.mobile_count} (%{mobilePercent})
                                  </span>
                                  <span className="text-cyan-400 flex items-center gap-1">
                                    <Monitor className="w-3 h-3" /> PC: {day.desktop_count}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                                  <div
                                    style={{ width: `${mobilePercent}%` }}
                                    className="bg-violet-500 h-full rounded-l-full"
                                  />
                                  <div
                                    style={{ width: `${desktopPercent}%` }}
                                    className="bg-cyan-500 h-full rounded-r-full"
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Authenticated Members */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-950/70 text-teal-300 font-bold text-xs border border-teal-800/40">
                                👤 {day.authenticated_users} Üye
                              </span>
                            </td>

                            {/* Top Page */}
                            <td className="px-4 py-3 max-w-[180px] truncate">
                              <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800 block truncate" title={day.top_page || '/'}>
                                {day.top_page || '/'}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInspectDay(day.date);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-violet-950/80 hover:bg-violet-900 border border-violet-700/60 text-violet-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-md"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>Günü İncele</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEVICE, BROWSER & SYSTEM ANALYTICS */}
      {activeTab === 'devices' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Visual Device Distribution Bar & OS / Browser Badges */}
          <div className="bg-[#0e0a1f] p-6 rounded-2xl border border-violet-900/30 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  Cihaz Dağılımı & Sistem Oran Analitiği
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kullanıcıların siteye hangi cihaz türleri, işletim sistemleri ve tarayıcılarla bağlandığının kapsamlı dağılımı.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                  <span className="text-slate-300">Mobil (%{deviceBreakdown.mobile_percent} - {deviceBreakdown.mobile_count})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                  <span className="text-slate-300">Masaüstü (%{deviceBreakdown.desktop_percent} - {deviceBreakdown.desktop_count})</span>
                </div>
                {deviceBreakdown.tablet_count > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-300">Tablet (%{deviceBreakdown.tablet_percent})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar Visualizer */}
            <div className="h-5 w-full bg-slate-900 rounded-full overflow-hidden flex p-1 border border-slate-800 shadow-inner">
              <div
                style={{ width: `${Math.max(deviceBreakdown.mobile_percent || (deviceBreakdown.desktop_count ? 0 : 100), 2)}%` }}
                className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-l-full transition-all duration-500"
                title={`Mobil: %${deviceBreakdown.mobile_percent}`}
              />
              <div
                style={{ width: `${Math.max(deviceBreakdown.desktop_percent || 0, 0)}%` }}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                title={`Masaüstü: %${deviceBreakdown.desktop_percent}`}
              />
              {deviceBreakdown.tablet_percent > 0 && (
                <div
                  style={{ width: `${deviceBreakdown.tablet_percent}%` }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-r-full transition-all duration-500"
                  title={`Tablet: %${deviceBreakdown.tablet_percent}`}
                />
              )}
            </div>

            {/* OS and Browser Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-violet-900/30">
              {/* Top OS */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-black text-violet-300 uppercase tracking-wider block flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-violet-400" />
                  Kullanılan İşletim Sistemleri (OS)
                </span>
                <div className="space-y-2">
                  {stats?.os_breakdown?.length ? (
                    stats.os_breakdown.map((os) => {
                      const percent = Math.round((os.count / (stats.total_events || 1)) * 100);
                      return (
                        <div key={os.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-200">{os.name}</span>
                            <span className="text-violet-400 font-mono">{os.count} işlem (%{percent})</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div style={{ width: `${percent}%` }} className="h-full bg-violet-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500">Kayıt bekleniyor...</span>
                  )}
                </div>
              </div>

              {/* Top Browsers */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider block flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Kullanılan İnternet Tarayıcıları (Browsers)
                </span>
                <div className="space-y-2">
                  {stats?.browser_breakdown?.length ? (
                    stats.browser_breakdown.map((br) => {
                      const percent = Math.round((br.count / (stats.total_events || 1)) * 100);
                      return (
                        <div key={br.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-200">{br.name}</span>
                            <span className="text-cyan-400 font-mono">{br.count} işlem (%{percent})</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div style={{ width: `${percent}%` }} className="h-full bg-cyan-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500">Kayıt bekleniyor...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Visited Pages Breakdown Table */}
          <div className="bg-[#0e0a1f] rounded-2xl border border-violet-900/30 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-violet-900/30 flex items-center justify-between bg-violet-950/20">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  En Çok Ziyaret Edilen Sayfalar & Rotalar
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {stats?.top_pages?.length || 0} Farklı Sayfa
              </span>
            </div>

            <div className="p-4">
              {stats?.top_pages?.length ? (
                <div className="space-y-3">
                  {stats.top_pages.map((p, i) => {
                    const percent = Math.round((p.count / (stats.total_events || 1)) * 100);
                    return (
                      <div key={p.path || i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-black text-slate-500 font-mono text-xs w-5">#{i + 1}</span>
                          <span className="font-mono text-cyan-300 font-bold text-xs truncate bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            {p.path || '/'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs font-black text-white font-mono">{p.count} Görüntüleme</span>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/40">
                            %{percent}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs">Henüz sayfa görüntüleme istatistiği toplanmadı.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Visitors Drawer Modal */}
      {showLiveDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e0a1f] border border-violet-900/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-violet-900/30 flex items-center justify-between bg-violet-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                <h3 className="text-base font-black text-white">
                  Şu Anda Sitede Olan Canlı Ziyaretçiler ({liveVisitors.length})
                </h3>
              </div>
              <button
                onClick={() => setShowLiveDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-violet-900/20">
              {liveVisitors.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Info className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="font-bold text-sm">Şu an aktif ziyaretçi kaydı güncelleniyor...</p>
                </div>
              ) : (
                liveVisitors.map((v, i) => (
                  <div key={v.session_id || i} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 mt-1">
                        {getDeviceIcon(v.device_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{v.username || 'Misafir Ziyaretçi'}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDeviceBadge(v.device_type).bg}`}>
                            {getDeviceBadge(v.device_type).label}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-300 font-mono mt-0.5">
                          Aktif Sayfa: <span className="underline">{v.current_path || '/'}</span>
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                          <span>IP: {v.ip_address}</span>
                          <span>OS: {v.os}</span>
                          <span>Tarayıcı: {v.browser}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/40">
                        🟢 Çevrimiçi
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        {Math.floor((Date.now() - v.last_seen_at) / 1000)} sn önce
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e0a1f] border border-violet-900/50 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-violet-900/30 flex items-center justify-between bg-violet-950/30">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-600 text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Ziyaretçi Log Detayı</h3>
                  <span className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Device Overview Banner */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cihaz Türü</span>
                  <span className="text-white font-extrabold text-sm flex items-center gap-1.5 mt-0.5">
                    {getDeviceIcon(selectedLog.device_type)}
                    {getDeviceBadge(selectedLog.device_type).label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">İşletim Sistemi</span>
                  <span className="text-cyan-300 font-extrabold text-sm mt-0.5 block">
                    {selectedLog.os || 'Bilinmiyor'} {selectedLog.os_version ? `(${selectedLog.os_version})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tarayıcı</span>
                  <span className="text-violet-300 font-extrabold text-sm mt-0.5 block">
                    {selectedLog.browser || 'Bilinmiyor'} {selectedLog.browser_version ? `v${selectedLog.browser_version}` : ''}
                  </span>
                </div>
              </div>

              {/* Technical Details Grid */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-300 uppercase tracking-wider text-[11px]">Bağlantı & Sayfa Bilgisi</h4>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">IP Adresi:</span>
                    <span className="font-mono font-bold text-white">{selectedLog.ip_address}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Kullanıcı:</span>
                    <span className="font-bold text-violet-300">{selectedLog.username || 'Misafir Ziyaretçi'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Ekran Çözünürlüğü:</span>
                    <span className="font-mono text-white">{selectedLog.screen_resolution || 'Bilinmiyor'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Ziyaret Edilen Yol:</span>
                    <span className="font-mono text-cyan-300 font-bold">{selectedLog.path}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Sayfa Başlığı:</span>
                    <span className="text-slate-200">{selectedLog.page_title || 'Belirtilmedi'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Geldiği Yer (Referrer):</span>
                    <span className="font-mono text-slate-300 truncate max-w-[250px]">{selectedLog.referrer || 'Doğrudan Giriş'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Oturum ID (Session):</span>
                    <span className="font-mono text-slate-400 text-[10px]">{selectedLog.session_id}</span>
                  </div>
                </div>
              </div>

              {/* Extra JSON Details if available */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-slate-300 uppercase tracking-wider text-[11px]">Ham Olay Parametreleri (JSON)</h4>
                  <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-violet-900/30 bg-violet-950/20 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e0a1f] border border-amber-500/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-violet-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-violet-950/40 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Tüm Zamanların Giriş & Ziyaretçi Tablosu (SQL)
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Supabase Uyumlu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supabase SQL Editor kısmına yapıştırıp çalıştırarak tüm girişleri kalıcı olarak saklayabilirsiniz.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-slate-300 leading-relaxed space-y-1.5">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Kullanım Talimatı:
                </p>
                <p>
                  1. Aşağıdaki <strong>"Tüm SQL Kodunu Kopyala"</strong> butonuna basın.
                </p>
                <p>
                  2. <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong> sekmesini açın.
                </p>
                <p>
                  3. Kodu yapıştırıp <strong>Run (Çalıştır)</strong> butonuna tıklayın.
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-x border-slate-800 rounded-t-xl text-[11px] text-slate-400">
                  <span className="font-mono text-cyan-300">schema_visitor_logs.sql</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-b-xl bg-black/90 border border-slate-800 font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-[350px] selection:bg-amber-500/40 selection:text-white leading-relaxed">
                  {VISITOR_LOGS_SQL_SCHEMA}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-violet-900/30 bg-violet-950/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Tablo Adı: <code className="text-cyan-300 font-mono">public.visitor_logs</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/50"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'SQL Kopyalandı!' : 'Tüm SQL Kodunu Kopyala'}</span>
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
