import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game, GamePlayer } from "@/lib/types";

// supabase-js reuses any existing channel that shares a topic name — and
// `removeChannel` tears one down asynchronously (it awaits the server's
// unsubscribe ack). That combination means a fixed topic name like
// `game:${gameId}` can collide with a not-yet-torn-down channel from a
// previous subscribe/unsubscribe cycle (e.g. React StrictMode's dev-only
// mount->cleanup->remount), and `.on()` then throws because the reused
// channel is already joined/joining. A random suffix makes every
// subscription its own topic so there's nothing to collide with.
function uniqueTopic(prefix: string, gameId: string) {
  return `${prefix}:${gameId}:${Math.random().toString(36).slice(2)}`;
}

// Drives phase transitions (lobby -> question -> reveal -> leaderboard ->
// finished), the current question payload, and the server timestamp each
// client uses to compute its own local countdown.
export function subscribeToGame(
  supabase: SupabaseClient,
  gameId: string,
  onUpdate: (game: Game) => void,
) {
  const channel = supabase
    .channel(uniqueTopic("game", gameId))
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
      (payload) => onUpdate(payload.new as Game),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Live player list for the lobby and live leaderboard. Player counts in a
// classroom-sized game are small, so on any insert/update we just refetch
// the full sorted list rather than reconciling diffs client-side.
export function subscribeToPlayers(
  supabase: SupabaseClient,
  gameId: string,
  onChange: (players: GamePlayer[]) => void,
) {
  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("game_players")
      .select("*")
      .eq("game_id", gameId)
      .order("score", { ascending: false });
    onChange((data as GamePlayer[]) ?? []);
  };

  const channel = supabase
    .channel(uniqueTopic("game-players", gameId))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
      () => fetchPlayers(),
    )
    .subscribe();

  fetchPlayers();

  return () => {
    supabase.removeChannel(channel);
  };
}
