import { errorResponse, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/admin.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body: { pin?: string; nickname?: string; avatar?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const pin = body.pin?.trim();
  const nickname = body.nickname?.trim();
  const avatar = body.avatar?.trim() || null;

  if (!pin || !/^\d{6}$/.test(pin)) return errorResponse("Invalid PIN");
  if (!nickname || nickname.length < 1 || nickname.length > 20) {
    return errorResponse("Nickname must be 1-20 characters");
  }

  const admin = createServiceClient();

  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id, phase, quiz_id, quizzes(title)")
    .eq("pin", pin)
    .neq("phase", "finished")
    .maybeSingle();

  if (gameError || !game) return errorResponse("Game not found", 404);
  if (game.phase !== "lobby") return errorResponse("This game has already started", 409);

  const { data: player, error: playerError } = await admin
    .from("game_players")
    .insert({ game_id: game.id, nickname, avatar })
    .select("id")
    .single();

  if (playerError) {
    if (playerError.code === "23505") {
      return errorResponse("That nickname is already taken in this game", 409);
    }
    return errorResponse(playerError.message, 500);
  }

  const { data: credential, error: credentialError } = await admin
    .from("player_credentials")
    .insert({ player_id: player.id, game_id: game.id })
    .select("token")
    .single();

  if (credentialError || !credential) {
    return errorResponse(credentialError?.message ?? "Failed to create credentials", 500);
  }

  const quizTitle = Array.isArray(game.quizzes)
    ? (game.quizzes[0] as { title: string } | undefined)?.title
    : (game.quizzes as unknown as { title: string } | null)?.title;

  return jsonResponse(
    {
      gameId: game.id,
      playerId: player.id,
      token: credential.token,
      quizTitle: quizTitle ?? "",
    },
    201,
  );
});
