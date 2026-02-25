# Pitchr

Pitchr is an AI pitch coaching app for founder pitch practice. It supports live recording + transcription, async analysis runs, run history, deck upload/generation, and Miro fix-board export.

## Repo Snapshot (February 22, 2026)

- Frontend: Next.js App Router (`app/`) + React 19 + Tailwind 4
- Analysis: queued async runs (`queued -> running -> complete|failed`) with polling UI
- Persistence: Supabase Postgres (`runs`, `decks`, `slides`) + Supabase Storage (`decks`, `recordings`)
- STT: ElevenLabs realtime via sidecar WebSocket proxy (`server.ts`)
- LLM routing: Supabase Edge Functions use Anthropic (primary) with Gemini fallback
- Paid AI: optional value-proof signal sync on completed runs (`services/paidService.ts`)
- Fallback: deterministic/sample analysis payload if model calls fail
- Planning files currently present in `.planning/codebase/` (stack, architecture, structure, conventions, integrations, concerns)

## Implemented App Areas

- `Dashboard`: run stats, rubric averages, recommendations
- `Session`: camera/mic, realtime transcript + checklist, mode selection, deck attachment
- `Results`: polling view, score bands, fixes, rewrite, QA pack, recording playback
- `Live QA`: dedicated 60-second VC Q&A route with persisted session logs
- `History`: filter/search, grouped history, delete runs
- `Deck`: upload PDF/PPTX, extract slide text, generate AI deck PDFs
- `Miro`: create/sync fix boards or export markdown fallback

## Requirements

- Node.js 18+
- Yarn 4 (project is pinned to `yarn@4.12.0`)
- Supabase project (URL + anon key)
- Anthropic key (or OpenRouter key) for analysis/deck generation
- ElevenLabs STT key for live recording
- Optional: LibreOffice (`soffice`) for PPTX -> PDF conversion

## Quick Start

```bash
yarn install
cp .env.example .env.local
```

Fill required values in `.env.local`:

```env
ELEVENLABS_API_KEY_STT=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Set Supabase Edge secrets separately (Supabase dashboard), not in `.env.local`:

```env
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
ELEVENLABS_API_KEY_CONVAI=
ELEVENLABS_CONVAI_AGENT_ID=
NEXT_PUBLIC_ENABLE_LIVE_QA=true
```

Run locally:

```bash
yarn dev
```

This starts:

- Next.js app at `http://localhost:3000`
- STT proxy at `http://localhost:3001`

Runtime/env mapping reference: `docs/runtime-env-matrix.md`.

## Database and Storage Setup (Supabase)

Run these SQL files in Supabase SQL Editor:

1. `migrations/01-create-decks-table.sql`
2. `migrations/02-create-slides-table.sql`
3. `migrations/03-create-decks-storage-bucket.sql`
4. `migrations/04-storage-policies.sql`
5. `migrations/05-create-runs-table.sql`
6. `migrations/08-add-run-lifecycle-columns.sql`
7. `migrations/09-create-recordings-bucket.sql`
8. `migrations/10-recordings-storage-policies.sql`
9. `migrations/11-create-qa-sessions-table.sql`
10. `migrations/12-create-qa-resource-gaps-table.sql`

Notes:

- `migrations/07-rls-policies.sql` also exists, but it references a `settings` table that is not created by the migrations above.
- `migrations/08-add-run-lifecycle-columns.sql` is required for async run lifecycle fields.

Detailed guide: `docs/SUPABASE_SETUP.md`

## Environment Variables

Use runtime-specific env placement:

- Local web + sidecar (`.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_WS_URL`
  - `ELEVENLABS_API_KEY_STT` (or `ELEVENLABS_API_KEY`)
  - `ELEVENLABS_API_KEY_TTS`, `ELEVENLABS_VOICE_ID`
  - `ALLOWED_ORIGINS` (sidecar CORS allow-list)
- Supabase Edge secrets (project settings):
  - `ANTHROPIC_API_KEY` (analysis primary)
  - `GOOGLE_AI_API_KEY` (analysis fallback)
  - `ELEVENLABS_API_KEY_CONVAI`, `ELEVENLABS_CONVAI_AGENT_ID` (live VC Q&A)
  - `NEXT_PUBLIC_ENABLE_LIVE_QA` (`true`/`false`)
  - `PITCHR_DIAGNOSTIC_LOGS` (`true` only for local diagnostics)

Optional:

- `LLM_PROVIDER`, `ANTHROPIC_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- `ENABLE_SECTION_FEEDBACK` (`true`/`false`)
- `ENABLE_REWRITE_DIFF` (`true`/`false`)
- `PLACE_HOLDER_PITCH`
- `PORT` (STT backend)
- `MIRO_ENABLED`, `MIRO_PROVIDER`, `MIRO_ACCESS_TOKEN`, `MIRO_TEAM_ID`
- `MIRO_HYBRID_VISUAL_MODE` (`true` by default; set `false` to disable second visual pass)
- `PAID_ENABLED` (`true` to enable Paid AI sync)
- `PAID_API_KEY` (required when `PAID_ENABLED=true`)
- `PAID_API_BASE_URL` (default: `https://api.paid.ai`)
- Product identifier: `PAID_PRODUCT_ID` or `PAID_EXTERNAL_PRODUCT_ID` (one required for sync)
- Customer identifier: `PAID_CUSTOMER_ID` or `PAID_EXTERNAL_CUSTOMER_ID` (one required for sync)
- `PAID_ORDER_ID` (optional metadata)
- `PAID_SIGNAL_EVENT_COMPLETED`, `PAID_SIGNAL_EVENT_INVESTOR_READY` (optional event name overrides)
- `FOUNDER_HOURLY_RATE_USD`, `VALUE_PER_SCORE_POINT_USD`
- `ANTHROPIC_INPUT_PER_1M_USD`, `ANTHROPIC_OUTPUT_PER_1M_USD`
- `OPENROUTER_INPUT_PER_1M_USD`, `OPENROUTER_OUTPUT_PER_1M_USD`
- `MANUAL_BASELINE_ELEVATOR_MIN`, `MANUAL_BASELINE_VC_MIN`
- `ECON_PLATFORM_OVERHEAD_USD`, `ECON_MIN_RUN_COST_USD`
- `ECON_OPERATIONS_BUFFER_MIN`, `ECON_QUALITY_BONUS_MAX_POINTS`

## API Surface

Pitch runs:

- `POST /functions/v1/pitch-run` -> create analysis run
- `GET /functions/v1/pitch-run` -> list runs + aggregate stats
- `GET /functions/v1/pitch-run-detail?runId=...` -> fetch single run
- `DELETE /functions/v1/pitch-run-detail?runId=...` -> delete run (+ best-effort recording cleanup)
- `GET /functions/v1/pitch-run-stats` -> aggregate stats only
- `GET /functions/v1/integration-health` -> authenticated provider readiness checks

Decks:

- `POST /functions/v1/deck-upload` -> upload PDF/PPTX and extract slides
- `GET /functions/v1/deck-list` -> list decks
- `GET /functions/v1/deck-detail?deckId=...` -> deck + slide text
- `DELETE /functions/v1/deck-detail?deckId=...` -> delete deck + assets
- `POST /functions/v1/deck-generate` -> generate a deck PDF via LLM

Miro:

- `POST /functions/v1/miro-fix-board` (supports optional `transcript`; LLM copy generation)
- `GET /functions/v1/miro-fix-board-sync`
- `POST /functions/v1/miro-fix-board-markdown`

Miro content generation behavior:
- On create/recreate only, board copy is generated via OpenRouter first.
- If OpenRouter fails, Anthropic is attempted automatically.
- If both fail (or JSON is invalid), deterministic template copy is used and board creation continues.
- When `MIRO_HYBRID_VISUAL_MODE` is enabled, a second LLM pass refines visual composition (mind map + tool selection) while preserving fix-rank integrity.

Live VC Q&A:

- `POST /functions/v1/qna-session` -> create session, signed URL, and starter context
- `GET /functions/v1/qna-session-detail?qaSessionId=...` -> fetch persisted QA session state/summary
- `POST /functions/v1/qna-session-complete?qaSessionId=...` -> persist turns/transcript/evaluation
- `POST /functions/v1/qna-resources-refresh` -> process queued knowledge gaps asynchronously

Sidecar (separate runtime):

- `WS /ws` -> realtime STT stream
- `POST /api/coach-answer` -> LLM + TTS coach response
- `GET /healthz` -> sidecar readiness/diagnostics

## Paid AI Integration (Optional)

Pitchr can send post-analysis value signals to Paid AI after a run reaches `complete`.

- Enable with `PAID_ENABLED=true` and set `PAID_API_KEY`.
- Signal endpoint defaults to `https://api.paid.ai/v2/usage/bulk` (`PAID_API_BASE_URL` override supported).
- Signal payload uses `usageRecords[]` with `event_name` and customer/product identifiers.
- Use either internal IDs (`PAID_CUSTOMER_ID` / `PAID_PRODUCT_ID`) or external IDs (`PAID_EXTERNAL_CUSTOMER_ID` / `PAID_EXTERNAL_PRODUCT_ID`).
- Sent signals:
  - `pitch_analysis_completed` for every completed run
  - `investor_ready_achieved` when score is `>= 80`
- Payload includes run metadata and economics fields like estimated run cost, value, ROI, and time saved.
- Sync failures are non-blocking for the user flow; run completion still succeeds and Paid sync status is stored in run metadata.

Detailed setup and payload behavior: `docs/integrations/paid-ai.md`

## Analysis Flow

1. Session captures transcript (realtime STT through `server.ts`).
2. Client submits to `POST /functions/v1/pitch-run` via `fetchEdge(...)`.
3. Edge function writes run with `status: running`.
4. Edge analysis service calls Anthropic first, then Gemini fallback if needed.
5. If all providers fail, deterministic sample fallback is returned (`fallback=true` + warning).
6. Run is updated to `complete` (or `failed` with error metadata).
7. Results page polls `pitch-run-detail` until terminal state and shows fallback diagnostics when present.

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start Next + STT proxy together |
| `yarn dev:next` | Start Next.js only |
| `yarn dev:server` | Start STT proxy only |
| `yarn dev:standalone` | Start `server.ts` directly |
| `yarn build` | Production build |
| `yarn start` | Start production Next.js server |
| `yarn validate:env` | Warn on duplicate/unknown env keys and known typos |
| `yarn typecheck` | TypeScript checks (`tsc --noEmit`) |
| `yarn stt` | CLI STT recorder script |
| `yarn knowledge:snapshot` | Capture curated knowledge snapshots |
| `yarn knowledge:build` | Build `knowledge/patterns.v1.json` |
| `yarn knowledge:refresh` | Snapshot + build |
| `yarn calibrate:weights` | Calibrate delivery weights from fixtures |
| `yarn check:encoding` | Verify UTF-8 encoding |
| `yarn fix:encoding` | Normalize text files to UTF-8 |

## Repo Layout

```txt
app/                  # Next.js routes (UI + API)
views/components/     # Reusable UI components
hooks/                # Client hooks (session, STT, recorder, run submission)
services/             # Business logic (analysis, scoring, deck, run, miro)
controllers/          # API request validation/orchestration
lib/llm/              # LLM providers + router
lib/prompts/          # Prompt templates
config/               # Modes, rubric, strictness, sample fallback
types/                # Shared TypeScript contracts
migrations/           # Supabase SQL migrations
docs/                 # PRD + architecture/integration docs
.planning/codebase/   # Repository analysis docs
```

## Notes

- Package manager is Yarn-only (`yarn.lock` is source of truth).
- Runs and deck data are Supabase-backed (not localStorage-backed in current code).
- If you hit encoding-related parse errors, run:

```bash
yarn fix:encoding
yarn check:encoding
```

## License

MIT
