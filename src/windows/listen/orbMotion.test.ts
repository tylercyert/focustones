import { describe, expect, it } from 'vitest';
import { BAND_HUES, MOTION, OrbMorph, OrbPlayback, breath, breathPhase, colors, ease, isAnimating, points } from './orbMotion.ts';

const hexOf = (c: readonly number[]) => '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

describe('band colours', () => {
  // focustones-ios Packages/UI/Sources/UI/Palette.swift, `Palette.hues(_:)`.
  const ios = {
    delta: ['#21B5B0', '#7FE3DC', '#0E6F78', '#3C7FD6'],
    theta: ['#26C3A8', '#8AEBD4', '#138A6E', '#2B9FC6'],
    alpha: ['#7BBE62', '#C2E89A', '#3F8A35', '#2FB59A'],
    beta: ['#D9B44A', '#F4DE8E', '#A8721A', '#F2A23A'],
    gamma: ['#F2A23A', '#FFD08A', '#C2561A', '#E8664A'],
  } as const;
  it.each(Object.keys(ios) as (keyof typeof ios)[])('%s matches the iOS palette exactly', (band) => {
    const h = BAND_HUES[band];
    expect([h.base, h.light, h.deep, h.cross].map(hexOf)).toEqual(ios[band]);
  });
});

describe('orb motion', () => {
  it('breathes on a 6 s cycle: out at 0, in at 3 s, out again at 6 s', () => {
    expect(breathPhase(0)).toBeCloseTo(0);
    expect(breathPhase(3)).toBeCloseTo(1);
    expect(breathPhase(6)).toBeCloseTo(0);
  });

  it('is a function of time alone: no input can be the beat rate', () => {
    // Fastest change across 1 s of frames stays slow: the whole breath is 6 s and the drift 26-40 s.
    let maxStep = 0;
    for (let t = 0; t < 12; t += 1 / 30) {
      maxStep = Math.max(maxStep, Math.abs(breath(t + 1 / 30, 1, false).scale - breath(t, 1, false).scale));
    }
    expect(maxStep).toBeLessThan(0.002);
  });

  it('holds still with Reduce Motion: the same frame at any time', () => {
    expect(points(0, true)).toEqual(points(17.3, true));
    expect(breath(0, 1, true)).toEqual(breath(2.2, 1, true));
    expect(isAnimating(true, true, true, false)).toBe(false);
    expect(isAnimating(true, true, true, true)).toBe(true);
    expect(isAnimating(false, true, false, false)).toBe(false);
  });

  it('keeps the mesh corners put and drifts the rest', () => {
    const a = points(0, false);
    const b = points(10, false);
    for (const i of [0, 2, 6, 8]) expect(b[i]).toEqual(a[i]);
    expect(b[4]).not.toEqual(a[4]);
  });

  it('is dimmer and smaller when still, full when playing', () => {
    const idle = breath(3, 0, false);
    const playing = breath(3, 1, false);
    expect(idle.scale).toBeCloseTo(MOTION.fadeInScale);
    expect(idle.brightness).toBeCloseTo(0.9);
    expect(playing.scale).toBeCloseTo(1.055);
    expect(playing.brightness).toBeCloseTo(1);
  });

  it('swells over 3 s on play, settles over 1.5 s on pause, and never jumps mid-fade', () => {
    const p = new OrbPlayback(false);
    p.set(true, 10);
    expect(p.level(10)).toBeCloseTo(0);
    expect(p.level(11.5)).toBeCloseTo(0.5);
    expect(p.level(13)).toBeCloseTo(1);
    const before = p.level(11.5);
    p.set(false, 11.5);
    expect(p.level(11.5)).toBeCloseTo(before);
    expect(p.level(12.25)).toBeCloseTo(before / 2); // halfway through the 1.5 s settle
    expect(p.level(13)).toBeCloseTo(0);
    p.set(false, 20); // the same state again changes nothing
    expect(p.level(20)).toBeCloseTo(0);
  });

  it('morphs colour over 0.6 s (0.2 s with Reduce Motion) and a retarget starts from what is on screen', () => {
    const m = new OrbMorph(BAND_HUES.beta);
    m.retarget(BAND_HUES.delta, 5, false);
    expect(m.hues(5).base).toEqual(BAND_HUES.beta.base);
    expect(m.hues(5.6).base[0]).toBeCloseTo(BAND_HUES.delta.base[0]);
    const mid = m.hues(5.3).base;
    m.retarget(BAND_HUES.gamma, 5.3, true);
    expect(m.hues(5.3).base[1]).toBeCloseTo(mid[1]);
    expect(m.remaining(5.3)).toBeCloseTo(MOTION.reducedCrossFade);
    expect(m.remaining(5.6)).toBe(0);
  });

  it('builds nine mesh colours and eases 0..1', () => {
    expect(colors(BAND_HUES.alpha, 1)).toHaveLength(9);
    expect(ease(-1)).toBe(0);
    expect(ease(0.5)).toBeCloseTo(0.5);
    expect(ease(2)).toBe(1);
  });
});
