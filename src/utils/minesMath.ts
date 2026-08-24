/**
 * Shelby Mines Math & Probability Utility
 *
 * Total tiles: 25 (5x5 grid)
 * Mine count M in {3, 5, 10}
 * Safe count S = 25 - M
 *
 * Formula:
 * P(k) = Product_{i=0}^{k-1} ((25 - M - i) / (25 - i))
 * Fair Multiplier = 1 / P(k)
 * House Edge: 17% (%17 House Edge => 83% RTP) => finalMultiplier = fairMultiplier * 0.83
 * For k = 0: Multiplier = 1.00
 */

export const TOTAL_TILES = 25;
export const HOUSE_EDGE = 0.17; // 17% House Edge (%17)

/**
 * Calculates the exact theoretical multiplier based on mine count and number of safe tiles opened.
 */
export function calculateMultiplier(mineCount: number, safeOpened: number): number {
  if (safeOpened <= 0) return 1.0;

  const total = TOTAL_TILES;
  const safeTotal = total - mineCount;

  if (safeOpened > safeTotal) {
    safeOpened = safeTotal;
  }

  let probability = 1.0;
  for (let i = 0; i < safeOpened; i++) {
    probability *= (safeTotal - i) / (total - i);
  }

  if (probability <= 0) return 1.0;

  const fairMultiplier = 1 / probability;
  const finalMultiplier = fairMultiplier * (1 - HOUSE_EDGE); // fairMultiplier * 0.90

  // Round to 2 decimal places (minimum 1.01 if safeOpened >= 1)
  return Math.max(1.01, Math.round(finalMultiplier * 100) / 100);
}

/**
 * Gets the next multiplier if the user opens one more safe tile.
 */
export function calculateNextMultiplier(mineCount: number, currentSafeOpened: number): number {
  return calculateMultiplier(mineCount, currentSafeOpened + 1);
}

/**
 * Calculates the total potential payout based on bet and multiplier.
 */
export function calculatePotentialWin(betAmount: number, multiplier: number): number {
  return Math.round(betAmount * multiplier * 100) / 100;
}

/**
 * Calculates win probability percentage for the next tile.
 */
export function getNextTileWinProbability(mineCount: number, safeOpened: number): number {
  const remainingTiles = TOTAL_TILES - safeOpened;
  const remainingSafe = TOTAL_TILES - mineCount - safeOpened;
  if (remainingTiles <= 0 || remainingSafe <= 0) return 0;
  return Math.round((remainingSafe / remainingTiles) * 1000) / 10;
}
