export type OverlaySound = "none" | "white-noise";

export interface OverlayAudioState {
  isPlaying: boolean;
  currentSound: OverlaySound;
  volume: number;
  lowPassFreq: number;
}

const OVERLAY_FADE_IN_MS = 1000; // 1s fade-in for overlay
const OVERLAY_FADE_OUT_MS = 1000; // 1s fade-out for overlay

class OverlayAudioEngine {
  private context: AudioContext | null = null;
  private whiteNoiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private currentSound: OverlaySound = "none";
  private volume = 0.04; // 4% max volume
  private lowPassFreq = 4000; // Default low-pass frequency

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.context;
  }

  private createWhiteNoise(): AudioBufferSourceNode {
    const ctx = this.ensureContext();
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of audio
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // Generate white noise
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;
    return whiteNoise;
  }

  start(sound: OverlaySound, volume: number = 0.04): void {
    if (sound === "none") {
      this.stop();
      return;
    }

    const ctx = this.ensureContext();
    
    // If we're already playing the same sound, just update volume
    if (this.isPlaying && this.currentSound === sound) {
      this.setVolume(volume);
      return;
    }

    // Stop any currently playing sound
    this.stop();

    // Create low-pass filter
    this.lowPassFilter = ctx.createBiquadFilter();
    this.lowPassFilter.type = "lowpass";
    this.lowPassFilter.frequency.value = this.lowPassFreq;
    this.lowPassFilter.Q.value = 1.0;

    // Create gain node for volume control
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0; // Start at 0 for fade-in

    // Connect: white noise -> low-pass filter -> gain -> destination
    if (sound === "white-noise") {
      this.whiteNoiseNode = this.createWhiteNoise();
      this.whiteNoiseNode.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);
      this.whiteNoiseNode.start();
      
      // Fade in over 1 second
      const now = ctx.currentTime;
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(volume, now + OVERLAY_FADE_IN_MS / 1000);
    }

    this.isPlaying = true;
    this.currentSound = sound;
    this.volume = volume;
  }

  stop(): void {
    if (this.gainNode && this.isPlaying) {
      // Fade out over 1 second before stopping
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const currentVolume = this.gainNode.gain.value;
      
      this.gainNode.gain.setValueAtTime(currentVolume, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + OVERLAY_FADE_OUT_MS / 1000);
      
      // Schedule cleanup after fade-out
      setTimeout(() => {
        this.cleanup();
      }, OVERLAY_FADE_OUT_MS + 100);
      
      this.isPlaying = false;
      this.currentSound = "none";
    } else {
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (this.whiteNoiseNode) {
      try { this.whiteNoiseNode.stop(); } catch { /* Already stopped */ }
      this.whiteNoiseNode = null;
    }
    if (this.lowPassFilter) {
      this.lowPassFilter.disconnect();
      this.lowPassFilter = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
    this.currentSound = "none";
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(0.04, volume)); // Cap at 4%
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  // Smoothly transition to a new sound (fade out current, fade in new)
  transitionTo(sound: OverlaySound, volume: number = 0.04): void {
    if (sound === this.currentSound) {
      // Same sound, just update volume
      this.setVolume(volume);
      return;
    }

    if (sound === "none") {
      // Fade out current sound
      this.stop();
      return;
    }

    // Fade out current sound, then fade in new sound
    if (this.isPlaying && this.gainNode) {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const currentVolume = this.gainNode.gain.value;
      
      // Fade out current sound
      this.gainNode.gain.setValueAtTime(currentVolume, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + OVERLAY_FADE_OUT_MS / 1000);
      
      // Schedule fade in of new sound after fade out
      setTimeout(() => {
        this.start(sound, volume);
      }, OVERLAY_FADE_OUT_MS + 50);
    } else {
      // No current sound, just start new one
      this.start(sound, volume);
    }
  }

  setLowPassFreq(freq: number): void {
    this.lowPassFreq = Math.max(500, Math.min(8000, freq)); // 500Hz to 8kHz range
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.value = this.lowPassFreq;
    }
  }

  setSound(sound: OverlaySound): void {
    if (sound === this.currentSound) return;
    
    if (sound === "none") {
      this.stop();
    } else {
      this.start(sound, this.volume);
    }
  }

  getState(): OverlayAudioState {
    return {
      isPlaying: this.isPlaying,
      currentSound: this.currentSound,
      volume: this.volume,
      lowPassFreq: this.lowPassFreq
    };
  }
}

export const overlayAudioEngine = new OverlayAudioEngine();
