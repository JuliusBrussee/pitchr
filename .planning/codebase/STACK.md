# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- TypeScript 5.7.2 - Strict mode, all application code
- JavaScript (ES2017 target) - Configuration files, some utilities

**Secondary:**
- GLSL - Shader code for Three.js 3D rendering (loaded via raw-loader)
- JSON - Configuration and data files

## Runtime

**Environment:**
- Node.js >=18 (specified in `package.json` engines)

**Package Manager:**
- Yarn 4.12.0 (specified via `packageManager` field)
- Config: `.yarnrc` uses `nodeLinker: node-modules`
- Lockfile: `yarn.lock` (Git-tracked)

## Frameworks

**Core:**
- Next.js 15.0.3 - Full-stack framework with App Router
- React 19.0.0 - UI component library
- Express 4.21.0 - Backend WebSocket server for STT relay (runs on port 3001)

**3D & Graphics:**
- Three.js 0.169.0 - 3D graphics library
- React Three Fiber 9.5.0 - React renderer for Three.js
- @react-three/drei 10.7.7 - Utilities for React Three Fiber

**UI & Styling:**
- Tailwind CSS 4.0.0 - Utility-first CSS framework
- lucide-react 0.575.0 - Icon library
- @tailwindcss/postcss 4.0.0 - PostCSS plugin for Tailwind

**Testing:**
- Vitest 3.2.4 - Unit/integration test framework (ESM-native)
- @vitejs/plugin-react - React support for Vitest
- jsdom - DOM implementation for browser tests
- Testing Library - Component and hook testing utilities

**CLI & Recording:**
- node-record-lpcm16 1.0.1 - Microphone recording to PCM stream
- pdf-parse 2.4.5 - PDF text extraction

**Real-time Communication:**
- ws 8.18.0 - WebSocket client/server library

**Utilities:**
- dotenv 16.4.5 - Environment variable loading
- concurrently 9.1.0 - Run multiple npm scripts in parallel
- cross-env 7.0.3 - Cross-platform environment variable setting
- tsx 4.19.2 - TypeScript execution for Node.js

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.97.0 - Why it matters: Database and file storage backend for pitch decks, slides, and PDFs. Required for deck upload feature.
- @anthropic/sdk - Dependency reference for future Anthropic integration (env var ANTHROPIC_API_KEY available but not yet in package.json)

**Infrastructure:**
- express 4.21.0 - WebSocket relay server for ElevenLabs STT API (shields API key from browser)
- pdf-parse 2.4.5 - Extract text from uploaded PPTX-converted PDFs for pitch deck analysis

## Configuration

**Environment:**
- Location: Project root (`.env.example` provided)
- Key configs required:
  - `ELEVENLABS_API_KEY_STT` - ElevenLabs Realtime STT API key (required for speech-to-text)
  - `LLM_PROVIDER` - Either `openrouter` or `anthropic` (defaults to `openrouter`)
  - `OPENROUTER_API_KEY` - OpenRouter API key (required if LLM_PROVIDER=openrouter)
  - `OPENROUTER_MODEL` - Model ID for OpenRouter (default: `google/gemini-3-flash-preview`)
  - `ANTHROPIC_API_KEY` - Anthropic API key (optional, for future use)
  - `ANTHROPIC_MODEL` - Model ID for Anthropic (default: `claude-sonnet-4-6`)
  - `NEXT_PUBLIC_WS_URL` - WebSocket URL for STT backend (default: `http://localhost:3001`)
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (required for deck storage)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (required for deck storage)

**Build:**
- `next.config.ts` - Webpack/Turbopack GLSL loader configuration
- `tsconfig.json` - TypeScript strict mode, path aliases (`@/*` → root)
- `postcss.config.mjs` - PostCSS Tailwind plugin
- `vitest.config.ts` - Test runner configuration with jsdom environment
- `.editorconfig` - Cross-editor formatting consistency

## Platform Requirements

**Development:**
- Node.js >=18
- Yarn 4.12.0
- SoX (System Sounds Exchange) - Required on PATH for `node-record-lpcm16` microphone recording
- LibreOffice (`soffice` command) - Required for PPTX→PDF conversion in `deckService.ts`

**Production:**
- Node.js >=18
- Supabase project with configured storage bucket (`decks`) and database tables (`decks`, `slides`)
- ElevenLabs API key for STT functionality
- OpenRouter or Anthropic API key for LLM pitch analysis

---

*Stack analysis: 2026-02-21*
