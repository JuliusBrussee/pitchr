# Testing Patterns

**Analysis Date:** 2026-03-04

## Test Framework

**Runner:**
- Vitest `^4.0.18` (`package.json`).
- Config file: `vitest.config.ts`.
- Environment: `jsdom` with globals enabled in `vitest.config.ts`.
- Setup file: `vitest.setup.ts` (loads `@testing-library/jest-dom/vitest`).

**Assertion Library:**
- Vitest `expect` matchers (`toBe`, `toEqual`, `toThrow`, `rejects`, etc.).
- DOM-specific matchers from `@testing-library/jest-dom` in component tests.

**Run Commands:**
```bash
yarn test                                         # Runs Vitest once (package.json -> vitest run)
yarn test:watch                                  # Runs Vitest in watch mode
yarn vitest run tests/pitchController.test.ts    # Run a single test file
yarn vitest run services/__tests__/analysisService.test.ts

# E2E (Playwright, separate from Vitest)
yarn playwright test tests/e2e/smoke.spec.ts
```

## Test File Organization

**Where tests live:**
- Root integration/unit suites in `tests/*.test.ts(x)` (examples: `tests/pitchController.test.ts`, `tests/analytics-page.test.tsx`).
- Service tests in `services/__tests__/*.test.ts` and `services/miro/__tests__/*.test.ts`.
- Library tests in `lib/**/__tests__/*.test.ts`.
- Component tests under `views/components/**/__tests__/*.test.tsx`.
- E2E tests in `tests/e2e/*.spec.ts` (`tests/e2e/smoke.spec.ts`, `tests/e2e/head-tracking.spec.ts`).

**Naming:**
- Unit/integration style: `*.test.ts` / `*.test.tsx`.
- Browser E2E: `*.spec.ts`.
- Integration emphasis may be encoded in filename (`services/miro/__tests__/miroService.integration.test.ts`, `services/__tests__/billingService.credit.test.ts`).

**Important inclusion rule:**
- `vitest.config.ts` includes tests in `lib/**`, `services/**`, `views/**`, and `tests/**`.
- `hooks/__tests__/useSTT.test.ts` exists but does not match current `include` globs, so hook tests should be placed in included paths (typically `tests/`) unless config is updated.

## Test Structure

**Suite organization:**
- Common pattern is nested `describe` + behavior-focused `it` blocks.
- Most files explicitly import test APIs from `vitest` even though globals are enabled (examples: `tests/pitchController.test.ts`, `services/__tests__/analysisService.test.ts`).

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('moduleName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles expected behavior', async () => {
    // arrange
    // act
    // assert
  });
});
```

**Setup/teardown patterns:**
- `beforeEach` resets mocks/state (`vi.clearAllMocks()` or `vi.restoreAllMocks()`).
- `afterEach` restores globals/env where needed (`vi.unstubAllGlobals()`, env var resets) in `services/__tests__/realtimeChecklistService.test.ts` and `tests/openrouter-retry.test.ts`.
- Timer-driven logic uses fake timers (`vi.useFakeTimers`, `vi.setSystemTime`) in `tests/useSessionState.test.ts` and `services/__tests__/arena.test.ts`.

## Mocking

**Framework:**
- Vitest mocks via `vi.mock`, `vi.fn`, `vi.spyOn`, `vi.mocked`, `vi.stubGlobal`.

**Module mocking:**
- Module-level dependency mocks at file top are standard (examples: `tests/pitchController.test.ts`, `services/__tests__/analysisService.test.ts`).

```ts
vi.mock('@/services/runService', () => ({
  insertRun: vi.fn(),
}));

vi.mocked(insertRun).mockResolvedValue({ id: 'run-1' } as any);
```

**Global/API mocking:**
- `fetch` and browser/runtime globals are stubbed directly for service/hook tests:
  - `vi.stubGlobal('fetch', ...)` in `services/__tests__/realtimeChecklistService.test.ts`.
  - `vi.stubGlobal('WebSocket', ...)` in `hooks/__tests__/useSTT.test.ts`.
  - `global.fetch = fetchMock as unknown as typeof fetch` in `tests/openrouter-retry.test.ts`.

**What gets mocked:**
- External boundaries: HTTP/fetch, Supabase/service adapters, queueing layers, websocket/audio/browser APIs.
- LLM providers and integrations (examples: `lib/llm/__tests__/router.test.ts`, `services/miro/__tests__/miroService.integration.test.ts`).

**What is usually not mocked:**
- Pure domain helpers and local transform logic under direct test (e.g., scoring/normalization behavior assertions in `services/__tests__/analysisService.test.ts`).

## Fixtures and Factories

**Current approach:**
- Most suites use inline fixtures/constants and helper builders in the same file.
- Examples:
  - `baseScoringContext(...)` in `services/__tests__/analysisService.test.ts`.
  - `makeState(...)`, `makeProvider(...)` in `services/miro/__tests__/miroService.integration.test.ts`.

**Shared fixture assets:**
- JSON fixture data lives in `tests/fixtures/pitches/sample-fixture-001.json`.
- Static config/seed imports are common (`config/sampleResult.ts`, `config/realtimeChecklist.ts`) instead of large inline blobs.

## Coverage

**Requirements:**
- No enforced line/branch/function coverage thresholds are configured.
- No dedicated `test:coverage` script exists in `package.json`.

**Practical guidance:**
- Treat coverage as risk-based: add/expand tests for service logic, validation, queueing, billing, and router fallback paths first (`services/**`, `controllers/**`, `lib/llm/**`).

## Test Types

**Unit tests:**
- Focus on single functions/modules with dependencies mocked.
- Examples: `tests/pitchController.test.ts`, `tests/openrouter-retry.test.ts`, `services/__tests__/scoringService.test.ts`.

**Integration-style tests (within Vitest):**
- Exercise multi-module behavior with in-memory/mock boundary adapters.
- Examples: `services/miro/__tests__/miroService.integration.test.ts`, `services/__tests__/billingService.credit.test.ts`.

**Component/hook tests:**
- React Testing Library with `render`, `renderHook`, `act`, `waitFor`, and role-driven queries.
- Examples: `tests/analytics-page.test.tsx`, `views/components/__tests__/ProjectSelect.test.tsx`, `tests/useSessionState.test.ts`.

**E2E tests:**
- Playwright config in `playwright.config.ts`; specs in `tests/e2e`.
- Browser runs with camera/microphone permissions and fake media stream flags.
- `webServer.command` is currently `npm run dev` in `playwright.config.ts` (note the repo standard elsewhere is `yarn`).

## Common Patterns

**Async success/failure assertions:**
```ts
await expect(asyncFn()).rejects.toThrow('Invalid mode');
await expect(provider.complete(req)).rejects.toThrow('bad request');
```
- Seen in `tests/pitchController.test.ts` and `tests/openrouter-retry.test.ts`.

**Hook testing:**
```ts
const { result } = renderHook(() => useSessionState());
act(() => result.current.startSession('vc_pitch'));
```
- Seen in `tests/useSessionState.test.ts` and `hooks/__tests__/useSTT.test.ts`.

**Component interaction testing:**
```ts
render(<ProjectSelect ... />);
fireEvent.click(screen.getByRole('combobox', { name: 'Project type' }));
```
- Seen in `views/components/__tests__/ProjectSelect.test.tsx`.

**No snapshot testing convention:**
- Snapshot assertions (`toMatchSnapshot`, `toMatchInlineSnapshot`) are effectively absent in current tests.
- Prefer explicit assertions for payloads, text, role visibility, and call arguments.

## Practical Do/Don’t for New Tests

- Do keep new test files under paths included by `vitest.config.ts` (prefer `tests/` for new hook-heavy tests unless include globs are expanded).
- Do reset mocks/globals/env per test to avoid cross-test leakage.
- Do mock network and third-party boundaries; keep business logic assertions concrete.
- Don’t rely on snapshots as primary verification in this repo.
- Don’t add `npm` test commands in docs or scripts; use `yarn` for project workflows.

---

*Testing analysis: 2026-03-04*
*Update when test patterns change*
