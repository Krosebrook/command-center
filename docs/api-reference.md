# Command Center -- API Reference

All API routes are served by Next.js App Router under `/api/`. Responses are JSON. Error responses follow a consistent format (see [Error Response Format](#error-response-format) below).

## Routes Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (drive accessibility, uptime) |
| GET | `/api/scan` | Shallow drive scan |
| GET | `/api/stats` | Combined drive stats + todo counts |
| POST | `/api/context` | Generate AI context bundle |
| GET | `/api/setup/scan` | Deep recursive drive scan |
| POST | `/api/setup/suggestions` | Generate suggestions from scan results |
| POST | `/api/setup/action` | Execute file operation (move/create-index/archive/delete) |
| POST | `/api/setup/update` | Update TODO.md and CHANGELOG.md |

---

## GET /api/health

Health check endpoint. Reports drive accessibility and server uptime.

**Security**: None (public endpoint).

**Response (200 -- drive accessible)**:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "driveAccessible": true,
  "driveRoot": "D:\\",
  "timestamp": "2026-03-08T12:00:00.000Z"
}
```

**Response (503 -- drive unavailable)**:
```json
{
  "status": "degraded",
  "uptime": 3600,
  "driveAccessible": false,
  "driveRoot": "D:\\",
  "timestamp": "2026-03-08T12:00:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:3000/api/health
```

---

## GET /api/scan

Performs a shallow scan of the D:\ drive. Returns folder-level statistics for all numbered directories (pattern `##_Name`). Results are cached for 5 minutes.

**Security**: Wrapped with `withErrorHandling`.

**Response (200)**:
```json
{
  "folders": [
    {
      "name": "00_Core",
      "path": "D:\\00_Core",
      "fileCount": 6,
      "totalSize": 24576,
      "lastModified": "2026-03-08T10:00:00.000Z",
      "hasIndex": true
    }
  ],
  "totalFiles": 150,
  "totalSize": 1073741824,
  "lastScan": "2026-03-08T12:00:00.000Z",
  "partialFailures": 0
}
```

**Example**:
```bash
curl http://localhost:3000/api/scan
```

---

## GET /api/stats

Returns combined drive statistics and TODO.md task counts. Fetches drive stats (via shallow scan) and parses TODO.md in parallel.

**Security**: Wrapped with `withErrorHandling`.

**Response (200)**:
```json
{
  "drive": {
    "folderCount": 13,
    "totalFiles": 150,
    "totalSize": 1073741824,
    "lastScan": "2026-03-08T12:00:00.000Z"
  },
  "tasks": {
    "total": 25,
    "completed": 10,
    "pending": 15
  },
  "folders": [
    {
      "name": "00_Core",
      "fileCount": 6,
      "totalSize": 24576,
      "lastModified": "2026-03-08T10:00:00.000Z",
      "hasIndex": true
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3000/api/stats
```

---

## POST /api/context

Generates an AI context bundle by collecting relevant files from a project directory. Reads `CLAUDE.md`, `AGENTS.md`, `_INDEX.md`, `README.md`, and any files in the `.claude/` subdirectory.

**Security**: Zod validation (`ContextRequestSchema`), path validation (`assertUnderDriveRoot`), wrapped with `withErrorHandling`.

**Request Body** (validated by `ContextRequestSchema`):
```json
{
  "projectPath": "D:\\01_Homebase\\01_Source-of-Truth\\FlashFusion",
  "projectName": "FlashFusion"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectPath` | string | Yes | Absolute path to the project directory. Must be under D:\. |
| `projectName` | string | No | Display name. Defaults to the folder basename. |

**Response (200)**:
```json
{
  "projectName": "FlashFusion",
  "context": "# --- project/CLAUDE.md ---\n\n...",
  "files": ["project/CLAUDE.md", "project/README.md", "drive/CLAUDE.md"]
}
```

**Error (400 -- validation failure)**:
```json
{
  "error": "Invalid request",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      { "path": "projectPath", "message": "is required" }
    ]
  }
}
```

**Error (403 -- path outside drive root)**:
```json
{
  "error": "projectPath is outside the allowed drive root",
  "code": "SECURITY_ERROR"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/context \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "D:\\01_Homebase\\01_Source-of-Truth\\FlashFusion"}'
```

---

## GET /api/setup/scan

Performs a deep recursive scan of the D:\ drive. Checks for missing index files, orphaned root items, stale projects, unsorted items, large files (>50 MB), empty directories, and missing governance files. Results are cached for 10 minutes.

**Security**: Wrapped with `withErrorHandling`.

**Response (200)**:
```json
{
  "results": [
    {
      "type": "missing-index",
      "path": "D:\\01_Homebase\\SomeFolder",
      "severity": "warning",
      "details": "Subfolder \"01_Homebase/SomeFolder\" is missing _INDEX.md"
    },
    {
      "type": "large-file",
      "path": "D:\\04_Media\\Videos\\recording.mp4",
      "severity": "info",
      "details": "File is 250.5 MB",
      "size": 262668288,
      "lastModified": "2026-01-15T08:30:00.000Z"
    }
  ],
  "scannedAt": "2026-03-08T12:00:00.000Z",
  "totalIssues": 15,
  "bySeverity": { "info": 5, "warning": 7, "action": 3 },
  "byType": {
    "missing-index": 4,
    "orphaned": 2,
    "stale": 1,
    "unsorted": 3,
    "large-file": 3,
    "empty-dir": 1,
    "missing-governance": 1
  }
}
```

**Scan Issue Types**:

| Type | Severity | Description |
|------|----------|-------------|
| `missing-index` | warning | Numbered folder or subfolder lacks `_INDEX.md` |
| `orphaned` | info | Root item does not match the `##_Name` pattern |
| `stale` | warning | Active project with no modifications in 30+ days |
| `unsorted` | action | Item in Downloads, Documentation, or NeedsSorting |
| `large-file` | info | File exceeds 50 MB threshold (top 20 shown) |
| `empty-dir` | info | Directory with zero children (checked 2 levels deep) |
| `missing-governance` | action | Required governance file is missing from 00_Core |

**Example**:
```bash
curl http://localhost:3000/api/setup/scan
```

---

## POST /api/setup/suggestions

Takes scan results and generates rule-based suggestions for resolving issues.

**Security**: Zod validation (`SuggestionsRequestSchema`), wrapped with `withErrorHandling`.

**Request Body** (validated by `SuggestionsRequestSchema`):
```json
{
  "results": [
    {
      "type": "unsorted",
      "path": "D:\\07_Downloads\\report.pdf",
      "severity": "action",
      "details": "Unsorted item \"report.pdf\" in Downloads"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `results` | `ScanResult[]` | Yes | Array of scan results to generate suggestions for. |

Each `ScanResult` must include:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `ScanIssueType` | Yes | One of the 7 issue types (see table above). |
| `path` | string | Yes | Filesystem path of the issue. |
| `severity` | `"info" \| "warning" \| "action"` | Yes | Issue severity level. |
| `details` | string | Yes | Human-readable description. |
| `size` | number | No | File size in bytes (for large-file issues). |
| `lastModified` | string | No | ISO date string of last modification. |

**Response (200)**:
```json
[
  {
    "id": "suggestion-1",
    "title": "Move report.pdf to Documentation",
    "description": "PDF files belong in 08_Documentation/Documents",
    "action": "move",
    "source": "D:\\07_Downloads\\report.pdf",
    "destination": "D:\\08_Documentation\\Documents",
    "confidence": "high"
  }
]
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/setup/suggestions \
  -H "Content-Type: application/json" \
  -d '{"results": [{"type": "unsorted", "path": "D:\\07_Downloads\\report.pdf", "severity": "action", "details": "Unsorted item"}]}'
```

---

## POST /api/setup/action

Executes a file system action. Supports four operations: move, create-index, archive, and delete. All actions are logged to `.walkthrough-log.json` for undo reference and both scanner caches are invalidated after execution.

**Security**: Zod validation (`ActionRequestSchema`), path validation (`assertUnderDriveRoot` on source and destination), source existence check, wrapped with `withErrorHandling`.

**Request Body** (validated by `ActionRequestSchema`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"move" \| "create-index" \| "archive" \| "delete"` | Yes | The operation to perform. |
| `source` | string | Yes | Source path. Must be under D:\. Must exist. |
| `destination` | string | No | Destination path. Required for `move`. Must be under D:\. |

### Action: `move`

Moves the source file/folder into the destination directory.

```json
{
  "action": "move",
  "source": "D:\\07_Downloads\\report.pdf",
  "destination": "D:\\08_Documentation\\Documents"
}
```

Response:
```json
{
  "success": true,
  "message": "Moved report.pdf to D:\\08_Documentation\\Documents"
}
```

### Action: `create-index`

Creates an `_INDEX.md` file in the source directory listing all its contents.

```json
{
  "action": "create-index",
  "source": "D:\\01_Homebase\\SomeFolder"
}
```

Response:
```json
{
  "success": true,
  "message": "Created _INDEX.md in SomeFolder with 12 entries"
}
```

### Action: `archive`

Moves a project from an `Active/` directory to an `Archive/` directory, prepending the current date to the folder name. The source path must contain `/Active/` in its path.

```json
{
  "action": "archive",
  "source": "D:\\01_Homebase\\03_Projects\\Projects\\Active\\old-project"
}
```

Response:
```json
{
  "success": true,
  "message": "Archived old-project to D:\\01_Homebase\\03_Projects\\Projects\\Archive\\2026-03-08_old-project"
}
```

### Action: `delete`

Permanently removes the source file or directory (recursive). Use with caution.

```json
{
  "action": "delete",
  "source": "D:\\01_Homebase\\temp-folder"
}
```

Response:
```json
{
  "success": true,
  "message": "Deleted D:\\01_Homebase\\temp-folder"
}
```

### Error Responses

**400 -- Validation error** (missing required fields):
```json
{
  "error": "Invalid request",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [{ "path": "source", "message": "source is required" }]
  }
}
```

**403 -- Security error** (path outside drive root):
```json
{
  "error": "source is outside the allowed drive root",
  "code": "SECURITY_ERROR"
}
```

**404 -- Not found** (source does not exist):
```json
{
  "error": "Source not found: D:\\nonexistent",
  "code": "NOT_FOUND"
}
```

**409 -- Mutation conflict** (concurrent operation on same path):
```json
{
  "error": "A mutation is already in progress for this path",
  "code": "MUTATION_CONFLICT"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/setup/action \
  -H "Content-Type: application/json" \
  -d '{"action": "create-index", "source": "D:\\01_Homebase\\SomeFolder"}'
```

---

## POST /api/setup/update

Updates governance documents (TODO.md and CHANGELOG.md) based on the latest deep scan results. Adds discovered issues as TODO items and appends a changelog entry with the scan summary.

**Security**: Body parsing via `safeParseBody`, wrapped with `withErrorHandling`.

**Request Body**:
```json
{
  "actions": [
    {
      "action": "move",
      "source": "D:\\07_Downloads\\report.pdf",
      "destination": "D:\\08_Documentation\\Documents",
      "title": "Move report.pdf"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actions` | `ActionEntry[]` | No | List of actions that were taken during the walkthrough session. Used for the changelog entry count. |

Each `ActionEntry`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Action type that was performed. |
| `source` | string | Yes | Source path. |
| `destination` | string | No | Destination path (for moves). |
| `title` | string | No | Display title. |

**Response (200)**:
```json
{
  "success": true,
  "updated": ["TODO.md", "CHANGELOG.md"]
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/setup/update \
  -H "Content-Type: application/json" \
  -d '{"actions": []}'
```

---

## Error Response Format

All API errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body failed Zod validation or business rule check |
| `SECURITY_ERROR` | 403 | Path validation failed (traversal, null bytes, etc.) |
| `NOT_FOUND` | 404 | Requested resource does not exist on the filesystem |
| `MUTATION_CONFLICT` | 409 | Another mutation is in progress for the same path |
| `DRIVE_UNAVAILABLE` | 503 | D:\ drive is not accessible |
| `INTERNAL_ERROR` | 500 | Unexpected server error (details hidden in production) |

### Security Notes

- **No stack traces**: Production error responses never include stack traces. Only known `AppError` subclasses expose their messages; unknown errors produce `"An internal error occurred"`.
- **Path validation**: All endpoints that accept filesystem paths enforce `assertUnderDriveRoot()`, which checks for empty paths, null bytes, excessive length (>500 chars), and path traversal.
- **Rate limiting**: Mutation endpoints use an in-memory rate limiter (30 requests per 60 seconds per key). Exceeding the limit returns HTTP 429.
- **Input validation**: All POST request bodies are validated against Zod schemas. Invalid JSON is caught by `safeParseBody()`.

## Related Documentation

- [Setup Guide](./setup-guide.md) -- Getting started
- [Architecture](./architecture.md) -- System design and data flow
- [Testing](./testing.md) -- Test strategy and patterns
- [Edge Cases](./edge-cases.md) -- Graceful degradation scenarios
