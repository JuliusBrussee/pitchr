# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Next.js App Router with Client-Side State Management

Pitchr follows a modern React architecture combining server-side rendering foundations via Next.js with predominantly client-side interactivity. The application uses a layered pattern separating UI components, business logic (hooks), and presentation pages.

**Key Characteristics:**
- Client-side rendering for interactive experiences (heavy use of `'use client'`)
- Custom React hooks for state management (no external state library)
- React Context API for theme and global UI state
- Component-driven architecture with grouped feature pages
- Heavy use of Three.js for 3D visualizations (SiriBubble orb)
- Media streaming via browser APIs (getUserMedia)
- Mock data patterns for development/prototyping

## Layers

**Pages Layer (Next.js App Router):**
- Purpose: Route handlers and page-level composition
- Location: `app/(app)/**/*.tsx` and `app/(marketing)/**/*.tsx`
- Contains: Page components that compose domain features
- Depends on: Hooks, components
- Used by: Next.js routing system and users

**Components Layer (Views):**
- Purpose: Reusable, isolated UI pieces with specific concerns
- Location: `views/components/` and `views/screens/`
- Contains: Feature components (SessionCanvas, MetricsPanel, SiriBubble), sidebar navigation, layout components
- Depends on: Hooks, types
- Used by: Pages and other components

**Hooks Layer (Business Logic & State):**
- Purpose: Custom React hooks managing state, side effects, and domain logic
- Location: `hooks/`
- Contains: `useSessionState.ts` (session metrics, speech bubbles, checklist), `useMediaStream.ts` (camera/mic control)
- Depends on: React internals, types
- Used by: Components and pages

**Context/Providers Layer (Global State):**
- Purpose: Theme and global UI state management
- Location: `views/components/ThemeProvider.tsx`
- Contains: Theme context (isDark, toggleTheme, orbState, setOrbState), aura color mappings
- Used by: Root layout and all pages via useTheme hook

**Types Layer:**
- Purpose: TypeScript type definitions
- Location: `types/` and inline in component/hook files
- Contains: Domain models (MetricValues, ChecklistItem, InsightEntry, SpeechBubble, OrbState)

**Configuration Layer:**
- Purpose: Build and runtime configuration
- Location: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`
- Contains: GLSL shader support, TypeScript settings, CSS processing

## Data Flow

**Session Recording Flow:**

1. User navigates to `/session` (SessionPage in `app/(app)/session/page.tsx`)
2. SessionPage initializes two hooks:
   - `useMediaStream()` → obtains video/audio stream, manages camera/mic toggles
   - `useSessionState()` → manages metrics, checklist, insights, speech bubbles
3. Media stream passed to `<SessionCanvas>`
4. SessionCanvas renders:
   - Primary view (slides or camera) with focus toggle
   - Overlay view (opposite of primary)
   - SiriBubble orb (if session active)
   - Speech bubbles from coach
   - Playback controls
5. SessionState updates flow to `<MetricsPanel>`:
   - Live metrics (WPM, filler words, clarity, conciseness)
   - Pitch checklist with progressive completion
   - Live insights feed
   - All re-render on state change

**Theme State Flow:**

1. `ThemeProvider` wraps root layout in `app/layout.tsx`
2. Provides theme context via `useTheme()` hook
3. Dynamically applies CSS variables and aura colors based on orbState
4. Background gradients adjust per theme and orb state

**State Management:**

- **Local component state**: useState for UI toggles (focusMode, isDragOver, viewMode, etc.)
- **Hook-managed state**: useSessionState and useMediaStream encapsulate complex logic
- **Context state**: Global theme and orb state via ThemeProvider
- **Mock data patterns**: COACH_MESSAGES, MOCK_CHECKLIST, MOCK_INSIGHTS hardcoded or generated
- **Effects**: useEffect for stream initialization, metric simulation, bubble cleanup

## Key Abstractions

**SiriBubble Component:**
- Purpose: AI coach orb visualization powered by Three.js
- Location: `views/components/SiriBubble/`
- Files: `SiriBubble.tsx` (wrapper with Canvas), `Orb.tsx` (3D mesh), `useSiriBubble.ts` (hook), `constants.ts`
- Pattern: Suspense boundary with CSS fallback; state-driven (idle, active, positive, negative, neutral)
- Used by: SessionCanvas when session is active

**useSessionState Hook:**
- Purpose: Encapsulates session state and simulation logic
- Location: `hooks/useSessionState.ts`
- Pattern: Returns SessionState interface with metrics, checklist, insights, speech bubbles, and control methods
- Simulation: Interval-based updates to metrics, checklist progression, orb state cycling, coach message generation
- Cleanup: Auto-expiring speech bubbles via setTimeout

**useMediaStream Hook:**
- Purpose: Browser media device access and toggle control
- Location: `hooks/useMediaStream.ts`
- Pattern: Initializes getUserMedia on mount, tracks stream state, provides toggleCamera/toggleMic
- Safety: Cleanup on unmount, error handling with setError

**ThemeProvider Context:**
- Purpose: Global theme state and aura background generation
- Location: `views/components/ThemeProvider.tsx`
- Pattern: Context + Provider wrapping app; useTheme hook for consumption
- Aura colors: Maps OrbState to radial gradients (primary + secondary layers)

**AppSidebar Component:**
- Purpose: Navigation and layout framework
- Location: `views/components/AppSidebar.tsx`
- Pattern: Stateless except for pathname detection; shows mock badges, theme toggle, session CTA
- Used by: All main pages (Dashboard, Session, etc.)

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Initial page load
- Responsibilities: Wraps app in ThemeProvider, imports global styles, sets metadata

**Home Page:**
- Location: `app/page.tsx`
- Triggers: / route
- Responsibilities: Simple landing page ("Pitchr" heading)

**Session Page:**
- Location: `app/(app)/session/page.tsx`
- Triggers: /session route
- Responsibilities: Orchestrates session recording with media stream, metrics, canvas, and sidebar

**Dashboard Page:**
- Location: `app/(app)/dashboard/page.tsx`
- Triggers: /dashboard route
- Responsibilities: Landing/summary page with mock stats, recent sessions, quick actions, pitch tips

**Other Pages:**
- `app/(app)/deck/page.tsx`: Deck manager with upload dropzone, deck grid, AI card
- `app/(app)/history/page.tsx`: Session history with list/grid view, search, filters, tags
- `app/(app)/analytics/page.tsx`: Analytics dashboard with score trends, category scores, insights, recommendations
- `app/(app)/settings/page.tsx`: Settings page (route exists, content empty)
- `app/(app)/demo/page.tsx`: Demo page (route exists, content empty)

## Error Handling

**Strategy:** Graceful degradation with fallbacks

**Patterns:**
- Media stream errors caught in useMediaStream; setError state with user message
- Three.js Canvas wrapped in Suspense with CSS fallback gradient
- Muted video elements with .catch(() => {}) for autoplay failures
- No global error boundary currently implemented (potential gap)

## Cross-Cutting Concerns

**Logging:** Console-only; no structured logging framework

**Validation:**
- TypeScript type checking (strict mode enabled)
- React hook rules enforced by React compiler
- No runtime validation library in use

**Authentication:**
- Not yet implemented; app is prototype-stage
- No auth guard on routes

**Styling:**
- Tailwind CSS for utility classes
- CSS variables for theme (--bg-surface, --text-primary, --border-color, etc.)
- Inline style props for dynamic theming
- Post-CSS with Tailwind v4

**Animations:**
- CSS classes (animate-fade-in-up, animate-pulse-glow) defined in globals.css
- Staggered animation via inline animationDelay
- Transition utilities for hover/state changes

---

*Architecture analysis: 2026-02-21*
