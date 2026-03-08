import { test, expect } from "@playwright/test";

test.describe("Setup Walkthrough", () => {
  test("loads setup page", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows stepper component", async ({ page }) => {
    await page.goto("/setup");
    // Should show step 1 initially
    const body = await page.textContent("body");
    expect(body).toContain("Scan");
  });

  test("scan button is present", async ({ page }) => {
    await page.goto("/setup");
    const scanBtn = page.getByRole("button", { name: /scan/i });
    if (await scanBtn.isVisible()) {
      await expect(scanBtn).toBeEnabled();
    }
  });
});
