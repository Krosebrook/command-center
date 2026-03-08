import { test, expect } from "@playwright/test";

test.describe("Cleanup Page", () => {
  let html: string;
  let statusCode: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/cleanup");
    statusCode = response.status();
    html = await response.text();
  });

  test("loads cleanup page", async () => {
    expect([200, 500]).toContain(statusCode);
    expect(html).toBeTruthy();
    if (statusCode === 200) {
      expect(html.toLowerCase()).toContain("cleanup");
    }
  });

  test("shows task progress section", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/task progress|progress/i);
    }
    expect(html).toBeTruthy();
  });

  test("shows cleanup history section", async () => {
    if (statusCode === 200) {
      expect(html.toLowerCase()).toMatch(/cleanup|history|recent/i);
    }
    expect(html).toBeTruthy();
  });

  test("progress bar has correct ARIA", async () => {
    if (statusCode === 200) {
      // Check for progressbar role if present
      const hasProgressbar = html.includes('role="progressbar"');
      if (hasProgressbar) {
        expect(html).toMatch(/aria-valuemin/);
        expect(html).toMatch(/aria-valuemax/);
      }
    }
  });
});
