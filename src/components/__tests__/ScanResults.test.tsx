import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScanResults } from "../ScanResults";
import type { DeepScanResult } from "@/lib/types";

describe("ScanResults", () => {
  const mockResults: DeepScanResult = {
    results: [
      { type: "missing-index", path: "D:\\test", severity: "info", details: "Missing _INDEX.md" },
      { type: "stale", path: "D:\\old", severity: "warning", details: "Stale project" },
    ],
    scannedAt: new Date().toISOString(),
    totalIssues: 2,
    bySeverity: { info: 1, warning: 1, action: 0 },
    byType: { "missing-index": 1, orphaned: 0, stale: 1, unsorted: 0, "large-file": 0, "empty-dir": 0, "missing-governance": 0 },
  };

  it("shows loading state", () => {
    render(<ScanResults results={null} loading={true} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows scanning text when loading", () => {
    render(<ScanResults results={null} loading={true} />);
    expect(screen.getByText("Scanning drive...")).toBeInTheDocument();
  });

  it("returns null when no results and not loading", () => {
    const { container } = render(<ScanResults results={null} loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders severity summary cards", () => {
    render(<ScanResults results={mockResults} loading={false} />);
    expect(screen.getByLabelText("Info: 1 issues")).toBeInTheDocument();
    expect(screen.getByLabelText("Warning: 1 issues")).toBeInTheDocument();
    expect(screen.getByLabelText("Action: 0 issues")).toBeInTheDocument();
  });

  it("renders issue group headers", () => {
    render(<ScanResults results={mockResults} loading={false} />);
    expect(screen.getByText("Missing Index")).toBeInTheDocument();
    expect(screen.getByText("Stale Items")).toBeInTheDocument();
  });

  it("renders issue details", () => {
    render(<ScanResults results={mockResults} loading={false} />);
    expect(screen.getByText("Missing _INDEX.md")).toBeInTheDocument();
    expect(screen.getByText("Stale project")).toBeInTheDocument();
  });

  it("renders issue paths", () => {
    render(<ScanResults results={mockResults} loading={false} />);
    expect(screen.getByText("D:\\test")).toBeInTheDocument();
    expect(screen.getByText("D:\\old")).toBeInTheDocument();
  });

  it("shows total issues count", () => {
    render(<ScanResults results={mockResults} loading={false} />);
    expect(screen.getByText(/2 total issues/)).toBeInTheDocument();
  });

  it("groups start expanded", () => {
    render(<ScanResults results={mockResults} loading={false} />);
    const toggleBtn = screen.getByText("Missing Index").closest("button");
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses a group on click", async () => {
    const user = userEvent.setup();
    render(<ScanResults results={mockResults} loading={false} />);

    const toggleBtn = screen.getByText("Missing Index").closest("button")!;
    await user.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("re-expands a group on second click", async () => {
    const user = userEvent.setup();
    render(<ScanResults results={mockResults} loading={false} />);

    const toggleBtn = screen.getByText("Missing Index").closest("button")!;
    await user.click(toggleBtn);
    await user.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
  });
});
