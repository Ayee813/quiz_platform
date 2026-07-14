import { errorResponse, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, getCallerUserId } from "../_shared/admin.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const userId = await getCallerUserId(req);
  if (!userId) return errorResponse("Unauthorized", 401);

  let body: { quizId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { quizId } = body;
  if (!quizId) return errorResponse("quizId is required");

  const admin = createServiceClient();

  const { data: quiz, error: quizError } = await admin
    .from("quizzes")
    .select("id, owner_id")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) return errorResponse("Quiz not found", 404);
  if (quiz.owner_id !== userId) return errorResponse("Forbidden", 403);

  const { count: questionCount } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  if (!questionCount) return errorResponse("Quiz has no questions yet", 400);

  const { data: pinData, error: pinError } = await admin.rpc("generate_game_pin");
  if (pinError || !pinData) return errorResponse("Failed to generate PIN", 500);

  const { data: game, error: insertError } = await admin
    .from("games")
    .insert({
      quiz_id: quizId,
      host_id: userId,
      pin: pinData,
      phase: "lobby",
    })
    .select("id, pin")
    .single();

  if (insertError || !game) return errorResponse(insertError?.message ?? "Failed to create game", 500);

  return jsonResponse({ gameId: game.id, pin: game.pin }, 201);
});
