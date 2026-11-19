/**
 * Small one-shot sounds for the desktop's delights (issue #14): the startup chord, the Trash's crumple and the Beat
 * Calculator's "Hear it". Kept apart from `FocusEngine` so the free-set session never changes. Framework-free (no React).
 * Every sound starts only from a call made in a click, tap or key handler: nothing here plays on its own.
 *
 * The plans (`CHORD`, `crumple`, `toyBeat`) are pure, so the tests check them without a browser; the `play*`
 * functions turn a plan into Web Audio nodes on one shared, lazily created `AudioContext`.
 */

export interface ChordNote {
  /** Hz. */
  readonly freq: number;
  /** Seconds after the chord starts: the notes roll upward like a soft strum. */
  readonly delay: number;
  /** Relative level, 0…1. */
  readonly level: number;
}

/**
 * An original, warm A-flat major 9 voicing (A♭2 E♭3 G3 B♭3 C4), rolled upward over 0.14 s. It is not a C major
 * chord and has no fifth stacked on top, so it does not echo any computer's startup sound.
 */
export const CHORD: readonly ChordNote[] = [
  { freq: 103.83, delay: 0, level: 1 },
  { freq: 155.56, delay: 0.035, level: 0.8 },
  { freq: 196.0, delay: 0.07, level: 0.62 },
  { freq: 233.08, delay: 0.105, level: 0.5 },
  { freq: 261.63, delay: 0.14, level: 0.42 },
];

/** How long the chord rings, in seconds. */
export const CHORD_SECONDS = 2.6;

/** The chord's envelope at `t` seconds after a note starts: a 40 ms rise, then a slow exponential fall to silence. */
export function chordEnvelope(t: number): number {
  if (t <= 0) return 0;
  if (t < 0.04) return t / 0.04;
  return Math.exp(-(t - 0.04) / 0.65);
}

export interface Crackle {
  /** Seconds after the crumple starts. */
  readonly at: number;
  readonly duration: number;
  /** Centre of the band-pass filter, Hz. */
  readonly freq: number;
  readonly level: number;
}

/** Mulberry32: a tiny seeded generator, so a crumple is the same sound every time and testable. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Crumpling paper: short band-passed noise crackles, dense at first and thinning out over `seconds`. */
export function crumple(seed = 14, seconds = 0.7, count = 26): Crackle[] {
  const rnd = random(seed);
  const out: Crackle[] = [];
  for (let i = 0; i < count; i++) {
    const at = seconds * Math.pow(rnd(), 1.6) * 0.92; // skewed early: the crush, then a few settling crinkles
    const fall = 1 - at / seconds;
    out.push({
      at,
      duration: 0.008 + rnd() * 0.035,
      freq: 1200 + rnd() * 4800,
      level: (0.35 + rnd() * 0.65) * (0.4 + 0.6 * fall),
    });
  }
  return out.sort((x, y) => x.at - y.at);
}

/** The range the Beat Calculator plays: each ear at a carrier the app allows, and a beat inside the five bands. */
export const TOY_LIMITS = { minEar: 80, maxEar: 1000, minBeat: 0.5, maxBeat: 45 } as const;

export interface ToyBeat { readonly left: number; readonly right: number; readonly beat: number; readonly playable: boolean }

/** What "Hear it" would play for these two ears; `playable` is false outside `TOY_LIMITS` or for non-numbers. */
export function toyBeat(left: number, right: number): ToyBeat {
  const beat = Math.round(Math.abs(right - left) * 10) / 10;
  const ear = (f: number) => Number.isFinite(f) && f >= TOY_LIMITS.minEar && f <= TOY_LIMITS.maxEar;
  const playable = ear(left) && ear(right) && beat >= TOY_LIMITS.minBeat && beat <= TOY_LIMITS.maxBeat;
  return { left, right, beat: Number.isFinite(beat) ? beat : NaN, playable };
}

/** Output level for a desktop volume (0…1): squared like the engine, under a quiet ceiling so delights never startle. */
export function toyLevel(volume: number, ceiling = 0.25): number {
  const v = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
  return v * v * ceiling;
}

// ---- Web Audio -------------------------------------------------------------------------------------------------

let shared: AudioContext | null = null;

/** The one context for every delight sound, created and resumed inside the caller's gesture. */
function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!shared || shared.state === 'closed') shared = new Ctor();
  if (shared.state === 'suspended') void shared.resume().catch(() => undefined);
  return shared;
}

/** Plays the startup chord at the desktop's volume. Call from a gesture. */
export function playChord(volume: number): void {
  const ctx = context();
  const level = toyLevel(volume, 0.18);
  if (!ctx || level === 0) return;
  const t0 = ctx.currentTime + 0.02;
  const out = ctx.createGain();
  out.gain.value = level;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 1800;
  warm.connect(out).connect(ctx.destination);
  for (const n of CHORD) {
    const start = t0 + n.delay;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(n.level, start + 0.04);
    env.gain.setTargetAtTime(0, start + 0.04, 0.65);
    env.connect(warm);
    // Two slightly detuned voices per note: a soft chorus, the "warm" in warm chord.
    for (const [type, cents] of [['triangle', -4], ['sine', 5]] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = n.freq;
      osc.detune.value = cents;
      osc.connect(env);
      osc.start(start);
      osc.stop(t0 + CHORD_SECONDS);
    }
  }
}

let noise: AudioBuffer | null = null;

/** Plays the Trash's crumple at the desktop's volume. Call from a gesture. */
export function playCrumple(volume: number): void {
  const ctx = context();
  const level = toyLevel(volume, 0.5);
  if (!ctx || level === 0) return;
  if (!noise || noise.sampleRate !== ctx.sampleRate) {
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate);
    const data = noise.getChannelData(0);
    const rnd = random(98);
    for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1;
  }
  const t0 = ctx.currentTime + 0.02;
  const out = ctx.createGain();
  out.gain.value = level;
  out.connect(ctx.destination);
  for (const c of crumple()) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = c.freq;
    band.Q.value = 1.4;
    const env = ctx.createGain();
    const start = t0 + c.at;
    env.gain.setValueAtTime(c.level, start);
    env.gain.exponentialRampToValueAtTime(0.001, start + c.duration);
    src.connect(band).connect(env).connect(out);
    src.start(start, Math.random() * 0.05, c.duration + 0.01);
  }
}

export interface ToyHandle {
  /** Fades out (0.3 s) and stops. Safe to call more than once. */
  stop(): void;
  /** Resolves when the sound has stopped, by `stop()` or at the end. */
  readonly done: Promise<void>;
}

/**
 * Plays `left` Hz in the left ear and `right` Hz in the right for `seconds` (0.5 s fade in, 0.5 s fade out), at the
 * desktop's volume. Returns null when the pair is outside `TOY_LIMITS` or Web Audio is missing. Call from a gesture.
 */
export function playBeat(left: number, right: number, volume: number, seconds = 8): ToyHandle | null {
  if (!toyBeat(left, right).playable) return null;
  const ctx = context();
  if (!ctx) return null;
  const t0 = ctx.currentTime + 0.02;
  const env = ctx.createGain();
  const level = toyLevel(volume, 0.35);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(level, t0 + 0.5);
  env.gain.setValueAtTime(level, t0 + seconds - 0.5);
  env.gain.linearRampToValueAtTime(0, t0 + seconds);
  env.connect(ctx.destination);
  const merger = ctx.createChannelMerger(2);
  merger.connect(env);
  const oscs = [left, right].map((f, ch) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    osc.connect(merger, 0, ch);
    osc.start(t0);
    osc.stop(t0 + seconds);
    return osc;
  });
  let finish!: () => void;
  const done = new Promise<void>((r) => { finish = r; });
  oscs[0].onended = () => finish();
  let stopped = false;
  return {
    done,
    stop() {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      env.gain.cancelScheduledValues(now);
      env.gain.setValueAtTime(env.gain.value, now);
      env.gain.linearRampToValueAtTime(0, now + 0.3);
      for (const o of oscs) { try { o.stop(now + 0.32); } catch { /* already stopped */ } }
    },
  };
}
