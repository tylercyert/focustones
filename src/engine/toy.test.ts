import { describe, expect, it } from 'vitest';
import { CHORD, CHORD_SECONDS, chordEnvelope, crumple, TOY_LIMITS, toyBeat, toyLevel } from './toy';

describe('startup chord', () => {
  it('is five warm notes rolled upward, under 300 Hz, none of them C major’s root triad', () => {
    expect(CHORD).toHaveLength(5);
    for (let i = 1; i < CHORD.length; i++) {
      expect(CHORD[i].freq).toBeGreaterThan(CHORD[i - 1].freq);
      expect(CHORD[i].delay).toBeGreaterThan(CHORD[i - 1].delay);
    }
    expect(Math.max(...CHORD.map((n) => n.freq))).toBeLessThan(300);
    const pitchClass = (f: number) => ((Math.round(12 * Math.log2(f / 261.63)) % 12) + 12) % 12; // 0 = C
    const classes = new Set(CHORD.map((n) => pitchClass(n.freq)));
    expect(classes.has(0) && classes.has(4) && classes.has(7)).toBe(false); // C, E and G together would be C major
  });

  it('rises in 40 ms and has faded to near silence before it ends', () => {
    expect(chordEnvelope(0)).toBe(0);
    expect(chordEnvelope(0.02)).toBeCloseTo(0.5);
    expect(chordEnvelope(0.04)).toBeCloseTo(1);
    expect(chordEnvelope(CHORD_SECONDS - 0.2)).toBeLessThan(0.05);
  });
});

describe('crumple', () => {
  it('is the same sound for the same seed, and different for another', () => {
    expect(crumple(3)).toEqual(crumple(3));
    expect(crumple(3)).not.toEqual(crumple(4));
  });

  it('keeps every crackle short, inside the length, in order and quieter towards the end', () => {
    const c = crumple(14, 0.7);
    expect(c).toHaveLength(26);
    for (let i = 0; i < c.length; i++) {
      expect(c[i].at).toBeGreaterThanOrEqual(0);
      expect(c[i].at + c[i].duration).toBeLessThan(0.7 + 0.05);
      expect(c[i].duration).toBeLessThanOrEqual(0.045);
      expect(c[i].level).toBeLessThanOrEqual(1);
      if (i) expect(c[i].at).toBeGreaterThanOrEqual(c[i - 1].at);
    }
    const early = c.filter((x) => x.at < 0.35).length;
    expect(early).toBeGreaterThan(c.length / 2);
  });
});

describe('Beat Calculator sound', () => {
  it('is the difference between the ears, to 0.1 Hz', () => {
    expect(toyBeat(220, 230).beat).toBe(10);
    expect(toyBeat(230, 220).beat).toBe(10);
    expect(toyBeat(200, 206.25).beat).toBe(6.3);
  });

  it('plays only inside the ear and band limits', () => {
    expect(toyBeat(220, 230).playable).toBe(true);
    expect(toyBeat(220, 220.5).playable).toBe(true);
    expect(toyBeat(220, 265).playable).toBe(true);
    expect(toyBeat(220, 220.2).playable).toBe(false); // under 0.5 Hz
    expect(toyBeat(220, 266).playable).toBe(false); // over 45 Hz
    expect(toyBeat(TOY_LIMITS.minEar - 1, 85).playable).toBe(false);
    expect(toyBeat(990, TOY_LIMITS.maxEar + 1).playable).toBe(false);
    expect(toyBeat(Number.NaN, 230).playable).toBe(false);
    expect(toyBeat(Infinity, 230).playable).toBe(false);
  });
});

describe('level', () => {
  it('follows the desktop volume squared, under its ceiling, and is silent at 0 or for junk', () => {
    expect(toyLevel(0)).toBe(0);
    expect(toyLevel(1, 0.25)).toBe(0.25);
    expect(toyLevel(0.5, 0.2)).toBeCloseTo(0.05);
    expect(toyLevel(7, 0.2)).toBe(0.2);
    expect(toyLevel(-1)).toBe(0);
    expect(toyLevel(Number.NaN)).toBe(0);
  });
});
