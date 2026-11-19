/**
 * The Listen window's only door to the sound. It codes against the API of the web engine (issue #4, `src/engine/`:
 * `FocusEngine` with start/pause/setPreset/setMode/setTimer, `state`/`time`/`preset` events, `FREE_PRESETS`).
 *
 * TEMPORARY: until #4 is on `revamp`, `createListenEngine()` returns a thin Web Audio stand-in with the same shape and
 * the same fades (3 s in, 1.5 s out, a 30 s timer fade). When #4 merges, replace its body with
 *   `new FocusEngine()` wrapped to this interface (`modeForOutput` maps Headphones/Speaker), delete `StandInEngine`,
 * and import `FREE_PRESETS` from `../../engine`. Nothing else in src/windows/ changes.
 */
import type { Band } from './orbMotion.ts';

export type EngineState = 'idle' | 'starting' | 'playing' | 'paused' | 'ended' | 'error';
export type Output = 'headphones' | 'speaker';

export interface Preset { readonly id: string; readonly name: string; readonly band: Band; readonly carrier: number; readonly beat: number }

/** The five free presets in the app's order (what `FREE_PRESETS` in #4's engine holds). */
export const PRESETS: readonly Preset[] = [
  { id: 'deep-sleep', name: 'Deep Sleep', band: 'delta', carrier: 180, beat: 2 },
  { id: 'daydream', name: 'Daydream', band: 'theta', carrier: 220, beat: 6 },
  { id: 'calm-focus', name: 'Calm Focus', band: 'alpha', carrier: 220, beat: 10 },
  { id: 'deep-work', name: 'Deep Work', band: 'beta', carrier: 220, beat: 16 },
  { id: 'peak', name: 'Peak', band: 'gamma', carrier: 220, beat: 40 },
];
export const DEFAULT_PRESET = PRESETS[3];

export interface EngineEvents { state: EngineState; time: number | null; preset: Preset }

export interface ListenEngine {
  readonly state: EngineState;
  readonly preset: Preset;
  /** Call from a click or tap handler: iOS only unlocks audio inside one. */
  start(preset?: string): Promise<void>;
  pause(): void;
  setPreset(id: string): void;
  setOutput(output: Output): void;
  /** Seconds until the session fades out and ends; null clears it. */
  setTimer(seconds: number | null): void;
  on<K extends keyof EngineEvents>(event: K, fn: (value: EngineEvents[K]) => void): () => void;
  dispose(): void;
}

const START_FADE = 3, PAUSE_FADE = 1.5, TIMER_FADE = 30, CEILING = 0.5, VOLUME = 0.7;

interface Voice { readonly out: GainNode; stop(): void; retune(preset: Preset): void }

function makeVoice(ctx: AudioContext, preset: Preset, output: Output, dest: AudioNode): Voice {
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(dest);
  const oscs: OscillatorNode[] = [];
  const retunes: ((p: Preset) => void)[] = [];
  const osc = (freq: number) => { const o = ctx.createOscillator(); o.frequency.value = freq; oscs.push(o); return o; };
  if (output === 'headphones') {
    const merger = ctx.createChannelMerger(2);
    const l = osc(preset.carrier), r = osc(preset.carrier + preset.beat);
    l.connect(merger, 0, 0); r.connect(merger, 0, 1); merger.connect(out);
    retunes.push((p) => { l.frequency.setTargetAtTime(p.carrier, ctx.currentTime, 0.15); r.frequency.setTargetAtTime(p.carrier + p.beat, ctx.currentTime, 0.15); });
  } else {
    const tone = osc(preset.carrier), lfo = osc(preset.beat);
    const pulse = ctx.createGain(); pulse.gain.value = 0.5;
    const depth = ctx.createGain(); depth.gain.value = 0.5;
    tone.connect(pulse); lfo.connect(depth); depth.connect(pulse.gain); pulse.connect(out);
    retunes.push((p) => { tone.frequency.setTargetAtTime(p.carrier, ctx.currentTime, 0.15); lfo.frequency.setTargetAtTime(p.beat, ctx.currentTime, 0.15); });
  }
  oscs.forEach((o) => o.start());
  return { out, stop: () => oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } }), retune: (p) => retunes.forEach((f) => f(p)) };
}

class StandInEngine implements ListenEngine {
  state: EngineState = 'idle';
  preset = DEFAULT_PRESET;
  private output: Output = 'headphones';
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voice: Voice | null = null;
  private timerLeft: number | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private suspendAt: ReturnType<typeof setTimeout> | null = null;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners: { [K in keyof EngineEvents]: Set<(v: EngineEvents[K]) => void> } = { state: new Set(), time: new Set(), preset: new Set() };

  on<K extends keyof EngineEvents>(event: K, fn: (value: EngineEvents[K]) => void) {
    (this.listeners[event] as Set<(v: EngineEvents[K]) => void>).add(fn);
    return () => { (this.listeners[event] as Set<(v: EngineEvents[K]) => void>).delete(fn); };
  }
  private emit<K extends keyof EngineEvents>(event: K, v: EngineEvents[K]) {
    (this.listeners[event] as Set<(v: EngineEvents[K]) => void>).forEach((f) => f(v));
  }
  private set(s: EngineState) { if (s !== this.state) { this.state = s; this.emit('state', s); } }

  private ramp(to: number, seconds: number) {
    const g = this.master!.gain, t = this.ctx!.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(to, t + seconds);
  }

  async start(preset?: string) {
    if (preset) this.applyPreset(preset);
    if (this.state === 'playing' || this.state === 'starting') return;
    try {
      this.ctx ??= new AudioContext();
      const resumed = this.ctx.resume(); // inside the gesture, before any await
      if (!this.master) {
        this.master = this.ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.ctx.destination);
      }
      if (this.suspendAt) clearTimeout(this.suspendAt);
      this.voice ??= makeVoice(this.ctx, this.preset, this.output, this.master);
      this.voice.out.gain.value = CEILING * VOLUME * VOLUME;
      this.set('starting');
      await resumed;
      this.ramp(1, this.timerLeft !== null && this.timerLeft < START_FADE ? 0.5 : START_FADE);
      this.lastTick = performance.now();
      this.ticker ??= setInterval(() => this.tick(), 250);
      setTimeout(() => { if (this.state === 'starting') this.set('playing'); }, 400);
    } catch {
      this.set('error');
    }
  }

  private tick() {
    const now = performance.now(), dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (this.state !== 'playing' && this.state !== 'starting') return;
    if (this.timerLeft === null) return;
    const before = this.timerLeft;
    this.timerLeft = Math.max(0, before - dt);
    if (before > TIMER_FADE && this.timerLeft <= TIMER_FADE) this.ramp(0, this.timerLeft);
    this.emit('time', this.timerLeft);
    if (this.timerLeft === 0) this.finish();
  }

  private finish() {
    this.timerLeft = null;
    this.halt();
    this.set('ended');
    this.emit('time', null);
  }

  private halt() {
    if (this.ticker) { clearInterval(this.ticker); this.ticker = null; }
    const ctx = this.ctx;
    if (this.suspendAt) clearTimeout(this.suspendAt);
    this.suspendAt = setTimeout(() => { void ctx?.suspend(); }, PAUSE_FADE * 1000 + 100);
  }

  pause() {
    if (!this.ctx || (this.state !== 'playing' && this.state !== 'starting')) return;
    this.ramp(0, PAUSE_FADE);
    this.halt();
    this.set('paused');
  }

  private applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p || p === this.preset) return;
    this.preset = p;
    this.voice?.retune(p);
    this.emit('preset', p);
  }
  setPreset(id: string) { this.applyPreset(id); }

  setOutput(output: Output) {
    if (output === this.output) return;
    this.output = output;
    if (!this.ctx || !this.master || !this.voice) return;
    const old = this.voice, ctx = this.ctx;
    this.voice = makeVoice(ctx, this.preset, output, this.master);
    this.voice.out.gain.value = CEILING * VOLUME * VOLUME;
    old.out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => old.stop(), 600);
  }

  setTimer(seconds: number | null) {
    this.timerLeft = seconds;
    this.emit('time', seconds);
    if (seconds !== null && this.master && (this.state === 'playing' || this.state === 'starting')) {
      this.ramp(1, 0.2); // a new timer after an earlier fade-out starts from full again
    }
  }

  dispose() {
    if (this.ticker) clearInterval(this.ticker);
    if (this.suspendAt) clearTimeout(this.suspendAt);
    this.voice?.stop();
    void this.ctx?.close();
  }
}

export function createListenEngine(): ListenEngine {
  return new StandInEngine();
}
