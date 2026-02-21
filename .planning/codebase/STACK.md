# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (all `.ts` and `.tsx` files)
- JSX/TSX - React component templates throughout application

**Secondary:**
- GLSL (OpenGL Shading Language) - WebGL shader programs for 3D orb visualization
  - Fragment shader: `views/components/SiriBubble/shaders/fragment.glsl`
  - Vertex shader: `views/components/SiriBubble/shaders/vertex.glsl`
- CSS/PostCSS - Styling via Tailwind CSS 4

## Runtime

**Environment:**
- Node.js 18+ (required per README)

**Package Manager:**
- npm (included with Node.js)
- Lockfile: `yarn.lock` present (yarn used for dependency management)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
  - Entry point: `app/` directory with App Router pattern
  - Pages: `app/(app)/` for authenticated routes, `app/(marketing)/` for public routes
  - API routes structure: `app/api/` (currently with `.gitkeep` placeholders)

**UI & Rendering:**
- React 19.2.4 - Core UI library with latest features (use client directives throughout)
- React DOM 19.2.4 - DOM rendering
- Three.js 0.183.1 - 3D graphics library
- React Three Fiber 9.5.0 - React renderer for Three.js
  - Used for: `SiriBubble` component (`views/components/SiriBubble/`)
  - Canvas-based 3D orb visualization with state animations
- React Three Drei 10.7.7 - Utility helpers for Three.js in React

**Styling:**
- Tailwind CSS 4.2.0 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS transformation tool
- @tailwindcss/postcss 4.2.0 - PostCSS plugin for Tailwind

**Icon Library:**
- lucide-react 0.575.0 - React icon components
  - Used in: `SessionCanvas`, `AppSidebar`, `MetricsPanel`, and button controls
  - Icons: Video, VideoOff, Mic, MicOff, Monitor, Play, Pause, Square, SkipForward, SkipBack, etc.

## Key Dependencies

**Critical:**
- Next.js 16.1.6 - Server/client framework, routing, deployment
- React 19.2.4 - Component library, hooks system
- React Three Fiber 9.5.0 - 3D rendering (core to `SiriBubble` AI coach visualization)
- Three.js 0.183.1 - WebGL abstraction for 3D graphics
- Tailwind CSS 4.2.0 - Styling system across all components

**Development/Build:**
- TypeScript 5.9.3 - Type checking and compilation
- raw-loader 4.0.2 - Webpack loader for GLSL shader files (configured in `next.config.ts`)
- @vitejs/plugin-react 5.1.4 - React plugin for Vitest
- Vitest 3.2.4 - Unit test runner (configured in `vitest.config.ts`)

## Configuration

**Environment:**
- No external API keys or secrets required currently
- `.env` file pattern recognized but not used (listed in `.gitignore`)
- `.env*.local` files ignored (`.gitignore`)

**Build Configuration:**
- `next.config.ts` - Next.js configuration
  - Turbopack rules for GLSL shader files
  - Webpack fallback rules for GLSL as asset/source
- `tsconfig.json` - TypeScript configuration
  - Target: ES2017
  - Module resolution: bundler
  - Path alias: `@/*` maps to project root
  - Strict mode enabled
- `postcss.config.mjs` - PostCSS configuration for Tailwind
- `vitest.config.ts` - Vitest test runner configuration
  - Environment: jsdom
  - Setup file: `vitest.setup.ts`
  - Global test utilities enabled
- `vitest.setup.ts` - Test setup importing Testing Library jest-dom matchers

**Assets & Shaders:**
- GLSL shader files loaded as raw strings via webpack configuration
- Types: `types/glsl.d.ts` declares module for `.glsl` imports

## Platform Requirements

**Development:**
- Node.js 18+
- npm or yarn package manager
- Browser with WebGL support (for Three.js 3D rendering)
- Webcam/microphone access (for MediaStream API usage)

**Production:**
- Deployment target: Next.js deployable to Vercel, Node.js servers, or edge runtimes
- Browser: Modern browsers with:
  - ES2017+ JavaScript support
  - WebGL support (Three.js requirement)
  - MediaStream API support (camera/microphone access)
  - Web Audio API support (audio processing)

---

*Stack analysis: 2026-02-21*
