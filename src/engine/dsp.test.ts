import { describe, expect, it } from "vitest";
import {
  EngineRenderer,
  FREE_PRESETS,
  Fade,
  limit,
  pulse,
  TONE_CEILING,
  type EngineSettings,
} from "./dsp";

const RATES = [44100, 48000];

function render(r: EngineRenderer, seconds: number) {
  const n = Math.round(seconds * r.sampleRate);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  // 128-frame quanta, like a worklet.
  for (let i = 0; i < n; i += 128) {
    const m = Math.min(128, n - i);
    r.render(m, left.subarray(i, i + m), right.subarray(i, i + m));
  }
  return { left, right };
}

/** Frequency from linearly interpolated rising zero crossings. */
function measureHz(x: Float32Array, rate: number) {
  const ups: number[] = [];
  for (let i = 1; i < x.length; i++) {
    if (x[i - 1] < 0 && x[i] >= 0) ups.push(i - 1 + -x[i - 1] / (x[i] - x[i - 1]));
  }
  return ((ups.length - 1) * rate) / (ups[ups.length - 1] - ups[0]);
}

const steady = (rate: number, s: EngineSettings) => {
  const r = new EngineRenderer(rate, s);
  r.fadeTo(1, 0.005);
  render(r, 0.5);
  return r;
};

describe("catalog", () => {
  it("has the five free presets with the app's carrier and beat values", () => {
    expect(FREE_PRESETS.map((p) => [p.id, p.name, p.carrier, p.beat])).toEqual([
      ["deep-sleep", "Deep Sleep", 180, 2],
      ["daydream", "Daydream", 220, 6],
      ["calm-focus", "Calm Focus", 220, 10],
      ["deep-work", "Deep Work", 220, 16],
      ["peak", "Peak", 220, 40],
    ]);
  });
});

describe.each(RATES)("binaural at %d Hz", (rate) => {
  it.each(FREE_PRESETS)("$name: each ear within 0.01 Hz", (p) => {
    const r = steady(rate, { carrier: p.carrier, beat: p.beat, mode: "binaural", volume: 0.7 });
    const { left, right } = render(r, 20);
    expect(Math.abs(measureHz(left, rate) - (p.carrier - p.beat / 2))).toBeLessThan(0.01);
    expect(Math.abs(measureHz(right, rate) - (p.carrier + p.beat / 2))).toBeLessThan(0.01);
  });
});

describe.each(RATES)("isochronic at %d Hz", (rate) => {
  it.each(FREE_PRESETS)("$name: pulses at the beat rate, identical in both ears", (p) => {
    const r = steady(rate, { carrier: p.carrier, beat: p.beat, mode: "isochronic", volume: 0.7 });
    const secs = 10;
    const { left, right } = render(r, secs);
    expect(right).toEqual(left);
    // A pulse gap is a run of silence much longer than any carrier zero crossing.
    const minGap = Math.floor((0.2 / p.beat) * rate);
    let run = 0;
    let gaps = 0;
    for (let i = 0; i < left.length; i++) {
      if (Math.abs(left[i]) < 1e-6) {
        run++;
        if (run === minGap) gaps++;
      } else run = 0;
    }
    expect(Math.abs(gaps - p.beat * secs)).toBeLessThanOrEqual(1);
  });

  it("pulse envelope: 60% duty, raised-cosine edges, no corners", () => {
    expect(pulse(0)).toBe(0);
    expect(pulse(0.075)).toBeCloseTo(0.5, 12);
    expect(pulse(0.3)).toBe(1);
    expect(pulse(0.6)).toBe(0);
    expect(pulse(0.9)).toBe(0);
  });
});

describe("fade", () => {
  it("rises through a raised cosine over its length and lands exactly", () => {
    const f = new Fade();
    f.start(1, 3, 1000);
    const g: number[] = [];
    for (let i = 0; i < 3000; i++) g.push(f.next());
    expect(g[0]).toBe(0);
    expect(g[749]).toBeCloseTo(0.5 - 0.5 * Math.cos(Math.PI * 0.25), 2); // raised cosine, not linear
    expect(g[1499]).toBeCloseTo(0.5, 2);
    expect(g[2999]).toBe(1);
    for (let i = 1; i < g.length; i++) expect(g[i]).toBeGreaterThanOrEqual(g[i - 1]);
    expect(f.next()).toBe(1);
  });

  it("turns around smoothly when reversed midway", () => {
    const f = new Fade();
    f.start(1, 3, 1000);
    for (let i = 0; i < 1500; i++) f.next();
    const mid = f.next();
    f.start(0, 1.5, 1000);
    let prev = mid;
    let maxStep = 0;
    for (let i = 0; i < 1500; i++) {
      const v = f.next();
      maxStep = Math.max(maxStep, Math.abs(v - prev));
      prev = v;
    }
    expect(maxStep).toBeLessThan(0.005);
    expect(prev).toBe(0);
    expect(f.isSilent).toBe(true);
  });

  it("renderer: starts silent, 3 s fade-in, silent after a 1.5 s pause fade", () => {
    const r = new EngineRenderer(48000, { carrier: 220, beat: 10, mode: "binaural", volume: 1 });
    r.fadeTo(1, 3);
    const a = render(r, 3).left;
    const peak = (x: Float32Array, from: number, to: number) =>
      x.slice(from, to).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak(a, 0, 48)).toBeLessThan(0.001);
    expect(peak(a, 72000 - 480, 72000 + 480)).toBeGreaterThan(0.2);
    expect(peak(a, 143000, 144000)).toBeGreaterThan(TONE_CEILING * 0.95);
    r.fadeTo(0, 1.5);
    const b = render(r, 1.6).left;
    expect(peak(b, 72000, 76800)).toBe(0);
    expect(r.isSilent).toBe(true);
  });
});

describe("timer", () => {
  const peakAt = (x: Float32Array, rate: number, t: number) =>
    x.slice(Math.round((t - 0.05) * rate), Math.round((t + 0.05) * rate)).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  it("fades out over its last 30 s, then is silent and reports done", () => {
    const rate = 48000;
    const r = steady(rate, { carrier: 220, beat: 10, mode: "binaural", volume: 1 });
    r.setTimer(60);
    const { left } = render(r, 62);
    const full = peakAt(left, rate, 10);
    expect(full).toBeGreaterThan(TONE_CEILING * 0.95);
    expect(peakAt(left, rate, 29.5)).toBeGreaterThan(TONE_CEILING * 0.95);
    // 5 s into the fade: position 5/30 from the top, heard through the raised cosine.
    const at35 = peakAt(left, rate, 35) / full;
    expect(at35).toBeGreaterThan(0.88);
    expect(at35).toBeLessThan(0.97);
    expect(peakAt(left, rate, 45)).toBeGreaterThan(0.2 * full);
    expect(peakAt(left, rate, 45)).toBeLessThan(0.8 * full);
    expect(peakAt(left, rate, 59.95)).toBeLessThan(0.01 * full);
    expect(peakAt(left, rate, 61)).toBe(0);
    expect(r.timerDone).toBe(true);
    expect(r.timerRemaining).toBe(0);
  });
  it("short timers start the fade after a short rise and end on time", () => {
    const rate = 48000;
    const r = new EngineRenderer(rate, { carrier: 220, beat: 10, mode: "binaural", volume: 1 });
    r.fadeTo(1, 3);
    r.setTimer(10);
    const { left } = render(r, 11);
    expect(peakAt(left, rate, 5)).toBeGreaterThan(0.1);
    expect(peakAt(left, rate, 9.98)).toBeLessThan(0.01);
    expect(r.timerDone).toBe(true);
  });
  it("null clears it", () => {
    const r = steady(48000, { carrier: 220, beat: 10, mode: "binaural", volume: 1 });
    r.setTimer(5);
    r.setTimer(null);
    const { left } = render(r, 8);
    expect(peakAt(left, 48000, 7.5)).toBeGreaterThan(TONE_CEILING * 0.95);
    expect(r.timerDone).toBe(false);
  });
  it("does not run down while paused", () => {
    const r = steady(48000, { carrier: 220, beat: 10, mode: "binaural", volume: 1 });
    r.setTimer(60);
    render(r, 10);
    r.setRunning(false);
    render(r, 20);
    expect(r.timerRemaining).toBeCloseTo(50, 1);
  });
});

describe("limiter", () => {
  it("never reaches its ceiling and is transparent below 0.8", () => {
    expect(limit(0.5)).toBe(0.5);
    expect(limit(-0.8)).toBe(-0.8);
    // Strictly under 0.98 for any plausible sum (the loudest tone peaks at 0.5); tanh rounds to 1 only far beyond it.
    for (let x = 0; x < 3; x += 0.01) {
      expect(Math.abs(limit(x))).toBeLessThan(0.98);
      expect(Math.abs(limit(-x))).toBeLessThan(0.98);
    }
    expect(Math.abs(limit(1e6))).toBeLessThanOrEqual(0.98);
    expect(limit(0.8 + 1e-9)).toBeCloseTo(0.8, 6);
  });
  it("no rendered sample exceeds the ceiling, even with out-of-range settings", () => {
    const r = steady(48000, { carrier: 5000, beat: 500, mode: "isochronic", volume: 9 });
    const { left, right } = render(r, 2);
    const max = [...left, ...right].reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(max).toBeLessThanOrEqual(TONE_CEILING + 1e-6);
    expect(max).toBeLessThan(0.98);
  });
});

describe("no discontinuities", () => {
  const maxStep = (x: Float32Array, from: number, to: number) => {
    let m = 0;
    for (let i = from + 1; i < to; i++) m = Math.max(m, Math.abs(x[i] - x[i - 1]));
    return m;
  };
  const rate = 48000;
  /** The last sample before a change, then the samples after it, so the step across the change is measured too. */
  const withTail = (before: Float32Array, after: Float32Array) => {
    const x = new Float32Array(after.length + 1);
    x[0] = before[before.length - 1];
    x.set(after, 1);
    return x;
  };
  it.each(FREE_PRESETS.flatMap((a) => FREE_PRESETS.filter((b) => b !== a).map((b) => [a, b] as const)))(
    "glides from $0.name to $1.name",
    (a, b) => {
      const r = steady(rate, { carrier: a.carrier, beat: a.beat, mode: "binaural", volume: 0.7 });
      const before = render(r, 1);
      r.setSettings({ carrier: b.carrier, beat: b.beat, mode: "binaural", volume: 0.7 });
      const after = render(r, 2);
      const bound = 0.245 * 2 * Math.PI * (Math.max(a.carrier + a.beat / 2, b.carrier + b.beat / 2) / rate);
      for (const ch of [
        [before.left, after.left],
        [before.right, after.right],
      ]) {
        const joined = new Float32Array(ch[0].length + ch[1].length);
        joined.set(ch[0]);
        joined.set(ch[1], ch[0].length);
        expect(maxStep(joined, 0, joined.length)).toBeLessThan(bound * 1.05);
      }
    },
  );
  // Odd lengths, so the phases are not all at a zero crossing at the moment of the change.
  const ODD = [1.0137, 1.0291, 1.0553, 1.0707];
  it.each(["binaural", "isochronic"] as const)("glides when switching away from %s", (from) => {
    const to = from === "binaural" ? "isochronic" : "binaural";
    for (const d of ODD) {
      const r = steady(rate, { carrier: 220, beat: 16, mode: from, volume: 0.7 });
      const before = render(r, d).left;
      r.setSettings({ carrier: 220, beat: 16, mode: to, volume: 0.7 });
      const x = withTail(before, render(r, 1).left);
      expect(maxStep(x, 0, x.length)).toBeLessThan(0.245 * 2 * Math.PI * (228 / rate) * 1.2);
    }
  });
  it("the pitch moves gradually: 10 ms after a jump in carrier it has barely started", () => {
    const r = steady(rate, { carrier: 220, beat: 10, mode: "binaural", volume: 0.7 });
    r.setSettings({ carrier: 880, beat: 10, mode: "binaural", volume: 0.7 });
    const early = measureHz(render(r, 0.03).left, rate);
    expect(early).toBeLessThan(450);
    const late = measureHz(render(r, 1).left.subarray(rate * 0.5), rate);
    expect(Math.abs(late - 875)).toBeLessThan(0.5);
  });
  it("volume changes glide", () => {
    for (const d of ODD) {
      const r = steady(rate, { carrier: 220, beat: 10, mode: "binaural", volume: 0.1 });
      const before = render(r, d).left;
      r.setSettings({ carrier: 220, beat: 10, mode: "binaural", volume: 1 });
      const x = withTail(before, render(r, 1).left);
      expect(maxStep(x, 0, x.length)).toBeLessThan(0.5 * 2 * Math.PI * (225 / rate) * 1.05);
    }
  });
});

describe("determinism", () => {
  it("renders the same samples whatever the quantum size", () => {
    const mk = () => {
      const r = new EngineRenderer(48000, { carrier: 220, beat: 16, mode: "binaural", volume: 0.7 });
      r.fadeTo(1, 3);
      return r;
    };
    const a = mk();
    const b = mk();
    const n = 48000;
    const A = new Float32Array(n), B = new Float32Array(n), t = new Float32Array(n);
    a.render(n, A, t);
    for (let i = 0; i < n; i += 100) b.render(Math.min(100, n - i), B.subarray(i), t.subarray(i));
    expect(B).toEqual(A);
  });
});
