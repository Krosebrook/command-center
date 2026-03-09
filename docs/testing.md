# Command Center -- Testing

## Testing Strategy

Command Center uses a two-tier testing approach:

1. **Unit and Integration Tests** -- Vitest with Testing Library for fast, isolated testing of library functions and React components.
2. **End-to-End Tests** -- Playwright for full browser-based testing of page navigation, API responses, responsive layouts, and accessibility.

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Watch mode (re-runs on file changes)
npm test

# Single run (CI-friendly)
npm run test:run

# With V8 coverage report
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Install browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Interactive UI mode (useful for debugging)
npm run test:e2e:ui
```

Playwright requires a running dev server on port 3000. Start it with `npm run dev` before running E2E tests.

## Configuration

### Vitest (`vitest.config.mts`)

```typescript
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**"],
      exclude: ["src/test/**"],
    },
  },
});
```

Key details:
- **Environment**: `jsdom` for DOM simulation
- **Globals**: `true` -- `describe`, `it`, `expect` are available without imports (though explicit imports are used for clarity)
- **Setup file**: `src/test/setup.ts` runs before every test file

### Playwright (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
});
```

Key details:
- **Test directory**: `e2e/`
- **Browser projects**: Desktop Chrome and Mobile Chrome (Pixel 5)
- **Tracing**: Enabled on first retry for debugging failures
- **Screenshots**: Captured only on failure

## Test File Locations and Naming

### Unit / Integration Tests

Tests live in `__tests__/` directories next to the code they test:

```
src/
+-- lib/
|   +-- __tests__/
|       +-- utils.test.ts
|       +-- errors.test.ts
|       +-- security.test.ts
|       +-- parser.test.ts
|       +-- suggestions.test.ts
|       +-- validation.test.ts
|       +-- logger.test.ts
|       +-- api-utils.test.ts
+-- components/
    +-- __tests__/
    |   +-- ProjectCard.test.tsx
    |   +-- AgentCard.test.tsx
    |   +-- DriveHealthBar.test.tsx
    |   +-- ScanResults.test.tsx
    |   +-- NavSidebar.test.tsx
    +-- ui/
        +-- __tests__/
            +-- Button.test.tsx
            +-- Badge.test.tsx
            +-- EmptyState.test.tsx
```

Convention: `<module-name>.test.ts` for library code, `<ComponentName>.test.tsx` for React components.

### E2E Tests

E2E tests live in the top-level `e2e/` directory:

```
e2e/
+-- navigation.spec.ts      # Page routing and sidebar navigation
+-- dashboard.spec.ts       # Dashboard content and sections
+-- projects.spec.ts        # Projects page rendering
+-- agents.spec.ts          # Agents page rendering
+-- automations.spec.ts     # Automations page rendering
+-- cleanup.spec.ts         # Cleanup page and ARIA progress bars
+-- launch.spec.ts          # AI launcher page
+-- setup.spec.ts           # Setup walkthrough page
+-- api.spec.ts             # API endpoint validation and security
+-- responsive.spec.ts      # Responsive layout and mobile menu
+-- accessibility.spec.ts   # ARIA landmarks, lang, headings, focus
```

Convention: `<page-name>.spec.ts` named after the page or feature under test.

### Current Test Counts

| Suite | Tests | Status |
|-------|-------|--------|
| Vitest (lib) | 134 | Passing |
| Vitest (components) | 77 | Passing |
| Playwright E2E | 48 | Passing |
| **Total** | **259** | **All passing** |

## Test Setup (`src/test/setup.ts`)

The setup file runs before every Vitest test and handles three things:

1. **jest-dom matchers**: Imports `@testing-library/jest-dom/vitest` so you can use matchers like `toBeInTheDocument()`, `toHaveTextContent()`, etc.
2. **Automatic cleanup**: Calls `cleanup()` from Testing Library after each test to unmount rendered components.
3. **Next.js router mock**: Mocks `next/navigation` so components that use `useRouter`, `usePathname`, or `useSearchParams` work without a real Next.js runtime.

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
```

## Mocking Patterns

### Mocking `next/navigation`

Already handled globally in the setup file. If a specific test needs a different pathname:

```typescript
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/projects",  // Override for this test file
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mocking the Config Module

Library code often imports `DRIVE_ROOT` from config. Tests mock it with a safe test path:

```typescript
vi.mock("../config", () => ({
  DRIVE_ROOT: "/test-drive",
}));
```

This must appear before importing the module under test, since `vi.mock` is hoisted by Vitest.

### Mocking `fs`

For tests that exercise filesystem operations, mock `fs/promises`:

```typescript
vi.mock("fs/promises", () => ({
  default: {
    readdir: vi.fn().mockResolvedValue([]),
    access: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ isFile: () => true, size: 100 }),
    readFile: vi.fn().mockResolvedValue("# Content"),
  },
}));
```

## Component Testing Approach

Components are tested using the render-query-assert pattern from Testing Library:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "../ProjectCard";

describe("ProjectCard", () => {
  const defaultProps = {
    name: "TestProject",
    path: "D:\\test\\project",
    description: "A test project",
    techStack: ["React", "TypeScript"] as const,
    status: "active" as const,
  };

  it("renders project name", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("TestProject")).toBeInTheDocument();
  });

  it("renders tech stack badges", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("handles empty tech stack", () => {
    render(<ProjectCard {...defaultProps} techStack={[]} />);
    expect(screen.getByText("TestProject")).toBeInTheDocument();
  });
});
```

### Guidelines

- Use `screen.getByText()` and `screen.getByRole()` for queries (prefer accessible queries).
- Use `screen.queryByText()` when asserting that something is **not** present.
- Define `defaultProps` at the top of each describe block, then override individual props per test.
- Test both the happy path and edge cases (empty arrays, missing optional props, different status values).

## E2E Testing Approach

E2E tests use Playwright's HTTP `request` fixture to fetch pages and inspect HTML structure. This avoids the need for browser launch (and system GUI libraries) in WSL2. Tests validate responses, HTML content, API behavior, and accessibility properties.

### Page Testing (request-based)

```typescript
test.describe("Navigation", () => {
  test("navigates to all pages", async ({ request }) => {
    const routes = ["/", "/projects", "/agents", "/automations",
                    "/cleanup", "/launch", "/setup"];
    for (const route of routes) {
      const response = await request.get(route);
      expect([200, 500]).toContain(response.status());
      if (response.ok()) {
        const body = await response.text();
        expect(body).toMatch(/<h1[\s>]/i);
      }
    }
  });
});
```

### API Testing

```typescript
test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  const json = await response.json();
  expect(json).toHaveProperty("status");
});
```

### Graceful Degradation

Tests accept both 200 and 500 status codes, verifying that:
- Successful responses contain expected HTML structure
- Error responses still return content (not blank pages)
- API endpoints return appropriate error codes for invalid input

## Writing New Tests

### Adding a Unit Test

1. Create a file at `src/lib/__tests__/<module>.test.ts` or `src/components/__tests__/<Component>.test.tsx`.
2. Import `describe`, `it`, `expect` from `vitest`.
3. Mock dependencies before importing the module under test.
4. Write focused tests -- one assertion per test when practical.

### Adding an E2E Test

1. Create a file at `e2e/<feature>.spec.ts`.
2. Import `test` and `expect` from `@playwright/test`.
3. Use `test.describe()` to group related tests.
4. Use `page.goto()` to navigate, then assert on visible elements.
5. Use the `request` fixture for HTTP-based tests; use `page` fixture only when browser rendering is needed and system libraries are available.
6. Start the dev server (`npm run dev`) before running E2E tests.

## Coverage

### Checking Coverage

```bash
npm run test:coverage
```

This generates a V8 coverage report. The coverage configuration includes:

- **Included**: `src/lib/**`, `src/components/**`
- **Excluded**: `src/test/**` (setup files)

### Coverage Targets

Aim for meaningful coverage rather than a specific percentage. Focus on:

- All error paths in library functions
- All branches in utility functions
- Component rendering with different prop combinations
- Edge cases documented in [edge-cases.md](./edge-cases.md)

## Untested Code

The following files have **zero test coverage**. See [Technical Debt](./technical-debt.md) for details:

- `src/lib/db.ts`, `src/lib/embeddings.ts`, `src/lib/vector-store.ts`, `src/lib/chunker.ts`
- `src/lib/auth.ts`, `src/lib/git-utils.ts`, `src/lib/watcher.ts`, `src/lib/monitor.ts`
- `src/components/SemanticSearch.tsx`, `src/components/ChatSidebar.tsx`, `src/components/AnalyticsCharts.tsx`, `src/components/AutomationRunner.tsx`
- `src/app/login/page.tsx`, `src/middleware.ts`
- All API routes under `/api/auth/`, `/api/analytics`, `/api/chat`, `/api/git`, `/api/search`, `/api/webhooks/`, `/api/automations/execute`, `/api/automations/status/`, `/api/setup/index-vectors`, `/api/setup/watcher-status`

## Related Documentation

- [Setup Guide](./setup-guide.md) -- Getting started
- [Architecture](./architecture.md) -- System design and data flow
- [API Reference](./api-reference.md) -- All API endpoints
- [Edge Cases](./edge-cases.md) -- Graceful degradation scenarios
- [Technical Debt](./technical-debt.md) -- Broken/untested features and action plan
