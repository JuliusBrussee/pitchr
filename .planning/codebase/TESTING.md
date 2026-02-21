# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest's built-in `expect()` (based on Chai)

**Testing Library:**
- `@testing-library/react` 16.3.2 (for component testing)
- `@testing-library/jest-dom` 6.9.1 (for DOM matchers)

**Run Commands:**
```bash
npm test                # Run all tests once
npm run test:watch     # Watch mode for development
```

## Test File Organization

**Location:**
- Co-located in `__tests__` subdirectory relative to source file
- Example: `views/components/SiriBubble/SiriBubble.tsx` has tests in `views/components/SiriBubble/__tests__/SiriBubble.test.tsx`

**Naming:**
- Pattern: `[name].test.ts` or `[name].test.tsx`
- Examples:
  - `useSiriBubble.test.ts` (hook test)
  - `SiriBubble.test.tsx` (component test)
  - `constants.test.ts` (constant validation)

**Structure:**
```
views/components/SiriBubble/
├── SiriBubble.tsx
├── Orb.tsx
├── useSiriBubble.ts
├── types.ts
├── constants.ts
├── index.ts
└── __tests__/
    ├── SiriBubble.test.tsx
    ├── useSiriBubble.test.ts
    └── constants.test.ts
```

## Test Setup

**Configuration:**
- `vitest.config.ts` defines test environment as `jsdom`
- Setup file: `vitest.setup.ts` imports testing utilities
- Globals enabled: `globals: true` allows `describe`, `it`, `expect` without imports

**Setup File Contents:**
```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('returns expected value', () => {
    const result = operation();
    expect(result).toBe(expected);
  });

  it('handles edge case', () => {
    expect(() => operation()).not.toThrow();
  });
});
```

**Patterns:**

1. **Setup Pattern:**
   - Hooks tested with `renderHook()` from testing library
   - Components tested with `render()` from testing library
   - No before/after setup detected; tests are isolated

2. **Assertion Pattern:**
   - Use Chai-style assertions: `.toBe()`, `.toEqual()`, `.toBeDefined()`, `.toMatch()`
   - Check element existence: `.getTruthy()`, `.getByTestId()`
   - Use `data-testid` attributes for specific element selection

3. **Hook Testing:**
   ```typescript
   const { result } = renderHook(() => useSiriBubble());
   expect(result.current.props.state).toBe('idle');
   ```

4. **Component Testing:**
   ```typescript
   const { container } = render(<SiriBubble state="idle" />);
   expect(container.firstChild).toBeTruthy();
   expect(screen.getByTestId('r3f-canvas')).toBeTruthy();
   ```

5. **Async Testing:**
   Use `act()` wrapper for state updates:
   ```typescript
   act(() => result.current.setState('negative'));
   expect(result.current.props.state).toBe('negative');
   ```

## Mocking

**Framework:** Vitest's built-in `vi` module for mocking

**Patterns:**

1. **Module Mocking:**
   ```typescript
   vi.mock('@react-three/fiber', () => ({
     Canvas: ({ children }: { children: React.ReactNode }) => (
       <div data-testid="r3f-canvas">{children}</div>
     ),
     useFrame: vi.fn(),
   }));
   ```

2. **Component Mocking:**
   ```typescript
   vi.mock('../Orb', () => ({
     Orb: () => <div data-testid="orb-mesh" />,
   }));
   ```

**What to Mock:**
- External libraries requiring browser APIs (WebGL, Canvas) that jsdom doesn't support
- Complex components that are tested separately
- Heavy dependencies (e.g., `@react-three/fiber`)

**What NOT to Mock:**
- Pure utility functions
- Type definitions
- Application components being tested (render real behavior)

## Fixtures and Factories

**Test Data:**
- Mock data defined as constants at module level:
  ```typescript
  const ALL_STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];
  const MOCK_CHECKLIST: ChecklistItem[] = [
    { id: '1', label: 'Introduction & hook', status: 'completed' },
    // ...
  ];
  ```

**Location:**
- Defined inline in test file or in constants file (`constants.ts` that is imported and tested)
- No separate fixtures directory

## Coverage

**Requirements:** Not enforced (no coverage config in vitest.config.ts)

**Current Status:**
- Only 3 test suites currently (SiriBubble component, useSiriBubble hook, constants)
- Large portions of codebase untested (SessionCanvas, MetricsPanel, useMediaStream, useSessionState, page components)

## Test Types

**Unit Tests:**
- **Constants validation:** Test data structure and values (e.g., `constants.test.ts`)
  - Validates all states have entries in maps
  - Checks color format with regex: `/^#[0-9A-Fa-f]{6}$/`
  - Verifies numeric constraints (speeds > 0, sizes ascending)

- **Hook tests:** Test state management in isolation
  - Example: `useSiriBubble.test.ts` tests state updates, intensity clamping, props memoization
  - Use `renderHook()` and `act()` for state changes
  - Check return value shape matches interface

- **Function tests:** Test pure functions
  - Example: `resolveSize()` function tested with different size presets
  - Test edge cases: undefined values, custom numbers, fluid mode

**Integration Tests:**
- **Component rendering:** Test components render without crashing
  - Mocks dependencies (Canvas, heavy components)
  - Verifies correct child elements render
  - Checks props are applied correctly
  - Example: `SiriBubble.test.tsx` tests Canvas renders, Orb renders, className applied

- **Interaction tests:** Test click handlers and state changes
  - Not currently implemented in existing tests
  - Pattern would use `userEvent` or `fireEvent` from testing library

**E2E Tests:**
- Not used in this codebase

## Common Testing Patterns

**Testing Numeric Constraints:**
```typescript
it('intensity is between 0 and 1', () => {
  expect(DEFAULTS.intensity).toBeGreaterThanOrEqual(0);
  expect(DEFAULTS.intensity).toBeLessThanOrEqual(1);
});
```

**Testing Collections:**
```typescript
it('has entries for all orb states', () => {
  ALL_STATES.forEach((state) => {
    expect(COLOR_MAP[state]).toBeDefined();
  });
});

// Test distinctness
it('has distinct colors per state', () => {
  const primaries = ALL_STATES.map((s) => COLOR_MAP[s].primary);
  expect(new Set(primaries).size).toBe(ALL_STATES.length);
});
```

**Testing Async State Updates:**
```typescript
it('setState updates the orb state', () => {
  const { result } = renderHook(() => useSiriBubble());

  act(() => result.current.setState('negative'));
  expect(result.current.props.state).toBe('negative');
});
```

**Testing Size Resolution:**
```typescript
it('resolves preset string sizes to pixels', () => {
  expect(resolveSize('sm', false)).toEqual({ width: '64px', height: '64px' });
  expect(resolveSize('md', false)).toEqual({ width: '128px', height: '128px' });
});
```

**Testing With Regex Validation:**
```typescript
it('color values are valid hex', () => {
  ALL_STATES.forEach((state) => {
    expect(COLOR_MAP[state].primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(COLOR_MAP[state].secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
```

## Known Issues

- Tests fail with missing `@testing-library/dom` dependency
- Only 3 test suites exist; most UI components and hooks untested
- No integration tests covering real user workflows
- No E2E tests

---

*Testing analysis: 2026-02-21*
