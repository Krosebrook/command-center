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

Playwright automatically builds and starts the production server before running tests. The web server configuration in `playwright.config.ts` runs `npm run build && npm run start` and waits for `http://localhost:3000` to be available.

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
+-- navigation.spec.ts
+-- dashboard.spec.ts
+-- projects.spec.ts
+-- agents.spec.ts
+-- automations.spec.ts
+-- cleanup.spec.ts
+-- launch.spec.ts
+-- setup.spec.ts
```

Convention: `<page-name>.spec.ts` named after the page or feature under test.

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

E2E tests verify full user flows in a real browser.

### Page Navigation

```typescript
test("navigates to all pages", async ({ page }) => {
  const routes = ["/", "/projects", "/agents", "/automations",
                  "/cleanup", "/launch", "/setup"];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
});
```

### API Testing

```typescript
test("health endpoint returns status", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json).toHaveProperty("status");
});
```

### Responsive Testing

Playwright is configured with two projects: Desktop Chrome and Mobile Chrome (Pixel 5). Every test runs in both viewports automatically. This verifies that the sidebar collapses on mobile and content reflows correctly.

### Accessibility

```typescript
test("skip to content link works", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.locator("text=Skip to content");
  if (await skipLink.isVisible()) {
    await skipLink.click();
    await expect(page.locator("#main-content")).toBeFocused();
  }
});
```

### Graceful Degradation

```typescript
test("handles drive unavailable gracefully", async ({ page }) => {
  await page.goto("/");
  // Page should not show error boundary
  await expect(page.locator("h1")).toBeVisible();
});
```

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
5. Remember: the dev server must be running or the config will start one.

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

## Related Documentation

- [Setup Guide](./setup-guide.md) -- Getting started
- [Architecture](./architecture.md) -- System design and data flow
- [API Reference](./api-reference.md) -- All API endpoints
- [Edge Cases](./edge-cases.md) -- Graceful degradation scenarios
