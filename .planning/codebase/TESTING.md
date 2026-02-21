# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts` at root
- Environment: jsdom (for DOM simulation in Node.js)

**Setup:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  assetsInclude: ['**/*.glsl'],
});
```

**Setup Files:**
- `vitest.setup.ts` imports `@testing-library/jest-dom/vitest` for extended matchers

**Assertion Library:**
- Vitest built-in expect() API (compatible with Jest syntax)
- Extended with Testing Library matchers from `@testing-library/jest-dom`

**Run Commands:**
```bash
npm test                    # Run all tests once
npm run test:watch        # Watch mode for development
# (vitest --watch is the underlying command)
```

## Test File Organization

**Location:**
- Co-located with source code in `__tests__/` subdirectory
- Not separate `tests/` directory for unit tests
- Example: `views/components/SiriBubble/__tests__/SiriBubble.test.tsx`

**Naming:**
- Format: `[name].test.ts` for unit tests (TypeScript)
- Format: `[name].test.tsx` for component tests (JSX/TSX)
- E2E tests stored in root `tests/e2e/` directory with `.spec.ts` extension

**File Structure by Type:**

Unit test directory:
```
views/components/SiriBubble/
├── SiriBubble.tsx
├── Orb.tsx
├── types.ts
├── constants.ts
├── useSiriBubble.ts
├── index.ts
└── __tests__/
    ├── SiriBubble.test.tsx
    ├── useSiriBubble.test.ts
    └── constants.test.ts
```

E2E tests:
```
tests/e2e/
├── smoke.spec.ts
└── head-tracking.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiriBubble } from '../SiriBubble';

describe('SiriBubble component', () => {
  it('renders without crashing', () => {
    const { container } = render(<SiriBubble state="idle" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the R3F Canvas', () => {
    render(<SiriBubble state="idle" />);
    expect(screen.getByTestId('r3f-canvas')).toBeTruthy();
  });
});
```

**Test Naming:**
- Describe blocks: Noun phrase describing the unit. Example: `'SiriBubble component'`, `'COLOR_MAP'`
- Test cases: Start with `it('...')`, describe expected behavior in plain English
- Example good names:
  - `it('renders without crashing')`
  - `it('resolves preset string sizes to pixels')`
  - `it('idle is the slowest state')`
  - `it('returns idle state and default intensity by default')`

**Setup/Teardown:**
- Use `beforeEach()` for per-test setup
- Use `afterEach()` for per-test cleanup
- Use global `beforeAll()` / `afterAll()` for expensive setup (mocking, DB init)
- Example: `vi.resetAllMocks()` in `beforeEach()` if mocks persist

## Mocking

**Framework:**
- Vitest built-in `vi` object (compatible with Jest `jest` object)
- `vi.mock()` for module mocking
- `vi.spyOn()` for function spying

**WebGL/Canvas Mocking:**
- React Three Fiber requires WebGL — not available in jsdom
- Mock with simple div fallback:
  ```typescript
  vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="r3f-canvas">{children}</div>
    ),
    useFrame: vi.fn(),
  }));
  ```
- Mock dependent components:
  ```typescript
  vi.mock('../Orb', () => ({
    Orb: () => <div data-testid="orb-mesh" />,
  }));
  ```

**Function Mocking:**
- Use `vi.fn()` to create mock functions
- Track calls: `expect(mockFn).toHaveBeenCalledWith(...)`
- Reset: `vi.clearAllMocks()` or `vi.resetAllMocks()`

**Module Mocking:**
- `vi.mock(modulePath)` auto-hoists, runs before imports
- Must use `vi.mock()` before importing module to mock
- Default export mocks require `default:` key

**What to Mock:**
- External APIs (fetch, HTTP clients)
- Heavy dependencies (Canvas, WebGL)
- Non-deterministic functions (Date, random)
- Browser APIs with side effects

**What NOT to Mock:**
- Utility functions (unless they're expensive)
- Small helper functions (easier to test real)
- Pure functions with no side effects
- Logic you're testing (defeats the purpose)

## Component Testing

**Imports:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

**Rendering:**
```typescript
// Basic render
const { container } = render(<MyComponent prop="value" />);

// Query elements
const element = screen.getByTestId('my-element');
const text = screen.getByText(/pattern/);
const button = screen.getByRole('button', { name: /click/i });
```

**Assertions:**
```typescript
expect(element).toBeTruthy();
expect(element).toHaveClass('my-class');
expect(element.style.width).toBe('100px');
expect(element).toHaveAttribute('data-testid', 'my-element');
```

**User Interactions:**
```typescript
await userEvent.click(button);
await userEvent.type(input, 'text');
```

**Test IDs:**
- Use `data-testid` for testing selectors when role/text insufficient
- Example from SiriBubble.test.tsx: `<div data-testid="r3f-canvas">`
- Good practice: selectors describe what they are, not what they do

## Hook Testing

**Imports:**
```typescript
import { renderHook, act } from '@testing-library/react';
```

**Pattern:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useSiriBubble } from '../useSiriBubble';

describe('useSiriBubble', () => {
  it('returns idle state and default intensity by default', () => {
    const { result } = renderHook(() => useSiriBubble());
    expect(result.current.props.state).toBe('idle');
    expect(result.current.props.intensity).toBe(0.5);
  });

  it('setState updates the orb state', () => {
    const { result } = renderHook(() => useSiriBubble());

    act(() => result.current.setState('negative'));
    expect(result.current.props.state).toBe('negative');
  });
});
```

**Key Rules:**
- Wrap state updates in `act()` to flush effects
- Access hook state via `result.current`
- Test return value shape, not implementation
- Simulate user interactions with `act()`

## Async Testing

**Promise Handling:**
```typescript
it('loads data asynchronously', async () => {
  const { result } = renderHook(() => useData());

  // Wait for async operation
  await expect(result.current).resolves.toBe(data);
});
```

**act() with async:**
```typescript
await act(async () => {
  // Async state updates
  await userEvent.type(input, 'text');
});
```

**Timeout Handling:**
```typescript
it('times out after 5 seconds', async () => {
  const promise = slowOperation();
  await expect(promise).rejects.toThrow('Timeout');
}, { timeout: 10000 }); // Extend test timeout
```

## Fixtures and Test Data

**Location:**
- Define in test file if used by single test
- Create `__fixtures__/` subdirectory in test folder for shared data
- Example location: `views/components/SiriBubble/__tests__/__fixtures__/mockOrb.ts`

**Patterns:**
```typescript
// Constant test data
const ALL_STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];

// Factory function for creating test objects
function createMockRun(overrides?: Partial<Run>): Run {
  return {
    id: 'test-id',
    createdAt: new Date().toISOString(),
    mode: 'vc_pitch',
    ...overrides,
  };
}

// Reusable mock responses
const MOCK_RESPONSE = {
  analysis: { overall_score: 75, ... },
  fallback: false,
};
```

**Example from constants.test.ts:**
```typescript
const ALL_STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];

describe('COLOR_MAP', () => {
  it('has entries for all orb states', () => {
    ALL_STATES.forEach((state) => {
      expect(COLOR_MAP[state]).toBeDefined();
    });
  });
});
```

## Error Testing

**Testing for Thrown Errors:**
```typescript
it('throws on invalid input', () => {
  expect(() => parseInvalidJson('{bad')).toThrow('Invalid JSON');
});

it('throws specific error type', () => {
  expect(() => unsafeOp()).toThrow(ValidationError);
});
```

**Testing Error Recovery:**
```typescript
it('falls back gracefully on API error', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

  const result = await analyzer.run(data);
  expect(result.fallback).toBe(true);
});
```

## Coverage

**Requirements:**
- Not enforced in config (no `coverage.statements` etc.)
- Manual monitoring only via CLI command

**View Coverage:**
```bash
vitest --coverage
# Generates coverage report (if @vitest/coverage configured)
```

**Current Coverage Strategy:**
- Test critical paths: API handlers, type guards, business logic
- Test edge cases: null/empty inputs, boundary values
- Less critical: CSS styling, layout, visual states (covered by E2E if needed)

## Test Types

**Unit Tests:**
- Scope: Single function, hook, or component
- Location: `__tests__/` next to source
- Example: `useSiriBubble.test.ts` tests hook behavior in isolation
- Approach: Mock dependencies, test inputs/outputs

**Integration Tests:**
- Scope: Multiple components or modules interacting
- Not heavily used in codebase yet
- Example: Testing full pitch analysis flow (hook → API → service → storage)
- Approach: Use real implementations where possible, mock only external APIs

**E2E Tests:**
- Framework: Playwright (config: `playwright.config.ts`)
- Location: `tests/e2e/` directory
- Example: `smoke.spec.ts`, `head-tracking.spec.ts`
- Scope: Full user workflows in browser (no mocking)

**Current E2E Tests:**
- `tests/e2e/smoke.spec.ts` — Basic app initialization
- `tests/e2e/head-tracking.spec.ts` — Head tracking integration (if camera present)

## Common Patterns

**Testing Component Props:**
```typescript
it('applies className prop', () => {
  const { container } = render(<SiriBubble state="idle" className="my-custom-class" />);
  expect(container.firstChild).toHaveClass('my-custom-class');
});

it('applies correct size dimensions', () => {
  const { container } = render(<SiriBubble state="idle" size="lg" />);
  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.style.width).toBe('256px');
});
```

**Testing Object Assertions:**
```typescript
it('returns object with expected shape', () => {
  const result = resolveSize('md', false);
  expect(result).toEqual({ width: '128px', height: '128px' });
});
```

**Testing Array Membership:**
```typescript
it('sizes are in ascending order', () => {
  expect(SIZE_MAP.sm).toBeLessThan(SIZE_MAP.md);
  expect(SIZE_MAP.md).toBeLessThan(SIZE_MAP.lg);
  expect(SIZE_MAP.lg).toBeLessThan(SIZE_MAP.xl);
});
```

**Testing Numeric Bounds:**
```typescript
it('intensity is between 0 and 1', () => {
  expect(DEFAULTS.intensity).toBeGreaterThanOrEqual(0);
  expect(DEFAULTS.intensity).toBeLessThanOrEqual(1);
});
```

**Testing Type Guards:**
```typescript
// From analysisService.ts
function isRubricScore(value: unknown): value is RubricScore {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    isRubricCategory(item.category) &&
    typeof item.score === 'number' &&
    typeof item.max_score === 'number' &&
    typeof item.rationale === 'string'
  );
}

// In test:
it('validates rubric scores', () => {
  expect(isRubricScore({ category: 'structure', score: 15, max_score: 20, rationale: 'good' })).toBe(true);
  expect(isRubricScore({ category: 'invalid' })).toBe(false);
  expect(isRubricScore(null)).toBe(false);
});
```

## Debugging

**Running Single Test:**
```bash
npx vitest runs/path/to/test.test.ts
npx vitest -t "test name pattern"
```

**Watch Mode:**
```bash
npm run test:watch
# Press 'p' to filter by filename
# Press 't' to filter by test name
```

**Console Output:**
- Use `console.log()` in test — output appears in test output
- View with `npm run test:watch` and pause at breakpoint

**Debugging in IDE:**
- Add breakpoint in VS Code
- Run: `node --inspect-brk ./node_modules/vitest/vitest.mjs run [test file]`
- Open `chrome://inspect` in Chrome DevTools

---

*Testing analysis: 2026-02-21*
