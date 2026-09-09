import { test, expect } from "@playwright/test";

// Each listing card links to /directory/<slug> — a stable way to count results.
const CARD = 'a[href^="/directory/"]';

async function searchCount(page: import("@playwright/test").Page, term: string): Promise<number> {
  await page.goto(`/directory?q=${encodeURIComponent(term)}`);
  await page.waitForLoadState("networkidle");
  return page.locator(CARD).count();
}

test.describe("Directory & search", () => {
  test("the directory loads with a search box", async ({ page }) => {
    await page.goto("/directory");
    await expect(page.locator('input[name="q"]')).toBeVisible();
  });

  test('"podcasting" finds results whenever "podcast" does (the search fix)', async ({ page }) => {
    const podcast = await searchCount(page, "podcast");
    const podcasting = await searchCount(page, "podcasting");
    // The regression we fixed: the longer word must not come back empty when the
    // shorter one has results.
    if (podcast > 0) expect(podcasting, '"podcasting" should return results too').toBeGreaterThan(0);
  });

  test("compare page loads", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("opening a listing shows a detail page", async ({ page }) => {
    await page.goto("/directory");
    const first = page.locator(CARD).first();
    test.skip((await first.count()) === 0, "no published listings to open");
    await first.click();
    await expect(page).toHaveURL(/\/directory\/[^/]+$/);
    await expect(page.getByRole("link", { name: /back to directory/i })).toBeVisible();
  });
});
