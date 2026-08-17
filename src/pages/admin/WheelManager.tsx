import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { WheelReward, StreakDayConfig } from '../../types';
import { Disc, Plus, Edit2, Trash2, X, Sparkles, Flame, Trophy, Gift, Save, RotateCcw, CheckCircle2, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';
import { initialSiteSettings } from '../../lib/initialData';

export const WheelManager: React.FC = () => {
  const { wheelRewards, settings, refreshAll } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'wheel' | 'streak'>(
    tabParam === 'streak' ? 'streak' : 'wheel'
  );

  // Sync tab with URL search params
  useEffect(() => {
    if (tabParam === 'streak' || tabParam === 'wheel') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'wheel' | 'streak') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Wheel Rewards State
  const [editingReward, setEditingReward] = useState<Partial<WheelReward> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [title, setTitle] = useState('');
  const [rewardType, setRewardType] = useState<'coin' | 'code' | 'bonus' | 'special'>('coin');
  const [rewardValue, setRewardValue] = useState(100);
  const [probability, setProbability] = useState(15);
  const [color, setColor] = useState('#7C3AED');
  const [active, setActive] = useState(true);

  // 7-Day Streak Management State
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
  const [savingStreak, setSavingStreak] = useState(false);

  useEffect(() => {
    if (settings.streak_rewards && settings.streak_rewards.length === 7) {
      setStreakDays(settings.streak_rewards);
    }
    if (settings.streak_bonus_enabled !== undefined) {
      setStreakEnabled(settings.streak_bonus_enabled);
    }
  }, [settings]);

  const openNew = () => {
    setIsNew(true);
    setEditingReward({});
    setTitle('150 Coin');
    setRewardType('coin');
    setRewardValue(150);
    setProbability(15);
    setColor('#8B5CF6');
    setActive(true);
  };

  const openEdit = (r: WheelReward) => {
    setIsNew(false);
    setEditingReward(r);
    setTitle(r.title || '');
    setRewardType((r.reward_type as any) || 'coin');
    setRewardValue(r.reward_value ?? 100);
    setProbability(r.probability ?? 10);
    setColor(r.color || '#7C3AED');
    setActive(r.active !== false);
  };

  const handleSaveWheelReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<WheelReward> = {
      title,
      reward_type: rewardType,
      reward_value: Number(rewardValue),
      probability: Number(probability),
      color,
      active,
    };

    try {
      if (isNew) {
        await db.createWheelReward(data as any);
        toast.success('Yeni çark ödülü eklendi!');
      } else if (editingReward?.id) {
        await db.updateWheelReward(editingReward.id, data);
        toast.success('Çark ödülü güncellendi!');
      }
      setEditingReward(null);
      await refreshAll();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" ödül dilimini silmek istediğinizden emin misiniz?`)) {
      await db.deleteWheelReward(id);
      toast.success('Ödül dilimi silindi');
      await refreshAll();
    }
  };

  // Streak update handlers
  const handleStreakDayChange = (dayIndex: number, field: keyof StreakDayConfig, value: any) => {
    const updated = [...streakDays];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value,
    };
    // Auto sync label if label was simple coin format
    if (field === 'reward_coins' && (!updated[dayIndex].label || updated[dayIndex].label.includes('Coin'))) {
      if (updated[dayIndex].vip) {
        updated[dayIndex].label = `${value} VIP + Sandık`;
      } else {
        updated[dayIndex].label = `${value} Coin`;
      }
    }
    setStreakDays(updated);
  };

  const applyPreset = (preset: 'balanced' | 'generous' | 'starter') => {
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

  const handleSaveStreakSettings = async () => {
    setSavingStreak(true);
    try {
      await db.updateSettings({
        streak_bonus_enabled: streakEnabled,
        streak_rewards: streakDays,
      });
      await refreshAll();
      toast.success('7 Günlük Giriş Bonusu ayarları başarıyla kaydedildi!');
    } catch {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSavingStreak(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <span>Çark & Günlük Bonus Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hediye çarkı dilimleri ve 7 günlük kesintisiz giriş serisi ödüllerini yapılandırın.
          </p>
        </div>

        {/* Top Action Tabs */}
        <div className="flex items-center gap-2 bg-[#0d0918] p-1.5 rounded-2xl border border-violet-800/40">
          <button
            onClick={() => handleTabChange('wheel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'wheel'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>Şans Çarkı Dilimleri ({wheelRewards.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('streak')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'streak'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-violet-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>7 Günlük Giriş Serisi</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WHEEL REWARDS */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300">
              Aktif Çark Dilimleri Listesi
            </h2>
            <button
              onClick={openNew}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ödül Dilimi Ekle</span>
            </button>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {wheelRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-5 rounded-3xl bg-[#120b24] border border-violet-800/30 flex flex-col justify-between space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: reward.color }}
                    />
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">
                      {reward.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                    %{reward.probability} Şans
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-900/30 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Ödül Değeri</span>
                  <p className="text-base font-black text-amber-300">
                    {reward.reward_type === 'coin' ? `+${reward.reward_value} Coin` : reward.title}
                  </p>
                </div>

                <div className="pt-2 border-t border-violet-900/30 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold ${
                      reward.active ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {reward.active ? '● Çarkta Aktif' : '○ Pasif'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(reward)}
                      className="p-1.5 rounded-lg bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(reward.id, reward.title)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30 cursor-pointer"
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

      {/* TAB 2: 7-DAY LOGIN STREAK MANAGEMENT */}
      {activeTab === 'streak' && (
        <div className="space-y-6">
          {/* Streak Master Control Banner */}
          <div className="p-6 rounded-3xl bg-[#120b24] border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Flame className="w-6 h-6 fill-amber-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">7 Günlük Giriş Serisi Bonusu</h2>
                  <p className="text-xs text-slate-300">
                    Kullanıcılar her gün giriş yaparak serilerini artırır ve 7. güne ulaştıklarında VIP büyük ödülü kazanır.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-violet-950/60 border border-violet-800/40 text-xs font-bold text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={streakEnabled}
                    onChange={(e) => setStreakEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Sistem {streakEnabled ? 'Aktif (Açık)' : 'Pasif (Kapalı)'}</span>
                </label>

                <button
                  onClick={handleSaveStreakSettings}
                  disabled={savingStreak}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-violet-950 font-black text-xs shadow-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingStreak ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                </button>
              </div>
            </div>

            {/* Presets Row */}
            <div className="mt-5 pt-4 border-t border-violet-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Hızlı Şablon Yükle:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('balanced')}
                  className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-slate-300 hover:text-white border border-violet-800/40 font-semibold cursor-pointer"
                >
                  Dengeli (50 - 1000 Coin)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('generous')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-semibold cursor-pointer"
                >
                  Cömert VIP (100 - 2500 Coin)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('starter')}
                  className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-slate-300 hover:text-white border border-violet-800/40 font-semibold cursor-pointer"
                >
                  Ekonomik (25 - 500 Coin)
                </button>
              </div>
            </div>
          </div>

          {/* 7 Days Editor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {streakDays.map((dayItem, index) => {
              const isGrandPrize = dayItem.day === 7 || dayItem.vip;
              return (
                <div
                  key={dayItem.day}
                  className={`p-4 rounded-3xl border flex flex-col justify-between space-y-3.5 shadow-xl relative ${
                    isGrandPrize
                      ? 'bg-gradient-to-b from-amber-950/40 via-[#120b24] to-[#0d0918] border-amber-500/50 shadow-amber-950/20'
                      : 'bg-[#120b24] border-violet-800/30'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isGrandPrize
                          ? 'bg-amber-500 text-violet-950'
                          : 'bg-violet-950 text-violet-300 border border-violet-800/40'
                      }`}
                    >
                      {dayItem.day}. GÜN
                    </span>
                    {isGrandPrize ? (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Gift className="w-4 h-4 text-violet-400" />
                    )}
                  </div>

                  {/* Coin Input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">
                      Kazanılacak Coin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={dayItem.reward_coins}
                        onChange={(e) =>
                          handleStreakDayChange(index, 'reward_coins', Number(e.target.value))
                        }
                        className={`w-full p-2 rounded-xl bg-[#0d0918] border text-xs font-black focus:outline-none ${
                          isGrandPrize
                            ? 'border-amber-500/50 text-amber-300 focus:border-amber-400'
                            : 'border-violet-800/50 text-white focus:border-violet-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Label / Badge Text Input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">
                      Kart Rozet Metni
                    </label>
                    <input
                      type="text"
                      value={dayItem.label}
                      onChange={(e) => handleStreakDayChange(index, 'label', e.target.value)}
                      placeholder={`${dayItem.reward_coins} Coin`}
                      className="w-full p-2 rounded-xl bg-[#0d0918] border border-violet-800/40 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* VIP Toggle (For Day 7 or special) */}
                  <label className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(dayItem.vip)}
                      onChange={(e) => handleStreakDayChange(index, 'vip', e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-500"
                    />
                    <span>{isGrandPrize ? '👑 VIP Büyük Ödül' : 'Özel Vurgu'}</span>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Live Preview Section */}
          <div className="p-6 rounded-3xl bg-[#0d0918] border border-violet-800/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-sm font-bold text-white">Canlı Önizleme (Kullanıcı Arayüzü)</h3>
              </div>
              <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                3 Gün Aktif Seri Örneği 🔥
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {streakDays.map((item) => {
                const claimed = item.day <= 2;
                const current = item.day === 3;
                return (
                  <div
                    key={item.day}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                      claimed
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : current
                        ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20 text-white animate-pulse'
                        : item.vip
                        ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                        : 'bg-violet-950/20 border-violet-900/30 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.day}. Gün</span>
                    <div className="my-2 flex items-center justify-center">
                      {claimed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : item.vip ? (
                        <Trophy className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Gift className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                    <span className="text-xs font-black truncate w-full">{item.label || `${item.reward_coins} Coin`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal For Wheel Slice Edit */}
      {editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNew ? 'Yeni Çark Ödülü Ekle' : 'Çark Ödülünü Düzenle'}
              </h3>
              <button onClick={() => setEditingReward(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWheelReward} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ödül Başlığı *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ödül Tipi</label>
                  <select
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  >
                    <option value="coin">Coin Bakiyesi</option>
                    <option value="bonus">Özel Bonus</option>
                    <option value="code">Hediye Kodu</option>
                    <option value="special">VIP / Özel Hediye</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ödül Miktarı</label>
                  <input
                    type="number"
                    value={rewardValue}
                    onChange={(e) => setRewardValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kazanma İhtimali (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dilim Rengi</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 rounded-xl bg-[#0d0918] border border-violet-800/40 cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Çarkta Göster (Aktif)
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer"
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

