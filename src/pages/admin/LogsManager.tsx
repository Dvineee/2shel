import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { AdminLog } from '../../types';
import {
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Clock,
  User,
  Activity,
  CheckCircle2,
  Sparkles,
  Layers,
  ShoppingBag,
  Disc,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';

export const LogsManager: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await db.getAdminLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
      toast.error('Log kayıtları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    soundEngine.playClick();
    if (window.confirm('Tüm sistem ve işlem loglarını temizlemek istediğinizden emin misiniz?')) {
      await db.clearAdminLogs();
      toast.success('Log geçmişi temizlendi!');
      await fetchLogs();
    }
  };

  const handleExportLogs = () => {
    soundEngine.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shelbyonline_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Log raporu JSON olarak indirildi!');
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      log.entity_type?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'sponsor':
        return {
          label: 'Sponsor',
          color: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
          icon: Sparkles,
        };
      case 'pages':
        return {
          label: 'Sayfa Kontrol',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: Layers,
        };
      case 'settings':
        return {
          label: 'Ayarlar',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: Activity,
        };
      case 'user':
      case 'auth':
        return {
          label: 'Kullanıcı / Giriş',
          color: 'bg-[#24A1DE]/20 text-[#24A1DE] border-[#24A1DE]/40',
          icon: User,
        };
      case 'wheel':
        return {
          label: 'Şans Çarkı',
          color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
          icon: Disc,
        };
      case 'store':
        return {
          label: 'Mağaza',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: ShoppingBag,
        };
      default:
        return {
          label: type?.toUpperCase() || 'SİSTEM',
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          icon: Activity,
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-violet-400" />
            Sistem & İşlem Logları (Audit Logs)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Yönetici işlemleri, sayfa aktif/pasif değişiklikleri, sponsor güncellemeleri ve sistem hareketlerinin tam dökümü.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 rounded-xl bg-violet-950/50 hover:bg-violet-900/60 border border-violet-800/40 text-violet-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="px-3.5 py-2 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/40 text-blue-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Dışa Aktar (JSON)</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Logları Temizle</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İşlem adı, kullanıcı veya detay ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090614] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'sponsor', label: 'Sponsorlar' },
            { id: 'pages', label: 'Sayfalar' },
            { id: 'settings', label: 'Ayarlar' },
            { id: 'system', label: 'Sistem' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'bg-[#090614] text-slate-400 hover:text-white border border-violet-900/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Card List */}
      <div className="rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-violet-900/30 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Toplam <b>{filteredLogs.length}</b> işlem kaydı listeleniyor
          </span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Otomatik Güncel
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-white">Kayıt Bulunamadı</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Seçilen filtrelere veya arama kriterine uygun bir log kaydı bulunamadı.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-violet-900/20">
            {filteredLogs.map((log) => {
              const badge = getCategoryBadge(log.entity_type);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-violet-950/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}
                    >
                      <BadgeIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{log.action}</span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {log.details && (
                        <p className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-xl">
                          Detay: {JSON.stringify(log.details)}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-violet-400" />
                          {log.admin_username || 'Yönetici'}
                        </span>
                        {log.entity_id && (
                          <span className="font-mono">ID: {log.entity_id}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono shrink-0 sm:text-right">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
