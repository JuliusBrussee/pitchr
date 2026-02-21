# Pitchr — Claude Code Instructions

## What This Is

AI pitch coach: record/paste a pitch, get investor-grade score (/100), ranked fixes, rewritten script, and delivery metrics. Built with Next.js App Router + React 19 + Three.js. See `PRD.md` for full spec.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm test             # Run all tests (vitest)
npm run test:watch   # Watch mode
```

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, `app/` directory)
- **UI:** React 19.2.4, Tailwind CSS 4.2.0, lucide-react icons
- **3D:** Three.js 0.183.1 + React Three Fiber 9.5.0 (SiriBubble orb)
- **Language:** TypeScript 5.9.3 (strict mode)
- **Tests:** Vitest 3.2.4 + Testing Library + jsdom
- **Shaders:** GLSL loaded via raw-loader (next.config.ts)
- **Storage:** localStorage (MVP) — no database, no auth

## Architecture

MVC adapted for Next.js App Router:

```
Views:       app/(app)/pages + views/components/   (React UI)
Controllers: app/api/ route handlers               (HTTP orchestration)
Services:    services/                              (business logic, LLM calls)
Models:      models/                                (data schemas, localStorage CRUD)
```

Data flows: Page -> Hook -> API route -> Controller -> Service -> LLM/Storage

## Project Structure

```
app/(app)/           # Route pages: dashboard, session, results/[runId], history
app/api/pitch/       # API endpoints: run/ (POST, GET), run/[runId]/ (GET, DELETE)
views/components/    # Reusable UI components
hooks/               # Custom React hooks (useMediaStream, useSessionState, etc.)
services/            # Business logic (analysisService, scoringService, etc.)
models/              # Data schemas + localStorage CRUD
lib/llm/             # Claude/Gemini API clients
lib/prompts/         # LLM prompt templates (system, rubric, rewrite)
config/              # Rubric definitions, pitch mode configs
types/               # Shared TypeScript types
store/               # Client-side state management
```

## Code Conventions

### Naming

| What | Convention | Example |
|------|-----------|---------|
| Components | PascalCase files + exports | `ScoreBreakdown.tsx`, `export function ScoreBreakdown()` |
| Hooks | camelCase with `use` prefix | `useAudioRecorder.ts`, `export function useAudioRecorder()` |
| Types/Interfaces | PascalCase | `AnalysisResult`, `RubricScore`, `PitchMode` |
| Constants | UPPER_SNAKE_CASE | `COACH_MESSAGES`, `MOCK_CHECKLIST` |
| State booleans | `is` prefix | `isRecording`, `isCameraOn`, `isSessionActive` |
| Refs | camelCase + `Ref` suffix | `videoRef`, `intervalRef` |
| Event handlers | `on` prefix | `onStartSession`, `onStopSession` |

### Style

- 2-space indentation, semicolons, trailing commas in multiline
- Single quotes for imports/strings, double quotes for JSX attributes
- `import type` for type-only imports
- Path alias: `@/*` maps to project root (use for all non-relative imports)

### Import Order

1. React + third-party (`react`, `next`, `lucide-react`, `three`)
2. Local `@/` imports (`@/views/components/`, `@/hooks/`, `@/services/`)
3. Relative imports (`./types`, `./constants`)

### Component Patterns

- `'use client'` directive on all interactive components
- Named exports only (no default exports)
- Destructured object props with TypeScript interfaces
- Sub-components defined in same file if <300 lines, extract to separate file if larger
- Barrel `index.ts` for compound component directories (e.g., `SiriBubble/index.ts`)
- Tests co-located in `__tests__/` subdirectory

### Styling

- Tailwind utility classes for layout/spacing
- CSS variables for theming: `--bg-primary`, `--bg-surface`, `--text-primary`, `--border-color`, etc.
- Light mode = `:root`, Dark mode = `.dark` class (see `globals.css`)
- Accent colors: coral/orange (`#ff5941`, `#ffaa33`, `#e63b26`)
- Glassmorphism: `backdrop-blur` + semi-transparent `--bg-surface`
- Use inline `style` for dynamic theme values, Tailwind for static layout

## Key Data Types (from PRD Section 7)

```typescript
type PitchMode = 'elevator' | 'vc_pitch'
type InputType = 'audio' | 'text'
type RubricCategory = 'structure' | 'clarity' | 'evidence' | 'market' | 'delivery'

interface Run {
  id: string; createdAt: string; mode: PitchMode; inputType: InputType;
  transcript: string; audioUrl?: string; analysis: AnalysisResult; overallScore: number;
}

interface AnalysisResult {
  overall_score: number; one_line_verdict: string;
  rubric_breakdown: RubricScore[]; top_fixes: Fix[];
  rewrite_script: string; delivery_metrics: DeliveryMetrics;
}
```

Full schemas in `PRD.md` sections 7 and 11.

## LLM Integration

- **Primary:** Claude API (`claude-sonnet-4-6`, temp 0.3, 4096 max tokens)
- **Fallback:** Gemini API (same prompts, or JSON repair)
- **Demo safety:** Cached sample result in `config/sampleResult.ts` if all LLMs fail
- Prompts live in `lib/prompts/` (system.ts, rubric.ts, rewrite.ts)
- LLM must return strict JSON matching `AnalysisResult` schema — no markdown wrapping

## Rubric (5 categories, each 0-20, total 0-100)

1. **Structure** (20) — Problem -> Solution -> Why Now -> Traction -> Ask
2. **Clarity** (20) — Every sentence earns its place, no jargon
3. **Evidence** (20) — Specific numbers, named customers, concrete milestones
4. **Market** (20) — TAM/SAM sourced, competitors named, moat articulated
5. **Delivery** (20) — 130-160 WPM, <3% filler words, no repetition

Score bands: 0-39 Needs Work, 40-59 Getting There, 60-79 Solid, 80-100 Investor-Ready

## Testing

- Framework: Vitest + Testing Library + jsdom
- Mock WebGL/Canvas: `vi.mock('@react-three/fiber', ...)` for Three.js components
- Hook tests: `renderHook()` + `act()` from Testing Library
- Test files: `__tests__/[name].test.ts(x)` co-located with source
- Use `data-testid` for element selection in component tests

## Environment Variables

```env
ANTHROPIC_API_KEY=     # Claude API (required for LLM scoring)
GOOGLE_AI_API_KEY=     # Gemini fallback (optional)
ELEVENLABS_API_KEY_STT=    # STT realtime (required for speech-to-text)
MIRO_API_TOKEN=        # Fix board generation (Tier 1, optional)
```

## Implementation Phases (from PRD Section 16)

1. **Foundation** — Types, models, localStorage CRUD, API shells, mock analysis
2. **LLM Pipeline** — Claude client, prompts, analysisService, real scoring
3. **Frontend: Results + History** — Score components, results page, history wiring
4. **Frontend: Session Flow** — Mode picker, recorder, text input, step-based flow
5. **Polish + Tier 1** — Gemini fallback, ElevenLabs TTS, Miro boards, error UX

## Known Issues

- MediaStream not fully released on unmount (memory leak on nav away)
- Speech bubbles grow indefinitely in long sessions
- Orb state duplicated between useSessionState hook and ThemeProvider context
- Empty catch blocks suppress errors silently (`video.play().catch(() => {})`)
- Pages are monolithic (analytics: 667 lines, history: 597 lines) — extract sub-components
- Mock data scattered across page files — consolidate when wiring real data

## Do NOT

- Add auth/login — not in MVP scope
- Add real-time live feedback overlay while speaking — out of scope
- Add video-based body language scoring — out of scope
- Use default exports — project uses named exports only
- Skip `'use client'` on interactive components
- Break the `@/*` path alias convention
- Add dependencies without checking if the task can be done with existing stack
