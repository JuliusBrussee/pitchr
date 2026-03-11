# Pitch Analysis Pipeline (Anthropic First)

## Pipeline Diagram

```mermaid
flowchart TD
    A([User submits pitch\nmode: elevator | vc_pitch | hackathon | final_year]) --> B

    subgraph API["POST /api/pitch/run"]
        B[pitchController.ts\nisPitchMode validates all 4 modes] --> C[Insert run row\nstatus: queued]
        C --> D[enqueuePitchRun]
    end

    subgraph Queue["pitchRunQueueService.ts"]
        D --> E[processRun\nstatus → running]
        E --> F[analyzePitch]
    end

    subgraph Analysis["analysisService.ts — analyzePitch"]
        F --> G[buildScoringContext\nprepAgentService.ts]
        G --> H[runJudgeAgent\njudgeAgentService.ts]
        H --> I[calculateCompositeScore\nscoringService.ts]
        I --> J[runSectionAgent\nsectionAgentService.ts]
        J --> K[buildHistoricalLinks\nrunComparisonService.ts]
    end

    subgraph ModeConfig["config/modes.ts — PITCH_MODE_CONFIG"]
        G --> M1{mode?}
        M1 -->|elevator| M2[targetWpm: 165\nbeats: One-liner → Ask\nduration: 30s]
        M1 -->|vc_pitch| M3[targetWpm: 140\nbeats: Problem → Ask\nduration: 120s]
        M1 -->|hackathon| M4[targetWpm: 150\nbeats: Hook → Ask\nduration: 180s]
        M1 -->|final_year| M5[targetWpm: 130\nbeats: Introduction → Next Steps\nduration: 240s]
        M2 & M3 & M4 & M5 --> H
    end

    subgraph Profiles["analysis-profiles.ts — getAnalysisPromptProfile"]
        H --> PR1{mode?}
        PR1 -->|elevator| PR2[ELEVATOR_RUBRIC_TEXT\nScoring: investor harshness]
        PR1 -->|vc_pitch| PR3[VC_RUBRIC_TEXT\nScoring: YC top-decile]
        PR1 -->|hackathon| PR4[HACKATHON_RUBRIC_TEXT\nScoring: demo + innovation]
        PR1 -->|final_year| PR5[FINAL_YEAR_RUBRIC_TEXT\nScoring: methodology + results\nno revenue/TAM penalty]
        PR2 & PR3 & PR4 & PR5 --> LLM
    end

    subgraph JudgePrompts["lib/prompts/judge.ts — getJudgeSystemPrompt + buildPrompt"]
        H --> P1{mode?}
        P1 -->|elevator\nvc_pitch| P2[JUDGE_SYSTEM_PROMPT\nYC top-decile lens\nBenchmark: 80+ needs proof+ask]
        P1 -->|hackathon| P3[HACKATHON_JUDGE_SYSTEM_PROMPT\nDemo quality lens\nBenchmark: 80+ needs demo+innovation]
        P1 -->|final_year| P4[FINAL_YEAR_JUDGE_SYSTEM_PROMPT\nAcademic panel lens\nBenchmark: 80+ needs results+methodology\nNO revenue/TAM/fundraising questions]
        P2 & P3 & P4 --> LLM
    end

    LLM([claude-sonnet-4-6\nGemini fallback → cached sample]) --> R[Parse + validate JSON\nrepair call if invalid]
    R --> S[Inject deterministic\ndelivery metrics]
    S --> T[Update run row\nstatus: complete]
    T --> U([/results/runId])
```

## Overview
Pitch analysis now runs through a server-side model pipeline and stores completed runs client-side in `localStorage`.

### Runtime flow
1. User starts/stops speech session in `/session`.
2. `useSTT` receives final transcript segments from the STT WebSocket backend.
3. When `saved` is emitted, `usePitchRun` sends `POST /api/pitch/run` with `{ mode, transcript, inputType }`.
4. API route calls `runPitchAnalysisController`.
5. Controller validates input and calls `analyzePitch`.
6. `analyzePitch`:
   - computes delivery metrics locally (`services/scoringService.ts`)
   - builds rubric prompt
   - calls LLM router (`lib/llm/router.ts`)
   - parses/validates strict JSON
   - attempts repair call if invalid
   - falls back to cached sample if needed
   - injects local delivery metrics as source of truth
7. API returns `{ runId, status: 'complete', analysis, fallback? }`.
8. Client persists run via `models/run.ts` to `pitchr_runs`.
9. Client navigates to `/results/[runId]`, which reads the run from local storage.

## Provider architecture
- Active selector: `LLM_PROVIDER` (`anthropic` default, `openrouter` rollback).
- OpenRouter transport: `lib/llm/providers/openrouter.ts`.
- Anthropic transport: `lib/llm/providers/anthropic.ts`.
- Provider-independent contract: `lib/llm/types.ts`.
- Realtime checklist semantic evaluation also routes through `lib/llm/router.ts`.

## Why this shape
- Keeps API keys server-side.
- Keeps persisted run history in browser local storage for MVP simplicity.
- Allows provider switch without touching prompts, scoring, controller, or UI flow.

## Current API boundary
- Implemented: `POST /api/pitch/run` for analysis generation.
- Deferred for later PRD phase: run/history list/detail/delete server endpoints.

## Extension path to full PRD target
1. Add mode picker and text input submit path into `usePitchRun`.
2. Wire dashboard/history pages to `models/run.ts`.
3. Introduce server-side persistence and move run CRUD behind API routes.
4. Override provider when needed:
   - Default path: `LLM_PROVIDER=anthropic` with `ANTHROPIC_API_KEY=...`
   - Rollback path: `LLM_PROVIDER=openrouter` with `OPENROUTER_API_KEY=...`
5. Add provider failover policy (primary + backup) in `lib/llm/router.ts`.
6. Add observability:
   - request IDs
   - latency metrics
   - fallback rate tracking
   - validation failure logging
