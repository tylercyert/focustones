/**
 * FocusTones web engine: the pure DSP. A port of the iOS app's `Core/Engine` (Tone, Fade, EngineRenderer, Levels,
 * Limits) and of `Catalog`'s five free presets. No DOM, no React, no Web Audio types: it runs in an AudioWorklet and
 * in Node (the unit tests). `EngineRenderer.render` allocates nothing; see README.md.
 */

export type Mode = "binaural" | "isochronic";

export interface EngineSettings {
  /** Carrier in Hz, 80…1000. */
  carrier: number;
  /** Beat in Hz, 0.5…45. */
  beat: number;
  mode: Mode;
  /** Tone level 0…1; gain follows a square law under the −6 dBFS ceiling. */
  volume: number;
}

export interface Preset {
  id: string;
  name: string;
  band: "delta" | "theta" | "alpha" | "beta" | "gamma";
  carrier: number;
  beat: number;
}

/** The five free band presets, in the app's order (`Catalog.freePresets`). Delta's carrier is 180 Hz, the rest 220. */
export const FREE_PRESETS: readonly Preset[] = [
  { id: "deep-sleep", name: "Deep Sleep", band: "delta", carrier: 180, beat: 2 },
  { id: "daydream", name: "Daydream", band: "theta", carrier: 220, beat: 6 },
  { id: "calm-focus", name: "Calm Focus", band: "alpha", carrier: 220, beat: 10 },
  { id: "deep-work", name: "Deep Work", band: "beta", carrier: 220, beat: 16 },
  { id: "peak", name: "Peak", band: "gamma", carrier: 220, beat: 40 },
];

export const DEFAULT_VOLUME = 0.7;

export const CARRIER_RANGE = [80, 1000] as const;
export const BEAT_RANGE = [0.5, 45] as const;
export const SAMPLE_RATE_RANGE = [8000, 384000] as const;
/** The tone at full level peaks at −6 dBFS per ear. */
export const TONE_CEILING = 0.5;
export const PULSE_DUTY = 0.6;
export const PULSE_RAMP = 0.15;
export const START_FADE_SECONDS = 3;
export const PAUSE_FADE_SECONDS = 1.5;
export const TIMER_FADE_SECONDS = 30;

const clamp = (x: number, lo: number, hi: number, fallback: number) =>
  Number.isFinite(x) ? Math.min(Math.max(x, lo), hi) : fallback;

export const clampCarrier = (hz: number) => clamp(hz, CARRIER_RANGE[0], CARRIER_RANGE[1], 220);
export const clampBeat = (hz: number) => clamp(hz, BEAT_RANGE[0], BEAT_RANGE[1], 10);
export const clampSampleRate = (hz: number) => clamp(hz, SAMPLE_RATE_RANGE[0], SAMPLE_RATE_RANGE[1], 48000);
export const clampUnit = (x: number, fallback: number) => clamp(x, 0, 1, fallback);

/** Level (0…1) to gain: squared, under the ceiling. */
export const toneGain = (volume: number) => {
  const l = clampUnit(volume, 0);
  return TONE_CEILING * l * l;
};

/** A one-pole smoothing coefficient per sample for a time constant of `seconds`. */
const smoothing = (seconds: number, rate: number) => 1 - Math.exp(-1 / (seconds * rate));

/**
 * The isochronic envelope: on for the first 60% of each cycle, off for the rest, raised-cosine edges of 15% of the
 * cycle, so the pulses never click.
 */
export function pulse(phase: number): number {
  if (phase >= PULSE_DUTY) return 0;
  if (phase < PULSE_RAMP) return 0.5 - 0.5 * Math.cos((Math.PI * phase) / PULSE_RAMP);
  const fromEnd = PULSE_DUTY - phase;
  if (fromEnd < PULSE_RAMP) return 0.5 - 0.5 * Math.cos((Math.PI * fromEnd) / PULSE_RAMP);
  return 1;
}

/**
 * A soft limiter: transparent up to 0.8, then a tanh knee toward 0.98 that it never reaches. Its slope is 1 at the
 * knee, so the bend adds no corner.
 */
export function limit(x: number): number {
  const threshold = 0.8;
  const headroom = 0.18;
  const m = Math.abs(x);
  if (m <= threshold) return x;
  const shaped = threshold + headroom * Math.tanh((m - threshold) / headroom);
  return x < 0 ? -shaped : shaped;
}

/** The whole mix's fade: a linear position heard through a raised cosine, so it starts and lands with no corner. */
export class Fade {
  position = 0;
  private goal = 0;
  private from = 0;
  private frames = 0;
  private remaining = 0;

  /** Fades to `target` (0 silent, 1 full) over `seconds` from wherever it is now. */
  start(target: number, seconds: number, rate: number): void {
    this.goal = clampUnit(target, 0);
    this.from = this.position;
    const s = Number.isNaN(seconds) ? 0.005 : Math.min(Math.max(seconds, 0.005), 3600);
    this.frames = Math.max(2, Math.ceil(s * rate));
    this.remaining = this.frames;
  }

  /** The next sample's gain, 0…1. */
  next(): number {
    if (this.remaining > 0) {
      const progress = (this.frames - this.remaining) / (this.frames - 1);
      this.position = this.remaining === 1 ? this.goal : this.from + (this.goal - this.from) * progress;
      this.remaining--;
    }
    if (this.position >= 1) return 1;
    if (this.position <= 0) return 0;
    return 0.5 - 0.5 * Math.cos(Math.PI * this.position);
  }

  get isSilent(): boolean {
    return this.position <= 0 && this.goal <= 0;
  }
}

/**
 * Renders the tone into stereo float samples. Everything it owns is a number or a reused typed value: the sample loop
 * allocates nothing. Setters are called between `render` calls on the same thread, so no locking is needed; every
 * target is glided to sample by sample, so no change clicks. One renderer per audio graph.
 */
export class EngineRenderer {
  readonly sampleRate: number;

  private carrier: number;
  private beat: number;
  private gain: number;
  private isochronicMix: number;
  private carrierGoal: number;
  private beatGoal: number;
  private gainGoal: number;
  private isochronicGoal: boolean;

  // Phases in cycles (0..<1), in double so hours of play never drift.
  private leftPhase = 0;
  private rightPhase = 0;
  private centerPhase = 0;
  private pulsePhase = 0;

  private readonly inverseRate: number;
  private readonly pitchSmoothing: number;
  private readonly levelSmoothing: number;
  private readonly modeStep: number;

  private readonly fade = new Fade();

  // The timer counts frames down while running.
  private timerOn = false;
  private timerFading = false;
  private timerFrames = 0;
  private timerFadeAt = 0;
  private running = true;
  private done = false;

  constructor(sampleRate: number, settings: EngineSettings) {
    this.sampleRate = clampSampleRate(sampleRate);
    this.inverseRate = 1 / this.sampleRate;
    this.pitchSmoothing = smoothing(0.05, this.sampleRate);
    this.levelSmoothing = smoothing(0.03, this.sampleRate);
    this.modeStep = 1 / (0.08 * this.sampleRate);
    // Everything starts at its target: the session's fade covers the start.
    this.carrierGoal = this.carrier = clampCarrier(settings.carrier);
    this.beatGoal = this.beat = clampBeat(settings.beat);
    this.gainGoal = this.gain = toneGain(settings.volume);
    this.isochronicGoal = settings.mode === "isochronic";
    this.isochronicMix = this.isochronicGoal ? 1 : 0;
  }

  /** New targets; the tone glides to them. Out-of-range numbers are clamped. */
  setSettings(s: EngineSettings): void {
    this.carrierGoal = clampCarrier(s.carrier);
    this.beatGoal = clampBeat(s.beat);
    this.gainGoal = toneGain(s.volume);
    this.isochronicGoal = s.mode === "isochronic";
  }

  /** Fades the whole mix to `target` (0 silent, 1 full) over `seconds`, from wherever it is now. */
  fadeTo(target: number, seconds: number): void {
    this.fade.start(target, seconds, this.sampleRate);
  }

  /** `seconds` of listening left, or null for none. Counts down only while running. */
  setTimer(seconds: number | null): void {
    this.done = false;
    this.timerFading = false;
    if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) {
      this.timerOn = false;
      return;
    }
    this.timerOn = true;
    this.timerFrames = Math.round(seconds * this.sampleRate);
    this.armTimerFade();
  }

  /** While not running the timer holds. Resuming re-arms the timer's fade-out from the time left. */
  setRunning(running: boolean): void {
    if (running === this.running) return;
    this.running = running;
    if (running && this.timerOn) {
      this.timerFading = false;
      this.armTimerFade();
    }
  }

  /** The fade-out starts when this much is left: the last 30 s, or after a short rise for a timer under 30 s. */
  private armTimerFade(): void {
    const left = this.timerFrames / this.sampleRate;
    const at = left > TIMER_FADE_SECONDS ? TIMER_FADE_SECONDS : left - Math.min(3, left / 2);
    this.timerFadeAt = Math.round(at * this.sampleRate);
  }

  get timerRemaining(): number | null {
    return this.timerOn || this.done ? this.timerFrames / this.sampleRate : null;
  }

  /** True once a timer has run out (and its fade-out has landed at silence). */
  get timerDone(): boolean {
    return this.done;
  }

  /** At silence and staying there. */
  get isSilent(): boolean {
    return this.fade.isSilent;
  }

  /** Fills `frameCount` samples of each channel. */
  render(frameCount: number, left: Float32Array, right: Float32Array): void {
    const inv = this.inverseRate;
    for (let i = 0; i < frameCount; i++) {
      this.carrier += (this.carrierGoal - this.carrier) * this.pitchSmoothing;
      this.beat += (this.beatGoal - this.beat) * this.pitchSmoothing;
      this.gain += (this.gainGoal - this.gain) * this.levelSmoothing;
      if (this.isochronicGoal) this.isochronicMix = Math.min(this.isochronicMix + this.modeStep, 1);
      else this.isochronicMix = Math.max(this.isochronicMix - this.modeStep, 0);

      // Binaural: the ears sit half a beat either side of the carrier, so the pitch heard stays at the carrier.
      const half = this.beat * 0.5;
      this.leftPhase = wrap(this.leftPhase + (this.carrier - half) * inv);
      this.rightPhase = wrap(this.rightPhase + (this.carrier + half) * inv);
      this.centerPhase = wrap(this.centerPhase + this.carrier * inv);
      this.pulsePhase = wrap(this.pulsePhase + this.beat * inv);

      // Only the mode that sounds is computed; both while one crossfades into the other.
      let bw = 1;
      let iw = 0;
      if (this.isochronicMix >= 1) {
        bw = 0;
        iw = 1;
      } else if (this.isochronicMix > 0) {
        bw = Math.cos((this.isochronicMix * Math.PI) / 2);
        iw = Math.sin((this.isochronicMix * Math.PI) / 2);
        const total = bw + iw;
        bw /= total;
        iw /= total;
      }
      let l = 0;
      let r = 0;
      if (bw > 0) {
        l = Math.sin(2 * Math.PI * this.leftPhase) * bw;
        r = Math.sin(2 * Math.PI * this.rightPhase) * bw;
      }
      if (iw > 0) {
        const p = Math.sin(2 * Math.PI * this.centerPhase) * pulse(this.pulsePhase) * iw;
        l += p;
        r += p;
      }

      if (this.timerOn && this.running) {
        this.timerFrames--;
        if (!this.timerFading && this.timerFrames <= this.timerFadeAt) {
          this.timerFading = true;
          this.fade.start(0, this.timerFrames / this.sampleRate, this.sampleRate);
        }
        if (this.timerFrames <= 0) {
          this.timerFrames = 0;
          this.timerOn = false;
          this.done = true;
        }
      }

      const g = this.fade.next() * this.gain;
      left[i] = limit(l * g);
      right[i] = limit(r * g);
    }
  }
}

function wrap(phase: number): number {
  return phase >= 1 ? phase - 1 : phase;
}
