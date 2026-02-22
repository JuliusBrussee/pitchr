# Technology Stack

**Analysis Date:** 2026-02-22

## Languages

**Primary:**
- TypeScript 5.7.2 - Entire codebase (strict mode enabled in `tsconfig.json`)
- JavaScript (ES2017 target) - Build output, Node scripts

**Secondary:**
- GLSL - Shader files for Three.js rendering, loaded via Turbopack/webpack raw-loader
- SQL - Supabase migrations in `migrations/`

## Runtime

**Environment:**
- Node.js ≥18.x (specified in `package.json` engines)
- Browser (React 19 frontend runs in Chromium-based browsers)

**Package Manager:**
- Yarn 4.12.0 (strict enforcement - project uses `yarn.lock` lockfile)
- Install: `yarn install`
- Lockfile: `yarn.lock` (present and required)

## Frameworks

**Core:**
- Next.js 15.0.3 - Full-stack framework (App Router at `app/` directory)
- React 19.0.0 - UI component framework
- Express 4.21.0 - Backend STT server (`server.ts`)

**3D Graphics:**
- Three.js 0.169.0 - 3D graphics library
- @react-three/fiber 9.5.0 - React renderer for Three.js
- @react-three/drei 10.7.7 - Utility components for Three.js

**Styling & UI:**
- Tailwind CSS 4.0.0 - Utility-first CSS framework
- @tailwindcss/postcss 4.0.0 - PostCSS plugin for Tailwind
- lucide-react 0.575.0 - Icon component library

**Testing:**
- Vitest 4.0.18 - Unit/integration test runner (config: `vitest.config.ts`)
- @testing-library/react 16.3.2 - Component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- @testing-library/jest-dom 6.9.1 - Jest matchers for DOM
- jsdom 28.1.0 - DOM implementation for tests

**End-to-End Testing:**
- @playwright/test 1.58.2 - E2E browser testing framework (config: `playwright.config.ts`)

**Build/Dev Tools:**
- Vite 7.3.1 - Build tool and dev server
- @vitejs/plugin-react 5.1.4 - React plugin for Vite
- tsx 4.19.2 - TypeScript executor for Node scripts
- concurrently 9.1.0 - Run multiple npm scripts in parallel
- cross-env 7.0.3 - Cross-platform environment variable setting

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.97.0 - Supabase client for database and storage access
  - Used for pitch runs, deck metadata, slide text, and audio/PDF storage
  - Initialized in `lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ws 8.18.0 - WebSocket library for real-time STT (server.ts)

**LLM & AI:**
- Anthropic API (Claude via direct HTTP fetch)
  - Provider: `lib/llm/providers/anthropic.ts`
  - Default model: `claude-sonnet-4-6` (configurable via env)
- OpenRouter API (fallback/alternate provider)
  - Provider: `lib/llm/providers/openrouter.ts`
  - Routing logic: `lib/llm/router.ts`

**Speech & Audio:**
- ElevenLabs Realtime STT (via WebSocket)
  - API: `wss://api.elevenlabs.io/v1/speech-to-text/realtime`
  - Proxied through `server.ts` (STT backend)
- ElevenLabs Text-to-Speech (Coach voice feedback)
  - API: `https://api.elevenlabs.io/v1/text-to-speech`
  - Client: `lib/elevenlabs/tts.ts`
- node-record-lpcm16 1.0.1 - Microphone recording for STT CLI

**Document Processing:**
- pdf-parse 2.4.5 - PDF text extraction and analysis
- pdfjs-dist 5.4.624 - PDF parsing library (browser/Node)
- @react-pdf/renderer 4.3.2 - PDF generation in React

**Vision/ML:**
- @mediapipe/tasks-vision 0.10.32 - MediaPipe Vision AI (head tracking, engagement band)

**Other:**
- dotenv 16.4.5 - Environment variable loading
- ws 8.18.0 - WebSocket server/client

## Configuration

**Environment:**
- `.env` - Shared configuration (checked in, no secrets)
- `.env.local` - Local overrides and secrets (git-ignored)
- `.env.example` - Template for required variables

**Required Configuration (from `.env.example`):**
```
LLM_PROVIDER=anthropic                          # 'anthropic' or 'openrouter'
ANTHROPIC_API_KEY=                              # Claude API key (required)
ANTHROPIC_MODEL=claude-sonnet-4-6               # Model version (optional, has default)
OPENROUTER_API_KEY=                             # For fallback provider (optional)
OPENROUTER_MODEL=                               # Fallback model (optional)
ELEVENLABS_API_KEY_STT=                         # STT API key (required for recording)
ELEVENLABS_API_KEY_TTS=                         # TTS API key (optional, for coach voice)
ELEVENLABS_VOICE_ID=                            # Coach voice ID (required if TTS enabled)
NEXT_PUBLIC_SUPABASE_URL=                       # Supabase project URL (required)
NEXT_PUBLIC_SUPABASE_ANON_KEY=                  # Supabase anon key (required)
MIRO_ACCESS_TOKEN=                              # Miro API token (optional)
MIRO_TEAM_ID=                                   # Miro team ID (optional)
MIRO_PROVIDER=rest                              # 'rest' or 'stub' (optional)
MIRO_ENABLED=true                               # Enable Miro integration (optional)
PORT=3001                                       # STT backend port (optional, defaults to 3000)
NEXT_PUBLIC_WS_URL=http://localhost:3001        # WebSocket URL for dev (optional)
```

**Build Configuration:**
- `next.config.ts` - Next.js config (Turbopack GLSL loader, webpack fallback)
- `tsconfig.json` - TypeScript strict mode, path aliases (`@/*` → root)
- `vitest.config.ts` - Vitest unit test config with jsdom environment
- `playwright.config.ts` - Playwright E2E test config
- `tailwind.config.js` - Tailwind CSS configuration

**Encoding:**
- UTF-8 (strict) - Enforced by pre-commit hooks
- Scripts: `fix:encoding`, `check:encoding` - Normalize and validate UTF-8

## Platform Requirements

**Development:**
- Node.js ≥18.x
- Yarn 4.12.0
- Optional: LibreOffice (`soffice` CLI) for PPTX→PDF conversion (used in `services/deckService.ts`)

**Production:**
- Node.js ≥18.x runtime
- Supabase project (database, storage)
- Anthropic API key
- ElevenLabs API keys (STT required, TTS optional)
- Optional: Miro API token (for fix board generation)
- Optional: LibreOffice server for document conversion

**Deployment Target:**
- Vercel (Next.js native, env vars via dashboard)
- Self-hosted Node.js (Docker, systemd, pm2, etc.)
- Serverless (AWS Lambda, Google Cloud Functions with build adaptation)

---

*Stack analysis: 2026-02-22*
