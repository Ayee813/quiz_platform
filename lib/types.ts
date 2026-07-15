export type GamePhase = "lobby" | "question" | "reveal" | "leaderboard" | "finished";
export type QuestionType = "multiple_choice" | "true_false" | "type_answer";

export type Quiz = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  background_track_id: string | null;
  // Auto-show the leaderboard every N questions; 0 disables it.
  leaderboard_interval: number;
  created_at: string;
  updated_at: string;
};

export type SoundTrackType = "background" | "countdown";

export type SoundTrack = {
  id: string;
  owner_id: string;
  type: SoundTrackType;
  title: string;
  storage_path: string;
  duration_seconds: number;
  created_at: string;
};

export type Question = {
  id: string;
  quiz_id: string;
  order_index: number;
  type: QuestionType;
  body: string;
  image_url: string | null;
  explanation: string | null;
  time_limit_seconds: number;
  points_base: number;
  created_at: string;
};

export type AnswerOption = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
  is_correct: boolean;
};

// A question with its options, as read by the quiz owner (RLS grants this —
// it's never sent to players before they've answered).
export type QuestionWithOptions = Question & { answer_options: AnswerOption[] };

// Sanitized question payload embedded in games.current_question_payload
// while phase = 'question'. No is_correct, no explanation.
export type QuestionPayloadLive = {
  id: string;
  type: QuestionType;
  body: string;
  imageUrl: string | null;
  timeLimitSeconds: number;
  pointsBase: number;
  options: { id: string; label: string }[];
  // Randomly picked per question from the quiz's countdown-track pool.
  // countdownPlaybackRate = track.duration_seconds / timeLimitSeconds, so
  // playing the track at that rate makes it end exactly when time runs out.
  countdownMusicUrl?: string | null;
  countdownPlaybackRate?: number | null;
};

// Sanitized question payload embedded in games.current_question_payload
// while phase = 'reveal'. Includes correctness + live answer counts.
export type QuestionPayloadReveal = {
  id: string;
  type: QuestionType;
  body: string;
  imageUrl: string | null;
  explanation: string | null;
  options: { id: string; label: string; isCorrect: boolean; count: number }[];
};

export type QuestionPayload = QuestionPayloadLive | QuestionPayloadReveal;

export type Game = {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  phase: GamePhase;
  current_question_index: number;
  current_question_id: string | null;
  current_question_started_at: string | null;
  current_question_payload: QuestionPayload | null;
  background_music_url: string | null;
  created_at: string;
  ended_at: string | null;
};

export type GamePlayer = {
  id: string;
  game_id: string;
  nickname: string;
  score: number;
  current_streak: number;
  avatar: string | null;
  joined_at: string;
};

export type PlayerAnswer = {
  id: string;
  game_id: string;
  question_id: string;
  player_id: string;
  answer_option_id: string | null;
  answer_text: string | null;
  is_correct: boolean;
  response_time_ms: number;
  points_awarded: number;
  answered_at: string;
};

// Stored client-side (localStorage) after join-game so a player can
// reconnect/refresh mid-game without re-joining.
export type PlayerSession = {
  gameId: string;
  playerId: string;
  token: string;
  nickname: string;
  quizTitle: string;
};

// --- Edge function request/response shapes ---

export type CreateGameResponse = { gameId: string; pin: string };

export type JoinGameResponse = {
  gameId: string;
  playerId: string;
  token: string;
  quizTitle: string;
};

export type AdvanceGameAction = "start" | "next" | "reveal" | "leaderboard" | "end";
export type AdvanceGameResponse = { game: Game };

export type SubmitAnswerResponse = {
  isCorrect: boolean;
  pointsAwarded: number;
  newScore: number;
};

export type EndGameResponse = {
  podium: { id: string; nickname: string; score: number; avatar: string | null }[];
};

export type EdgeFunctionError = { error: string };
