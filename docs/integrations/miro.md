# Miro Integration

This project supports a board-per-run Miro integration for pitch fix execution.

## Features

1. Export from Results page to Miro:
- Creates one board per run.
- Adds framed layout + one sticky note per top fix.
- Persists board mapping in Supabase (`run_miro_boards`).
- Generates board copy through LLMs on create/recreate.

2. Import back into Results page:
- Polls Miro for sticky note status updates.
- Syncs `status`, `owner`, and `notes` back into UI.

3. Fallback:
- If Miro API is unavailable, markdown export remains available.
- If board-copy generation fails, deterministic template copy is used.

## Environment Variables

Set these in `.env.local`:

```env
MIRO_ENABLED=true
MIRO_PROVIDER=rest
MIRO_ACCESS_TOKEN=your_token_here
MIRO_TEAM_ID=your_team_id_here
NEXT_PUBLIC_MIRO_POLL_INTERVAL_MS=30000
```

Default behavior:
- If `MIRO_PROVIDER=stub` or token is missing, the integration runs in stub mode.
- Board-copy LLM routing for create/recreate:
- Primary: OpenRouter (`OPENROUTER_API_KEY`)
- Fallback: Anthropic (`ANTHROPIC_API_KEY`)
- Final fallback: deterministic template copy

## Sticky Note Contract

Each sticky note content uses this parseable format:

```txt
[PITCHR_FIX]
Rank: <rank>
Category: <category>
Impact: <impact>

Execution:
Status: todo
Owner:
Notes:
Next Step:
Success Metric:
Blocker:

Issue: <issue text>
Action: <fix text>
```

Only these fields are imported back into app state:
- `status`
- `owner`
- `notes`

## API Endpoints

1. `POST /api/miro/fix-board`
- Create/recreate board + stickies.
- Accepts optional `transcript` for board-copy generation context.

2. `GET /api/miro/fix-board/sync?runId=<id>`
- Pull latest sticky note statuses.

3. `POST /api/miro/fix-board/markdown`
- Generate markdown fallback export.

## MCP/AI Flows Ready Path

Current implementation uses REST provider and a provider interface:
- `services/miro/miroProvider.ts`

Later, add an MCP provider implementing the same interface to route through Miro MCP/AI Flows without rewriting UI or API routes.
