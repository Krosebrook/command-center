import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders text content", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders as a span element", () => {
    const { container } = render(<Badge>Tag</Badge>);
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with success variant", () => {
    render(<Badge variant="success">OK</Badge>);
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("renders with warning variant", () => {
    render(<Badge variant="warning">Warn</Badge>);
    expect(screen.getByText("Warn")).toBeInTheDocument();
  });

  it("renders with danger variant", () => {
    render(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders with info variant", () => {
    render(<Badge variant="info">Note</Badge>);
    expect(screen.getByText("Note")).toBeInTheDocument();
  });

  it("renders with muted variant", () => {
    render(<Badge variant="muted">Inactive</Badge>);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(<Badge className="extra-class">Styled</Badge>);
    expect(container.firstChild).toHaveClass("extra-class");
  });

  it("renders children as ReactNode", () => {
    render(<Badge><strong>Bold</strong></Badge>);
    expect(screen.getByText("Bold")).toBeInTheDocument();
  });
});
