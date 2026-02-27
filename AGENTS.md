# Pitchr — Agent Instructions

> Read `CLAUDE.md` first. Refer to `.planning/codebase/` for architecture, stack, structure, conventions, integrations, testing, and known concerns.

## Project Context

AI pitch coach MVP. Users record/paste a pitch, get scored analysis with fixes and a rewrite. See `PRD.md` for full spec, `.planning/codebase/ARCHITECTURE.md` for system design.

## Agent: Backend (API + Storage + Pipeline)

**Owns:** `types/`, `models/`, `app/api/`, `controllers/`, `config/`, `hooks/useAudioRecorder.ts`

**Key tasks:** TypeScript types (match PRD Section 7), localStorage CRUD for runs, API route handlers (`app/api/pitch/`), scoring service, audio recording hook.

**Constraints:** UUIDs via `crypto.randomUUID()`, ISO 8601 timestamps, proper HTTP status codes, Supabase client singleton from `lib/supabase.ts`..

## Agent: LLM & Prompts (AI Quality + Integrations)

**Owns:** `lib/llm/`, `lib/prompts/`, `services/analysisService.ts`, `services/scoringService.ts`

**Key tasks:** Claude client, 3 prompt templates (`system.ts`, `rubric.ts`, `rewrite.ts`), analysis pipeline, JSON schema enforcement, Gemini fallback + router.

**Constraints:** LLM output must be valid JSON (no markdown wrapping), delivery metrics calculated locally (not by LLM), temperature 0.3, API keys from env vars only.

## Agent: Frontend (UI + Demo Flow)

**Owns:** `views/components/`, `app/(app)/` pages, `hooks/usePitchRun.ts`, `store/`

**Key tasks:** Results page components (ScoreDisplay, ScoreBreakdown, FixList, RewritePanel, DeliveryMetrics), session 3-step flow, dashboard/history wiring to real data.

**Constraints:** CSS variables for theming (light + dark), accent palette (`#ff5941`, `#ffaa33`, `#e63b26`), glassmorphism pattern, responsive mobile-first.

## Cross-Agent Rules

- **File ownership:** Respect boundaries above. Check `.planning/codebase/STRUCTURE.md` for full directory map.
- **Conventions:** Follow `.planning/codebase/CONVENTIONS.md`
- **Package manager:** Always `yarn`, never `npm`
- **Shared decisions:** UUIDs for run IDs, ISO 8601 timestamps, localStorage key `pitchr_runs`, error responses always `{error: string}`
- **Demo path:** Dashboard -> Run a Pitch -> Select mode -> Input -> Analyze -> Results -> History
