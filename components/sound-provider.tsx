"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { playSound, setMasterMuted, setMasterVolume, type SoundName } from "@/lib/sound";

export type SoundVolumes = {
  /** Looping background music (lobby / reveal / leaderboard). */
  music: number;
  /** Per-question countdown track. */
  countdown: number;
  /** Synthesized UI/effect sounds (clicks, correct/wrong, ticks…). */
  effects: number;
};

// music/countdown defaults match the levels the game always used before
// they became configurable.
const DEFAULT_VOLUMES: SoundVolumes = { music: 0.22, countdown: 0.4, effects: 1 };

type SoundContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
  volumes: SoundVolumes;
  setVolume: (kind: keyof SoundVolumes, value: number) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "quiz_sound_muted";
const VOLUMES_STORAGE_KEY = "quiz_sound_volumes";
const INTERACTIVE_SELECTOR = 'button, [role="button"], [role="switch"], [role="radio"], [role="tab"]';

function readStoredVolumes(): SoundVolumes {
  try {
    const raw = localStorage.getItem(VOLUMES_STORAGE_KEY);
    if (!raw) return DEFAULT_VOLUMES;
    const parsed = JSON.parse(raw) as Partial<SoundVolumes>;
    const clamp = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
    return {
      music: clamp(parsed.music, DEFAULT_VOLUMES.music),
      countdown: clamp(parsed.countdown, DEFAULT_VOLUMES.countdown),
      effects: clamp(parsed.effects, DEFAULT_VOLUMES.effects),
    };
  } catch {
    return DEFAULT_VOLUMES;
  }
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [volumes, setVolumes] = useState<SoundVolumes>(DEFAULT_VOLUMES);
  // Mirrors `muted` for the document click listener and `play()` below,
  // neither of which can depend on the `muted` state directly without
  // re-subscribing/re-creating on every toggle.
  const mutedRef = useRef(muted);
  const didInitRef = useRef(false);

  // Reads the persisted preferences on mount, then keeps localStorage, the
  // ref mirror, and the actual audio nodes in sync with `muted` on every
  // change after that.
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      const storedVolumes = readStoredVolumes();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVolumes(storedVolumes);
      setMasterVolume(storedVolumes.effects);
      const stored = localStorage.getItem(STORAGE_KEY) === "1";
      if (stored !== muted) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMuted(stored);
        return; // this effect re-runs once `muted` catches up to `stored`
      }
    }
    mutedRef.current = muted;
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    setMasterMuted(muted);
  }, [muted]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTOR) && !mutedRef.current) {
        playSound("click");
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const toggleMuted = useCallback(() => setMuted((m) => !m), []);

  const play = useCallback((name: SoundName) => {
    if (!mutedRef.current) playSound(name);
  }, []);

  const setVolume = useCallback((kind: keyof SoundVolumes, value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumes((prev) => {
      const next = { ...prev, [kind]: clamped };
      localStorage.setItem(VOLUMES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (kind === "effects") setMasterVolume(clamped);
  }, []);

  return (
    <SoundContext.Provider value={{ muted, toggleMuted, play, volumes, setVolume }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within a SoundProvider");
  return ctx;
}
