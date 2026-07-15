"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Score each player was last *shown* with on a scoreboard screen. Module
// level on purpose: it survives the leaderboard/podium unmounting between
// phases, so the next showing can animate from where the last one left off.
// Keyed by game_players.id (unique per game), so parallel games can't collide.
export const lastShownScores = new Map<string, number>();

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Renders a number that eases (count-up) toward `value` whenever it changes.
// `from` sets where the very first render starts counting from.
export function AnimatedNumber({
  value,
  from,
  duration = 1000,
}: {
  value: number;
  from?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(from ?? value);
  const shownRef = useRef(from ?? value);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    if (prefersReducedMotion()) {
      shownRef.current = value;
      setDisplay(value);
      return;
    }
    let frameId: number;
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(start + (value - start) * eased);
      shownRef.current = current;
      setDisplay(current);
      if (t < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{display}</>;
}

// FLIP: whenever the render order of registered elements changes, each one
// is animated from its previous screen position to its new one, so rank
// swaps glide instead of teleporting. Returns a ref-callback factory —
// attach `register(key)` as the `ref` of every row to track.
export function useFlip() {
  const elementsRef = useRef(new Map<string, HTMLElement>());
  const prevRectsRef = useRef(new Map<string, DOMRect>());

  // Runs after every render: diff current positions against the previous
  // ones and play the inverted transform for anything that moved.
  useLayoutEffect(() => {
    const rects = new Map<string, DOMRect>();
    elementsRef.current.forEach((el, key) => {
      if (el.isConnected) rects.set(key, el.getBoundingClientRect());
    });
    if (!prefersReducedMotion()) {
      rects.forEach((rect, key) => {
        const prev = prevRectsRef.current.get(key);
        if (!prev) return;
        const dy = prev.top - rect.top;
        if (Math.abs(dy) < 2) return;
        elementsRef.current.get(key)?.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
          { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      });
    }
    prevRectsRef.current = rects;
  });

  return (key: string) => (el: HTMLElement | null) => {
    if (el) elementsRef.current.set(key, el);
    else elementsRef.current.delete(key);
  };
}
