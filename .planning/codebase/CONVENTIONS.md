# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `SiriBubble.tsx`, `SessionCanvas.tsx`, `MetricsPanel.tsx`)
- Custom hooks: camelCase with `use` prefix (e.g., `useSiriBubble.ts`, `useMediaStream.ts`, `useSessionState.ts`)
- Type/interface files: lowercase with descriptive name (e.g., `types.ts`, `constants.ts`)
- Test files: co-located in `__tests__` directory with pattern `[name].test.ts` or `[name].test.tsx`
- Utility functions: camelCase in utility files
- Sub-components: defined in same file as parent component, PascalCase

**Functions:**
- React components: PascalCase (e.g., `export function SiriBubble()`, `export function Orb()`)
- Custom hooks: PascalCase with `use` prefix (e.g., `export function useSiriBubble()`)
- Helper functions: camelCase (e.g., `resolveSize()`, `startStream()`)
- Callbacks: camelCase with verb-first pattern (e.g., `toggleCamera()`, `setIntensity()`, `startSession()`)
- Sub-components within files: PascalCase (e.g., `function MediaToggle()`, `function ControlButton()`)

**Variables:**
- State variables: camelCase (e.g., `const [isCameraOn, setIsCameraOn]`, `const [isSessionActive, setIsSessionActive]`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `const MOCK_CHECKLIST`, `const COACH_MESSAGES`, `const DEFAULTS`)
- Configuration objects: camelCase (e.g., `const SIZE_MAP`, `const COLOR_MAP`, `const ANIMATION_MAP`)
- Refs: camelCase with `Ref` suffix (e.g., `videoRef`, `localRef`, `intervalRef`)
- Event handlers: camelCase with `on` prefix (e.g., `onClick`, `onStartSession`, `onStopSession`)
- Boolean states: prefix with `is` or on demand (e.g., `isCameraOn`, `isMicOn`, `isSessionActive`)

**Types:**
- Interfaces: PascalCase (e.g., `SiriBubbleProps`, `UseMediaStreamReturn`, `MetricValues`, `ChecklistItem`)
- Type aliases: PascalCase (e.g., `OrbState`, `OrbColors`, `OrbAnimationConfig`)
- Import types: always use `import type` for type-only imports (e.g., `import type { Metadata }`)

## Code Style

**Formatting:**
- No explicit formatter configured (Prettier not detected in config)
- Consistent 2-space indentation observed throughout
- Line length: approximately 100-120 characters per line
- Semicolons: used consistently at end of statements
- Trailing commas: used in multi-line objects/arrays

**Linting:**
- No eslint config detected
- TypeScript strict mode enabled in `tsconfig.json`
- Type checking is strict: `strict: true`

**Quotes:**
- Single quotes for imports and strings (e.g., `'use client'`, `import { useState } from 'react'`)
- Double quotes for JSX attributes (e.g., `className="..."`)

## Import Organization

**Order:**
1. React and third-party libraries (e.g., `import { Suspense } from 'react'`, `import { Canvas } from '@react-three/fiber'`)
2. Local relative imports from `@/` path alias (e.g., `import { SiriBubble } from '@/views/components/SiriBubble'`)
3. Type imports at top or inline (e.g., `import type { Metadata } from 'next'`, `import { OrbState, SiriBubbleProps } from './types'`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used for all non-relative imports: `@/views`, `@/hooks`, `@/components`
- Examples:
  - `import { SiriBubble } from '@/views/components/SiriBubble'`
  - `import { useMediaStream } from '@/hooks/useMediaStream'`
  - `import { ThemeProvider } from '@/views/components/ThemeProvider'`

## Error Handling

**Patterns:**
- Try-catch blocks for async operations requiring error capture (see `useMediaStream.ts` line 44-47)
- Error state in hooks: `const [error, setError] = useState<string | null>(null)`
- Error messages: user-friendly strings (e.g., `'Failed to access media devices'`)
- Graceful degradation: suppress known errors with `.catch(() => {})` for non-critical operations
  - Example: `video.play().catch(() => {})` in `useMediaStream.ts` line 42 and `SessionCanvas.tsx` line 258
- No global error boundary detected; error handling is localized to hooks

**Error Information:**
- Errors instanceof check to determine if error has message property: `err instanceof Error ? err.message : 'default message'`
- Set error state before attempting recovery
- Clear error state on successful retry

## Logging

**Framework:** No logging framework detected; only `console` available

**Patterns:**
- No logging currently in place in source code
- Comments used to document non-obvious behavior (e.g., `// Browser blocked autoplay — will retry on user interaction`)

## Comments

**When to Comment:**
- Clarify why code exists, not what it does (e.g., "Mock R3F Canvas — it requires WebGL which isn't available in jsdom")
- Document complex business logic or workarounds
- Mark browser compatibility issues or edge cases

**Style:**
- Single-line comments with `//` for brief explanations
- No JSDoc/TSDoc detected in codebase
- Comments placed above relevant code block

## Function Design

**Size:** Functions range 10-50 lines; larger functions broken into sub-components

**Parameters:**
- Destructured object parameters for components (see `SessionCanvasProps`, `MetricsPanelProps`)
- Separate required vs optional parameters in interfaces
- Type all parameters with explicit TypeScript types

**Return Values:**
- Explicit return types on all functions
- Hooks return object with named properties (e.g., `UseMediaStreamReturn`, `UseSiriBubbleReturn`)
- Components always return JSX.Element
- Callbacks return void or specific types

**Async Functions:**
- Marked with `async` keyword
- Use try-catch for error handling
- Include cleanup logic in return statement of useEffect

## Module Design

**Exports:**
- Named exports for all public functions (e.g., `export function SiriBubble()`)
- Type exports use `export type` syntax
- Barrel files: `index.ts` re-exports public API from components
  - Example: `views/components/SiriBubble/index.ts` exports component, hook, and types

**Barrel Files:**
- Used in component directories to create clean public interface
- Pattern: `export { SiriBubble } from './SiriBubble'` and `export type { Props } from './types'`

**File Organization:**
- Component logic and sub-components in same file (up to ~300 lines acceptable)
- Types in separate `types.ts` for shared type definitions
- Constants in separate `constants.ts` for configuration/mappings
- Tests co-located in `__tests__` subdirectory
- Hooks in dedicated hook file with `use` prefix

---

*Convention analysis: 2026-02-21*
