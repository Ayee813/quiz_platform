"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarIcon } from "@/components/quiz/avatar-icon";
import { AnimatedNumber, lastShownScores, useFlip } from "@/components/quiz/score-anim";
import type { GamePlayer } from "@/lib/types";

// Two-beat Kahoot-style reveal: rows stagger in showing the PREVIOUS
// ranking/scores, hold a moment, then scores count up, "+N" chips pop and
// rows glide (FLIP) into the new order.
const REVEAL_DELAY_MS = 1000;
const COUNT_UP_MS = 1100;

export function Leaderboard({
  players,
  highlightPlayerId,
  limit = 10,
}: {
  players: GamePlayer[];
  highlightPlayerId?: string;
  limit?: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const registerRow = useFlip();

  // Latest players for the reveal-timeout below without retriggering it.
  const playersRef = useRef(players);
  playersRef.current = players;

  // Every player's score as it was last shown, snapshotted once on mount —
  // this is the "before" frame of the animation.
  const prevScoresRef = useRef<Map<string, number> | null>(null);
  prevScoresRef.current ??= new Map(players.map((p) => [p.id, lastShownScores.get(p.id) ?? 0]));
  const prevScoreOf = (p: GamePlayer) => prevScoresRef.current?.get(p.id) ?? 0;

  useEffect(() => {
    const t = setTimeout(() => {
      setRevealed(true);
      // Recorded at reveal time (not unmount) so an interrupted screen
      // still animates from the last state the audience actually saw.
      for (const p of playersRef.current) lastShownScores.set(p.id, p.score);
    }, REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const ranked = [...players]
    .sort((a, b) =>
      revealed
        ? b.score - a.score || prevScoreOf(b) - prevScoreOf(a)
        : prevScoreOf(b) - prevScoreOf(a) || b.score - a.score,
    )
    .slice(0, limit);

  return (
    <ol className="flex flex-col gap-2">
      {ranked.map((player, i) => {
        const gained = player.score - prevScoreOf(player);
        return (
          <li
            key={player.id}
            ref={registerRow(player.id)}
            style={{ animationDelay: `${i * 50}ms` }}
            className={cn(
              "leaderboard-row-in flex items-center gap-3 rounded-lg border bg-card px-4 py-3",
              player.id === highlightPlayerId && "border-primary bg-secondary",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {i === 0 ? <Trophy className="size-4 text-primary" /> : i + 1}
            </span>
            <AvatarIcon avatar={player.avatar} className="size-9 shrink-0 rounded-full bg-muted" />
            <span className="flex-1 truncate font-medium">{player.nickname}</span>
            {player.current_streak >= 2 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Flame className="size-3.5 text-chart-4" />
                {player.current_streak}
              </span>
            )}
            {revealed && gained > 0 && (
              <span className="score-pop rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                +{gained}
              </span>
            )}
            <span className="font-bold tabular-nums text-primary">
              <AnimatedNumber
                from={prevScoreOf(player)}
                value={revealed ? player.score : prevScoreOf(player)}
                duration={COUNT_UP_MS}
              />
            </span>
          </li>
        );
      })}
      {ranked.length === 0 && (
        <li className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          ຍັງບໍ່ມີຜູ້ຫຼິ້ນ
        </li>
      )}
    </ol>
  );
}
