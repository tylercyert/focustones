import { expect, test } from "@playwright/test";

// The desktop delights' sound bus (src/engine/toy.ts) in Chromium: bounded output, live mute, teardown and idle suspend.
type Api = {
  peaks(): Promise<{ one: number; five: number; tailOne: number; tailFive: number; all: number }>;
  mute(): Promise<{ before: number; after: number }>;
  lifecycle(stopEarly: boolean): Promise<{
    baseline: number; during: { playing: number; live: number }; ended: { ms: number; playing: number; live: number }; state: string;
  }>;
};
const toy = (page: import("@playwright/test").Page) => ({
  peaks: () => page.evaluate(() => (window as unknown as { toy: Api }).toy.peaks()),
  mute: () => page.evaluate(() => (window as unknown as { toy: Api }).toy.mute()),
  lifecycle: (stop: boolean) => page.evaluate((s) => (window as unknown as { toy: Api }).toy.lifecycle(s), stop),
});

test.beforeEach(async ({ page }) => {
  await page.goto("/src/engine/e2e/toy-harness.html");
  await page.waitForFunction(() => document.title === "ready");
});

test("repeated chords replace each other and everything at once stays under full scale", async ({ page }) => {
  const p = await toy(page).peaks();
  expect(p.one).toBeGreaterThan(0.05); // it is audible
  expect(p.five).toBeLessThan(p.one * 1.5); // five quick previews do not stack
  expect(p.tailFive / p.tailOne).toBeLessThan(1.15); // the replaced chords are gone, not ringing underneath
  expect(p.all).toBeLessThan(0.95); // an overload of ~2.6 before the bus comes out under full scale (the limiter)
});

test("setting the volume to 0 silences a sound that is already playing", async ({ page }) => {
  const m = await toy(page).mute();
  expect(m.before).toBeGreaterThan(0.01);
  expect(m.after).toBeLessThan(1e-4);
});

test("sounds that end by themselves disconnect every node, then the context suspends", async ({ page }) => {
  const r = await toy(page).lifecycle(false);
  expect(r.during.playing).toBe(3);
  expect(r.during.live).toBeGreaterThan(r.baseline + 20);
  expect(r.ended).toMatchObject({ playing: 0, live: r.baseline });
  expect(r.state).toBe("suspended");
});

test("stopping sounds early fades them in about 0.3 s and disconnects every node", async ({ page }) => {
  const r = await toy(page).lifecycle(true);
  expect(r.ended.ms).toBeLessThan(1500);
  expect(r.ended).toMatchObject({ playing: 0, live: r.baseline });
  expect(r.state).toBe("suspended");
});
