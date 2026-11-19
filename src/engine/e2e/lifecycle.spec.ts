import { expect, test } from "@playwright/test";
import type { FocusEngine } from "../engine";
import type { ToneMessage } from "../protocol";

declare global {
  interface Window {
    FocusEngine: typeof FocusEngine;
    engine: FocusEngine;
    sent: ToneMessage[];
    states: string[];
    calls: string[];
    inGesture: boolean;
  }
}

// Records every control message the page sends to the worklet, and the order of the unlock calls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sent = [];
    window.calls = [];
    window.inGesture = false;
    const post = MessagePort.prototype.postMessage;
    MessagePort.prototype.postMessage = function (this: MessagePort, ...a: [unknown]) {
      const m = a[0] as { type?: string };
      if (m && typeof m === "object" && typeof m.type === "string") window.sent.push(m as ToneMessage);
      return post.apply(this, a as never);
    } as typeof post;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      window.calls.push(`play:${window.inGesture ? "gesture" : "late"}`);
      return play.call(this);
    };
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function (this: AudioContext) {
      window.calls.push(`resume:${window.inGesture ? "gesture" : "late"}`);
      return resume.call(this);
    };
  });
  await page.goto("/src/engine/e2e/harness.html");
  await page.waitForFunction(() => document.title === "ready");
  await page.evaluate(() => {
    window.engine = new window.FocusEngine();
    window.states = [];
    window.engine.on("state", (s) => window.states.push(s));
  });
});

const settingsSent = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    window.sent.filter((m) => m.type === "settings").map((m) => (m as Extract<ToneMessage, { type: "settings" }>).settings),
  );

test("start, pause, start plays again with a fade-in each time", async ({ page }) => {
  const out = await page.evaluate(async () => {
    const e = window.engine;
    await e.start();
    e.pause();
    await e.start();
    return { state: e.currentState, states: window.states, fades: window.sent.filter((m) => m.type === "fade") };
  });
  expect(out.states).toEqual(["starting", "playing", "paused", "starting", "playing"]);
  expect(out.fades).toEqual([
    { type: "fade", target: 1, seconds: 3 },
    { type: "fade", target: 0, seconds: 1.5 },
    { type: "fade", target: 1, seconds: 3 },
  ]);
});

test("repeated and concurrent start() calls end up playing", async ({ page }) => {
  const out = await page.evaluate(async () => {
    const e = window.engine;
    await Promise.all([e.start(), e.start(), e.start()]);
    const first = e.currentState;
    await e.start();
    return { first, after: e.currentState, running: window.sent.filter((m) => m.type === "running").length };
  });
  expect(out.first).toBe("playing");
  expect(out.after).toBe("playing");
  expect(out.running).toBe(1); // one start, not three
});

test("pause during a start that is still loading ends paused, and a later start plays", async ({ page }) => {
  const out = await page.evaluate(async () => {
    const e = window.engine;
    const p = e.start();
    e.pause();
    await p;
    const afterPause = e.currentState;
    await e.start();
    return { afterPause, final: e.currentState };
  });
  expect(out.afterPause).toBe("paused");
  expect(out.final).toBe("playing");
});

test("start(preset) while playing changes the sound", async ({ page }) => {
  await page.evaluate(async () => {
    await window.engine.start("deep-work");
    await window.engine.start("peak");
  });
  const s = await settingsSent(page);
  expect(s.at(-1)).toMatchObject({ carrier: 220, beat: 40, mode: "binaural" });
  expect(await page.evaluate(() => window.engine.currentState)).toBe("playing");
});

test("start(preset) while paused plays the new preset", async ({ page }) => {
  await page.evaluate(async () => {
    await window.engine.start("deep-work");
    window.engine.pause();
    await window.engine.start("deep-sleep");
  });
  const s = await settingsSent(page);
  expect(s.at(-1)).toMatchObject({ carrier: 180, beat: 2 });
  expect(await page.evaluate(() => window.engine.currentState)).toBe("playing");
});

test("setPreset and setMode while playing reach the worklet and keep playing", async ({ page }) => {
  await page.evaluate(async () => {
    await window.engine.start("calm-focus");
    window.engine.setMode("isochronic");
    window.engine.setPreset("daydream");
    window.engine.setMode("binaural");
  });
  const s = await settingsSent(page);
  expect(s.slice(-3)).toMatchObject([
    { beat: 10, mode: "isochronic" },
    { beat: 6, mode: "isochronic" },
    { beat: 6, mode: "binaural" },
  ]);
  expect(await page.evaluate(() => window.engine.currentState)).toBe("playing");
});

test("timer set, changed and cleared while playing", async ({ page }) => {
  const out = await page.evaluate(async () => {
    const e = window.engine;
    const times: (number | null)[] = [];
    e.on("time", (t) => times.push(t));
    await e.start();
    e.setTimer(600);
    e.setTimer(1200);
    e.setTimer(null);
    await new Promise((r) => setTimeout(r, 600));
    return {
      state: e.currentState,
      timers: window.sent.filter((m) => m.type === "timer").map((m) => (m as { seconds: number | null }).seconds),
      times,
      remaining: e.timeRemaining,
    };
  });
  expect(out.state).toBe("playing");
  expect(out.timers.slice(-3)).toEqual([600, 1200, null]);
  expect(out.times.slice(-1)[0]).toBeNull();
  expect(out.remaining).toBeNull();
});

test("a timer changed in real time ends on the new time, not the old", async ({ page }) => {
  const out = await page.evaluate(async () => {
    const e = window.engine;
    await e.start();
    const t0 = performance.now();
    e.setTimer(2);
    await new Promise((r) => setTimeout(r, 1000));
    e.setTimer(4);
    const stateAt3 = await new Promise<string>((r) => setTimeout(() => r(e.currentState), 2000));
    await new Promise<void>((resolve) => (e.currentState === "ended" ? resolve() : e.on("state", (s) => s === "ended" && resolve())));
    return { stateAt3, endedAfter: (performance.now() - t0) / 1000 };
  });
  expect(out.stateAt3).toBe("playing"); // the original 2 s timer would have ended by now
  expect(out.endedAfter).toBeGreaterThan(4.8);
  expect(out.endedAfter).toBeLessThan(7);
});

test("start() after a timer ended plays again", async ({ page }) => {
  const out = await page.evaluate(async () => {
    const e = window.engine;
    await e.start();
    e.setTimer(1);
    await new Promise<void>((resolve) => e.on("state", (s) => s === "ended" && resolve()));
    await e.start();
    return e.currentState;
  });
  expect(out).toBe("playing");
});

test.describe("cold iOS start", () => {
  test.use({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1" });

  test("the context is resumed and the media element played inside the gesture, before any await", async ({ page }) => {
    const out = await page.evaluate(async () => {
      const e = window.engine;
      window.inGesture = true;
      const p = e.start("deep-work");
      window.inGesture = false; // the click handler has returned: anything after this is outside the gesture
      await p;
      return { calls: window.calls, state: e.currentState };
    });
    expect(out.calls).toEqual(["resume:gesture", "play:gesture"]);
    expect(out.state).toBe("playing");
  });

  test("a refused media element still plays, straight to the speakers", async ({ page }) => {
    const out = await page.evaluate(async () => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("refused", "NotAllowedError"));
      const e = window.engine;
      await e.start("deep-work");
      const internals = e as unknown as { ctx: AudioContext; element: HTMLAudioElement | null };
      return { state: e.currentState, ctx: internals.ctx.state as string, element: internals.element };
    });
    expect(out).toEqual({ state: "playing", ctx: "running", element: null });
  });
});

// The tab was in the background past the timer's end: the page's interval never ran, and the context was suspended.
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";

async function returnToForeground(page: import("@playwright/test").Page, timerSeconds: number, waitMs: number) {
  return page.evaluate(
    async ([timer, wait]) => {
      window.setInterval = (() => 0) as unknown as typeof window.setInterval; // background: no ticker callbacks
      const e = new window.FocusEngine();
      const internals = e as unknown as { ctx: AudioContext; element: HTMLAudioElement | null };
      await e.start();
      e.setTimer(timer);
      await new Promise((r) => setTimeout(r, wait));
      await internals.ctx.suspend(); // the interruption
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      await new Promise((r) => setTimeout(r, 300));
      return {
        state: e.currentState,
        ctx: internals.ctx.state as string,
        elementPaused: internals.element ? internals.element.paused : null,
      };
    },
    [timerSeconds, waitMs] as const,
  );
}

test.describe("returning to the foreground", () => {
  test("after the timer expired: stays ended, context suspended (Web Audio route)", async ({ page }) => {
    const out = await returnToForeground(page, 0.3, 700);
    expect(out).toEqual({ state: "ended", ctx: "suspended", elementPaused: null });
  });

  test("before the timer expired: resumes and keeps playing (Web Audio route)", async ({ page }) => {
    const out = await returnToForeground(page, 600, 300);
    expect(out).toEqual({ state: "playing", ctx: "running", elementPaused: null });
  });

  test.describe("iOS media-element route", () => {
    test.use({ userAgent: IOS_UA });

    test("after the timer expired: stays ended, context suspended, element paused", async ({ page }) => {
      const out = await returnToForeground(page, 0.3, 700);
      expect(out).toEqual({ state: "ended", ctx: "suspended", elementPaused: true });
    });

    test("before the timer expired: resumes the context and the element", async ({ page }) => {
      const out = await returnToForeground(page, 600, 300);
      expect(out).toEqual({ state: "playing", ctx: "running", elementPaused: false });
    });
  });
});
