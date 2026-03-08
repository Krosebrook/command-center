# Command Center -- Architecture

## Overview

Command Center is a local Next.js dashboard that provides a visual interface for managing and navigating a structured D:\ drive. It reads directly from the filesystem -- there is no database. All scanning happens server-side, and the client renders results through React components.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15 |
| UI Library | React | 19 |
| Language | TypeScript | 5.7+ (strict mode) |
| Styling | Tailwind CSS | 3.4 |
| Validation | Zod | 4.3 |
| Unit Testing | Vitest | 4.0 |
| E2E Testing | Playwright | 1.58 |
| Component Testing | Testing Library | 16.3 |

## Layer Diagram

```
+-------------------------------------------------------------------+
|                         Browser (Client)                          |
|  Pages --> Components --> Hooks --> fetch(/api/...)                |
+-------------------------------------------------------------------+
                              |
                        HTTP (JSON)
                              |
+-------------------------------------------------------------------+
|                    Next.js API Routes (Server)                    |
|  withErrorHandling --> Zod Validation --> Security Checks         |
+-------------------------------------------------------------------+
                              |
                    Library layer (Server)
                              |
+-------------------------------------------------------------------+
|  Config    Scanner     Deep Scanner    Parser     Suggestions     |
|  (paths)   (shallow)   (recursive)    (markdown)  (rules)        |
+-------------------------------------------------------------------+
                              |
                     Node.js fs (Server)
                              |
+-------------------------------------------------------------------+
|                    D:\ Drive (Filesystem)                         |
|  00_Core/  01_Homebase/  02_Development/  ...                    |
+-------------------------------------------------------------------+
```

## Directory Structure

```
src/
+-- app/                    # Next.js App Router pages and API routes
|   +-- api/
|   |   +-- health/         # GET  - Health check endpoint
|   |   +-- scan/           # GET  - Shallow drive scan
|   |   +-- stats/          # GET  - Combined drive stats + todo counts
|   |   +-- context/        # POST - AI context bundle generator
|   |   +-- setup/
|   |       +-- scan/       # GET  - Deep recursive scan
|   |       +-- suggestions/# POST - Generate suggestions from scan
|   |       +-- action/     # POST - Execute file operations
|   |       +-- update/     # POST - Update governance docs
|   +-- page.tsx            # Dashboard
|   +-- projects/           # Project explorer
|   +-- agents/             # Agent registry
|   +-- automations/        # Automation library
|   +-- launch/             # AI workspace launcher
|   +-- cleanup/            # Cleanup tracker
|   +-- setup/              # Drive walkthrough wizard
+-- components/
|   +-- ui/                 # Shared primitives (Button, Badge, Card, etc.)
|   +-- NavSidebar.tsx      # Responsive navigation sidebar
|   +-- ProjectCard.tsx     # Project display with status indicators
|   +-- AgentCard.tsx       # Agent registry card
|   +-- DriveHealthBar.tsx  # Drive usage visualization
|   +-- ScanResults.tsx     # Collapsible scan results
|   +-- SuggestionCard.tsx  # Suggestion with accept/dismiss/execute
|   +-- ContextPreview.tsx  # AI context bundle preview
|   +-- SetupStepper.tsx    # Setup wizard progress indicator
+-- hooks/                  # Custom React hooks
+-- lib/
|   +-- config.ts           # Drive paths, projects, sort rules, governance files
|   +-- scanner.ts          # Shallow scan with 5-min cache
|   +-- deep-scanner.ts     # Recursive deep scan with 10-min cache
|   +-- parser.ts           # Markdown table parser
|   +-- suggestions.ts      # Rule-based suggestion engine
|   +-- errors.ts           # Structured error hierarchy
|   +-- security.ts         # Path validation, rate limiting, body parsing
|   +-- api-utils.ts        # withErrorHandling, jsonSuccess, mutation lock
|   +-- validation.ts       # Zod schemas for API request bodies
|   +-- logger.ts           # Structured logging
|   +-- types.ts            # Shared TypeScript types
|   +-- utils.ts            # cn(), formatBytes(), formatDate(), etc.
+-- test/
    +-- setup.ts            # Vitest setup (jest-dom, router mock, cleanup)
```

## Server vs Client Component Strategy

Next.js 15 uses Server Components by default. Command Center follows this convention:

- **Server Components**: All pages that display drive data. The dashboard, project explorer, agent registry, and cleanup tracker fetch data server-side and render HTML directly. No `"use client"` directive needed.
- **Client Components**: Interactive pages that require user input, state management, or browser APIs. The AI Launcher (`/launch`) and Setup Walkthrough (`/setup`) use `"use client"` because they manage multi-step form state, clipboard operations, and dynamic API calls.
- **Shared Components**: UI primitives in `src/components/ui/` are designed to work in both contexts. Components that use `onClick`, `useState`, or other client-only features are marked `"use client"`.

**Rule**: Client components must never import Node.js modules like `path` or `fs`. Use the `basename()` utility from `src/lib/utils.ts` instead.

## Data Flow

### Shallow Scan (Dashboard, Stats)

```
Page load
  --> Server Component calls scanDrive()
    --> Check 5-min cache, return if fresh
    --> fs.readdir(D:\) to find numbered folders (##_Name pattern)
    --> Promise.allSettled() on each folder for stats
    --> Cache results, return DriveStats
  --> Render HTML with folder data
```

### Deep Scan (Setup Walkthrough)

```
Client clicks "Start Scan"
  --> POST /api/setup/scan
    --> Check 10-min cache, return if fresh
    --> Promise.allSettled() on 7 check functions:
        checkMissingIndex, checkOrphanedRootItems, checkStaleProjects,
        checkUnsortedItems, checkLargeFiles, checkEmptyDirectories,
        checkMissingGovernance
    --> Aggregate results into DeepScanResult
    --> Cache results, return JSON
  --> Client renders ScanResults component
```

### Action Execution (Setup Walkthrough)

```
User accepts suggestion
  --> POST /api/setup/action { action, source, destination? }
    --> Zod validation (ActionRequestSchema)
    --> assertUnderDriveRoot(source) and assertUnderDriveRoot(destination)
    --> Check source exists (NotFoundError if not)
    --> Execute action (move/create-index/archive/delete)
    --> Append to .walkthrough-log.json
    --> clearCache() + clearDeepCache()
    --> Return success JSON
```

## Error Handling

### Error Hierarchy

All custom errors extend `AppError`, which carries a machine-readable `code` and HTTP `statusCode`:

```
AppError (base)
  +-- ValidationError    (400, VALIDATION_ERROR)
  +-- NotFoundError      (404, NOT_FOUND)
  +-- SecurityError      (403, SECURITY_ERROR)
  +-- DriveUnavailableError (503, DRIVE_UNAVAILABLE)
```

### Error Flow

1. API route handler throws an error (or one is thrown by a library function).
2. `withErrorHandling` wrapper catches it.
3. `errorResponse()` converts it to a safe JSON body -- no stack traces in production.
4. `errorStatusCode()` extracts the correct HTTP status.
5. The structured `logger` records the error with context (duration, path, etc.).
6. Client receives `{ error, code, details? }`.

For non-`AppError` exceptions (unexpected errors), the client receives a generic `"An internal error occurred"` message with code `"INTERNAL_ERROR"` and status `500`.

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "issues": [
      { "path": "field.name", "message": "is required" }
    ]
  }
}
```

## Security Model

### Path Validation

Every API route that accepts a filesystem path calls `assertUnderDriveRoot()`, which enforces four checks:

1. **Non-empty**: Path must not be empty or whitespace-only.
2. **No null bytes**: Rejects paths containing `\0` (null byte injection).
3. **Length limit**: Rejects paths longer than 500 characters.
4. **Drive root containment**: Uses `path.resolve()` to normalize the path, then verifies it starts with `D:\` (prevents `../` traversal).

Any violation throws a `SecurityError` (HTTP 403).

### Input Validation

All POST endpoints validate request bodies with Zod schemas before processing:

| Endpoint | Schema |
|----------|--------|
| `POST /api/context` | `ContextRequestSchema` |
| `POST /api/setup/suggestions` | `SuggestionsRequestSchema` |
| `POST /api/setup/action` | `ActionRequestSchema` |
| `POST /api/setup/update` | `UpdateRequestSchema` |

Invalid JSON bodies are caught by `safeParseBody()` and throw `ValidationError`.

### Rate Limiting

An in-memory rate limiter protects mutation endpoints. Default: 30 requests per 60-second window per key. The limiter uses a `Map<string, RateEntry>` with automatic cleanup every 5 minutes. When a request is rate-limited, the endpoint returns HTTP 429.

### Mutation Lock

The `withMutationLock` wrapper in `api-utils.ts` prevents concurrent mutations on the same source path. If a mutation is already in progress for a given path, subsequent requests receive HTTP 409 with code `MUTATION_CONFLICT`.

### Safe Error Responses

Stack traces and internal details are never leaked to the client in production. The `safeErrorMessage()` function returns the error's message only for known `AppError` subclasses; all other errors produce a generic message.

## Caching Strategy

| Scanner | Cache TTL | Invalidation |
|---------|-----------|-------------|
| Shallow (`scanner.ts`) | 5 minutes | `clearCache()` -- called after move/archive/delete actions |
| Deep (`deep-scanner.ts`) | 10 minutes | `clearDeepCache()` -- called after any setup action |

Both caches use a simple timestamp comparison (`Date.now() - cacheTime < CACHE_TTL`). After a mutation action (move, archive, delete, create-index), both caches are invalidated so subsequent reads reflect the changes.

## Design System

### Theme

Dark HUD / Mission Control aesthetic with the following properties:

- **Background**: Dark tones using CSS custom properties (`--background`, `--card`, etc.)
- **Accent**: Primary color via `--primary` custom property
- **Fonts**: DM Sans for body text, JetBrains Mono for code and labels
- **Motion**: Shimmer effects, stagger-children animations, text-glow

### CSS Classes

| Class | Purpose |
|-------|---------|
| `hud-card` | Card component with HUD border styling |
| `nav-glow` | Glowing effect on navigation elements |
| `stat-value` | Large stat number styling |
| `text-glow` | Glowing text effect |
| `shimmer` | Loading shimmer animation |
| `stagger-children` | Staggered entrance animation for lists |
| `dot-grid` | Background dot grid pattern |

### Accessibility

- ARIA attributes on all interactive elements
- `focus-visible` rings for keyboard navigation
- Skip-to-content link at the top of the page
- `prefers-reduced-motion` media query respected
- Responsive layouts (mobile-first approach)

## Related Documentation

- [Setup Guide](./setup-guide.md) -- Getting started
- [Testing](./testing.md) -- Test strategy and patterns
- [API Reference](./api-reference.md) -- All API endpoints
- [Edge Cases](./edge-cases.md) -- Graceful degradation scenarios
