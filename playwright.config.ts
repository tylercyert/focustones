import { defineConfig, devices } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

// Ports can be overridden (FT_PREVIEW_PORT, FT_HARNESS_PORT) when parallel worktrees run the suite at once.
const preview = Number(process.env.FT_PREVIEW_PORT ?? 4391);
const harness = Number(process.env.FT_HARNESS_PORT ?? 4392);

export default defineConfig({
  testDir: 'e2e',
  webServer: [
    { command: `npx vite preview --port ${preview}`, url: `http://localhost:${preview}`, reuseExistingServer: false },
    // The windows' dev harness (harness.html) until the shell registers them on the real desktop.
    { command: `npx vite --port ${harness} --strictPort`, url: `http://localhost:${harness}/harness.html`, reuseExistingServer: false },
  ],
  use: { baseURL: `http://localhost:${preview}` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /windows\.spec/ },
    { name: 'windows-1280', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${harness}`, viewport: { width: 1280, height: 800 } }, testMatch: /windows\.spec/ },
    { name: 'windows-375', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${harness}`, viewport: { width: 375, height: 812 } }, testMatch: /windows\.spec/ },
  ],
});
