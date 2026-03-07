# Pitchr

Pitchr is an AI pitch coaching app for founder pitch practice. It supports live recording + transcription, async analysis runs, run history, deck upload/generation, and Miro fix-board export.

## Repo Snapshot (February 22, 2026)

- Frontend: Next.js App Router (`app/`) + React 19 + Tailwind 4
- Analysis: queued async runs (`queued -> running -> complete|failed`) with polling UI
- Persistence: Supabase Postgres (`runs`, `decks`, `slides`) + Supabase Storage (`decks`, `recordings`)
- STT: ElevenLabs realtime via local WebSocket proxy (`server.ts`)
- LLM routing: Anthropic (default) or OpenRouter (env-selected)
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
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY_STT=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run locally:

```bash
yarn dev
```

This starts:

- Next.js app at `http://localhost:3000`
- STT proxy at `http://localhost:3001`

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

Required for core flow:

- `LLM_PROVIDER` (`anthropic` or `openrouter`)
- `ANTHROPIC_API_KEY` (if Anthropic selected)
- `OPENROUTER_API_KEY` (if OpenRouter selected)
- `ELEVENLABS_API_KEY_STT`
- `ELEVENLABS_API_KEY_CONVAI` (for live VC Q&A)
- `ELEVENLABS_CONVAI_AGENT_ID` (for signed URL generation)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `ANTHROPIC_MODEL` (default: `claude-sonnet-4-6`)
- `OPENROUTER_MODEL`
- `ELEVENLABS_API_KEY_TTS`
- `ELEVENLABS_VOICE_ID`
- `ENABLE_SECTION_FEEDBACK` (`true`/`false`)
- `ENABLE_REWRITE_DIFF` (`true`/`false`)
- `PLACE_HOLDER_PITCH`
- `PORT` (STT backend)
- `NEXT_PUBLIC_WS_URL`
- `APP_BASE_URL` (for email links)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`
- `NEWSLETTER_CRON_BEARER_TOKEN` (Supabase Edge secret for newsletter cron auth)
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

- `POST /api/pitch/run` -> create queued analysis run
- `GET /api/pitch/run` -> list runs + aggregate stats
- `GET /api/pitch/run/[runId]` -> fetch single run
- `DELETE /api/pitch/run/[runId]` -> delete run (+ best-effort recording cleanup)
- `GET /api/pitch/run/stats` -> aggregate stats only

Decks:

- `POST /api/deck/upload` -> upload PDF/PPTX and extract slides
- `GET /api/deck` -> list decks
- `GET /api/deck/[deckId]` -> deck + slide text
- `DELETE /api/deck/[deckId]` -> delete deck + assets
- `POST /api/deck/generate` -> generate a deck PDF via LLM

Miro:

- `POST /api/miro/fix-board` (supports optional `transcript`; LLM copy generation)
- `GET /api/miro/fix-board/sync`
- `POST /api/miro/fix-board/markdown`

Miro content generation behavior:
- On create/recreate only, board copy is generated via OpenRouter first.
- If OpenRouter fails, Anthropic is attempted automatically.
- If both fail (or JSON is invalid), deterministic template copy is used and board creation continues.
- When `MIRO_HYBRID_VISUAL_MODE` is enabled, a second LLM pass refines visual composition (mind map + tool selection) while preserving fix-rank integrity.

Live VC Q&A:

- `POST /api/qna/session` -> create session, signed URL, and starter context
- `GET /api/qna/session/[qaSessionId]` -> fetch persisted QA session state/summary
- `POST /api/qna/session/[qaSessionId]/complete` -> persist turns/transcript/evaluation
- `POST /api/qna/resources/refresh` -> process queued knowledge gaps asynchronously

Waitlist + newsletter:

- `POST /api/waitlist` -> add email to waitlist and send welcome email
- `GET /api/newsletter/unsubscribe?token=...` -> one-click unsubscribe
- `POST /api/newsletter/unsubscribe` -> API unsubscribe with `{ token }`
- `POST /functions/v1/newsletter-send` -> send scheduled weekly newsletter campaigns

Setup guide: `docs/waitlist-email-newsletter.md`

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
2. Client submits to `POST /api/pitch/run`.
3. Controller inserts run with `status: queued`.
4. Queue service marks run `running`, then executes analysis service.
5. Analysis service builds scoring context, runs judge prompt, applies deterministic delivery scoring, and enriches vocabulary, section feedback, rewrite diff, and historical links.
6. Run is updated to `complete` (or `failed` with error metadata).
7. Results page polls run endpoint until terminal state.

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start Next + STT proxy together |
| `yarn dev:next` | Start Next.js only |
| `yarn dev:server` | Start STT proxy only |
| `yarn dev:standalone` | Start `server.ts` directly |
| `yarn build` | Production build |
| `yarn start` | Start production Next.js server |
| `yarn typecheck` | TypeScript checks (`tsc --noEmit`) |
| `yarn stt` | CLI STT recorder script |
| `yarn knowledge:snapshot` | Capture curated knowledge snapshots |
| `yarn knowledge:build` | Build `knowledge/patterns.v1.json` |
| `yarn knowledge:refresh` | Snapshot + build |
| `yarn calibrate:weights` | Calibrate delivery weights from fixtures |
| `yarn rubric:matrix:anthropic` | Run Anthropic-only baseline vs custom rubric matrix across cases |
| `yarn rubric:matrix:anthropic:csv` | Export latest Anthropic matrix summary as CSV |
| `yarn sync:rubric-matrix-runners` | Auto-generate per-project-type matrix runner scripts + registry |
| `yarn check:encoding` | Verify UTF-8 encoding |
| `yarn fix:encoding` | Normalize text files to UTF-8 |

Rubric matrix runner registry (visible index for all project types):

- `docs/rubric-matrix-runners.md`

### STT / live transcript / WPM not working

You don’t need to install anything new. Use this checklist:

1. **Run `yarn dev`** (not only `next dev`) That starts Next.js on port 3000 and the STT proxy on port 3001. If the STT server isn’t running, the app can’t get live transcript or WPM.
2. **Set `ELEVENLABS_API_KEY_STT=your_key`** in `.env.local`. Restart after any env change (Ctrl+C, then `yarn dev` again).
3. **Use `http://localhost:3000`** so the app connects to the STT backend at `ws://localhost:3001/ws`. Optional: `NEXT_PUBLIC_WS_URL=http://localhost:3001`.
4. **Check the terminal** for errors (e.g. missing key or WebSocket failures).

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
