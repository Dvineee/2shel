export type MinesGameStatus = 'active' | 'won' | 'lost' | 'cashed_out';

export interface MinesGame {
  id: string;
  user_id: string;
  username: string;
  bet_amount: number;
  mine_count: number;
  mine_positions?: number[]; // Only present when game is finished
  opened_cells: number[];
  multiplier: number;
  potential_win: number;
  status: MinesGameStatus;
  hit_cell?: number;
  created_at: string;
  finished_at?: string | null;
}

export interface MinesCellData {
  index: number;
  isOpened: boolean;
  isMine?: boolean;
  isExploded?: boolean;
  isSafe?: boolean;
}

export interface MinesStartResponse {
  success: boolean;
  game?: MinesGame;
  newBalance?: number;
  message?: string;
}

export interface MinesRevealResponse {
  success: boolean;
  safe?: boolean;
  gameOver?: boolean;
  status?: MinesGameStatus;
  opened_cells?: number[];
  multiplier?: number;
  potential_win?: number;
  winAmount?: number;
  all_mines?: number[];
  newBalance?: number;
  hitCell?: number;
  message?: string;
}

export interface MinesCashoutResponse {
  success: boolean;
  winAmount?: number;
  multiplier?: number;
  newBalance?: number;
  all_mines?: number[];
  status?: MinesGameStatus;
  message?: string;
}
