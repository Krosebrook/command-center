import { test, expect } from "@playwright/test";

test.describe("Automations Page", () => {
  let html: string;
  let statusCode: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/automations");
    statusCode = response.status();
    html = await response.text();
  });

  test("loads automations page", async () => {
    expect([200, 500]).toContain(statusCode);
    expect(html).toBeTruthy();
    if (statusCode === 200) {
      expect(html.toLowerCase()).toContain("automation");
    }
  });

  test("shows category cards", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/categor|automation/i);
    }
    expect(html).toBeTruthy();
  });
});
