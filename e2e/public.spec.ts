import { test, expect } from "@playwright/test";

test.describe("Public pages load", () => {
  test("homepage loads with the header and Plistic branding", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok(), "homepage should return a 2xx").toBeTruthy();
    await expect(page).toHaveTitle(/plistic/i);
    await expect(page.locator("header").first()).toBeVisible();
    // A primary call to action to book is always present.
    await expect(page.getByRole("link", { name: /book a call/i }).first()).toBeVisible();
  });

  test("pricing page loads and offers an estimate", async ({ page }) => {
    await page.goto("/pricing");
    // The estimator section heading — visible on desktop and mobile (the CTA
    // text itself is hidden on small screens).
    await expect(page.locator("#pricing-title")).toBeVisible();
  });

  test("List your business page shows the hero and the walkthrough button", async ({ page }) => {
    await page.goto("/list-your-business");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /watch how it works/i })).toHaveAttribute(
      "href",
      /\/list-your-business\/guide/,
    );
  });

  test("Listing guide page embeds the walkthrough video", async ({ page }) => {
    await page.goto("/list-your-business/guide");
    await expect(page.locator('iframe[src*="youtube"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /list your business/i }).first()).toBeVisible();
  });

  test("Feedback page shows the form", async ({ page }) => {
    await page.goto("/feedback");
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send feedback/i })).toBeVisible();
  });

  test("Unknown URL returns a not-found page", async ({ page }) => {
    const res = await page.goto("/this-page-definitely-does-not-exist-9f3");
    expect(res?.status()).toBe(404);
  });
});
