# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
pitchr/
├── app/
│   ├── (app)/                    # Authenticated app routes (grouped with SidebarProvider)
│   │   ├── layout.tsx            # App layout with sidebar provider
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Home page, lists runs + stats
│   │   ├── session/
│   │   │   └── page.tsx          # Main pitch recording/analysis page
│   │   ├── session/[id]/         # Dynamic session detail (if needed)
│   │   ├── results/[runId]/
│   │   │   └── page.tsx          # Score display, fixes, rewrite, metrics
│   │   ├── history/
│   │   │   └── page.tsx          # List all past runs with filters
│   │   ├── deck/
│   │   │   └── page.tsx          # Presentation slide upload + viewer
│   │   ├── analytics/
│   │   │   └── page.tsx          # Trends, stats over time
│   │   ├── settings/
│   │   │   └── page.tsx          # User preferences (theme, pitch mode default)
│   │   ├── demo/
│   │   │   └── page.tsx          # Demo with sample result
│   │   └── setup/
│   │       └── page.tsx          # Initial onboarding (TBD)
│   ├── (marketing)/              # Marketing routes (no sidebar)
│   │   └── (landing pages)
│   ├── api/
│   │   ├── pitch/
│   │   │   └── run/
│   │   │       └── route.ts      # POST /api/pitch/run — main analysis endpoint
│   │   ├── deck/
│   │   │   ├── route.ts          # Deck CRUD
│   │   │   ├── upload/
│   │   │   │   └── route.ts      # PDF upload endpoint
│   │   │   └── [deckId]/
│   │   │       └── route.ts      # Specific deck endpoint
│   │   ├── sessions/
│   │   │   ├── route.ts          # Session management
│   │   │   └── [id]/
│   │   │       └── route.ts      # Specific session endpoint
│   │   ├── feedback/
│   │   │   └── route.ts          # Feedback collection endpoint
│   │   ├── qna/
│   │   │   └── route.ts          # Q&A feature endpoint
│   │   └── ws/
│   │       ├── audio/
│   │       │   └── route.ts      # WebSocket for live audio streaming
│   │       └── video/
│   │           └── route.ts      # WebSocket for live video streaming
│   ├── layout.tsx                # Root layout, metadata, ThemeProvider
│   └── page.tsx                  # Root redirect to /dashboard
├── views/
│   ├── components/               # Reusable UI components
│   │   ├── AppSidebar.tsx        # Main navigation sidebar
│   │   ├── SidebarContext.tsx    # Sidebar state provider
│   │   ├── ThemeProvider.tsx     # Dark/light mode + orb state
│   │   ├── SessionCanvas.tsx     # Main session UI container
│   │   ├── MetricsPanel.tsx      # Live metrics display (WPM, clarity, etc.)
│   │   ├── SiriBubble/           # 3D orb component (Three.js)
│   │   │   ├── index.ts          # Barrel export
│   │   │   ├── SiriBubble.tsx    # Main component
│   │   │   ├── Orb.tsx           # Three.js geometry
│   │   │   ├── useSiriBubble.ts  # Hook for orb state logic
│   │   │   ├── types.ts          # OrbState type
│   │   │   ├── constants.ts      # Color, animation constants
│   │   │   └── shaders/          # GLSL shader files
│   │   │       ├── vertex.glsl
│   │   │       └── fragment.glsl
│   │   ├── Scorecard/            # Score breakdown display component
│   │   ├── LiveMeters/           # Real-time metric gauges
│   │   ├── Timer/                # Session timer component
│   │   ├── VideoFrame/           # Video stream display
│   │   ├── SlideViewer/          # Deck slide display
│   │   ├── EngagementBubble.tsx  # Speech bubble for coach messages
│   │   ├── StartSessionButton.tsx # Session start button
│   │   ├── ui/                   # Base UI components
│   │   │   ├── index.ts          # Barrel export
│   │   │   ├── GlassCard.tsx     # Glassmorphism card wrapper
│   │   │   ├── ScoreBadge.tsx    # Score display badge
│   │   │   ├── CategoryBar.tsx   # Rubric category progress bar
│   │   │   ├── StatCard.tsx      # Stats display card
│   │   │   ├── TagPill.tsx       # Tag/chip component
│   │   │   ├── EmptyState.tsx    # Empty list fallback
│   │   │   ├── SearchInput.tsx   # Search/filter input
│   │   │   ├── SectionHeader.tsx # Section title component
│   │   │   ├── TimeRangeSelector.tsx # Filter by date range
│   │   │   ├── colors.ts         # Color constants and functions
│   │   │   └── __tests__/
│   │   └── __tests__/            # Component tests
│   ├── layouts/                  # Layout wrappers (if complex)
│   ├── screens/                  # Screen-level components
│   │   ├── SessionScreen/
│   │   ├── ResultsScreen/
│   │   ├── DeckScreen/
│   │   ├── BattleScreen/         # Pitch battle/comparison screen
│   │   └── SetupScreen/
│   ├── pre-components/           # Deprecated/legacy components (remove)
│   └── pre-mock/                 # Deprecated/legacy mock data (remove)
├── hooks/
│   ├── usePitchRun.ts            # Pitch analysis orchestration hook
│   ├── useSessionState.ts        # Session state (metrics, checklist, insights)
│   ├── useMediaStream.ts         # Camera/mic stream management
│   ├── useSTT.ts                 # Speech-to-text integration (ElevenLabs)
│   └── useDeckSlides.ts          # Deck slide parsing and navigation
├── services/
│   ├── analysisService.ts        # Core pitch analysis orchestration
│   ├── scoringService.ts         # Delivery metrics calculation
│   ├── deckService.ts            # Deck upload and processing
│   ├── claude/
│   │   └── (Claude API client wrappers - legacy?)
│   ├── gemini/
│   │   └── (Gemini API client wrappers)
│   ├── elevenlabs/
│   │   └── (TTS service wrapper)
│   └── miro/
│       └── (Miro board generation wrapper)
├── controllers/
│   ├── pitchController.ts        # Pitch analysis endpoint orchestration
│   ├── session/
│   │   └── (Session management controllers)
│   ├── deck/
│   │   └── (Deck CRUD controllers)
│   ├── feedback/
│   │   └── (Feedback controllers)
│   └── qna/
│       └── (Q&A controllers)
├── models/
│   └── run.ts                    # Run data persistence (localStorage CRUD)
├── lib/
│   ├── llm/
│   │   ├── router.ts             # Provider routing based on env var
│   │   ├── types.ts              # LlmProvider interface, LlmCompletionRequest
│   │   └── providers/
│   │       ├── anthropic.ts      # Claude API client
│   │       └── openrouter.ts     # OpenRouter API client
│   ├── prompts/
│   │   ├── system.ts             # System prompt for pitch evaluation
│   │   ├── rubric.ts             # Rubric scoring prompt builder
│   │   └── rewrite.ts            # Rewrite script prompt builder
│   ├── audio/
│   │   └── (Audio processing utilities)
│   ├── video/
│   │   └── (Video processing utilities)
│   ├── headTracking/
│   │   └── useHeadTracking.ts    # Head position tracking hook
│   ├── scoring/
│   │   └── (Scoring utilities - consider consolidating with scoringService)
│   └── supabase.ts               # Supabase client initialization (for future DB)
├── config/
│   ├── modes.ts                  # Pitch mode definitions (elevator, vc_pitch)
│   ├── rubric.ts                 # Rubric category weights and definitions
│   ├── sampleResult.ts           # Fallback demo analysis result
│   ├── prompts/
│   │   └── (Prompt configurations)
│   └── rubrics/
│       └── (Rubric configuration files)
├── types/
│   ├── pitch.ts                  # Run, PitchMode, InputType, API request/response types
│   ├── analysis.ts               # AnalysisResult, RubricScore, Fix, RubricCategory
│   └── glsl.d.ts                 # TypeScript declaration for .glsl imports
├── store/
│   └── (Client-side state management - if used beyond hooks)
├── tests/
│   └── e2e/                      # E2E tests (if using Playwright, Cypress)
├── migrations/
│   └── (Database schema migrations - for future Supabase)
├── supabase/
│   └── migrations/               # Supabase-specific migrations
├── public/
│   └── (Static assets, favicon, etc.)
├── docs/
│   ├── architecture/
│   ├── plans/                    # Planning documents
│   └── prd/                      # Product requirements
├── scripts/
│   └── (Build/utility scripts - check encoding, etc.)
├── .planning/
│   ├── codebase/                 # Architecture documentation (STACK.md, etc.)
│   ├── phase-1/
│   ├── phase-2/
│   └── (Other planning docs)
├── next.config.ts               # GLSL loader config for shaders
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS theme config
├── package.json                 # Dependencies, scripts
├── .env.example                 # Environment variable template
└── CLAUDE.md                    # This repo's instructions for Claude Code
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router route definitions
- Contains: Pages (.tsx files), API route handlers, layouts, middleware
- Key files: `layout.tsx` (root), `(app)/layout.tsx` (sidebar provider)

**app/(app)/:**
- Purpose: Authenticated app routes grouped by feature
- Contains: Feature pages (session, results, history, deck, etc.)
- Key files: `page.tsx` files for each route

**app/api/:**
- Purpose: API endpoints serving client requests
- Contains: Route handlers that call controllers and services
- Key files: `pitch/run/route.ts` (main analysis endpoint)

**views/components/:**
- Purpose: Reusable React UI components
- Contains: Component .tsx files, tests in `__tests__/` subdirs
- Key files: `SiriBubble/` (3D orb), `ui/` (base components), `SessionCanvas.tsx` (main session UI)

**hooks/:**
- Purpose: Custom React hooks for state and API orchestration
- Contains: Hook .ts files using 'use client' and React hooks
- Key files: `usePitchRun.ts` (analysis), `useSessionState.ts` (metrics), `useSTT.ts` (speech-to-text)

**services/:**
- Purpose: Business logic and external service integration
- Contains: Service .ts files (not client-side, callable from controllers/hooks)
- Key files: `analysisService.ts` (LLM pipeline), `scoringService.ts` (metrics), `deckService.ts` (PDF processing)

**controllers/:**
- Purpose: HTTP request orchestration and validation
- Contains: Controller .ts files that call services
- Key files: `pitchController.ts` (validates pitch requests)

**models/:**
- Purpose: Data persistence and validation
- Contains: Model .ts files with CRUD operations
- Key files: `run.ts` (localStorage operations for Run objects)

**lib/**:
- Purpose: Utility libraries and integrations
- Contains: LLM clients, prompts, helper functions
- Key files: `llm/router.ts` (provider routing), `prompts/` (system/rubric/rewrite)

**config/:**
- Purpose: Centralized domain constants
- Contains: Mode definitions, rubric weights, sample data
- Key files: `modes.ts` (pitch mode config), `sampleResult.ts` (fallback demo)

**types/:**
- Purpose: Shared TypeScript type definitions
- Contains: Type .ts files (no logic, only interfaces/types)
- Key files: `pitch.ts` (Run, PitchMode), `analysis.ts` (AnalysisResult, Fix)

## Key File Locations

**Entry Points:**

- Root page: `app/page.tsx` (redirects to /dashboard)
- Root layout: `app/layout.tsx` (metadata, ThemeProvider)
- App layout: `app/(app)/layout.tsx` (SidebarProvider wrapper)
- Main session: `app/(app)/session/page.tsx` (recording/analysis)
- Results display: `app/(app)/results/[runId]/page.tsx`

**Configuration:**

- Environment: `.env.example` (template for ANTHROPIC_API_KEY, etc.)
- Build: `next.config.ts` (GLSL loader), `tsconfig.json` (strict mode), `tailwind.config.ts`
- Pitch modes: `config/modes.ts`
- Rubric: `config/rubric.ts`

**Core Logic:**

- Analysis: `services/analysisService.ts` (LLM pipeline), `services/scoringService.ts` (delivery metrics)
- LLM routing: `lib/llm/router.ts` (env-based provider selection)
- Prompts: `lib/prompts/system.ts`, `lib/prompts/rubric.ts`, `lib/prompts/rewrite.ts`
- Models: `models/run.ts` (localStorage CRUD)

**Testing:**

- Vitest config: Not found in root (check next.config for test setup)
- Test files: Co-located with source in `__tests__/` subdirs
- Examples: `views/components/SiriBubble/__tests__/SiriBubble.test.tsx`

## Naming Conventions

**Files:**

- Components: PascalCase + .tsx (e.g., `ScoreBadge.tsx`, `SessionCanvas.tsx`)
- Hooks: camelCase with 'use' prefix + .ts (e.g., `usePitchRun.ts`, `useSessionState.ts`)
- Services: camelCase + 'Service' suffix + .ts (e.g., `analysisService.ts`, `scoringService.ts`)
- Models: camelCase + .ts (e.g., `run.ts`)
- Controllers: camelCase + 'Controller' suffix + .ts (e.g., `pitchController.ts`)
- Types: camelCase + .ts (e.g., `pitch.ts`, `analysis.ts`)
- API routes: `route.ts` (Next.js convention)
- Layouts: PascalCase + Layout suffix (e.g., `AppLayout.tsx`)

**Directories:**

- Feature directories: kebab-case (e.g., `session/`, `results/`, `live-meters/`)
- Internal directories: lowercase (e.g., `components/`, `hooks/`, `services/`, `lib/`)
- Grouped routes: parentheses convention `(app)/`, `(marketing)` per Next.js App Router
- Test directories: `__tests__/` co-located with source

**Code Conventions (from CLAUDE.md):**

- Variables: camelCase
- Constants: UPPER_SNAKE_CASE (e.g., `COACH_MESSAGES`, `MOCK_CHECKLIST`)
- State booleans: `is` prefix (e.g., `isRecording`, `isCameraOn`)
- Refs: camelCase + `Ref` suffix (e.g., `videoRef`, `intervalRef`)
- Event handlers: `on` prefix (e.g., `onStartSession`, `onStopSession`)
- Types/Interfaces: PascalCase (e.g., `AnalysisResult`, `RubricScore`)

## Where to Add New Code

**New Feature (e.g., new pitch analysis mode):**

1. **Type definitions:** Add to `types/pitch.ts` or `types/analysis.ts`
2. **Configuration:** Add mode config to `config/modes.ts`
3. **Service logic:** Extend `services/analysisService.ts` or create new service file
4. **API endpoint:** Create `app/api/[feature]/route.ts`
5. **Controller:** Create `controllers/[feature]Controller.ts`
6. **Hook (if client state):** Create `hooks/use[Feature].ts`
7. **Page:** Create `app/(app)/[feature]/page.tsx`
8. **Tests:** Add `__tests__/` subdirectory in each module

**New Component:**

- Reusable: Place in `views/components/[ComponentName]/`
- Single file (<300 lines): `views/components/[ComponentName].tsx`
- Compound component: `views/components/[ComponentName]/index.ts` (barrel export) + sub-components
- UI primitive: Place in `views/components/ui/[ComponentName].tsx`
- Screen-specific: Place in `views/screens/[ScreenName]/[ComponentName].tsx`
- Co-locate tests: `views/components/[ComponentName]/__tests__/[name].test.tsx`

**New Service:**

- Location: `services/[name]Service.ts` or `services/[name]/index.ts`
- Pattern: Named exports only
- Signature: Pure functions taking typed input, returning Promise<TypedOutput> for async
- Usage: Import via `@/services/[name]` from controllers and hooks

**New Hook:**

- Location: `hooks/use[Name].ts`
- Pattern: 'use' prefix, export named function
- Pattern: 'use client' directive if it uses React hooks
- Usage: Import via `@/hooks/use[Name]` from components and pages

**New Utility/Helper:**

- Location: `lib/[domain]/[utility].ts`
- Pattern: Named exports only
- Usage: Import via `@/lib/[domain]/[utility]`

## Special Directories

**views/pre-components/ and views/pre-mock/:**
- Purpose: Deprecated/legacy code (marked for removal)
- Generated: No
- Committed: Yes (but should be cleaned up)

**migrations/ and supabase/migrations/:**
- Purpose: Database schema migrations (for future Supabase integration)
- Generated: No
- Committed: Yes

**docs/ and .planning/:**
- Purpose: Documentation and planning
- Generated: No (human-written)
- Committed: Yes

**node_modules/, .next/, .yarn/:**
- Purpose: Build artifacts and dependencies
- Generated: Yes
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-21*
