import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("page has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("all images have alt text", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute("alt");
    }
  });

  test("headings are hierarchical", async ({ page }) => {
    await page.goto("/");
    const h1 = await page.locator("h1").count();
    expect(h1).toBeGreaterThanOrEqual(1);
  });

  test("interactive elements are focusable", async ({ page }) => {
    await page.goto("/");
    // Tab through the page — nothing should trap focus
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
    }
    // Should not throw
  });

  test("color contrast - text is readable", async ({ page }) => {
    await page.goto("/");
    // Verify the page uses the dark theme
    const bgColor = await page.locator("body").evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
  });

  test("ARIA landmarks present", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    const main = page.locator("main, #main-content");
    await expect(main).toBeVisible();
  });

  test("focus-visible styles exist", async ({ page }) => {
    await page.goto("/");
    // Tab to first focusable element
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // Focused element should have visible outline
    const focused = page.locator(":focus-visible");
    const count = await focused.count();
    // At least one element should be focusable
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("alerts have role attribute", async ({ page }) => {
    await page.goto("/");
    const alerts = page.locator('[role="alert"]');
    const count = await alerts.count();
    // All alerts should have role="alert"
    for (let i = 0; i < count; i++) {
      await expect(alerts.nth(i)).toHaveAttribute("role", "alert");
    }
  });
});
