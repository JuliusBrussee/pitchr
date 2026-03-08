---
phase: 05-public-ia-seo-foundation
plan: "01"
subsystem: ui
tags: [nextjs, react, app-router, seo, vitest]
requires:
  - phase: 04-feedback-ux
    provides: existing public landing route, brand language, and marketing section patterns
provides:
  - typed content definitions for the Lean Three public routes
  - a shared public-page shell with breadcrumbs, FAQ, and related-link modules
  - dedicated Delivery Rubric, Scoring Logic, and Growth Pricing App Router pages
  - route-first landing handoffs with crawlable blog, pricing, and launch teaser content
affects: [05-02 metadata foundations, 06-deep-dive-pages, public-marketing]
tech-stack:
  added: []
  patterns:
    - typed marketing content in TypeScript
    - shared server-rendered public route shell
    - vitest route regression coverage for public marketing pages
key-files:
  created:
    - content/publicPages.ts
    - views/components/public/PublicPageShell.tsx
    - views/components/public/PublicBreadcrumbs.tsx
    - views/components/public/PublicFaq.tsx
    - views/components/public/PublicRelatedLinks.tsx
    - app/(marketing)/delivery-rubric/page.tsx
    - app/(marketing)/scoring-logic/page.tsx
    - app/(marketing)/growth-pricing/page.tsx
  modified:
    - app/(marketing)/page.tsx
    - views/components/landing/LandingClient.tsx
    - views/components/landing/LaunchCountdown.tsx
    - tests/public-marketing-routes.test.tsx
    - docs/merge-conflict-log.md
key-decisions:
  - "Kept the Lean Three copy in a typed TypeScript module instead of adding MDX or CMS overhead in phase 5."
  - "Used one shared PublicPageShell so breadcrumbs, primer copy, FAQs, and related links stay consistent across all three routes."
  - "Fixed crawlability by removing `ssr: false` dependence from landing handoff sections and giving LaunchCountdown a server-stable initial render."
patterns-established:
  - "Public route ownership pattern: route page imports one typed content definition and renders it through the shared shell."
  - "Landing handoff pattern: navigation, footer, and story sections point to dedicated public routes instead of anchor-only ownership."
requirements-completed: [SURF-01, SURF-02, SURF-03, SURF-04]
duration: 11 min
completed: 2026-03-08
---

# Phase 05 Plan 01: Public Route Ownership Summary

**Typed public route content, a shared server-rendered shell, and route-first landing handoffs for Delivery Rubric, Scoring Logic, and Growth Pricing**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-08T20:00:00+01:00
- **Completed:** 2026-03-08T20:11:15+01:00
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Built a typed public-page content model that defines hero copy, explainer sections, breadcrumbs, FAQs, and related links for the Lean Three routes.
- Added a reusable public shell so every deep-dive route shares the same visible breadcrumb, answer-first primer, FAQ, and related-link structure.
- Shipped dedicated App Router pages and converted the landing hub to route-first handoffs with crawlable launch, pricing, and Journal teaser content.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the shared public-page content model and shell primitives** - `fea6b97` (test), `a0825d8` (feat)
2. **Task 2: Add dedicated public routes and route-first landing handoffs** - `97cc043` (test), `8e8c49a` (feat)

## Files Created/Modified

- `content/publicPages.ts` - Typed source of truth for the three public route definitions.
- `views/components/public/PublicPageShell.tsx` - Shared server-rendered shell used by all deep-dive pages.
- `views/components/public/PublicBreadcrumbs.tsx` - Visible breadcrumb UI for the public routes.
- `views/components/public/PublicFaq.tsx` - Shared FAQ or trust block section.
- `views/components/public/PublicRelatedLinks.tsx` - Shared related-link module connecting the route triad and Journal.
- `app/(marketing)/delivery-rubric/page.tsx` - Dedicated Delivery Rubric public route.
- `app/(marketing)/scoring-logic/page.tsx` - Dedicated Scoring Logic public route.
- `app/(marketing)/growth-pricing/page.tsx` - Dedicated Growth Pricing public route.
- `app/(marketing)/page.tsx` - Server landing route now seeds countdown markup for crawlable render output.
- `views/components/landing/LandingClient.tsx` - Public navigation, footer, and story sections now hand off to dedicated routes and render teaser sections without `ssr: false`.
- `views/components/landing/LaunchCountdown.tsx` - Countdown now renders stable initial HTML on the server and hydrates forward on the client.
- `tests/public-marketing-routes.test.tsx` - Regression coverage for typed route config, shared shell, route ownership, cross-links, and landing crawlability.
- `docs/merge-conflict-log.md` - Append-only note for the conflict-prone landing and marketing route edits.

## Decisions Made

- Kept route copy in `content/publicPages.ts` so landing handoffs, dedicated routes, and future metadata/schema work can all draw from one typed source.
- Reused the shared shell for all three route pages instead of building page-local shells, which keeps public IA consistent for Phase 5 and Phase 6.
- Solved the countdown crawlability gap by seeding initial launch time from the server page into the client countdown component instead of deferring all markup until hydration.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- A transient `.git/index.lock` warning appeared during staging, but the follow-up stage attempt succeeded without manual repository cleanup or code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 05-02 can build metadata, structured data, sitemap coverage, and breadcrumb schema directly on top of `content/publicPages.ts` and the three new public route files.
- The landing hub now hands visitors into dedicated routes with crawlable primer content, so the metadata/discoverability plan can focus on search and schema rather than route ownership.

## Self-Check: PASSED

- Verified summary file exists at `.planning/phases/05-public-ia-seo-foundation/05-public-ia-seo-foundation-01-SUMMARY.md`.
- Verified task commits `fea6b97`, `a0825d8`, `97cc043`, and `8e8c49a` exist in git history.
