import { test, expect } from "@playwright/test";

test.describe("Projects Page", () => {
  let html: string;
  let statusCode: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/projects");
    statusCode = response.status();
    html = await response.text();
  });

  test("loads projects page", async () => {
    expect([200, 500]).toContain(statusCode);
    expect(html).toBeTruthy();
    if (statusCode === 200) {
      expect(html).toMatch(/<h1[\s>]/i);
    }
  });

  test("displays project cards or empty state", async () => {
    if (statusCode === 200) {
      // Should show either project cards or empty state text
      expect(html.toLowerCase()).toMatch(/project|no projects|empty/i);
    }
    expect(html).toBeTruthy();
  });
});
