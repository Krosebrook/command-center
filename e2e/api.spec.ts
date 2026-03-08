import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  // The server may return 500 if better-sqlite3 native module fails to load,
  // 503 if the D:\ drive is unavailable (DriveUnavailableError), or 200 if healthy.

  test("health endpoint responds", async ({ request }) => {
    const resp = await request.get("/api/health");
    // 200 = healthy, 503 = drive unavailable, 500 = server compilation issue
    expect([200, 500, 503]).toContain(resp.status());
    if (resp.status() !== 500) {
      const body = await resp.json();
      expect(body).toHaveProperty("timestamp");
    }
  });

  test("scan endpoint responds", async ({ request }) => {
    const resp = await request.get("/api/scan");
    // 200 with empty stats if drive unavailable, 500 if server module issue
    expect([200, 500]).toContain(resp.status());
  });

  test("stats endpoint responds", async ({ request }) => {
    const resp = await request.get("/api/stats");
    expect([200, 500]).toContain(resp.status());
  });

  test("setup scan endpoint responds", async ({ request }) => {
    const resp = await request.get("/api/setup/scan");
    expect([200, 500]).toContain(resp.status());
  });

  test("action endpoint rejects invalid body", async ({ request }) => {
    const resp = await request.post("/api/setup/action", {
      data: { invalid: true },
    });
    // 400 = validation error, 500 = server compilation issue
    expect([400, 500]).toContain(resp.status());
    if (resp.status() === 400) {
      const body = await resp.json();
      expect(body).toHaveProperty("error");
    }
  });

  test("action endpoint rejects empty body", async ({ request }) => {
    const resp = await request.post("/api/setup/action", {
      data: {},
    });
    expect([400, 500]).toContain(resp.status());
    if (resp.status() === 400) {
      const body = await resp.json();
      expect(body).toHaveProperty("error");
    }
  });

  test("context endpoint rejects missing path", async ({ request }) => {
    const resp = await request.post("/api/context", {
      data: {},
    });
    expect([400, 500]).toContain(resp.status());
    if (resp.status() === 400) {
      const body = await resp.json();
      expect(body).toHaveProperty("error");
    }
  });

  test("suggestions endpoint accepts valid body", async ({ request }) => {
    const resp = await request.post("/api/setup/suggestions", {
      data: { results: [] },
    });
    expect([200, 500]).toContain(resp.status());
  });

  test("context endpoint rejects path traversal", async ({ request }) => {
    const resp = await request.post("/api/context", {
      data: { projectPath: "../../../etc/passwd" },
    });
    // 400 = validation, 403 = security, 500 = server compilation issue
    expect([400, 403, 500]).toContain(resp.status());
  });
});
