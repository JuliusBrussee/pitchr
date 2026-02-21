# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**LLM Providers (Routing):**
- **OpenRouter** - Default LLM provider for pitch analysis
  - SDK/Client: Direct fetch via `lib/llm/providers/openrouter.ts`
  - Auth: `OPENROUTER_API_KEY` (required)
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Default Model: `google/gemini-3-flash-preview`
  - Temperature: 0.3, Max Tokens: 4096

- **Anthropic (Claude)** - Alternative LLM provider
  - SDK/Client: Direct fetch via `lib/llm/providers/anthropic.ts`
  - Auth: `ANTHROPIC_API_KEY` (optional, not yet integrated)
  - Endpoint: `https://api.anthropic.com/v1/messages`
  - Default Model: `claude-sonnet-4-6`
  - Router: `lib/llm/router.ts` dispatches based on `LLM_PROVIDER` env var

- **ElevenLabs Realtime STT** - Speech-to-text transcription
  - SDK/Client: WebSocket connection via `server.ts` and `stt.ts`
  - Auth: `ELEVENLABS_API_KEY` (required for server-side relay)
  - Endpoint: `wss://api.elevenlabs.io/v1/speech-to-text/realtime`
  - Model: `scribe_v2_realtime`
  - Audio Format: PCM 16-bit, 16kHz sample rate
  - Configuration: VAD threshold 0.25, silence 1.5s, min silence 150ms
  - Flow: Browser → Express WebSocket proxy → ElevenLabs (API key stays server-side)

## Data Storage

**Databases:**
- **Supabase (PostgreSQL)**
  - Connection: `lib/supabase.ts` via `@supabase/supabase-js@2.97.0`
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: Supabase JS SDK (REST API over HTTPS)
  - Tables:
    - `decks` - Deck records (id, name, original_url, pdf_url, slide_count, thumbnail_url, created_at)
    - `slides` - Slide text extraction (id, deck_id, slide_num, text)
  - Operations: `deckService.ts` handles CRUD and storage cleanup on delete

**File Storage:**
- **Supabase Storage** - Cloud object storage
  - Bucket: `decks`
  - File paths: `{deckId}/{fileName}`
  - Supported formats: PPTX (converted to PDF), PDF (extracted to text)
  - Operations: `uploadToStorage()` in `deckService.ts` uploads and returns public URL

**Local Storage:**
- **Browser localStorage** - Client-side persistence
  - Key: `pitchr_runs` (defined in `models/run.ts`)
  - Data: Serialized array of Run objects (pitch analysis results)
  - Scope: MVP implementation before Supabase migration
  - Note: No cross-device sync; single-device only

**Caching:**
- None - Direct API calls without Redis or similar

## Authentication & Identity

**Auth Provider:**
- None (custom or implicit)
- Implementation: No auth/login system in MVP scope (per CLAUDE.md)
- Access: Public API endpoints; Supabase anon key allows client-side DB access
- Supabase RLS: Not documented but likely permissive for MVP

## Monitoring & Observability

**Error Tracking:**
- None configured
- Errors: Application-level error handling in API routes and services; no third-party error reporting

**Logs:**
- Console-based only
- Approach: `console.log/error` in Node.js and browser; no centralized logging

## CI/CD & Deployment

**Hosting:**
- Deployment target: Not specified (Next.js production build compatible with Vercel, self-hosted Node.js)
- Server runtime: Node.js 18+
- Dual-port architecture: Next.js `:3000`, Express STT `:3001` (dev)

**CI Pipeline:**
- None detected
- Build command: `npm run build` (Next.js + TypeScript compilation)
- Test command: `npm run test` (Vitest + jsdom)
- Scripts: `npm run dev` runs both Next.js and Express concurrently

## Environment Configuration

**Required env vars:**
- `ELEVENLABS_API_KEY` - ElevenLabs STT (server-side)
- `LLM_PROVIDER` - Router switch: `openrouter` or `anthropic`
- `OPENROUTER_API_KEY` - If LLM_PROVIDER=openrouter
- `OPENROUTER_MODEL` - OpenRouter model selection
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_WS_URL` - WebSocket proxy URL (dev: `http://localhost:3001`)

**Optional env vars:**
- `ANTHROPIC_API_KEY` - For future Anthropic integration
- `ANTHROPIC_MODEL` - Anthropic model selection
- `PORT` - Express server port (default: 3001 for dev, 3000 for production)

**Secrets location:**
- `.env.local` (Git-ignored) - Development secrets
- `.env.example` - Template with placeholders (Git-tracked)
- Vercel/hosting platform env vars - Production secrets

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None currently; Miro board generation (`services/miro/`) and ElevenLabs TTS (`services/elevenlabs/`) directories exist as `.gitkeep` (future Tier 1 features)

## Data Flow Summary

**Pitch Analysis Pipeline:**
1. Browser records audio or pastes text via React component
2. Browser POSTs to `/api/pitch/run` (Next.js route handler)
3. Route handler calls `runPitchAnalysisController` in `controllers/pitchController.ts`
4. Controller routes to `analysisService.ts` which calls LLM via `lib/llm/router.ts`
5. LLM provider (OpenRouter or Anthropic) returns JSON analysis
6. Analysis stored in localStorage (client-side) and/or API response
7. Frontend renders results with score, fixes, rewrite script, delivery metrics

**STT (Speech-to-Text) Pipeline:**
1. Browser captures microphone via MediaStream API
2. Browser WebSocket connects to Express server at `NEXT_PUBLIC_WS_URL`
3. Express relays audio stream to ElevenLabs WebSocket with API key
4. ElevenLabs streams back transcription segments with timestamps
5. Express buffers segments and forwards to browser
6. Browser displays live transcript and updates form field
7. On stop: final transcript sent to pitch analysis pipeline

**Deck Upload Pipeline:**
1. Browser uploads PPTX file to `/api/deck/upload`
2. Route handler saves temporary PPTX file
3. `deckService.ts` converts PPTX → PDF using LibreOffice (`soffice` CLI)
4. Extracts PDF text using `pdf-parse` library
5. Uploads PDF and thumbnail to Supabase Storage
6. Inserts deck and slide records to Supabase PostgreSQL
7. Returns deck ID and metadata for future reference

---

*Integration audit: 2026-02-21*
