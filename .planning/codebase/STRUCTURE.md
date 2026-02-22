# Codebase Structure

**Analysis Date:** 2026-02-22

## Directory Layout

```
pitchr/
├── app/                         # Next.js App Router (main routing)
│   ├── (app)/                   # Route group for authenticated pages
│   │   ├── analytics/           # Analytics dashboard page
│   │   ├── dashboard/           # Landing/home page
│   │   ├── deck/                # Deck upload and management
│   │   ├── demo/                # Demo/sample pitch page
│   │   ├── history/             # Run history and search
│   │   ├── results/[runId]/     # Detailed results for a single run
│   │   ├── review/[runId]/      # Review/discussion view
│   │   ├── session/             # Live pitch recording session
│   │   ├── settings/            # User settings page
│   │   ├── setup/               # Onboarding setup
│   │   └── layout.tsx           # Shared layout for (app) routes
│   ├── (marketing)/             # Marketing/landing pages (not detailed here)
│   ├── api/                     # API route handlers
│   │   ├── pitch/               # Pitch analysis endpoints
│   │   │   ├── run/             # POST (create run), GET (list runs)
│   │   │   ├── run/[runId]/     # GET (fetch run), DELETE (delete run)
│   │   │   └── run/stats/       # GET (aggregate stats)
│   │   ├── deck/                # Deck management endpoints
│   │   │   ├── upload/          # POST (upload PDF)
│   │   │   ├── generate/        # POST (AI deck generation)
│   │   │   ├── [deckId]/        # GET/DELETE (individual deck)
│   │   │   └── route.ts         # GET (list decks)
│   │   ├── miro/                # Miro board integration
│   │   │   ├── fix-board/       # Miro fix board endpoints
│   │   │   └── fix-board/sync/  # Sync with Miro API
│   │   ├── qna/                 # Q&A generation endpoints
│   │   ├── feedback/            # Feedback collection
│   │   ├── sessions/            # Session management
│   │   ├── ws/                  # WebSocket endpoints (if any)
│   │   └── [...catchAll]/route.ts # 404 handler
│   ├── layout.tsx               # Root layout (HTML, meta, ThemeProvider)
│   ├── page.tsx                 # Root page (redirects to /dashboard)
│   └── globals.css              # Tailwind directives, CSS variables
│
├── views/                       # React components (presentation layer)
│   ├── components/              # Reusable UI components
│   │   ├── SessionCanvas.tsx    # Main canvas for session (camera + deck display)
│   │   ├── MetricsPanel.tsx     # Live metrics sidebar (WPM, checklist, insights)
│   │   ├── AnalyzingOverlay.tsx # Loading/analyzing overlay
│   │   ├── SessionCanvas.tsx    # Camera + slide viewer composite
│   │   ├── SiriBubble/          # 3D orb visualization (Three.js)
│   │   ├── Scorecard/           # Score display components
│   │   ├── Timer/               # Countdown timer
│   │   ├── VideoFrame/          # Video playback/stream rendering
│   │   ├── SlideViewer/         # PDF slide display
│   │   ├── LiveMeters/          # Real-time metric gauges
│   │   ├── RunDetailModal.tsx   # Modal for run details
│   │   ├── GenerateDeckModal.tsx# Modal for AI deck generation
│   │   ├── MiroSyncPanel.tsx    # Miro board sync UI
│   │   ├── RecordingPlayer.tsx  # Audio/video playback
│   │   ├── AppSidebar.tsx       # Main navigation sidebar
│   │   ├── SidebarContext.tsx   # Context for session state sharing
│   │   ├── ThemeProvider.tsx    # Theme and orb state context
│   │   ├── StartSessionButton.tsx # Quick action button
│   │   ├── EngagementBubble.tsx # Head tracking engagement indicator
│   │   ├── ui/                  # Atomic UI primitives (buttons, inputs, etc.)
│   │   ├── deck-pdf/            # PDF rendering components
│   │   └── __tests__/           # Component test files
│   ├── screens/                 # Full-screen view compositions
│   │   ├── SessionScreen/       # Session experience wrapper
│   │   ├── ResultsScreen/       # Results display wrapper
│   │   ├── DeckScreen/          # Deck viewer wrapper
│   │   ├── BattleScreen/        # Pitch battle/comparison screen
│   │   └── SetupScreen/         # Onboarding flow
│   ├── layouts/                 # Layout wrappers (not heavily used)
│   ├── pre-components/          # Experimental/archived components
│   └── pre-mock/                # Mock component data
│
├── hooks/                       # React hooks (client-side state)
│   ├── useSessionState.ts       # Live metrics: WPM, filler words, checklist, insights
│   ├── useSTT.ts                # Speech-to-text: ElevenLabs Realtime API integration
│   ├── useRecorder.ts           # Audio/video recording: MediaRecorder wrapper
│   ├── useMediaStream.ts        # Webcam/microphone access
│   ├── useAudioRecorder.ts      # Alternative audio recording (low-level)
│   ├── usePitchRun.ts           # API call wrapper: POST /api/pitch/run
│   ├── useDeckSlides.ts         # Deck loading and slide navigation
│   ├── useMiroSync.ts           # Miro board synchronization
│   ├── useHeadTracking.ts       # MediaPipe head position tracking for engagement
│   └── __tests__/               # Hook test files
│
├── services/                    # Business logic (server + client)
│   ├── analysisService.ts       # Main analysis orchestration
│   ├── judgeAgentService.ts     # LLM-based feedback generation (judge)
│   ├── prepAgentService.ts      # Context preparation (rubric, examples, deck)
│   ├── scoringService.ts        # Composite score calculation
│   ├── runService.ts            # Run CRUD: insert, query, update, delete
│   ├── analysisCacheService.ts  # Analysis result caching (in-memory)
│   ├── analysisNormalizationService.ts # Schema version migration/normalization
│   ├── realtimeChecklistService.ts # Live checklist item evaluation
│   ├── deckService.ts           # Deck upload, PDF parsing, slide extraction
│   ├── recordingService.ts      # Audio/video upload to Supabase Storage
│   ├── pitchRunQueueService.ts  # Background job enqueuing (implicit queue)
│   ├── miro/                    # Miro API integration
│   │   ├── miroService.ts       # Miro board creation/sync
│   │   └── providers/           # Miro provider implementations
│   ├── claude/                  # Claude-specific service helpers
│   ├── gemini/                  # Gemini fallback service helpers
│   ├── elevenlabs/              # ElevenLabs TTS/STT integration
│   ├── __tests__/               # Service test files
│   └── README.md                # Service layer documentation
│
├── lib/                         # Utilities and low-level integrations
│   ├── supabase.ts              # Supabase client singleton
│   ├── llm/                     # LLM provider abstraction
│   │   ├── index.ts             # Provider factory/router
│   │   ├── types.ts             # LlmProvider interface, LlmCompletionRequest
│   │   ├── providers/           # Concrete provider implementations
│   │   │   ├── anthropic.ts     # Claude API (primary)
│   │   │   └── openrouter.ts    # OpenRouter fallback (Gemini via router)
│   │   └── __tests__/           # Provider tests
│   ├── prompts/                 # LLM prompt templates
│   │   ├── system.ts            # System prompt for judge
│   │   ├── judge.ts             # Rubric evaluation prompts
│   │   ├── rubric.ts            # Rubric definition prompt
│   │   ├── rewrite.ts           # Script rewrite prompt
│   │   ├── deckGeneration.ts    # AI deck generation prompt
│   │   ├── realtimeChecklist.ts # Realtime checklist evaluation prompt
│   │   └── __tests__/           # Prompt tests
│   ├── audio/                   # Audio utilities
│   │   └── audioUtils.ts        # Audio buffer manipulation
│   ├── video/                   # Video utilities
│   │   └── frameCapture.ts      # Canvas frame rendering
│   ├── headTracking/            # MediaPipe head tracking
│   │   ├── useHeadTracking.ts   # Hook wrapper for MediaPipe
│   │   ├── engagementBand.ts    # Engagement scoring logic
│   │   ├── faceDetector.ts      # MediaPipe Face Detector initialization
│   │   ├── videoFrame.ts        # Video frame processing
│   │   └── __tests__/           # Head tracking tests
│   ├── elevenlabs/              # ElevenLabs STT/TTS
│   │   ├── client.ts            # WebSocket client for realtime STT
│   │   └── config.ts            # ElevenLabs configuration
│   ├── review/                  # Review/discussion utilities
│   ├── scoring/                 # Score calculation helpers
│   └── ...                      # Other utility modules
│
├── models/                      # Data models and CRUD
│   ├── run.ts                   # Run schema and database CRUD (insert, query, update, delete)
│   └── README.md                # Models documentation
│
├── controllers/                 # HTTP request handlers (API orchestration)
│   ├── pitchController.ts       # Pitch run validation and queueing
│   ├── deck/                    # Deck endpoint handlers
│   ├── feedback/                # Feedback collection handlers
│   ├── qna/                     # Q&A generation handlers
│   ├── session/                 # Session lifecycle handlers
│   └── README.md                # Controllers documentation
│
├── types/                       # TypeScript type definitions
│   ├── pitch.ts                 # Core pitch types: Run, PitchMode, InputType, RunStatus
│   ├── analysis-v2.ts           # Analysis schema: RubricScore, Fix, AnalysisResult
│   ├── analysis.ts              # Legacy analysis schema (v1)
│   ├── deckGeneration.ts        # Deck generation types
│   ├── checklist.ts             # Realtime checklist types
│   ├── glsl.d.ts                # GLSL shader type declarations
│   └── README.md                # Types documentation
│
├── config/                      # Configuration and constants
│   ├── modes.ts                 # Pitch mode configs (elevator, vc_pitch)
│   ├── rubric.ts                # Rubric definitions (categories, scoring)
│   ├── sampleResult.ts          # Fallback/demo analysis result
│   ├── realtimeChecklist.ts     # Checklist item definitions
│   ├── strictness.ts            # Scoring strictness caps
│   ├── deckTemplates.ts         # Deck generation templates
│   ├── prompts/                 # Prompt variations or overrides
│   └── rubrics/                 # Rubric variations
│
├── store/                       # Client-side state (if used)
│   └── [state management files, if any]
│
├── migrations/                  # Database schema (unused - uses Supabase)
│   └── [numbered SQL migration files]
│
├── supabase/                    # Supabase-specific files
│   ├── migrations/              # Supabase SQL migrations
│   └── config.toml              # Supabase local dev config
│
├── docs/                        # Documentation
│   ├── SUPABASE_SETUP.md        # Supabase setup instructions
│   ├── architecture/            # Architecture diagrams/notes
│   ├── integrations/            # Integration guides
│   ├── prd/                     # Product requirements
│   └── analysis/                # Analysis outputs
│
├── tests/                       # Test files (Vitest + Playwright)
│   ├── e2e/                     # End-to-end tests (Playwright)
│   ├── fixtures/                # Test data and mock responses
│   │   └── pitches/             # Sample pitch transcripts
│   └── ...
│
├── scripts/                     # Build and utility scripts
│   ├── normalize-encoding.mjs   # Fix UTF-8 encoding issues
│   ├── check-encoding.mjs       # Validate UTF-8 encoding
│   ├── snapshot-curated-sources.ts # Knowledge base snapshots
│   └── build-knowledge-pack.ts  # Knowledge pack generation
│
├── knowledge/                   # External knowledge/data
│   ├── curated/                 # Curated external sources
│   └── snapshots/               # Knowledge snapshots by date
│
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── next.config.ts               # Next.js configuration
├── vitest.config.ts             # Vitest configuration
├── playwright.config.ts         # Playwright e2e config
├── CLAUDE.md                    # Project instructions (this file)
├── PRD.md                       # Product requirements document
├── README.md                    # Repository overview
└── .env.example                 # Environment variable template
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router structure for all page routes and API endpoints
- Contains: Page components, layout wrappers, API handlers
- Key files: All files here are routable

**app/(app)/:**
- Purpose: Grouped routes for the main application (outside marketing/auth)
- Contains: Dashboard, session, results, history, deck, settings pages
- Route group syntax allows shared layout without changing URL structure

**app/api/:**
- Purpose: API route handlers responding to client HTTP requests
- Contains: Controllers that validate input, call services, return responses
- Route files use `route.ts` extension (not `[id].ts`)

**views/components/:**
- Purpose: Reusable React components for UI rendering
- Contains: Stateless or lightly-stateful presentational components
- Pattern: Components receive props, emit callbacks; no API calls (use hooks in parent)
- Compound components in subdirectories (e.g., `SiriBubble/`, `Scorecard/`) have `index.ts` barrel file

**views/screens/:**
- Purpose: Full-screen view compositions combining multiple components
- Contains: Page-level layout and orchestration (less common - mostly done in page.tsx)
- Example: `SessionScreen/` combines canvas, metrics panel, controls

**hooks/:**
- Purpose: Custom React hooks for state management and side effects
- Contains: useSessionState (metrics), useSTT (speech-to-text), useRecorder (media), usePitchRun (API)
- Pattern: Hooks can make API calls, manage complex state, handle subscriptions

**services/:**
- Purpose: Business logic layer (can run on server or client)
- Contains: analysisService (orchestration), judgeAgentService (LLM), runService (database)
- Pattern: Pure functions or classes; no React dependencies; can be imported in API routes

**lib/:**
- Purpose: Utility modules and third-party integrations
- Contains: Supabase client, LLM providers, MediaPipe setup, prompt templates
- Subdirectories: `llm/` (provider abstraction), `prompts/` (templates), `headTracking/` (MediaPipe)

**models/:**
- Purpose: Data access layer (CRUD operations and schema)
- Contains: run.ts (RunRecord interface, insert/query/update/delete functions)
- Pattern: Direct Supabase interactions; no business logic

**controllers/:**
- Purpose: HTTP request validation and orchestration
- Contains: pitchController.ts (validates CreatePitchRunRequest, creates run, queues job)
- Pattern: Thin layer between API routes and services; focuses on validation and queuing

**types/:**
- Purpose: TypeScript interfaces and type definitions
- Contains: pitch.ts (Run, PitchMode), analysis-v2.ts (AnalysisResult, RubricScore)
- Pattern: Shared across client and server; strictly typed, no `any`

**config/:**
- Purpose: Application constants and configuration
- Contains: modes.ts (elevator/vc_pitch configs), rubric.ts (scoring rules), sampleResult.ts (fallback)
- Pattern: Immutable constants; used by services and components

**tests/:**
- Purpose: Test files (Vitest for unit/integration, Playwright for e2e)
- Contains: Test fixtures, sample data, test utilities
- Pattern: Co-located tests in `__tests__/` subdirectories; fixtures in `tests/fixtures/`

**docs/:**
- Purpose: Documentation and design docs
- Contains: SUPABASE_SETUP.md, architecture notes, PRD.md
- Not generated; manually maintained

**migrations/ and supabase/:**
- Purpose: Database schema management (legacy; Supabase handles migrations)
- Contains: SQL migration files for Supabase
- Location: `supabase/migrations/` is the source of truth for schema

## Key File Locations

**Entry Points:**
- `app/page.tsx` - Root entry (redirects to dashboard)
- `app/layout.tsx` - HTML root, meta, ThemeProvider
- `app/(app)/dashboard/page.tsx` - Home/landing page
- `app/(app)/session/page.tsx` - Live pitch recording session

**Configuration:**
- `next.config.ts` - GLSL shader loading, server external packages
- `tsconfig.json` - Path alias `@/*` → root, strict mode
- `package.json` - Dependencies, dev scripts
- `vitest.config.ts` - Test runner config, coverage settings

**Core Logic:**
- `services/analysisService.ts` - Main analysis orchestration (prepare context → judge → score)
- `controllers/pitchController.ts` - HTTP validation and queuing
- `lib/llm/providers/anthropic.ts` - Claude API client with retry logic
- `lib/prompts/judge.ts` - Judge LLM prompt template

**LLM Integration:**
- `lib/llm/providers/anthropic.ts` - Claude API implementation
- `lib/prompts/system.ts` - System prompt for judge
- `lib/prompts/judge.ts` - Rubric evaluation questions
- `config/sampleResult.ts` - Fallback result when LLM fails

**Real-Time Session:**
- `hooks/useSessionState.ts` - Live metrics state
- `hooks/useSTT.ts` - Speech-to-text integration
- `hooks/useRecorder.ts` - Audio/video recording
- `views/components/SessionCanvas.tsx` - Main session UI
- `views/components/MetricsPanel.tsx` - Metrics sidebar
- `services/realtimeChecklistService.ts` - Live checklist evaluation

**Data Persistence:**
- `models/run.ts` - Run CRUD operations
- `services/deckService.ts` - Deck upload and PDF parsing
- `services/recordingService.ts` - Recording upload to Supabase Storage
- `lib/supabase.ts` - Supabase client singleton

**Testing:**
- `hooks/__tests__/` - Hook tests
- `views/components/__tests__/` - Component tests
- `services/__tests__/` - Service tests
- `tests/e2e/` - Playwright end-to-end tests
- `tests/fixtures/` - Mock data and test utilities

**Type Definitions:**
- `types/pitch.ts` - Core pitch types (Run, PitchMode, InputType)
- `types/analysis-v2.ts` - Analysis result schema (RubricScore, Fix, AnalysisResult)
- `types/checklist.ts` - Checklist item types

## Naming Conventions

**Files:**
- Components: PascalCase (`SessionCanvas.tsx`, `MetricsPanel.tsx`)
- Hooks: camelCase with `use` prefix (`useSessionState.ts`, `usePitchRun.ts`)
- Services: camelCase + Service suffix (`analysisService.ts`, `deckService.ts`)
- Utilities: camelCase (`supabase.ts`, `audioUtils.ts`)
- Types: PascalCase for interfaces (`RubricScore`, `AnalysisResult`)
- Constants: UPPER_SNAKE_CASE in code, kebab-case for directories

**Directories:**
- React components: PascalCase (`SiriBubble/`, `Scorecard/`)
- Utilities: camelCase (`headTracking/`, `elevenlabs/`)
- Pages: kebab-case to match URL (`session/`, `results/`)

**Exports:**
- Components: Named exports only (no default exports)
- Hooks: Named exports (e.g., `export function useSessionState()`)
- Services: Named exports for functions, class exports where appropriate
- Types: Named exports (e.g., `export interface Run`)

**Barrel Files:**
- `components/SiriBubble/index.ts` - Exports main component and sub-components
- `components/ui/index.ts` - Exports all UI primitives

## Where to Add New Code

**New Feature (end-to-end):**
1. Add page route: `app/(app)/[feature]/page.tsx`
2. Add API endpoint: `app/api/[feature]/route.ts`
3. Add controller: `controllers/[feature]/` (if complex validation needed)
4. Add service: `services/[feature]Service.ts` (business logic)
5. Add hook: `hooks/use[Feature].ts` (client-side state if needed)
6. Add types: Update `types/pitch.ts` or create `types/[feature].ts`
7. Add tests: `__tests__/[feature].test.ts` co-located with source

**New Component:**
1. Create: `views/components/[ComponentName].tsx`
2. Export: Named export `export function [ComponentName]() { ... }`
3. Add types: Interface for props inline or in `types/[domain].ts`
4. Add tests: `views/components/__tests__/[ComponentName].test.tsx`
5. Use in pages/other components: Import with `@/views/components/[ComponentName]`

**New Service:**
1. Create: `services/[domain]Service.ts`
2. Pattern: Export named functions, not class (unless stateful)
3. Dependencies: Import from `lib/`, `types/`, `models/`, other services
4. Error handling: Throw custom error classes or return `{ error: string }`
5. Tests: `services/__tests__/[domain]Service.test.ts`

**New Utility/Helper:**
1. Create: `lib/[domain]/[name].ts`
2. Export: Named functions or class
3. No external dependencies (except @supabase, @anthropic/sdk if applicable)
4. Tests: `lib/[domain]/__tests__/[name].test.ts`

**New Type:**
1. File: `types/[domain].ts` (or add to `types/pitch.ts` if core)
2. Pattern: `export interface [Name] { ... }`
3. Export: Always named (no default)
4. Location: Use same file for related types

**Environment Variables:**
1. Add to `.env.example` with description
2. Read in: `lib/supabase.ts`, `lib/llm/providers/anthropic.ts`, or service files
3. Validation: Check `if (!var) throw new Error('Missing VAR')` on first use
4. Never commit `.env` or `.env.local`

## Special Directories

**app/(app):**
- Purpose: Route group for main app pages
- Generated: No
- Committed: Yes
- Syntax: Parentheses mean routes don't affect URL structure

**app/api/:**
- Purpose: API route handlers (serverless functions)
- Generated: No
- Committed: Yes
- Pattern: Each `route.ts` file is an endpoint

**views/components/__tests__/:**
- Purpose: Co-located component tests
- Generated: No
- Committed: Yes
- Pattern: Mirror source structure (e.g., `SessionCanvas.test.tsx` next to `SessionCanvas.tsx`)

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (in `.gitignore`)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (by `yarn install`)
- Committed: No (in `.gitignore`)

**knowledge/snapshots/**:**
- Purpose: External knowledge database snapshots
- Generated: Yes (by `yarn knowledge:snapshot`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-02-22*
