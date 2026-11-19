import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npx vite preview --port 4391', url: 'http://localhost:4391', reuseExistingServer: false },
  use: { baseURL: 'http://localhost:4391' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
