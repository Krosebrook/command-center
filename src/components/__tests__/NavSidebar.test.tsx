import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavSidebar } from "../NavSidebar";

// next/navigation is already mocked globally in src/test/setup.ts
// usePathname returns "/" by default

describe("NavSidebar", () => {
  it("renders Dashboard link", () => {
    render(<NavSidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<NavSidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByText("Automations")).toBeInTheDocument();
    expect(screen.getByText("AI Launcher")).toBeInTheDocument();
    expect(screen.getByText("Cleanup")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();
  });

  it("highlights Dashboard as current page (pathname is /)", () => {
    render(<NavSidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("does not highlight other links when on /", () => {
    render(<NavSidebar />);
    const projectsLink = screen.getByText("Projects").closest("a");
    expect(projectsLink).not.toHaveAttribute("aria-current");
  });

  it("has mobile menu button", () => {
    render(<NavSidebar />);
    const menuBtn = screen.getByLabelText("Open navigation menu");
    expect(menuBtn).toBeInTheDocument();
  });

  it("mobile menu button starts not expanded", () => {
    render(<NavSidebar />);
    const menuBtn = screen.getByLabelText("Open navigation menu");
    expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles mobile menu on click", async () => {
    const user = userEvent.setup();
    render(<NavSidebar />);
    const menuBtn = screen.getByLabelText("Open navigation menu");
    await user.click(menuBtn);
    expect(menuBtn).toHaveAttribute("aria-expanded", "true");
  });

  it("has a close button for mobile nav", () => {
    render(<NavSidebar />);
    expect(screen.getByLabelText("Close navigation menu")).toBeInTheDocument();
  });

  it("has main navigation landmark", () => {
    render(<NavSidebar />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });
});
