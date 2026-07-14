import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdvanceGameAction,
  AdvanceGameResponse,
  CreateGameResponse,
  EndGameResponse,
  JoinGameResponse,
  SubmitAnswerResponse,
} from "@/lib/types";

async function invoke<T>(
  supabase: SupabaseClient,
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // supabase-js surfaces non-2xx responses as FunctionsHttpError, whose
    // `context` is the raw Response — our function bodies are { error: string }.
    let message = error.message || "ເກີດຂໍ້ຜິດພາດ";
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const parsed = await context.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        // non-JSON error body; fall back to error.message
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export const createGame = (supabase: SupabaseClient, quizId: string) =>
  invoke<CreateGameResponse>(supabase, "create-game", { quizId });

export const joinGame = (
  supabase: SupabaseClient,
  params: { pin: string; nickname: string; avatar?: string },
) => invoke<JoinGameResponse>(supabase, "join-game", params);

export const advanceGame = (
  supabase: SupabaseClient,
  params: { gameId: string; action: AdvanceGameAction },
) => invoke<AdvanceGameResponse>(supabase, "advance-game", params);

export const submitAnswer = (
  supabase: SupabaseClient,
  params: {
    gameId: string;
    playerId: string;
    token: string;
    questionId: string;
    answerOptionId?: string;
    answerText?: string;
  },
) => invoke<SubmitAnswerResponse>(supabase, "submit-answer", params);

export const endGame = (supabase: SupabaseClient, gameId: string) =>
  invoke<EndGameResponse>(supabase, "end-game", { gameId });
