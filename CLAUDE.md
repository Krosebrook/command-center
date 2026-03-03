# Command Center

Local Next.js dashboard serving as the visual Golden Thread for the D:\ drive.

## Tech Stack
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS (dark theme)
- Server Components for file system scanning
- Client Components for interactive pages (AI Launcher, Setup Walkthrough)
- API routes for scanning, context generation, and drive maintenance

## Architecture
- `src/lib/config.ts` -- Drive path configuration, project definitions, sort rules, governance file paths
- `src/lib/scanner.ts` -- Shallow file system scanning with 5-minute cache
- `src/lib/deep-scanner.ts` -- Recursive deep scanner (missing indexes, stale projects, unsorted files, large files, empty dirs, orphaned items, missing governance) with 10-minute cache
- `src/lib/suggestions.ts` -- Rule-based suggestion engine that classifies scan issues into actionable recommendations (move, create-index, archive, delete)
- `src/lib/parser.ts` -- Markdown table parser for AGENTS.md, TODO.md
- `src/lib/utils.ts` -- cn(), formatBytes(), formatDate(), timeAgo()
- `src/app/` -- Next.js App Router pages
- `src/app/api/` -- API routes for scanning, context, stats, and setup actions

## Key Pages
- `/` -- Dashboard with drive health, project cards, quick links
- `/projects` -- Project explorer reading _INDEX.md files
- `/agents` -- Agent registry parsed from D:\00_Core\AGENTS.md
- `/automations` -- Automation library from D:\01_Homebase\02_Automations\
- `/launch` -- AI workspace context bundle generator
- `/cleanup` -- Cleanup tracker with disk usage and todo progress
- `/setup` -- Drive Walkthrough: 4-step wizard (Scan → Review → Execute → Update) for drive maintenance

## API Routes
- `GET /api/scan` -- Shallow drive scan (FolderInfo[])
- `GET /api/stats` -- Combined drive stats + todo counts
- `POST /api/context` -- Generate context bundle for a project path
- `GET /api/setup/scan` -- Deep recursive drive scan with issue detection
- `POST /api/setup/suggestions` -- Generate actionable suggestions from scan results
- `POST /api/setup/action` -- Execute a quick action (move, create-index, archive, delete); logs to .walkthrough-log.json
- `POST /api/setup/update` -- Update TODO.md and CHANGELOG.md with scan findings

## Components
- `NavSidebar.tsx` -- Fixed sidebar nav with inline SVG icons
- `ProjectCard.tsx`, `AgentCard.tsx`, `DriveHealthBar.tsx` -- Server/pure display components
- `ContextPreview.tsx` -- Client component for clipboard copy
- `SetupStepper.tsx` -- Horizontal step progress indicator
- `ScanResults.tsx` -- Collapsible scan results grouped by issue type with severity badges
- `SuggestionCard.tsx` -- Suggestion card with accept/dismiss buttons and execution status

## Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Notes
- All file system scanning happens server-side only
- No database -- reads directly from D:\ drive structure
- Shallow scanner caches for 5 minutes, deep scanner caches for 10 minutes
- Setup actions are logged to `.walkthrough-log.json` for undo reference
- Sort rules in `config.ts` map file extensions to destination folders (SORT_RULES)
- Governance files tracked: INDEX.md, AGENTS.md, CHANGELOG.md, QUICK-REFERENCE.md, TODO.md, CLAUDE.md

## Known Issues — Priority Order

### Critical (Security / Broken)
1. **Path traversal in `/api/setup/action`** — `source`/`destination` accept any system path; `action: "delete"` can `rm -rf` anything. Fix: validate paths are under `DRIVE_ROOT` numbered folders.
2. **Path traversal in `/api/context`** — `projectPath` reads any file on disk. Fix: validate resolves under allowed prefix.
3. **Request mismatch** — `setup/page.tsx` sends raw array to `/api/setup/suggestions`, but route expects `{ results: [...] }`. Suggestions silently return 400. Fix: wrap in `{ results }` on the client side.
4. **`archive` action silently no-ops** — if path doesn't contain "Active", `String.replace` returns unchanged path, file renamed in-place with date prefix. Fix: validate "Active" is in path or return 400.
5. **Cache not invalidated after mutations** — after `setup/action` moves/deletes files, the 5/10-min scanner cache returns stale data. Fix: export cache-clearing functions and call after mutations.

### High (Code Quality)
6. **Duplicate types in 3+ files** — `ScanResult`, `DeepScanResult`, `Suggestion`, `SuggestionStatus` defined in `deep-scanner.ts`, `suggestions.ts`, `ScanResults.tsx`, `SuggestionCard.tsx`, `setup/page.tsx`. Fix: create `src/lib/types.ts` and import everywhere.
7. **Hardcoded paths** — Dashboard (`page.tsx` lines 74-82), Agents, Launch pages all hardcode `D:\...` strings instead of using `FOLDERS`/`PROJECTS` from config.
8. **Cleanup page hardcoded history** — never reads from `.walkthrough-log.json` which the action API writes to. Dead data.
9. **Duplicate `formatDate`** in `suggestions.ts` — identical to `utils.ts` version.
10. **Duplicate `fileExists` pattern** in `action/route.ts` — reimplements instead of importing from `scanner.ts`.

### Medium
11. **SORT_RULES incomplete** — missing `.csv`, `.xlsx`, `.mp3`, `.wav`, `.svg`, `.webp`, `.webm`, `.pptx`.
12. **`formatBytes` breaks on >1TB** — `sizes` array only goes to GB.
13. **Setup wizard state lost on refresh** — all state is in-memory; no URL param persistence.
14. **`update/route.ts` bugs** — TODO deduplication appends in wrong position; CHANGELOG duplicates entry on repeated calls.
15. **`next.config.ts`** — `serverActions` under stale `experimental` wrapper.
16. **Unused dependency** — `lucide-react` installed but never imported.

### Planned Features
- Undo support via `.walkthrough-log.json` history
- Environment check panel (Node/npm/git/gh versions, .env presence, MCP config)
- Duplicate file detection across folders
- Real-time scan progress (SSE/streaming)
- Accessibility pass (aria attributes, semantic elements)
