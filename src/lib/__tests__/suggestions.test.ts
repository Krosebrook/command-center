import { describe, it, expect } from "vitest";
import { generateSuggestions } from "../suggestions";
import type { ScanResult } from "../types";

describe("generateSuggestions", () => {
  it("returns empty for empty input", () => {
    expect(generateSuggestions([])).toEqual([]);
  });

  it("generates move suggestion for unsorted .pdf", () => {
    const results: ScanResult[] = [
      {
        type: "unsorted",
        path: "D:\\07_Downloads\\report.pdf",
        severity: "warning",
        details: "Unsorted file in downloads",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("move");
    expect(suggestions[0].title).toContain("report.pdf");
    expect(suggestions[0].confidence).toBe("high");
  });

  it("generates create-index for missing-index", () => {
    const results: ScanResult[] = [
      {
        type: "missing-index",
        path: "D:\\02_Development",
        severity: "info",
        details: "Missing _INDEX.md",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("create-index");
    expect(suggestions[0].confidence).toBe("high");
  });

  it("generates archive for stale projects", () => {
    const results: ScanResult[] = [
      {
        type: "stale",
        path: "D:\\01_Homebase\\03_Projects\\Projects\\Active\\old-project",
        severity: "warning",
        details: "Not modified in 45 days",
        lastModified: "2024-01-01T00:00:00Z",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("archive");
    expect(suggestions[0].confidence).toBe("medium");
  });

  it("generates delete for empty dirs", () => {
    const results: ScanResult[] = [
      {
        type: "empty-dir",
        path: "D:\\02_Development\\empty",
        severity: "info",
        details: "Empty directory",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("delete");
    expect(suggestions[0].confidence).toBe("low");
  });

  it("sorts by confidence then action", () => {
    const results: ScanResult[] = [
      { type: "empty-dir", path: "D:\\empty", severity: "info", details: "Empty" },
      {
        type: "missing-index",
        path: "D:\\02_Development",
        severity: "info",
        details: "Missing",
      },
    ];
    const suggestions = generateSuggestions(results);
    // missing-index = high confidence, empty-dir = low confidence
    expect(suggestions[0].confidence).toBe("high");
    expect(suggestions[1].confidence).toBe("low");
  });

  it("handles orphaned items", () => {
    const results: ScanResult[] = [
      {
        type: "orphaned",
        path: "D:\\random-folder",
        severity: "warning",
        details: "Not in numbered folder",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("move");
    expect(suggestions[0].title).toContain("random-folder");
    expect(suggestions[0].confidence).toBe("low");
  });

  it("handles large files", () => {
    const results: ScanResult[] = [
      {
        type: "large-file",
        path: "D:\\02_Development\\huge.zip",
        severity: "action",
        details: "100MB file",
        size: 100 * 1024 * 1024,
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("move");
    expect(suggestions[0].confidence).toBe("low");
  });

  it("handles missing governance", () => {
    const results: ScanResult[] = [
      {
        type: "missing-governance",
        path: "D:\\00_Core\\TODO.md",
        severity: "action",
        details: "Required file missing",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].action).toBe("create-file");
    expect(suggestions[0].confidence).toBe("medium");
  });

  it("generates unique IDs", () => {
    const results: ScanResult[] = [
      { type: "empty-dir", path: "D:\\a", severity: "info", details: "1" },
      { type: "empty-dir", path: "D:\\b", severity: "info", details: "2" },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions[0].id).not.toBe(suggestions[1].id);
  });

  it("handles unsorted directory with -main suffix", () => {
    const results: ScanResult[] = [
      {
        type: "unsorted",
        path: "D:\\07_Downloads\\my-project-main",
        severity: "warning",
        details: "Unsorted directory in downloads",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions[0].action).toBe("move");
    expect(suggestions[0].confidence).toBe("medium");
    expect(suggestions[0].title).toContain("Development");
  });

  it("handles unsorted directory with dev indicators in details", () => {
    const results: ScanResult[] = [
      {
        type: "unsorted",
        path: "D:\\07_Downloads\\some-project",
        severity: "warning",
        details: "Contains package.json",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions[0].action).toBe("move");
    expect(suggestions[0].confidence).toBe("medium");
    expect(suggestions[0].title).toContain("Development");
  });

  it("falls back to NeedsSorting for unknown unsorted items", () => {
    const results: ScanResult[] = [
      {
        type: "unsorted",
        path: "D:\\07_Downloads\\mystery-folder",
        severity: "warning",
        details: "Unknown item in downloads",
      },
    ];
    const suggestions = generateSuggestions(results);
    expect(suggestions[0].action).toBe("move");
    expect(suggestions[0].confidence).toBe("low");
    expect(suggestions[0].title).toContain("NeedsSorting");
  });
});
