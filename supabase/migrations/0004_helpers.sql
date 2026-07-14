-- Helper functions used by the edge functions (via the service-role client).

-- Generates a 6-digit PIN that isn't currently in use by an active
-- (non-finished) game. Called from create-game with security definer so it
-- can check across all games regardless of RLS.
create function public.generate_game_pin() returns text
language plpgsql security definer set search_path = public as $$
declare
  candidate text;
  taken boolean;
begin
  loop
    candidate := lpad(floor(random() * 1000000)::int::text, 6, '0');
    select exists(
      select 1 from public.games where pin = candidate and phase <> 'finished'
    ) into taken;
    exit when not taken;
  end loop;
  return candidate;
end; $$;

-- Keep quizzes.updated_at current on edit.
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();
