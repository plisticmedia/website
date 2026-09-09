import { test, expect } from "@playwright/test";

test.describe("Feedback", () => {
  test("the feedback form has a rating, message, and send button", async ({ page }) => {
    await page.goto("/feedback");
    await expect(page.getByRole("radiogroup", { name: /rating/i })).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send feedback/i })).toBeVisible();
  });

  test("empty feedback is blocked (message is required)", async ({ page }) => {
    await page.goto("/feedback");
    await page.getByRole("button", { name: /send feedback/i }).click();
    // Browser validation keeps focus on the required field; no thank-you appears.
    await expect(page.getByText(/thank you/i)).toHaveCount(0);
  });

  // Actually submits — sends a real email + admin row. Off by default so the
  // suite doesn't spam the inbox. Enable with RUN_WRITE_TESTS=1.
  test("submitting feedback shows a thank-you", async ({ page }) => {
    test.skip(process.env.RUN_WRITE_TESTS !== "1", "set RUN_WRITE_TESTS=1 to send a real test note");
    await page.goto("/feedback");
    await page.locator('textarea[name="message"]').fill("Automated end-to-end test — please ignore.");
    await page.getByRole("button", { name: /send feedback/i }).click();
    await expect(page.getByText(/thank you/i)).toBeVisible();
  });
});
