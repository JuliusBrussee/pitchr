# Pitchr

> AI pitch coach for founders. Record or paste a pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![CI](https://github.com/JuliusBrussee/pitchr/actions/workflows/ci.yml/badge.svg)](https://github.com/JuliusBrussee/pitchr/actions/workflows/ci.yml)

Pitchr scores a pitch on five rubric categories — structure, clarity, evidence, market, delivery — and returns ranked fixes plus a rewritten script. It supports two modes:

- **Elevator** — 30–60 second pitches.
- **VC pitch** — longer-form decks and Q&A.

## Stack

- **Frontend**: Next.js App Router, React 19, Tailwind 4
- **LLM**: Anthropic Claude (default), OpenRouter fallback
- **STT**: AssemblyAI (live + upload)
- **Persistence**: Supabase Postgres + Storage
- **Billing**: Stripe Checkout + Portal

Full architecture: [`.planning/codebase/ARCHITECTURE.md`](.planning/codebase/ARCHITECTURE.md).

## Quick Start

```bash
git clone https://github.com/JuliusBrussee/pitchr.git
cd pitchr
yarn install
cp .env.example .env.local   # fill required keys
yarn dev                     # http://localhost:3000
```

Minimum env vars to boot:

```env
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

See [`.env.example`](.env.example) for the full list.

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Start dev server at localhost:3000 |
| `yarn build` | Production build |
| `yarn start` | Run production build |
| `yarn test` | Run Vitest unit tests |
| `yarn test:watch` | Vitest watch mode |
| `yarn typecheck` | `tsc --noEmit` |

## Database Setup

Run the SQL files in `migrations/` (numerically ordered) against your Supabase project, then deploy the edge functions in `supabase/functions/` with `--no-verify-jwt`.

## Project Layout

```
app/                  Next.js routes (UI + API)
views/components/     React UI components
hooks/                Client hooks
services/             Business logic (analysis, scoring, deck, run)
controllers/          API request validation/orchestration
lib/                  LLM router, prompts, helpers
config/               Modes, rubric, sample fallback
types/                Shared TypeScript contracts
migrations/           Supabase SQL migrations
supabase/functions/   Supabase edge functions
docs/landing/         Static landing page (served via GitHub Pages)
```

## Contributing

We welcome PRs. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening one.

## Security

Found a vulnerability? See [SECURITY.md](./SECURITY.md). Please do not file public issues for security reports.

## License

Pitchr is licensed under the [GNU AGPL v3.0 or later](./LICENSE). If you deploy a modified version as a network service, you must offer the corresponding source code to your users.
