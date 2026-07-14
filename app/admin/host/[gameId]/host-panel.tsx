"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { subscribeToGame, subscribeToPlayers } from "@/lib/realtime";
import { advanceGame, endGame } from "@/lib/functions";
import type { AdvanceGameAction, Game, GamePlayer, QuestionPayloadLive, QuestionPayloadReveal } from "@/lib/types";
import { PinDisplay } from "@/components/host/pin-display";
import { LobbyPlayers } from "@/components/host/lobby-players";
import { HostControls } from "@/components/host/host-controls";
import { QuestionCard } from "@/components/quiz/question-card";
import { AnswerButton } from "@/components/quiz/answer-button";
import { Timer } from "@/components/quiz/timer";
import { Leaderboard } from "@/components/quiz/leaderboard";
import { Podium } from "@/components/quiz/podium";
import { Card, CardContent } from "@/components/ui/card";

export function HostPanel({ initialGame, quizTitle }: { initialGame: Game; quizTitle: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [game, setGame] = useState(initialGame);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubGame = subscribeToGame(supabase, initialGame.id, setGame);
    const unsubPlayers = subscribeToPlayers(supabase, initialGame.id, setPlayers);
    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [initialGame.id, supabase]);

  const handleAction = async (action: AdvanceGameAction) => {
    setBusy(true);
    try {
      const { game: updated } = await advanceGame(supabase, { gameId: game.id, action });
      setGame(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ດຳເນີນການບໍ່ສຳເລັດ");
    } finally {
      setBusy(false);
    }
  };

  // Auto-reveal when the countdown hits zero, so players see the correct
  // answer + explanation without waiting on the host to click. Only the host
  // (authenticated, verify_jwt) can call advance-game, so this has to be
  // triggered from here rather than from each player's screen.
  const handleTimeExpired = async () => {
    try {
      const { game: updated } = await advanceGame(supabase, { gameId: game.id, action: "reveal" });
      setGame(updated);
    } catch {
      // Benign race: the host may have already revealed manually, or the
      // game already moved on — nothing to surface to the host here.
    }
  };

  const handleEnd = async () => {
    setBusy(true);
    try {
      await endGame(supabase, game.id);
      setGame((g) => ({ ...g, phase: "finished" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ຈົບເກມບໍ່ສຳເລັດ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          {quizTitle}
        </Link>
        <HostControls phase={game.phase} busy={busy} onAction={handleAction} onEnd={handleEnd} />
      </div>

      {game.phase === "lobby" && (
        <div className="flex flex-col items-center gap-6 py-6">
          <PinDisplay pin={game.pin} />
          <div className="w-full">
            <LobbyPlayers players={players} />
          </div>
        </div>
      )}

      {game.phase === "question" && game.current_question_payload && (
        <div className="flex flex-col gap-4">
          <Timer
            startedAt={game.current_question_started_at!}
            timeLimitSeconds={(game.current_question_payload as QuestionPayloadLive).timeLimitSeconds}
            onExpire={handleTimeExpired}
          />
          <QuestionCard
            body={(game.current_question_payload as QuestionPayloadLive).body}
            imageUrl={(game.current_question_payload as QuestionPayloadLive).imageUrl}
            eyebrow={`ຄຳຖາມ ${game.current_question_index + 1}`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(game.current_question_payload as QuestionPayloadLive).options.map((option, i) => (
              <AnswerButton key={option.id} index={i} label={option.label} disabled />
            ))}
          </div>
        </div>
      )}

      {game.phase === "reveal" && game.current_question_payload && (
        <div className="flex flex-col gap-4">
          <QuestionCard
            body={(game.current_question_payload as QuestionPayloadReveal).body}
            imageUrl={(game.current_question_payload as QuestionPayloadReveal).imageUrl}
            eyebrow={`ຄຳຖາມ ${game.current_question_index + 1}`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(game.current_question_payload as QuestionPayloadReveal).options.map((option, i) => (
              <AnswerButton
                key={option.id}
                index={i}
                label={option.label}
                disabled
                reveal={{ isCorrect: option.isCorrect, count: option.count }}
              />
            ))}
          </div>
          {(game.current_question_payload as QuestionPayloadReveal).explanation && (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                {(game.current_question_payload as QuestionPayloadReveal).explanation}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {game.phase === "leaderboard" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-center text-lg font-bold">ອັນດັບຄະແນນ</h1>
          <Leaderboard players={players} />
        </div>
      )}

      {game.phase === "finished" && (
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <PartyPopper className="size-12 text-primary" />
          <h1 className="text-xl font-bold">ຈົບເກມແລ້ວ!</h1>
          <Podium players={players} />
          <div className="w-full">
            <Leaderboard players={players} />
          </div>
        </div>
      )}
    </main>
  );
}
