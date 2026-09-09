import { test as setup } from "@playwright/test";
import fs from "node:fs";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "plisticbeta";
const STATE_PATH = "e2e/.auth/state.json";

/**
 * Enter the directory beta password once and save the session, so the gated
 * tests (directory / compare) don't each have to do it. Tolerant of the site
 * being fully public (no password screen) — it just saves whatever state it has.
 */
setup("enter beta password", async ({ page }) => {
  await page.goto("/directory-access?next=/directory");
  const pw = page.locator('input[name="password"]');
  if (await pw.count()) {
    await pw.fill(BETA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/directory(\?|$|\/)/, { timeout: 15_000 }).catch(() => {});
  }
  fs.mkdirSync("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: STATE_PATH });
});
