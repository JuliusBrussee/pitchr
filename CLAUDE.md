# Pitchr — Claude Code Instructions

AI pitch coach: record/paste a pitch, get investor-grade score (/100), ranked fixes, rewritten script, and delivery metrics. See `PRD.md` for full spec.

## Quick Reference

- **Detailed docs:** `.planning/codebase/` — ARCHITECTURE.md, STACK.md, STRUCTURE.md, CONVENTIONS.md, INTEGRATIONS.md, TESTING.md, CONCERNS.md
- **Always use `yarn`** — never `npm`

```bash
yarn dev          # localhost:3000
yarn build:claude # Production build (uses .next-build dir, won't break dev server)
yarn test         # Vitest
yarn test:watch   # Watch mode
```

## Architecture (summary)

MVC adapted for Next.js App Router. See `.planning/codebase/ARCHITECTURE.md` for full details.

```
Views:       app/(app)/ + views/components/    (React UI)
Controllers: app/api/                          (HTTP orchestration)
Services:    services/                         (business logic, LLM)
Models:      models/                           (schemas, localStorage)
```

Data flow: Page -> Hook -> API route -> Service -> LLM/Storage

## Code Conventions (summary)

See `.planning/codebase/CONVENTIONS.md` for full details.

- PascalCase components, `use` prefix hooks, UPPER_SNAKE constants, `is` prefix booleans
- Named exports only, `'use client'` on interactive components
- `@/*` path alias for all non-relative imports
- `import type` for type-only imports
- 2-space indent, semicolons, single quotes (double in JSX)
- Tailwind for layout, CSS variables for theming (`--bg-primary`, `--bg-surface`, etc.)
- Accent colors: coral/orange (`#ff5941`, `#ffaa33`, `#e63b26`)

## Key Data Types

```typescript
type PitchMode = 'elevator' | 'vc_pitch'
type InputType = 'audio' | 'text'
type RubricCategory = 'structure' | 'clarity' | 'evidence' | 'market' | 'delivery'
```

Full schemas: `types/` directory and `PRD.md` sections 7, 11.

## Integrations (summary)

See `.planning/codebase/INTEGRATIONS.md` for full details.

- **LLM:** Claude (`claude-sonnet-4-6`, temp 0.3) primary, Gemini fallback, cached sample if both fail
- **Database:** Supabase (Postgres + Storage), client singleton at `lib/supabase.ts`
- **Billing:** Stripe Checkout + Portal. Config in `config/billing.ts`. Plans: Free / Day Pass / Pro
- **Edge Functions:** `supabase/functions/` — deploy with `--no-verify-jwt`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=              # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Supabase anon key
ANTHROPIC_API_KEY=                     # Claude API (required)
GOOGLE_AI_API_KEY=                     # Gemini fallback (optional)
ASSEMBLYAI_API_KEY=                     # Speech-to-text (optional)
STRIPE_SECRET_KEY=                     # Stripe secret key
STRIPE_WEBHOOK_SECRET=                 # Stripe webhook signing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=    # Stripe client-side key
STRIPE_DAY_PASS_PRICE_ID=             # Stripe Price ID
STRIPE_PRO_MONTHLY_PRICE_ID=          # Stripe Price ID
STRIPE_PRO_YEARLY_PRICE_ID=           # Stripe Price ID
BILLING_DEV_USER_IDS=                  # Dev bypass (comma-separated)
```

## Do NOT

- Add auth/login, live feedback overlay, or video body language scoring (out of scope)
- Use default exports, skip `'use client'`, break `@/*` alias, use `npm`
- Add dependencies without checking if existing stack suffices
