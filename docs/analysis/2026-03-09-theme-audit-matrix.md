# Theme Audit Matrix (2026-03-09)

## Scope
- Landing hero light-mode contrast fix validation (`before`/`after` screenshots).
- Authenticated light/dark route traversal for app surfaces.
- Unauthenticated redirect verification cross-check (baseline `.playwright-theme-scan/theme-metrics.jsonl`).

## Artifacts
- Baseline hero screenshots:
  - `.playwright-theme-scan/hero-contrast-baseline/landing-hero-before-light.png`
  - `.playwright-theme-scan/hero-contrast-baseline/landing-hero-before-dark.png`
- Updated hero screenshots:
  - `.playwright-theme-scan/hero-contrast-after/landing-hero-after-light.png`
  - `.playwright-theme-scan/hero-contrast-after/landing-hero-after-dark.png`
- Authenticated route screenshots:
  - `.playwright-theme-scan-auth/protected-shots/`
- Authenticated route metrics:
  - `.playwright-theme-scan-auth/protected-theme-metrics.json`

## Landing Hero Contrast (Light Mode)
- Right-side hero luminance (presenter zone) changed from `238.71` to `223.58` (`-6.34%`).
- Same zone saturation changed from `0.1215` to `0.1718` (`+41.38%`).
- Dark mode right-side hero luminance stayed unchanged (`32.92` -> `32.92`, `0.00%`).

Interpretation: the presenter sits on a darker, less washed-out light background while dark mode remains effectively unchanged.

## Protected/App Route Matrix
| Route | Unauth (light) | Auth light | Auth dark | Note |
|---|---|---|---|---|
| /dashboard | /login?redirectTo=%2Fdashboard | /dashboard | /dashboard | Auth gate verified |
| /demo | /login?redirectTo=%2Fdemo | /demo | /demo | Auth gate verified |
| /setup | /login | /setup | /setup | Runtime redirect when unauthenticated |
| /upload | /upload | /upload | /upload | Public/non-gated route |
| /session | /login?redirectTo=%2Fsession | /session | /session/select-project?returnTo=/session | Theme-run divergence from state (project selection state) |
| /session/select-project | /login?redirectTo=%2Fsession%2Fselect-project | /session/select-project | /session/select-project | Auth gate verified |
| /arena | /arena | /arena | /arena | Public/non-gated route |
| /arena/challenge/1 | /arena/challenge/1 | /arena/challenge/1 | /arena/challenge/1 | Public/non-gated route |
| /arena/game-mode | /arena/game-mode | /arena/game-mode | /arena/game-mode | Public/non-gated route |
| /arena/leaderboard | /arena/leaderboard | /arena/leaderboard | /arena/leaderboard | Public/non-gated route |
| /compliance/check | /login?redirectTo=%2Fcompliance%2Fcheck | /dashboard | /dashboard | Authenticated user not compliance-gated in this profile/locale |
| /analytics | /login?redirectTo=%2Fanalytics | /analytics | /analytics | Auth gate verified |
| /history | /login?redirectTo=%2Fhistory | /history | /history | Auth gate verified |
| /projects | /login?redirectTo=%2Fprojects | /projects | /projects | Auth gate verified |
| /projects/1 | /login?redirectTo=%2Fprojects%2F1 | /projects | /projects/1 | Theme-run divergence from state (project existence/loading) |
| /qa/00000000-0000-0000-0000-000000000000 | /login?redirectTo=%2Fqa%2F00000000-0000-0000-0000-000000000000 | /qa/00000000-0000-0000-0000-000000000000 | /qa/00000000-0000-0000-0000-000000000000 | Auth gate verified |
| /results/00000000-0000-0000-0000-000000000000 | /login?redirectTo=%2Fresults%2F00000000-0000-0000-0000-000000000000 | /results/00000000-0000-0000-0000-000000000000 | /results/00000000-0000-0000-0000-000000000000 | Auth gate verified |
| /review/00000000-0000-0000-0000-000000000000 | /login?redirectTo=%2Freview%2F00000000-0000-0000-0000-000000000000 | /review/00000000-0000-0000-0000-000000000000 | /review/00000000-0000-0000-0000-000000000000 | Auth gate verified |
| /orb-preview | /orb-preview | /orb-preview | /orb-preview | Public/non-gated route |
| /progress | /progress | /progress | /progress | Public/non-gated route |
| /settings | /login?redirectTo=%2Fsettings | /settings | /settings | Auth gate verified |

## Theme Inconsistency Findings
- Fixed: `/demo` is no longer hardcoded dark (`h1` color now follows theme tokens: light `rgb(17, 24, 39)`, dark `rgb(237, 237, 236)`).
- Fixed: `/orb-preview` controls panel now uses theme tokens (light/dark screenshot panel luminance delta: `153.02`).
- Remaining state-dependent route variance:
  - `/session` (dark run routed to `/session/select-project?returnTo=/session`).
  - `/projects/1` (light run resolved to `/projects`, dark stayed on `/projects/1`).
  - These look data/state-driven rather than pure theme-token issues.

## Prioritized Follow-Ups (Quick Wins First)
1. Stabilize route state before screenshot assertions (`/session`, `/projects/1`) by seeding deterministic project/session fixtures.
2. Keep replacing hardcoded non-token utility colors in shared components (especially `text-white`, `bg-black`, `text-neutral-*`) where they represent surface/foreground colors instead of brand accents.
3. Add an automated theme parity check for critical routes (`/`, `/dashboard`, `/session`, `/results/:id`, `/demo`, `/orb-preview`) to catch regressions in CI.
