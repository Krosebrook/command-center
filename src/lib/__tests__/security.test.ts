import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

// Mock config before importing security -- use a path that works on Linux test env
const TEST_DRIVE_ROOT = "/test-drive";

vi.mock("../config", () => ({
  DRIVE_ROOT: "/test-drive",
}));

import { isUnderDriveRoot, assertUnderDriveRoot, checkRateLimit } from "../security";

describe("isUnderDriveRoot", () => {
  it("allows paths under root", () => {
    expect(isUnderDriveRoot("/test-drive/foo/bar")).toBe(true);
  });
  it("allows root itself with subdir", () => {
    expect(isUnderDriveRoot("/test-drive/file.txt")).toBe(true);
  });
  it("rejects paths outside root", () => {
    expect(isUnderDriveRoot("/etc/passwd")).toBe(false);
  });
  it("rejects traversal attempts", () => {
    expect(isUnderDriveRoot("/test-drive/../etc/passwd")).toBe(false);
  });
  it("rejects similarly named directories", () => {
    // "/test-drive-extra" should not match "/test-drive"
    expect(isUnderDriveRoot("/test-drive-extra/foo")).toBe(false);
  });
});

describe("assertUnderDriveRoot", () => {
  it("does not throw for valid paths", () => {
    expect(() => assertUnderDriveRoot("/test-drive/foo")).not.toThrow();
  });
  it("throws SecurityError for invalid paths", () => {
    expect(() => assertUnderDriveRoot("/etc/passwd")).toThrow();
  });
  it("includes label in error", () => {
    expect(() => assertUnderDriveRoot("/etc/passwd", "source")).toThrow(/source/);
  });
  it("uses default label", () => {
    expect(() => assertUnderDriveRoot("/etc/passwd")).toThrow(/path/);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Use unique keys per test to avoid cross-test contamination
  });

  it("allows requests within limit", () => {
    const key = `test-${Date.now()}-allow`;
    expect(checkRateLimit(key, 5, 60000)).toBe(true);
    expect(checkRateLimit(key, 5, 60000)).toBe(true);
  });

  it("blocks after limit exceeded", () => {
    const key = `test-${Date.now()}-block`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60000);
    expect(checkRateLimit(key, 3, 60000)).toBe(false);
  });

  it("uses first call to set entry", () => {
    const key = `test-${Date.now()}-first`;
    const result = checkRateLimit(key, 1, 60000);
    expect(result).toBe(true);
    // Second call exceeds limit of 1
    expect(checkRateLimit(key, 1, 60000)).toBe(false);
  });

  it("resets after window expires", async () => {
    const key = `test-${Date.now()}-reset`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 1); // 1ms window
    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(checkRateLimit(key, 3, 1)).toBe(true);
  });
});
