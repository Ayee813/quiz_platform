// Fully synthesized UI sound engine — every effect here is generated at
// runtime with the Web Audio API, not loaded from a file. That means no
// external assets to source/license, and it works the instant the app
// loads. See SoundProvider for the click-delegation + mute/persistence layer
// that sits on top of this.

export type SoundName =
  | "click"
  | "correct"
  | "wrong"
  | "tick"
  | "timeup"
  | "join"
  | "start"
  | "reveal"
  | "podium";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
// Kept as module state (not just on the gain node) so values set before the
// AudioContext lazily exists still apply once it's created.
let masterMuted = false;
let masterVolume = 1;

function applyMasterGain() {
  if (!ctx || !masterGain) return;
  masterGain.gain.setTargetAtTime(masterMuted ? 0 : masterVolume, ctx.currentTime, 0.05);
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = masterMuted ? 0 : masterVolume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  dest: AudioNode,
  opts: {
    freq: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    peak?: number;
    attack?: number;
    glideTo?: number;
  },
) {
  const audio = ctx!;
  const { freq, start, duration, type = "sine", peak = 0.18, attack = 0.008, glideTo } = opts;

  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

const EFFECTS: Record<SoundName, (audio: AudioContext, dest: AudioNode) => void> = {
  click: (audio, dest) => {
    tone(dest, { freq: 1100, start: audio.currentTime, duration: 0.05, type: "sine", peak: 0.09 });
  },
  join: (audio, dest) => {
    const t = audio.currentTime;
    tone(dest, { freq: 660, start: t, duration: 0.09, type: "triangle", peak: 0.12 });
    tone(dest, { freq: 990, start: t + 0.07, duration: 0.12, type: "triangle", peak: 0.12 });
  },
  tick: (audio, dest) => {
    tone(dest, { freq: 1500, start: audio.currentTime, duration: 0.045, type: "square", peak: 0.06 });
  },
  timeup: (audio, dest) => {
    const t = audio.currentTime;
    tone(dest, { freq: 420, start: t, duration: 0.16, type: "sawtooth", peak: 0.14, glideTo: 300 });
    tone(dest, { freq: 420, start: t + 0.2, duration: 0.16, type: "sawtooth", peak: 0.14, glideTo: 300 });
  },
  correct: (audio, dest) => {
    const t = audio.currentTime;
    tone(dest, { freq: 523.25, start: t, duration: 0.12, type: "triangle", peak: 0.16 }); // C5
    tone(dest, { freq: 783.99, start: t + 0.1, duration: 0.22, type: "triangle", peak: 0.18 }); // G5
  },
  wrong: (audio, dest) => {
    const t = audio.currentTime;
    tone(dest, { freq: 300, start: t, duration: 0.22, type: "sawtooth", peak: 0.14, glideTo: 140 });
  },
  reveal: (audio, dest) => {
    tone(dest, { freq: 500, start: audio.currentTime, duration: 0.15, type: "sine", peak: 0.12 });
  },
  start: (audio, dest) => {
    const t = audio.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) =>
      tone(dest, { freq, start: t + i * 0.09, duration: 0.18, type: "triangle", peak: 0.16 }),
    );
  },
  podium: (audio, dest) => {
    const t = audio.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone(dest, { freq, start: t + i * 0.1, duration: 0.3, type: "triangle", peak: 0.17 }),
    );
  },
};

export function playSound(name: SoundName) {
  const audio = getContext();
  if (!audio || !masterGain) return;
  EFFECTS[name](audio, masterGain);
}

export function setMasterMuted(muted: boolean) {
  masterMuted = muted;
  applyMasterGain();
}

// Volume for the synthesized UI/effect sounds (0–1), set from the admin's
// sound settings panel.
export function setMasterVolume(volume: number) {
  masterVolume = Math.min(1, Math.max(0, volume));
  applyMasterGain();
}
