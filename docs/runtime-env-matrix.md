# Runtime and Environment Matrix

This project uses multiple runtimes. Keys must be set in the runtime where code actually executes.

## Runtime Matrix

| Feature | Runtime | Host | Env source |
| --- | --- | --- | --- |
| Web UI, session flow, results/history/settings pages | Next.js client/server | Local Next (`yarn dev:next`) or hosted web app | `.env.local` for local web host variables (`NEXT_PUBLIC_*`) |
| Pitch analysis (`pitch-run`, `pitch-run-detail`, `pitch-run-stats`) | Supabase Edge Functions (Deno) | Supabase project | Supabase Edge secrets (`ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, etc.) |
| Live VC Q&A session setup (`qna-session`) | Supabase Edge Functions (Deno) | Supabase project | Supabase Edge secrets (`ELEVENLABS_API_KEY_CONVAI`, `ELEVENLABS_CONVAI_AGENT_ID`, `NEXT_PUBLIC_ENABLE_LIVE_QA`) |
| Realtime STT websocket (`/ws`) and coach answer (`/api/coach-answer`) | Express sidecar (`server.ts`) | Local `yarn dev:server` or Railway service | Sidecar env (`ELEVENLABS_API_KEY_STT`/`ELEVENLABS_API_KEY`, `ELEVENLABS_API_KEY_TTS`, `ELEVENLABS_VOICE_ID`, `ALLOWED_ORIGINS`) |

## Source of Truth

- Analysis and run APIs: Supabase Edge Functions.
- STT/TTS websocket sidecar: Express service (`server.ts`) deployed separately (Railway in production).
- Browser app should call edge functions via `fetchEdge(...)`, not legacy `/api/*` endpoints.

## Required Production Alignment

1. Set edge secrets in Supabase for analysis and live QA.
2. Set sidecar secrets in Railway for STT/TTS.
3. Set web app `NEXT_PUBLIC_WS_URL` to the Railway sidecar URL.
4. Keep `ALLOWED_ORIGINS` on sidecar restricted to your web app origins.

## Diagnostics Endpoints

- `GET /functions/v1/integration-health` (authenticated): provider readiness booleans for edge runtime.
- `GET /healthz` (sidecar): sidecar process + key presence checks (no secret values).

