"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarIcon } from "@/components/quiz/avatar-icon";
import { AnimatedNumber, lastShownScores } from "@/components/quiz/score-anim";
import type { GamePlayer } from "@/lib/types";

const PODIUM_ORDER = [1, 0, 2]; // display 2nd, 1st, 3rd like a physical podium
const HEIGHTS = ["h-28", "h-40", "h-20"];
const AVATAR_SIZES = ["size-14", "size-20", "size-12"];
const RANK_COLORS = ["text-chart-3", "text-chart-1", "text-chart-5"];
const RANK_BORDERS = ["border-chart-3", "border-chart-1", "border-chart-5"];

// Suspense beat between each place being revealed: 3rd pops first, then
// 2nd, then the winner last.
const REVEAL_STEP_MS = 450;

export function Podium({
  players,
}: {
  players: Pick<GamePlayer, "id" | "nickname" | "score" | "avatar">[];
}) {
  const top3 = [...players].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-3">
      {PODIUM_ORDER.map((rank, i) => {
        const player = top3[rank];
        if (!player) return <div key={rank} className="w-24" />;
        const delayMs = (2 - rank) * REVEAL_STEP_MS;
        return (
          <div key={player.id} className="flex w-24 flex-col items-center gap-2">
            <div className="podium-pop flex flex-col items-center gap-2" style={{ animationDelay: `${delayMs}ms` }}>
              <div className="relative">
                <AvatarIcon
                  avatar={player.avatar}
                  className={cn("rounded-full border-2 bg-muted", AVATAR_SIZES[i], RANK_BORDERS[i])}
                />
                <Trophy
                  className={cn(
                    "absolute -right-1 -bottom-1 size-5 rounded-full bg-card p-0.5",
                    RANK_COLORS[i],
                  )}
                />
              </div>
              <span className="w-full truncate text-center text-sm font-semibold">{player.nickname}</span>
              <span className="text-xs font-bold text-primary">
                <AnimatedNumber
                  from={lastShownScores.get(player.id) ?? 0}
                  value={player.score}
                  duration={900 + delayMs}
                />
              </span>
            </div>
            <div
              className={cn(
                "podium-bar-in flex w-full items-start justify-center rounded-t-lg bg-secondary pt-1 text-lg font-bold text-secondary-foreground",
                HEIGHTS[i],
              )}
              style={{ animationDelay: `${delayMs}ms` }}
            >
              {rank + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
