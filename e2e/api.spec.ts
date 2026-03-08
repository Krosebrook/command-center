import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("health endpoint returns OK", async ({ request }) => {
    const resp = await request.get("/api/health");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty("timestamp");
  });

  test("scan endpoint returns data", async ({ request }) => {
    const resp = await request.get("/api/scan");
    expect(resp.status()).toBe(200);
  });

  test("stats endpoint returns data", async ({ request }) => {
    const resp = await request.get("/api/stats");
    expect(resp.status()).toBe(200);
  });

  test("setup scan endpoint returns data", async ({ request }) => {
    const resp = await request.get("/api/setup/scan");
    expect(resp.status()).toBe(200);
  });

  test("action endpoint rejects invalid body", async ({ request }) => {
    const resp = await request.post("/api/setup/action", {
      data: { invalid: true },
    });
    expect(resp.status()).toBe(400);
  });

  test("action endpoint rejects empty body", async ({ request }) => {
    const resp = await request.post("/api/setup/action", {
      data: {},
    });
    expect(resp.status()).toBe(400);
  });

  test("context endpoint rejects missing path", async ({ request }) => {
    const resp = await request.post("/api/context", {
      data: {},
    });
    expect(resp.status()).toBe(400);
  });

  test("suggestions endpoint accepts valid body", async ({ request }) => {
    const resp = await request.post("/api/setup/suggestions", {
      data: { results: [] },
    });
    expect(resp.status()).toBe(200);
  });

  test("context endpoint rejects path traversal", async ({ request }) => {
    const resp = await request.post("/api/context", {
      data: { projectPath: "../../../etc/passwd" },
    });
    // Should be 403 (security) or 400 (validation)
    expect([400, 403]).toContain(resp.status());
  });
});
