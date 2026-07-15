-- Uploadable background/countdown music. Actual audio bytes live in the
-- 'audio' storage bucket (see 0007_audio_storage.sql); this table only
-- tracks ownership + metadata, including the real (client-probed) duration
-- so advance-game can compute a playback rate that lines the track up with
-- each question's own time limit.

create table public.sound_tracks (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  type             text not null check (type in ('background', 'countdown')),
  title            text not null,
  storage_path     text not null,
  duration_seconds numeric not null check (duration_seconds > 0),
  created_at       timestamptz not null default now()
);

create index sound_tracks_owner_id_idx on public.sound_tracks(owner_id, type);

-- One background track per quiz (plays during lobby/reveal/leaderboard).
alter table public.quizzes
  add column background_track_id uuid references public.sound_tracks(id) on delete set null;

-- A quiz's pool of countdown tracks — advance-game picks one at random for
-- each question and syncs its playback rate to that question's time limit.
create table public.quiz_countdown_tracks (
  quiz_id  uuid not null references public.quizzes(id) on delete cascade,
  track_id uuid not null references public.sound_tracks(id) on delete cascade,
  primary key (quiz_id, track_id)
);

-- Resolved public URL, snapshotted onto the game at create-game time so
-- players/host get it straight from the realtime-published `games` row.
alter table public.games
  add column background_music_url text;
