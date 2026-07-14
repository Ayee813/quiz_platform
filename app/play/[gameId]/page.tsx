"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, PartyPopper, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { subscribeToGame, subscribeToPlayers } from "@/lib/realtime";
import { submitAnswer } from "@/lib/functions";
import type {
  Game,
  GamePlayer,
  PlayerSession,
  QuestionPayloadLive,
  QuestionPayloadReveal,
  SubmitAnswerResponse,
} from "@/lib/types";
import { QuestionCard } from "@/components/quiz/question-card";
import { AnswerButton } from "@/components/quiz/answer-button";
import { Timer } from "@/components/quiz/timer";
import { Leaderboard } from "@/components/quiz/leaderboard";
import { Podium } from "@/components/quiz/podium";
import { AvatarIcon } from "@/components/quiz/avatar-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Submission = {
  questionId: string;
  optionId?: string;
  text?: string;
  result?: SubmitAnswerResponse;
};

function CenteredLoader() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
    </main>
  );
}

export default function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState<PlayerSession | null | undefined>(undefined);
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // localStorage only exists client-side, so this can't be a lazy useState
    // initializer without risking a hydration mismatch — it has to run post-mount.
    const raw = localStorage.getItem(`quiz_player_${gameId}`);
    if (!raw) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(JSON.parse(raw) as PlayerSession);
  }, [gameId, router]);

  useEffect(() => {
    let cancelled = false;
    let unsubGame: (() => void) | undefined;
    let unsubPlayers: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.from("games").select("*").eq("id", gameId).single();
      // Effect cleanup already ran (e.g. React Strict Mode's dev-only
      // mount->cleanup->remount) before this awaited fetch resolved — don't
      // subscribe on behalf of an effect run that's already torn down.
      if (cancelled) return;
      if (data) setGame(data as Game);
      unsubGame = subscribeToGame(supabase, gameId, setGame);
      unsubPlayers = subscribeToPlayers(supabase, gameId, setPlayers);
    })();

    return () => {
      cancelled = true;
      unsubGame?.();
      unsubPlayers?.();
    };
  }, [gameId, supabase]);

  if (session === undefined || !game) return <CenteredLoader />;
  if (session === null) return null;

  const me = players.find((p) => p.id === session.playerId);
  const hasAnsweredCurrent = submission?.questionId === game.current_question_id;

  const handleSubmit = async (optionId?: string, text?: string) => {
    // Guard on hasAnsweredCurrent, not on `submission` truthiness — `submission`
    // stays set to the *previous* question's answer until a new one is submitted,
    // so checking it directly would silently block every question after the first.
    if (!game.current_question_id || submitting || hasAnsweredCurrent) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer(supabase, {
        gameId,
        playerId: session.playerId,
        token: session.token,
        questionId: game.current_question_id,
        answerOptionId: optionId,
        answerText: text,
      });
      setSubmission({ questionId: game.current_question_id, optionId, text, result });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ສົ່ງຄຳຕອບບໍ່ສຳເລັດ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarIcon avatar={me?.avatar} className="size-5 text-primary" />
          <span className="font-semibold">{session.nickname}</span>
        </div>
        <span className="font-bold tabular-nums text-primary">{me?.score ?? 0} ຄະແນນ</span>
      </header>

      {game.phase === "lobby" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <ShieldCheck className="size-16 text-primary" />
          <h1 className="text-xl font-bold">ທ່ານເຂົ້າຮ່ວມແລ້ວ!</h1>
          <p className="text-muted-foreground">ລໍຖ້າຜູ້ດູແລລະບົບເລີ່ມເກມ... ({players.length} ຄົນເຂົ້າຮ່ວມ)</p>
        </div>
      )}

      {game.phase === "question" && game.current_question_payload && (
        <QuestionPhase
          key={game.current_question_id}
          payload={game.current_question_payload as QuestionPayloadLive}
          startedAt={game.current_question_started_at!}
          answered={hasAnsweredCurrent}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}

      {game.phase === "reveal" && game.current_question_payload && (
        <RevealPhase
          payload={game.current_question_payload as QuestionPayloadReveal}
          submission={hasAnsweredCurrent ? submission : null}
        />
      )}

      {game.phase === "leaderboard" && (
        <div className="flex flex-1 flex-col gap-4">
          <h1 className="text-center text-lg font-bold">ອັນດັບຄະແນນ</h1>
          <Leaderboard players={players} highlightPlayerId={session.playerId} />
        </div>
      )}

      {game.phase === "finished" && (
        <div className="flex flex-1 flex-col items-center gap-6 py-6 text-center">
          <PartyPopper className="size-12 text-primary" />
          <h1 className="text-xl font-bold">ຈົບເກມແລ້ວ!</h1>
          <Podium players={players} />
          <Leaderboard players={players} highlightPlayerId={session.playerId} />
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem(`quiz_player_${gameId}`);
              router.push("/");
            }}
          >
            ກັບໜ້າຫຼັກ
          </Button>
        </div>
      )}
    </main>
  );
}

function QuestionPhase({
  payload,
  startedAt,
  answered,
  submitting,
  onSubmit,
}: {
  payload: QuestionPayloadLive;
  startedAt: string;
  answered: boolean;
  submitting: boolean;
  onSubmit: (optionId?: string, text?: string) => void;
}) {
  // This component is remounted (via `key={questionId}`) each time a new
  // question starts, so this local state naturally resets with it.
  const [answerText, setAnswerText] = useState("");
  const [expired, setExpired] = useState(false);
  const locked = answered || expired;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Timer
        startedAt={startedAt}
        timeLimitSeconds={payload.timeLimitSeconds}
        onExpire={() => setExpired(true)}
      />

      {answered ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium text-muted-foreground">ສົ່ງຄຳຕອບແລ້ວ, ລໍຖ້າຄົນອື່ນ...</p>
        </div>
      ) : expired ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="font-medium text-muted-foreground">ໝົດເວລາ!</p>
        </div>
      ) : (
        <>
          <QuestionCard body={payload.body} imageUrl={payload.imageUrl} />
          {payload.type === "type_answer" ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (answerText.trim()) onSubmit(undefined, answerText.trim());
              }}
            >
              <Input
                autoFocus
                placeholder="ພິມຄຳຕອບຂອງທ່ານ..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                disabled={submitting || locked}
              />
              <Button type="submit" disabled={submitting || locked || !answerText.trim()}>
                ສົ່ງ
              </Button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {payload.options.map((option, i) => (
                <AnswerButton
                  key={option.id}
                  index={i}
                  label={option.label}
                  disabled={submitting || locked}
                  onClick={() => onSubmit(option.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RevealPhase({
  payload,
  submission,
}: {
  payload: QuestionPayloadReveal;
  submission: Submission | null;
}) {
  const myResult = submission?.result;
  const answeredCorrectly = myResult?.isCorrect ?? false;
  const didAnswer = !!submission;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center ${
          didAnswer
            ? answeredCorrectly
              ? "border-primary bg-secondary"
              : "border-destructive bg-destructive/10"
            : "border-muted-foreground/30 bg-muted"
        }`}
      >
        {didAnswer ? (
          answeredCorrectly ? (
            <Check className="size-8 text-primary" />
          ) : (
            <X className="size-8 text-destructive" />
          )
        ) : null}
        <p className="text-lg font-bold">
          {!didAnswer ? "ທ່ານບໍ່ໄດ້ຕອບຄຳຖາມນີ້" : answeredCorrectly ? "ຖືກຕ້ອງ!" : "ບໍ່ຖືກຕ້ອງ"}
        </p>
        {didAnswer && <p className="font-semibold text-primary">+{myResult?.pointsAwarded ?? 0} ຄະແນນ</p>}
      </div>

      <QuestionCard body={payload.body} imageUrl={payload.imageUrl} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {payload.options.map((option, i) => (
          <AnswerButton
            key={option.id}
            index={i}
            label={option.label}
            disabled
            reveal={{ isCorrect: option.isCorrect, count: option.count }}
          />
        ))}
      </div>

      {payload.explanation && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">{payload.explanation}</CardContent>
        </Card>
      )}
    </div>
  );
}
