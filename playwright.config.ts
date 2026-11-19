import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/engine/e2e",
  use: { baseURL: "http://localhost:5199", browserName: "chromium", launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] } },
  webServer: { command: "npx vite --port 5199 --strictPort", url: "http://localhost:5199/src/engine/e2e/harness.html", reuseExistingServer: false },
});
