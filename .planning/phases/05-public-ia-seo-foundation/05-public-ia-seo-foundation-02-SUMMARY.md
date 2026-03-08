---
phase: 05-public-ia-seo-foundation
plan: "02"
subsystem: seo
tags: [nextjs, seo, jsonld, sitemap, playwright]
requires:
  - phase: 05-public-ia-seo-foundation
    provides: dedicated Lean Three public routes, shared public shell, and landing handoffs from plan 05-01
provides:
  - shared site URL and canonical helpers for public metadata, schema, and sitemap generation
  - unique metadata and breadcrumb JSON-LD for Delivery Rubric, Scoring Logic, and Growth Pricing
  - sitemap coverage and Playwright smoke verification for the public deep-dive route cluster
affects: [06-deep-dive-pages, 08-conversion-discoverability-hardening, public-marketing]
tech-stack:
  added: []
  patterns:
    - shared public metadata helper built from typed route content
    - breadcrumb UI and JSON-LD generated from one route definition
    - vitest plus playwright discoverability regression coverage
key-files:
  created:
    - lib/site.ts
    - lib/metadata/publicPageMetadata.ts
    - tests/e2e/public-marketing.spec.ts
  modified:
    - app/(marketing)/delivery-rubric/page.tsx
    - app/(marketing)/scoring-logic/page.tsx
    - app/(marketing)/growth-pricing/page.tsx
    - views/components/public/PublicPageShell.tsx
    - views/components/seo/HomeJsonLd.tsx
    - app/sitemap.ts
    - playwright.config.ts
    - tests/public-seo-foundations.test.ts
    - docs/merge-conflict-log.md
key-decisions:
  - "Used shared site and metadata helpers so canonical URLs, OG/Twitter data, JSON-LD, and sitemap entries resolve from one public base URL source."
  - "Rendered breadcrumb JSON-LD from PublicPageShell using the same breadcrumb arrays that drive the visible UI."
  - "Standardized Playwright public smoke runs on `yarn dev` and covered both landing handoffs and Journal routing."
patterns-established:
  - "Public SEO pattern: route pages export generateMetadata from typed page definitions instead of duplicating page-local SEO objects."
  - "Discoverability regression pattern: validate metadata and sitemap in Vitest, then verify public navigation with a focused Playwright smoke spec."
requirements-completed: [DISC-01]
duration: 5 min
completed: 2026-03-08
---

# Phase 05 Plan 02: Public SEO Foundation Summary

**Shared canonical metadata helpers, breadcrumb JSON-LD, sitemap expansion, and browser smoke coverage for the Lean Three public routes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T20:19:58+01:00
- **Completed:** 2026-03-08T20:25:15+01:00
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added `lib/site.ts` and `lib/metadata/publicPageMetadata.ts` so public route metadata, breadcrumb schema, and canonical URL generation share one base URL source.
- Wired Delivery Rubric, Scoring Logic, and Growth Pricing to export unique metadata and emit breadcrumb JSON-LD from the same breadcrumb definitions shown in the UI.
- Expanded sitemap coverage for the deep-dive routes and added both Vitest and Playwright regression coverage for public discoverability-critical behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize public-page metadata, canonical URLs, and breadcrumb schema** - `990cf73` (test), `1675b04` (feat)
2. **Task 2: Expand sitemap coverage and add public-route smoke verification** - `e49a2c6` (test), `d157022` (feat)

## Files Created/Modified

- `lib/site.ts` - Shared site URL, canonical URL, and public-route sitemap definitions.
- `lib/metadata/publicPageMetadata.ts` - Shared metadata and breadcrumb JSON-LD builders for public routes.
- `app/(marketing)/delivery-rubric/page.tsx` - Delivery Rubric route metadata now comes from the shared helper.
- `app/(marketing)/scoring-logic/page.tsx` - Scoring Logic route metadata now comes from the shared helper.
- `app/(marketing)/growth-pricing/page.tsx` - Growth Pricing route metadata now comes from the shared helper.
- `views/components/public/PublicPageShell.tsx` - Emits breadcrumb schema from the same typed breadcrumb source used by the UI.
- `views/components/seo/HomeJsonLd.tsx` - Home JSON-LD now resolves URLs from the shared site helper.
- `app/sitemap.ts` - Static public-route entries and blog entries now build from the shared route and canonical helpers.
- `playwright.config.ts` - Public smoke tests now boot the repo-standard `yarn dev` server command.
- `tests/public-seo-foundations.test.ts` - Regression coverage for metadata uniqueness, breadcrumb/schema alignment, shared base URL behavior, sitemap inclusion, and Playwright server config.
- `tests/e2e/public-marketing.spec.ts` - Browser smoke flow for landing handoffs, breadcrumbs, and Journal routing.
- `docs/merge-conflict-log.md` - Append-only integration note for shared sitemap and Playwright changes.

## Decisions Made

- Switched the three deep-dive pages to `generateMetadata` helpers so canonical URL resolution stays tied to `NEXT_PUBLIC_APP_URL` without duplicating metadata objects across routes.
- Kept breadcrumb schema generation inside `PublicPageShell` so the UI trail and the `BreadcrumbList` JSON-LD cannot drift independently.
- Defined public-route sitemap entries in `lib/site.ts` rather than scattering static route lists across metadata and test code.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The breadcrumb regression initially queried page titles globally and matched related-link cards as well; scoping the assertion to the breadcrumb nav fixed the test without changing product behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 is now complete: the public route cluster has route ownership, unique metadata, breadcrumb schema, sitemap coverage, and browser smoke verification.
- Phase 6 can focus on deeper content and internal-link storytelling rather than SEO plumbing or crawlability gaps.

## Self-Check: PASSED

- Verified summary file exists at `.planning/phases/05-public-ia-seo-foundation/05-public-ia-seo-foundation-02-SUMMARY.md`.
- Verified task commits `990cf73`, `1675b04`, `e49a2c6`, and `d157022` exist in git history.
