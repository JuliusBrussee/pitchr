# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
pitchr/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated/main app routes
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── dashboard/            # Main dashboard landing
│   │   ├── deck/                 # Deck manager
│   │   ├── demo/                 # Demo page (placeholder)
│   │   ├── history/              # Session history
│   │   ├── results/[sessionId]/  # Session results detail
│   │   ├── session/              # Live session recording
│   │   ├── settings/             # Settings page (placeholder)
│   │   └── setup/                # Initial setup (placeholder)
│   ├── (marketing)/              # Public/marketing routes
│   ├── api/                      # API routes (not yet implemented)
│   ├── layout.tsx                # Root layout with ThemeProvider
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles, animations, CSS variables
│
├── views/                        # UI components and layouts
│   ├── components/               # Reusable UI components
│   │   ├── AppSidebar.tsx        # Main navigation sidebar
│   │   ├── MetricsPanel.tsx      # Live metrics display
│   │   ├── SessionCanvas.tsx     # Main recording canvas with slides/camera
│   │   ├── StartSessionButton.tsx # Session control button with ripples
│   │   ├── ThemeProvider.tsx     # Global theme context
│   │   ├── SiriBubble/           # 3D AI coach orb (React Three Fiber)
│   │   │   ├── SiriBubble.tsx
│   │   │   ├── Orb.tsx
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   ├── useSiriBubble.ts
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   ├── LiveMeters/           # Metric visualizations (placeholder)
│   │   ├── Scorecard/            # Score display (placeholder)
│   │   ├── SlideViewer/          # Slide presentation (placeholder)
│   │   ├── Timer/                # Countdown timer (placeholder)
│   │   ├── VideoFrame/           # Video player (placeholder)
│   │   └── ui/                   # Basic UI primitives (placeholder)
│   ├── layouts/                  # Layout wrapper components (placeholder)
│   ├── screens/                  # Full-page screen components (placeholder)
│   │   ├── BattleScreen/
│   │   ├── DeckScreen/
│   │   ├── ResultsScreen/
│   │   └── SessionScreen/
│   ├── pre-components/           # Component templates (placeholder)
│   └── pre-mock/                 # Mock implementations (placeholder)
│
├── hooks/                        # Custom React hooks
│   ├── useMediaStream.ts         # Camera/mic stream management
│   └── useSessionState.ts        # Session state, metrics, checklist
│
├── types/                        # TypeScript type definitions
│   └── glsl.d.ts                 # GLSL shader module declaration
│
├── lib/                          # Utilities and helpers
│   ├── audio/                    # Audio processing (placeholder)
│   ├── scoring/                  # Scoring algorithms (placeholder)
│   └── video/                    # Video processing (placeholder)
│
├── models/                       # Data models (placeholder)
│
├── controllers/                  # Business logic controllers (placeholder)
│   ├── deck/
│   ├── feedback/
│   ├── qna/
│   └── session/
│
├── services/                     # External service integrations (placeholder)
│   ├── claude/                   # Anthropic Claude API
│   ├── elevenlabs/               # ElevenLabs TTS
│   ├── gemini/                   # Google Gemini API
│   └── miro/                     # Miro integration
│
├── store/                        # State management (placeholder)
│
├── config/                       # Configuration files
│   ├── prompts/                  # AI prompt templates (placeholder)
│   └── rubrics/                  # Evaluation rubrics (placeholder)
│
├── .planning/                    # GSD planning documents
│   ├── codebase/                 # This analysis
│   ├── phase-1/                  # Phase 1 planning
│   └── phase-2/                  # Phase 2 planning
│
├── next.config.ts               # Next.js configuration (GLSL support)
├── tsconfig.json                # TypeScript configuration
├── postcss.config.mjs           # PostCSS configuration
├── vitest.config.ts             # Vitest configuration
├── vitest.setup.ts              # Test setup file
├── package.json                 # Dependencies
└── next-env.d.ts                # Next.js type definitions
```

## Directory Purposes

**app/(app)/ — Authenticated App Pages:**
- Purpose: Main application routes after login
- Contains: Page components (.tsx files) organized by feature
- Key files: `session/page.tsx` (core recording feature), `dashboard/page.tsx` (landing)

**app/api/ — API Routes:**
- Purpose: Backend endpoints (not yet implemented)
- Planned routes: `/api/sessions/*`, `/api/deck/*`, `/api/feedback/*`, `/api/qna/*`, `/api/ws/*`
- Status: Placeholder structure only

**views/components/ — Reusable Components:**
- Purpose: Feature-specific and generic UI components
- Key components:
  - `AppSidebar.tsx`: Navigation, theme toggle, session CTA
  - `SessionCanvas.tsx`: Main recording interface (slides, camera, controls)
  - `MetricsPanel.tsx`: Live feedback display (WPM, checklist, insights)
  - `SiriBubble/`: 3D orb coach visualization
  - `StartSessionButton.tsx`: Session control with ripple animations
  - `ThemeProvider.tsx`: Global theme state and context

**hooks/ — Custom Hooks:**
- Purpose: Encapsulate stateful logic, media access, session management
- Key hooks:
  - `useMediaStream.ts`: Browser getUserMedia, stream state, camera/mic toggles
  - `useSessionState.ts`: Simulated metrics, checklist, insights, coach messages

**lib/ — Utility Modules:**
- Purpose: Reusable algorithms, helper functions (not yet populated)
- Planned: Audio/video processing, scoring algorithms

**types/ — Type Definitions:**
- Purpose: Shared TypeScript types
- `glsl.d.ts`: Declares `.glsl` module for shader imports

**models/, controllers/, services/ — Backend Structure:**
- Purpose: Placeholder directories for future backend implementation
- Status: Mostly empty (.gitkeep files)
- Planned: Data models, business logic, external API integrations (Claude, ElevenLabs, Gemini, Miro)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout; wraps with ThemeProvider
- `app/page.tsx`: Home page (/ route)
- `app/(app)/session/page.tsx`: Session recording page (/session)
- `app/(app)/dashboard/page.tsx`: Dashboard (/dashboard)

**Configuration:**
- `next.config.ts`: GLSL shader loader configuration
- `tsconfig.json`: TypeScript settings (strict mode, path alias @/*)
- `globals.css`: Global styles, CSS variables, animation keyframes
- `package.json`: Dependencies (React, Next.js, Three.js, Tailwind, etc.)

**Core Logic:**
- `hooks/useSessionState.ts`: Session metrics simulation, state management
- `hooks/useMediaStream.ts`: Media stream initialization, device access
- `views/components/ThemeProvider.tsx`: Global theme context provider
- `views/components/SiriBubble/useSiriBubble.ts`: Orb animation logic

**Testing:**
- `views/components/SiriBubble/__tests__/`: Test files for SiriBubble component

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Component files: PascalCase, e.g., `AppSidebar.tsx`, `SessionCanvas.tsx`
- Hook files: camelCase prefixed with `use`, e.g., `useMediaStream.ts`
- Type definitions: Either inline or in `glsl.d.ts`
- Test files: `.test.ts` or `.test.tsx` in `__tests__/` directory

**Directories:**
- Feature folders: kebab-case or grouped by feature, e.g., `session/`, `deck/`, `SiriBubble/`
- Utility folders: lowercase, e.g., `hooks/`, `lib/`, `views/`, `types/`

**Components & Functions:**
- React components: PascalCase, e.g., `SessionCanvas`, `AppSidebar`, `MetricsPanel`
- Custom hooks: camelCase with `use` prefix, e.g., `useSessionState`, `useMediaStream`
- Helper functions: camelCase, e.g., `resolveSize`, `scoreColor`, `getGreeting`
- Types/Interfaces: PascalCase, e.g., `SessionState`, `MetricValues`, `OrbState`

## Where to Add New Code

**New Feature (e.g., new page):**
- Route page: `app/(app)/[feature-name]/page.tsx`
- Feature components: `views/components/[FeatureName]/`
- Feature hook: `hooks/use[FeatureName].ts`
- Tests: `views/components/[FeatureName]/__tests__/`

**New Component:**
- Implementation: `views/components/[ComponentName].tsx` (simple) or `views/components/[ComponentName]/index.ts` (compound)
- Test: `views/components/[ComponentName]/__tests__/[ComponentName].test.tsx`

**Utilities & Helpers:**
- Shared utilities: `lib/[category]/[utility].ts`
- Custom hooks: `hooks/use[Name].ts`
- Types: Either inline in component/hook or `types/[domain].d.ts`

**Business Logic:**
- Hook-based: `hooks/use[Domain].ts` (preferred for client-side)
- Controller-based: `controllers/[domain]/[controller].ts` (future backend)
- Service-based: `services/[service-name]/[module].ts` (API integrations)

**Configuration:**
- Environment-specific: See `.env` (not to be committed; use `next.config.ts` for public config)
- Feature flags: Add to `next.config.ts` or `tsconfig.json` paths as needed

## Special Directories

**views/components/SiriBubble/ — Special Component:**
- Purpose: 3D AI coach visualization using React Three Fiber
- Generated: Canvas element and Three.js meshes are generated at runtime
- Committed: Yes (source .tsx files)
- Includes: Suspense boundary, CSS fallback, type definitions, tests

**.planning/ — Planning Documents:**
- Purpose: GSD analysis and phase planning documents
- Generated: Yes (written by GSD mappers and planners)
- Committed: Yes (git-tracked for history)

**app/api/, lib/, models/, controllers/, services/ — Placeholder Directories:**
- Purpose: Structure for future backend implementation
- Committed: .gitkeep files hold empty directories
- Status: Not yet implemented; awaiting backend phases

**app/(marketing)/ — Marketing Routes:**
- Purpose: Public-facing pages (landing, pricing, etc.)
- Status: Placeholder; currently minimal content

---

*Structure analysis: 2026-02-21*
