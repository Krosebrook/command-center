# Command Center -- Edge Cases

This document catalogs the 20 edge cases that Command Center handles through graceful degradation. Each entry describes the scenario, how the app responds, where the handling code lives, and how to verify it.

---

## 1. Drive Unavailable / Unmounted

**Scenario**: The D:\ drive is not mounted or is otherwise inaccessible when the app starts or during operation.

**Handling**: The `isDriveAccessible()` function in `scanner.ts` calls `fs.access(DRIVE_ROOT)` and returns `false` on failure. The `scanDrive()` function catches the top-level error and returns empty stats (`folders: [], totalFiles: 0, totalSize: 0`). The dashboard shows "DRIVE OFFLINE" and all pages render with empty states. The `/api/health` endpoint returns HTTP 503 with `"status": "degraded"`.

**Code location**: `src/lib/scanner.ts` (lines 23-30, 107-114), `src/app/api/health/route.ts`.

**How to test**: Unmount D:\ (or run on a machine without it) and load the dashboard. Verify all pages load without errors. Run `curl http://localhost:3000/api/health` and confirm `driveAccessible: false`.

---

## 2. Permission Denied on Specific Folders

**Scenario**: The drive is mounted but certain folders or files are not readable due to OS-level permissions (e.g., `$RECYCLE.BIN`, `System Volume Information`).

**Handling**: Every filesystem operation is wrapped in try/catch. The `getFolderStats()` function in `scanner.ts` catches errors on individual entries and skips them. The deep scanner's `readDirSafe()` helper returns an empty array on permission errors. The shallow scanner uses `Promise.allSettled()` and increments a `partialFailures` counter for any folder that fails.

**Code location**: `src/lib/scanner.ts` (getFolderStats, lines 42-68), `src/lib/deep-scanner.ts` (readDirSafe, lines 46-54).

**How to test**: Create a folder on D:\ with restricted permissions. Run a scan and verify the folder is skipped without crashing. Check that `partialFailures` in the scan response is greater than 0.

---

## 3. Corrupt / Malformed Markdown Files

**Scenario**: A governance file (TODO.md, AGENTS.md, etc.) contains malformed markdown that cannot be parsed correctly.

**Handling**: The `parser.ts` module uses defensive parsing. Functions like `parseTodoItems()` and `readFileContent()` catch read errors and return empty results. The parser does not throw on malformed content -- it extracts what it can and ignores unparseable sections.

**Code location**: `src/lib/parser.ts`.

**How to test**: Replace TODO.md with garbled content. Load the `/cleanup` page and verify it displays zero tasks instead of crashing.

---

## 4. Files Too Large to Read (>10 MB)

**Scenario**: A file on the drive exceeds expected size limits, which could cause memory issues if read into memory.

**Handling**: The deep scanner flags files exceeding the `LARGE_FILE_THRESHOLD` (50 MB, configured in `config.ts`) as `large-file` scan issues. File reading operations in the context generator and parser use `fs.readFile` with try/catch; if a file causes a memory error, the catch block handles it gracefully.

**Code location**: `src/lib/config.ts` (LARGE_FILE_THRESHOLD, line 126), `src/lib/deep-scanner.ts` (checkLargeFiles, lines 217-257).

**How to test**: Place a file larger than 50 MB on D:\ and run a deep scan. Verify it appears in the results with type `large-file` and the correct size.

---

## 5. Network Timeout on API Calls

**Scenario**: A client-side fetch to an API route times out or fails due to network issues.

**Handling**: Client components that call API routes use `fetch()` with error handling. The `withErrorHandling` wrapper on the server side logs the duration of every request. If the server itself hangs during a long filesystem operation, the Next.js runtime will eventually time out the request. The client displays an error state in the relevant component.

**Code location**: `src/lib/api-utils.ts` (withErrorHandling), client-side hooks and pages.

**How to test**: Simulate a slow network using browser DevTools (throttle to Slow 3G). Trigger a deep scan and verify the UI handles the slow response without breaking.

---

## 6. Partial Scan Results (Some Folders Fail)

**Scenario**: During a shallow scan, some numbered folders succeed while others fail (e.g., permission denied, disk I/O error).

**Handling**: `scanDrive()` uses `Promise.allSettled()` to run all folder scans in parallel. Fulfilled results are added to the response; rejected results increment `partialFailures` and are logged with `logger.warn()`. The UI receives whatever data was successfully collected.

**Code location**: `src/lib/scanner.ts` (scanDrive, lines 70-115).

**How to test**: Mock one folder to throw an error. Verify the scan completes with partial results and `partialFailures > 0`.

---

## 7. Individual Deep Scan Check Failures

**Scenario**: One of the seven deep scan checks (e.g., checkStaleProjects) fails while others succeed.

**Handling**: `deepScanDrive()` runs all seven check functions via `Promise.allSettled()`. If any individual check rejects, its results are omitted and a warning is logged. The remaining checks still contribute to the final `DeepScanResult`.

**Code location**: `src/lib/deep-scanner.ts` (deepScanDrive, lines 319-391).

**How to test**: Mock one check function to throw. Run a deep scan and verify the other checks' results are present. Check server logs for the warning.

---

## 8. Concurrent Mutations on Same Path

**Scenario**: Two requests attempt to move or delete the same file simultaneously.

**Handling**: The `withMutationLock` wrapper in `api-utils.ts` maintains a `Set<string>` of active mutation paths. If a second request arrives for the same `source` path while a mutation is in progress, it immediately returns HTTP 409 with code `MUTATION_CONFLICT`. The lock is released in a `finally` block.

**Code location**: `src/lib/api-utils.ts` (withMutationLock, lines 57-80).

**How to test**: Send two simultaneous POST requests to `/api/setup/action` with the same source path. Verify one succeeds and the other returns 409.

---

## 9. Empty String Paths in API Requests

**Scenario**: An API request includes an empty string for a path field (e.g., `{"source": ""}`).

**Handling**: `assertUnderDriveRoot()` checks for empty or whitespace-only strings as its first validation step. Empty paths throw a `SecurityError` with message `"<label> must not be empty"`. Additionally, Zod schemas use `.min(1)` on path fields, so empty strings are also caught at the validation layer.

**Code location**: `src/lib/security.ts` (assertUnderDriveRoot, lines 24-26), `src/lib/validation.ts` (ActionRequestSchema, line 5).

**How to test**:
```bash
curl -X POST http://localhost:3000/api/setup/action \
  -H "Content-Type: application/json" \
  -d '{"action": "move", "source": "", "destination": "D:\\test"}'
```
Verify: HTTP 400 with `VALIDATION_ERROR`.

---

## 10. Null Byte Injection in Paths

**Scenario**: A malicious request includes null bytes in a path (e.g., `"D:\\00_Core\0../etc/passwd"`), attempting to bypass path validation.

**Handling**: `assertUnderDriveRoot()` explicitly checks for null bytes (`\0`) in the input path. If found, it throws a `SecurityError` with message `"<label> contains invalid characters"`.

**Code location**: `src/lib/security.ts` (assertUnderDriveRoot, lines 28-30).

**How to test**: Send a request with a null byte in the path and verify HTTP 403 `SECURITY_ERROR`.

---

## 11. Excessively Long Paths (>500 Characters)

**Scenario**: A request includes a path that exceeds 500 characters, potentially causing buffer issues or filesystem errors.

**Handling**: `assertUnderDriveRoot()` checks `inputPath.length > 500` and throws a `SecurityError` with message `"<label> exceeds maximum length"`.

**Code location**: `src/lib/security.ts` (assertUnderDriveRoot, lines 31-33).

**How to test**: Send a request with a path of 501+ characters and verify HTTP 403 `SECURITY_ERROR`.

---

## 12. Path Traversal Attempts

**Scenario**: A malicious request uses `../` sequences (e.g., `"D:\\00_Core\\..\\..\\etc\\passwd"`) to escape the drive root.

**Handling**: `isUnderDriveRoot()` uses `path.resolve()` to normalize the input path, resolving all `..` segments. It then checks whether the normalized path starts with `DRIVE_ROOT + path.sep` (or equals `DRIVE_ROOT`). This prevents both `../` traversal and similarly-named directories (e.g., `D:\-extra` would not match `D:\`).

**Code location**: `src/lib/security.ts` (isUnderDriveRoot, lines 13-19).

**How to test**:
```bash
curl -X POST http://localhost:3000/api/setup/action \
  -H "Content-Type: application/json" \
  -d '{"action": "delete", "source": "D:\\00_Core\\..\\..\\Windows\\System32"}'
```
Verify: HTTP 403 `SECURITY_ERROR`.

---

## 13. Invalid JSON Request Bodies

**Scenario**: A POST request sends a body that is not valid JSON (e.g., plain text, truncated JSON, or an empty body).

**Handling**: `safeParseBody()` in `security.ts` wraps `request.json()` in a try/catch. If JSON parsing fails, it throws a `ValidationError` with message `"Invalid JSON in request body"`.

**Code location**: `src/lib/security.ts` (safeParseBody, lines 42-51).

**How to test**:
```bash
curl -X POST http://localhost:3000/api/context \
  -H "Content-Type: application/json" \
  -d 'not valid json'
```
Verify: HTTP 400 `VALIDATION_ERROR`.

---

## 14. Invalid Zod Schema Input

**Scenario**: A POST request sends valid JSON but the fields do not match the expected Zod schema (e.g., wrong types, missing required fields, invalid enum values).

**Handling**: Each POST endpoint calls `Schema.safeParse(rawBody)`. If `parsed.success` is `false`, the route throws a `ValidationError` with the Zod issues array mapped to `{ path, message }` objects. The client receives a 400 response with detailed field-level errors.

**Code location**: `src/lib/validation.ts` (schema definitions), individual route files (e.g., `src/app/api/context/route.ts`, lines 60-65).

**How to test**:
```bash
curl -X POST http://localhost:3000/api/setup/action \
  -H "Content-Type: application/json" \
  -d '{"action": "invalid-action", "source": "D:\\test"}'
```
Verify: HTTP 400 with `VALIDATION_ERROR` and `details.issues` listing the invalid field.

---

## 15. Rate Limit Exceeded

**Scenario**: A client sends more than 30 requests to a rate-limited endpoint within 60 seconds.

**Handling**: `checkRateLimit()` in `security.ts` maintains an in-memory `Map<string, RateEntry>`. Each entry tracks the request count and reset time. When the count exceeds `maxRequests`, the function returns `false` and the endpoint responds with HTTP 429. Stale entries are cleaned up every 5 minutes via `setInterval`.

**Code location**: `src/lib/security.ts` (checkRateLimit, lines 68-87, cleanup lines 90-99).

**How to test**: Send 31+ rapid requests to a rate-limited endpoint. Verify the 31st request returns HTTP 429.

---

## 16. Request Abort / Cancellation

**Scenario**: The client aborts a request (e.g., user navigates away, AbortController.abort()) while the server is processing it.

**Handling**: The `withErrorHandling` wrapper catches all errors, including those caused by aborted requests. The error is logged, and since the connection is already closed, the response is effectively discarded. No server-side state is corrupted because filesystem operations are atomic (rename) or idempotent (write file).

**Code location**: `src/lib/api-utils.ts` (withErrorHandling, lines 13-44).

**How to test**: Start a deep scan and immediately navigate away. Check server logs for any error entries. Verify no partial state is left behind.

---

## 17. Component Render Errors (Error Boundary)

**Scenario**: A React component throws an error during rendering (e.g., unexpected data shape, missing props).

**Handling**: Next.js App Router provides built-in error boundaries via `error.tsx` files. If a page component throws, Next.js catches the error and renders the nearest `error.tsx` boundary, allowing the rest of the app to continue functioning. The sidebar navigation remains accessible.

**Code location**: `src/app/error.tsx` (if present), Next.js built-in error handling.

**How to test**: Temporarily modify a component to throw during render. Load the page and verify an error boundary catches it instead of a white screen.

---

## 18. Retry with Exponential Backoff

**Scenario**: A transient error occurs (e.g., filesystem briefly unavailable, temporary I/O error) and the client needs to retry.

**Handling**: Client-side hooks and fetch calls implement retry logic with exponential backoff for transient failures. The server responds with appropriate status codes (503 for drive unavailable, 500 for transient errors) that signal the client to retry. The `withErrorHandling` wrapper ensures consistent error responses that clients can inspect to decide whether to retry.

**Code location**: Client-side hooks in `src/hooks/`, `src/lib/api-utils.ts` (error responses).

**How to test**: Simulate intermittent drive availability (mount/unmount rapidly). Verify the client retries and eventually succeeds or shows a clear failure message.

---

## 19. Browser JS Disabled (Progressive Enhancement via SSR)

**Scenario**: A user visits the dashboard with JavaScript disabled in their browser.

**Handling**: Server Components render full HTML on the server, so pages like the dashboard, projects, agents, and cleanup display their content without any client-side JavaScript. Only interactive features (AI Launcher, Setup Walkthrough) require JavaScript for their multi-step workflows. The navigation sidebar renders server-side, so all links work without JS.

**Code location**: All Server Component pages (`src/app/page.tsx`, `src/app/projects/page.tsx`, etc.).

**How to test**: Disable JavaScript in browser DevTools. Navigate to the dashboard, projects, and agents pages. Verify content is visible and links work.

---

## 20. Unhandled Promise Rejections in Async Hooks

**Scenario**: An async operation inside a React hook or effect rejects unexpectedly (e.g., fetch fails with no catch, async state update after unmount).

**Handling**: Client components wrap async operations in try/catch blocks. The `withErrorHandling` server wrapper ensures API responses always return valid JSON, so client-side `response.json()` does not throw on error responses. React 19's improved error handling helps with unmounted component updates. For truly unhandled rejections, the Node.js process logs them via the default unhandledRejection handler, and the structured logger captures context.

**Code location**: Client-side hooks in `src/hooks/`, `src/lib/api-utils.ts`.

**How to test**: Mock a fetch call to reject without a `.catch()`. Verify the component shows an error state instead of crashing the entire app. Check the browser console for unhandled rejection warnings.

---

## Summary Table

| # | Edge Case | HTTP Status | Error Code | Graceful? |
|---|-----------|------------|------------|-----------|
| 1 | Drive unavailable | 503 | DRIVE_UNAVAILABLE | Yes -- empty states |
| 2 | Permission denied | 200 (partial) | N/A | Yes -- skips folders |
| 3 | Corrupt markdown | 200 | N/A | Yes -- empty results |
| 4 | Large files | 200 | N/A | Yes -- flagged in scan |
| 5 | Network timeout | Timeout | N/A | Yes -- client retry |
| 6 | Partial scan | 200 | N/A | Yes -- partial results |
| 7 | Check failure | 200 | N/A | Yes -- remaining checks |
| 8 | Concurrent mutation | 409 | MUTATION_CONFLICT | Yes -- lock rejected |
| 9 | Empty path | 400 | VALIDATION_ERROR | Yes -- rejected |
| 10 | Null byte injection | 403 | SECURITY_ERROR | Yes -- rejected |
| 11 | Long path | 403 | SECURITY_ERROR | Yes -- rejected |
| 12 | Path traversal | 403 | SECURITY_ERROR | Yes -- rejected |
| 13 | Invalid JSON | 400 | VALIDATION_ERROR | Yes -- rejected |
| 14 | Invalid schema | 400 | VALIDATION_ERROR | Yes -- rejected |
| 15 | Rate limit | 429 | N/A | Yes -- throttled |
| 16 | Request abort | N/A | N/A | Yes -- no corruption |
| 17 | Render error | N/A | N/A | Yes -- error boundary |
| 18 | Retry backoff | Various | Various | Yes -- auto-retry |
| 19 | JS disabled | 200 | N/A | Yes -- SSR content |
| 20 | Unhandled rejection | N/A | N/A | Yes -- error state |

## Related Documentation

- [Architecture](./architecture.md) -- Error handling and security model
- [API Reference](./api-reference.md) -- Error response formats
- [Testing](./testing.md) -- How to write tests for edge cases
- [Setup Guide](./setup-guide.md) -- Troubleshooting
