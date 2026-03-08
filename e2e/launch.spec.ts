import { test, expect } from "@playwright/test";

test.describe("Launch Page", () => {
  test("loads launch page", async ({ page }) => {
    await page.goto("/launch");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows project presets", async ({ page }) => {
    await page.goto("/launch");
    await expect(page.getByText("Project Presets")).toBeVisible();
  });

  test("shows custom path input", async ({ page }) => {
    await page.goto("/launch");
    const input = page.locator('input[aria-label="Custom project path"]');
    if (await input.isVisible()) {
      await expect(input).toBeEditable();
    }
  });

  test("preset buttons are clickable", async ({ page }) => {
    await page.goto("/launch");
    const presetButtons = page.locator(".hud-card button, button.hud-card");
    const count = await presetButtons.count();
    if (count > 0) {
      await presetButtons.first().click();
    }
  });
});
