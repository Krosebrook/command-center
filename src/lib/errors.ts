// ---------------------------------------------------------------------------
// Structured error handling for API routes and server components
// ---------------------------------------------------------------------------

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} not found: ${identifier}`
        : `${resource} not found`,
      "NOT_FOUND",
      404,
    );
    this.name = "NotFoundError";
  }
}

export class SecurityError extends AppError {
  constructor(message: string) {
    super(message, "SECURITY_ERROR", 403);
    this.name = "SecurityError";
  }
}

export class DriveUnavailableError extends AppError {
  constructor() {
    super(
      "Drive is not accessible. Check that D:\\ is mounted.",
      "DRIVE_UNAVAILABLE",
      503,
    );
    this.name = "DriveUnavailableError";
  }
}

/**
 * Extract a safe error message from an unknown thrown value.
 * Never leaks stack traces or internal details to the client.
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return "An internal error occurred";
  return "An unknown error occurred";
}

/**
 * Build a JSON-serializable error response body.
 */
export function errorResponse(error: unknown): {
  error: string;
  code: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    };
  }
  return { error: "An internal error occurred", code: "INTERNAL_ERROR" };
}

/**
 * Get the HTTP status code for an error.
 */
export function errorStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}
