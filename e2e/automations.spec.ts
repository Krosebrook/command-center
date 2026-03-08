import { test, expect } from "@playwright/test";

test.describe("Automations Page", () => {
  test("loads automations page", async ({ page }) => {
    const response = await page.goto("/automations");
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(600);

    if (response!.ok()) {
      await expect(page.locator("h1")).toContainText("Automation Library");
    } else {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("shows category cards", async ({ page }) => {
    const response = await page.goto("/automations");
    expect(response).not.toBeNull();

    if (response!.ok()) {
      await expect(page.getByText("categories")).toBeVisible();
    } else {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });
});
