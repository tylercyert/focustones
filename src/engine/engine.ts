/**
 * The FocusTones web engine's public API: framework-free (no React), one `FocusEngine` per page. The DSP lives in
 * `dsp.ts` and runs in an AudioWorklet (`worklet-processor.ts`); this file owns the AudioContext and the browser
 * quirks (iOS unlock and silent switch, backgrounding, Media Session).
 */
import { DEFAULT_VOLUME, FREE_PRESETS, PAUSE_FADE_SECONDS, START_FADE_SECONDS, type EngineSettings, type Mode, type Preset } from "./dsp";
import { PROCESSOR_NAME, type ProcessorOptions, type ToneMessage } from "./protocol";
import workletUrl from "./worklet-processor.ts?worker&url";

export type EngineState = "idle" | "starting" | "playing" | "paused" | "ended" | "error";

export interface EngineEvents {
  /** The playback state changed. */
  state: EngineState;
  /** Seconds of timer left (null when no timer), about four times a second while playing, and on every change. */
  time: number | null;
  /** The preset changed (including the first one). */
  preset: Preset;
}

type Listener<K extends keyof EngineEvents> = (value: EngineEvents[K]) => void;

/** Headphones play binaural beats; speakers play isochronic pulses (the app's two modes). */
export const modeForOutput = (output: "headphones" | "speaker"): Mode => (output === "headphones" ? "binaural" : "isochronic");

export const DEFAULT_PRESET = FREE_PRESETS[3]; // Deep Work, the app's first-open focus preset.

/** Loads the worklet into `ctx` and returns the tone node: also what the Playwright test renders offline. */
export async function createToneNode(ctx: BaseAudioContext, options: ProcessorOptions): Promise<AudioWorkletNode> {
  await ctx.audioWorklet.addModule(workletUrl);
  return new AudioWorkletNode(ctx, PROCESSOR_NAME, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    processorOptions: options,
  });
}

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export class FocusEngine {
  private preset: Preset = DEFAULT_PRESET;
  private mode: Mode = "binaural";
  private volume = DEFAULT_VOLUME;
  private timerSeconds: number | null = null;
  private timerAnchor = 0; // ctx time the timer's seconds were last measured at, while playing

  private state: EngineState = "idle";
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private element: HTMLAudioElement | null = null;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private wantsPlaying = false;
  private pending: Promise<void> | null = null;
  private stream: MediaStreamAudioDestinationNode | null = null;
  private readonly listeners: { [K in keyof EngineEvents]: Set<Listener<K>> } = {
    state: new Set(),
    time: new Set(),
    preset: new Set(),
  };

  constructor() {
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", this.onVisible);
    this.setupMediaSession();
  }

  on<K extends keyof EngineEvents>(event: K, fn: Listener<K>): () => void {
    (this.listeners[event] as Set<Listener<K>>).add(fn);
    return () => (this.listeners[event] as Set<Listener<K>>).delete(fn);
  }

  private emit<K extends keyof EngineEvents>(event: K, value: EngineEvents[K]) {
    for (const fn of this.listeners[event] as Set<Listener<K>>) fn(value);
  }

  get currentState(): EngineState {
    return this.state;
  }
  get currentPreset(): Preset {
    return this.preset;
  }
  get currentMode(): Mode {
    return this.mode;
  }
  get currentVolume(): number {
    return this.volume;
  }
  /** Seconds of timer left, or null. */
  get timeRemaining(): number | null {
    if (this.timerSeconds === null) return null;
    if (this.state !== "playing" || !this.ctx) return this.timerSeconds;
    return Math.max(0, this.timerSeconds - (this.ctx.currentTime - this.timerAnchor));
  }

  private settings(): EngineSettings {
    return { carrier: this.preset.carrier, beat: this.preset.beat, mode: this.mode, volume: this.volume };
  }

  private setState(s: EngineState) {
    if (s === this.state) return;
    this.state = s;
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = s === "playing" || s === "starting" ? "playing" : "paused";
    }
    this.emit("state", s);
  }

  private post(m: ToneMessage) {
    this.node?.port.postMessage(m);
  }

  /**
   * Starts (or resumes) with a 3 s fade-in. Call it from a click or tap handler: iOS only unlocks audio inside one.
   * Passing a preset switches to it first, whether or not it is already playing. Calling it again while a start is
   * in flight joins that start.
   */
  start(preset?: Preset | string): Promise<void> {
    if (preset !== undefined) this.setPreset(preset);
    this.wantsPlaying = true;
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    this.stopTimeout = null;
    // Everything that needs the user's gesture happens here, synchronously, before any await.
    const unlocked = this.unlock();
    return this.run(unlocked);
  }

  private async run(unlocked: Promise<unknown>): Promise<void> {
    try {
      while (this.wantsPlaying && this.state !== "playing") {
        if (this.pending) {
          await this.pending;
          continue;
        }
        this.setState("starting");
        this.pending = this.begin(unlocked).finally(() => (this.pending = null));
        await this.pending;
      }
    } catch (e) {
      this.wantsPlaying = false;
      this.setState("error");
      throw e;
    }
  }

  /** Creates and resumes the context and starts the media element (iOS), all synchronously inside the gesture. */
  private unlock(): Promise<unknown> {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: "playback" });
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = "playback"; // Safari 16.4+: audio is media, so the ringer switch does not mute it
      if (isIOS()) {
        // A context connected straight to the speakers is muted by the iPhone's silent switch; one playing through a
        // media element is not. The element and its stream exist now so that play() runs inside the gesture.
        this.stream = this.ctx.createMediaStreamDestination();
        const el = new Audio();
        el.srcObject = this.stream.stream;
        this.element = el;
      }
    }
    return Promise.all([this.ctx.resume(), this.element?.play()]);
  }

  private async begin(unlocked: Promise<unknown>) {
    const ctx = this.ctx!;
    await unlocked;
    if (!this.node) await this.build(ctx);
    if (!this.wantsPlaying) {
      this.suspendOutput();
      return;
    }
    this.timerAnchor = ctx.currentTime;
    this.post({ type: "settings", settings: this.settings() });
    this.post({ type: "timer", seconds: this.timerSeconds });
    this.post({ type: "running", running: true });
    this.post({ type: "fade", target: 1, seconds: START_FADE_SECONDS });
    this.setState("playing");
    this.startTicker();
  }

  private async build(ctx: AudioContext) {
    const node = await createToneNode(ctx, { settings: this.settings(), startFade: null, timer: null });
    node.connect(this.stream ?? ctx.destination);
    this.node = node;
  }

  /** Fades out over 1.5 s, then suspends the context. The timer holds while paused. */
  pause(): void {
    this.wantsPlaying = false;
    if (this.state !== "playing" && this.state !== "starting") return;
    if (this.ctx && this.timerSeconds !== null) this.timerSeconds = this.timeRemaining;
    this.post({ type: "running", running: false });
    this.post({ type: "fade", target: 0, seconds: PAUSE_FADE_SECONDS });
    this.stopTicker();
    this.setState("paused");
    this.emit("time", this.timerSeconds);
    this.stopTimeout = setTimeout(() => {
      this.stopTimeout = null;
      if (!this.wantsPlaying) this.suspendOutput();
    }, PAUSE_FADE_SECONDS * 1000 + 100);
  }

  private suspendOutput() {
    this.element?.pause();
    void this.ctx?.suspend();
  }

  toggle(): Promise<void> {
    if (this.state === "playing" || this.state === "starting") {
      this.pause();
      return Promise.resolve();
    }
    return this.start();
  }

  private finish() {
    this.wantsPlaying = false;
    this.timerSeconds = null;
    this.stopTicker();
    this.setState("ended");
    this.emit("time", null);
    this.suspendOutput();
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    this.post({ type: "settings", settings: this.settings() });
  }

  /** Switches preset; the pitch glides, with no click. */
  setPreset(preset: Preset | string): void {
    this.applyPreset(preset);
    this.post({ type: "settings", settings: this.settings() });
  }

  private applyPreset(preset: Preset | string) {
    const p = typeof preset === "string" ? FREE_PRESETS.find((x) => x.id === preset) : preset;
    if (!p) throw new Error(`Unknown preset: ${String(preset)}`);
    this.preset = p;
    this.emit("preset", p);
    this.updateMediaMetadata();
  }

  /** 0…1. */
  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), 1);
    this.post({ type: "settings", settings: this.settings() });
  }

  /** Listens for `seconds` and fades out over the last 30; null clears it. */
  setTimer(seconds: number | null): void {
    this.timerSeconds = seconds !== null && seconds > 0 ? seconds : null;
    if (this.ctx) this.timerAnchor = this.ctx.currentTime;
    this.post({ type: "timer", seconds: this.timerSeconds });
    this.emit("time", this.timerSeconds);
  }

  private startTicker() {
    this.stopTicker();
    this.ticker = setInterval(() => {
      this.checkEnded();
      if (this.timerSeconds !== null) this.emit("time", this.timeRemaining);
    }, 250);
  }
  /** The worklet posts nothing; the page reads the audio clock to see a timer has run out. */
  private checkEnded() {
    if (this.state === "playing" && this.timerSeconds !== null && this.timeRemaining! <= 0.05) this.finish();
  }

  private stopTicker() {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
  }

  /** Tab backgrounding or an interruption (call, Siri) can suspend the context while we mean to play. */
  private onVisible = () => {
    if (document.visibilityState !== "visible" || !this.wantsPlaying || !this.ctx) return;
    this.checkEnded();
    if (!this.wantsPlaying) return; // the timer ran out while the tab was away: stay ended and silent
    if ((this.ctx.state as string) !== "running") void this.ctx.resume();
    if (this.element?.paused) void this.element.play();
  };

  private setupMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => void this.start());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    this.updateMediaMetadata();
  }

  private updateMediaMetadata() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: this.preset.name, artist: "FocusTones" });
  }

  dispose(): void {
    this.stopTicker();
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.onVisible);
    this.node?.disconnect();
    this.element?.pause();
    void this.ctx?.close();
    this.node = null;
    this.ctx = null;
    this.element = null;
    this.stream = null;
    this.setState("idle");
  }
}
