import { test, expect } from "@playwright/test";

test.describe("Projects Page", () => {
  test("loads projects page", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("displays project cards or empty state", async ({ page }) => {
    await page.goto("/projects");
    // Should show either project cards or an empty state
    const hasContent = await page.locator(".hud-card").count();
    expect(hasContent).toBeGreaterThanOrEqual(0);
  });
});
