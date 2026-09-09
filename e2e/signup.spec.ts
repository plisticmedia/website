import { test, expect } from "@playwright/test";

test.describe("Sign-up funnel", () => {
  test("List your business gates on creating an account first", async ({ page }) => {
    await page.goto("/list-your-business");
    // Logged-out visitors see the account gate, not the listing form.
    await expect(page.getByText(/create your free business account/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /create a free account/i })).toHaveAttribute(
      "href",
      /\/login/,
    );
  });

  test("Login page renders in business sign-up mode", async ({ page }) => {
    await page.goto("/login?as=business&signup=1&next=/list-your-business");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });
});
