-- Row Level Security
--
-- Admins (authenticated) manage their own quizzes/questions/options/games.
-- Anon (players) may only read what a player screen needs: the `games` row
-- (phase, index, timing) and `game_players` (nickname, score, streak).
-- Every write to game state, players, credentials and answers happens only
-- through Edge Functions using the service role, which bypasses RLS — so anon
-- gets no insert/update/delete grants anywhere below.

alter table public.profiles           enable row level security;
alter table public.quizzes            enable row level security;
alter table public.questions          enable row level security;
alter table public.answer_options     enable row level security;
alter table public.games              enable row level security;
alter table public.game_players       enable row level security;
alter table public.player_credentials enable row level security;
alter table public.player_answers     enable row level security;

-- profiles: owner reads/updates self
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- quizzes: owner full control
create policy "owner quizzes" on public.quizzes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- questions / answer_options: via quiz ownership. NO anon select (protects is_correct).
create policy "owner questions" on public.questions
  for all using (exists (select 1 from public.quizzes q
                         where q.id = quiz_id and q.owner_id = auth.uid()))
  with check (exists (select 1 from public.quizzes q
                      where q.id = quiz_id and q.owner_id = auth.uid()));

create policy "owner options" on public.answer_options
  for all using (exists (select 1 from public.questions qu join public.quizzes q on q.id = qu.quiz_id
                         where qu.id = question_id and q.owner_id = auth.uid()))
  with check (exists (select 1 from public.questions qu join public.quizzes q on q.id = qu.quiz_id
                      where qu.id = question_id and q.owner_id = auth.uid()));

-- games: host full control; anon may READ (needed for realtime state on player screen)
create policy "host games" on public.games
  for all using (auth.uid() = host_id) with check (auth.uid() = host_id);
create policy "anon read games" on public.games
  for select to anon using (true);

-- game_players: everyone reads (public leaderboard/lobby). No secret columns live here.
create policy "read players" on public.game_players
  for select using (true);

-- player_credentials & player_answers: RLS on, zero policies for anon/authenticated
-- means deny-all by default. Only the service role (edge functions) touches them.

-- Host may read answers for analytics on their own games:
create policy "host reads answers" on public.player_answers
  for select using (exists (select 1 from public.games g
                            where g.id = game_id and g.host_id = auth.uid()));
