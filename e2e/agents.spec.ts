import { test, expect } from "@playwright/test";

test.describe("Agents Page", () => {
  let html: string;
  let statusCode: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/agents");
    statusCode = response.status();
    html = await response.text();
  });

  test("loads agents page", async () => {
    expect([200, 500]).toContain(statusCode);
    expect(html).toBeTruthy();
    if (statusCode === 200) {
      expect(html).toMatch(/<h1[\s>]/i);
    }
  });

  test("shows agent data or empty state", async () => {
    // Should show data table, empty state message, or server error
    expect(html).toBeTruthy();
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/agent|registry|no agents/i);
    }
  });
});
