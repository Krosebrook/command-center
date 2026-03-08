import { describe, it, expect, vi } from "vitest";

// Mock logger to suppress output during tests
vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { withErrorHandling, jsonSuccess } from "../api-utils";
import { ValidationError } from "../errors";

describe("jsonSuccess", () => {
  it("creates JSON response with data", async () => {
    const resp = jsonSuccess({ message: "ok" });
    const body = await resp.json();
    expect(body.message).toBe("ok");
    expect(resp.status).toBe(200);
  });

  it("supports custom status", async () => {
    const resp = jsonSuccess({ created: true }, 201);
    expect(resp.status).toBe(201);
    const body = await resp.json();
    expect(body.created).toBe(true);
  });

  it("handles array data", async () => {
    const resp = jsonSuccess([1, 2, 3]);
    const body = await resp.json();
    expect(body).toEqual([1, 2, 3]);
  });
});

describe("withErrorHandling", () => {
  it("passes through successful responses", async () => {
    const handler = withErrorHandling(async () => jsonSuccess({ ok: true }));
    const req = new Request("http://localhost/api/test");
    const resp = await handler(req);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
  });

  it("catches AppError and returns correct status", async () => {
    const handler = withErrorHandling(async () => {
      throw new ValidationError("bad input");
    });
    const req = new Request("http://localhost/api/test");
    const resp = await handler(req);
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.error).toBe("bad input");
  });

  it("catches generic errors and returns 500", async () => {
    const handler = withErrorHandling(async () => {
      throw new Error("oops");
    });
    const req = new Request("http://localhost/api/test");
    const resp = await handler(req);
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.code).toBe("INTERNAL_ERROR");
    // Should not leak the internal error message
    expect(body.error).not.toContain("oops");
  });

  it("handles non-Error thrown values", async () => {
    const handler = withErrorHandling(async () => {
      throw "string error";
    });
    const req = new Request("http://localhost/api/test");
    const resp = await handler(req);
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });
});
