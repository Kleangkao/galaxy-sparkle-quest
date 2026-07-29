import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /mobile-release\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "desktop-firefox-smoke",
      testMatch: /browser-compat\.spec\.ts/,
      use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 720 } },
    },
    {
      name: "desktop-webkit-smoke",
      testMatch: /browser-compat\.spec\.ts/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 720 } },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile-release\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-webkit",
      testMatch: /mobile-release\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
