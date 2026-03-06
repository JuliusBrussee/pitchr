# Technology Stack

**Analysis Date:** 2026-03-04

## Languages

**Primary:**
- TypeScript 5.7.x (`^5.7.2`) - Main application, API routes, services, hooks, and Supabase edge functions.
  - Evidence: `package.json`, `app/`, `services/`, `lib/`, `supabase/functions/`

**Secondary:**
- JavaScript (ES modules) - Tooling/config scripts (`.mjs`) and runtime bootstrap.
  - Evidence: `scripts/*.mjs`, `postcss.config.mjs`
- SQL - Database/storage schema and policy migrations.
  - Evidence: `supabase/migrations/`, `migrations/`
- GLSL - Shader assets for Siri bubble visuals.
  - Evidence: `views/components/SiriBubble/shaders/vertex.glsl`, `views/components/SiriBubble/shaders/fragment.glsl`

## Runtime

**Environment:**
- Node.js `>=18` (declared engine) for Next.js app, API routes, and sidecar realtime STT server.
  - Evidence: `package.json`, `server.ts`
- Browser runtime (React 19 UI).
  - Evidence: `app/`, `views/components/`
- Deno runtime for Supabase Edge Functions.
  - Evidence: `supabase/functions/deno.json`, `supabase/functions/*/index.ts`

**Package Manager:**
- Yarn 4.12.0 (repo standard; Berry config present).
  - Evidence: `package.json` (`packageManager`), `yarn.lock`, `.yarnrc.yml`

## Frameworks

**Core:**
- Next.js 15 (`^15.0.3`) - App Router web app and server routes.
  - Evidence: `package.json`, `app/`, `next.config.ts`
- React 19 (`^19.0.0`) - UI rendering.
  - Evidence: `package.json`, `app/layout.tsx`
- Express 4 (`^4.21.0`) + `ws` (`^8.18.0`) - Local realtime STT WebSocket sidecar.
  - Evidence: `server.ts`, `package.json`

**Styling/UI:**
- Tailwind CSS 4 (`^4.0.0`) via PostCSS plugin.
  - Evidence: `package.json`, `postcss.config.mjs`, `app/globals.css`
- Lucide React icons (`^0.575.0`).
  - Evidence: `package.json`, `views/components/`, `app/(auth)/login/page.tsx`

**Testing:**
- Vitest 4 (`^4.0.18`) + Testing Library + jsdom for unit/integration.
  - Evidence: `vitest.config.ts`, `package.json`, `services/__tests__/`, `hooks/__tests__/`
- Playwright (`^1.58.2`) for E2E.
  - Evidence: `playwright.config.ts`, `tests/e2e/`

**Build/Dev Tooling:**
- TypeScript compiler (`tsc`) in strict mode.
  - Evidence: `tsconfig.json`, `package.json` (`typecheck`)
- `tsx` for TypeScript scripts and sidecar execution.
  - Evidence: `package.json` scripts (`dev:server`, `knowledge:*`, `batch:elevator`)
- `concurrently` and `cross-env` for dev orchestration/env injection.
  - Evidence: `package.json` scripts

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` + `@supabase/ssr` - DB/storage/auth clients (browser, server, admin, edge calls).
  - Evidence: `package.json`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- `stripe` - Billing checkout, portal, subscription lifecycle, webhook verification.
  - Evidence: `package.json`, `services/stripeService.ts`, `app/api/billing/*`
- `@sentry/nextjs` - Error monitoring for client/server.
  - Evidence: `package.json`, `instrumentation.ts`, `instrumentation-client.ts`, `next.config.ts`
- `ws` - Realtime socket bridge to ElevenLabs STT.
  - Evidence: `package.json`, `server.ts`
- `@react-pdf/renderer` + `pdf-parse`/`pdfjs-dist` - Deck generation/render and PDF text extraction.
  - Evidence: `package.json`, `services/deckGenerationService.ts`, `services/deckService.ts`, `hooks/useDeckSlides.ts`

**Infrastructure/Feature Libraries:**
- `@mediapipe/tasks-vision` - Head-tracking/vision features.
  - Evidence: `package.json`, `lib/headTracking/useHeadTracking.ts`
- `three` + `@react-three/fiber` + `@react-three/drei` - 3D visual components.
  - Evidence: `package.json`, `views/components/SiriBubble/`

## Configuration

**Environment:**
- Environment-first configuration with `.env.example` as template and `.env.local` for local secrets.
  - Evidence: `.env.example`, `.env.local`, `scripts/validate-env.mjs`
- App behavior/feature flags heavily env-driven (LLM provider, billing, email, analytics, observability).
  - Evidence: `.env.example`, `config/billing.ts`, `lib/llm/router.ts`, `app/layout.tsx`, `instrumentation.ts`

**Build:**
- Next config includes Sentry wrapper and GLSL handling (Turbopack + webpack fallback).
  - Evidence: `next.config.ts`
- TS config uses strict mode and `@/*` alias.
  - Evidence: `tsconfig.json`
- Vercel cron config exists for weekly arena job.
  - Evidence: `vercel.json`

## Platform Requirements

**Development:**
- macOS/Linux/Windows with Node 18+ and Yarn 4.
- Supabase project + keys needed for full-stack local functionality.
- Optional but required for PPTX conversion path: LibreOffice `soffice` binary.
  - Evidence: `services/deckService.ts`

**Production:**
- Next.js host (Vercel-configured in repo) plus Supabase (Postgres, Auth, Storage, Edge Functions).
  - Evidence: `vercel.json`, `lib/supabase/*`, `supabase/functions/`
- External service credentials required for paid/AI/email/voice features.
  - Evidence: `.env.example`, `services/stripeService.ts`, `services/emailService.ts`, `lib/llm/providers/anthropic.ts`, `lib/elevenlabs/tts.ts`

---

*Stack analysis: 2026-03-04*
*Update after major dependency/runtime changes*
