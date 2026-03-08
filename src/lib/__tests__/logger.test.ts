import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs info messages", () => {
    logger.info("test message");
    expect(console.log).toHaveBeenCalled();
  });

  it("logs warn messages", () => {
    logger.warn("warning");
    expect(console.warn).toHaveBeenCalled();
  });

  it("logs error messages", () => {
    logger.error("error");
    expect(console.error).toHaveBeenCalled();
  });

  it("includes message in output", () => {
    logger.info("hello world");
    expect(console.log).toHaveBeenCalled();
    const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call).toContain("hello world");
  });

  it("includes context in output", () => {
    logger.info("msg", { key: "value" });
    expect(console.log).toHaveBeenCalled();
    const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call).toContain("msg");
  });

  it("includes level prefix in dev format", () => {
    logger.warn("caution");
    const call = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call).toContain("WARN");
  });

  it("includes level prefix for error", () => {
    logger.error("failure");
    const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call).toContain("ERROR");
  });
});
