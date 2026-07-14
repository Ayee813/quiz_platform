import { errorResponse, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, getCallerUserId } from "../_shared/admin.ts";

type Action = "start" | "next" | "reveal" | "leaderboard" | "end";
const VALID_ACTIONS: Action[] = ["start", "next", "reveal", "leaderboard", "end"];

type QuestionRow = {
  id: string;
  order_index: number;
  type: string;
  body: string;
  image_url: string | null;
  explanation: string | null;
  time_limit_seconds: number;
  points_base: number;
  answer_options: {
    id: string;
    order_index: number;
    label: string;
    is_correct: boolean;
  }[];
};

function questionPayloadForQuestionPhase(q: QuestionRow) {
  return {
    id: q.id,
    type: q.type,
    body: q.body,
    imageUrl: q.image_url,
    timeLimitSeconds: q.time_limit_seconds,
    pointsBase: q.points_base,
    options: q.answer_options
      .sort((a, b) => a.order_index - b.order_index)
      .map((o) => ({ id: o.id, label: o.label })),
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const userId = await getCallerUserId(req);
  if (!userId) return errorResponse("Unauthorized", 401);

  let body: { gameId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { gameId } = body;
  const action = body.action as Action | undefined;

  if (!gameId) return errorResponse("gameId is required");
  if (!action || !VALID_ACTIONS.includes(action)) return errorResponse("Invalid action");

  const admin = createServiceClient();

  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id, quiz_id, host_id, phase, current_question_index")
    .eq("id", gameId)
    .single();

  if (gameError || !game) return errorResponse("Game not found", 404);
  if (game.host_id !== userId) return errorResponse("Forbidden", 403);
  if (game.phase === "finished") return errorResponse("Game already finished", 409);

  if (action === "start" && game.phase !== "lobby") {
    return errorResponse("Game has already started", 409);
  }
  if (action === "next" && game.phase !== "reveal" && game.phase !== "leaderboard") {
    return errorResponse("Reveal the current question before advancing", 409);
  }

  if (action === "start" || action === "next") {
    const { data: questions, error: questionsError } = await admin
      .from("questions")
      .select("id, order_index, type, body, image_url, explanation, time_limit_seconds, points_base, answer_options(id, order_index, label, is_correct)")
      .eq("quiz_id", game.quiz_id)
      .order("order_index", { ascending: true });

    if (questionsError || !questions) return errorResponse("Failed to load questions", 500);

    const nextIndex = game.current_question_index + 1;
    const nextQuestion = questions[nextIndex] as unknown as QuestionRow | undefined;

    if (!nextQuestion) {
      const { data: updated, error: updateError } = await admin
        .from("games")
        .update({ phase: "finished", ended_at: new Date().toISOString(), current_question_payload: null })
        .eq("id", gameId)
        .select()
        .single();
      if (updateError) return errorResponse(updateError.message, 500);
      return jsonResponse({ game: updated });
    }

    const { data: updated, error: updateError } = await admin
      .from("games")
      .update({
        phase: "question",
        current_question_index: nextIndex,
        current_question_id: nextQuestion.id,
        current_question_started_at: new Date().toISOString(),
        current_question_payload: questionPayloadForQuestionPhase(nextQuestion),
      })
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) return errorResponse(updateError.message, 500);
    return jsonResponse({ game: updated });
  }

  if (action === "reveal") {
    if (game.phase !== "question") return errorResponse("Game is not currently on a question", 409);

    const { data: currentGame } = await admin
      .from("games")
      .select("current_question_id")
      .eq("id", gameId)
      .single();

    if (!currentGame?.current_question_id) return errorResponse("No active question", 409);

    const { data: q, error: qError } = await admin
      .from("questions")
      .select("id, type, body, image_url, explanation, time_limit_seconds, points_base, answer_options(id, order_index, label, is_correct)")
      .eq("id", currentGame.current_question_id)
      .single();

    if (qError || !q) return errorResponse("Question not found", 404);

    const { data: answerCounts } = await admin
      .from("player_answers")
      .select("answer_option_id")
      .eq("game_id", gameId)
      .eq("question_id", q.id);

    const counts: Record<string, number> = {};
    for (const a of answerCounts ?? []) {
      if (!a.answer_option_id) continue;
      counts[a.answer_option_id] = (counts[a.answer_option_id] ?? 0) + 1;
    }

    const payload = {
      id: q.id,
      type: q.type,
      body: q.body,
      imageUrl: q.image_url,
      explanation: q.explanation,
      options: (q.answer_options as QuestionRow["answer_options"])
        .sort((a, b) => a.order_index - b.order_index)
        .map((o) => ({ id: o.id, label: o.label, isCorrect: o.is_correct, count: counts[o.id] ?? 0 })),
    };

    const { data: updated, error: updateError } = await admin
      .from("games")
      .update({ phase: "reveal", current_question_payload: payload })
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) return errorResponse(updateError.message, 500);
    return jsonResponse({ game: updated });
  }

  if (action === "leaderboard") {
    if (game.phase !== "reveal") return errorResponse("Reveal the question before showing the leaderboard", 409);

    const { data: updated, error: updateError } = await admin
      .from("games")
      .update({ phase: "leaderboard" })
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) return errorResponse(updateError.message, 500);
    return jsonResponse({ game: updated });
  }

  // action === "end"
  const { data: updated, error: updateError } = await admin
    .from("games")
    .update({ phase: "finished", ended_at: new Date().toISOString(), current_question_payload: null })
    .eq("id", gameId)
    .select()
    .single();

  if (updateError) return errorResponse(updateError.message, 500);
  return jsonResponse({ game: updated });
});
