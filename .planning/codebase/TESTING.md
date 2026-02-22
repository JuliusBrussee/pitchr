# Testing Patterns

**Analysis Date:** 2026-02-22

## Test Framework

**Runner:**
- Vitest 4.0.18 (configured in `vitest.config.ts`)
- Environment: jsdom (for DOM testing without browser)
- Global test APIs enabled (no need to import `describe`, `it`, `expect`)

**Config File:** `vitest.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: [
      'services/**/*.test.ts',
      'services/**/*.test.tsx',
      'views/**/*.test.ts',
      'views/**/*.test.tsx',
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

**Setup File:** `vitest.setup.ts`
```typescript
import '@testing-library/jest-dom/vitest';
```

**Assertion Library:**
- Vitest built-in `expect()` API
- Testing Library for React component testing

**Run Commands:**
```bash
yarn test                # Run all tests (unit + integration, excludes e2e)
yarn test:watch        # Watch mode (inferred from package.json scripts)
```

Note: No watch or coverage commands are explicitly defined in `package.json`, but Vitest supports them via CLI.

## Test File Organization

**Location:**
- Co-located with source in `__tests__/` subdirectory
- Hook tests: `hooks/__tests__/[name].test.ts`
- Component tests: `views/components/__tests__/[name].test.tsx`
- Service tests: `services/__tests__/[name].test.ts`
- Integration/unit tests: `tests/[name].test.ts`
- E2E tests (Playwright): `tests/e2e/[name].spec.ts` (excluded from Vitest)

**Naming:**
- Unit: `[source-file].test.ts(x)`
- E2E: `[feature].spec.ts` (via Playwright)
- Example: `hooks/__tests__/useSTT.test.ts`, `views/components/__tests__/MetricsPanel.test.tsx`

**Structure:**
```
hooks/
├── useSessionState.ts
├── useMediaStream.ts
└── __tests__/
    ├── useSTT.test.ts
    └── useSessionState.test.ts (hypothetical; not present in repo)

services/
├── analysisService.ts
└── __tests__/
    ├── realtimeChecklistService.test.ts
    └── miroService.test.ts
```

## Test Structure

**Suite Organization:**

Vitest uses `describe()` blocks for grouping related tests:

```typescript
describe('realtimeChecklistService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gates evaluations using 6-10 second adaptive cadence', () => {
    expect(shouldEvaluateRealtimeChecklist({...})).toBe(false);
  });

  it('falls back to heuristic mode and keeps monotonic statuses', async () => {
    // Test async behavior
  });
});
```

**Setup/Teardown Patterns:**

- `beforeEach()`: Reset mocks before each test
  ```typescript
  beforeEach(() => {
    vi.restoreAllMocks();
    MockWebSocket.instances = [];
  });
  ```

- `afterEach()`: Clean up globals and restore original state
  ```typescript
  afterEach(() => {
    if (originalAnthropicApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicApiKey;
    }
    vi.unstubAllGlobals();
  });
  ```

- No explicit teardown for DOM; jsdom resets between tests

**Test Naming:**
- Describe block matches function/module name (e.g., `describe('useSTT')`)
- Test names describe the behavior (e.g., `it('handles realtime checklist_update and checklist_error websocket messages')`)
- Use present tense: "it handles", "it renders", "it throws"

## Mocking

**Framework:** Vitest's `vi` object (similar to Jest)

**Global Mocking:**
```typescript
vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
Object.defineProperty(window, 'AudioContext', {
  configurable: true,
  writable: true,
  value: MockAudioContext,
});
Object.defineProperty(navigator, 'mediaDevices', {
  configurable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});
```
(From `hooks/__tests__/useSTT.test.ts` lines 79-98)

**Function Mocking:**
```typescript
const onModeChange = vi.fn();
render(
  <MetricsPanel
    {...props}
    onModeChange={onModeChange}
  />,
);
fireEvent.click(screen.getByRole('button', { name: 'VC Pitch' }));
expect(onModeChange).toHaveBeenCalledWith('vc_pitch');
```
(From `views/components/__tests__/MetricsPanel.test.tsx`)

**Spy/Stub Pattern:**
```typescript
const anthropicComplete = vi
  .spyOn(AnthropicProvider.prototype, 'complete')
  .mockResolvedValue('anthropic');

expect(anthropicComplete).toHaveBeenCalledTimes(1);
```
(From `lib/llm/__tests__/router.test.ts` lines 26-38)

**Custom Mock Classes:**
- Create full mock implementations when needed (e.g., `MockWebSocket`, `MockAudioContext`)
- Restore with `vi.restoreAllMocks()` or `vi.unstubAllGlobals()`

**What to Mock:**
- Browser APIs (WebSocket, AudioContext, navigator.mediaDevices)
- External services (fetch for API calls)
- Provider classes (LLM providers, Miro providers)
- Environment variables (ANTHROPIC_API_KEY, LLM_PROVIDER)

**What NOT to Mock:**
- Utility functions (leave unmocked to test real behavior)
- Components under test (render actual component, mock children as needed)
- Built-in string methods, DOM manipulation

## Fixtures and Factories

**Test Data:**
- Inline constant fixtures at top of test file
  ```typescript
  const checklist: RealtimeChecklistItemState[] = [
    {
      id: 'intro_hook',
      label: 'Introduction & hook',
      status: 'partial',
      confidence: 0.85,
      evidence: 'My name is Alice and we solve...',
      required: true,
      lastUpdatedAt: new Date().toISOString(),
    },
  ];
  ```
  (From `views/components/__tests__/MetricsPanel.test.tsx` lines 6-16)

- Factory functions for generating test data
  ```typescript
  const sampleRequest = {
    runId: 'run_test_1',
    mode: 'vc_pitch',
    oneLineVerdict: 'Test verdict',
    rewriteScript: 'Rewrite text',
    topFixes: [...],
  };
  ```
  (From `services/miro/__tests__/miroService.test.ts` lines 6-20)

**Location:**
- Fixtures defined in test files (no separate fixture directory)
- Shared constants like `createInitialChecklistState('vc_pitch')` imported from `config/realtimeChecklist.ts`

## Coverage

**Requirements:** None explicitly enforced

**View Coverage:**
```bash
vitest run --coverage  # Generates coverage report (if coverage plugin installed)
```

Note: No coverage configuration detected in `vitest.config.ts` or `package.json`. Coverage reporter would need to be installed and configured.

**Current State:** No CI enforcing coverage thresholds; tests written for critical paths (services, hooks, components).

## Test Types

**Unit Tests:**
- Scope: Single function or hook
- Approach: Mock external dependencies, test function behavior with various inputs
- Examples:
  - `hooks/__tests__/useSTT.test.ts`: Tests hook state and WebSocket message handling
  - `services/__tests__/realtimeChecklistService.test.ts`: Tests service logic with mocked fetch

**Integration Tests:**
- Scope: Multiple modules working together
- Approach: Mock external APIs (fetch), test data flow through services and hooks
- Examples:
  - `lib/llm/__tests__/router.test.ts`: Tests routing between LLM providers
  - `services/miro/__tests__/miroService.test.ts`: Tests Miro service with mocked provider

**E2E Tests:**
- Framework: Playwright 1.58.2 (configured in `playwright.config.ts`)
- Location: `tests/e2e/[name].spec.ts`
- Run: `yarn test:e2e` (command not in package.json; Playwright CLI would be used)
- Examples: `tests/e2e/smoke.spec.ts`, `tests/e2e/head-tracking.spec.ts`
- Scope: Full user workflows (record pitch, analyze, view results)

## Common Patterns

**Async Testing:**
```typescript
it('handles realtime checklist_update websocket messages', async () => {
  const { result } = renderHook(() => useSTT());

  await act(async () => {
    await result.current.start({ mode: 'vc_pitch' });
  });

  await waitFor(() => {
    expect(result.current.isRecording).toBe(true);
  });
});
```
(From `hooks/__tests__/useSTT.test.ts` lines 105-115)

**Patterns:**
- `renderHook()` from Testing Library for hook testing
- `await act(async () => {...})` for state updates
- `await waitFor(() => {...})` for async assertions

**Error Testing:**
```typescript
it('falls back to heuristic mode on network error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

  const result = await evaluateRealtimeChecklist({
    mode: 'vc_pitch',
    transcript: '...',
    previousItems: createInitialChecklistState('vc_pitch'),
    scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
    sessionStartedAtMs: nowMs - 5_000,
    nowMs,
  });

  expect(result?.source).toBe('heuristic');
});
```
(From `services/__tests__/realtimeChecklistService.test.ts` lines 61-90)

**Patterns:**
- Stub external dependencies to simulate errors
- Assert fallback behavior or error handling
- Test both success and failure paths

**Component Testing:**
```typescript
it('calls onModeChange when mode button is clicked', () => {
  const onModeChange = vi.fn();
  render(
    <MetricsPanel
      metrics={{ wpm: 120, fillerWords: 0, wordCount: 50, durationSecs: 25, fillerRate: 0 }}
      checklist={checklist}
      insights={[]}
      isSessionActive={false}
      selectedMode="elevator"
      onModeChange={onModeChange}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'VC Pitch' }));
  expect(onModeChange).toHaveBeenCalledWith('vc_pitch');
});
```
(From `views/components/__tests__/MetricsPanel.test.tsx` lines 35-50)

**Patterns:**
- Use `render()` from Testing Library for component rendering
- Pass required props to component
- Use `screen.getByRole()`, `screen.getByText()` for element selection
- Use `fireEvent` for user interactions
- Assert mock function calls with `toHaveBeenCalledWith()`

## Data Testid Usage

**Pattern:** Not heavily used in this codebase

**Where found:** Component tests prefer role-based queries (`screen.getByRole()`, `screen.getByText()`)

**If needed:** Add `data-testid` to components for complex DOM navigation:
```typescript
render(<Component />);
expect(screen.getByTestId('metric-card')).toBeInTheDocument();
```

---

*Testing analysis: 2026-02-22*
