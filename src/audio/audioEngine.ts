export type EngineState = {
  context: AudioContext | null;
  leftGain: GainNode | null;
  rightGain: GainNode | null;
  leftOsc: OscillatorNode | null;
  rightOsc: OscillatorNode | null;
  leftPanner: StereoPannerNode | null;
  rightPanner: StereoPannerNode | null;
  isPlaying: boolean;
};

const FADE_IN_MS = 1000; // 1s fade-in
const FADE_OUT_MS = 1000; // 1s fade-out
const MAX_GAIN_LINEAR = Math.pow(10, (-6 / 20)); // -6 dB cap

class BinauralEngine {
  private state: EngineState = {
    context: null,
    leftGain: null,
    rightGain: null,
    leftOsc: null,
    rightOsc: null,
    leftPanner: null,
    rightPanner: null,
    isPlaying: false
  };

  private ensureContext(): AudioContext {
    if (!this.state.context) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.state.context = ctx;
    }
    return this.state.context!;
  }

  start(params: { carrierHz: number; offsetHz: number; volume: number; waveform: OscillatorType }): void {
    const ctx = this.ensureContext();

    // If already running, just retune smoothly
    if (this.state.leftOsc && this.state.rightOsc && this.state.leftGain && this.state.rightGain && this.state.isPlaying) {
      this.tune(params);
      return;
    }
    
    // If audio nodes exist but we're not playing (stopping state), force teardown and restart
    if (this.state.leftOsc && this.state.rightOsc && this.state.leftGain && this.state.rightGain && !this.state.isPlaying) {
      this.forceTeardown();
    }

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = 0;
    rightGain.gain.value = 0;

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    leftOsc.type = params.waveform;
    rightOsc.type = params.waveform;

    const leftPanner = ctx.createStereoPanner();
    const rightPanner = ctx.createStereoPanner();
    leftPanner.pan.value = -1;
    rightPanner.pan.value = 1;

    leftOsc.connect(leftPanner).connect(leftGain);
    rightOsc.connect(rightPanner).connect(rightGain);
    leftGain.connect(ctx.destination);
    rightGain.connect(ctx.destination);

    const now = ctx.currentTime;
    leftOsc.frequency.setValueAtTime(params.carrierHz, now);
    rightOsc.frequency.setValueAtTime(params.carrierHz + params.offsetHz, now);

    leftOsc.start();
    rightOsc.start();

    // Fade in both oscillators
    const target = Math.min(params.volume, MAX_GAIN_LINEAR);
    leftGain.gain.cancelScheduledValues(now);
    rightGain.gain.cancelScheduledValues(now);
    leftGain.gain.setValueAtTime(0, now);
    rightGain.gain.setValueAtTime(0, now);
    leftGain.gain.linearRampToValueAtTime(target, now + FADE_IN_MS / 1000);
    rightGain.gain.linearRampToValueAtTime(target, now + FADE_IN_MS / 1000);

    this.state = { context: ctx, leftGain, rightGain, leftOsc, rightOsc, leftPanner, rightPanner, isPlaying: true };
  }

  stop(): void {
    const { context: ctx, leftGain, rightGain, leftOsc, rightOsc } = this.state;
    if (!ctx || !leftGain || !rightGain || !leftOsc || !rightOsc) return;
    const now = ctx.currentTime;
    
    // Fade out both oscillators individually
    leftGain.gain.cancelScheduledValues(now);
    rightGain.gain.cancelScheduledValues(now);
    const currentLeft = leftGain.gain.value;
    const currentRight = rightGain.gain.value;
    
    leftGain.gain.setValueAtTime(currentLeft, now);
    rightGain.gain.setValueAtTime(currentRight, now);
    leftGain.gain.linearRampToValueAtTime(0, now + FADE_OUT_MS / 1000);
    rightGain.gain.linearRampToValueAtTime(0, now + FADE_OUT_MS / 1000);

    // Stop after fade
    const stopAt = now + FADE_OUT_MS / 1000 + 0.05;
    leftOsc.stop(stopAt);
    rightOsc.stop(stopAt);
    this._teardownTimeout = setTimeout(() => this.teardown(), FADE_OUT_MS + 100);
  }

  tune(params: { carrierHz: number; offsetHz: number; volume: number; waveform?: OscillatorType }): void {
    const { context: ctx, leftOsc, rightOsc, leftGain, rightGain } = this.state;
    if (!ctx || !leftOsc || !rightOsc || !leftGain || !rightGain) return;
    const now = ctx.currentTime;
    
    // Smooth ramps for frequencies
    leftOsc.frequency.cancelScheduledValues(now);
    rightOsc.frequency.cancelScheduledValues(now);
    leftOsc.frequency.linearRampToValueAtTime(params.carrierHz, now + 0.1);
    rightOsc.frequency.linearRampToValueAtTime(params.carrierHz + params.offsetHz, now + 0.1);

    if (params.waveform) {
      leftOsc.type = params.waveform;
      rightOsc.type = params.waveform;
    }

    // Smooth ramps for both gain nodes
    const target = Math.min(params.volume, MAX_GAIN_LINEAR);
    leftGain.gain.cancelScheduledValues(now);
    rightGain.gain.cancelScheduledValues(now);
    leftGain.gain.setValueAtTime(leftGain.gain.value, now);
    rightGain.gain.setValueAtTime(rightGain.gain.value, now);
    leftGain.gain.linearRampToValueAtTime(target, now + 0.1);
    rightGain.gain.linearRampToValueAtTime(target, now + 0.1);
  }

  scheduleStopAfterMinutes(minutes: number): void {
    const { context: ctx } = this.state;
    if (!ctx || !Number.isFinite(minutes) || minutes <= 0) return;
    const ms = minutes * 60 * 1000;
    window.clearTimeout(this._timerId);
    this._timerId = window.setTimeout(() => this.stop(), ms);
  }

  cancelTimer(): void {
    window.clearTimeout(this._timerId);
  }

  // Check if audio is currently playing
  getIsPlaying(): boolean {
    return this.state.isPlaying;
  }

  // Force immediate teardown (for restart scenarios)
  forceTeardown(): void {
    const { leftOsc, rightOsc } = this.state;
    
    // Stop oscillators immediately if they exist
    if (leftOsc) {
      try { leftOsc.stop(); } catch { /* Oscillator already stopped */ }
    }
    if (rightOsc) {
      try { rightOsc.stop(); } catch { /* Oscillator already stopped */ }
    }
    
    // Clear any pending teardown timeout
    if (this._teardownTimeout) {
      clearTimeout(this._teardownTimeout);
      this._teardownTimeout = undefined;
    }
    
    // Call teardown immediately
    this.teardown();
  }

  // Force restart with new parameters (for toggle behavior)
  restart(params: { carrierHz: number; offsetHz: number; volume: number; waveform: OscillatorType }): void {
    this.stop();
    // Wait for stop to complete before starting
    setTimeout(() => this.start(params), FADE_OUT_MS + 100);
  }

  private _timerId: number | undefined;
  private _teardownTimeout: number | undefined;

  private teardown() {
    const { leftGain, rightGain, leftPanner, rightPanner } = this.state;
    try { leftPanner?.disconnect(); } catch { /* Already disconnected */ }
    try { rightPanner?.disconnect(); } catch { /* Already disconnected */ }
    try { leftGain?.disconnect(); } catch { /* Already disconnected */ }
    try { rightGain?.disconnect(); } catch { /* Already disconnected */ }
    this.state = { context: this.state.context, leftGain: null, rightGain: null, leftOsc: null, rightOsc: null, leftPanner: null, rightPanner: null, isPlaying: false };
  }
}

export const audioEngine = new BinauralEngine();


