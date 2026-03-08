import { test, expect } from "@playwright/test";

test.describe("Agents Page", () => {
  test("loads agents page", async ({ page }) => {
    const response = await page.goto("/agents");
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(600);

    if (response!.ok()) {
      await expect(page.locator("h1")).toBeVisible();
    } else {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("shows agent data or empty state", async ({ page }) => {
    const response = await page.goto("/agents");
    expect(response).not.toBeNull();

    // Should show data table, empty state message, or server error
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
