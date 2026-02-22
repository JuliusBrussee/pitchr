# Pitchr

Pitchr is an AI pitch coaching app for founder pitch practice. It supports live recording + transcription, async analysis runs, run history, deck upload/generation, and Miro fix-board export.

## Repo Snapshot (February 22, 2026)

- Frontend: Next.js App Router (`app/`) + React 19 + Tailwind 4
- Analysis: queued async runs (`queued -> running -> complete|failed`) with polling UI
- Persistence: Supabase Postgres (`runs`, `decks`, `slides`) + Supabase Storage (`decks`, `recordings`)
- STT: ElevenLabs realtime via local WebSocket proxy (`server.ts`)
- LLM routing: Anthropic (default) or OpenRouter (env-selected)
- Fallback: deterministic/sample analysis payload if model calls fail
- Planning files currently present in `.planning/codebase/` (stack, architecture, structure, conventions, integrations, concerns)

## Implemented App Areas

- `Dashboard`: run stats, rubric averages, recommendations
- `Session`: camera/mic, realtime transcript + checklist, mode selection, deck attachment
- `Results`: polling view, score bands, fixes, rewrite, QA pack, recording playback
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
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `ANTHROPIC_MODEL` (default: `claude-sonnet-4-6`)
- `OPENROUTER_MODEL`
- `ELEVENLABS_API_KEY_TTS`
- `ELEVENLABS_VOICE_ID`
- `PLACE_HOLDER_PITCH`
- `PORT` (STT backend)
- `NEXT_PUBLIC_WS_URL`
- `MIRO_ENABLED`, `MIRO_PROVIDER`, `MIRO_ACCESS_TOKEN`, `MIRO_TEAM_ID`

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

## Analysis Flow

1. Session captures transcript (realtime STT through `server.ts`).
2. Client submits to `POST /api/pitch/run`.
3. Controller inserts run with `status: queued`.
4. Queue service marks run `running`, then executes analysis service.
5. Analysis service builds scoring context, runs judge prompt, applies deterministic delivery scoring, and stores outputs.
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
