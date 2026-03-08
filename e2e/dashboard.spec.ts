import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("displays dashboard heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("shows stat cards", async ({ page }) => {
    await page.goto("/");
    // Should show stat cards for Folders, Root Files, Scanned, Attention
    await expect(page.getByText("Folders")).toBeVisible();
    await expect(page.getByText("Root Files")).toBeVisible();
  });

  test("shows projects section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Key Projects")).toBeVisible();
  });

  test("shows quick navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Quick Navigation")).toBeVisible();
  });

  test("handles drive unavailable gracefully", async ({ page }) => {
    // Even without D: drive, the page should load without errors
    await page.goto("/");
    // Page should not show error boundary
    await expect(page.locator("h1")).toBeVisible();
  });
});
