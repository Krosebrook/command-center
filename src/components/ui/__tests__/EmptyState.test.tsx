import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="No data" description="Try again later" />);
    expect(screen.getByText("Try again later")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("Try again later")).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(<EmptyState title="No data" action={<button>Retry</button>} />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("does not render action when omitted", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders without optional props", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders an icon svg", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<EmptyState title="Empty" className="my-class" />);
    expect(container.firstChild).toHaveClass("my-class");
  });

  it("accepts icon prop", () => {
    render(<EmptyState title="Not found" icon="search" />);
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });
});
