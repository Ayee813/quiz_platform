import { errorResponse, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/admin.ts";
import { calculatePoints } from "../_shared/scoring.ts";

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body: {
    gameId?: string;
    playerId?: string;
    token?: string;
    questionId?: string;
    answerOptionId?: string;
    answerText?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { gameId, playerId, token, questionId, answerOptionId, answerText } = body;
  if (!gameId || !playerId || !token || !questionId) {
    return errorResponse("gameId, playerId, token and questionId are required");
  }

  const admin = createServiceClient();

  // 1. Validate the player's one-time token.
  const { data: credential, error: credentialError } = await admin
    .from("player_credentials")
    .select("player_id, token")
    .eq("player_id", playerId)
    .eq("game_id", gameId)
    .maybeSingle();

  if (credentialError || !credential || credential.token !== token) {
    return errorResponse("Invalid player credentials", 401);
  }

  // 2. Load the game and confirm it's actually on this question right now.
  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id, phase, current_question_id, current_question_started_at")
    .eq("id", gameId)
    .single();

  if (gameError || !game) return errorResponse("Game not found", 404);
  if (game.phase !== "question" || game.current_question_id !== questionId) {
    return errorResponse("This question is not currently active", 409);
  }

  // 3. Anti-cheat timing: response time is measured from the server's own
  // record of when the question started, not anything the client reports.
  const startedAt = game.current_question_started_at ? new Date(game.current_question_started_at).getTime() : 0;
  const responseTimeMs = Math.max(0, Date.now() - startedAt);

  const { data: question, error: questionError } = await admin
    .from("questions")
    .select("id, type, time_limit_seconds, points_base, answer_options(id, label, is_correct)")
    .eq("id", questionId)
    .single();

  if (questionError || !question) return errorResponse("Question not found", 404);

  if (responseTimeMs > question.time_limit_seconds * 1000) {
    return errorResponse("Time is up for this question", 409);
  }

  // 4. Determine correctness server-side. is_correct is only ever read here,
  // with the service role — it never reaches the client before this point.
  let isCorrect = false;
  let chosenOptionId: string | null = null;

  if (question.type === "type_answer") {
    if (!answerText) return errorResponse("answerText is required for this question");
    const correctOption = question.answer_options.find((o) => o.is_correct);
    isCorrect = !!correctOption && normalize(correctOption.label) === normalize(answerText);
  } else {
    if (!answerOptionId) return errorResponse("answerOptionId is required for this question");
    const option = question.answer_options.find((o) => o.id === answerOptionId);
    if (!option) return errorResponse("Answer option does not belong to this question");
    chosenOptionId = option.id;
    isCorrect = option.is_correct;
  }

  // 5. Compute points and update the player's running score/streak.
  const { data: player, error: playerError } = await admin
    .from("game_players")
    .select("id, score, current_streak")
    .eq("id", playerId)
    .single();

  if (playerError || !player) return errorResponse("Player not found", 404);

  const { points, newStreak } = calculatePoints({
    isCorrect,
    responseTimeMs,
    timeLimitSeconds: question.time_limit_seconds,
    pointsBase: question.points_base,
    currentStreak: player.current_streak,
  });

  const { error: insertError } = await admin.from("player_answers").insert({
    game_id: gameId,
    question_id: questionId,
    player_id: playerId,
    answer_option_id: chosenOptionId,
    answer_text: question.type === "type_answer" ? answerText : null,
    is_correct: isCorrect,
    response_time_ms: responseTimeMs,
    points_awarded: points,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return errorResponse("You already answered this question", 409);
    }
    return errorResponse(insertError.message, 500);
  }

  const newScore = player.score + points;
  const { error: updateError } = await admin
    .from("game_players")
    .update({ score: newScore, current_streak: newStreak })
    .eq("id", playerId);

  if (updateError) return errorResponse(updateError.message, 500);

  return jsonResponse({ isCorrect, pointsAwarded: points, newScore });
});
