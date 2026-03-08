import { test, expect } from "@playwright/test";

test.describe("Cleanup Page", () => {
  test("loads cleanup page", async ({ page }) => {
    await page.goto("/cleanup");
    await expect(page.locator("h1")).toContainText("Cleanup Tracker");
  });

  test("shows task progress section", async ({ page }) => {
    await page.goto("/cleanup");
    await expect(page.getByText("Task Progress")).toBeVisible();
  });

  test("shows cleanup history section", async ({ page }) => {
    await page.goto("/cleanup");
    await expect(page.getByText("Recent Cleanup Actions")).toBeVisible();
  });

  test("progress bar has correct ARIA", async ({ page }) => {
    await page.goto("/cleanup");
    const progressbar = page.locator('[role="progressbar"]');
    if (await progressbar.isVisible()) {
      await expect(progressbar).toHaveAttribute("aria-valuemin", "0");
      await expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    }
  });
});
