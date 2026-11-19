// Shared by the page and the worklet. The worklet file itself must never be imported by page code.
import type { EngineSettings } from "./dsp";

export const PROCESSOR_NAME = "focustones-tone";

export interface ProcessorOptions {
  settings: EngineSettings;
  /** Fade in over this many seconds from the first sample; null starts silent and waits for a fade command. */
  startFade: number | null;
  /** Counts the timer down in seconds, or null. */
  timer: number | null;
}

export type ToneMessage =
  | { type: "settings"; settings: EngineSettings }
  | { type: "fade"; target: number; seconds: number }
  | { type: "timer"; seconds: number | null }
  | { type: "running"; running: boolean };
