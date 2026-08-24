import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { minesService } from '../services/minesService';
import { MinesGame } from '../types/mines';
import { MinesBoard } from '../components/mines/MinesBoard';
import { MinesControls } from '../components/mines/MinesControls';
import { MinesMultiplier } from '../components/mines/MinesMultiplier';
import { soundEngine } from '../lib/sound';
import { toast } from 'sonner';
import { Bomb, Sparkles, Send, RefreshCw, Trophy, ShieldCheck } from 'lucide-react';

export const MinesGamePage: React.FC = () => {
  const { user, updateUserCoins, setUserCoins } = useAuth();

  const [game, setGame] = useState<MinesGame | null>(null);
  const [selectedBet, setSelectedBet] = useState<number>(50);
  const [selectedMines, setSelectedMines] = useState<number>(5);
  const [hitCell, setHitCell] = useState<number | null>(null);
  const [revealedMines, setRevealedMines] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isCashingOut, setIsCashingOut] = useState<boolean>(false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);

  // Load existing active game on mount
  useEffect(() => {
    if (user?.id) {
      minesService.getActiveGame(user.id).then((activeGame) => {
        if (activeGame) {
          setGame(activeGame);
          setSelectedBet(activeGame.bet_amount);
          setSelectedMines(activeGame.mine_count);
        }
      });
    }
  }, [user?.id]);

  const handleSelectBet = useCallback((bet: number) => {
    setSelectedBet(bet);
  }, []);

  const handleSelectMines = useCallback((mines: number) => {
    setSelectedMines(mines);
  }, []);

  // Handle Start Game
  const handleStartGame = useCallback(async () => {
    if (isStarting || isLoading || isCashingOut) return;

    if (!user) {
      toast.error('Oyuna başlamak için lütfen giriş yapınız.');
      return;
    }

    if (user.coin_balance < selectedBet) {
      soundEngine.playError();
      toast.error('Coin bakiyen yetersiz! Günlük çarktan ücretsiz coin kazanabilirsiniz.');
      return;
    }

    setIsStarting(true);
    setIsLoading(true);
    setHitCell(null);
    setRevealedMines([]);

    // Optimistically & reactively deduct coins immediately for zero lag
    updateUserCoins(-selectedBet);

    try {
      const res = await minesService.startGame(
        user.id,
        user.username,
        selectedBet,
        selectedMines
      );

      if (res.success && res.game) {
        soundEngine.playSuccess();
        setGame(res.game);
        db.saveMinesGame(res.game);
        toast.success(res.message || 'Oyun başladı! Bol şans. 🍀');
      } else {
        // Rollback bet deduction if start failed
        updateUserCoins(selectedBet);
        soundEngine.playError();
        toast.error(res.message || 'Oyun başlatılamadı.');
        if (res.game) {
          setGame(res.game);
        }
      }
    } catch {
      updateUserCoins(selectedBet);
      soundEngine.playError();
      toast.error('Sunucu bağlantı hatası oluştu.');
    } finally {
      setIsStarting(false);
      setIsLoading(false);
    }
  }, [user, selectedBet, selectedMines, isStarting, isLoading, isCashingOut, updateUserCoins]);

  // Handle Cell Reveal
  const handleRevealCell = useCallback(async (cellIndex: number) => {
    if (!user || !game || game.status !== 'active' || isRevealing || isCashingOut) return;

    setIsRevealing(true);
    try {
      const res = await minesService.revealCell(game.id, user.id, cellIndex);

      if (res.success) {
        if (res.safe) {
          soundEngine.playCoin();
          const updatedOpened = res.opened_cells || [...game.opened_cells, cellIndex];
          const updatedMultiplier = res.multiplier || game.multiplier;
          const updatedPotentialWin = res.potential_win || game.potential_win;

          if (res.gameOver && res.status === 'won') {
            soundEngine.playWin();
            const wonGame: MinesGame = {
              ...game,
              opened_cells: updatedOpened,
              multiplier: updatedMultiplier,
              potential_win: updatedPotentialWin,
              status: 'won',
            };
            setGame(wonGame);
            db.saveMinesGame(wonGame);
            if (res.all_mines) {
              setRevealedMines(res.all_mines);
            }
            if (res.winAmount) {
              updateUserCoins(Number(res.winAmount));
            }
            toast.success(res.message || `🎉 Tebrikler! ${res.winAmount} Coin kazandınız!`);
          } else {
            const ongoingGame: MinesGame = {
              ...game,
              opened_cells: updatedOpened,
              multiplier: updatedMultiplier,
              potential_win: updatedPotentialWin,
              status: 'active',
            };
            setGame(ongoingGame);
            db.saveMinesGame(ongoingGame);
            toast.success(res.message || `💎 Güvenli! Çarpanın x${updatedMultiplier.toFixed(2)} oldu.`);
          }
        } else {
          // Hit Mine!
          soundEngine.playError();
          setHitCell(cellIndex);
          if (res.all_mines) {
            setRevealedMines(res.all_mines);
          }
          const lostGame: MinesGame = {
            ...game,
            opened_cells: res.opened_cells || [...game.opened_cells, cellIndex],
            status: 'lost',
            hit_cell: cellIndex,
          };
          setGame(lostGame);
          db.saveMinesGame(lostGame);
          toast.error(res.message || `💣 Boom! ${game.bet_amount} Coin kaybettin.`);
        }
      } else {
        toast.error(res.message || 'Kutu açılamadı.');
      }
    } catch {
      toast.error('Kutu açılırken hata oluştu.');
    } finally {
      setIsRevealing(false);
    }
  }, [user, game, isRevealing, isCashingOut, updateUserCoins]);

  // Handle Cashout
  const handleCashOut = useCallback(async () => {
    if (!user || !game || game.status !== 'active' || isCashingOut || isLoading) return;

    setIsCashingOut(true);
    setIsLoading(true);
    try {
      const res = await minesService.cashOut(game.id, user.id);

      if (res.success) {
        soundEngine.playWin();
        if (res.all_mines) {
          setRevealedMines(res.all_mines);
        }
        const cashedGame: MinesGame = {
          ...game,
          status: 'cashed_out',
        };
        setGame(cashedGame);
        db.saveMinesGame(cashedGame);
        if (res.winAmount) {
          updateUserCoins(Number(res.winAmount));
        }
        toast.success(res.message || `🎉 ${res.winAmount} Coin kazandın!`);
      } else {
        soundEngine.playError();
        toast.error(res.message || 'Kazanç alınamadı.');
      }
    } catch {
      soundEngine.playError();
      toast.error('Kazanç işlemi gerçekleştirilemedi.');
    } finally {
      setIsCashingOut(false);
      setIsLoading(false);
    }
  }, [user, game, isCashingOut, isLoading, updateUserCoins]);

  const userCoins = user?.coin_balance ?? 0;

  return (
    <div
      id="shelby-mines-page"
      className="min-h-screen pb-16 pt-2 sm:pt-4 px-3 sm:px-4 md:px-6 max-w-6xl mx-auto select-none"
    >
      {/* Top Header: Simple, Clean & High Readability */}
      <div className="flex flex-col items-center justify-center text-center mb-3 sm:mb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>💣</span>
          <span>Shelby Mines</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Mayınlardan kaç, çarpanı yükselt ve kazancını topla.
        </p>
      </div>

      {/* Guest Warning & Login Callout */}
      {!user && (
        <div className="mb-3 sm:mb-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-950/80 via-violet-950/70 to-indigo-950/80 border border-purple-600/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Oynamak İçin Oturum Açın
              </p>
              <p className="text-[10px] sm:text-xs text-purple-300">
                Giriş yaparak +250 Hoş Geldin Coini kazanın!
              </p>
            </div>
          </div>
          <NavLink
            to="/login"
            className="px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#24A1DE] to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>Giriş Yap</span>
          </NavLink>
        </div>
      )}

      {/* Main Game Layout: Desktop (2 Columns), Mobile (Stacked in Single Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start max-w-4xl mx-auto">
        {/* Sol / Üst: Multiplier HUD + 5x5 Board */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
          <MinesMultiplier
            game={game}
            selectedMineCount={selectedMines}
            selectedBetAmount={selectedBet}
          />
          <MinesBoard
            game={game}
            selectedMines={selectedMines}
            hitCell={hitCell}
            revealedMines={revealedMines}
            isRevealing={isRevealing}
            onRevealCell={handleRevealCell}
          />
        </div>

        {/* Sağ / Alt: Ergonomik Kontrol Paneli */}
        <div className="lg:col-span-5 flex flex-col justify-start w-full mt-1 lg:mt-0">
          <MinesControls
            userCoins={userCoins}
            selectedBet={selectedBet}
            onSelectBet={handleSelectBet}
            selectedMines={selectedMines}
            onSelectMines={handleSelectMines}
            game={game}
            isLoading={isLoading}
            isStarting={isStarting}
            isCashingOut={isCashingOut}
            onStartGame={handleStartGame}
            onCashOut={handleCashOut}
          />
        </div>
      </div>
    </div>
  );
};

export default MinesGamePage;
