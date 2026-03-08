import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("loads homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Command Center/i);
  });

  test("navigates to all pages", async ({ page }) => {
    const routes = ["/", "/projects", "/agents", "/automations", "/cleanup", "/launch", "/setup"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("sidebar links work", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL(/projects/);
    await expect(page.locator("h1")).toContainText(/project/i);
  });

  test("sidebar highlights current page", async ({ page }) => {
    await page.goto("/projects");
    const activeLink = page.locator('a[aria-current="page"]');
    await expect(activeLink).toBeVisible();
  });

  test("skip to content link works", async ({ page }) => {
    await page.goto("/");
    // Tab to skip-to-content link
    await page.keyboard.press("Tab");
    const skipLink = page.locator("text=Skip to content");
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator("#main-content")).toBeFocused();
    }
  });
});
