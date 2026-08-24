import {
  MinesGame,
  MinesStartResponse,
  MinesRevealResponse,
  MinesCashoutResponse,
} from '../types/mines';

export const minesService = {
  /**
   * Fetches the user's active game if any exists
   */
  async getActiveGame(userId: string): Promise<MinesGame | null> {
    try {
      const res = await fetch(`/api/mines/active?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.game) {
          return data.game as MinesGame;
        }
      }
    } catch (err) {
      console.warn('minesService.getActiveGame error:', err);
    }
    return null;
  },

  /**
   * Starts a new game on the server
   */
  async startGame(
    userId: string,
    username: string,
    betAmount: number,
    mineCount: number
  ): Promise<MinesStartResponse> {
    try {
      const res = await fetch('/api/mines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username, betAmount, mineCount }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return data as MinesStartResponse;
      }

      return {
        success: false,
        message: data.message || 'Oyun başlatılamadı.',
        game: data.game,
      };
    } catch (err: any) {
      console.error('minesService.startGame error:', err);
      return {
        success: false,
        message: 'Sunucu bağlantı hatası oluştu.',
      };
    }
  },

  /**
   * Reveals a cell on the server
   */
  async revealCell(
    gameId: string,
    userId: string,
    cellIndex: number
  ): Promise<MinesRevealResponse> {
    try {
      const res = await fetch('/api/mines/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, userId, cellIndex }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return data as MinesRevealResponse;
      }

      return {
        success: false,
        message: data.message || 'Kutu açılamadı.',
      };
    } catch (err: any) {
      console.error('minesService.revealCell error:', err);
      return {
        success: false,
        message: 'Sunucu bağlantı hatası oluştu.',
      };
    }
  },

  /**
   * Cashes out the current win
   */
  async cashOut(gameId: string, userId: string): Promise<MinesCashoutResponse> {
    try {
      const res = await fetch('/api/mines/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, userId }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return data as MinesCashoutResponse;
      }

      return {
        success: false,
        message: data.message || 'Kazanç alınamadı.',
      };
    } catch (err: any) {
      console.error('minesService.cashOut error:', err);
      return {
        success: false,
        message: 'Sunucu bağlantı hatası oluştu.',
      };
    }
  },
};

