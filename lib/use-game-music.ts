"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/components/sound-provider";
import type { Game, QuestionPayloadLive } from "@/lib/types";

const BG_VOLUME = 0.22;
const COUNTDOWN_VOLUME = 0.4;

// Plays the quiz's background track (looping, outside the question/finished
// phases) and, during 'question', a fresh countdown track per question at
// the playback rate advance-game already computed so it lines up with that
// question's own time limit. Used by both the host panel and the player
// screen — each device runs its own copy.
export function useGameMusic(game: Game | null) {
  const { muted } = useSound();
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const countdownRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = game?.background_music_url ?? null;
    if (!url) {
      bgRef.current?.pause();
      bgRef.current = null;
      return;
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = BG_VOLUME;
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
    countdownRef.current?.pause();
    countdownRef.current = null;

    if (game?.phase !== "question" || !game.current_question_payload) return;
    const payload = game.current_question_payload as QuestionPayloadLive;
    if (!payload.countdownMusicUrl) return;

    const audio = new Audio(payload.countdownMusicUrl);
    audio.playbackRate = payload.countdownPlaybackRate ?? 1;
    audio.volume = COUNTDOWN_VOLUME;
    audio.muted = muted;
    audio.play().catch(() => {});
    countdownRef.current = audio;

    return () => {
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

  useEffect(
    () => () => {
      bgRef.current?.pause();
      countdownRef.current?.pause();
    },
    [],
  );

  // Exposed so the timer's onExpire can hard-stop the countdown track the
  // instant time runs out, even if its playback rate had to be clamped and
  // it would otherwise still be playing.
  const stopCountdown = () => {
    countdownRef.current?.pause();
  };

  return { stopCountdown };
}
