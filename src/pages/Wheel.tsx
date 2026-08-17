import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { WheelReward, WheelSpin, StreakDayConfig, UserStreakInfo } from '../types';
import { soundEngine } from '../lib/sound';
import { Disc, Sparkles, Trophy, Clock, ShieldCheck, AlertCircle, Flame, Gift, Calendar, CheckCircle2, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';
import { initialSiteSettings } from '../lib/initialData';

export const WheelPage: React.FC = () => {
  const { wheelRewards, settings } = useData();
  const { user, refreshProfile } = useAuth();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);
  const [spinsHistory, setSpinsHistory] = useState<WheelSpin[]>([]);
  const [alreadySpunToday, setAlreadySpunToday] = useState(false);

  // User Streak state
  const [streakInfo, setStreakInfo] = useState<UserStreakInfo | null>(null);
  const [claimingStreak, setClaimingStreak] = useState(false);

  const activeRewards = wheelRewards.filter((r) => r.active);

  // Admin-configured 7-day login streak calculation
  const configuredStreakDays: StreakDayConfig[] =
    settings?.streak_rewards && settings.streak_rewards.length === 7
      ? settings.streak_rewards
      : (initialSiteSettings.streak_rewards || [
          { day: 1, reward_coins: 50, label: '50 Coin' },
          { day: 2, reward_coins: 100, label: '100 Coin' },
          { day: 3, reward_coins: 150, label: '150 Coin' },
          { day: 4, reward_coins: 200, label: '200 Coin' },
          { day: 5, reward_coins: 300, label: '300 Coin' },
          { day: 6, reward_coins: 500, label: '500 Coin' },
          { day: 7, reward_coins: 1000, label: '1000 VIP + Sandık', vip: true },
        ]);

  const streakBonusEnabled = settings?.streak_bonus_enabled ?? true;

  const loadHistoryAndStreak = async () => {
    const history = await db.getWheelSpins();
    setSpinsHistory(history);
    if (user) {
      const today = new Date().toDateString();
      const userTodaySpin = history.find(
        (s) => s.user_id === user.id && new Date(s.created_at).toDateString() === today
      );
      setAlreadySpunToday(Boolean(userTodaySpin));

      const streak = await db.getUserStreak(user.id);
      setStreakInfo(streak);
    } else {
      setStreakInfo(null);
    }
  };

  useEffect(() => {
    loadHistoryAndStreak();
  }, [user, settings]);

  const handleClaimStreak = async () => {
    soundEngine.playClick();
    if (!user) {
      toast.error('Giriş bonusunu alabilmek için lütfen giriş yapınız.');
      return;
    }
    if (streakInfo?.is_claimed_today) {
      toast.info('Bugünkü seri bonusunuzu zaten aldınız. Yarın tekrar bekleriz!');
      return;
    }
    setClaimingStreak(true);
    try {
      const result = await db.claimDailyStreak(user.id, user.username);
      if (result.success) {
        soundEngine.playWin();
        soundEngine.playCoin();

        // Explosion of confetti
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#3B82F6'],
        });

        toast.success(result.message);
        await refreshProfile();
        const updatedStreak = await db.getUserStreak(user.id);
        setStreakInfo(updatedStreak);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Bonus talep edilirken bir hata oluştu');
    } finally {
      setClaimingStreak(false);
    }
  };

  const handleSpin = async () => {
    soundEngine.playClick();
    if (!user) {
      toast.error('Çarkı çevirebilmek için lütfen giriş yapınız.');
      return;
    }
    if (alreadySpunToday) {
      toast.error('Bugünkü çark çevirme hakkınızı kullandınız. Yarın tekrar bekleriz!');
      return;
    }
    if (spinning || activeRewards.length === 0) return;

    setSpinning(true);
    setWonReward(null);

    try {
      const result = await db.spinWheel(user.id, user.username);
      if (!result.success) {
        toast.error(result.message || 'Çark çevrilemedi');
        setSpinning(false);
        return;
      }

      const reward = result.reward;
      const rewardIndex = activeRewards.findIndex((r) => r.id === reward.id);
      const segmentAngle = 360 / activeRewards.length;
      // Target angle to center the winning slice under the top pointer
      const targetSegmentCenter = rewardIndex * segmentAngle + segmentAngle / 2;
      const extraSpins = 360 * 6; // 6 full fast rotations
      const finalRotation = rotation + extraSpins + (360 - targetSegmentCenter);

      setRotation(finalRotation);

      // Realistic audio ticking simulation as wheel slows down
      let tickDelay = 60;
      let tickCount = 0;
      const maxTicks = 32;

      const scheduleTick = () => {
        if (tickCount < maxTicks) {
          soundEngine.playWheelTick(1 + tickCount * 0.02);
          tickCount++;
          tickDelay = Math.floor(tickDelay * 1.09);
          setTimeout(scheduleTick, tickDelay);
        }
      };
      setTimeout(scheduleTick, 100);

      setTimeout(async () => {
        setSpinning(false);
        setWonReward(reward);
        setAlreadySpunToday(true);
        await refreshProfile();
        await loadHistoryAndStreak();

        soundEngine.playWin();
        soundEngine.playCoin();

        // Celebration Confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#A855F7', '#F59E0B', '#10B981', '#EC4899'],
        });

        if (reward.reward_type === 'coin') {
          toast.success(`Tebrikler! +${reward.reward_value} Coin kazandınız!`);
        } else {
          toast.success(`Tebrikler! ${reward.title} kazandınız!`);
        }
      }, 4800);
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu');
      setSpinning(false);
    }
  };

  // Determine current active day to claim
  const currentStreakCount = streakInfo?.current_streak || 0;
  const isClaimedToday = Boolean(streakInfo?.is_claimed_today);
  const targetDayToClaim = isClaimedToday
    ? currentStreakCount
    : currentStreakCount === 0 || currentStreakCount >= 7
    ? 1
    : currentStreakCount + 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          HER GÜN ÜCRETSİZ 1 ŞANS & GÜNLÜK SERİ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Günlük VIP Şans Çarkı & Giriş Bonusu
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Her gün giriş yap, günlük seriyi bozmadan büyüt, çarkı çevir ve mağazada harcayabileceğin binlerce coin topla!
        </p>
      </div>

      {/* 7-Day Login Streak Row */}
      {streakBonusEnabled && (
        <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/40 shadow-2xl relative overflow-hidden">
          {/* Header & Claim Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Flame className="w-5 h-5 fill-amber-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>7 Günlük Giriş Serisi Bonusu</span>
                  {isClaimedToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Bugün Alındı ✓
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Her gün aralıksız giriş yap, ödülünü katla ve 7. günde dev VIP ödülü kap!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>
                  {user
                    ? currentStreakCount > 0
                      ? `${currentStreakCount} Gün Aktif Seri 🔥`
                      : 'Seriye Başla 🔥'
                    : 'Giriş Yaparak Başla'}
                </span>
              </span>

              {user && !isClaimedToday && (
                <button
                  onClick={handleClaimStreak}
                  disabled={claimingStreak}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-violet-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <Gift className="w-4 h-4" />
                  <span>{claimingStreak ? 'Yükleniyor...' : 'Giriş Bonusunu Al'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 7 Days Dynamic Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {configuredStreakDays.map((item) => {
              // Status logic
              const isClaimed =
                user &&
                (item.day < currentStreakCount ||
                  (item.day === currentStreakCount && isClaimedToday));
              const isCurrentToClaim = user && !isClaimedToday && item.day === targetDayToClaim;
              const isVip = Boolean(item.vip || item.day === 7);

              return (
                <div
                  key={item.day}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-300 relative overflow-hidden ${
                    isClaimed
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/20'
                      : isCurrentToClaim
                      ? 'bg-gradient-to-b from-amber-500/25 via-[#1a1033] to-[#0d0918] border-amber-400 shadow-xl shadow-amber-500/30 text-white ring-2 ring-amber-400/50 animate-pulse'
                      : isVip
                      ? 'bg-gradient-to-b from-purple-950/50 via-[#120b24] to-[#0d0918] border-purple-500/40 text-purple-200'
                      : 'bg-violet-950/20 border-violet-900/30 text-slate-400 hover:border-violet-700/50'
                  }`}
                >
                  {/* Top Day Header */}
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isCurrentToClaim
                          ? 'text-amber-300'
                          : isClaimed
                          ? 'text-emerald-400'
                          : isVip
                          ? 'text-purple-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.day}. GÜN
                    </span>
                    {isVip && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  </div>

                  {/* Center Icon */}
                  <div className="my-2 flex items-center justify-center">
                    {isClaimed ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : isCurrentToClaim ? (
                      <div className="w-8 h-8 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20 animate-bounce">
                        <Gift className="w-5 h-5" />
                      </div>
                    ) : isVip ? (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-amber-400">
                        <Trophy className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-950/40 border border-violet-800/30 flex items-center justify-center text-violet-400">
                        <Gift className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Reward Amount / Action Button */}
                  <div className="w-full">
                    <span
                      className={`text-xs font-black block truncate ${
                        isCurrentToClaim
                          ? 'text-amber-300'
                          : isClaimed
                          ? 'text-emerald-300'
                          : isVip
                          ? 'text-purple-200'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.label || `${item.reward_coins} Coin`}
                    </span>

                    {/* Quick Claim Button on active card */}
                    {isCurrentToClaim && (
                      <button
                        onClick={handleClaimStreak}
                        disabled={claimingStreak}
                        className="mt-2 w-full py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-violet-950 text-[10px] font-black shadow-md cursor-pointer transition-all hover:scale-105"
                      >
                        {claimingStreak ? '...' : 'ŞİMDİ AL'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Wheel Canvas/SVG (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#0d0918] border border-violet-800/30 shadow-2xl relative">
          {/* Top Indicator Arrow */}
          <div className="absolute top-3 z-30 flex flex-col items-center drop-shadow-2xl">
            <div className="w-8 h-9 bg-gradient-to-b from-amber-300 to-amber-500 clip-triangle shadow-2xl rotate-180" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>

          {/* Wheel Container */}
          <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] my-6">
            {/* Outer LED Glowing Rim */}
            <div className="absolute -inset-3 rounded-full border-4 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '30s' }} />

            <div
              className="w-full h-full rounded-full border-8 border-violet-800/80 shadow-[0_0_60px_rgba(124,58,237,0.5)] relative overflow-hidden transition-transform ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '4.8s' : '0s',
                transitionTimingFunction: 'cubic-bezier(0.12, 0.95, 0.22, 1)',
              }}
            >
              {/* SVG Slices */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {activeRewards.map((reward, i) => {
                  const num = activeRewards.length;
                  const angle = 360 / num;
                  const startAngle = i * angle;
                  const endAngle = (i + 1) * angle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Slice Colors
                  const colors = ['#7C3AED', '#9333EA', '#6D28D9', '#C026D3', '#EAB308', '#475569', '#DB2777', '#8B5CF6'];
                  const fillColor = reward.color || colors[i % colors.length];

                  return (
                    <g key={reward.id}>
                      <path d={pathData} fill={fillColor} stroke="#070510" strokeWidth="0.9" />
                    </g>
                  );
                })}
              </svg>

              {/* Labels on Slices */}
              {activeRewards.map((reward, i) => {
                const angle = 360 / activeRewards.length;
                const midAngle = i * angle + angle / 2;
                return (
                  <div
                    key={reward.id}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-black text-white pointer-events-none drop-shadow-md text-center"
                    style={{
                      transform: `rotate(${midAngle}deg) translate(0, -95px) rotate(-${midAngle}deg)`,
                      width: '64px',
                    }}
                  >
                    {reward.title}
                  </div>
                );
              })}
            </div>

            {/* Center Golden Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500 border-4 border-[#0d0918] flex items-center justify-center shadow-2xl z-20 cursor-pointer" onClick={handleSpin}>
              <Disc className="w-7 h-7 text-violet-950 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          {/* Spin Button */}
          <div className="w-full max-w-sm mt-4">
            <button
              onClick={handleSpin}
              disabled={spinning || alreadySpunToday}
              className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 ${
                alreadySpunToday
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/60 hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              <Disc className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>
                {spinning
                  ? 'ÇARK DÖNÜYOR...'
                  : alreadySpunToday
                  ? 'BUGÜNKÜ HAK KULLANILDI'
                  : 'ŞANS ÇARKINI ÇEVİR'}
              </span>
            </button>
            {alreadySpunToday && (
              <p className="text-center text-xs text-amber-400/90 mt-2 font-medium">
                ⏳ Bir sonraki çark hakkınız yarın 00:00'da yenilenecektir.
              </p>
            )}
          </div>
        </div>

        {/* Right: Won Rewards & Live Winners Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Won Reward Alert Card */}
          {wonReward && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-purple-900/30 to-[#120b24] border-2 border-amber-400/50 shadow-2xl animate-in zoom-in-95 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-400 text-violet-950 flex items-center justify-center mx-auto mb-2 font-black shadow-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">TEBRİKLER!</h3>
              <p className="text-sm font-bold text-amber-300 mt-1">{wonReward.title}</p>
              <p className="text-xs text-slate-300 mt-2">
                Ödülünüz hesabınıza tanımlandı. Coinlerinizi mağazada harcayabilirsiniz.
              </p>
            </div>
          )}

          {/* Recent Winners History Card */}
          <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Canlı Çark Kazananları
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {spinsHistory.slice(0, 10).map((spin) => (
                <div
                  key={spin.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-violet-950/40 border border-violet-900/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-700/40 text-violet-200 flex items-center justify-center font-bold text-[10px]">
                      {spin.username?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{spin.username}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(spin.created_at)}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-amber-300">{spin.reward_title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RewardWheelPage = WheelPage;


