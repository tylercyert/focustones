import { defineConfig, devices } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

// Ports can be overridden (FT_PREVIEW_PORT, FT_ENGINE_PORT) when parallel worktrees run the suite at once.
const preview = Number(process.env.FT_PREVIEW_PORT ?? 4391);
const engine = Number(process.env.FT_ENGINE_PORT ?? 5199);
const site = `http://localhost:${preview}`;
const desktop = { ...devices['Desktop Chrome'], baseURL: site };
// WebKit stands in for Safari: desktop Safari at 1280×800, and an iPhone (touch, mobile viewport) for iOS Safari.
const safari = { ...devices['Desktop Safari'], baseURL: site, viewport: { width: 1280, height: 800 } };
const iphone = { ...devices['iPhone 13'], baseURL: site };
const firefox = { ...devices['Desktop Firefox'], baseURL: site, viewport: { width: 1280, height: 800 } };
const engineSite = `http://localhost:${engine}`;

export default defineConfig({
  testDir: 'e2e',
  webServer: [
    { command: `npx vite preview --port ${preview} --strictPort`, url: site, reuseExistingServer: false },
    // The engine specs load their harness page (src/engine/e2e/harness.html) from the dev server.
    { command: `npx vite --port ${engine} --strictPort`, url: `${engineSite}/src/engine/e2e/harness.html`, reuseExistingServer: false },
  ],
  use: { baseURL: site },
  projects: [
    { name: 'chromium', use: desktop, testIgnore: /(windows|delights)\.spec/ },
    // The windows' journeys, in the real desktop, at both sizes of the evidence screenshots.
    { name: 'windows-1280', use: { ...desktop, viewport: { width: 1280, height: 800 } }, testMatch: /windows\.spec/ },
    { name: 'windows-375', use: { ...desktop, viewport: { width: 375, height: 812 } }, testMatch: /windows\.spec/ },
    // The desktop delights (issue #14): mouse and keyboard at 1280×800, touch at 375×812.
    { name: 'delights-1280', use: { ...desktop, viewport: { width: 1280, height: 800 } }, testMatch: /delights\.spec/ },
    { name: 'delights-375', use: { ...desktop, viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true }, testMatch: /delights\.spec/ },
    { name: 'webkit', use: safari },
    // The shell's desktop spec drives the pointer-and-menu layout; on a phone the windows and launch specs cover it.
    { name: 'webkit-iphone', use: iphone, testIgnore: /desktop\.spec/ },
    { name: 'firefox', use: firefox },
    {
      name: 'engine',
      testDir: 'src/engine/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: engineSite,
        launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
      },
    },
    { name: 'engine-webkit', testDir: 'src/engine/e2e', use: { ...devices['Desktop Safari'], baseURL: engineSite } },
    { name: 'engine-firefox', testDir: 'src/engine/e2e', use: { ...devices['Desktop Firefox'], baseURL: engineSite, launchOptions: { firefoxUserPrefs: { 'media.autoplay.default': 0 } } } },
  ],
});
