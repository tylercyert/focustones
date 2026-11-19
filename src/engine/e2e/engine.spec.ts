import { expect, test } from "@playwright/test";
import { FREE_PRESETS, type EngineSettings } from "../dsp";
import type { FocusEngine } from "../engine";

declare global {
  interface Window {
    FocusEngine: typeof FocusEngine;
    renderOffline(s: EngineSettings, seconds: number, rate: number): Promise<{
      hzLeft: number; hzRight: number; gaps: number; peak: number; identical: boolean; sampleRate: number;
    }>;
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/src/engine/e2e/harness.html");
  await page.waitForFunction(() => document.title === "ready");
});

for (const rate of [44100, 48000]) {
  for (const p of FREE_PRESETS) {
    test(`binaural ${p.name} renders in Chromium at ${rate} Hz`, async ({ page }) => {
      const r = await page.evaluate(
        ([s, rt]) => window.renderOffline(s as EngineSettings, 10, rt as number),
        [{ carrier: p.carrier, beat: p.beat, mode: "binaural", volume: 0.7 }, rate] as const,
      );
      expect(r.sampleRate).toBe(rate);
      expect(r.peak).toBeGreaterThan(0.2);
      expect(r.peak).toBeLessThan(0.98);
      expect(Math.abs(r.hzLeft - (p.carrier - p.beat / 2))).toBeLessThan(0.01);
      expect(Math.abs(r.hzRight - (p.carrier + p.beat / 2))).toBeLessThan(0.01);
    });

    test(`isochronic ${p.name} renders in Chromium at ${rate} Hz`, async ({ page }) => {
      const r = await page.evaluate(
        ([s, rt]) => window.renderOffline(s as EngineSettings, 10, rt as number),
        [{ carrier: p.carrier, beat: p.beat, mode: "isochronic", volume: 0.7 }, rate] as const,
      );
      expect(r.peak).toBeGreaterThan(0.2);
      expect(r.peak).toBeLessThan(0.98);
      expect(r.identical).toBe(true);
      expect(Math.abs(r.gaps - p.beat * 10)).toBeLessThanOrEqual(1);
    });
  }
}

test("FocusEngine plays in real time: start, glide to a preset, pause, and a timer that ends", async ({ page }) => {
  const log = await page.evaluate(async () => {
    const e = new window.FocusEngine();
    const states: string[] = [];
    const times: (number | null)[] = [];
    e.on("state", (s) => states.push(s));
    e.on("time", (t) => times.push(t));
    await e.start("deep-work");
    e.setPreset("peak");
    e.setMode("isochronic");
    e.setVolume(0.5);
    e.pause();
    await e.start();
    e.setTimer(3);
    await new Promise<void>((resolve) => e.on("state", (s) => s === "ended" && resolve()));
    return { states, times, preset: e.currentPreset.id, mode: e.currentMode };
  });
  expect(log.states).toEqual(["starting", "playing", "paused", "starting", "playing", "ended"]);
  expect(log.preset).toBe("peak");
  expect(log.mode).toBe("isochronic");
  expect(log.times.at(-1)).toBeNull();
});
