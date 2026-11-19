/**
 * Small one-shot sounds for the desktop's delights (issue #14): the startup chord, the Trash's crumple and the Beat
 * Calculator's "Hear it". Kept apart from `FocusEngine` so the free-set session never changes. Framework-free (no React).
 * Every sound starts only from a call made in a click, tap or key handler: nothing here plays on its own.
 *
 * The plans (`CHORD`, `crumple`, `toyBeat`) are pure, so the tests check them without a browser. `ToyBus` turns a plan
 * into Web Audio nodes: every sound feeds one bus (a gain that follows the desktop's volume live, then a limiter), a new
 * chord replaces one still ringing, and each sound disconnects all of its nodes when it ends. The `play*` functions use
 * one shared bus on a lazily created `AudioContext` that suspends itself when nothing has played for a moment.
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

/** Output level for a desktop volume (0…1): squared like the engine, under a ceiling (the bus's gain uses 1). */
export function toyLevel(volume: number, ceiling = 1): number {
  const v = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
  return v * v * ceiling;
}

// ---- Web Audio -------------------------------------------------------------------------------------------------

/** Each sound's own ceiling under the bus; the bus's limiter catches whatever overlaps. */
export const SOUND_LEVEL = { chord: 0.09, crumple: 0.3, beat: 0.35 } as const;
/** Seconds without any sound before the shared context suspends. */
export const IDLE_SECONDS = 1.5;

export interface ToyHandle {
  /** Fades out (0.3 s) and stops. Safe to call more than once. */
  stop(): void;
  /** Resolves when the sound has ended and all of its nodes are disconnected. */
  readonly done: Promise<void>;
}

interface Sound extends ToyHandle { readonly kind: 'chord' | 'crumple' | 'beat' }

let noise: AudioBuffer | null = null;
function noiseFor(ctx: BaseAudioContext): AudioBuffer {
  if (!noise || noise.sampleRate !== ctx.sampleRate) {
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate);
    const data = noise.getChannelData(0);
    const rnd = random(98);
    for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1;
  }
  return noise;
}

/** One output path for every delight sound on a context: volume gain → limiter → speakers. */
export class ToyBus {
  private readonly gain: GainNode;
  private readonly active = new Set<Sound>();
  private idle: ReturnType<typeof setTimeout> | null = null;
  readonly ctx: BaseAudioContext;
  private readonly onIdle?: () => void;

  constructor(ctx: BaseAudioContext, volume: number, onIdle?: () => void) {
    this.ctx = ctx;
    this.onIdle = onIdle;
    this.gain = ctx.createGain();
    this.gain.gain.value = toyLevel(volume);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    // Browsers add a fixed makeup gain to a compressor (about ×1.48 for these settings); this trims it back so the limiter
    // only catches overlaps and does not make every sound louder.
    const trim = ctx.createGain();
    trim.gain.value = 0.675;
    this.gain.connect(limiter).connect(trim).connect(ctx.destination);
  }

  /** Sounds still playing (they leave this count once their nodes are disconnected). */
  get playing(): number { return this.active.size; }

  /** Follows the desktop's volume while sounds play: 0 mutes them within a few milliseconds. */
  setVolume(volume: number): void {
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setTargetAtTime(toyLevel(volume), now, 0.01);
  }

  /** Fades every sound out quickly (an unmounting desktop, a closing window). */
  stopAll(): void { for (const s of [...this.active]) s.stop(); }

  /**
   * Wraps a sound's nodes: it ends when all its sources have ended, then disconnects every node it made. `out` is the
   * sound's own gain, used to fade it out on `stop()`.
   */
  private track(kind: Sound['kind'], nodes: AudioNode[], sources: AudioScheduledSourceNode[], out: GainNode): Sound {
    if (this.idle) { clearTimeout(this.idle); this.idle = null; }
    let left = sources.length;
    let finish!: () => void;
    const done = new Promise<void>((r) => { finish = r; });
    let stopped = false;
    const sound: Sound = {
      kind, done,
      stop: () => {
        if (stopped) return;
        stopped = true;
        const now = this.ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + 0.3);
        for (const src of sources) { try { src.stop(now + 0.31); } catch { /* not started or already stopped */ } }
      },
    };
    const ended = () => {
      if (--left > 0) return;
      for (const n of nodes) n.disconnect();
      this.active.delete(sound);
      finish();
      if (!this.active.size && this.onIdle) this.idle = setTimeout(() => { this.idle = null; if (!this.active.size) this.onIdle?.(); }, IDLE_SECONDS * 1000);
    };
    for (const src of sources) src.addEventListener('ended', ended, { once: true });
    this.active.add(sound);
    return sound;
  }

  /** The startup chord. A chord still ringing fades out first, so quick repeats never pile up. */
  chord(): ToyHandle {
    for (const s of this.active) if (s.kind === 'chord') s.stop();
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.value = SOUND_LEVEL.chord;
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 1800;
    warm.connect(out).connect(this.gain);
    const nodes: AudioNode[] = [out, warm];
    const sources: OscillatorNode[] = [];
    for (const n of CHORD) {
      const start = t0 + n.delay;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(n.level, start + 0.04);
      env.gain.setTargetAtTime(0, start + 0.04, 0.65);
      env.connect(warm);
      nodes.push(env);
      // Two slightly detuned voices per note: a soft chorus, the "warm" in warm chord.
      for (const [type, cents] of [['triangle', -4], ['sine', 5]] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = n.freq;
        osc.detune.value = cents;
        osc.connect(env);
        osc.start(start);
        osc.stop(t0 + CHORD_SECONDS);
        nodes.push(osc);
        sources.push(osc);
      }
    }
    return this.track('chord', nodes, sources, out);
  }

  /** The Trash's crumple. */
  crumple(): ToyHandle {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.value = SOUND_LEVEL.crumple;
    out.connect(this.gain);
    const nodes: AudioNode[] = [out];
    const sources: AudioBufferSourceNode[] = [];
    const buffer = noiseFor(ctx);
    crumple().forEach((c, i) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = c.freq;
      band.Q.value = 1.4;
      const env = ctx.createGain();
      const start = t0 + c.at;
      env.gain.setValueAtTime(c.level, start);
      env.gain.exponentialRampToValueAtTime(0.001, start + c.duration);
      src.connect(band).connect(env).connect(out);
      src.start(start, (i * 0.0037) % 0.05, c.duration + 0.01);
      nodes.push(src, band, env);
      sources.push(src);
    });
    return this.track('crumple', nodes, sources, out);
  }

  /** `left` Hz in the left ear and `right` Hz in the right for `seconds` (0.5 s fades). Null outside `TOY_LIMITS`. */
  beat(left: number, right: number, seconds = 8): ToyHandle | null {
    if (!toyBeat(left, right).playable) return null;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(SOUND_LEVEL.beat, t0 + 0.5);
    out.gain.setValueAtTime(SOUND_LEVEL.beat, t0 + seconds - 0.5);
    out.gain.linearRampToValueAtTime(0, t0 + seconds);
    out.connect(this.gain);
    const merger = ctx.createChannelMerger(2);
    merger.connect(out);
    const sources = [left, right].map((f, ch) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      osc.connect(merger, 0, ch);
      osc.start(t0);
      osc.stop(t0 + seconds);
      return osc;
    });
    return this.track('beat', [out, merger, ...sources], sources, out);
  }
}

// ---- The page's shared bus ---------------------------------------------------------------------------------------

let volume = 0.7;
let shared: ToyBus | null = null;

/** The shared bus, created and resumed inside the caller's gesture; null without Web Audio. */
function bus(): ToyBus | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!shared || (shared.ctx as AudioContext).state === 'closed') {
    const ctx = new Ctor();
    shared = new ToyBus(ctx, volume, () => { void ctx.suspend().catch(() => undefined); });
  }
  const ctx = shared.ctx as AudioContext;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return shared;
}

/** The desktop's volume (0…1), applied live to every delight sound, including ones already playing. */
export function setToyVolume(v: number): void {
  volume = v;
  shared?.setVolume(v);
}

/** Stops every delight sound (with a short fade). */
export const stopToys = (): void => shared?.stopAll();

/** Plays the startup chord. Call from a gesture. */
export const playChord = (): ToyHandle | null => bus()?.chord() ?? null;
/** Plays the Trash's crumple. Call from a gesture. */
export const playCrumple = (): ToyHandle | null => bus()?.crumple() ?? null;
/** Plays a pair of tones for the Beat Calculator. Call from a gesture. */
export const playBeat = (left: number, right: number, seconds = 8): ToyHandle | null => (toyBeat(left, right).playable ? bus()?.beat(left, right, seconds) ?? null : null);
