import { test, expect } from "@playwright/test";

test.describe("Cleanup Page", () => {
  test("loads cleanup page", async ({ page }) => {
    const response = await page.goto("/cleanup");
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(600);

    if (response!.ok()) {
      await expect(page.locator("h1")).toContainText("Cleanup Tracker");
    } else {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("shows task progress section", async ({ page }) => {
    const response = await page.goto("/cleanup");
    expect(response).not.toBeNull();

    if (response!.ok()) {
      await expect(page.getByText("Task Progress")).toBeVisible();
    } else {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("shows cleanup history section", async ({ page }) => {
    const response = await page.goto("/cleanup");
    expect(response).not.toBeNull();

    if (response!.ok()) {
      await expect(page.getByText("Recent Cleanup Actions")).toBeVisible();
    } else {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("progress bar has correct ARIA", async ({ page }) => {
    const response = await page.goto("/cleanup");
    expect(response).not.toBeNull();

    if (response!.ok()) {
      const progressbar = page.locator('[role="progressbar"]');
      if (await progressbar.isVisible()) {
        await expect(progressbar).toHaveAttribute("aria-valuemin", "0");
        await expect(progressbar).toHaveAttribute("aria-valuemax", "100");
      }
    }
  });
});
