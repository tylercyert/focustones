/** The Listen window's door to the sound: the web engine (`src/engine`, issue #4) behind a small interface. */
import { FocusEngine, FREE_PRESETS, DEFAULT_PRESET, modeForOutput, type EngineState, type Preset } from '../../engine/index.ts';

export type { EngineState, Preset };
export type Output = 'headphones' | 'speaker';
export const PRESETS: readonly Preset[] = FREE_PRESETS;
export { DEFAULT_PRESET };

export interface EngineEvents { state: EngineState; time: number | null; preset: Preset }

export interface ListenEngine {
  readonly state: EngineState;
  readonly preset: Preset;
  /** Call from a click or tap handler: iOS only unlocks audio inside one. */
  start(): Promise<void>;
  pause(): void;
  setPreset(id: string): void;
  setOutput(output: Output): void;
  /** 0…1; the desktop's volume item sets it. */
  setVolume(volume: number): void;
  /** Seconds until the session fades out and ends; null clears it. */
  setTimer(seconds: number | null): void;
  on<K extends keyof EngineEvents>(event: K, fn: (value: EngineEvents[K]) => void): () => void;
}

let shared: ListenEngine | null = null;

/** One engine per page: closing and reopening the Listen window keeps the session. */
export function listenEngine(): ListenEngine {
  if (shared) return shared;
  const e = new FocusEngine();
  shared = {
    get state() { return e.currentState; },
    get preset() { return e.currentPreset; },
    start: () => e.start().catch(() => { /* the engine has emitted its "error" state */ }),
    pause: () => e.pause(),
    setPreset: (id) => e.setPreset(id),
    setOutput: (o) => e.setMode(modeForOutput(o)),
    setVolume: (v) => e.setVolume(v),
    setTimer: (s) => e.setTimer(s),
    on: (event, fn) => e.on(event, fn as never),
  };
  return shared;
}
