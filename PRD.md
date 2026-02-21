# Pitchr — Product Requirements Document

> **One-sentence definition:** An AI pitch coach that listens to your pitch, scores it with an investor-grade rubric, and gives a prioritized fix-list—with history and progress tracking.

**Version:** 1.0 — MVP
**Last updated:** 2026-02-21
**Branch:** `other-pages`

---

## Table of Contents

1. [Problem & Value Proposition](#1-problem--value-proposition)
2. [Target User](#2-target-user)
3. [Scope — What Ships vs What Doesn't](#3-scope--what-ships-vs-what-doesnt)
4. [Architecture — MVC Breakdown](#4-architecture--mvc-breakdown)
5. [User Workflow — The Demo Path](#5-user-workflow--the-demo-path)
6. [Rubric Specification](#6-rubric-specification)
7. [Data Models (M)](#7-data-models-m)
8. [Controllers & API Contracts (C)](#8-controllers--api-contracts-c)
9. [Views & Components (V)](#9-views--components-v)
10. [Services Layer](#10-services-layer)
11. [LLM Integration — Prompt Pack & Output Schema](#11-llm-integration--prompt-pack--output-schema)
12. [Integration Map — Claude / Gemini / ElevenLabs / Miro](#12-integration-map--claude--gemini--elevenlabs--miro)
13. [Audio Pipeline](#13-audio-pipeline)
14. [Error Handling & Fallbacks](#14-error-handling--fallbacks)
15. [Current State & Gap Analysis](#15-current-state--gap-analysis)
16. [Implementation Phases](#16-implementation-phases)
17. [Team Task Split](#17-team-task-split)
18. [Demo Script](#18-demo-script)
19. [Success Criteria](#19-success-criteria)

---

## 1. Problem & Value Proposition

**Problem:** Founders practice pitches by talking to themselves, friends, or mentors who give vague feedback. There's no structured, repeatable way to measure improvement or get investor-caliber critique on demand.

**Value prop:** Pitchr gives you an investor-grade score, a ranked fix-list, and a tightened rewrite—every time you practice. Your history shows whether you're actually getting better.

**Why now:** LLMs are finally good enough to evaluate nuanced persuasion and structure, not just grammar. Audio transcription is commodity. The feedback loop that used to require a human coach can now run in seconds.

---

## 2. Target User

| Attribute | Detail |
|-----------|--------|
| **Primary** | Early-stage founders preparing for investor meetings |
| **Secondary** | Accelerator participants, pitch competition entrants |
| **Context** | Solo practice sessions, pre-meeting prep |
| **Frequency** | 3–10 runs per pitch, iterating toward a target score |

---

## 3. Scope — What Ships vs What Doesn't

### Tier 0 — Demo-Critical MVP (ships)

| Feature | Status |
|---------|--------|
| Audio recording via browser mic → transcript | Build |
| Text paste fallback input | Build |
| Two pitch modes: Elevator (30–45s), VC Pitch (2:00) | Build |
| Scoring rubric (5 categories, /100) | Build |
| Top 5 prioritized fixes (ranked, with "why" + "how") | Build |
| Full rewrite / tightened script | Build |
| Delivery metrics (WPM, filler words, repetitions) | Build |
| History storage + replay | Build |
| Score trend over time | Build |
| Dashboard with CTA and recent runs | Build |

### Tier 1 — Nice-to-Have (bolt on if time allows)

| Feature | Status |
|---------|--------|
| Slide text upload (paste or PDF extract) | Optional |
| Miro board generation from fixes | Optional |
| ElevenLabs coach voice summary (10–15s TTS) | Optional |
| Gemini JSON schema repair fallback | Optional |

### Will NOT Ship

| Feature | Why |
|---------|-----|
| Real-time live feedback overlay while speaking | Scope suicide for MVP |
| Video-based body language scoring | Needs working vision pipeline |
| YC pitch database ingestion | Fake credibility; use curated heuristics instead |
| Interactive voice agent conversation | ElevenLabs TTS only, not interactive |
| User authentication / multi-tenant | Not needed for hack demo |

---

## 4. Architecture — MVC Breakdown

The app follows a **Model-View-Controller** pattern adapted for Next.js App Router:

```
┌─────────────────────────────────────────────────────┐
│                      VIEWS (V)                       │
│   app/(app)/pages  +  views/components/              │
│   React components, client-side UI, user interaction │
└──────────────────────┬──────────────────────────────┘
                       │ fetch / server actions
┌──────────────────────▼──────────────────────────────┐
│                  CONTROLLERS (C)                     │
│   app/api/ route handlers                            │
│   Request validation, orchestration, response format │
└──────────────────────┬──────────────────────────────┘
                       │ calls
┌──────────────────────▼──────────────────────────────┐
│                   SERVICES                           │
│   services/  — Business logic, LLM calls, audio     │
│   Stateless functions, no HTTP awareness             │
└──────────────────────┬──────────────────────────────┘
                       │ reads/writes
┌──────────────────────▼──────────────────────────────┐
│                    MODELS (M)                        │
│   models/  — Data schemas, DB operations, types      │
│   Single source of truth for data shape              │
└─────────────────────────────────────────────────────┘
```

### Directory Mapping

```
pitchr/
├── app/
│   ├── (app)/                    # VIEW — Page components (route-level)
│   │   ├── dashboard/page.tsx
│   │   ├── session/page.tsx      # Renamed: "run" flow
│   │   ├── results/[runId]/page.tsx
│   │   └── history/page.tsx
│   └── api/                      # CONTROLLER — API route handlers
│       └── pitch/
│           ├── run/route.ts              # POST (create), GET (list)
│           └── run/[runId]/route.ts      # GET (detail), DELETE
│
├── views/components/             # VIEW — Reusable UI components
│   ├── PitchModePicker.tsx
│   ├── Recorder.tsx
│   ├── TranscriptViewer.tsx
│   ├── ScoreBreakdown.tsx
│   ├── FixList.tsx
│   ├── RewritePanel.tsx
│   ├── DeliveryMetrics.tsx
│   ├── ScoreTrend.tsx
│   ├── RunCard.tsx
│   └── (existing components)
│
├── controllers/                  # CONTROLLER — Orchestration logic
│   └── pitchController.ts        # Coordinates services for a pitch run
│
├── services/                     # SERVICE — Business logic
│   ├── analysisService.ts        # Orchestrates LLM scoring pipeline
│   ├── transcriptionService.ts   # Audio → text
│   ├── scoringService.ts         # Rubric calculation + prompt construction
│   ├── rewriteService.ts         # Rewrite generation
│   ├── ttsService.ts             # ElevenLabs TTS (Tier 1)
│   └── miroService.ts            # Miro board generation (Tier 1)
│
├── models/                       # MODEL — Data schemas + DB operations
│   ├── run.ts                    # Run schema, CRUD operations
│   ├── analysis.ts               # Analysis result types
│   └── rubric.ts                 # Rubric categories, weights, scoring rules
│
├── lib/                          # Shared utilities
│   ├── llm/
│   │   ├── claude.ts             # Claude API client
│   │   ├── gemini.ts             # Gemini API client (fallback)
│   │   └── router.ts             # Model router (primary → fallback)
│   ├── audio/
│   │   └── recorder.ts           # Browser audio recording utilities
│   └── prompts/
│       ├── system.ts             # System prompt
│       ├── rubric.ts             # Rubric evaluation prompt
│       └── rewrite.ts            # Rewrite generation prompt
│
├── store/                        # Client-side state
│   └── runStore.ts               # Run state management (React context or zustand)
│
├── hooks/                        # Custom React hooks
│   ├── useMediaStream.ts         # (exists) Media device access
│   ├── useSessionState.ts        # (exists) → refactor to useRunState
│   ├── useAudioRecorder.ts       # NEW — Recording + transcription
│   └── usePitchRun.ts            # NEW — Run lifecycle management
│
├── types/                        # Shared TypeScript types
│   ├── pitch.ts                  # PitchMode, RunInput, RunResult
│   ├── analysis.ts               # AnalysisResult, RubricScore, Fix
│   └── api.ts                    # API request/response types
│
└── config/
    ├── rubric.ts                 # Rubric weights + category definitions
    └── modes.ts                  # Pitch mode configurations
```

---

## 5. User Workflow — The Demo Path

### Screen 1: Dashboard (`/dashboard`)

**Already exists** — needs modification.

- Big CTA: **"Run a Pitch"** → navigates to `/session`
- **Recent Runs** section: last 3 runs with score, mode, date
- **Score Trend** mini-chart: sparkline of last 10 scores
- Quick stats: total runs, average score, best score

### Screen 2: Pitch Mode Selection (`/session` — step 1)

**New component within existing session page.**

- Two cards:
  - **Elevator Pitch** — 30–45 seconds, concise and punchy
  - **VC Pitch** — 2 minutes, full investor structure
- Each card shows: name, time limit, structure hints
- Selection advances to input step

### Screen 3: Input (`/session` — step 2)

**Refactor existing session page.**

- **Primary:** Record audio button (browser mic)
  - Visual waveform / timer during recording
  - Stop → transcription → advance to analysis
- **Secondary:** "Or paste your pitch text" toggle
  - Textarea with character/word count
  - Submit → advance to analysis
- Loading state: "Analyzing your pitch..." with SiriBubble animation (existing orb)

### Screen 4: Results (`/results/[runId]`)

**Refactor existing results route.**

- **Headline verdict:** one-line summary (from LLM)
- **Overall score:** large /100 display with color coding
- **Rubric breakdown:** 5 horizontal bars with category scores
  - Structure (20), Clarity (20), Evidence (20), Market (20), Delivery (20)
- **Top 5 Fixes:** ranked cards, each with:
  - Category tag
  - What's wrong (the "why")
  - How to fix it (the "how")
  - Priority badge (1–5)
- **Rewrite panel:** full rewritten script, copy-to-clipboard
- **Delivery metrics:** WPM, filler words list, repeated phrases
- **Transcript:** collapsible original transcript
- **Actions:**
  - "Run Again" → `/session` with same mode
  - "Save to History" (auto-saved, but confirm)
  - Tier 1: "Create Fix Board in Miro"
  - Tier 1: "Play Coach Summary" (ElevenLabs)

### Screen 5: History (`/history`)

**Already exists** — needs real data connection.

- Timeline of all runs (newest first)
- Each entry: date, mode, score, one-line verdict
- Score trend chart across all runs
- Click → opens `/results/[runId]` with full feedback
- Delete run (with confirmation)
- Filter by mode (Elevator / VC Pitch)

---

## 6. Rubric Specification

### Categories & Weights

| # | Category | Weight | What "Good" Looks Like |
|---|----------|--------|----------------------|
| 1 | **Structure** | 20 | Clear flow: Problem → Solution → Why Now → Traction → Ask. Logical transitions. No circular reasoning. |
| 2 | **Clarity & Concision** | 20 | Every sentence earns its place. No jargon without definition. A 12-year-old could follow the core idea. Under time limit. |
| 3 | **Evidence & Traction** | 20 | Specific numbers (users, revenue, growth rate). Named customers or partners. Concrete milestones, not "we plan to." |
| 4 | **Market & Differentiation** | 20 | Clear TAM/SAM with source. Named competitors with honest positioning. Defensible moat articulated. |
| 5 | **Delivery** | 20 | Appropriate pace (130–160 WPM). Minimal filler words (<3%). No repeated phrases. Confident tone. Within time limit. |

### Scoring Rules

- Each category scored 0–20
- Overall = sum of all categories (0–100)
- Scores are **deterministic per rubric rules**, not vibes
- Score bands: 0–39 Needs Work, 40–59 Getting There, 60–79 Solid, 80–100 Investor-Ready

### Mode-Specific Constraints

| Mode | Time | Required Structure |
|------|------|--------------------|
| Elevator | 30–45s | Problem + Solution + Why Us (3 beats) |
| VC Pitch | 2:00 | Problem → Solution → Why Now → Traction → Market → Ask (6 beats) |

---

## 7. Data Models (M)

### `models/run.ts` — Run Schema

```typescript
// Core data types

interface Run {
  id: string                    // UUID
  createdAt: string             // ISO 8601
  mode: PitchMode               // 'elevator' | 'vc_pitch'
  inputType: InputType           // 'audio' | 'text'
  transcript: string             // Original text (pasted or transcribed)
  audioUrl?: string              // Stored audio blob URL (if audio input)
  analysis: AnalysisResult       // Full LLM analysis
  overallScore: number           // Denormalized for quick access (0-100)
}

type PitchMode = 'elevator' | 'vc_pitch'
type InputType = 'audio' | 'text'
```

### `models/analysis.ts` — Analysis Result Schema

```typescript
interface AnalysisResult {
  overall_score: number                    // 0-100
  one_line_verdict: string                 // e.g. "Strong structure but weak on evidence"
  rubric_breakdown: RubricScore[]          // 5 items
  top_fixes: Fix[]                         // Ranked, max 5
  rewrite_script: string                   // Full rewritten pitch
  delivery_metrics: DeliveryMetrics
}

interface RubricScore {
  category: RubricCategory
  score: number                            // 0-20
  max_score: number                        // 20
  rationale: string                        // 1-2 sentence explanation
}

type RubricCategory =
  | 'structure'
  | 'clarity'
  | 'evidence'
  | 'market'
  | 'delivery'

interface Fix {
  rank: number                             // 1-5
  category: RubricCategory
  issue: string                            // What's wrong
  fix: string                              // How to fix it
  impact: 'high' | 'medium' | 'low'
}

interface DeliveryMetrics {
  wpm: number                              // Words per minute
  duration_seconds: number                 // Estimated or actual
  filler_words: FillerWord[]
  repeated_phrases: RepeatedPhrase[]
  within_time_limit: boolean
}

interface FillerWord {
  word: string                             // e.g. "um", "like", "basically"
  count: number
}

interface RepeatedPhrase {
  phrase: string
  count: number
}
```

### `models/rubric.ts` — Rubric Definition

```typescript
interface RubricDefinition {
  categories: RubricCategoryDef[]
  total_weight: 100
  score_bands: ScoreBand[]
}

interface RubricCategoryDef {
  id: RubricCategory
  label: string
  weight: number                           // Must sum to 100 across all
  description: string
  scoring_criteria: string                 // Injected into LLM prompt
}

interface ScoreBand {
  min: number
  max: number
  label: string                            // "Needs Work", "Investor-Ready", etc.
  color: string                            // For UI display
}
```

### Storage — MVP Approach

For the MVP / hackathon demo, use **localStorage** with a simple wrapper:

```typescript
// models/storage.ts
interface RunStore {
  getRuns(): Run[]
  getRun(id: string): Run | null
  saveRun(run: Run): void
  deleteRun(id: string): void
}
```

**Upgrade path:** Swap `localStorage` for Supabase/Postgres when auth is needed. The `RunStore` interface stays the same.

---

## 8. Controllers & API Contracts (C)

### Route Handlers

#### `POST /api/pitch/run`

Creates a new pitch analysis run.

```typescript
// Request
{
  mode: 'elevator' | 'vc_pitch'
  transcript: string
  inputType: 'audio' | 'text'
  audioUrl?: string              // If audio was recorded
  slideText?: string             // Tier 1: extracted slide content
}

// Response — 201 Created
{
  runId: string
  status: 'complete'
  analysis: AnalysisResult       // Full analysis (see schema above)
}

// Response — 500 Error
{
  error: string
  fallback: boolean              // True if cached sample result returned
  analysis?: AnalysisResult      // Cached sample for demo safety
}
```

#### `GET /api/pitch/run/[runId]`

Retrieves a single run with full analysis.

```typescript
// Response — 200 OK
{
  run: Run                       // Full run object
}

// Response — 404
{
  error: 'Run not found'
}
```

#### `GET /api/pitch/history`

Retrieves all runs for history view.

```typescript
// Response — 200 OK
{
  runs: Run[]                    // Sorted by createdAt desc
  stats: {
    totalRuns: number
    averageScore: number
    bestScore: number
    trend: number[]              // Last 10 scores for sparkline
  }
}
```

#### `DELETE /api/pitch/run/[runId]`

Deletes a run.

```typescript
// Response — 200 OK
{ deleted: true }

// Response — 404
{ error: 'Run not found' }
```

### Controller Logic (`controllers/pitchController.ts`)

The controller orchestrates the analysis pipeline:

```
1. Receive transcript + mode
2. Calculate delivery metrics (WPM, filler words, repetitions)
3. Construct rubric prompt with mode constraints
4. Call Claude API → get structured analysis JSON
5. Validate JSON schema (optionally via Gemini repair)
6. Assemble Run object
7. Persist to storage
8. Return result
```

---

## 9. Views & Components (V)

### New Components to Build

| Component | Location | Purpose |
|-----------|----------|---------|
| `PitchModePicker` | `views/components/` | Two-card mode selection (Elevator / VC Pitch) |
| `Recorder` | `views/components/` | Audio recording with waveform + timer + stop |
| `TextInput` | `views/components/` | Paste-your-pitch textarea with word count |
| `TranscriptViewer` | `views/components/` | Collapsible original transcript display |
| `ScoreBreakdown` | `views/components/` | 5 horizontal bars with rubric scores + rationale |
| `ScoreDisplay` | `views/components/` | Large /100 score with color band |
| `FixList` | `views/components/` | Ranked fix cards with category, why, how |
| `RewritePanel` | `views/components/` | Full rewrite with copy-to-clipboard |
| `DeliveryMetrics` | `views/components/` | WPM, filler words table, repeated phrases |
| `ScoreTrend` | `views/components/` | Line chart of historical scores |
| `RunCard` | `views/components/` | History list item (date, mode, score, verdict) |
| `AnalysisLoading` | `views/components/` | Loading state with SiriBubble orb animation |

### Existing Components — Modifications

| Component | Change |
|-----------|--------|
| `AppSidebar` | Update nav items to match new routes, highlight active |
| `SessionCanvas` | Refactor into step-based flow (mode → input → analyzing) |
| `MetricsPanel` | Wire to real `DeliveryMetrics` data instead of mock simulation |
| `SiriBubble` | Use during analysis loading state (orb = "thinking") |
| `StartSessionButton` | Keep on dashboard, links to `/session` |
| `ThemeProvider` | No changes needed |

### Existing Pages — Modifications

| Page | Change |
|------|--------|
| `/dashboard` | Replace mock stats with real run history data. Add "Run a Pitch" CTA. Show recent runs + mini score trend. |
| `/session` | Complete refactor into 3-step flow: Mode → Input → Analyzing. Remove current video/slides dual-view for MVP. |
| `/results/[runId]` | Build out with ScoreDisplay, ScoreBreakdown, FixList, RewritePanel, DeliveryMetrics, TranscriptViewer. |
| `/history` | Wire to real storage. Replace mock data with RunCard list + ScoreTrend chart. Add delete + filter. |
| `/analytics` | Merge into `/history` or keep as enhanced view. Wire to real data. |
| `/deck` | Tier 1 — keep as-is or add slide text extraction. |
| `/settings` | Deprioritize. Not needed for demo. |

---

## 10. Services Layer

### `services/analysisService.ts` — Main Orchestrator

```typescript
async function analyzePitch(input: {
  transcript: string
  mode: PitchMode
  slideText?: string
}): Promise<AnalysisResult> {
  // 1. Calculate delivery metrics locally
  const deliveryMetrics = calculateDeliveryMetrics(input.transcript, input.mode)

  // 2. Build prompt with rubric + mode constraints
  const prompt = buildAnalysisPrompt(input.transcript, input.mode, deliveryMetrics)

  // 3. Call LLM (Claude primary, Gemini fallback)
  const rawResult = await llmRouter.analyze(prompt)

  // 4. Parse + validate JSON
  const analysis = parseAnalysisResult(rawResult)

  // 5. Inject locally-calculated delivery metrics
  analysis.delivery_metrics = deliveryMetrics

  return analysis
}
```

### `services/transcriptionService.ts` — Audio → Text

```typescript
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Option A: Web Speech API (free, browser-native, English)
  // Option B: Whisper API via server route
  // Option C: Deepgram / AssemblyAI
  // MVP recommendation: Web Speech API with text fallback
}
```

### `services/scoringService.ts` — Local Metrics

```typescript
function calculateDeliveryMetrics(
  transcript: string,
  mode: PitchMode
): DeliveryMetrics {
  // WPM = word count / (mode time limit)
  // Filler words = regex match against known list
  // Repeated phrases = n-gram frequency analysis
  // Time limit check = word count vs expected WPM range
}
```

### `services/ttsService.ts` — Coach Voice (Tier 1)

```typescript
async function generateCoachSummary(
  fixes: Fix[],
  verdict: string
): Promise<AudioBuffer> {
  // Construct 2-3 sentence summary from top fixes
  // Call ElevenLabs TTS API
  // Return audio buffer for playback
}
```

### `services/miroService.ts` — Fix Board (Tier 1)

```typescript
async function createFixBoard(
  fixes: Fix[],
  rubricScores: RubricScore[]
): Promise<string> {
  // Create Miro board via API
  // Add sticky notes grouped by category
  // Add rewrite outline as flow
  // Return board URL
}
```

---

## 11. LLM Integration — Prompt Pack & Output Schema

### System Prompt (`lib/prompts/system.ts`)

```
You are an investor pitch evaluator with experience reviewing hundreds of
startup pitches. You evaluate pitches using a structured rubric and provide
actionable, specific feedback.

You MUST return valid JSON matching the exact schema provided. No markdown,
no explanation text outside the JSON. Only the JSON object.

Your feedback must be:
- Specific (cite exact phrases from the pitch)
- Actionable (tell the founder exactly what to change)
- Prioritized (most impactful fixes first)
- Honest (don't sugarcoat, but be constructive)
```

### Rubric Evaluation Prompt (`lib/prompts/rubric.ts`)

```
Evaluate this pitch using the following rubric. Score each category 0-20.

MODE: {mode} ({timeLimit})
EXPECTED STRUCTURE: {structureBeats}

RUBRIC:

1. STRUCTURE (0-20): Does the pitch follow {structureBeats}? Are transitions
   logical? Is there a clear ask at the end?

2. CLARITY & CONCISION (0-20): Is every sentence necessary? Could a
   non-technical person follow? Any unexplained jargon? Is it under the
   time limit at normal speaking pace (140 WPM)?

3. EVIDENCE & TRACTION (0-20): Are there specific numbers? Named customers?
   Concrete milestones vs vague plans? Revenue, users, growth rate?

4. MARKET & DIFFERENTIATION (0-20): Is the market sized? Are competitors
   named and honestly positioned? Is there a clear moat?

5. DELIVERY (0-20): Based on the text: appropriate word count for time limit?
   Minimal filler words? No excessive repetition? Confident, direct language?

PITCH TRANSCRIPT:
"""
{transcript}
"""

{slideContext}

Return JSON matching this exact schema:
{jsonSchema}
```

### Rewrite Prompt (`lib/prompts/rewrite.ts`)

```
Rewrite this pitch to fit within {timeLimit} at 140 WPM speaking pace.

Keep the same core message but:
- Follow the {mode} structure: {structureBeats}
- Eliminate filler and redundancy
- Strengthen weak evidence claims
- Add a clear ask at the end
- Make it sound natural when spoken aloud

ORIGINAL PITCH:
"""
{transcript}
"""

TOP ISSUES TO FIX:
{topFixes}

Return ONLY the rewritten script text. No JSON wrapping, no commentary.
```

### Non-Negotiable Output Schema

The LLM must return this exact structure:

```json
{
  "overall_score": 62,
  "one_line_verdict": "Strong problem framing but needs concrete traction numbers",
  "rubric_breakdown": [
    {
      "category": "structure",
      "score": 16,
      "max_score": 20,
      "rationale": "Clear problem-solution flow but missing explicit ask"
    },
    {
      "category": "clarity",
      "score": 14,
      "max_score": 20,
      "rationale": "Generally clear but 'synergistic platform' is jargon"
    },
    {
      "category": "evidence",
      "score": 8,
      "max_score": 20,
      "rationale": "No specific numbers cited. 'Growing fast' is not evidence."
    },
    {
      "category": "market",
      "score": 12,
      "max_score": 20,
      "rationale": "TAM mentioned but no source. Competitors not addressed."
    },
    {
      "category": "delivery",
      "score": 12,
      "max_score": 20,
      "rationale": "Good pace but 4 filler words and repeated 'basically'"
    }
  ],
  "top_fixes": [
    {
      "rank": 1,
      "category": "evidence",
      "issue": "No concrete traction numbers anywhere in the pitch",
      "fix": "Add 1-2 specific metrics: user count, revenue, growth rate, or named customers",
      "impact": "high"
    }
  ],
  "rewrite_script": "...",
  "delivery_metrics": {
    "wpm": 156,
    "duration_seconds": 115,
    "filler_words": [
      { "word": "basically", "count": 3 },
      { "word": "um", "count": 1 }
    ],
    "repeated_phrases": [
      { "phrase": "our platform", "count": 4 }
    ],
    "within_time_limit": true
  }
}
```

---

## 12. Integration Map — Claude / Gemini / ElevenLabs / Miro

```
┌──────────────────────────────────────────────────┐
│                   MODEL ROUTER                    │
│              lib/llm/router.ts                    │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────┐    PRIMARY     ┌─────────────────┐  │
│  │ Request │ ─────────────► │ Claude API      │  │
│  │         │                │ Rubric scoring  │  │
│  │         │                │ Critique        │  │
│  │         │                │ Rewrite         │  │
│  │         │                │ Fix list        │  │
│  └─────────┘                └────────┬────────┘  │
│       │                              │            │
│       │ if Claude fails              ▼            │
│       │                     ┌─────────────────┐  │
│       └────────────────────►│ Gemini API      │  │
│                FALLBACK     │ Same prompts    │  │
│                             │ OR JSON repair  │  │
│                             └─────────────────┘  │
│                                                   │
├──────────────────────────────────────────────────┤
│              OPTIONAL SERVICES                    │
│                                                   │
│  ┌─────────────────┐    ┌─────────────────────┐  │
│  │ ElevenLabs TTS  │    │ Miro API            │  │
│  │ Coach voice     │    │ Fix board           │  │
│  │ 10-15s summary  │    │ Sticky notes        │  │
│  │ (Tier 1)        │    │ (Tier 1)            │  │
│  └─────────────────┘    └─────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Claude — Primary LLM

- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-6` (fast + capable enough for scoring)
- **Used for:** Rubric scoring, critique, rewrite, fix list, structure extraction
- **Config:** Temperature 0.3 (deterministic scoring), max_tokens 4096

### Gemini — Fallback / JSON Repair

- **Used for:** Backup if Claude API is down OR strict JSON schema validation/repair
- **Not used for:** Video analysis in MVP

### ElevenLabs — Tier 1 Polish

- **Used for:** 10–15s spoken summary of top fixes ("Your biggest issue is...")
- **Not used for:** Interactive voice conversation
- **Implementation:** Single TTS call, play audio in browser

### Miro — Tier 1 Polish

- **Used for:** Create board with sticky notes (fixes grouped by category)
- **Implementation:** REST API, create board → add frames → add stickies

---

## 13. Audio Pipeline

### MVP Audio Flow

```
Browser Mic → MediaRecorder API → Audio Blob
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                   ▼
              Web Speech API    Whisper API          Text fallback
              (free, fast)     (accurate, $)        (paste textarea)
                    │                 │                   │
                    └─────────────────┼───────────────────┘
                                      ▼
                                  Transcript
                                      │
                                      ▼
                              Analysis Pipeline
```

### Implementation Priority

1. **Text paste** — works immediately, zero dependencies
2. **Web Speech API** — free, browser-native, good enough for English
3. **Whisper API** — upgrade path for accuracy (not MVP-critical)

### `hooks/useAudioRecorder.ts`

```typescript
interface UseAudioRecorder {
  isRecording: boolean
  duration: number                         // Seconds elapsed
  startRecording: () => Promise<void>
  stopRecording: () => Promise<{
    audioBlob: Blob
    transcript: string
  }>
  error: string | null
}
```

---

## 14. Error Handling & Fallbacks

| Failure | Fallback | User Experience |
|---------|----------|-----------------|
| Claude API fails | Try Gemini with same prompt | Transparent to user |
| Both LLMs fail | Return cached sample result | Show result with "demo mode" badge |
| LLM returns invalid JSON | Gemini JSON repair attempt → hardcoded sample | Transparent or "demo mode" |
| Transcription fails | Show text input fallback | "Couldn't transcribe. Paste your pitch instead." |
| Audio recording fails | Show text input only | "Microphone unavailable. Paste your pitch." |
| Miro API fails | Generate downloadable markdown | "Miro unavailable. Here's your fix list as markdown." |
| ElevenLabs fails | Skip TTS, show text summary | No audio button shown |
| Storage full | Warn user, suggest deleting old runs | Toast notification |

### Cached Sample Result

Keep one pre-computed `AnalysisResult` JSON in `config/sampleResult.ts` for demo safety. If all LLM calls fail, return this with a flag so the UI can show a "demo mode" indicator.

---

## 15. Current State & Gap Analysis

### What Exists (and is reusable)

| Asset | Status | Reuse Plan |
|-------|--------|------------|
| Dashboard page | Mock data, good layout | Wire to real data from `RunStore` |
| Session page | Video/slides dual view | Refactor to mode → input → analyzing flow |
| History page | Mock data, filters work | Wire to real storage, add delete |
| Analytics page | Mock charts | Merge useful parts into History or keep as Tier 1 |
| SiriBubble orb | Fully working with animations | Use as loading/analyzing state indicator |
| MetricsPanel | Mock simulation | Wire to real `DeliveryMetrics` from analysis |
| AppSidebar | Working navigation | Update nav items, keep theme toggle |
| useMediaStream | Camera/mic access | Extend for audio-only recording mode |
| useSessionState | Mock simulation loop | Replace with `usePitchRun` connected to real API |
| Theme system | Dark/light working | Keep as-is |
| Three.js setup | WebGL, shaders working | Keep as-is |

### What Needs to Be Built

| Component | Priority | Effort |
|-----------|----------|--------|
| API route handlers (4 endpoints) | Tier 0 | Medium |
| `pitchController.ts` orchestration | Tier 0 | Medium |
| `analysisService.ts` LLM pipeline | Tier 0 | High |
| Claude API client + prompts | Tier 0 | Medium |
| Storage layer (localStorage MVP) | Tier 0 | Low |
| `PitchModePicker` component | Tier 0 | Low |
| `Recorder` component | Tier 0 | Medium |
| `ScoreBreakdown` component | Tier 0 | Low |
| `FixList` component | Tier 0 | Low |
| `RewritePanel` component | Tier 0 | Low |
| `DeliveryMetrics` component | Tier 0 | Low |
| `ScoreTrend` chart | Tier 0 | Medium |
| Results page assembly | Tier 0 | Medium |
| Session page refactor | Tier 0 | Medium |
| Dashboard wiring | Tier 0 | Low |
| History wiring | Tier 0 | Low |
| `scoringService.ts` (local metrics) | Tier 0 | Low |
| `useAudioRecorder` hook | Tier 0 | Medium |
| JSON schema validation | Tier 0 | Low |
| Cached sample result fallback | Tier 0 | Low |
| Gemini fallback client | Tier 1 | Low |
| ElevenLabs TTS | Tier 1 | Medium |
| Miro board generation | Tier 1 | Medium |
| Slide text upload | Tier 1 | Medium |

---

## 16. Implementation Phases

### Phase 1 — Foundation (Models + Storage + API Shell)

**Goal:** Data flows end-to-end with mock analysis.

1. Define TypeScript types (`types/pitch.ts`, `types/analysis.ts`)
2. Implement `models/run.ts` with localStorage CRUD
3. Implement `config/rubric.ts` with category definitions
4. Create API route handlers (all 4 endpoints)
5. Create `controllers/pitchController.ts` (returns mock analysis initially)
6. Create `config/sampleResult.ts` cached demo result
7. Verify: POST a pitch → GET result → GET history → DELETE

### Phase 2 — LLM Pipeline (Real Scoring)

**Goal:** Claude returns real analysis for any pitch.

1. Implement `lib/llm/claude.ts` API client
2. Write prompt templates (`lib/prompts/system.ts`, `rubric.ts`, `rewrite.ts`)
3. Implement `services/analysisService.ts` orchestrator
4. Implement `services/scoringService.ts` (local WPM, filler words, repetitions)
5. Wire controller to real analysis service
6. Add JSON schema validation + fallback to cached result
7. Verify: POST real pitch text → get real scored analysis

### Phase 3 — Frontend — Results + History

**Goal:** Beautiful results page and working history.

1. Build `ScoreDisplay`, `ScoreBreakdown`, `FixList`, `RewritePanel`, `DeliveryMetrics`
2. Build `TranscriptViewer`
3. Assemble results page (`/results/[runId]`)
4. Wire history page to real storage
5. Build `ScoreTrend` chart component
6. Wire dashboard to real stats + recent runs
7. Verify: Full golden path with real UI

### Phase 4 — Frontend — Session Flow

**Goal:** Mode selection → input → analysis → results.

1. Build `PitchModePicker` component
2. Build text input with word count
3. Build `Recorder` component with `useAudioRecorder` hook
4. Implement Web Speech API transcription
5. Refactor session page into step-based flow
6. Add `AnalysisLoading` state with SiriBubble orb
7. Verify: Complete demo path works end-to-end

### Phase 5 — Polish + Tier 1 (if time allows)

**Goal:** Demo-ready polish and optional features.

1. Gemini fallback (`lib/llm/gemini.ts` + `lib/llm/router.ts`)
2. ElevenLabs coach voice (`services/ttsService.ts`)
3. Miro board generation (`services/miroService.ts`)
4. Error fallback UX (demo mode badge, text input fallback messaging)
5. Mobile responsiveness pass
6. Performance: debounce, lazy loading, optimistic UI

---

## 17. Team Task Split

### Person 1 — Frontend + UX Demo Flow

**Owns:** Everything the user sees and clicks.

- Dashboard wiring (real data)
- Session page refactor (mode → input → analyzing flow)
- Results page assembly (all result components)
- History page wiring (real data + delete + filter)
- Score trend chart
- Loading states and transitions
- Demo path smoothness

### Person 2 — Backend + Storage + API

**Owns:** Everything behind the API boundary.

- TypeScript types and data models
- localStorage storage layer
- API route handlers (4 endpoints)
- Controller orchestration logic
- Audio recording + transcription pipeline
- Error fallbacks and cached sample result

### Person 3 — LLM Prompts + Rubric + Integrations

**Owns:** AI quality and optional integrations.

- Rubric definition and weights
- All prompt templates (system, rubric, rewrite)
- Claude API client and prompt tuning
- JSON schema enforcement
- Local delivery metrics calculation (WPM, fillers, repetitions)
- Tier 1: Gemini fallback, ElevenLabs TTS, Miro board

---

## 18. Demo Script

**Total time: 90 seconds** (if everything is clean)

### Setup (pre-demo)

- Have a mediocre 2-minute pitch pre-written (copy-paste ready)
- Have 1-2 previous runs already in history (for trend demo)

### Demo Flow

| Time | Action | What audience sees |
|------|--------|--------------------|
| 0:00 | Open dashboard | Clean UI with "Run a Pitch" CTA, score trend from prior runs |
| 0:05 | Click "Run a Pitch" | Mode selection: Elevator vs VC Pitch |
| 0:10 | Select "VC Pitch (2 min)" | Input screen with record/paste options |
| 0:15 | Paste mediocre pitch text | Text appears in input area |
| 0:20 | Click "Analyze" | SiriBubble orb animates, "Analyzing your pitch..." |
| 0:25 | Results load | Score /100 with rubric breakdown |
| 0:30 | Scroll through results | Top 5 fixes, each with why + how |
| 0:45 | Show rewrite panel | Tightened script, copy button |
| 0:55 | Show delivery metrics | WPM, filler words highlighted |
| 1:00 | Click "Save & View History" | History page with score trend chart |
| 1:10 | Point to trend line | "You can see scores improving over iterations" |
| 1:15 | (Optional) Click "Create Fix Board" | Miro board or "Play Coach Summary" audio |
| 1:25 | Close | "That's Pitchr — practice, score, improve, repeat" |

### Demo Safety Checklist

- [ ] Pre-load 2-3 historical runs so trend isn't empty
- [ ] Test with the exact demo pitch text beforehand
- [ ] Verify cached fallback works if LLM is slow/down
- [ ] Have text input tab ready in case audio doesn't work
- [ ] Test on demo device (resolution, browser, mic permissions)

---

## 19. Success Criteria

### MVP is shippable when:

- [ ] User can select Elevator or VC Pitch mode
- [ ] User can paste text and get analysis in <10 seconds
- [ ] Score /100 is displayed with 5-category rubric breakdown
- [ ] Top 5 fixes are shown with ranked priorities
- [ ] Rewrite panel shows tightened script
- [ ] Delivery metrics show WPM and filler word counts
- [ ] Run is persisted and appears in history
- [ ] History shows score trend across multiple runs
- [ ] Deleting a run works
- [ ] Dashboard shows recent runs and quick stats
- [ ] Fallback works if LLM call fails (cached result)
- [ ] Demo golden path completes in <90 seconds

### Stretch goals:

- [ ] Audio recording → transcription works
- [ ] ElevenLabs coach voice plays a summary
- [ ] Miro board is generated from fixes
- [ ] Gemini fallback activates when Claude is unavailable

---

*This PRD is the single source of truth for the Pitchr MVP. All implementation decisions should reference this document. When in doubt, ship less and ship it clean.*
