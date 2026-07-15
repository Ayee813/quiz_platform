"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/components/sound-provider";

export function SoundToggle() {
  const { muted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "ເປີດສຽງ" : "ປິດສຽງ"}
      aria-pressed={!muted}
      className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full border bg-card text-foreground shadow-md transition hover:bg-muted"
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  );
}
