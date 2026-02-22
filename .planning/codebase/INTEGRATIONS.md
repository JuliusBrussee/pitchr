# External Integrations

**Analysis Date:** 2026-02-22

## APIs & External Services

**Language Models (LLM):**
- Anthropic Claude API
  - SDK/Client: Direct HTTP fetch (no official SDK used) in `lib/llm/providers/anthropic.ts`
  - Endpoint: `https://api.anthropic.com/v1/messages`
  - Model: `claude-sonnet-4-6` (default, configurable)
  - Auth: `ANTHROPIC_API_KEY` (header: `x-api-key`)
  - Used for: Pitch scoring, analysis, rewrite scripts, coach feedback
  - Timeout: 25 seconds (configurable per request)
  - Max tokens: 4096 (configurable)
  - Retries: 2 attempts on 429 or 5xx errors

- OpenRouter API (fallback/alternate)
  - SDK/Client: Direct HTTP fetch in `lib/llm/providers/openrouter.ts`
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Model: `anthropic/claude-sonnet-4.6` (default)
  - Auth: `OPENROUTER_API_KEY` (header: `Authorization: Bearer ...`)
  - Routing: Configured via `LLM_PROVIDER` env var (defaults to `anthropic`)
  - Used for: Same as Anthropic (fallback if primary fails)

**Speech-to-Text (STT):**
- ElevenLabs Realtime STT
  - API: WebSocket at `wss://api.elevenlabs.io/v1/speech-to-text/realtime`
  - SDK/Client: Native WebSocket connection proxied through `server.ts` (not direct browser access for security)
  - Auth: `ELEVENLABS_API_KEY` or `ELEVENLABS_API_KEY_STT` (header: `xi-api-key`)
  - Model: `scribe_v2_realtime`
  - Input: PCM 16kHz audio chunks
  - Output: Partial and committed transcripts with word-level timing
  - Used for: Real-time transcription during pitch recording
  - Config: VAD threshold 0.25, 150ms silence detection, 1.5s commit delay
  - Integration: `server.ts` relays audio from browser → ElevenLabs → browser

**Text-to-Speech (TTS):**
- ElevenLabs Text-to-Speech
  - API: `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
  - SDK/Client: HTTP POST in `lib/elevenlabs/tts.ts` (`synthesizeMp3()`)
  - Auth: `ELEVENLABS_API_KEY_TTS` (header: `xi-api-key`)
  - Model: `eleven_multilingual_v2`
  - Output format: MP3 audio buffer
  - Used for: Coach question playback, coach feedback voice
  - Integration: Called from `server.ts` (coach-answer endpoint) and session end flow

**Collaboration & Boards:**
- Miro REST API
  - Endpoint: `https://api.miro.com/v2`
  - SDK/Client: Direct HTTP fetch in `services/miro/providers/miroRestProvider.ts`
  - Auth: `MIRO_ACCESS_TOKEN` (bearer token)
  - Team ID: `MIRO_TEAM_ID` (required for board creation)
  - Used for: Creating fix boards (ranked issues, rewrite scripts as collaborative workspace)
  - Optional: Disabled if `MIRO_ENABLED=false` or env vars missing → fallback to markdown export
  - Service: `services/miro/miroService.ts` (interface pattern with fallback)

## Data Storage

**Databases:**
- Supabase (Postgres)
  - Connection: HTTPS via `@supabase/supabase-js` client in `lib/supabase.ts`
  - Auth: Public anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) with RLS policies
  - Credentials:
    - URL: `NEXT_PUBLIC_SUPABASE_URL`
    - Anon Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Tables:
    - `runs` - Pitch analysis records (score, transcript, analysis JSON, status, timing)
    - `decks` - Presentation metadata (name, PDF URL, slide count, thumbnail)
    - `slides` - Extracted slide text per deck (FK to decks with cascade delete)
  - CRUD operations: `services/runService.ts`, `services/deckService.ts`
  - Migrations: `migrations/05-create-runs-table.sql`, etc.

**File Storage:**
- Supabase Storage (S3-compatible)
  - Buckets:
    - `decks` - PDF files, thumbnails (50 MB file limit)
    - `recordings` - Audio files from pitch sessions
  - Access: Public URLs via `getPublicUrl()`, no auth required (MVP design)
  - Policies: `migrations/04-storage-policies.sql`, `migrations/10-recordings-storage-policies.sql`
  - Client: `@supabase/supabase-js` storage API
  - Integration: `services/deckService.ts` (upload/delete), recording uploads via API

**Caching:**
- None detected - Session state via React hooks, localStorage for run history (client-side only in MVP)

## Authentication & Identity

**Auth Provider:**
- None (MVP scope - no authentication)
- Supabase RLS policies allow anonymous public access with `is_authenticated = false`
- API routes use public anon key only

**Coach Identity:**
- Configured via environment (not database)
  - Pitch template: `PLACE_HOLDER_PITCH` env var (loaded in `lib/llm/pitchCoach.ts`)
  - Coach voice: `ELEVENLABS_VOICE_ID` (ElevenLabs voice character)

## Monitoring & Observability

**Error Tracking:**
- Not detected - Errors logged to console in development/production
- Sentry/DataDog integration: Not present

**Logs:**
- Console logging (browser: `console.*`, server: `console.log`/`console.error`)
- No log aggregation service integrated
- Server logs from `server.ts` for STT, coach feedback, transcript save events
- Analytics service stub in `lib/analytics.ts` (placeholder for future use)

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js native deployment target)
- Alternative: Self-hosted Node.js + Supabase

**CI Pipeline:**
- Not detected in codebase
- Playwright tests available (`@playwright/test`) but no CI config found
- Pre-commit hooks: UTF-8 encoding check/fix (`scripts/check-encoding.mjs`, `scripts/normalize-encoding.mjs`)

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - Claude API key (required for pitch analysis)
- `ELEVENLABS_API_KEY_STT` - ElevenLabs STT key (required for recording/transcription)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (required for deck/run storage)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (required for DB access)

**Optional env vars:**
- `ELEVENLABS_API_KEY_TTS` + `ELEVENLABS_VOICE_ID` - For coach voice feedback
- `MIRO_ACCESS_TOKEN` + `MIRO_TEAM_ID` - For fix board generation
- `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` - For LLM fallback
- `ANTHROPIC_MODEL` - Override Claude model version
- `LLM_PROVIDER` - Route to 'anthropic' or 'openrouter'
- `NEXT_PUBLIC_WS_URL` - WebSocket URL for STT backend (dev only)
- `PORT` - STT server port (default 3000)

**Secrets location:**
- `.env.local` (git-ignored) - Development secrets
- `.env` (checked in) - Shared, non-secret config
- Vercel/hosting dashboard - Production secrets

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Miro board creation sends fix data (POST request) to `https://api.miro.com/v2/boards`
- Coach feedback Q&A endpoint: `POST /api/coach-answer` (internal, client→server)

## Data Flow Diagrams

**Pitch Recording → Analysis:**
```
Browser (React)
  ↓ audio chunks via WebSocket
Server (Express + WebSocket)
  ↓ relayed to STT backend via WebSocket
ElevenLabs STT
  ↓ transcript messages back to server
Server (relays to browser + saves)
Browser displays live transcription
  ↓ user clicks "Analyze"
Next.js API route (/api/pitch/run, POST)
  ↓ submits transcript to LLM
Anthropic Claude API
  ↓ returns analysis JSON
Response stored in Supabase
```

**Pitch Deck Upload:**
```
Browser (React Form)
  ↓ POST file to /api/deck/upload
Next.js API route handler
  ↓ converts PPTX→PDF (execFile soffice)
  ↓ extracts text from PDF (pdf-parse)
Supabase Storage (upload PDF)
Supabase DB (insert deck + slides)
  ↓ returns deck ID + slide URLs
Browser displays deck
```

**Fix Board Generation:**
```
Browser (user clicks "Generate Miro Board")
  ↓ POST to /api/miro/fix-board
Next.js API route handler
  ↓ submits analysis to Miro API
Miro REST API (/v2/boards POST)
  ↓ returns board ID + URL
Miro API (/v2/boards/{id}/items POST) ← add fixes
  ↓ returns board link
Browser redirects to Miro board
Fallback: If Miro fails → return markdown export
```

---

*Integration audit: 2026-02-22*
