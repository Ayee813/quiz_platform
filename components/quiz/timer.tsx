"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
  const [remainingMs, setRemainingMs] = useState(() => {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return Math.max(0, timeLimitSeconds * 1000 - elapsed);
  });

  useEffect(() => {
    const totalMs = timeLimitSeconds * 1000;
    const startedMs = new Date(startedAt).getTime();
    let expired = false;

    const tick = () => {
      const elapsed = Date.now() - startedMs;
      const remaining = Math.max(0, totalMs - elapsed);
      setRemainingMs(remaining);
      if (remaining === 0 && !expired) {
        expired = true;
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
