import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatTimeLeft, formatDate } from '../lib/utils';
import { Gift, Clock, Users, Trophy, CheckCircle, Sparkles, Crown, Award, X, ShieldCheck, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { soundEngine } from '../lib/sound';
import { Giveaway } from '../types';

export const GiveawaysPage: React.FC = () => {
  const { giveaways, refreshAll } = useData();
  const { user } = useAuth();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [selectedGiveawayForResults, setSelectedGiveawayForResults] = useState<Giveaway | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');

  const fireCelebrationConfetti = () => {
    try {
      soundEngine.playWin();
    } catch {}

    // First burst: Main center explosion
    confetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
    });

    // Second burst: Left cannon fireworks
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#F43F5E', '#A855F7', '#FBBF24', '#34D399'],
      });
    }, 150);

    // Third burst: Right cannon fireworks
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#3B82F6', '#10B981', '#EC4899', '#FBBF24'],
      });
    }, 300);

    // Fourth star burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5 },
        shapes: ['circle'],
        scalar: 1.2,
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#00FFFF'],
      });
    }, 450);
  };

  // Check which giveaways current user has already entered
  const checkUserEntries = async () => {
    if (!user) {
      setJoinedIds([]);
      return;
    }
    try {
      const allEntries = await db.getGiveawayEntries();
      const userJoined = allEntries
        .filter(
          (e) =>
            e.user_id === user.id ||
            (user.username && e.username?.toLowerCase() === user.username.toLowerCase())
        )
        .map((e) => e.giveaway_id);
      setJoinedIds(userJoined);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkUserEntries();
  }, [user, giveaways]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedGiveawayForResults) {
        setSelectedGiveawayForResults(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGiveawayForResults]);

  const handleJoin = async (giveawayId: string) => {
    if (!user) {
      soundEngine.playClick();
      toast.error('Çekilişe katılabilmek için lütfen giriş yapınız.');
      return;
    }
    soundEngine.playClick();
    setJoiningId(giveawayId);
    try {
      const res = await db.enterGiveaway(giveawayId, user.id, user.username);
      if (res.success) {
        setJoinedIds((prev) => (prev.includes(giveawayId) ? prev : [...prev, giveawayId]));
        toast.success(res.message);
        fireCelebrationConfetti();
        await refreshAll();
      } else {
        if (res.message.includes('zaten')) {
          setJoinedIds((prev) => (prev.includes(giveawayId) ? prev : [...prev, giveawayId]));
        }
        toast.info(res.message);
      }
    } catch {
      toast.error('Çekilişe katılırken bir hata oluştu');
    } finally {
      setJoiningId(null);
    }
  };

  const activeCount = giveaways.filter((g) => !g.is_completed).length;
  const completedCount = giveaways.filter((g) => g.is_completed).length;

  const displayGiveaways = giveaways.filter((g) => {
    if (filterTab === 'active') return !g.is_completed;
    if (filterTab === 'completed') return g.is_completed;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-rose-950/60 via-[#120b24] to-[#070510] border border-rose-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-3">
          <Gift className="w-3.5 h-3.5 text-rose-400" />
          ÖDÜLLÜ TOPLULUK ETKİNLİKLERİ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Büyük Topluluk Çekilişleri
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Tüm üyelerimize açık, doğrulanmış ve tamamen ücretsiz çekilişlerimize katılarak nakit ödüller kazanın.
        </p>

        {/* Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilterTab('all');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-lg shadow-rose-950/50 scale-105'
                : 'bg-violet-950/50 text-slate-300 hover:text-white border border-violet-800/40 hover:bg-violet-900/40'
            }`}
          >
            Tüm Çekilişler ({giveaways.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilterTab('active');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              filterTab === 'active'
                ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-lg shadow-rose-950/50 scale-105'
                : 'bg-violet-950/50 text-slate-300 hover:text-white border border-violet-800/40 hover:bg-violet-900/40'
            }`}
          >
            Devam Edenler ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilterTab('completed');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-violet-950 shadow-lg shadow-amber-950/50 scale-105 border border-amber-300'
                : 'bg-violet-950/50 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Sonuçlananlar ({completedCount})</span>
          </button>
        </div>
      </div>

      {/* Giveaways Grid / Empty State */}
      {displayGiveaways.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#120b24] border border-violet-900/40 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Çekiliş Bulunmuyor</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5">
              {filterTab === 'active'
                ? 'Şu anda katılım süreci açık olan çekiliş bulunmamaktadır.'
                : filterTab === 'completed'
                ? 'Henüz sonuçlanmış bir çekiliş kaydı bulunmamaktadır.'
                : 'Şu anda listelenecek çekiliş bulunmamaktadır.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGiveaways.map((giveaway) => {
            const isUserJoined = joinedIds.includes(giveaway.id);
            return (
              <div
                key={giveaway.id}
                className={`rounded-3xl bg-[#120b24] border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group ${
                  giveaway.is_completed
                    ? 'border-amber-500/40 hover:border-amber-400 shadow-amber-950/20'
                    : isUserJoined
                    ? 'border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-950/20'
                    : 'border-violet-800/30 hover:border-violet-600/50 hover:shadow-violet-900/30'
                }`}
              >
                {/* Image & Countdown / Status Badge */}
                <div className="relative h-48 w-full overflow-hidden bg-violet-950/40">
                  <img
                    src={
                      giveaway.image_url ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={giveaway.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Top status badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950/80 border border-purple-500/40 text-purple-200 backdrop-blur-md flex items-center gap-1 shadow-md">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>{giveaway.winner_count || 1} Kazanan</span>
                    </span>
                    {isUserJoined && !giveaway.is_completed && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 backdrop-blur-md flex items-center gap-1 shadow-md">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Katıldınız</span>
                      </span>
                    )}
                  </div>

                  {giveaway.is_completed ? (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-violet-950 text-xs font-black flex items-center gap-1.5 shadow-xl shadow-black/60 border border-amber-300/70">
                      <Trophy className="w-3.5 h-3.5 fill-violet-950 text-violet-950" />
                      <span>SONUÇLANAN ÇEKİLİŞ</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatTimeLeft(giveaway.end_at)}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                    {giveaway.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {giveaway.description}
                  </p>

                  {/* Prize Details Box */}
                  {giveaway.prize_details && (
                    <div className="my-3 p-3 rounded-xl bg-violet-950/40 border border-violet-900/40 text-xs flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-200 font-semibold truncate">
                        {giveaway.prize_details}
                      </span>
                    </div>
                  )}

                  {/* Winner Showcase Badge */}
                  {giveaway.is_completed && giveaway.winner_username && (
                    <div
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedGiveawayForResults(giveaway);
                      }}
                      className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-violet-950/40 border border-amber-500/40 shadow-inner space-y-1.5 cursor-pointer hover:border-amber-400 hover:bg-amber-500/25 transition-all group/win"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>KAZANANLAR:</span>
                        </div>
                        <span className="text-[10px] text-amber-300/80 font-bold group-hover/win:text-amber-200 group-hover/win:underline flex items-center gap-0.5">
                          Tümünü Gör →
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {String(giveaway.winner_username || '')
                          .split(',')
                          .map((wName, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-violet-950 font-black text-xs inline-flex items-center gap-1 shadow-sm"
                            >
                              @{wName.trim().replace(/^@/, '')}
                            </span>
                          ))}
                      </div>
                      {giveaway.winner_note && (
                        <p className="text-[11px] text-slate-300 italic pl-1 line-clamp-1">
                          "{giveaway.winner_note}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer Stats & CTA */}
                  <div className="mt-auto pt-4 border-t border-violet-900/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <Users className="w-4 h-4 text-violet-400" />
                      <span className="text-violet-300 font-bold">{giveaway.entries_count || 0}</span>
                      <span>Katılımcı</span>
                    </div>

                    {giveaway.is_completed ? (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedGiveawayForResults(giveaway);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-violet-950 flex items-center gap-1.5 shadow-md shadow-amber-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/60"
                      >
                        <Crown className="w-3.5 h-3.5 fill-violet-950 text-violet-950" />
                        <span>Kazananlar</span>
                      </button>
                    ) : isUserJoined ? (
                      <div className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Katıldınız ✓</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(giveaway.id)}
                        disabled={joiningId === giveaway.id}
                        className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 shadow-md shadow-pink-900/40 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {joiningId === giveaway.id ? 'Katılınıyor...' : 'Çekilişe Katıl'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Giveaway Results Modal --- */}
      {selectedGiveawayForResults && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            soundEngine.playClick();
            setSelectedGiveawayForResults(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#120b24] border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl shadow-amber-950/60 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="relative p-6 bg-gradient-to-r from-amber-600/30 via-yellow-600/20 to-purple-950/60 border-b border-amber-500/30">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedGiveawayForResults(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-violet-950 text-xs font-black mb-3 shadow-md">
                <Trophy className="w-3.5 h-3.5 fill-violet-950" />
                <span>ÇEKİLİŞ SONUÇLARI</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white pr-8">
                {selectedGiveawayForResults.title}
              </h2>

              {selectedGiveawayForResults.prize_details && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Ödül: {selectedGiveawayForResults.prize_details}</span>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Winner Announcement Banner */}
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-2 shadow-lg shadow-amber-500/10">
                  <Crown className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Resmi Kazananlar Listesi</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Çekiliş noter/sistem onaylı olarak tamamlanmış olup talihliler aşağıda listelenmiştir.
                </p>
              </div>

              {/* Winners Cards List */}
              <div className="space-y-2.5">
                {String(selectedGiveawayForResults.winner_username || '')
                  .split(',')
                  .map((name) => name.trim())
                  .filter(Boolean)
                  .map((winner, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-violet-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-400 text-violet-950 font-black text-xs flex items-center justify-center shadow-md">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                            <span>@{winner.replace(/^@/, '')}</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-[11px] text-amber-300/90 font-semibold">
                            {selectedGiveawayForResults.prize_details || 'Çekiliş Kazananı'}
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0">
                        Kazandı 🎉
                      </span>
                    </div>
                  ))}

                {(!selectedGiveawayForResults.winner_username ||
                  selectedGiveawayForResults.winner_username.trim() === '') && (
                  <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/30 text-center text-xs text-slate-400">
                    Henüz kazanan bilgisi girilmemiştir.
                  </div>
                )}
              </div>

              {/* Organizer Note */}
              {selectedGiveawayForResults.winner_note && (
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>YETKİLİ DUYURUSU & ÖDÜL TESLİMATI:</span>
                  </div>
                  <p className="text-xs text-slate-300 italic pl-1 leading-relaxed">
                    "{selectedGiveawayForResults.winner_note}"
                  </p>
                </div>
              )}

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-900/40 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Katılımcı</div>
                  <div className="text-sm font-bold text-violet-200 mt-0.5 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    <span>{selectedGiveawayForResults.entries_count || 0}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-900/40 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Kazanan</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedGiveawayForResults.winner_count || 1} Kişi</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-900/40 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tarih</div>
                  <div className="text-xs font-bold text-slate-300 mt-0.5 flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(selectedGiveawayForResults.end_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-violet-950/50 border-t border-violet-900/40 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedGiveawayForResults(null);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-violet-700 hover:bg-violet-600 transition-colors shadow-md cursor-pointer"
              >
                Pencereyi Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
