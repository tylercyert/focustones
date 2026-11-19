// The orb's motion as pure functions of time: a port of focustones-ios `OrbMotion.swift` and `Motion.swift`, so the
// rules are tested apart from drawing. The mesh drifts slowly, the orb breathes on a 6 s cycle while playing, and
// nothing here takes the beat as an input, so nothing can flash at the beat rate. Reduce Motion stills drift and breath.

export type Band = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
export type RGB = readonly [number, number, number];
export interface Hues { readonly base: RGB; readonly light: RGB; readonly deep: RGB; readonly cross: RGB }
export interface Point { readonly x: number; readonly y: number }

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as unknown as RGB;

/** The band hues from focustones-ios docs/design/DESIGN.md (the iOS app's Palette). */
export const BAND_HUES: Readonly<Record<Band, Hues>> = {
  delta: { base: hex('#21B5B0'), light: hex('#7FE3DC'), deep: hex('#0E6F78'), cross: hex('#3C7FD6') },
  theta: { base: hex('#26C3A8'), light: hex('#8AEBD4'), deep: hex('#138A6E'), cross: hex('#2B9FC6') },
  alpha: { base: hex('#7BBE62'), light: hex('#C2E89A'), deep: hex('#3F8A35'), cross: hex('#2FB59A') },
  beta: { base: hex('#D9B44A'), light: hex('#F4DE8E'), deep: hex('#A8721A'), cross: hex('#F2A23A') },
  gamma: { base: hex('#F2A23A'), light: hex('#FFD08A'), deep: hex('#C2561A'), cross: hex('#E8664A') },
};

export const INK: RGB = hex('#0A0C12');

export const MOTION = {
  /** Session start: the orb swells from `fadeInScale` to 1 over the sound's fade-in. */
  fadeIn: 3.0,
  fadeInScale: 0.92,
  /** Pause: the orb settles over the sound's fade-out. */
  pauseFade: 1.5,
  /** Band change: the orb's colours cross over this long (0.2 s with Reduce Motion). */
  bandMorph: 0.6,
  reducedCrossFade: 0.2,
  breathPeriod: 6,
  breathScale: [1.0, 1.055] as const,
  glowOpacity: [0.5, 0.85] as const,
  idleGlowOpacity: 0.32,
  idleBrightness: 0.9,
  driftPeriod: 40,
  counterDriftPeriod: 26,
  framesPerSecond: 30,
} as const;

const INNER_RADIUS = 0.12;
const EDGE_SLIDE = 0.14;

export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dim = (c: RGB, by: number): RGB => [c[0] * by, c[1] * by, c[2] * by];

export function mixHues(a: Hues, b: Hues, t: number): Hues {
  return { base: mix(a.base, b.base, t), light: mix(a.light, b.light, t), deep: mix(a.deep, b.deep, t), cross: mix(a.cross, b.cross, t) };
}

/** Eases 0…1 in and out. */
export function ease(x: number): number {
  const c = Math.min(Math.max(x, 0), 1);
  return (1 - Math.cos(Math.PI * c)) / 2;
}

/** A visible orb drifts; Reduce Motion runs only long enough to complete a transition. */
export function isAnimating(visible: boolean, active: boolean, reduceMotion: boolean, transitioning: boolean): boolean {
  return visible && active && (!reduceMotion || transitioning);
}

/** The 3×3 mesh's points at time `t` (s), row by row, in the unit square. Corners stay put; edges slide, the centre circles. */
export function points(t: number, reduceMotion: boolean): Point[] {
  const time = reduceMotion ? 0 : t;
  const inner = (2 * Math.PI * (time % MOTION.driftPeriod)) / MOTION.driftPeriod;
  const edge = (-2 * Math.PI * (time % MOTION.counterDriftPeriod)) / MOTION.counterDriftPeriod;
  const slide = EDGE_SLIDE * Math.sin(edge);
  const lift = EDGE_SLIDE * Math.cos(edge);
  const centre = { x: 0.5 + INNER_RADIUS * Math.cos(inner), y: 0.5 + INNER_RADIUS * Math.sin(inner) };
  return [
    { x: 0, y: 0 }, { x: 0.5 + slide, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 0.5 - lift }, centre, { x: 1, y: 0.5 + lift },
    { x: 0, y: 1 }, { x: 0.5 - slide, y: 1 }, { x: 1, y: 1 },
  ];
}

/** The mesh's nine colours, row by row: light at the top left, the cross hue at the right, deep at the bottom. */
export function colors(h: Hues, brightness: number): RGB[] {
  return [
    h.light, mix(h.light, h.base, 0.5), h.cross,
    mix(h.light, h.base, 0.6), h.base, mix(h.base, h.cross, 0.5),
    mix(h.base, h.cross, 0.55), h.deep, h.deep,
  ].map((c) => dim(c, brightness));
}

export interface Breath { readonly scale: number; readonly glow: number; readonly brightness: number }

/** Where the 6 s breath is at time `t`, from 0 (out) to 1 (in), easing in and out. */
export const breathPhase = (t: number): number => (1 - Math.cos((2 * Math.PI * t) / MOTION.breathPeriod)) / 2;

/** One frame's breath for a play level from 0 (still) to 1 (playing). Reduce Motion holds the breath's middle. */
export function breath(t: number, level: number, reduceMotion: boolean): Breath {
  const l = Math.min(Math.max(level, 0), 1);
  const phase = reduceMotion ? 0.5 : breathPhase(t);
  const [s0, s1] = MOTION.breathScale;
  const [g0, g1] = MOTION.glowOpacity;
  return {
    scale: MOTION.fadeInScale + (s0 + (s1 - s0) * phase - MOTION.fadeInScale) * l,
    glow: MOTION.idleGlowOpacity + (g0 + (g1 - g0) * phase - MOTION.idleGlowOpacity) * l,
    brightness: MOTION.idleBrightness + (1 - MOTION.idleBrightness) * l,
  };
}

/** Whether the orb is playing and how far it has come into or out of it. A change mid-fade starts from where the level is. */
export class OrbPlayback {
  private playing: boolean;
  private changedAt = -Infinity;
  private startLevel: number;
  constructor(playing: boolean) {
    this.playing = playing;
    this.startLevel = playing ? 1 : 0;
  }
  level(t: number): number {
    const duration = this.playing ? MOTION.fadeIn : MOTION.pauseFade;
    const target = this.playing ? 1 : 0;
    return this.startLevel + (target - this.startLevel) * ease((t - this.changedAt) / duration);
  }
  remaining(t: number): number {
    return Math.max(0, (this.playing ? MOTION.fadeIn : MOTION.pauseFade) - (t - this.changedAt));
  }
  set(playing: boolean, t: number): void {
    if (playing === this.playing) return;
    this.startLevel = this.level(t);
    this.changedAt = t;
    this.playing = playing;
  }
}

/** The orb's colours crossing from one band's hues to another's. A new band mid-morph starts from the colours on screen. */
export class OrbMorph {
  private from: Hues;
  private to: Hues;
  private startedAt = -Infinity;
  private duration: number = MOTION.bandMorph;
  constructor(hues: Hues) {
    this.from = hues;
    this.to = hues;
  }
  hues(t: number): Hues {
    return mixHues(this.from, this.to, ease((t - this.startedAt) / this.duration));
  }
  remaining(t: number): number {
    return Math.max(0, this.duration - (t - this.startedAt));
  }
  retarget(hues: Hues, t: number, reduceMotion: boolean): void {
    if (hues === this.to) return;
    this.from = this.hues(t);
    this.to = hues;
    this.startedAt = t;
    this.duration = reduceMotion ? MOTION.reducedCrossFade : MOTION.bandMorph;
  }
}
