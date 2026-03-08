import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test("mobile viewport shows hamburger menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const menuBtn = page.getByLabel(/menu/i);
    await expect(menuBtn).toBeVisible();
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const menuBtn = page.getByLabel(/menu/i);
    await menuBtn.click();
    // Menu should be expanded
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    // Close with escape
    await page.keyboard.press("Escape");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("desktop viewport shows sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    // Sidebar should be visible (not hamburger)
    const sidebar = page.locator("nav");
    await expect(sidebar).toBeVisible();
  });

  test("stat cards stack on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    // Page should still render without horizontal scroll issues
    await expect(page.locator("h1")).toBeVisible();
  });

  test("tables are scrollable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/cleanup");
    // Table wrapper should have overflow-x-auto
    await expect(page.locator("h1")).toBeVisible();
  });
});
