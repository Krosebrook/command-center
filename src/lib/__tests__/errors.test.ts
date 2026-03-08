import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  SecurityError,
  DriveUnavailableError,
  safeErrorMessage,
  errorResponse,
  errorStatusCode,
} from "../errors";

describe("AppError", () => {
  it("sets message and code", () => {
    const err = new AppError("test", "TEST", 418);
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST");
    expect(err.statusCode).toBe(418);
  });
  it("defaults to 500", () => {
    const err = new AppError("test", "TEST");
    expect(err.statusCode).toBe(500);
  });
  it("stores details", () => {
    const err = new AppError("test", "TEST", 400, { foo: "bar" });
    expect(err.details).toEqual({ foo: "bar" });
  });
  it("is an instance of Error", () => {
    const err = new AppError("test", "TEST");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("ValidationError", () => {
  it("has status 400", () => {
    expect(new ValidationError("bad").statusCode).toBe(400);
  });
  it("has code VALIDATION_ERROR", () => {
    expect(new ValidationError("bad").code).toBe("VALIDATION_ERROR");
  });
  it("stores details", () => {
    const err = new ValidationError("bad", { field: "name" });
    expect(err.details).toEqual({ field: "name" });
  });
  it("is an instance of AppError", () => {
    expect(new ValidationError("bad")).toBeInstanceOf(AppError);
  });
});

describe("NotFoundError", () => {
  it("has status 404", () => {
    expect(new NotFoundError("File").statusCode).toBe(404);
  });
  it("includes identifier in message", () => {
    expect(new NotFoundError("File", "test.md").message).toContain("test.md");
  });
  it("works without identifier", () => {
    expect(new NotFoundError("File").message).toBe("File not found");
  });
  it("has code NOT_FOUND", () => {
    expect(new NotFoundError("File").code).toBe("NOT_FOUND");
  });
});

describe("SecurityError", () => {
  it("has status 403", () => {
    expect(new SecurityError("nope").statusCode).toBe(403);
  });
  it("has code SECURITY_ERROR", () => {
    expect(new SecurityError("nope").code).toBe("SECURITY_ERROR");
  });
});

describe("DriveUnavailableError", () => {
  it("has status 503", () => {
    expect(new DriveUnavailableError().statusCode).toBe(503);
  });
  it("has code DRIVE_UNAVAILABLE", () => {
    expect(new DriveUnavailableError().code).toBe("DRIVE_UNAVAILABLE");
  });
});

describe("safeErrorMessage", () => {
  it("returns AppError message", () => {
    expect(safeErrorMessage(new ValidationError("bad input"))).toBe("bad input");
  });
  it("hides generic Error messages", () => {
    expect(safeErrorMessage(new Error("secret"))).toBe("An internal error occurred");
  });
  it("handles non-Error values", () => {
    expect(safeErrorMessage("string")).toBe("An unknown error occurred");
    expect(safeErrorMessage(null)).toBe("An unknown error occurred");
    expect(safeErrorMessage(undefined)).toBe("An unknown error occurred");
  });
});

describe("errorResponse", () => {
  it("returns AppError details", () => {
    const resp = errorResponse(new ValidationError("bad", { field: "name" }));
    expect(resp.error).toBe("bad");
    expect(resp.code).toBe("VALIDATION_ERROR");
    expect(resp.details).toEqual({ field: "name" });
  });
  it("omits details when not present", () => {
    const resp = errorResponse(new ValidationError("bad"));
    expect(resp.details).toBeUndefined();
  });
  it("returns generic for unknown errors", () => {
    const resp = errorResponse(new Error("secret"));
    expect(resp.code).toBe("INTERNAL_ERROR");
    expect(resp.error).not.toContain("secret");
  });
  it("returns generic for non-Error values", () => {
    const resp = errorResponse("something");
    expect(resp.code).toBe("INTERNAL_ERROR");
  });
});

describe("errorStatusCode", () => {
  it("returns AppError status", () => expect(errorStatusCode(new ValidationError("x"))).toBe(400));
  it("returns 500 for unknown", () => expect(errorStatusCode(new Error("x"))).toBe(500));
  it("returns 500 for non-errors", () => expect(errorStatusCode("x")).toBe(500));
});
