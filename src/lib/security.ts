// ---------------------------------------------------------------------------
// Security utilities — path validation, input sanitization
// ---------------------------------------------------------------------------

import path from "path";
import { DRIVE_ROOT } from "./config";
import { SecurityError } from "./errors";

/**
 * Return true only if the resolved path stays within DRIVE_ROOT.
 * Prevents path-traversal attacks (e.g. "../../../etc/passwd" or "C:\Windows").
 */
export function isUnderDriveRoot(inputPath: string): boolean {
  const normalized = path.resolve(inputPath);
  const root = path.resolve(DRIVE_ROOT);
  if (normalized === root) return true;
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  return normalized.startsWith(rootWithSep);
}

/**
 * Validate that a path is under DRIVE_ROOT. Throws SecurityError if not.
 */
export function assertUnderDriveRoot(inputPath: string, label = "path"): void {
  if (!inputPath || inputPath.trim().length === 0) {
    throw new SecurityError(`${label} must not be empty`);
  }
  if (inputPath.includes("\0")) {
    throw new SecurityError(`${label} contains invalid characters`);
  }
  if (inputPath.length > 500) {
    throw new SecurityError(`${label} exceeds maximum length`);
  }
  if (!isUnderDriveRoot(inputPath)) {
    throw new SecurityError(`${label} is outside the allowed drive root`);
  }
}

/**
 * Safely parse a JSON request body. Returns the parsed body or throws ValidationError.
 */
export async function safeParseBody<T = unknown>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    const { ValidationError } = await import("./errors");
    throw new ValidationError("Invalid JSON in request body");
  }
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per-route, per-IP)
// ---------------------------------------------------------------------------

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateEntry>();

/**
 * Check if a request should be rate-limited.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return false;
  }

  return true;
}

// Clean up stale entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60_000).unref?.();
}
