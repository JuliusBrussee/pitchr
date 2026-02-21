# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension. Example: `SiriBubble.tsx`, `ScoreBadge.tsx`
- Hooks: camelCase with `use` prefix and `.ts` extension. Example: `useMediaStream.ts`, `usePitchRun.ts`
- Types/interfaces: Separate `.ts` files with PascalCase. Example: `types.ts` (in `views/components/SiriBubble/types.ts`)
- Services: camelCase with `Service` suffix. Example: `analysisService.ts`, `scoringService.ts`
- Models: camelCase. Example: `run.ts`, `session.ts`
- Constants: Standalone `.ts` files with `UPPER_SNAKE_CASE` exports. Example: `constants.ts` (in `views/components/SiriBubble/constants.ts`)
- Config files: Named by domain. Example: `modes.ts`, `sampleResult.ts` (in `config/`)
- Test files: Co-located in `__tests__/` subdirectory with `[name].test.ts` or `[name].test.tsx` pattern

**Functions:**
- camelCase for all function names: `getScoreBand()`, `calculateDeliveryMetrics()`, `resolveSize()`
- Helper functions in page components follow camelCase: `getGreeting()`, `formatDuration()`, `formatRunDate()`
- Event handlers use `on` prefix: `onStartSession()`, `onStopSession()`, `toggleCamera()`

**Variables:**
- camelCase for all variables and parameters: `transcript`, `overallScore`, `durationSeconds`
- State booleans use `is` prefix: `isCameraOn`, `isMicOn`, `isAnalyzing`, `isRecording`
- Refs use camelCase with `Ref` suffix: `videoRef`, `intervalRef`

**Types/Interfaces:**
- PascalCase for all type and interface names: `AnalysisResult`, `RubricScore`, `DeliveryMetrics`
- Discriminated union types use `type` keyword: `type PitchMode = 'elevator' | 'vc_pitch'`
- Object shape types use `interface` keyword
- Export type-only imports with `export type` syntax

**Constants:**
- `UPPER_SNAKE_CASE` for all constants, including nested ones
- Define constants at module scope before functions
- Use `as const` for TypeScript literal types: `size: 'md' as const`
- Group related constants in objects: `DEFAULTS = { intensity: 0.5, size: 'md' as const, opacity: 0.85 }`

## Code Style

**Formatting:**
- EditorConfig enforces: 2-space indentation, LF line endings, final newline, UTF-8 charset, trim trailing whitespace
- Indentation: 2 spaces (confirmed in `.editorconfig`)
- Semicolons: Required at end of statements
- Trailing commas: Used in multiline arrays/objects/arguments

**Quotes:**
- Single quotes for imports and string literals: `import { X } from '@/path'` and `const msg = 'hello'`
- Double quotes for JSX attributes: `<Component prop="value" />`

**Arrow Functions:**
- Use `const` with arrow function syntax: `const myFunc = () => { ... }`
- Single-line arrow functions for simple returns: `const getX = (y) => y * 2`
- Multi-line arrow functions use explicit return: `const compute = (x) => { return x + 1; }`

**Linting:**
- TypeScript `strict` mode enabled (tsconfig.json)
- `noEmit` enforces type checking without output
- `isolatedModules` ensures each file compiles independently
- No ESLint/Prettier config found — EditorConfig is the format source of truth

## Import Organization

**Order (strictly enforced):**
1. React and core dependencies: `'react'`, `'next/*'`, `'next/link'`
2. Third-party UI libraries: `'lucide-react'`, `'@react-three/fiber'`, `'three'`
3. Third-party utilities: Any other npm packages
4. Local `@/` imports: All project imports using the alias
5. Relative imports: `./ ./types`, `./constants` (rarely used due to `@/` preference)

**Examples from codebase:**
```typescript
// app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, TrendingUp, Trophy } from 'lucide-react';
import {
  GlassCard,
  StatCard,
  ScoreBadge,
  TagPill,
} from '@/views/components/ui';
import type { PitchMode } from '@/views/components/ui/colors';
```

**Path Aliases:**
- Always use `@/*` for non-relative imports. Maps to project root in `tsconfig.json`
- Never use relative `../../../` paths — use `@/` instead

## Type Imports

- Use `import type` for type-only imports: `import type { AnalysisResult } from '@/types/analysis'`
- Separate value and type imports:
  ```typescript
  import type { AnalysisResult, DeliveryMetrics } from '@/types/analysis';
  import { someFunction } from '@/services/service';
  ```

## Component Patterns

**React Components:**
- Directive: All interactive components require `'use client'` at top of file
- Exports: Named exports only — no default exports. Example: `export function SiriBubble({ ... })`
- Props: Always destructure into TypeScript `interface`. Never use positional parameters.
- Props interface naming: `[ComponentName]Props`. Example: `SiriBubbleProps` in `views/components/SiriBubble/types.ts`
- Sub-components: Define in same file if <300 lines; extract to separate file if larger
- Test structure: `__tests__/[name].test.tsx` co-located with component

**Example component structure (`views/components/SiriBubble/SiriBubble.tsx`):**
```typescript
'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Orb } from './Orb';
import { SiriBubbleProps } from './types';

export function SiriBubble({
  state,
  intensity = DEFAULTS.intensity,
  size = DEFAULTS.size,
  fluid = false,
  opacity = DEFAULTS.opacity,
  className,
}: SiriBubbleProps) {
  // Implementation
}
```

**Hooks:**
- Export hooks from their own `.ts` files
- Return interface with descriptive property names
- Example return interface: `UsePitchRunReturn`, `UseMediaStreamReturn`
- Use `useCallback` for stable function references passed to child components or stored in state

**Example hook structure (`hooks/usePitchRun.ts`):**
```typescript
'use client';

import { useState, useCallback } from 'react';

export interface UsePitchRunReturn {
  isAnalyzing: boolean;
  error: string | null;
  runPitchAnalysis: (input: CreatePitchRunRequest) => Promise<RunPitchAnalysisResult>;
}

export function usePitchRun(): UsePitchRunReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPitchAnalysis = useCallback(async (input) => {
    // Implementation
  }, []);

  return { isAnalyzing, error, runPitchAnalysis };
}
```

**Barrel Exports:**
- Create `index.ts` in component/feature directories to consolidate exports
- Use named exports and `export type` for types
- Example from `views/components/SiriBubble/index.ts`:
  ```typescript
  export { SiriBubble } from './SiriBubble';
  export { useSiriBubble } from './useSiriBubble';
  export type { SiriBubbleProps, OrbState } from './types';
  ```

## Styling

**Tailwind:**
- Use Tailwind utility classes for layout, spacing, typography
- 4.2.0+ PostCSS mode (no JIT)
- Example: `className="flex items-center gap-2 mb-1.5 rounded-xl border p-4"`

**CSS Variables:**
- Define in `globals.css` with `:root` (light) and `.dark` class (dark)
- Naming: `--bg-primary`, `--bg-surface`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-color`, `--blur-strength`
- Usage in JS: `style={{ backgroundColor: 'var(--bg-surface)' }}`

**Dynamic Styling:**
- Use inline `style` prop for runtime theme values (no static Tailwind classes needed)
- Example: `style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}`

**Accent Colors:**
- Coral/orange palette: `#ff5941` (primary), `#ffaa33` (secondary), `#e63b26` (dark)
- Mapped per mode: `elevator` → `#f97316`, `vc_pitch` → `#ff5941`
- View color functions in `views/components/ui/colors.ts`: `getScoreColor()`, `getModeColor()`, `getRubricColor()`

**Glassmorphism:**
- Use `backdrop-blur` + semi-transparent `--bg-surface` with border
- Example from dashboard:
  ```tsx
  style={{
    backgroundColor: 'var(--bg-surface)',
    backdropFilter: 'blur(var(--blur-strength))',
    WebkitBackdropFilter: 'blur(var(--blur-strength))',
    borderColor: 'var(--border-color)',
  }}
  ```

## API Route Patterns

**Location:** `app/api/[resource]/` with nested segments for actions
- Example structure:
  - `app/api/pitch/run/route.ts` — POST to run analysis, GET to fetch run
  - `app/api/pitch/run/[runId]/route.ts` — GET/DELETE specific run
  - `app/api/deck/upload/route.ts` — POST file upload

**Handler Pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await controller(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Error Handling

**Type Guards:**
- Define `is*()` guard functions for type narrowing
- Example from `services/analysisService.ts`:
  ```typescript
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
  ```

**Error Classes:**
- Create custom error classes for domain-specific errors
- Catch and re-throw with context preservation
- Example from controllers:
  ```typescript
  class PitchValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PitchValidationError';
    }
  }
  ```

**Try/Catch Blocks:**
- Always catch with typed checks: `error instanceof ErrorClass`
- Fallback to generic Error check: `error instanceof Error ? error.message : 'Unknown error'`
- Use `.finally()` to guarantee cleanup (e.g., `setIsLoading(false)`)

**Silent Catches:**
- Appropriate for non-critical operations: `video.play().catch(() => {})`
- Only when exception is expected and harmless (e.g., autoplay policies, cleanup on unmount)
- Document intent with comment

## Comments

**When to Comment:**
- Explain "why", not "what" — the code shows what it does
- Clarify non-obvious algorithmic choices
- Flag workarounds or browser-specific quirks
- Mark sections in long components with dividers: `/* ——— Header Section ——— */`

**JSDoc/TSDoc:**
- Not heavily used in codebase — prefer self-documenting code with clear types
- Use for public API functions if not obvious from signature

**Comment Style:**
- Single-line: `// This is a comment`
- Section dividers: `/* ——— Description ——— */` (em dash separator, not hyphens)
- No block comments (`/** ... */`) unless documenting exported APIs

**Example section comment from `app/(app)/dashboard/page.tsx`:**
```typescript
/* ——— Mock Data (PRD-aligned) ——— */
const RECENT_RUNS: MockRun[] = [...]

/* ——— Helpers ——— */
function getGreeting(): string { ... }

/* ——— Sparkline SVG Component ——— */
function Sparkline({ ... }) { ... }
```

## Module Design

**File Organization:**
- Avoid monolithic files — split when >300 lines
- Group related logic together (types, constants, then functions)
- Export public API at end of file

**Imports:**
- Always use `@/` alias for cross-module imports
- Minimize circular dependencies by structuring layers: models → services → controllers → pages
- Test files import from parent sibling, never from other tests

**Example service structure (`services/analysisService.ts`):**
```typescript
// Type imports first
import type { AnalysisResult, ... } from '@/types/analysis';

// Value imports
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { completeWithLlmRouter } from '@/lib/llm/router';

// Internal types
export interface AnalyzePitchInput { ... }
export interface AnalyzePitchResult { ... }

// Constants
const RUBRIC_CATEGORIES: RubricCategory[] = [...]

// Type guards
function isRubricScore(value: unknown): value is RubricScore { ... }

// Helpers (private)
function parseJsonPayload(raw: string): unknown { ... }

// Exported API
export async function analyzePitch(input: AnalyzePitchInput): Promise<AnalyzePitchResult> { ... }
```

## Hydration & Server/Client Boundaries

**'use client' Directive:**
- Required at top of all interactive components (state, event handlers, hooks)
- Example: Any component using `useState`, `useEffect`, `useCallback`, event handlers
- Pages that render only client components still need the directive

**Hydration Mismatches:**
- Defer dynamic values (current time, random selection) to `useEffect()` after mount
- Example from `app/(app)/dashboard/page.tsx`:
  ```typescript
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);
  ```
- Prevents server-rendered HTML from mismatching client-rendered content

## Next.js Patterns

**App Router Structure:**
- Route files: `app/(app)/[feature]/page.tsx` (default export, server component by default)
- API routes: `app/api/[resource]/route.ts` (exported functions per HTTP method)
- Nested layouts: `app/(app)/layout.tsx` wraps all routes in group

**Dynamic Routes:**
- Use `[param]` for catch-all: `app/(app)/results/[runId]/page.tsx`
- Access via props: `export default function ResultsPage({ params }: { params: { runId: string } })`

---

*Convention analysis: 2026-02-21*
