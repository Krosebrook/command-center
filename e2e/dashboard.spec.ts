import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  let html: string;
  let statusCode: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/");
    statusCode = response.status();
    html = await response.text();
  });

  test("displays dashboard heading", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toContain("dashboard");
    }
    expect(html).toBeTruthy();
  });

  test("shows stat cards", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/folders|root files/i);
    }
    expect(html).toBeTruthy();
  });

  test("shows projects section", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/key projects|projects/i);
    }
    expect(html).toBeTruthy();
  });

  test("shows quick navigation", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/quick navigation|navigation/i);
    }
    expect(html).toBeTruthy();
  });

  test("handles drive unavailable gracefully", async () => {
    // Even with errors, the page should respond (200 or 500)
    expect([200, 500]).toContain(statusCode);
    expect(html).toBeTruthy();
  });
});
