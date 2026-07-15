alter table public.sound_tracks         enable row level security;
alter table public.quiz_countdown_tracks enable row level security;

-- sound_tracks: owner full control. No anon/authenticated-other access needed
-- — players get resolved public URLs via the games row, never this table.
create policy "owner sound_tracks" on public.sound_tracks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- quiz_countdown_tracks: owner (of both the quiz and the track) full control.
create policy "owner quiz_countdown_tracks" on public.quiz_countdown_tracks
  for all using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
    and exists (select 1 from public.sound_tracks t where t.id = track_id and t.owner_id = auth.uid())
  );
