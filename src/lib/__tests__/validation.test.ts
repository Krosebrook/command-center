import { describe, it, expect } from "vitest";
import {
  ActionRequestSchema,
  ContextRequestSchema,
  SuggestionsRequestSchema,
  UpdateRequestSchema,
} from "../validation";

describe("ActionRequestSchema", () => {
  it("accepts valid move action", () => {
    const result = ActionRequestSchema.safeParse({
      action: "move",
      source: "/foo",
      destination: "/bar",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid delete action without destination", () => {
    const result = ActionRequestSchema.safeParse({
      action: "delete",
      source: "/foo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts create-index action", () => {
    const result = ActionRequestSchema.safeParse({
      action: "create-index",
      source: "/foo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts create-file action", () => {
    const result = ActionRequestSchema.safeParse({
      action: "create-file",
      source: "/foo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts archive action", () => {
    const result = ActionRequestSchema.safeParse({
      action: "archive",
      source: "/foo",
      destination: "/bar",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = ActionRequestSchema.safeParse({
      action: "invalid",
      source: "/foo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty source", () => {
    const result = ActionRequestSchema.safeParse({ action: "move", source: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing action", () => {
    const result = ActionRequestSchema.safeParse({ source: "/foo" });
    expect(result.success).toBe(false);
  });

  it("rejects missing source", () => {
    const result = ActionRequestSchema.safeParse({ action: "move" });
    expect(result.success).toBe(false);
  });
});

describe("ContextRequestSchema", () => {
  it("accepts valid request", () => {
    const result = ContextRequestSchema.safeParse({ projectPath: "/foo" });
    expect(result.success).toBe(true);
  });

  it("accepts with optional name", () => {
    const result = ContextRequestSchema.safeParse({
      projectPath: "/foo",
      projectName: "Test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty path", () => {
    const result = ContextRequestSchema.safeParse({ projectPath: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing projectPath", () => {
    const result = ContextRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("SuggestionsRequestSchema", () => {
  it("accepts valid results array", () => {
    const result = SuggestionsRequestSchema.safeParse({
      results: [
        { type: "stale", path: "/foo", severity: "warning", details: "old" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid issue types", () => {
    const types = [
      "missing-index",
      "orphaned",
      "stale",
      "unsorted",
      "large-file",
      "empty-dir",
      "missing-governance",
    ];
    for (const type of types) {
      const result = SuggestionsRequestSchema.safeParse({
        results: [{ type, path: "/foo", severity: "info", details: "x" }],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid type", () => {
    const result = SuggestionsRequestSchema.safeParse({
      results: [
        { type: "invalid", path: "/foo", severity: "warning", details: "x" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty array", () => {
    const result = SuggestionsRequestSchema.safeParse({ results: [] });
    expect(result.success).toBe(true);
  });

  it("accepts optional size and lastModified", () => {
    const result = SuggestionsRequestSchema.safeParse({
      results: [
        {
          type: "large-file",
          path: "/foo",
          severity: "action",
          details: "big",
          size: 1000,
          lastModified: "2025-01-01T00:00:00Z",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity", () => {
    const result = SuggestionsRequestSchema.safeParse({
      results: [
        { type: "stale", path: "/foo", severity: "critical", details: "x" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateRequestSchema", () => {
  it("accepts with actions", () => {
    const result = UpdateRequestSchema.safeParse({
      actions: [{ action: "move", source: "/a" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts without actions", () => {
    const result = UpdateRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts actions with optional fields", () => {
    const result = UpdateRequestSchema.safeParse({
      actions: [
        {
          action: "move",
          source: "/a",
          destination: "/b",
          title: "Move file",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty actions array", () => {
    const result = UpdateRequestSchema.safeParse({ actions: [] });
    expect(result.success).toBe(true);
  });
});
