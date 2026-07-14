"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GamePlayer } from "@/lib/types";

const PODIUM_ORDER = [1, 0, 2]; // display 2nd, 1st, 3rd like a physical podium
const HEIGHTS = ["h-28", "h-40", "h-20"];

export function Podium({ players }: { players: Pick<GamePlayer, "id" | "nickname" | "score">[] }) {
  const top3 = [...players].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-3">
      {PODIUM_ORDER.map((rank, i) => {
        const player = top3[rank];
        if (!player) return <div key={rank} className="w-24" />;
        return (
          <div key={player.id} className="flex w-24 flex-col items-center gap-2">
            <Trophy
              className={cn(
                "size-6",
                rank === 0 ? "text-chart-1" : rank === 1 ? "text-chart-3" : "text-chart-5",
              )}
            />
            <span className="w-full truncate text-center text-sm font-semibold">{player.nickname}</span>
            <span className="text-xs font-bold text-primary">{player.score}</span>
            <div
              className={cn(
                "flex w-full items-start justify-center rounded-t-lg bg-secondary pt-1 text-lg font-bold text-secondary-foreground",
                HEIGHTS[i],
              )}
            >
              {rank + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
