import { errorResponse, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, getCallerUserId } from "../_shared/admin.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const userId = await getCallerUserId(req);
  if (!userId) return errorResponse("Unauthorized", 401);

  let body: { gameId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { gameId } = body;
  if (!gameId) return errorResponse("gameId is required");

  const admin = createServiceClient();

  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id, host_id, phase")
    .eq("id", gameId)
    .single();

  if (gameError || !game) return errorResponse("Game not found", 404);
  if (game.host_id !== userId) return errorResponse("Forbidden", 403);

  if (game.phase !== "finished") {
    const { error: updateError } = await admin
      .from("games")
      .update({ phase: "finished", ended_at: new Date().toISOString(), current_question_payload: null })
      .eq("id", gameId);
    if (updateError) return errorResponse(updateError.message, 500);
  }

  const { data: podium, error: podiumError } = await admin
    .from("game_players")
    .select("id, nickname, score, avatar")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(10);

  if (podiumError) return errorResponse(podiumError.message, 500);

  return jsonResponse({ podium });
});
