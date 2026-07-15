"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { playSound, setMasterMuted, type SoundName } from "@/lib/sound";

type SoundContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "quiz_sound_muted";
const INTERACTIVE_SELECTOR = 'button, [role="button"], [role="switch"], [role="radio"], [role="tab"]';

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false);
  // Mirrors `muted` for the document click listener and `play()` below,
  // neither of which can depend on the `muted` state directly without
  // re-subscribing/re-creating on every toggle.
  const mutedRef = useRef(muted);
  const didInitRef = useRef(false);

  // Reads the persisted preference on mount, then keeps localStorage, the
  // ref mirror, and the actual audio nodes in sync with `muted` on every
  // change after that.
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
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

  return <SoundContext.Provider value={{ muted, toggleMuted, play }}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within a SoundProvider");
  return ctx;
}
