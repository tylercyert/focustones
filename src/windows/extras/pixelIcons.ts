// Original pixel icons for the desktop delights (issue #14), drawn on the same 32 × 32 grid as src/desktop/icons.tsx
// and merged into its set, so `<Icon name="calculator" />` works everywhere. No borrowed artwork (ADR 0002).
type Grid = (string | null)[][];
const N = 32;
const K = '#000000', W = '#FFFFFF', G1 = '#F2F2F2', G2 = '#DDDDDD', G3 = '#B8B8B8', G4 = '#808080', G5 = '#555555';
const Y1 = '#FFF3A6', Y2 = '#F2D65C', Y3 = '#C9A93A';

const blank = (): Grid => Array.from({ length: N }, () => Array<string | null>(N).fill(null));
function set(g: Grid, x: number, y: number, c: string | null) { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; }
function fill(g: Grid, x: number, y: number, w: number, h: number, c: string | null) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(g, x + i, y + j, c); }
function frame(g: Grid, x: number, y: number, w: number, h: number, c: string) { fill(g, x, y, w, 1, c); fill(g, x, y + h - 1, w, 1, c); fill(g, x, y, 1, h, c); fill(g, x + w - 1, y, 1, h, c); }
/** A beveled platinum box: black outline, white top-left, grey bottom-right. */
function box(g: Grid, x: number, y: number, w: number, h: number, body = G2) {
  fill(g, x, y, w, h, body); frame(g, x, y, w, h, K);
  fill(g, x + 1, y + 1, w - 2, 1, W); fill(g, x + 1, y + 1, 1, h - 2, W);
  fill(g, x + 1, y + h - 2, w - 2, 1, G4); fill(g, x + w - 2, y + 1, 1, h - 2, G4);
}
function bitmap(g: Grid, x: number, y: number, rows: string[], c: string) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') set(g, x + i, y + j, c); }));
}

export const extraDrawers: Record<string, () => Grid> = {
  /** The Trash, bulging: lid tipped up on a heap of crumpled paper. */
  'trash-full'() {
    const g = blank();
    for (let y = 11; y < 29; y++) { const inset = Math.floor((y - 11) / 9); fill(g, 7 + inset, y, 18 - inset * 2, 1, G2); set(g, 7 + inset, y, K); set(g, 24 - inset, y, K); }
    fill(g, 9, 28, 14, 1, K);
    for (const x of [11, 15, 19]) fill(g, x, 13, 1, 13, G4);
    for (const x of [12, 16, 20]) fill(g, x, 13, 1, 13, W);
    // crumpled paper heaped over the rim
    for (const [cx, cy, r] of [[11, 9, 4], [17, 8, 4.5], [22, 10, 3.5]] as const) {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r) set(g, x, y, d > r - 1 ? K : (x + y) % 3 === 0 ? G3 : W);
      }
    }
    fill(g, 6, 11, 20, 2, G3); frame(g, 6, 11, 20, 2, K);
    // the lid, tipped up on the right
    for (let i = 0; i < 16; i++) { set(g, 10 + i, 5 - Math.floor(i / 4), K); set(g, 10 + i, 6 - Math.floor(i / 4), G3); }
    fill(g, 17, 1, 4, 1, K);
    return g;
  },
  calculator() {
    const g = blank();
    box(g, 6, 2, 20, 28, G2);
    fill(g, 9, 5, 14, 6, '#141823'); frame(g, 9, 5, 14, 6, K);
    for (let x = 11; x < 21; x++) set(g, x, 8, x % 2 ? '#7FE3DC' : '#E9C866'); // a tiny waveform on the display
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const x = 9 + c * 5, y = 13 + r * 4;
      fill(g, x, y, 4, 3, r === 3 && c === 2 ? '#7BBE62' : W); frame(g, x, y, 4, 3, K);
    }
    return g;
  },
  sticky() {
    const g = blank();
    fill(g, 4, 5, 24, 23, Y1); frame(g, 4, 5, 24, 23, K);
    fill(g, 5, 6, 22, 3, Y2); fill(g, 4, 9, 24, 1, K);
    fill(g, 5, 27, 23, 1, Y3); fill(g, 28, 6, 1, 23, K); fill(g, 5, 28, 24, 1, K);
    for (const [y, w] of [[13, 16], [17, 12], [21, 15]] as const) fill(g, 8, y, w, 1, G4);
    bitmap(g, 21, 15, ['..#', '.#.', '#..'], K); // a pencil tick
    return g;
  },
  saver() {
    const g = blank();
    box(g, 3, 4, 26, 21, G2);
    fill(g, 6, 7, 20, 15, K);
    for (const [cx, cy, r, c] of [[11, 12, 2.6, '#26C3A8'], [19, 16, 3.2, '#D9B44A'], [21, 10, 1.6, '#F2A23A']] as const) {
      for (let y = 7; y < 22; y++) for (let x = 6; x < 26; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) set(g, x, y, c);
    }
    fill(g, 12, 25, 8, 2, G3); fill(g, 9, 27, 14, 2, G2); frame(g, 9, 27, 14, 2, K);
    return g;
  },
  patterns() {
    const g = blank();
    box(g, 3, 4, 26, 21, G2);
    for (let y = 7; y < 22; y++) for (let x = 6; x < 26; x++) set(g, x, y, (x + y) % 4 === 0 || (x - y + 64) % 4 === 0 ? '#7BBE62' : '#3F8A35');
    frame(g, 6, 7, 20, 15, K);
    fill(g, 12, 25, 8, 2, G3); fill(g, 9, 27, 14, 2, G2); frame(g, 9, 27, 14, 2, K);
    return g;
  },
  bell() {
    const g = blank();
    bitmap(g, 8, 4, [
      '.......##.......', '......####......', '....########....', '...##########...', '...##########...', '..############..',
      '..############..', '..############..', '..############..', '.##############.', '.##############.', '################',
      '################',
    ], K);
    bitmap(g, 9, 6, ['......##......', '....######....', '...########...', '...########...', '..##########..', '..##########..', '..##########..', '..##########..', '.############.', '.############.', '##############'], Y2);
    fill(g, 11, 8, 2, 6, Y1);
    fill(g, 14, 18, 4, 2, K);
    fill(g, 21, 3, 7, 7, '#E8664A'); frame(g, 21, 3, 7, 7, K);
    bitmap(g, 23, 4, ['###', '..#', '.#.', '...', '.#.'], W); // a badge with a "?" — it can wait
    return g;
  },
  video() {
    const g = blank();
    box(g, 2, 6, 28, 20, G2);
    fill(g, 5, 9, 22, 14, '#141823'); frame(g, 5, 9, 22, 14, K);
    bitmap(g, 13, 12, ['#.....', '###...', '#####.', '######', '#####.', '###...', '#.....'].map((r) => r + '..'), W);
    fill(g, 5, 21, 15, 1, '#E8664A'); fill(g, 20, 21, 7, 1, G4);
    return g;
  },
  inbox() {
    const g = blank();
    box(g, 3, 9, 26, 18, G1);
    for (let i = 0; i < 12; i++) { set(g, 4 + i, 10 + Math.floor(i * 0.7), K); set(g, 27 - i, 10 + Math.floor(i * 0.7), K); }
    fill(g, 17, 3, 13, 9, '#E8664A'); frame(g, 17, 3, 13, 9, K);
    bitmap(g, 19, 5, ['###.###', '#.#.#.#', '###.###', '..#...#', '###.###'], W); // "99"
    return g;
  },
  chat() {
    const g = blank();
    fill(g, 2, 4, 20, 13, W); frame(g, 2, 4, 20, 13, K); bitmap(g, 5, 17, ['####', '###.', '##..', '#...'], K);
    fill(g, 11, 13, 19, 12, '#8AEBD4'); frame(g, 11, 13, 19, 12, K); bitmap(g, 24, 25, ['####', '.###', '..##', '...#'], K);
    for (const x of [6, 10, 14]) fill(g, x, 9, 2, 2, G4);
    for (const x of [15, 19, 23]) fill(g, x, 18, 2, 2, '#138A6E');
    return g;
  },
  tabs() {
    const g = blank();
    for (let i = 4; i >= 0; i--) {
      const x = 2 + i * 2, y = 4 + i * 4;
      fill(g, x, y, 8, 3, i === 0 ? W : G3); frame(g, x, y, 8, 3, K);
      fill(g, x, y + 2, 26 - i * 2, 22 - i * 4, i === 0 ? W : G2); frame(g, x, y + 2, 26 - i * 2, 22 - i * 4, K);
    }
    for (const y of [12, 15, 18]) fill(g, 5, y, 16, 1, G4);
    return g;
  },
  credits() {
    const g = blank();
    box(g, 4, 3, 24, 26, G1);
    bitmap(g, 9, 7, ['..##..', '.####.', '######', '######', '.####.', '..##..'].map((r) => r.replace(/#/g, '#')), '#E9C866');
    for (const [y, w] of [[16, 14], [19, 10], [22, 12]] as const) fill(g, 16 - w / 2, y, w, 1, G5);
    fill(g, 19, 7, 5, 1, K); fill(g, 19, 10, 5, 1, K);
    return g;
  },
};
