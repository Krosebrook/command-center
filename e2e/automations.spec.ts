import { test, expect } from "@playwright/test";

test.describe("Automations Page", () => {
  test("loads automations page", async ({ page }) => {
    await page.goto("/automations");
    await expect(page.locator("h1")).toContainText("Automation Library");
  });

  test("shows category cards", async ({ page }) => {
    await page.goto("/automations");
    await expect(page.getByText("categories")).toBeVisible();
  });
});
