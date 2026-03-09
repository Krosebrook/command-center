# Command Center

Local Next.js dashboard serving as the visual Golden Thread for the D:\ drive.

## Tech Stack
- Next.js 15 + React 19 + TypeScript (strict mode)
- Tailwind CSS (dark HUD theme with CSS custom properties)
- Zod for API input validation
- Server Components for file system scanning
- Client Components for interactive pages (AI Launcher, Setup Walkthrough)
- API routes for scanning, context generation, and drive maintenance

## Architecture
- `src/lib/config.ts` -- Drive path configuration, project definitions, sort rules, governance file paths
- `src/lib/scanner.ts` -- Shallow file system scanning with 5-minute cache, drive accessibility check
- `src/lib/deep-scanner.ts` -- Recursive deep scanner with 10-minute cache, graceful degradation
- `src/lib/suggestions.ts` -- Rule-based suggestion engine for scan issues
- `src/lib/parser.ts` -- Markdown table parser for AGENTS.md, TODO.md
- `src/lib/utils.ts` -- cn(), formatBytes(), formatDate(), timeAgo(), basename()
- `src/lib/errors.ts` -- Structured error types (AppError, ValidationError, NotFoundError, SecurityError, DriveUnavailableError)
- `src/lib/security.ts` -- Path validation (isUnderDriveRoot, assertUnderDriveRoot), rate limiting, safe body parsing
- `src/lib/logger.ts` -- Structured logging (JSON in prod, dev-friendly in dev)
- `src/lib/api-utils.ts` -- withErrorHandling wrapper, jsonSuccess helper
- `src/lib/validation.ts` -- Zod schemas for all API request bodies
- `src/lib/types.ts` -- Shared TypeScript types across all layers

## UI Components
- `src/components/ui/` -- Shared primitives (Button, Badge, Card, Skeleton, EmptyState, Toast)
- `src/components/NavSidebar.tsx` -- Responsive sidebar with mobile hamburger menu
- `src/components/ProjectCard.tsx` -- Project display card with status indicators
- `src/components/AgentCard.tsx` -- Agent registry card
- `src/components/DriveHealthBar.tsx` -- Drive usage visualization with ARIA
- `src/components/ScanResults.tsx` -- Collapsible scan results with severity badges
- `src/components/SuggestionCard.tsx` -- Suggestion card with accept/dismiss/execute states
- `src/components/ContextPreview.tsx` -- AI context bundle preview with clipboard copy
- `src/components/SetupStepper.tsx` -- Setup wizard progress indicator

## Key Pages
- `/` -- Dashboard with drive health, project cards, quick links
- `/projects` -- Project explorer reading _INDEX.md files
- `/agents` -- Agent registry parsed from D:\00_Core\AGENTS.md
- `/automations` -- Automation library from D:\01_Homebase\02_Automations\
- `/launch` -- AI workspace context bundle generator
- `/cleanup` -- Cleanup tracker with disk usage and todo progress
- `/setup` -- Drive Walkthrough: 4-step wizard (Scan → Review → Execute → Update)

## API Routes
- `GET /api/health` -- Health check (drive accessibility, uptime)
- `GET /api/scan` -- Shallow drive scan
- `GET /api/stats` -- Combined drive stats + todo counts
- `POST /api/context` -- Generate context bundle (Zod validated)
- `GET /api/setup/scan` -- Deep recursive drive scan
- `POST /api/setup/suggestions` -- Generate suggestions from scan (Zod validated)
- `POST /api/setup/action` -- Execute action (move/create-index/archive/delete) (Zod validated, path-secured)
- `POST /api/setup/update` -- Update TODO.md and CHANGELOG.md

## Design System
- Theme: Dark HUD / Mission Control aesthetic
- CSS classes: `hud-card`, `nav-glow`, `stat-value`, `text-glow`, `shimmer`, `stagger-children`, `dot-grid`
- Color tokens via CSS custom properties (--primary, --background, --card, etc.)
- Fonts: DM Sans (body), JetBrains Mono (code/labels)
- All components support responsive layouts (mobile-first)
- Accessibility: ARIA attributes, focus-visible rings, skip-to-content, prefers-reduced-motion

## Security
- Path traversal protection via assertUnderDriveRoot() on all file system API routes
- Zod validation on all POST request bodies
- Safe error responses (no stack traces leaked to client)
- Rate limiting on mutation endpoints
- Structured logging for audit trail

## Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Unfinished Features (See docs/technical-debt.md)

A second layer of features was added externally and is in various states of broken/untested.
**9 files have syntax errors** (escaped template literals) that cause `npx tsc --noEmit` to fail.
The dev server still works because Next.js compiles on-demand.

### Feature Clusters (all untested, some broken)
- **Auth system**: `src/lib/auth.ts` (BROKEN), `src/middleware.ts`, `src/app/login/`, `src/app/api/auth/`
- **SQLite DB**: `src/lib/db.ts` -- scan history, embeddings, job queue via `better-sqlite3`
- **RAG Search**: `src/lib/embeddings.ts`, `src/lib/vector-store.ts`, `src/lib/chunker.ts` (BROKEN), `src/components/SemanticSearch.tsx`
- **AI Chat**: `src/app/api/chat/route.ts` (BROKEN), `src/components/ChatSidebar.tsx` (BROKEN) -- OpenAI streaming + tool calling
- **Automation Exec**: `src/app/api/automations/execute/route.ts` (BROKEN), `src/components/AutomationRunner.tsx` (BROKEN) -- runs arbitrary scripts via exec()
- **Webhooks**: `src/app/api/webhooks/trigger/route.ts` (BROKEN) -- external trigger for automation
- **Analytics**: `src/app/api/analytics/route.ts`, `src/components/AnalyticsCharts.tsx` (BROKEN)
- **Git Status**: `src/lib/git-utils.ts`, `src/app/api/git/route.ts` -- functional, no tests
- **File Watcher**: `src/lib/watcher.ts` (BROKEN), `src/app/api/setup/watcher-status/route.ts`
- **Background Monitor**: `src/instrumentation.ts`, `src/lib/monitor.ts` -- 10-min scan interval

### Additional Env Vars (undocumented in setup guide)
- `ADMIN_PASSWORD` -- auth system master password
- `SESSION_SECRET` -- HMAC signing key (falls back to ADMIN_PASSWORD)
- `OPENAI_API_KEY` -- required for chat endpoint
- `WEBHOOK_SECRET` -- required for webhook trigger endpoint

## Notes
- All file system scanning happens server-side only
- SQLite database at `D:\.command-center/metrics.db` used by new features (not core app)
- Client components must NOT import Node.js `path` module -- use basename() from utils
- Scanners return safe empty results on drive unavailability (graceful degradation)
- Setup actions are logged to `.walkthrough-log.json` for undo reference
- `serverExternalPackages: ["better-sqlite3"]` in next.config.ts prevents webpack bundling issues
