<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-white.svg">
  <source media="(prefers-color-scheme: light)" srcset="public/logo-dark.svg">
  <img alt="Pitchr" src="public/logo.svg" width="220">
</picture>

### AI pitch coach for founders

Record or paste a pitch. Get an investor‑grade score out of 100, ranked fixes, a rewritten script, and delivery metrics — in under 30 seconds.

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL_v3-blue.svg)](./LICENSE)
[![CI](https://github.com/JuliusBrussee/pitchr/actions/workflows/ci.yml/badge.svg)](https://github.com/JuliusBrussee/pitchr/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase)](https://supabase.com/)
[![Claude](https://img.shields.io/badge/LLM-Claude_Sonnet_4.6-d97757)](https://www.anthropic.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[**Live demo**](https://pitchr.app) · [**Docs**](.planning/codebase/) · [**Contributing**](./CONTRIBUTING.md) · [**Security**](./SECURITY.md) · [**Report a bug**](https://github.com/JuliusBrussee/pitchr/issues/new)

</div>

---

## Why Pitchr

Most founders practice their pitch in a vacuum — no feedback until the live VC call, when it's too late. Pitchr closes the loop:

- **Investor‑grade rubric.** Same five categories a VC mentally tracks: structure, clarity, evidence, market, delivery.
- **Specific fixes, not vibes.** Ranked, citation‑backed suggestions tied to lines in your transcript.
- **A rewritten script.** Side‑by‑side diff against your own words — keep your voice, fix the gaps.
- **Delivery metrics.** WPM, filler‑word density, pause profile, energy curve.
- **Two modes.** *Elevator* (30–60s) and *VC pitch* (longer‑form deck + Q&A).

## Features

| | |
|---|---|
| **Audio + text input** | Browser recording (AssemblyAI live STT) or paste a transcript |
| **Deck‑aware scoring** | Upload a PDF deck; rubric evaluates coverage of slides |
| **Project memory** | Group runs by project, track score progression over time |
| **Q&A simulator** | ElevenLabs Conversational AI plays a skeptical VC; you respond live |
| **Ranked fixes** | Top‑N actionable edits with severity + estimated score lift |
| **Rewritten script** | Diff view — accept changes line‑by‑line |
| **Knowledge‑calibrated judge** | LLM judge grounded in a curated investor‑pitch corpus |
| **Billing built‑in** | Stripe Checkout + Portal, Free / Day Pass / Pro plans, usage‑metered |
| **Referrals** | Self‑serve codes, credit rewards, anti‑abuse caps |
| **Multi‑LLM** | Anthropic primary, OpenRouter fallback, cached sample if both fail |

## How it works

```
   ┌──────────┐   ┌──────────────┐   ┌──────────────────┐   ┌─────────────┐
   │ Recorder │ → │ STT          │ → │ Pitch‑run        │ → │ Judge       │
   │  / Text  │   │ (AssemblyAI) │   │ edge function    │   │ (Claude)    │
   └──────────┘   └──────────────┘   └────────┬─────────┘   └──────┬──────┘
                                              │                    │
                                              ▼                    ▼
                                     ┌─────────────────┐   ┌──────────────┐
                                     │ Supabase (runs, │   │ Scoring +    │
                                     │ decks, qna)     │   │ Rewrite      │
                                     └────────┬────────┘   └──────┬───────┘
                                              │                   │
                                              └──────► Results ◄──┘
```

**Data flow:** Page → Hook → Edge Function (or Next API route) → Service → LLM/Storage. Full diagram and component map in [`.planning/codebase/ARCHITECTURE.md`](.planning/codebase/ARCHITECTURE.md).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS 4, CSS variables for theming |
| LLM | Anthropic Claude `claude-sonnet-4-6` (primary), OpenRouter / Gemini (fallback) |
| Speech‑to‑text | AssemblyAI (live + upload) |
| Voice agent | ElevenLabs Conversational AI + TTS |
| Database | Supabase Postgres (RLS, edge functions) |
| Storage | Supabase Storage (recordings, decks) |
| Auth | Supabase Auth (email/password, OAuth ready) |
| Billing | Stripe Checkout + Portal + webhooks |
| Email | Resend |
| PDF | `@react-pdf/renderer`, `pdf-parse`, `pdfjs-dist` |
| Observability | Sentry, Vercel Analytics + Speed Insights |
| Testing | Vitest (unit), Playwright (E2E smoke) |
| Package manager | Yarn 4 (Berry) |

## Quick start

**Requirements:** Node 18+, Yarn 4, a Supabase project, an Anthropic key.

```bash
git clone https://github.com/JuliusBrussee/pitchr.git
cd pitchr
yarn install
cp .env.example .env.local        # fill required keys (see below)
yarn dev                          # http://localhost:3000
```

### Minimum env to boot

```env
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Full list with comments: [`.env.example`](.env.example).

### Optional integrations

| Feature | Env vars | What you lose without it |
|---|---|---|
| Live voice recording | `ASSEMBLYAI_API_KEY` | Audio input — text paste still works |
| VC Q&A simulator | `ELEVENLABS_API_KEY_CONVAI`, `ELEVENLABS_CONVAI_AGENT_ID` | Live Q&A mode |
| Coach voice feedback | `ELEVENLABS_API_KEY_TTS`, `ELEVENLABS_VOICE_ID` | TTS playback of suggestions |
| Paid plans | `STRIPE_*` keys + price IDs | Billing flows |
| Email (waitlist, unsub) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email |
| LLM fallback | `OPENROUTER_API_KEY` | Resilience when Anthropic is down |

## Database setup

1. Create a Supabase project. Copy URL + anon key + service role key into `.env.local`.
2. Run SQL migrations in numeric order:
   ```bash
   # Using Supabase CLI
   supabase db push
   # Or paste each file in migrations/*.sql into the SQL editor
   ```
3. Deploy edge functions with JWT verification disabled (relay JWTs use ES256):
   ```bash
   supabase functions deploy pitch-run --no-verify-jwt
   supabase functions deploy pitch-run-detail --no-verify-jwt
   # … repeat for each function in supabase/functions/
   ```
4. Create storage buckets `decks` and `recordings` (the migrations include policies but the buckets themselves are created in‑dashboard).

> **Heads‑up:** every edge function must be redeployed after any change to `supabase/functions/_shared/cors.ts` — CORS headers are bundled at deploy time.

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Dev server at `localhost:3000` |
| `yarn build` | Production build |
| `yarn build:claude` | Build into `.next-build` (doesn't clobber the dev server's `.next/`) |
| `yarn start` | Run production build |
| `yarn typecheck` | `tsc --noEmit` against `tsconfig.typecheck.json` |
| `yarn test` | Vitest unit + integration suite |
| `yarn test:watch` | Vitest watch mode |
| `yarn knowledge:refresh` | Snapshot curated sources + rebuild knowledge pack |
| `yarn rubric:sandbox` | Hand‑run the judge against a single pitch |
| `yarn rubric:matrix:anthropic` | Calibrate weights across the rubric matrix |
| `yarn calibrate:weights` | Refit scoring weights from the matrix |

## Project layout

```
app/                  Next.js routes (UI + API handlers)
  (app)/              Authenticated product surface
  (marketing)/        Public marketing pages
  (auth)/             Sign in / sign up
  api/                Route handlers (billing, arena, profile, referral…)
views/components/     React UI components
hooks/                Client hooks (usePitchRun, useSTT, useBilling…)
services/             Business logic (analysis, scoring, deck, billing)
controllers/          API validation + orchestration
models/               Schemas + storage adapters
lib/
  llm/                Provider router (Anthropic, OpenRouter)
  prompts/            Prompt templates
  supabase/           Client/server/admin singletons, middleware, fetchEdge
config/               Modes, rubric, billing, referral configuration
types/                Shared TypeScript contracts
migrations/           Supabase SQL migrations (run numerically)
supabase/functions/   Supabase edge functions (run lifecycle, decks, Q&A)
knowledge/            Curated investor‑pitch corpus for the judge
docs/                 Long‑form architecture + ops notes
tests/                Vitest + Playwright suites
```

## Deployment

Pitchr is designed to ship on **Vercel** (Next) + **Supabase** (DB + edge functions). The `vercel.json` and edge function configs in‑repo are sufficient for a one‑click deploy. Other Node hosts work, but you'll wire the edge runtime yourself.

Production checklist:

- [ ] All env vars from `.env.example` set in your host
- [ ] SQL migrations applied
- [ ] Edge functions deployed with `--no-verify-jwt`
- [ ] Stripe webhook endpoint pointed at `/api/billing/webhook`
- [ ] Sentry DSN set (`SENTRY_DSN`) — optional but recommended
- [ ] `APP_BASE_URL` matches your deployed origin (used in email links)

## Testing

```bash
yarn test                                   # Vitest, one‑shot
yarn test:watch                             # watch
yarn typecheck                              # strict type pass
yarn playwright test tests/e2e/smoke.spec.ts   # E2E smoke
```

CI runs typecheck + unit + Playwright smoke on every PR. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Roadmap

Tracked in [`.planning/ROADMAP.md`](.planning/ROADMAP.md). Headline items:

- More rubric calibration data + open eval set
- Self‑hosted STT option (Whisper) so the app boots with zero third‑party keys
- Mobile capture flow
- Public API for embedding pitch scoring in other apps

Out of scope (by design):

- Live feedback overlay during recording
- Video / body‑language scoring
- Investor matching, CRM, dataroom features

## Contributing

PRs welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening one — short version:

1. Open an issue first for non‑trivial changes so we can scope together.
2. Branch from `main` (`feat/…`, `fix/…`, `docs/…`).
3. `yarn test && yarn typecheck` locally.
4. Conventional Commits in the subject; clear PR description with screenshots for UI changes.

Good first issues are tagged [`good first issue`](https://github.com/JuliusBrussee/pitchr/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).

## Security

Report vulnerabilities privately — **do not** open public issues. See [SECURITY.md](./SECURITY.md). Email `security@pitchr.app` or use a [GitHub Security Advisory](https://github.com/JuliusBrussee/pitchr/security/advisories/new).

## Community & support

- **Bugs / features:** [GitHub Issues](https://github.com/JuliusBrussee/pitchr/issues)
- **Questions / ideas:** [GitHub Discussions](https://github.com/JuliusBrussee/pitchr/discussions)
- **Security:** security@pitchr.app

## License

Pitchr is licensed under the [**GNU AGPL v3.0 or later**](./LICENSE).

> If you deploy a modified version of Pitchr as a network service, you must offer the corresponding source to your users. Commercial licensing without this requirement is available — open an issue or reach out via `security@pitchr.app`.

## Acknowledgements

Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Anthropic Claude](https://www.anthropic.com/), [AssemblyAI](https://www.assemblyai.com/), [ElevenLabs](https://elevenlabs.io/), [Stripe](https://stripe.com/), [Tailwind CSS](https://tailwindcss.com/), and dozens of other open‑source projects listed in `package.json`. Huge thanks to all of them.

<div align="center">

If Pitchr helped you raise — or avoid a bad pitch — **drop a ⭐ on the repo**. It's the only thing that moves discovery.

</div>
