# Pitchr

Pitchr is an AI pitch coaching app. Record or transcribe a pitch, run structured analysis, and review score, fixes, rewrite, and delivery metrics.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Yarn 4 (Corepack-managed)

## Setup

```bash
yarn install
copy .env.example .env .env.local
```

Set at least these values in `.env.local`:

- `ELEVENLABS_API_KEY_STT` (required for realtime STT)
- `LLM_PROVIDER=openrouter`
- `LLM_ROUTING_MODE=openrouter_then_anthropic`
- `LLM_PROVIDER_PRIMARY=openrouter`
- `LLM_PROVIDER_FALLBACK=anthropic`
- `OPENROUTER_API_KEY`
- Optional override: `OPENROUTER_MODEL=anthropic/claude-sonnet-4.6`

## Run Locally

```bash
yarn dev
```

This starts:

- Next.js app at `http://localhost:3000`
- STT proxy server at `http://localhost:3001`

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start Next + STT proxy together |
| `yarn dev:next` | Start Next.js only |
| `yarn dev:server` | Start STT proxy only |
| `yarn dev:standalone` | Start server.ts directly |
| `yarn knowledge:snapshot` | Capture curated research snapshots with Playwright |
| `yarn knowledge:build` | Build `knowledge/patterns.v1.json` from corpus + snapshots |
| `yarn knowledge:refresh` | Snapshot + rebuild knowledge pack |
| `yarn calibrate:weights` | Calibrate deterministic delivery weights from fixtures |
| `yarn stt` | Run CLI STT recorder script |
| `yarn build` | Production build |
| `yarn start` | Start production server |
| `yarn typecheck` | Run TypeScript checks |
| `yarn check:encoding` | Validate UTF-8 encoding guardrails |
| `yarn fix:encoding` | Normalize UTF-16/UTF-8 BOM text files to UTF-8 |

## Package Manager Policy

- This repo is Yarn-only (`packageManager: yarn@4.12.0` in `package.json`).
- `yarn.lock` is the source of truth.
- `package-lock.json` is intentionally not used and ignored.

## Encoding Recovery

If you see parser errors like `Unexpected token '�'` or CSS `Unknown word` at byte 1:

```bash
yarn fix:encoding
yarn check:encoding
```

## Analysis Pipeline

1. Session audio is transcribed via STT WebSocket.
2. Session submits to `POST /api/pitch/run` with mode + transcript + optional deck/stage.
3. API enqueues a run and returns quickly with `{ runId, status: "queued" }`.
4. Background processor runs prep + judge analysis and updates run status (`queued -> running -> complete|failed`).
5. Results UI polls `GET /api/pitch/run/[runId]` until completion.
6. Final run payload includes `{ analysisVersion, coverage, outputs, meta, analysis }`.

## Async Run Migration

Apply `migrations/08-add-run-lifecycle-columns.sql` in Supabase SQL editor before using async run status.

More details: `docs/architecture/pitch-analysis-pipeline.md`.

## Provider Routing

- Default: `LLM_ROUTING_MODE=openrouter_then_anthropic`
- Primary provider: OpenRouter (`LLM_PROVIDER_PRIMARY=openrouter`)
- Fallback provider: Anthropic (`LLM_PROVIDER_FALLBACK=anthropic`)
- Legacy env (`LLM_PROVIDER`) is still accepted.

## Codex MCP

This repo includes a project-scoped Codex MCP server configuration in `.codex/config.toml`.

- Run Codex from the repository root (`c:\dev\pitchr`).
- The project must be trusted in Codex for project-scoped config to load.
- Verify the server with:

```bash
codex mcp get supabase
```

- Do not use `codex mcp add` for this repo setup because it writes to user config at `~/.codex/config.toml`.

## Miro Integration

Results page supports Miro fix-board export and sync.

Environment setup in `.env.local`:

```bash
MIRO_ENABLED=true
MIRO_PROVIDER=rest
MIRO_ACCESS_TOKEN=...
MIRO_TEAM_ID=...
NEXT_PUBLIC_MIRO_POLL_INTERVAL_MS=30000
```

If credentials are missing, the app falls back to stub mode and markdown export.

See: `docs/integrations/miro.md`
## License

MIT
