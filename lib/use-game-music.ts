"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/components/sound-provider";
import type { Game, QuestionPayloadLive } from "@/lib/types";

// Fade timings for the countdown track. Fade-in is quick (song is just
// starting); fade-out is longer and deliberately gentle — that's the "slow
// low the song down" ease-out effect at the end of a question.
const FADE_IN_MS = 700;
const FADE_OUT_MS = 5000;
// Fired from Timer.onExpire as a safety net if our own scheduled fade-out
// (below) hasn't finished yet — a quick fade rather than an abrupt cut.
const HARD_STOP_FADE_MS = 350;

// Smoothly ramps `audio.volume` from its current value to `to` over
// `durationMs`, via rAF (HTMLMediaElement has no native linear ramp like a
// WebAudio GainNode). Returns a canceler; starting a new fade on the same
// audio element should always cancel the previous one first, or the two
// rAF loops fight over `.volume`.
function fadeVolume(audio: HTMLAudioElement, to: number, durationMs: number, onDone?: () => void): () => void {
  const from = audio.volume;
  let cancelled = false;
  if (durationMs <= 0) {
    audio.volume = to;
    onDone?.();
    return () => {};
  }
  const startedAt = performance.now();
  const step = (now: number) => {
    if (cancelled) return;
    // Clamp both ends: rAF's first callback timestamp can land slightly
    // *before* `startedAt` (it reflects frame-start time, not call time),
    // which would otherwise drive `t` negative and push volume out of the
    // [0, 1] range the setter requires — it throws rather than clamps.
    const t = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * t));
    if (t < 1) {
      frameId = requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  };
  let frameId = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frameId);
  };
}

// Plays the quiz's background track (looping, outside the question/finished
// phases) and, during 'question', a fresh countdown track per question. The
// countdown track always plays at normal speed — never sped up or slowed
// down — but its *start* is scheduled against the question's own timer
// (current_question_started_at) so a track shorter than the time limit
// begins partway through the countdown and still finishes exactly as time
// runs out. A track longer than the time limit just starts immediately and
// gets faded out early. Used by both the host panel and the player screen —
// each device runs its own copy and schedules independently off the same
// server timestamp. Pass `enabled: false` to skip all music playback (e.g.
// the player screen, which keeps only SFX).
export function useGameMusic(game: Game | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { muted, volumes } = useSound();
  // Ref mirror so the playback effects (which must only re-run on track/phase
  // changes, not on every slider drag) can read the latest levels.
  const volumesRef = useRef(volumes);
  volumesRef.current = volumes;
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const countdownRef = useRef<HTMLAudioElement | null>(null);
  // Tracks whichever fade (in or out) is currently animating the countdown
  // track's volume, so a new fade — or a hard stop — can cancel it cleanly.
  const countdownFadeCancelRef = useRef<(() => void) | null>(null);
  // True once the scheduled fade-out (below) has actually started. Timer's
  // onExpire fires independently of that schedule — without this flag it
  // would cancel a fade that's already most of the way through 5s and
  // replace it with a much shorter one, cutting the long fade-out short
  // right at the very end.
  const fadeOutStartedRef = useRef(false);

  useEffect(() => {
    const url = enabled ? (game?.background_music_url ?? null) : null;
    if (!url) {
      bgRef.current?.pause();
      bgRef.current = null;
      return;
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volumesRef.current.music;
    audio.muted = muted;
    bgRef.current = audio;
    return () => {
      audio.pause();
      if (bgRef.current === audio) bgRef.current = null;
    };
    // Recreated only when the track itself changes — phase/mute are handled
    // by the effects below without tearing this element down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.background_music_url]);

  useEffect(() => {
    const audio = bgRef.current;
    if (!audio) return;
    if (game?.phase === "question" || game?.phase === "finished") {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [game?.phase, game?.background_music_url]);

  useEffect(() => {
    countdownFadeCancelRef.current?.();
    countdownFadeCancelRef.current = null;
    fadeOutStartedRef.current = false;
    countdownRef.current?.pause();
    countdownRef.current = null;

    if (
      !enabled ||
      game?.phase !== "question" ||
      !game.current_question_payload ||
      !game.current_question_started_at
    ) {
      return;
    }
    const payload = game.current_question_payload as QuestionPayloadLive;
    if (!payload.countdownMusicUrl) return;

    const audio = new Audio(payload.countdownMusicUrl);
    audio.volume = 0;
    audio.muted = muted;
    countdownRef.current = audio;

    const questionStartMs = new Date(game.current_question_started_at).getTime();
    const timeLimitMs = payload.timeLimitSeconds * 1000;

    let startTimer: ReturnType<typeof setTimeout> | null = null;
    let fadeOutTimer: ReturnType<typeof setTimeout> | null = null;

    const playFrom = (seekSeconds: number, trackDurationMs: number) => {
      try {
        audio.currentTime = seekSeconds;
      } catch {
        // Some browsers can throw if metadata isn't fully settled yet —
        // starting from 0 instead is a harmless fallback.
      }
      audio.play().catch(() => {});
      countdownFadeCancelRef.current = fadeVolume(audio, volumesRef.current.countdown, FADE_IN_MS);

      // The fade-out must land on whichever ends first: the track running
      // out naturally, or the question timer expiring. A track longer than
      // the remaining question time never reaches its own end on screen —
      // anchoring only to track length would schedule the fade *after*
      // expiry, so it would never audibly run and the timer's short
      // hard-stop would cut the music instead.
      const remainingTrackMs = Math.max(0, trackDurationMs - seekSeconds * 1000);
      const remainingQuestionMs = Math.max(0, timeLimitMs - (Date.now() - questionStartMs));
      const remainingMs = Math.min(remainingTrackMs, remainingQuestionMs);
      const fadeOutDelay = Math.max(0, remainingMs - FADE_OUT_MS);
      fadeOutTimer = setTimeout(() => {
        // If the fade-in is somehow still running (track shorter than the
        // fade windows combined), cancel it — two loops fighting over
        // .volume makes the fade stutter.
        countdownFadeCancelRef.current?.();
        fadeOutStartedRef.current = true;
        countdownFadeCancelRef.current = fadeVolume(audio, 0, FADE_OUT_MS, () => audio.pause());
      }, fadeOutDelay);
    };

    // Schedules (or immediately starts, seeking in if we're already late)
    // playback so the track's natural end lines up with the question's
    // time limit, once we know how long the track actually is.
    const schedule = (trackDurationMs: number) => {
      if (!Number.isFinite(trackDurationMs) || trackDurationMs <= 0) return;

      const desiredStartOffsetMs = Math.max(0, timeLimitMs - trackDurationMs);
      const elapsedMs = Date.now() - questionStartMs;
      const delayMs = desiredStartOffsetMs - elapsedMs;

      if (delayMs > 50) {
        startTimer = setTimeout(() => playFrom(0, trackDurationMs), delayMs);
      } else {
        const seekSeconds = Math.min(trackDurationMs / 1000, Math.max(0, -delayMs) / 1000);
        playFrom(seekSeconds, trackDurationMs);
      }
    };

    if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
      schedule(audio.duration * 1000);
    } else {
      audio.addEventListener("loadedmetadata", () => schedule(audio.duration * 1000), { once: true });
    }

    return () => {
      if (startTimer) clearTimeout(startTimer);
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      audio.pause();
    };
    // A new question (or leaving 'question') is what should swap the track —
    // muted is synced separately below without restarting playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.phase, game?.current_question_id]);

  useEffect(() => {
    if (bgRef.current) bgRef.current.muted = muted;
    if (countdownRef.current) countdownRef.current.muted = muted;
  }, [muted]);

  // Applies slider changes to tracks that are already playing. The countdown
  // track is left alone while it's idle (pre-scheduled start — its fade-in
  // must still begin from silence) or already fading out to silence.
  useEffect(() => {
    if (bgRef.current) bgRef.current.volume = volumes.music;
    const countdown = countdownRef.current;
    if (countdown && !countdown.paused && !fadeOutStartedRef.current) {
      countdown.volume = volumes.countdown;
    }
  }, [volumes]);

  useEffect(
    () => () => {
      countdownFadeCancelRef.current?.();
      bgRef.current?.pause();
      countdownRef.current?.pause();
    },
    [],
  );

  // Exposed so the timer's onExpire can wind the countdown track down the
  // instant time runs out, in case it's still audible — normally our own
  // scheduled fade-out has already finished by then, so this is a safety net
  // rather than the primary stop.
  const stopCountdown = () => {
    const audio = countdownRef.current;
    if (!audio || audio.paused) return;
    // Our own scheduled fade-out is timed to finish right around expiry —
    // if it's already running, let it finish instead of cutting it off
    // with a shorter fade. Only fall back to a hard stop if that schedule
    // somehow never fired (e.g. a track much longer than expected).
    if (fadeOutStartedRef.current) return;
    countdownFadeCancelRef.current?.();
    countdownFadeCancelRef.current = fadeVolume(audio, 0, HARD_STOP_FADE_MS, () => audio.pause());
  };

  return { stopCountdown };
}
