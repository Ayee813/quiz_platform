"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Music, Settings2, Timer, Volume2, VolumeX, Zap } from "lucide-react";
import { useSound, type SoundVolumes } from "@/components/sound-provider";

const SLIDERS: { kind: keyof SoundVolumes; label: string; icon: React.ReactNode }[] = [
  { kind: "music", label: "ເພງພື້ນຫຼັງ", icon: <Music className="size-4" /> },
  { kind: "countdown", label: "ເພງນັບຖອຍຫຼັງ", icon: <Timer className="size-4" /> },
  { kind: "effects", label: "ສຽງເອັບເຟັກ", icon: <Zap className="size-4" /> },
];

export function SoundToggle() {
  const { muted, toggleMuted, volumes, setVolume, play } = useSound();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Volume mixing is an admin/host concern — players just get mute/unmute.
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  if (!isAdmin) {
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

  return (
    <div ref={panelRef} className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-72 rounded-xl border bg-card p-4 text-card-foreground shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">ຕັ້ງຄ່າສຽງ</span>
            <button
              type="button"
              onClick={toggleMuted}
              aria-pressed={muted}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${
                muted ? "border-destructive/50 text-destructive" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              {muted ? "ປິດສຽງຢູ່" : "ປິດສຽງທັງໝົດ"}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {SLIDERS.map(({ kind, label, icon }) => (
              <label key={kind} className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {icon}
                    {label}
                  </span>
                  <span className="font-mono tabular-nums">{Math.round(volumes[kind] * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volumes[kind] * 100)}
                  onChange={(e) => setVolume(kind, Number(e.target.value) / 100)}
                  // Sample chirp so the admin hears the new effects level
                  // right away (music/countdown levels apply live to any
                  // playing track already).
                  onPointerUp={kind === "effects" ? () => play("join") : undefined}
                  aria-label={label}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="ຕັ້ງຄ່າສຽງ"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full border bg-card text-foreground shadow-md transition hover:bg-muted"
      >
        {muted ? <VolumeX className="size-5" /> : open ? <Settings2 className="size-5" /> : <Volume2 className="size-5" />}
      </button>
    </div>
  );
}
