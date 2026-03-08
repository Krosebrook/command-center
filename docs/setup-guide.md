# Command Center -- Setup Guide

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+
- **D:\ drive** mounted (Windows or WSL) -- the app reads from this drive

## Quick Start

1. Clone and install:
   ```bash
   git clone <repo-url>
   cd command-center
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

3. Production build:
   ```bash
   npm run build
   npm run start
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests in watch mode |
| `npm run test:run` | Run Vitest tests once |
| `npm run test:coverage` | Run tests with V8 coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:ui` | Run Playwright with interactive UI |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Minimum log level: debug, info, warn, error |

## Drive Structure

The app expects D:\ to contain numbered folders following this convention:

```
D:\
+-- 00_Core/          <- Governance files (INDEX.md, AGENTS.md, TODO.md, etc.)
+-- 01_Homebase/      <- Projects, automations, frameworks
+-- 02_Development/   <- Code, scripts, skills
+-- 03_INTInc/        <- Business files
+-- 04_Media/         <- Images, video, audio
+-- 05_Backups-Archive/
+-- 07_Downloads/     <- Inbox/unsorted
+-- 08_Documentation/ <- Docs
+-- 09_Anthropic/
+-- 10_Google/
+-- 11_OpenAI/
+-- 12_SoleMuchBetter/
+-- 13_Microsoft-n-Copilot/
```

### Governance Files

The app expects these files inside `D:\00_Core\`:

| File | Purpose |
|------|---------|
| `INDEX.md` | Master drive index |
| `AGENTS.md` | AI agent registry |
| `CHANGELOG.md` | Change log for drive operations |
| `QUICK-REFERENCE.md` | Quick reference guide |
| `TODO.md` | Task tracker |
| `CLAUDE.md` | AI assistant context |

These governance files are checked during deep scans. Missing files are flagged with severity `action`.

## Troubleshooting

### Drive Not Available

The app gracefully degrades when D:\ is not mounted. You will see "DRIVE OFFLINE" on the dashboard. All pages still load -- they show empty states instead of errors. The `/api/health` endpoint returns status `503` with `"status": "degraded"` when the drive is inaccessible.

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

### WSL Users

If you are running in WSL, the D:\ drive is automatically available at `/mnt/d/`. The app uses `D:\` as the root path, which Node.js resolves correctly in both native Windows and WSL environments.

### Tests Failing

- **Unit tests**: Make sure `jsdom` is available (`npm install`). Tests run in a jsdom environment with `@testing-library/react`.
- **E2E tests**: Playwright requires a running server. The config starts one automatically via `npm run build && npm run start`. Install browsers first: `npx playwright install`.

## Related Documentation

- [Architecture](./architecture.md) -- System design and data flow
- [Testing](./testing.md) -- Test strategy and patterns
- [API Reference](./api-reference.md) -- All API endpoints
- [Edge Cases](./edge-cases.md) -- Graceful degradation scenarios
