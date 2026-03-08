import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DriveHealthBar } from "../DriveHealthBar";

describe("DriveHealthBar", () => {
  const folders = [
    { name: "00_Core", fileCount: 10, totalSize: 1024 * 1024, lastModified: new Date().toISOString(), hasIndex: true },
    { name: "02_Development", fileCount: 50, totalSize: 5 * 1024 * 1024, lastModified: new Date().toISOString(), hasIndex: true },
  ];

  it("renders with folders", () => {
    render(<DriveHealthBar folders={folders} totalSize={6 * 1024 * 1024} />);
    const bar = screen.getByRole("img");
    expect(bar).toBeInTheDocument();
  });

  it("renders empty state text when no folders", () => {
    render(<DriveHealthBar folders={[]} totalSize={0} />);
    expect(screen.getByText("No folder data available")).toBeInTheDocument();
  });

  it("does not render bar when empty", () => {
    render(<DriveHealthBar folders={[]} totalSize={0} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("has accessible label on the bar", () => {
    render(<DriveHealthBar folders={folders} totalSize={6 * 1024 * 1024} />);
    const bar = screen.getByRole("img");
    expect(bar).toHaveAttribute("aria-label");
    expect(bar.getAttribute("aria-label")).toContain("00_Core");
    expect(bar.getAttribute("aria-label")).toContain("02_Development");
  });

  it("displays Drive Usage heading", () => {
    render(<DriveHealthBar folders={folders} totalSize={6 * 1024 * 1024} />);
    expect(screen.getByText("Drive Usage")).toBeInTheDocument();
  });

  it("displays total size scanned", () => {
    render(<DriveHealthBar folders={folders} totalSize={6 * 1024 * 1024} />);
    expect(screen.getByText(/scanned/)).toBeInTheDocument();
  });

  it("renders folder legend items", () => {
    render(<DriveHealthBar folders={folders} totalSize={6 * 1024 * 1024} />);
    expect(screen.getByText(/00_Core/)).toBeInTheDocument();
    expect(screen.getByText(/02_Development/)).toBeInTheDocument();
  });
});
