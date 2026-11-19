import { useEffect, useState } from 'react';
import { listenEngine } from '../listen/engineAdapter.ts';
import type { Band } from './beat.ts';

/** The band of the preset Listen is set to (playing or not), following every change. */
export function useBand(): Band {
  const engine = listenEngine();
  const [band, setBand] = useState<Band>(engine.preset.band);
  useEffect(() => engine.on('preset', (p) => setBand(p.band)), [engine]);
  return band;
}
