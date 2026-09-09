import { test, expect } from "@playwright/test";

/**
 * Signed-in checks. Skipped unless you provide a test account:
 *   TEST_EMAIL=you@example.com TEST_PASSWORD=... pnpm test:e2e
 *
 * Payment flows are intentionally NOT automated here — run those manually in
 * Stripe test mode with card 4242 4242 4242 4242 (any future expiry + CVC),
 * following the launch checklist.
 */
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.describe("Signed in", () => {
  test.skip(!EMAIL || !PASSWORD, "set TEST_EMAIL and TEST_PASSWORD to run signed-in tests");

  test("can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await page.getByRole("button", { name: /^sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
