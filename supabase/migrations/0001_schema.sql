-- CEIT Cyber Security Live Quiz Platform — core schema

create extension if not exists "pgcrypto";

-- Admin profile, 1:1 with auth.users
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role         text not null default 'admin',
  created_at   timestamptz not null default now()
);

create table public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  cover_image_url text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.questions (
  id                 uuid primary key default gen_random_uuid(),
  quiz_id            uuid not null references public.quizzes(id) on delete cascade,
  order_index        int  not null default 0,
  type               text not null default 'multiple_choice'
                     check (type in ('multiple_choice','true_false','type_answer')),
  body               text not null,
  image_url          text,
  explanation        text,
  time_limit_seconds int  not null default 20,
  points_base        int  not null default 1000,
  created_at         timestamptz not null default now()
);

create table public.answer_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  order_index int  not null default 0,
  label       text not null,
  is_correct  boolean not null default false
);

create table public.games (
  id                          uuid primary key default gen_random_uuid(),
  quiz_id                     uuid not null references public.quizzes(id),
  host_id                     uuid not null references public.profiles(id),
  pin                         text not null,
  phase                       text not null default 'lobby'
                              check (phase in ('lobby','question','reveal','leaderboard','finished')),
  current_question_index      int  not null default -1,
  current_question_id         uuid references public.questions(id),
  current_question_started_at timestamptz,
  -- Sanitized question payload (never includes is_correct while phase =
  -- 'question'; includes it + explanation + answer counts once phase =
  -- 'reveal'). Embedding it here lets players/host get question content from
  -- the realtime-published `games` row without any RLS access to
  -- `questions`/`answer_options` directly.
  current_question_payload    jsonb,
  created_at                  timestamptz not null default now(),
  ended_at                    timestamptz
);
-- PIN must be unique among games that are still joinable/active
create unique index games_active_pin_idx on public.games(pin)
  where phase <> 'finished';

create table public.game_players (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references public.games(id) on delete cascade,
  nickname       text not null,
  score          int  not null default 0,
  current_streak int not null default 0,
  avatar         text,
  joined_at      timestamptz not null default now(),
  unique (game_id, nickname)
);

-- Secret token, kept OUT of game_players so anon can never read it
create table public.player_credentials (
  player_id  uuid primary key references public.game_players(id) on delete cascade,
  token      uuid not null default gen_random_uuid(),
  game_id    uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.player_answers (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references public.games(id) on delete cascade,
  question_id      uuid not null references public.questions(id) on delete cascade,
  player_id        uuid not null references public.game_players(id) on delete cascade,
  answer_option_id uuid references public.answer_options(id),
  answer_text      text,
  is_correct       boolean not null default false,
  response_time_ms int not null default 0,
  points_awarded   int not null default 0,
  answered_at      timestamptz not null default now(),
  unique (game_id, question_id, player_id)  -- one answer per question per player
);

create index questions_quiz_id_idx on public.questions(quiz_id, order_index);
create index answer_options_question_id_idx on public.answer_options(question_id, order_index);
create index games_quiz_id_idx on public.games(quiz_id);
create index games_host_id_idx on public.games(host_id);
create index game_players_game_id_idx on public.game_players(game_id);
create index player_answers_game_question_idx on public.player_answers(game_id, question_id);

-- Auto-create a profile when an admin signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
