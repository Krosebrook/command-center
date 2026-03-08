import { describe, it, expect } from "vitest";
import { formatBytes, basename, formatDate, timeAgo, cn } from "../utils";

describe("formatBytes", () => {
  it("returns '0 B' for 0", () => expect(formatBytes(0)).toBe("0 B"));
  it("returns '0 B' for negative", () => expect(formatBytes(-1)).toBe("0 B"));
  it("returns '0 B' for NaN", () => expect(formatBytes(NaN)).toBe("0 B"));
  it("returns '0 B' for Infinity", () => expect(formatBytes(Infinity)).toBe("0 B"));
  it("formats bytes", () => expect(formatBytes(500)).toBe("500 B"));
  it("formats KB", () => expect(formatBytes(1024)).toBe("1 KB"));
  it("formats MB", () => expect(formatBytes(1024 * 1024)).toBe("1 MB"));
  it("formats GB", () => expect(formatBytes(1024 ** 3)).toBe("1 GB"));
  it("formats TB", () => expect(formatBytes(1024 ** 4)).toBe("1 TB"));
  it("formats PB", () => expect(formatBytes(1024 ** 5)).toBe("1 PB"));
  it("clamps beyond PB", () => expect(formatBytes(1024 ** 6)).toContain("PB"));
  it("formats decimal values", () => expect(formatBytes(1536)).toBe("1.5 KB"));
});

describe("basename", () => {
  it("handles Unix paths", () => expect(basename("/foo/bar/baz.txt")).toBe("baz.txt"));
  it("handles Windows paths", () => expect(basename("D:\\foo\\bar")).toBe("bar"));
  it("handles mixed paths", () => expect(basename("D:\\foo/bar")).toBe("bar"));
  it("handles single segment", () => expect(basename("file.txt")).toBe("file.txt"));
  it("handles trailing slash", () => expect(basename("/foo/bar/")).toBe("bar"));
  it("handles empty string", () => expect(basename("")).toBe(""));
});

describe("formatDate", () => {
  it("formats Date object", () => {
    const result = formatDate(new Date("2025-06-15"));
    expect(result).toContain("2025");
  });
  it("formats ISO string", () => {
    const result = formatDate("2025-06-15T12:00:00Z");
    expect(result).toContain("2025");
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for recent", () => {
    expect(timeAgo(new Date())).toBe("just now");
  });
  it("returns minutes ago", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(d)).toBe("5m ago");
  });
  it("returns hours ago", () => {
    const d = new Date(Date.now() - 3 * 3600 * 1000);
    expect(timeAgo(d)).toBe("3h ago");
  });
  it("returns days ago", () => {
    const d = new Date(Date.now() - 2 * 86400 * 1000);
    expect(timeAgo(d)).toBe("2d ago");
  });
  it("handles string input", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });
});

describe("cn", () => {
  it("merges classes", () => expect(cn("foo", "bar")).toBe("foo bar"));
  it("handles conditionals", () => expect(cn("foo", false && "bar")).toBe("foo"));
  it("merges tailwind conflicts", () => expect(cn("p-4", "p-2")).toBe("p-2"));
});
