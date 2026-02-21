# Pitchr — Project State

> Last updated: 2026-02-21

---

## Overall Status: ~85% Complete (MVP Functional)

The core pitch-analysis loop works end-to-end: record/paste a pitch, get scored by LLM, view results with rubric breakdown, fixes, rewrite, and delivery metrics. Supabase persistence, deck management, 3D orb, and head tracking are all operational. Remaining work is mostly test coverage, Tier 1 integrations, and component extraction.

---

## Completed Features

### Pages (all 8 routes working)

| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard` | Working | Greeting, quick stats, latest runs, rubric averages, trend data |
| `/session` | Working | Camera/mic, WebSocket STT, head tracking, deck slides, mode picker |
| `/results/[runId]` | Working | Score, rubric breakdown, top fixes, rewrite, delivery metrics, transcript |
| `/review/[runId]` | Working | Alternative results view with formatted bullet points |
| `/history` | Working | Filter by mode, search, grid/list toggle, delete, pagination |
| `/analytics` | Working | Time-range filtered (7D/30D/90D/All), trends, category stats |
| `/deck` | Working | Upload PDF/PPTX, drag-drop, generate via LLM, delete, search |
| `/demo` | Working | Interactive SiriBubble orb with state/intensity controls |

### API Endpoints (all operational)

| Endpoint | Methods | Notes |
|----------|---------|-------|
| `/api/pitch/run` | POST, GET | Create analysis run, list all runs |
| `/api/pitch/run/[runId]` | GET, DELETE | Fetch/delete single run |
| `/api/pitch/run/stats` | GET | Aggregate stats for dashboard |
| `/api/deck` | GET, POST | List/create deck records |
| `/api/deck/[deckId]` | GET, DELETE | Fetch/delete deck + storage cleanup |
| `/api/deck/upload` | POST | Upload PDF/PPTX, extract text, store in Supabase |
| `/api/deck/generate` | POST | LLM generates 10-slide deck, renders to PDF |

### Services

| Service | File | Status |
|---------|------|--------|
| Analysis pipeline | `services/analysisService.ts` | Working — LLM call, JSON parse, validation, fallback cascade |
| Delivery scoring | `services/scoringService.ts` | Working — WPM, filler words, repeated phrases |
| Run CRUD | `services/runService.ts` | Working — Supabase insert/list/get/delete/stats |
| Deck management | `services/deckService.ts` | Working — PPTX-to-PDF conversion, storage, text extraction |
| Deck generation | `services/deckGenerationService.ts` | Working — LLM to 10-slide JSON, React-PDF render, upload |

### LLM Pipeline

| Component | Status |
|-----------|--------|
| LLM router (`lib/llm/router.ts`) | Working — routes to Anthropic or OpenRouter |
| Anthropic provider | Working — Claude claude-sonnet-4-6 |
| OpenRouter provider | Working — Gemini Flash via OpenRouter |
| System prompt (`lib/prompts/system.ts`) | Complete |
| Rubric prompt (`lib/prompts/rubric.ts`) | Complete |
| Rewrite prompt (`lib/prompts/rewrite.ts`) | Complete |
| Deck generation prompt (`lib/prompts/deckGeneration.ts`) | Complete |

### Hooks

| Hook | Status |
|------|--------|
| `useMediaStream` | Working — getUserMedia, camera/mic toggle, cleanup |
| `useSTT` | Working — WebSocket streaming, 16kHz PCM, transcript segments |
| `useSessionState` | Working (metrics simulated — see Mocks section) |
| `usePitchRun` | Working — POST to API, loading/error states |
| `useDeckSlides` | Working — PDF load, slide navigation, canvas render |
| `useMiroSync` | Working — calls Miro API endpoint |
| `useSiriBubble` | Working — orb state management |

### Infrastructure

| Component | Status |
|-----------|--------|
| Supabase client (`lib/supabase.ts`) | Connected |
| Database tables (decks, slides, runs) | All migrated (6 migration files) |
| Supabase Storage bucket (decks) | Configured, 50MB limit, public access |
| 3D Orb (SiriBubble) | Fully working — custom GLSL shaders, state animations |
| Head tracking (MediaPipe) | Working — yaw/pitch/roll, engagement bands |
| WebSocket STT server (`server.ts`) | Working — requires external STT backend on port 3001 |

---

## All Mocks, Stubs, and Simulated Data

### Production Mocks (used in live app)

#### 1. `SAMPLE_RESULT` — LLM fallback analysis
- **File:** `config/sampleResult.ts`
- **What:** Complete hardcoded `AnalysisResult` (score 62, 5 rubric scores, 5 fixes, rewrite script, delivery metrics)
- **When used:** Final fallback when all LLM calls fail (Claude + repair prompt both fail)
- **Consumed by:** `services/analysisService.ts` line ~325
- **Marked with:** `fallback: true` flag on the response

#### 2. `useSessionState` — Simulated live metrics
- **File:** `hooks/useSessionState.ts` lines 44-139
- **What:** Client-side simulation running every 2 seconds during a session:
  - **WPM:** `Math.random()` jitter on previous value ±10%, range 80-200
  - **Filler words:** 15% chance to increment per interval (`Math.random() > 0.7`)
  - **Conciseness:** Random walk ±0.5 points, clamped 0-10
  - **Clarity:** Random walk ±0.5 points, clamped 0-10
  - **Orb state:** 15% chance per 2s to randomly pick from `['active', 'positive', 'neutral']`
  - **Checklist:** 15% chance to advance items `uncovered → partial → completed`
  - **Coach bubbles:** Random message from `COACH_MESSAGES` every 6 seconds
- **Hardcoded arrays:**
  - `MOCK_CHECKLIST` (8 items: intro, problem, solution, market, model, traction, team, ask)
  - `COACH_MESSAGES` (10 phrases: "Great eye contact!", "Slow down a bit", etc.)
  - `MOCK_INSIGHTS` (2 sample insights with timestamps)
- **Why it matters:** These are visual-only — real scoring happens server-side in `scoringService.ts` after the session ends. But the live metrics panel shows fake numbers during recording.

#### 3. `DEFAULT_FIX_LIBRARY` — Fallback fix recommendations
- **File:** `services/analysisService.ts` lines 37-76
- **What:** 5 generic fixes (one per rubric category) used when LLM returns fewer than 5 fixes
- **When used:** Fills gaps in incomplete LLM responses

#### 4. `MiroStubProvider` — Fake Miro boards
- **File:** `services/miro/providers/miroStubProvider.ts`
- **What:** Generates deterministic fake board data:
  - Board IDs: `stub-board-{hash(runId)}`
  - Board URLs: `https://miro.com/app/board/{hash}/`
  - Fix statuses: cycled through `todo/doing/done/blocked`
  - Owner emails: alternating `pm@pitchr.local` / empty
- **When used:** Default when `MIRO_ACCESS_TOKEN` not set or `MIRO_PROVIDER=stub`
- **Marked with:** `fallback: true` + warning message

#### 5. `GenerateDeckModal` — Fake progress steps
- **File:** `views/components/GenerateDeckModal.tsx` lines 246-258
- **What:** Timed UI animation during deck generation:
  - 0s: "Crafting your story"
  - 3s: "Building slides"
  - 8s: "Applying theme"
  - 13s: "Rendering PDF"
- **Why:** UX feedback while actual API call runs in parallel. Not data simulation.

### Test-Only Mocks

| Mock | File | What |
|------|------|------|
| Three.js Canvas/Orb | `views/components/SiriBubble/__tests__/SiriBubble.test.tsx` | `vi.mock('@react-three/fiber')` — WebGL unavailable in jsdom |
| Miro sample request | `services/miro/__tests__/miroService.test.ts` | Hardcoded `sampleRequest` for unit tests |
| Engagement band samples | `lib/headTracking/__tests__/engagementBand.test.ts` | `makeSamples()` helper generating controlled state distributions |
| Playwright fake media | `playwright.config.ts` | `--use-fake-device-for-media-stream` Chromium flag for E2E |

---

## Unfinished / Missing / Incomplete

### High Severity

| Item | Details |
|------|---------|
| **Test coverage ~20%** | Only SiriBubble, engagement bands, colors, and Miro service have tests. No tests for: `analysisService`, `scoringService`, `runService`, `pitchController`, LLM router, `useSTT`, `usePitchRun`, any API routes, any page components |
| **Live session metrics are fake** | `useSessionState` shows random WPM/filler/clarity numbers during recording. No real-time transcript analysis feeds the metrics panel. Real analysis only happens after session ends. |
| **ElevenLabs TTS not implemented** | `services/elevenlabs/` contains only `.gitkeep`. No TTS service, no coach voice playback. Tier 1 feature per PRD. |

### Medium Severity

| Item | Details |
|------|---------|
| **Gemini fallback not a separate provider** | CLAUDE.md mentions Gemini as fallback LLM. No `lib/llm/providers/gemini.ts` exists. OpenRouter provides Gemini access but there's no direct Gemini SDK integration or automatic failover chain. |
| **MediaStream memory leak** | `useMediaStream` doesn't fully release streams on unmount/navigation. Known issue per CLAUDE.md. |
| **Empty catch blocks** | `useMediaStream.ts` lines 61, 68: `video.play().catch(() => {})`. `useSTT.ts`: partial cleanup on error. Session page: deck fetch failure silently caught. |
| **Orb state duplicated** | Session state tracked in both `useSessionState` hook and `ThemeProvider` context. Not single-source-of-truth. |
| **Results page uses inline components** | PRD spec'd modular components (`ScoreDisplay`, `ScoreBreakdown`, `FixList`, `RewritePanel`, `DeliveryMetrics`, `TranscriptViewer`) — these are inlined in the results page rather than extracted as reusable components. |
| **Accessibility gaps** | Sparse `aria-` labels across components. Images may lack `alt` text. Form inputs need better labeling for screen readers. |

### Low Severity

| Item | Details |
|------|---------|
| **Monolithic pages** | `analytics/page.tsx` (667 lines), `history/page.tsx` (597 lines) — should extract sub-components |
| **Speech bubbles grow indefinitely** | No cleanup mechanism in long sessions |
| **Console.log statements** | Debug logging in `server.ts`, `useHeadTracking.ts`, `session/page.tsx`, `deck/upload/route.ts` |
| **Migration numbering gap** | Files go `01` through `07` but `06` is missing from the sequence |
| **Miro REST provider** | `MiroRestProvider` exists but untested with live credentials. Stub is default. |
| **Three.js full import** | `import * as THREE from 'three'` — could tree-shake for smaller bundle |
| **No lazy loading for PDF slides** | All slides loaded at once in `useDeckSlides` |

---

## Feature Completeness by Phase (per PRD Section 16)

### Phase 1: Foundation — COMPLETE
- [x] TypeScript types and interfaces
- [x] Data models and Supabase CRUD
- [x] API route shells (pitch run, deck)
- [x] Mock analysis fallback (`SAMPLE_RESULT`)

### Phase 2: LLM Pipeline — COMPLETE
- [x] Claude client via Anthropic provider
- [x] OpenRouter fallback provider
- [x] Prompt templates (system, rubric, rewrite, deck generation)
- [x] `analysisService` with JSON validation and repair
- [x] `scoringService` for delivery metrics
- [x] Fallback cascade (LLM → repair → sample)

### Phase 3: Frontend — Results + History — COMPLETE
- [x] Results page with score, rubric, fixes, rewrite, delivery metrics
- [x] History page with filters, search, delete, pagination
- [x] Analytics page with time-range filtering and trends
- [x] Dashboard with stats, recent runs, category averages
- [ ] Extracted reusable components (ScoreDisplay, FixList, etc.) — inlined instead

### Phase 4: Frontend — Session Flow — COMPLETE
- [x] Mode picker (elevator / vc_pitch)
- [x] Audio recording via WebSocket STT
- [x] Text paste input fallback
- [x] Camera/mic with MediaStream
- [x] Head tracking engagement via MediaPipe
- [x] 3D SiriBubble orb with state animations
- [x] Deck slide navigation during session
- [ ] Real-time metrics panel wired to transcript — uses simulated data instead

### Phase 5: Polish + Tier 1 — PARTIAL
- [x] LLM fallback cascade (working)
- [x] Deck generation via LLM (working)
- [x] Miro stub provider (graceful fallback)
- [x] Error UX (loading states, error messages throughout)
- [ ] ElevenLabs TTS coach voice — not implemented
- [ ] Miro live REST API — exists but untested with real credentials
- [ ] Gemini as direct fallback provider — uses OpenRouter instead

---

## Environment Variables

| Variable | Required | Status |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | For DB features | Working |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For DB features | Working |
| `ANTHROPIC_API_KEY` | If `LLM_PROVIDER=anthropic` | Working |
| `OPENROUTER_API_KEY` | Default LLM provider | Working |
| `LLM_PROVIDER` | Defaults to `openrouter` | Working |
| `GOOGLE_AI_API_KEY` | For direct Gemini | Not used (no Gemini provider) |
| `ELEVENLABS_API_KEY` | For TTS | Not used (service not implemented) |
| `MIRO_ACCESS_TOKEN` | For live Miro boards | Optional (stub fallback works) |
| `MIRO_TEAM_ID` | For live Miro boards | Optional |
| `MIRO_PROVIDER` | `rest` or `stub` | Defaults to `rest`, falls back to `stub` |
| `NEXT_PUBLIC_WS_URL` | STT WebSocket URL | Defaults to `localhost:3001` |

---

## Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| SiriBubble (component + hook + constants) | 3 files | Covered |
| Engagement bands | 1 file | Covered |
| UI colors | 1 file | Covered |
| Miro service | 1 file | Covered |
| E2E (smoke + head tracking) | 2 files | Covered |
| `analysisService` | — | **Not tested** |
| `scoringService` | — | **Not tested** |
| `runService` | — | **Not tested** |
| `pitchController` | — | **Not tested** |
| LLM router + providers | — | **Not tested** |
| `useSTT`, `usePitchRun` | — | **Not tested** |
| All API routes | — | **Not tested** |
| All page components | — | **Not tested** |
| `deckService`, `deckGenerationService` | — | **Not tested** |

---

## Known Technical Debt

1. **Simulated live metrics** — The metrics panel during sessions shows fake WPM/filler/clarity via `Math.random()`. Wiring real-time transcript analysis to the UI is the biggest remaining gap for honest UX.
2. **No component extraction** — Results page renders everything inline. PRD expected `ScoreDisplay`, `FixList`, `RewritePanel`, `DeliveryMetrics`, `TranscriptViewer` as reusable components.
3. **No auth** — By design for MVP. Supabase RLS is disabled. All data is publicly accessible.
4. **Silent error suppression** — Several `catch(() => {})` blocks hide failures that could confuse debugging.
5. **State duplication** — Orb state lives in two places (hook + context), risking desync.
