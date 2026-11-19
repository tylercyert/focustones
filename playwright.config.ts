import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: [
    { command: 'npx vite preview --port 4391', url: 'http://localhost:4391', reuseExistingServer: false },
    // The engine specs load their harness page (src/engine/e2e/harness.html) from the dev server.
    { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199/src/engine/e2e/harness.html', reuseExistingServer: false },
  ],
  use: { baseURL: 'http://localhost:4391' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'engine',
      testDir: 'src/engine/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5199',
        launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
      },
    },
  ],
});
