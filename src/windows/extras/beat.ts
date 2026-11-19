// The five bands (CONTEXT.md): which one a beat falls in, for the Beat Calculator and the band-tinted delights.
import { BAND_HUES, type Band } from '../listen/orbMotion.ts';

export type { Band };

export const BANDS: readonly { band: Band; min: number; max: number }[] = [
  { band: 'delta', min: 0.5, max: 4 },
  { band: 'theta', min: 4, max: 8 },
  { band: 'alpha', min: 8, max: 13 },
  { band: 'beta', min: 13, max: 30 },
  { band: 'gamma', min: 30, max: 45 },
];

/** The band a beat in Hz falls in: each range includes its low end, and gamma also includes 45. Null outside 0.5–45. */
export function bandFor(beat: number): Band | null {
  if (!Number.isFinite(beat)) return null;
  const hit = BANDS.find((b) => beat >= b.min && beat < b.max);
  return hit ? hit.band : beat === 45 ? 'gamma' : null;
}

/** The band's base color as CSS, from the app's palette (the same hues the orb uses). */
export function bandColor(band: Band, tone: 'base' | 'light' | 'deep' = 'base'): string {
  const [r, g, b] = BAND_HUES[band][tone].map((v) => Math.round(v * 255));
  return `rgb(${r} ${g} ${b})`;
}
