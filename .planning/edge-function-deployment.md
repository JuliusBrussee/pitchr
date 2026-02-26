# Edge Function Deployment Guide

## Critical: `--no-verify-jwt` Flag Required

All Supabase edge functions MUST be deployed with `--no-verify-jwt`.

### Why

This project uses Supabase's newer key format (`sb_publishable_...`) which produces **ES256** JWTs.
The edge function relay's built-in JWT verification expects **HS256** tokens. This mismatch causes
every authenticated request to fail with:

```json
{"code": 401, "message": "Invalid JWT"}
```

### Auth Is Still Enforced

Disabling relay-level verification does NOT remove authentication. Every edge function calls
`getAuthenticatedUser(req)` (in `supabase/functions/_shared/supabase.ts`) which:

1. Extracts the `Authorization` header
2. Creates a Supabase client scoped to that JWT
3. Calls `supabase.auth.getUser()` to validate the token server-side
4. Throws `AuthenticationError` (→ 401) if invalid

## Deploy Commands

Single function:
```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

All functions:
```bash
for fn in deck-detail deck-generate deck-list deck-upload \
  miro-fix-board miro-fix-board-markdown miro-fix-board-sync \
  pitch-run pitch-run-detail pitch-run-stats \
  qna-resources-refresh qna-session qna-session-complete qna-session-detail \
  settings; do
  npx supabase functions deploy "$fn" --no-verify-jwt
done
```

## Function Inventory

| Function | Methods | Purpose |
|----------|---------|---------|
| pitch-run | POST, GET | Create analysis run / list runs |
| pitch-run-detail | GET, DELETE | Single run by ID |
| pitch-run-stats | GET | Aggregate stats |
| deck-list | GET | List uploaded decks |
| deck-upload | POST | Upload deck |
| deck-detail | GET, DELETE | Single deck by ID |
| deck-generate | POST | Generate deck |
| qna-session | POST | Create Q&A session |
| qna-session-detail | GET, DELETE | Single Q&A session |
| qna-session-complete | POST | Complete Q&A session |
| qna-resources-refresh | POST | Refresh Q&A resources |
| miro-fix-board | POST | Create Miro fix board |
| miro-fix-board-markdown | POST | Markdown fix board |
| miro-fix-board-sync | POST | Sync to Miro |
| settings | GET, PATCH | User settings |

## Client-Side Auth Flow

1. `fetchEdge()` (`lib/supabase/fetch-edge.ts`) builds the request
2. `getEdgeHeaders()` retrieves the JWT from `supabase.auth.getSession()`
   - Falls back to `getUser()` + retry if session is null (handles stale/expired tokens)
3. Headers sent: `Authorization: Bearer <jwt>`, `apikey: <anon_key>`
4. Edge function validates via `getAuthenticatedUser(req)`

## Secrets

Set via `npx supabase secrets set KEY=VALUE`. Required:

| Secret | Purpose |
|--------|---------|
| ANTHROPIC_API_KEY | Claude API for pitch analysis |
| SUPABASE_URL | Self-reference for admin client |
| SUPABASE_ANON_KEY | Self-reference for user-scoped client |
| SUPABASE_SERVICE_ROLE_KEY | Admin operations (billing, usage) |
| BILLING_DEV_USER_IDS | Comma-separated user IDs with unlimited usage |
| ELEVENLABS_API_KEY_STT | Speech-to-text |
| ELEVENLABS_API_KEY_TTS | Text-to-speech |
| ELEVENLABS_VOICE_ID | TTS voice |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 "Invalid JWT" from relay | Function deployed without `--no-verify-jwt` | Redeploy with flag |
| 401 "Authentication required" | No/expired JWT in request | Check `fetchEdge` auth flow, ensure user is logged in |
| 401 "Missing Authorization header" | `getSession()` returned null | Fixed: `fetchEdge` now retries with `getUser()` |
| "Pitch analysis failed" (generic) | Error message not surfaced | Fixed: `usePitchRun.ts` now checks `payload.message` too |
