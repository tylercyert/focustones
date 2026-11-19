import type { CSSProperties } from 'react';

// Original pixel icons, drawn in code on a grid and rendered as SVG rects (no image files, no borrowed artwork: ADR 0002).
type Grid = (string | null)[][];
const N = 32;

function blank(): Grid { return Array.from({ length: N }, () => Array<string | null>(N).fill(null)); }
function set(g: Grid, x: number, y: number, c: string | null) { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; }
function fill(g: Grid, x: number, y: number, w: number, h: number, c: string | null) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(g, x + i, y + j, c);
}
function frame(g: Grid, x: number, y: number, w: number, h: number, c: string) {
  fill(g, x, y, w, 1, c); fill(g, x, y + h - 1, w, 1, c); fill(g, x, y, 1, h, c); fill(g, x + w - 1, y, 1, h, c);
}
function roundRect(g: Grid, x: number, y: number, w: number, h: number, edge: string, body: string) {
  fill(g, x + 1, y + 1, w - 2, h - 2, body);
  fill(g, x + 2, y, w - 4, 1, edge); fill(g, x + 2, y + h - 1, w - 4, 1, edge);
  fill(g, x, y + 2, 1, h - 4, edge); fill(g, x + w - 1, y + 2, 1, h - 4, edge);
  for (const [dx, dy] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) set(g, x + dx, y + dy, edge);
}

const INK = '#0A0C12', K = '#000000', W = '#FFFFFF', G1 = '#F2F2F2', G2 = '#DDDDDD', G3 = '#B8B8B8', G4 = '#808080', G5 = '#555555';
const ORB = ['#0E6F78', '#138A6E', '#26C3A8', '#7BBE62', '#C2E89A'];

/** A shaded sphere: five band-colored tones with an ordered dither between them and a highlight. */
function orb(g: Grid, cx: number, cy: number, r: number) {
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
    if (d > r) continue;
    const lx = x + 0.5 - (cx - r * 0.35), ly = y + 0.5 - (cy - r * 0.4);
    const light = 1 - Math.min(1, Math.hypot(lx, ly) / (r * 1.5));
    const v = light * (ORB.length - 1) + (bayer[y & 3][x & 3] / 16 - 0.5) * 0.9;
    set(g, x, y, ORB[Math.max(0, Math.min(ORB.length - 1, Math.round(v)))]);
  }
  fill(g, Math.round(cx - r * 0.45), Math.round(cy - r * 0.55), 2, 1, W);
  set(g, Math.round(cx - r * 0.55), Math.round(cy - r * 0.35), W);
}

const drawers: Record<string, () => Grid> = {
  app() {
    const g = blank();
    roundRect(g, 1, 1, 30, 30, K, INK);
    frame(g, 2, 2, 28, 28, '#1C2130');
    set(g, 2, 2, K); set(g, 29, 2, K); set(g, 2, 29, K); set(g, 29, 29, K);
    orb(g, 16, 16, 9);
    return g;
  },
  note() {
    const g = blank();
    fill(g, 6, 2, 20, 28, W); frame(g, 6, 2, 20, 28, K);
    fill(g, 20, 2, 6, 6, G3); fill(g, 20, 2, 1, 6, K); fill(g, 20, 7, 6, 1, K); fill(g, 21, 3, 4, 4, G1);
    fill(g, 21, 3, 1, 1, K); // fold edge
    fill(g, 7, 3, 1, 26, G1);
    orb(g, 16, 14, 5);
    for (const y of [22, 25]) fill(g, 10, y, 12, 1, G4);
    fill(g, 7, 29, 19, 1, K); fill(g, 26, 8, 1, 22, K);
    return g;
  },
  trash() {
    const g = blank();
    fill(g, 12, 3, 8, 2, K); fill(g, 13, 4, 6, 1, G3);   // handle
    fill(g, 7, 6, 18, 3, G3); frame(g, 7, 6, 18, 3, K);   // lid
    fill(g, 8, 7, 16, 1, G1);
    for (let y = 9; y < 29; y++) { const inset = Math.floor((y - 9) / 10); fill(g, 8 + inset, y, 16 - inset * 2, 1, G2); set(g, 8 + inset, y, K); set(g, 23 - inset, y, K); }
    fill(g, 10, 28, 12, 1, K);
    for (const x of [12, 16, 20]) fill(g, x, 11, 1, 15, G4);
    for (const x of [13, 17, 21]) fill(g, x, 11, 1, 15, W);
    fill(g, 9, 9, 1, 19, W);
    return g;
  },
  help() {
    const g = blank();
    roundRect(g, 3, 3, 26, 24, K, G1);
    fill(g, 4, 4, 24, 1, W); fill(g, 4, 4, 1, 22, W);
    fill(g, 10, 26, 3, 1, G1);
    for (const [y, w] of [[27, 3], [28, 2], [29, 1]] as const) { set(g, 9, y, K); fill(g, 10, y, w, 1, G1); set(g, 10 + w, y, K); }
    fill(g, 9, 30, 2, 1, K);
    const q = ['.XXXX.', 'XX..XX', '....XX', '...XX.', '..XX..', '..XX..', '......', '..XX..', '..XX..'];
    q.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') fill(g, 10 + i * 2, 6 + j * 2, 2, 2, '#0E6F78'); }));
    return g;
  },
  disk() {
    const g = blank();
    roundRect(g, 3, 6, 26, 20, K, G2);
    fill(g, 4, 7, 24, 1, W); fill(g, 4, 7, 1, 17, W);
    fill(g, 7, 10, 18, 7, G5); fill(g, 8, 11, 16, 5, K);
    fill(g, 20, 20, 5, 2, G4); set(g, 22, 20, '#4FD18B');
    return g;
  },
  folder() {
    const g = blank();
    fill(g, 3, 8, 12, 4, G3); frame(g, 3, 8, 12, 4, K);
    fill(g, 3, 11, 26, 16, '#E9C866'); frame(g, 3, 11, 26, 16, K);
    fill(g, 4, 12, 24, 1, '#FFF3C2');
    fill(g, 4, 26, 25, 1, K); fill(g, 28, 12, 1, 15, K);
    return g;
  },
  speaker() {
    const g = blank();
    fill(g, 3, 12, 5, 8, K); fill(g, 4, 13, 3, 6, G2);
    for (let i = 0; i < 6; i++) { fill(g, 8 + i, 12 - i, 1, 8 + i * 2, K); if (i) fill(g, 8 + i, 13 - i, 1, 6 + i * 2, G2); }
    for (const r of [7, 11, 15]) for (let y = 0; y < N; y++) for (let x = 14; x < N; x++) {
      const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 16);
      if (Math.abs(d - r) < 0.75 && Math.abs(y + 0.5 - 16) < r * 0.62 && x + 0.5 - 12 > r * 0.45) set(g, x, y, K);
    }
    return g;
  },
};

function toRects(g: Grid) {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  g.forEach((row, y) => {
    let x = 0;
    while (x < N) {
      const c = row[x];
      if (!c) { x++; continue; }
      let w = 1;
      while (x + w < N && row[x + w] === c) w++;
      out.push({ x, y, w, c });
      x += w;
    }
  });
  return out;
}

const cache = new Map<string, ReturnType<typeof toRects>>();
function rectsFor(name: string) {
  let r = cache.get(name);
  if (!r) { r = toRects(drawers[name]()); cache.set(name, r); }
  return r;
}

function hasIcon(name: string): boolean { return name in drawers; }

/** A named pixel icon, or a glyph when `name` is not one of ours. Decorative: callers label the control. */
export function Icon({ name, size = 32, className, style }: { name: string; size?: number; className?: string; style?: CSSProperties }) {
  if (!hasIcon(name)) {
    return <span className={className} style={{ fontSize: size * 0.8, lineHeight: `${size}px`, width: size, height: size, display: 'inline-block', textAlign: 'center', ...style }} aria-hidden="true">{name}</span>;
  }
  return (
    <svg className={className} style={style} width={size} height={size} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rectsFor(name).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height="1" fill={r.c} />)}
    </svg>
  );
}
