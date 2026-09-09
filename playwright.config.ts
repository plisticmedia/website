import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the Plistic site. These run against a REAL running site
 * (live or a Vercel preview) — set BASE_URL to point them.
 *
 *   BASE_URL=https://www.plisticmedia.com pnpm test:e2e
 *   BASE_URL=https://<your-preview>.vercel.app pnpm test:e2e
 *
 * Optional env:
 *   BETA_PASSWORD   the directory beta password (default: plisticbeta)
 *   RUN_WRITE_TESTS =1 to run tests that submit real data (feedback email etc.)
 *   TEST_EMAIL / TEST_PASSWORD  a test account, to enable the signed-in tests
 *
 * The browser is the one already installed in CI/dev; locally run
 * `npx playwright install chromium` once if prompted.
 */
const BASE_URL = process.env.BASE_URL || "https://www.plisticmedia.com";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Signs in past the beta password once and saves the session for gated tests.
    { name: "setup", testMatch: /global\.setup\.ts/ },

    // Public pages — no beta password needed.
    {
      name: "public",
      testMatch: /(public|signup|feedback|authenticated)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // The directory + compare sit behind the beta password.
    {
      name: "directory",
      testMatch: /directory\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/state.json" },
      dependencies: ["setup"],
    },

    // A quick responsive smoke of the public pages on a phone.
    {
      name: "mobile",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],
});
