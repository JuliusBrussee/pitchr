# Miro Integration

This project supports a board-per-run Miro integration for pitch fix execution.

## Features

1. Export from Results page to Miro:
- Creates one board per run.
- Adds one sticky note per top fix.
- Stores board link in local storage keyed by run ID.

2. Import back into Results page:
- Polls Miro for sticky note status updates.
- Syncs `status`, `owner`, and `notes` back into UI.

3. Fallback:
- If Miro API is unavailable, markdown export remains available.

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

## Sticky Note Contract

Each sticky note content uses this parseable format:

```txt
[PITCHR_FIX]
runId: <runId>
fixRank: <rank>
category: <category>
impact: <impact>
status: todo
owner:
notes:

Issue: <issue text>
Action: <fix text>
```

Only these fields are imported back into app state:
- `status`
- `owner`
- `notes`

## API Endpoints

1. `POST /api/miro/fix-board`
- Create board + stickies.

2. `GET /api/miro/fix-board/sync?runId=<id>&boardId=<id>`
- Pull latest sticky note statuses.

3. `POST /api/miro/fix-board/markdown`
- Generate markdown fallback export.

## MCP/AI Flows Ready Path

Current implementation uses REST provider and a provider interface:
- `services/miro/miroProvider.ts`

Later, add an MCP provider implementing the same interface to route through Miro MCP/AI Flows without rewriting UI or API routes.

