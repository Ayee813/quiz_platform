// Kahoot-style scoring, mirrored from supabase/functions/_shared/scoring.ts.
// Used client-side only for UI previews (e.g. showing a possible point range
// in the quiz editor) — the server's copy is the one that actually awards
// points, so keep these constants in sync by hand if either changes.

export const MAX_STREAK_BONUS_STREAK = 5;
export const STREAK_BONUS_PER_STEP = 50;
export const MAX_STREAK_BONUS = MAX_STREAK_BONUS_STREAK * STREAK_BONUS_PER_STEP;

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
