# Coding Conventions

**Analysis Date:** 2026-02-22

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `MetricsPanel.tsx`, `SessionCanvas.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSessionState.ts`, `useMediaStream.ts`)
- Services: camelCase with `Service` suffix (e.g., `analysisService.ts`, `deckService.ts`)
- Types/Interfaces: PascalCase (e.g., `SessionState`, `MetricValues`)
- Tests: `__tests__/[name].test.ts(x)` or `__tests__/[name].spec.ts(x)` (co-located with source)

**Functions:**
- Components: PascalCase exports (e.g., `export function MetricsPanel()`)
- Hooks: `use` prefix + camelCase (e.g., `export function useSessionState()`)
- Regular functions: camelCase (e.g., `countFillerWords`, `formatDuration`)
- Event handlers: `on` prefix + camelCase (e.g., `onModeChange`, `onClick`)

**Variables:**
- Regular variables: camelCase (e.g., `selectedMode`, `isSessionActive`)
- State booleans: `is` prefix (e.g., `isSessionActive`, `isCameraOn`, `isRecording`)
- Refs: camelCase + `Ref` suffix (e.g., `videoRef`, `sessionStartRef`, `durationIntervalRef`)
- Constants: UPPER_SNAKE_CASE (e.g., `FILLER_WORDS`, `ENGAGEMENT_LABELS`)

**Types/Interfaces:**
- PascalCase (e.g., `MetricValues`, `InsightEntry`, `SessionState`)
- Optional fields use `?` (e.g., `audioUrl?: string`)
- Union types clearly expressed (e.g., `type PitchMode = 'elevator' | 'vc_pitch'`)

## Code Style

**Formatting:**
- 2-space indentation (configured throughout)
- Semicolons required on all statements
- Trailing commas in multiline arrays/objects
- Single quotes for imports and strings (e.g., `import { useState } from 'react'`)
- Double quotes for JSX attributes (e.g., `className="flex"`)

**Type Imports:**
- Use `import type` for type-only imports (e.g., `import type { MetricValues } from '@/hooks/useSessionState'`)
- Separate type imports from regular imports

**Linting:**
- No ESLint config detected, but code follows consistent patterns
- TypeScript `strict: true` enforces type safety (`tsconfig.json`)
- Unused variables and undefined behaviors caught by TypeScript compiler

## Import Organization

**Order (enforced by pattern):**
1. React and Next.js (e.g., `import { useState } from 'react'`, `import { useRouter } from 'next/navigation'`)
2. Third-party libraries (e.g., `import { Check, Circle } from 'lucide-react'`, `import { Suspense } from 'react'`)
3. Type imports (e.g., `import type { RealtimeChecklistItemState } from '@/types/checklist'`)
4. Local `@/` imports (e.g., `import { MetricsPanel } from '@/views/components/MetricsPanel'`)
5. Relative imports (e.g., `./types`, `./constants`)

**Path Aliases:**
- `@/*` maps to project root — use for all non-relative imports
- Example: `import { useSessionState } from '@/hooks/useSessionState'`

## Error Handling

**Custom Error Classes:**
- `export class RunNotFoundError extends Error {}` in `services/runService.ts`
- `export class PitchValidationError extends Error {}` in `controllers/pitchController.ts`
- Extend native `Error` for domain-specific exceptions

**Error Checking Pattern:**
- Always check with `instanceof Error` before accessing `.message`:
```typescript
const message = error instanceof Error ? error.message : 'Default message';
```
- Used consistently across hooks, services, and API routes (e.g., `app/(app)/session/page.tsx` line 266, `app/api/deck/upload/route.ts` line 110)

**Throw vs. Return:**
- Services throw errors for fatal conditions (e.g., `throw new Error('Failed to insert run')` in `runService.ts`)
- API routes catch and return JSON error responses (e.g., `app/api/pitch/run/route.ts` lines 82-85)
- Hooks set state (e.g., `setError()` in `useMediaStream.ts`, `useSTT.ts`)

**Graceful Degradation:**
- Some errors are silently caught with comments explaining why (e.g., `catch { // Silently fail }` in `app/(app)/session/page.tsx` line 71)
- Fallback modes exist for LLM calls and Miro integration

## Logging

**Framework:** console (no logger library)

**Patterns:**
- `console.warn()` for non-critical issues (e.g., `console.warn('[headTracking] initialization error')` in `session/page.tsx` line 149)
- `console.error()` for errors (e.g., `console.error('[judge-agent] provider failure')` in `judgeAgentService.ts` line 232)
- Prefix with `[module-name]` for filtering (e.g., `[headTracking]`, `[judge-agent]`)
- No debug-level logging observed; use comments or `console.log()` sparingly

**Observation:** Limited logging overall; relies on error handling and UI feedback.

## Comments

**When to Comment:**
- Explain WHY, not WHAT (code should be clear on what it does)
- Complex algorithms or business logic (e.g., filler word detection in `useSessionState.ts` lines 45-67)
- Unexpected behavior or workarounds (e.g., `// Silently fail — deck picker just won't show decks` in `session/page.tsx` line 72)
- Section dividers (e.g., `// Duration timer — updates every second while session is active`)

**JSDoc/TSDoc:**
- Used minimally in the codebase
- Prefer well-named functions and clear types over verbose JSDoc
- Example: function names like `countFillerWords()` are self-documenting

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Sub-components extracted inline if <300 lines (e.g., `ModeButton`, `MetricCard`, `ChecklistRow` in `MetricsPanel.tsx`)
- Extract to separate files if >300 lines

**Parameters:**
- Destructure object props for React components (e.g., `MetricsPanelProps` interface in `MetricsPanel.tsx`)
- Type interfaces for component props (no inline prop typing)
- Example:
```typescript
interface MetricsPanelProps {
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  isSessionActive: boolean;
  onModeChange: (mode: PitchMode) => void;
}

export function MetricsPanel({ metrics, checklist, isSessionActive, onModeChange }: MetricsPanelProps) {
  // ...
}
```

**Return Values:**
- Explicit return types preferred (not inferred)
- Use `| null` for optional returns (e.g., `Promise<string | undefined>` in `loadDeckText` function)
- Avoid returning complex nested objects; use well-defined types

**Callbacks:**
- Named with `on` prefix (e.g., `onModeChange`, `onClick`)
- Type callbacks in props (e.g., `onModeChange: (mode: PitchMode) => void`)
- Use `useCallback()` to memoize event handlers that depend on state/props

## Module Design

**Exports:**
- Named exports only (no default exports) — enforced throughout codebase
- Example: `export function MetricsPanel()` not `export default MetricsPanel`
- Type exports with `export type` (e.g., `export type PitchMode = 'elevator' | 'vc_pitch'`)

**Barrel Files:**
- Not systematically used in this codebase
- Some directories like `SiriBubble/` use `index.ts` for compound components (`SiriBubble/index.ts`)

**Client Components:**
- Use `'use client'` directive on all interactive components (required by Next.js App Router)
- Example: All page files and interactive components start with `'use client';`

## Styling

**Utility Classes:**
- Tailwind CSS 4.2.0 for layout, spacing, and utilities
- Example: `className="flex flex-col w-80 rounded-2xl border overflow-hidden min-h-0"`
- Gap utilities: `gap-2`, `gap-3`, `gap-4`
- Sizing utilities: `w-80`, `w-5`, `h-3`, `min-h-0`

**CSS Variables for Theming:**
- Light mode: `:root`
- Dark mode: `.dark` class (toggled via ThemeProvider)
- Common variables:
  - `--bg-primary`: Main background
  - `--bg-surface`: Card/elevated backgrounds
  - `--text-primary`: Main text
  - `--text-secondary`: Secondary text
  - `--text-muted`: Muted/disabled text
  - `--border-color`: Border color
  - `--blur-strength`: For glassmorphism
- Examples in `MetricsPanel.tsx`: `style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}`

**Inline Styles:**
- Use inline `style={}` for dynamic theme values (e.g., `color={accent ?? 'var(--text-primary)'}`)
- Reserve Tailwind for static layout; inline styles for dynamic colors/themes
- Example: `style={{ color: accent ?? 'var(--text-primary)' }}` in `MetricCard`

**Accent Colors:**
- Coral/orange: `#ff5941`, `#ffaa33`, `#e63b26`
- Red/error: `#ef4444`
- Amber/warning: `#f59e0b`
- Green/success: `#22c55e`

**Glassmorphism:**
- Backdrop blur: `backdrop-filter: blur(var(--blur-strength))`
- WebKit support: `WebkitBackdropFilter: blur(var(--blur-strength))`
- Semi-transparent backgrounds: `backgroundColor: 'var(--bg-surface)'` with opacity

---

*Convention analysis: 2026-02-22*
