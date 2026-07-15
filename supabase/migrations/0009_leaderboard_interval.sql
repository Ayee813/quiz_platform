-- Auto-show the leaderboard every N questions during a live game.
-- 0 disables the automatic behavior; the host can still show it manually.
alter table public.quizzes
  add column leaderboard_interval int not null default 0
  check (leaderboard_interval >= 0);
