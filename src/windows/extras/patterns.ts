import type { CSSProperties } from 'react';
import { bandColor, type Band } from './beat.ts';

// Desktop Patterns (issue #14): original 8 × 8 one-bit tiles, drawn here. The panel paints each one in the current
// band's color over the desktop's own tone (theme tokens in CSS), as a mask, so a theme change restyles every pattern.

export interface Pattern { readonly id: string; readonly rows: readonly string[] }

export const PATTERNS: readonly Pattern[] = [
  { id: 'waveform', rows: ['........', '.##.....', '#..#....', '....#..#', '.....##.', '........', '........', '........'] },
  { id: 'ripple', rows: ['..####..', '.#....#.', '#......#', '#..##..#', '#..##..#', '#......#', '.#....#.', '..####..'] },
  { id: 'dots', rows: ['#.......', '........', '........', '........', '....#...', '........', '........', '........'] },
  { id: 'weave', rows: ['###.#...', '###.#...', '###.#...', '........', '#...###.', '#...###.', '#...###.', '........'] },
  { id: 'tilt', rows: ['#.......', '.#......', '..#.....', '...#....', '....#...', '.....#..', '......#.', '.......#'] },
  { id: 'lattice', rows: ['...#....', '..#.#...', '.#...#..', '#.....#.', '.#...#..', '..#.#...', '...#....', '........'] },
  { id: 'drizzle', rows: ['#.......', '........', '.....#..', '........', '........', '..#.....', '........', '......#.'] },
];

export const PATTERN_IDS: readonly string[] = PATTERNS.map((p) => p.id);

/** The tile as an SVG data URL (black where the pattern is drawn), for `mask-image`. */
export function patternMask(p: Pattern): string {
  const rects = p.rows.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ''))).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The CSS a patterned surface needs: the tile as a mask, painted in the band's color mixed into the desktop's tone. */
export function patternStyle(id: string, band: Band): CSSProperties | undefined {
  const p = PATTERNS.find((x) => x.id === id);
  if (!p) return undefined;
  return { '--dx-pattern': patternMask(p), '--dx-band': bandColor(band) } as CSSProperties;
}
