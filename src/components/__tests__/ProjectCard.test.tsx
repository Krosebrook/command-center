import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "../ProjectCard";

describe("ProjectCard", () => {
  const defaultProps = {
    name: "TestProject",
    path: "D:\\test\\project",
    description: "A test project",
    techStack: ["React", "TypeScript"] as const,
    status: "active" as const,
  };

  it("renders project name", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("TestProject")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("A test project")).toBeInTheDocument();
  });

  it("renders tech stack badges", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("shows status label for active", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("ONLINE")).toBeInTheDocument();
  });

  it("renders with planning status", () => {
    render(<ProjectCard {...defaultProps} status="planning" />);
    expect(screen.getByText("STAGED")).toBeInTheDocument();
  });

  it("renders with archived status", () => {
    render(<ProjectCard {...defaultProps} status="archived" />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("renders with missing status", () => {
    render(<ProjectCard {...defaultProps} status="missing" />);
    expect(screen.getByText("NOT FOUND")).toBeInTheDocument();
  });

  it("falls back to archived config for unknown status", () => {
    render(<ProjectCard {...defaultProps} status="unknown" />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("handles empty tech stack", () => {
    render(<ProjectCard {...defaultProps} techStack={[]} />);
    expect(screen.getByText("TestProject")).toBeInTheDocument();
  });

  it("renders path", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("D:\\test\\project")).toBeInTheDocument();
  });

  it("renders optional fileCount", () => {
    render(<ProjectCard {...defaultProps} fileCount={42} />);
    expect(screen.getByText("42 files")).toBeInTheDocument();
  });

  it("renders optional lastModified", () => {
    render(<ProjectCard {...defaultProps} lastModified="2026-01-01" />);
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
  });

  it("omits fileCount when not provided", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.queryByText(/files/)).not.toBeInTheDocument();
  });
});
