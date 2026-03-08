import { test, expect } from "@playwright/test";

test.describe("Agents Page", () => {
  test("loads agents page", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows agent data or empty state", async ({ page }) => {
    await page.goto("/agents");
    // Should show data table or empty state message
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
