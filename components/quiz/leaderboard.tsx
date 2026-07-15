"use client";

import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarIcon } from "@/components/quiz/avatar-icon";
import type { GamePlayer } from "@/lib/types";

export function Leaderboard({
  players,
  highlightPlayerId,
  limit = 10,
}: {
  players: GamePlayer[];
  highlightPlayerId?: string;
  limit?: number;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score).slice(0, limit);

  return (
    <ol className="flex flex-col gap-2">
      {ranked.map((player, i) => (
        <li
          key={player.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-card px-4 py-3",
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
          <span className="font-bold tabular-nums text-primary">{player.score}</span>
        </li>
      ))}
      {ranked.length === 0 && (
        <li className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          ຍັງບໍ່ມີຜູ້ຫຼິ້ນ
        </li>
      )}
    </ol>
  );
}
