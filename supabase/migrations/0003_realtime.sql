-- Realtime: only publish the non-secret tables players/hosts need to drive
-- their screens. player_credentials, player_answers, questions and
-- answer_options are never published (they either hold secrets or would leak
-- correct answers before reveal).

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.game_players;
