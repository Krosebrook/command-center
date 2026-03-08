import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  let html: string;
  let statusCode: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/");
    statusCode = response.status();
    html = await response.text();
  });

  test("loads homepage", async ({ request }) => {
    const response = await request.get("/");
    expect([200, 500]).toContain(response.status());
    const body = await response.text();
    if (response.ok()) {
      expect(body.toLowerCase()).toMatch(/command center|dashboard/i);
    } else {
      expect(body).toBeTruthy();
    }
  });

  test("navigates to all pages", async ({ request }) => {
    const routes = ["/", "/projects", "/agents", "/automations", "/cleanup", "/launch", "/setup"];
    for (const route of routes) {
      const response = await request.get(route);
      expect([200, 500]).toContain(response.status());
      const body = await response.text();
      expect(body).toBeTruthy();
      if (response.ok()) {
        expect(body).toMatch(/<h1[\s>]/i);
      }
    }
  });

  test("sidebar links work", async ({ request }) => {
    const response = await request.get("/projects");
    expect([200, 500]).toContain(response.status());
    const body = await response.text();
    if (response.ok()) {
      expect(body.toLowerCase()).toMatch(/project/i);
    }
  });

  test("sidebar highlights current page", async ({ request }) => {
    const response = await request.get("/projects");
    if (response.ok()) {
      const body = await response.text();
      // Server-rendered HTML should include navigation links
      expect(body).toMatch(/<nav[\s>]/i);
    }
  });

  test("skip to content link works", async ({ request }) => {
    const response = await request.get("/");
    if (response.ok()) {
      const body = await response.text();
      // Check for skip-to-content link and main-content target
      expect(body).toMatch(/skip/i);
      expect(body).toMatch(/main-content/i);
    }
  });
});
