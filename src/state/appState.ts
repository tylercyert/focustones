import { create } from "zustand";
import type { OverlaySound } from "../audio/overlayAudio";

export type Band = "delta" | "theta" | "alpha" | "beta" | "gamma";

export interface AppState {
  isPlaying: boolean;
  band: Band;
  offsetHz: number;
  carrierHz: number;
  volume: number; // 0.0–1.0
  waveform: OscillatorType;
  timerMinutes?: number | null;
  reduceMotion: boolean;
  overlaySound: OverlaySound;
  overlayVolume: number; // 0.0–0.04 (4% max)
  overlayLowPassFreq: number; // 20Hz to 20kHz
  // actions
  setPlaying: (playing: boolean) => void;
  setBand: (band: Band) => void;
  setOffsetHz: (offset: number) => void;
  setCarrierHz: (carrier: number) => void;
  setVolume: (volume: number) => void;
  setWaveform: (waveform: OscillatorType) => void;
  setTimerMinutes: (minutes: number | null | undefined) => void;
  setReduceMotion: (reduce: boolean) => void;
  setOverlaySound: (sound: OverlaySound) => void;
  setOverlayVolume: (volume: number) => void;
  setOverlayLowPassFreq: (freq: number) => void;
}

export const BAND_RANGES: Record<Band, { min: number; max: number; default: number; color: string }> = {
  delta: { min: 0.1, max: 4, default: 2, color: "#21B5B0" },
  theta: { min: 4, max: 8, default: 6, color: "#26C3A8" },
  alpha: { min: 8, max: 13, default: 10, color: "#7BBE62" },
  beta: { min: 13, max: 30, default: 18, color: "#B8A64B" },
  gamma: { min: 30, max: 40, default: 36, color: "#F2A23A" }
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useAppState = create<AppState>((set, get) => {
  // Get user preferences from localStorage or use sensible defaults
  const getUserPreference = <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(`focustones_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Initialize state from user preferences
  const initialState = {
    isPlaying: false,
    band: getUserPreference('band', "alpha") as Band,
    offsetHz: getUserPreference('offsetHz', BAND_RANGES["alpha"].default),
    carrierHz: getUserPreference('carrierHz', 256),
    volume: getUserPreference('volume', 0.4),
    waveform: getUserPreference('waveform', "sine") as OscillatorType,
    timerMinutes: getUserPreference('timerMinutes', null),
    reduceMotion: getUserPreference('reduceMotion', false),
    overlaySound: getUserPreference('overlaySound', "none") as OverlaySound,
    overlayVolume: getUserPreference('overlayVolume', 0.04),
    overlayLowPassFreq: getUserPreference('overlayLowPassFreq', 4000),
  };

  return {
    ...initialState,
    setPlaying: (playing) => set({ isPlaying: playing }),
    setBand: (band) => {
      const { min, max, default: def } = BAND_RANGES[band];
      const current = get().offsetHz;
      const nextOffset = clamp(current, min, max);
      const newState = { band, offsetHz: Number.isFinite(nextOffset) ? nextOffset : def };
      
      // Save to localStorage
      localStorage.setItem('focustones_band', JSON.stringify(band));
      localStorage.setItem('focustones_offsetHz', JSON.stringify(newState.offsetHz));
      
      set(newState);
    },
    setOffsetHz: (offset) => {
      const { band } = get();
      const { min, max } = BAND_RANGES[band];
      const clampedOffset = clamp(offset, min, max);
      
      // Save to localStorage
      localStorage.setItem('focustones_offsetHz', JSON.stringify(clampedOffset));
      
      set({ offsetHz: clampedOffset });
    },
    setCarrierHz: (carrier) => {
      const clampedCarrier = clamp(carrier, 80, 1000);
      
      // Save to localStorage
      localStorage.setItem('focustones_carrierHz', JSON.stringify(clampedCarrier));
      
      set({ carrierHz: clampedCarrier });
    },
    setVolume: (volume) => {
      const clampedVolume = clamp(volume, 0, 1);
      
      // Save to localStorage
      localStorage.setItem('focustones_volume', JSON.stringify(clampedVolume));
      
      set({ volume: clampedVolume });
    },
    setWaveform: (waveform) => {
      // Save to localStorage
      localStorage.setItem('focustones_waveform', JSON.stringify(waveform));
      
      set({ waveform });
    },
    setTimerMinutes: (minutes) => {
      const newMinutes = minutes ?? null;
      
      // Save to localStorage
      localStorage.setItem('focustones_timerMinutes', JSON.stringify(newMinutes));
      
      set({ timerMinutes: newMinutes });
    },
    setReduceMotion: (reduce) => {
      // Save to localStorage
      localStorage.setItem('focustones_reduceMotion', JSON.stringify(reduce));
      
      set({ reduceMotion: reduce });
    },
    setOverlaySound: (sound) => {
      // Save to localStorage
      localStorage.setItem('focustones_overlaySound', JSON.stringify(sound));
      
      set({ overlaySound: sound });
    },
    setOverlayVolume: (volume) => {
      const clampedVolume = clamp(volume, 0, 0.04); // Cap at 4%
      
      // Save to localStorage
      localStorage.setItem('focustones_overlayVolume', JSON.stringify(clampedVolume));
      
      set({ overlayVolume: clampedVolume });
    },
    setOverlayLowPassFreq: (freq) => {
      const clampedFreq = clamp(freq, 500, 8000); // 500Hz to 8kHz
      
      // Save to localStorage
      localStorage.setItem('focustones_overlayLowPassFreq', JSON.stringify(clampedFreq));
      
      set({ overlayLowPassFreq: clampedFreq });
    }
  };
});


