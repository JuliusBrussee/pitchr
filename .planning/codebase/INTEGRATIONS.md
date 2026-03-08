# External Integrations

**Analysis Date:** 2026-03-04

## APIs & External Services

**LLM Providers:**
- Anthropic Messages API - Primary text generation/scoring provider in app + edge runtimes.
  - Integration method: HTTPS `fetch` to `https://api.anthropic.com/v1/messages`
  - Auth: `ANTHROPIC_API_KEY`
  - Evidence: `lib/llm/providers/anthropic.ts`, `supabase/functions/_shared/analysis-service.ts`, `supabase/functions/deck-generate/index.ts`
- OpenRouter API - Configurable provider in app runtime.
  - Integration method: HTTPS `fetch` to `https://openrouter.ai/api/v1/chat/completions`
  - Auth: `OPENROUTER_API_KEY`
  - Evidence: `lib/llm/providers/openrouter.ts`, `lib/llm/router.ts`
- Google Gemini API - Fallback provider in edge analysis flow.
  - Integration method: HTTPS `fetch` to Generative Language API
  - Auth: `GOOGLE_AI_API_KEY`
  - Evidence: `supabase/functions/_shared/analysis-service.ts`

**Voice / Speech:**
- AssemblyAI STT - Transcription for sidecar (buffer on stop) and for upload flow.
  - Integration method: HTTPS upload + transcript + poll to `https://api.assemblyai.com/v2/*` (or `ASSEMBLYAI_BASE_URL` for EU).
  - Auth: `ASSEMBLYAI_API_KEY`
  - Evidence: `lib/stt/assemblyai.ts`, `server.ts`, `supabase/functions/_shared/assemblyai-stt.ts`, `supabase/functions/transcribe-audio/index.ts`, `stt.ts`
- ElevenLabs ConvAI - Live Q&A session URLs and conversation retrieval.
  - Integration method: HTTPS `GET` to `https://api.elevenlabs.io/v1/convai/*`
  - Auth: `ELEVENLABS_API_KEY_CONVAI` (fallbacks to STT key)
  - Evidence: `lib/elevenlabs/convai.ts`, `supabase/functions/_shared/elevenlabs-convai.ts`, `supabase/functions/qna-session/index.ts`
- ElevenLabs TTS - Coach audio playback.
  - Integration method: HTTPS `POST` to `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
  - Auth: `ELEVENLABS_API_KEY_TTS`, `ELEVENLABS_VOICE_ID`
  - Evidence: `lib/elevenlabs/tts.ts`, `server.ts`

**Payments:**
- Stripe - Subscriptions, day-pass/credit purchases, billing portal, webhook lifecycle events.
  - SDK/Client: `stripe` npm SDK
  - Auth: `STRIPE_SECRET_KEY`, webhook `STRIPE_WEBHOOK_SECRET`
  - Endpoints used: checkout sessions, portal sessions, subscriptions, webhook event verification
  - Evidence: `services/stripeService.ts`, `app/api/billing/checkout/route.ts`, `app/api/billing/day-pass/route.ts`, `app/api/billing/credits/route.ts`, `app/api/billing/portal/route.ts`, `app/api/billing/webhook/route.ts`

**Collaboration / Visual Boards:**
- Miro REST API - Fix board creation/sync.
  - Integration method: HTTPS `fetch` to `https://api.miro.com/v2`
  - Auth: `MIRO_ACCESS_TOKEN` (+ optional `MIRO_TEAM_ID`)
  - Evidence: `services/miro/providers/miroRestProvider.ts`, `services/miro/miroService.ts`, `supabase/functions/miro-fix-board/index.ts`

**Email Delivery:**
- Resend - Waitlist and arena transactional email sends.
  - Integration method: HTTPS `POST` to `https://api.resend.com/emails`
  - Auth: `RESEND_API_KEY`, sender `RESEND_FROM_EMAIL`
  - Evidence: `services/emailService.ts`, `services/arenaNotificationService.ts`, `supabase/functions/_shared/email.ts`, `supabase/functions/newsletter-send/index.ts`

**Frontend Third-Party Scripts:**
- Google Analytics 4 (`gtag.js`) - Optional product analytics.
  - Auth/Config: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - Evidence: `app/layout.tsx`
- Google Fonts CDN - Webfont delivery.
  - Evidence: `app/layout.tsx`

## Data Storage

**Databases:**
- Supabase Postgres - Primary relational data store (runs, decks/slides, billing, arena, referrals, waitlist, projects, etc.).
  - Connection: Supabase URL + anon key (user-scoped) and service role (admin ops)
  - Clients: `@supabase/supabase-js` and `@supabase/ssr`
  - Migrations: timestamped SQL migrations
  - Evidence: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `supabase/migrations/`

**File Storage:**
- Supabase Storage buckets
  - `decks` bucket for generated/uploaded deck assets
  - `recordings` bucket for session audio
  - Evidence: `services/deckService.ts`, `services/recordingService.ts`, `supabase/migrations/20250225000002_create_decks_storage_bucket.sql`, `supabase/migrations/20250225000007_create_recordings_bucket.sql`

**Caching:**
- No external cache (Redis/Memcached not present).
- Local in-process caching only (for example short-lived JWT cache in edge-fetch helper).
  - Evidence: `lib/supabase/fetch-edge.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password and Google OAuth sign-in.
  - Implementation: `@supabase/ssr` browser/server clients + middleware session refresh
  - Session management: Supabase auth cookies/JWT
  - Evidence: `app/(auth)/login/page.tsx`, `app/auth/callback/route.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

**OAuth Integrations:**
- Google OAuth via Supabase.
  - Flow: `supabase.auth.signInWithOAuth({ provider: 'google' })`
  - Credentials managed in Supabase project configuration (not in repo)
  - Evidence: `app/(auth)/login/page.tsx`

## Monitoring & Observability

**Error Tracking:**
- Sentry (optional, env-gated).
  - DSN: `NEXT_PUBLIC_SENTRY_DSN`
  - Build/release integration through Next Sentry wrapper
  - Evidence: `instrumentation.ts`, `instrumentation-client.ts`, `app/global-error.tsx`, `next.config.ts`

**Analytics:**
- Google Analytics 4 (optional) via client script injection.
  - Token: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - Evidence: `app/layout.tsx`

**Logs:**
- Console logging in app/server/edge functions (no Datadog/CloudWatch/Splunk integration found).
  - Evidence: `server.ts`, `app/api/*`, `supabase/functions/*`

## CI/CD & Deployment

**Hosting:**
- Vercel for Next.js app and scheduled cron endpoint invocation.
  - Evidence: `vercel.json`, `app/api/arena/cron/weekly/route.ts`
- Supabase for Postgres, Auth, Storage, and Edge Functions.
  - Evidence: `supabase/config.toml`, `supabase/functions/`

**Edge Function Deployment:**
- Manual scripts deploy edge functions via Supabase CLI.
  - Evidence: `scripts/deploy-edge-functions.sh`, `scripts/deploy-edge-functions.ps1`

**CI Pipeline:**
- No repo CI workflow files detected (`.github/workflows` missing).

## Environment Configuration

**Development:**
- Core required vars for app runtime:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (admin routes)
  - `ANTHROPIC_API_KEY`
  - Billing/email/voice keys as features are enabled (`STRIPE_*`, `RESEND_*`, `ELEVENLABS_*`)
  - Evidence: `.env.example`, `lib/supabase/admin.ts`, `services/stripeService.ts`, `services/emailService.ts`, `server.ts`
- Secrets location: local `.env.local` + host dashboards (Vercel/Supabase).
  - Evidence: `.env.example`

**Staging:**
- No explicit in-repo staging profile or separate config file detected.
- Uses standard env-variable separation at deployment platform level.

**Production:**
- Secrets managed via platform environment variables (not committed to repo).
- Critical production hooks: Stripe webhook secret, cron secret, Supabase service role key.
  - Evidence: `app/api/billing/webhook/route.ts`, `app/api/arena/cron/weekly/route.ts`, `lib/supabase/admin.ts`

## Webhooks & Callbacks

**Incoming:**
- Stripe webhook: `POST /api/billing/webhook`
  - Verification: `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`
  - Events handled: checkout completion, subscription lifecycle, invoice payment failures
  - Evidence: `app/api/billing/webhook/route.ts`, `services/stripeService.ts`
- OAuth callback: `GET /auth/callback`
  - Purpose: exchange Supabase auth code for session
  - Evidence: `app/auth/callback/route.ts`
- Vercel cron callback: `POST /api/arena/cron/weekly`
  - Verification: `Authorization: Bearer ${CRON_SECRET}`
  - Evidence: `vercel.json`, `app/api/arena/cron/weekly/route.ts`
- Newsletter unsubscribe callback: `GET/POST /api/newsletter/unsubscribe`
  - Evidence: `app/api/newsletter/unsubscribe/route.ts`

**Outgoing:**
- Stripe API calls from billing routes/services.
  - Evidence: `services/stripeService.ts`, `app/api/billing/*`
- Resend email sends from app + edge functions.
  - Evidence: `services/emailService.ts`, `supabase/functions/_shared/email.ts`
- Miro board sync/create calls.
  - Evidence: `services/miro/providers/miroRestProvider.ts`, `supabase/functions/miro-fix-board/index.ts`
- LLM/STT/TTS/ConvAI provider calls.
  - Evidence: `lib/llm/providers/*.ts`, `server.ts`, `lib/elevenlabs/*.ts`, `supabase/functions/_shared/analysis-service.ts`

---

*Integration audit: 2026-03-04*
*Update when adding/removing external services*
