// ---------------------------------------------------------------------------
// Shared API route utilities — consistent error handling, responses
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { errorResponse, errorStatusCode } from "./errors";
import { logger } from "./logger";

/**
 * Wrap an API route handler with consistent error handling.
 * Catches all errors, logs them, and returns safe JSON responses.
 */
export function withErrorHandling(
  handler: (request: Request) => Promise<any>,
) {
  return async (request: Request): Promise<NextResponse> => {
    const start = performance.now();
    const url = new URL(request.url);

    try {
      const response = await handler(request);
      const duration = Math.round(performance.now() - start);
      logger.info(`${request.method} ${url.pathname}`, {
        status: response.status,
        duration: `${duration}ms`,
      });
      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      const status = errorStatusCode(error);

      logger.error(`${request.method} ${url.pathname} failed`, {
        status,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof Error && process.env.NODE_ENV !== "production"
          ? { stack: error.stack }
          : {}),
      });

      return NextResponse.json(errorResponse(error), { status });
    }
  };
}

/**
 * Success JSON response helper.
 */
export function jsonSuccess<T>(data: T, message?: string, status = 200, start?: number): NextResponse {
  const payload: any = { data };
  if (message) payload.message = message;
  if (start) payload.duration = `${Date.now() - start}ms`;
  return NextResponse.json(payload, { status });
}

// ---------------------------------------------------------------------------
// Mutation lock — prevent concurrent mutations on the same source path
// ---------------------------------------------------------------------------

const activeMutations = new Set<string>();

export function withMutationLock(
  handler: (request: Request) => Promise<NextResponse>,
) {
  return async (request: Request): Promise<NextResponse> => {
    const body = await request.clone().json().catch(() => ({}));
    const lockKey = body?.source || "unknown";

    if (activeMutations.has(lockKey)) {
      return NextResponse.json(
        { error: "A mutation is already in progress for this path", code: "MUTATION_CONFLICT" },
        { status: 409 },
      );
    }

    activeMutations.add(lockKey);
    try {
      return await handler(request);
    } finally {
      activeMutations.delete(lockKey);
    }
  };
}
