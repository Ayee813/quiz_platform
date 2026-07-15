"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSound } from "@/components/sound-provider";

export function Timer({
  startedAt,
  timeLimitSeconds,
  className,
  onExpire,
}: {
  startedAt: string;
  timeLimitSeconds: number;
  className?: string;
  onExpire?: () => void;
}) {
  const { play } = useSound();
  const [remainingMs, setRemainingMs] = useState(() => {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return Math.max(0, timeLimitSeconds * 1000 - elapsed);
  });

  useEffect(() => {
    const totalMs = timeLimitSeconds * 1000;
    const startedMs = new Date(startedAt).getTime();
    let expired = false;
    let lastSecond = Math.ceil(totalMs / 1000);

    const tick = () => {
      const elapsed = Date.now() - startedMs;
      const remaining = Math.max(0, totalMs - elapsed);
      setRemainingMs(remaining);

      const currentSecond = Math.ceil(remaining / 1000);
      if (currentSecond !== lastSecond) {
        lastSecond = currentSecond;
        if (currentSecond > 0 && currentSecond <= 3) play("tick");
      }

      if (remaining === 0 && !expired) {
        expired = true;
        play("timeup");
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, timeLimitSeconds]);

  const percent = (remainingMs / (timeLimitSeconds * 1000)) * 100;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Progress value={percent} className="h-3 flex-1" />
      <span className="w-8 shrink-0 text-right text-lg font-bold tabular-nums text-primary">
        {seconds}
      </span>
    </div>
  );
}
