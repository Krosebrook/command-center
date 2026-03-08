import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentCard } from "../AgentCard";

describe("AgentCard", () => {
  const defaultProps = {
    name: "TestAgent",
    file: "test.agent.md",
    role: "Helper",
    purpose: "Helps with testing",
    version: "1.0",
    status: "Active",
  };

  it("renders agent name", () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText("TestAgent")).toBeInTheDocument();
  });

  it("renders role", () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText("Helper")).toBeInTheDocument();
  });

  it("renders purpose", () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText("Helps with testing")).toBeInTheDocument();
  });

  it("renders file path", () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText("test.agent.md")).toBeInTheDocument();
  });

  it("renders status and version combined", () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText("Active v1.0")).toBeInTheDocument();
  });

  it("renders default invocation command", () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText("@testagent-agent")).toBeInTheDocument();
  });

  it("renders custom invocation when provided", () => {
    render(<AgentCard {...defaultProps} invocation="@custom-cmd" />);
    expect(screen.getByText("@custom-cmd")).toBeInTheDocument();
  });
});
