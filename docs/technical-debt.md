# Command Center -- Technical Debt & Unfinished Features

Last updated: 2026-03-09

This document catalogs externally-added features that are incomplete, broken, or untested. The **core app** (dashboard, 7 pages, 8 API routes, 259 tests) is stable. Everything below is a second layer added on top that needs decisions and work before it's production-ready.

---

## Build Status

```bash
npx tsc --noEmit   # FAILS -- 9 files have syntax errors (escaped template literals)
npm run test:run   # PASSES -- 211 Vitest tests
npm run test:e2e   # PASSES -- 48 Playwright tests (request-based, WSL2 compatible)
npm run dev        # WORKS -- broken files cause compile errors only when their routes are hit
```

The dev server works because Next.js compiles on-demand. The broken files only error when their specific routes are accessed.

---

## Broken Files (Syntax Errors)

All 9 files have the same bug: **escaped template literals** (`\` + backtick instead of real backticks). TypeScript sees `\`` as an invalid character followed by an unterminated template literal.

**Fix**: Find-and-replace `\`` with actual backticks in each file. The `AutomationRunner.tsx` also has a missing `useEffect` import.

| File | Lines | Issue |
|------|-------|-------|
| `src/lib/auth.ts` | 65 | Escaped backticks on lines 32, 38 |
| `src/lib/chunker.ts` | 62 | Escaped backtick on line 36 |
| `src/lib/watcher.ts` | 145 | Escaped backticks on lines 49, 53, 59, 65, 110, 119, 128, 130, 133 |
| `src/components/AnalyticsCharts.tsx` | 110 | Escaped backticks on lines 59, 77, 83, 93 |
| `src/components/AutomationRunner.tsx` | 122 | Escaped backtick on line 19; also missing `import { useEffect } from "react"` |
| `src/components/ChatSidebar.tsx` | 194 | Escaped backticks on lines 64, 87, 88 |
| `src/app/api/chat/route.ts` | 280 | Escaped backticks throughout (lines 57, 79, 83, 95, 98, 110, 137, 142-153, 186, 217, 240, 258) |
| `src/app/api/automations/execute/route.ts` | 87 | Escaped backticks on lines 52, 72, 73, 78 |
| `src/app/api/webhooks/trigger/route.ts` | 103 | Escaped backticks on lines 61, 65, 68, 87, 89, 92 |

---

## Feature Clusters

### 1. Authentication System

**Files:**
- `src/lib/auth.ts` -- HMAC-SHA256 session token signing/verification (BROKEN)
- `src/middleware.ts` -- Edge middleware enforcing auth on all routes (FUNCTIONAL but blocks core app)
- `src/app/login/page.tsx` -- Login page with password form (FUNCTIONAL)
- `src/app/api/auth/login/route.ts` -- Login endpoint, sets HttpOnly cookie (FUNCTIONAL)
- `src/app/api/auth/logout/route.ts` -- Logout endpoint, clears cookie (FUNCTIONAL)

**Dependencies:** `ADMIN_PASSWORD` env var

**Status:** Partially broken (auth.ts syntax errors). More critically, the middleware blocks ALL routes (including `/api/health`, dashboard) unless the user has an `auth_token` cookie. This means the core app breaks if middleware runs and `ADMIN_PASSWORD` isn't set.

**Current behavior:** The middleware appears to run in dev mode, but the core app still works. This may be because the middleware's edge runtime can't import the broken `auth.ts`, or because the cookie check passes through. Needs investigation.

**Decisions needed:**
- Remove auth entirely? (It's a local-only dashboard)
- Make opt-in? (Only enforce if `ADMIN_PASSWORD` is set)
- Fix as-is? (Always enforce)

**Tests:** None

---

### 2. SQLite Database

**Files:**
- `src/lib/db.ts` -- SQLite via `better-sqlite3`, stores scan history, project embeddings, automation jobs

**Dependencies:** `better-sqlite3` (native C++ addon), creates `D:\.command-center/metrics.db`

**Status:** Functional code, but importing it anywhere in the server bundle causes webpack errors because `better-sqlite3` has native bindings. Currently mitigated by `serverExternalPackages: ["better-sqlite3"]` in `next.config.ts`, but the import chain through `instrumentation.ts -> monitor.ts -> scanner.ts` still causes issues when `scanner.ts` doesn't actually import `db.ts` -- the real issue is other routes that DO import `db.ts` directly.

**Tables:**
- `scan_history` -- Timestamped scan metrics (totalSize, totalFiles, folderCount)
- `project_health` -- Per-project git status snapshots
- `project_embeddings` -- Vector embeddings for semantic search
- `automation_jobs` -- Job queue for script execution

**Used by:** Analytics, Search/RAG, Automation execution, Chat

**Decisions needed:**
- Keep if keeping any feature that needs persistence
- Remove if removing all dependent features
- Could replace with JSON files for simpler persistence

**Tests:** None

---

### 3. RAG / Semantic Search

**Files:**
- `src/lib/embeddings.ts` -- Generates embeddings via `@xenova/transformers` (all-MiniLM-L6-v2 model, 384-dim, ~22MB download) (FUNCTIONAL)
- `src/lib/vector-store.ts` -- SQLite-backed vector storage with cosine similarity search (FUNCTIONAL)
- `src/lib/chunker.ts` -- Line-based sliding window code chunker with overlap (BROKEN -- syntax errors)
- `src/app/api/search/route.ts` -- POST endpoint for semantic search (FUNCTIONAL)
- `src/app/api/setup/index-vectors/route.ts` -- POST endpoint to index projects (shallow or deep) (FUNCTIONAL)
- `src/components/SemanticSearch.tsx` -- Client component with search box, index buttons, results display (FUNCTIONAL)

**Dependencies:** `@xenova/transformers`, `better-sqlite3`

**How it works:**
1. User clicks "Fast Index" (reads README/INDEX files) or "Deep Index" (crawls all source files)
2. Files are chunked (50-line windows with 10-line overlap)
3. Each chunk is embedded via the MiniLM model (runs locally, no API key needed)
4. Embeddings stored in SQLite
5. Search queries are embedded and compared via cosine similarity

**Status:** Mostly functional, but `chunker.ts` has syntax errors preventing deep indexing. The component itself works but isn't wired into any page layout.

**Tests:** None

---

### 4. AI Chat with Function Calling

**Files:**
- `src/app/api/chat/route.ts` -- Streaming chat endpoint using OpenAI API with RAG context and tool calling (BROKEN -- syntax errors)
- `src/components/ChatSidebar.tsx` -- Floating chat widget with streaming message display (BROKEN -- syntax errors)

**Dependencies:** `OPENAI_API_KEY` env var, OpenAI API (`gpt-4o-mini`), embeddings system

**How it works:**
1. User sends message via floating chat widget
2. Server embeds the message, searches vector store for relevant code context
3. Constructs system prompt with RAG context + tool definitions
4. Streams OpenAI response back to client via Server-Sent Events
5. If the model calls a tool (`run_automation` or `get_job_status`), the server executes it locally and loops back

**Security concern:** The chat can execute arbitrary scripts on D:\ via the `run_automation` tool. This is powerful but dangerous -- a prompt injection in indexed code could trigger script execution.

**Tests:** None

---

### 5. Automation Execution

**Files:**
- `src/app/api/automations/execute/route.ts` -- POST endpoint to run scripts/projects (BROKEN -- syntax errors)
- `src/app/api/automations/status/[jobId]/route.ts` -- GET endpoint to poll job status (FUNCTIONAL)
- `src/app/api/webhooks/trigger/route.ts` -- POST endpoint for external webhook triggers (BROKEN -- syntax errors)
- `src/components/AutomationRunner.tsx` -- Client component with run button and log display (BROKEN -- syntax errors + missing import)

**Dependencies:** `child_process.exec()`, SQLite job queue, `WEBHOOK_SECRET` env var (webhooks only)

**How it works:**
1. Client sends `targetPath` to execute endpoint
2. Server determines how to run it (npm start, node, python, bash, tsx)
3. Spawns child process, assigns job ID, stores in SQLite
4. Client polls status endpoint every 2 seconds
5. Stdout/stderr appended to job record in real-time

**Security concern:** Runs arbitrary scripts via `exec()`. Only protected by `assertUnderDriveRoot()` (must be on D:\). No allowlist, no confirmation step, no sandboxing.

**Tests:** None

---

### 6. Analytics Dashboard

**Files:**
- `src/app/api/analytics/route.ts` -- GET endpoint returning 30-day scan history from SQLite (FUNCTIONAL)
- `src/components/AnalyticsCharts.tsx` -- SVG sparkline chart of total files over time (BROKEN -- syntax errors)

**Dependencies:** SQLite scan history

**Status:** API endpoint works. The chart component renders an SVG sparkline showing file count trends. Has syntax errors preventing compilation.

**Tests:** None

---

### 7. Git Status Integration

**Files:**
- `src/lib/git-utils.ts` -- Gets branch, changes, unpushed status via `git` CLI commands (FUNCTIONAL)
- `src/app/api/git/route.ts` -- GET endpoint scanning all configured projects for git status (FUNCTIONAL)

**Dependencies:** `git` CLI available in PATH

**Status:** Fully functional, no syntax errors. Not wired into any UI component yet. Has a minor issue: imports `GET as scanRoute` from health route for no reason (line 1).

**Tests:** None

---

### 8. File System Watcher

**Files:**
- `src/lib/watcher.ts` -- Chokidar-based file watcher that re-indexes changed files (BROKEN -- syntax errors)
- `src/app/api/setup/watcher-status/route.ts` -- GET endpoint to check/start watcher (FUNCTIONAL)

**Dependencies:** `chokidar` (dynamically imported), embeddings system

**How it works:**
1. Watches all configured project directories
2. On file add/change: reads file, chunks it, generates embeddings, saves to SQLite
3. On file delete: removes embeddings from SQLite
4. Skips dotfiles, node_modules, dist, .next, and files > 500KB

**Status:** Broken due to syntax errors. Also depends on the embeddings + vector store chain.

**Tests:** None

---

## Environment Variables (Undocumented)

These env vars are used by the new features but not documented in the setup guide:

| Variable | Used By | Required? | Description |
|----------|---------|-----------|-------------|
| `ADMIN_PASSWORD` | Auth system | No (but middleware enforces if present) | Master password for login |
| `SESSION_SECRET` | Auth system | No (falls back to ADMIN_PASSWORD) | HMAC signing key for session tokens |
| `OPENAI_API_KEY` | Chat endpoint | Only for chat | OpenAI API key for gpt-4o-mini |
| `WEBHOOK_SECRET` | Webhook trigger | Only for webhooks | Shared secret for authenticating webhook requests |

---

## Dependency Additions

These packages were added for the new features:

| Package | Used By | Type | Notes |
|---------|---------|------|-------|
| `better-sqlite3` | db.ts | Native C++ addon | Causes webpack bundling issues; mitigated by `serverExternalPackages` |
| `@xenova/transformers` | embeddings.ts | ML runtime | Downloads ~22MB model on first use; runs locally |
| `lucide-react` | Multiple components | Icon library | Used by ChatSidebar, AnalyticsCharts, AutomationRunner, SemanticSearch, LoginPage |
| `chokidar` | watcher.ts | File watcher | Dynamically imported to avoid edge runtime issues |

---

## Recommended Action Plan

### Option A: Clean Slate (Remove all broken features)

Delete all files listed above. The core app is complete and tested. Re-add features intentionally when needed with proper TDD, docs, and security review.

**Pros:** Clean codebase, passing `tsc`, no security risks
**Cons:** Loses work that's 80% done

### Option B: Fix and Ship (Repair everything)

1. Fix all 9 syntax errors (escaped template literals)
2. Add missing `useEffect` import to AutomationRunner
3. Make auth opt-in (only enforce if `ADMIN_PASSWORD` is set)
4. Add tests for all new lib modules and components
5. Add tests for all new API routes
6. Update CLAUDE.md and docs with new features
7. Add env var documentation
8. Security review of exec-based endpoints

**Pros:** Feature-complete dashboard with AI capabilities
**Cons:** Significant work; exec-based endpoints need careful security design

### Option C: Selective Keep (Fix safe features, remove dangerous ones)

Keep: Analytics, Git Status, Semantic Search (read-only), SQLite
Remove: Automation Execution, Webhooks, Chat tool-calling
Make opt-in: Auth

**Pros:** Adds value without security risks
**Cons:** Loses the most powerful features

---

## Files Quick Reference

### Broken (syntax errors)
```
src/lib/auth.ts
src/lib/chunker.ts
src/lib/watcher.ts
src/components/AnalyticsCharts.tsx
src/components/AutomationRunner.tsx
src/components/ChatSidebar.tsx
src/app/api/chat/route.ts
src/app/api/automations/execute/route.ts
src/app/api/webhooks/trigger/route.ts
```

### Functional but untested
```
src/lib/db.ts
src/lib/embeddings.ts
src/lib/vector-store.ts
src/lib/git-utils.ts
src/middleware.ts
src/app/login/page.tsx
src/app/api/auth/login/route.ts
src/app/api/auth/logout/route.ts
src/app/api/analytics/route.ts
src/app/api/git/route.ts
src/app/api/search/route.ts
src/app/api/setup/index-vectors/route.ts
src/app/api/setup/watcher-status/route.ts
src/app/api/automations/status/[jobId]/route.ts
src/components/SemanticSearch.tsx
src/instrumentation.ts
src/lib/monitor.ts
```
