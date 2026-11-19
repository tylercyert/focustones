import { BAND_HUES, type Band } from '../listen/orbMotion.ts';

// A dithered pixel orb in a band's hues: the screen saver's and the Saver panel's art, drawn on a 24-pixel grid with an
// ordered dither (a period look, no smooth gradients).
const N = 24;
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const css = (rgb: readonly number[]) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(' ')})`;
const cache = new Map<Band, { x: number; y: number; w: number; c: string }[]>();

function rects(band: Band) {
  const hit = cache.get(band);
  if (hit) return hit;
  const h = BAND_HUES[band];
  const tones = [css(h.deep), css(h.base), css(h.light), '#ffffff'];
  const out: { x: number; y: number; w: number; c: string }[] = [];
  const c = N / 2, r = N / 2 - 0.5;
  for (let y = 0; y < N; y++) {
    let run: { x: number; w: number; c: string } | null = null;
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      let colour: string | null = null;
      if (d <= r) {
        const light = 1 - Math.min(1, Math.hypot(x + 0.5 - (c - r * 0.35), y + 0.5 - (c - r * 0.4)) / (r * 1.55));
        const v = light * 2.6 + (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.9;
        colour = tones[Math.max(0, Math.min(3, Math.round(v)))];
      }
      if (run && run.c === colour) run.w++;
      else {
        if (run) out.push({ ...run, y });
        run = colour ? { x, w: 1, c: colour } : null;
      }
    }
    if (run) out.push({ ...run, y });
  }
  cache.set(band, out);
  return out;
}

export function PixelOrb({ band, size, className }: { band: Band; size: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rects(band).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height="1" fill={r.c} />)}
    </svg>
  );
}
