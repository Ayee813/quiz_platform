// Kahoot-style scoring. Mirrored in lib/scoring.ts for UI previews — this
// copy is the authoritative one actually used to award points.

const MAX_STREAK_BONUS_STREAK = 5;
const STREAK_BONUS_PER_STEP = 50;

export function calculatePoints(params: {
  isCorrect: boolean;
  responseTimeMs: number;
  timeLimitSeconds: number;
  pointsBase: number;
  currentStreak: number;
}): { points: number; newStreak: number } {
  const { isCorrect, responseTimeMs, timeLimitSeconds, pointsBase, currentStreak } = params;

  if (!isCorrect) {
    return { points: 0, newStreak: 0 };
  }

  const frac = Math.min(responseTimeMs / (timeLimitSeconds * 1000), 1);
  const base = Math.round(pointsBase * (1 - frac / 2));
  const streakBonus = Math.min(currentStreak, MAX_STREAK_BONUS_STREAK) * STREAK_BONUS_PER_STEP;

  return { points: base + streakBonus, newStreak: currentStreak + 1 };
}
