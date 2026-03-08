# Architecture Research

**Domain:** Pitchr v1.1 public growth surfaces inside an existing Next.js App Router product
**Researched:** 2026-03-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
+----------------------------------------------------------------------------------+
| Existing root and product layers                                                 |
| app/layout.tsx (existing) + app/(app)/* (unchanged authenticated product)        |
+--------------------------------------+-------------------------------------------+
                                       |
                                       v
+----------------------------------------------------------------------------------+
| app/(marketing) route group (modified existing, indexable public surfaces)       |
| - landing hub                                                                    |
| - delivery rubric page (new)                                                     |
| - growth pricing page (new)                                                      |
| - scoring logic page (new)                                                       |
| - blog / Journal pages (modified existing)                                       |
+-----------------------------+-------------------------------+----------------------+
                              |                               |
                              v                               v
+------------------------------------------+   +-----------------------------------+
| Server composition layer (new)           |   | Client enhancement layer (new)    |
| page.tsx + generateMetadata + schema     |   | GSAP scenes, pricing toggle,      |
| builders + content loader                |   | CTA tracking, reveal wrappers      |
+-----------------------------+------------+   +-------------------+---------------+
                              |                                    |
                              v                                    v
+----------------------------------------------------------------------------------+
| Content and config boundary                                                      |
| content/marketing/*.mdx (new long-form copy)                                    |
| content/blog/*.mdx (existing Journal source)                                    |
| config/billing*.ts and config/rubric.ts (existing typed facts)                  |
+----------------------------------------------------------------------------------+
                              |
                              v
+----------------------------------------------------------------------------------+
| Output controls                                                                   |
| Static HTML, JSON-LD, sitemap, robots, OG images, consent-gated analytics        |
+----------------------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/(marketing)/layout.tsx` (modified) | Shared marketing shell, nav/footer, shared CTA affordances, marketing-only wrappers | Server layout with only leaf client toggles |
| `app/(marketing)/page.tsx` (modified) | Landing hub that links into deep-dive pages and reuses shared sections | Server page composed from content sections plus small client islands |
| `app/(marketing)/(growth)/*/page.tsx` (new) | Indexable deep-dive route entry points for Delivery Rubric, Growth Pricing, and Scoring Logic | Server pages with static rendering and `generateMetadata` |
| `app/(marketing)/blog/page.tsx` and `app/(marketing)/blog/[slug]/page.tsx` (modified existing) | Journal surface and editorial detail pages | Keep static MDX-backed rendering; align design system rather than replacing content pipeline |
| `views/components/marketing/*` (new) | Shared page shell, CTA blocks, FAQ, proof strips, semantic content sections | Mostly Server Components with narrow props |
| `views/components/marketing/motion/*` (new) | Optional motion scenes and reveal wrappers | Client components that lazy-load GSAP and expose reduced-motion fallbacks |
| `content/marketing/*.mdx` (new) | Canonical explanatory copy for deep-dive pages | Repo-local MDX with typed frontmatter and structured headings |
| `content/blog/*.mdx` and `lib/blog.ts` (existing) | Canonical Journal content source | Static MDX loader already proven in this repo |
| `config/billing.ts`, `config/billing-features.ts`, `config/rubric.ts` (existing) | Pricing numbers, plan rules, rubric definitions, scoring facts | Typed config imported on the server, never duplicated in prose |
| `views/components/AnalyticsScripts.tsx` and web vitals reporter (modified/new) | Consent-gated analytics bootstrapping and public-surface event capture | Small client boundary loaded after consent |

## Recommended Project Structure

```text
app/
|-- (marketing)/
|   |-- layout.tsx                           # modified: shared marketing shell
|   |-- page.tsx                             # modified: landing hub, server-first
|   |-- about/page.tsx                       # existing
|   |-- privacy/page.tsx                     # existing
|   |-- terms/page.tsx                       # existing
|   |-- (growth)/
|   |   |-- delivery-rubric/page.tsx         # new
|   |   |-- growth-pricing/page.tsx          # new
|   |   |-- scoring-logic/page.tsx           # new
|   |-- blog/page.tsx                        # modified existing Journal hub
|   |-- blog/[slug]/page.tsx                 # modified existing Journal detail
|-- sitemap.ts                               # modified: add new public URLs
|-- robots.ts                                # modified: allow new public URLs, keep app private

content/
|-- marketing/
|   |-- delivery-rubric.mdx                  # new: long-form surface copy
|   |-- growth-pricing.mdx                   # new
|   |-- scoring-logic.mdx                    # new
|   |-- shared/
|   |   |-- glossary.mdx                     # optional: reused GEO-friendly definitions
|-- blog/                                    # existing Journal content

lib/
|-- marketing/
|   |-- surfaces.ts                          # new: route registry, labels, CTAs, related links
|   |-- content.ts                           # new: MDX loader + frontmatter validation
|   |-- metadata.ts                          # new: canonical, OG, robots builders
|   |-- schema.ts                            # new: FAQ, breadcrumb, software schemas
|   |-- tracking.ts                          # new: typed public analytics events
|-- blog.ts                                  # existing

views/components/
|-- marketing/
|   |-- shell/
|   |   |-- MarketingHeader.tsx              # new
|   |   |-- MarketingFooter.tsx              # new
|   |   |-- SignupCta.tsx                    # new: primary free-signup CTA
|   |-- sections/
|   |   |-- SurfaceHero.tsx                  # new
|   |   |-- ProblemSolutionSection.tsx       # new
|   |   |-- ProofSection.tsx                 # new
|   |   |-- FAQSection.tsx                   # new
|   |   |-- ComparisonTable.tsx              # new
|   |-- motion/
|   |   |-- MotionScene.tsx                  # new client boundary
|   |   |-- useMotionPreference.ts           # new reduced-motion + device gate
|   |   |-- scenes/                          # new page-specific GSAP scenes
|-- landing/
|   |-- LandingClient.tsx                    # modified: reduce to page-specific hero glue only
|   |-- LandingBlog.tsx                      # modified: render server-first, animate as enhancement
|   |-- LandingPricing.tsx                   # modified: client leaf for pricing toggle only
```

### Structure Rationale

- **Keep indexable growth pages in `app/(marketing)`, not `app/(public)`.** In this repo, `(public)` currently means flows like `/try`, and `app/robots.ts` already blocks `/try` from indexing. Mixing SEO pages into that group will create avoidable robots and routing confusion.
- **Use local MDX for long-form explanatory pages.** The repo already has a working MDX content pipeline for the Journal in `content/blog` and `lib/blog.ts`. For v1.1, local MDX is a better fit than a CMS because the copy is tightly coupled to product logic, structured data, and versioned engineering releases.
- **Keep facts in typed config, not in prose.** Pricing, plan limits, and rubric dimensions already live in `config/billing.ts`, `config/billing-features.ts`, and `config/rubric.ts`. Public pages should derive tables and proof strips from those files so the numbers cannot drift.
- **Create a dedicated `lib/marketing` layer.** Metadata, schema, route registry, and content loading should be centralized so each new public page is mostly content and composition, not repeated SEO boilerplate.
- **Move motion into an explicit enhancement layer.** The current landing page packs a large amount of logic into `views/components/landing/LandingClient.tsx`. For v1.1, animation code should live under `views/components/marketing/motion/*`, loaded only when needed.

## Architectural Patterns

### Pattern 1: Server-First Route Entries

**What:** Every indexable public page is a Server Component route entry that renders content, metadata, and schema before any client JS runs.
**When to use:** All landing and deep-dive pages under `app/(marketing)`.
**Trade-offs:** Requires pushing interaction down into leaf client components, but it produces better HTML output, smaller bundles, and cleaner SEO boundaries.

**Example:**
```typescript
import { buildMarketingMetadata, getMarketingSurface } from '@/lib/marketing';
import { MarketingSurfacePage } from '@/views/components/marketing/MarketingSurfacePage';

export const dynamic = 'force-static';

export async function generateMetadata() {
  return buildMarketingMetadata('delivery-rubric');
}

export default async function DeliveryRubricPage() {
  const surface = await getMarketingSurface('delivery-rubric');
  return <MarketingSurfacePage surface={surface} />;
}
```

### Pattern 2: Content and Facts Merge on the Server

**What:** Narrative copy lives in MDX, while live product facts come from typed config. The page loader combines them into one view model before render.
**When to use:** Pricing and scoring pages where explanatory text must stay in sync with actual product behavior.
**Trade-offs:** Slightly more loader code, but far less drift than duplicating limits, prices, or rubric labels inside markdown.

**Example:**
```typescript
import { BILLING_PLANS, CREDIT_PACKS_STATIC } from '@/config/billing';
import { SPOKEN_RUBRIC_CATEGORIES } from '@/config/rubric';
import { loadSurfaceContent } from '@/lib/marketing/content';

export async function getMarketingSurface(slug: MarketingSurfaceSlug) {
  const page = await loadSurfaceContent(slug);

  return {
    ...page,
    pricingModel: buildPricingModel(BILLING_PLANS, CREDIT_PACKS_STATIC),
    rubricModel: buildRubricModel(SPOKEN_RUBRIC_CATEGORIES),
  };
}
```

### Pattern 3: Progressive Motion Islands

**What:** Motion is optional enhancement, not the page architecture. Semantic HTML renders first, then a client-only motion wrapper upgrades specific sections when the device and motion preferences allow it.
**When to use:** Hero scenes, scroll narratives, pricing comparisons, and lightweight reveal effects.
**Trade-offs:** Adds one more component boundary, but prevents page-wide `'use client'` sprawl and keeps GSAP off routes that do not need it.

**Example:**
```typescript
'use client';

import { useEffect } from 'react';
import { useMotionPreference } from '@/views/components/marketing/motion/useMotionPreference';

export function MotionScene({ scene, children }: {
  scene: 'delivery-rubric' | 'growth-pricing' | 'scoring-logic';
  children: React.ReactNode;
}) {
  const motion = useMotionPreference();

  useEffect(() => {
    if (motion !== 'full') return;

    let cleanup = () => {};
    void import(`./scenes/${scene}`).then((module) => {
      cleanup = module.mount();
    });

    return () => cleanup();
  }, [motion, scene]);

  return <>{children}</>;
}
```

## Data Flow

### Request Flow

```text
[GET /delivery-rubric]
    ->
[app/(marketing)/(growth)/delivery-rubric/page.tsx]
    ->
[lib/marketing/content.ts loads MDX + lib/marketing/surfaces.ts resolves config]
    ->
[merge with config/rubric.ts or config/billing.ts data]
    ->
[generateMetadata + JSON-LD + static HTML]
    ->
[hydrate only CTA, pricing toggle, theme toggle, and motion islands]
```

### State Management

```text
[Server content model]
    -> [page props]
    -> [server sections]

[Client islands]
    -> [local state only: pricing interval, motion enabled, CTA clicks]
    -> [/signup or /api/waitlist when user acts]

[Consent preference]
    -> [AnalyticsScripts + web vitals reporter]
    -> [GA only after opt-in]
```

### Key Data Flows

1. **Long-form content flow:** `content/marketing/*.mdx` -> `lib/marketing/content.ts` -> server-rendered page sections.
2. **Pricing truth flow:** `config/billing.ts` and `config/billing-features.ts` -> derived comparison cards and pricing tables on server render.
3. **Scoring truth flow:** `config/rubric.ts` -> scoring logic and delivery rubric visual models on server render.
4. **Journal continuity flow:** `content/blog/*.mdx` -> `lib/blog.ts` -> existing `app/(marketing)/blog/*` routes, restyled to match the v1.1 design system.
5. **Conversion flow:** shared CTA component -> existing `/signup?redirectTo=...` for primary conversion, with `/api/waitlist` reserved for newsletter or launch-interest capture only.

## Build Order and Dependencies

1. **Establish route and shell boundaries**
   - Modify `app/(marketing)/layout.tsx` to own the public shell, shared nav/footer, and route-level marketing wrappers.
   - Keep `app/(app)` and `app/(public)` unchanged.
   - Dependency: none.

2. **Create the content and metadata contract**
   - Add `content/marketing/*`, `lib/marketing/content.ts`, `lib/marketing/metadata.ts`, and `lib/marketing/schema.ts`.
   - Decide canonical slug policy up front. Keep `/blog` as the canonical Journal URL in this milestone unless there is an explicit redirect plan.
   - Dependency: step 1.

3. **Decompose the current landing implementation**
   - Split `views/components/landing/LandingClient.tsx` so SEO text, Journal previews, and pricing copy render on the server.
   - Keep only narrow client islands for theme toggle, pricing interval toggle, and high-end hero motion.
   - Dependency: step 2.

4. **Ship static deep-dive pages before adding motion**
   - Build Delivery Rubric, Growth Pricing, and Scoring Logic pages with complete copy, metadata, and CTA behavior first.
   - Dependency: step 2.

5. **Add shared motion boundaries and page-specific scenes**
   - Introduce `views/components/marketing/motion/*` and move GSAP logic there.
   - Lazy-load motion code and gate it behind reduced-motion and device-capability checks.
   - Dependency: step 4.

6. **Harden SEO, GEO, and analytics**
   - Update `app/sitemap.ts`, `app/robots.ts`, page-level JSON-LD, OG images, breadcrumb schema, and analytics event typing.
   - Add `useReportWebVitals` reporting for public surfaces only after consent.
   - Dependency: step 4.

7. **Add regression coverage**
   - Add metadata tests, sitemap coverage tests, reduced-motion checks, and one public-surface accessibility smoke path.
   - Dependency: steps 3 through 6.

### Build-Order Implications for Roadmap

- **Do not build page-specific motion before the shared motion boundary exists.** Otherwise every page will reinvent GSAP setup, reduced-motion handling, and cleanup logic.
- **Do not launch duplicate `/blog` and `/journal` URLs in the same milestone without a redirect and canonical strategy.** That is pure SEO churn.
- **Do not keep waitlist as the default CTA on new pages if the milestone goal is free-tier signup conversion.** The primary CTA should point to the existing signup flow, with waitlist treated as secondary.
- **Do not leave pricing and rubric facts inside prose-only content.** Those values already have typed sources of truth in the repo.

## Performance and SEO Technical Controls

- **Keep public pages static.** Use static rendering for public surfaces and avoid request-time data fetching for content that already lives in the repo.
- **Do not put indexable copy behind `ssr: false`.** The current landing imports `LandingBlog` and `LandingPricing` with `ssr: false`; v1.1 should not repeat that pattern for SEO-critical sections.
- **Hydrate only leaves.** The page shell, headings, schema, FAQ, proof tables, and comparison copy should remain server-rendered HTML.
- **Load motion libraries on demand.** GSAP and ScrollTrigger should be dynamically imported inside motion islands, not pulled into every public route bundle.
- **Use `next/image` with explicit `sizes` for hero and Journal media.** The repo already does this in several places and the new pages should follow it consistently.
- **Move font loading to `next/font` if marketing typography evolves.** The current root layout uses a Google Fonts `<link>`. If typography changes for public pages, shift to Next font optimization rather than adding more render-blocking font requests.
- **Centralize metadata generation.** Titles, descriptions, canonicals, OG images, and structured data should be built from `lib/marketing/metadata.ts` and `lib/marketing/schema.ts`, not handwritten per route.
- **Update the global search surfaces.** `app/sitemap.ts` must include new public URLs and `app/robots.ts` must continue to disallow private app areas such as `/dashboard`, `/session`, `/results`, and `/try`.
- **Prefer LLM-readable structure.** Each page should include a short answer-first explanation, semantic headings, FAQ content where appropriate, and explicit product terminology that matches user search intent.

## Accessibility Constraints for Motion-Heavy UI

- **Respect `prefers-reduced-motion` first.** Motion scenes must render a complete static fallback and avoid pinning or scroll-jacking when reduced motion is requested.
- **Listen for preference changes, not just initial page load.** Motion preference is a live accessibility signal.
- **Do not make motion the only source of meaning.** Charts, score shifts, rubric transitions, and pricing comparisons need text equivalents in the DOM.
- **Preserve DOM reading order.** Screen readers and keyboard users should encounter content in the same order even when the visual layout becomes a scroll narrative.
- **Keep focus behavior boring.** Pinned scenes, overlays, or animated CTA bars cannot trap focus or move focus unexpectedly.
- **Ensure keyboard access for interactive controls.** Pricing interval toggles, comparison tabs, and any scene controls must be standard buttons or links with visible focus styles.
- **Provide a low-motion path for reveal effects.** Simple opacity transitions are acceptable; large transforms, parallax, and autoplay loops are not.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5 public surfaces | Local MDX + typed config + static page routes is the correct architecture |
| 5-20 public surfaces | Add section schemas, frontmatter validation, and a stronger related-content registry in `lib/marketing/surfaces.ts` |
| 20+ surfaces or non-engineer editors | Keep the route and metadata layer stable, but replace the loader behind `lib/marketing/content.ts` with a CMS adapter |

### Scaling Priorities

1. **First bottleneck:** client bundle size from motion libraries and rich visuals. Fix by isolating motion islands and keeping content server-first.
2. **Second bottleneck:** content drift between prose and typed product facts. Fix by deriving page tables and summary callouts from existing config files.

## Anti-Patterns

### Anti-Pattern 1: Putting SEO Pages in `app/(public)`

**What people do:** Add indexable pages beside `/try` because they are also "public."
**Why it's wrong:** In this repo, `(public)` already maps to a non-indexable conversion surface and `robots.ts` blocks `/try`. Indexable growth content belongs in `(marketing)`.
**Do this instead:** Keep all crawlable public pages under `app/(marketing)` and reserve `(public)` for non-indexed interactive funnels.

### Anti-Pattern 2: Monolithic `'use client'` Marketing Pages

**What people do:** Put the entire page, including copy, nav, FAQ, pricing text, and schema-adjacent markup, into one client component.
**Why it's wrong:** It increases bundle size, weakens SEO output, and turns simple content changes into risky JS changes.
**Do this instead:** Render semantic content on the server and isolate only the interactive or animated fragments.

### Anti-Pattern 3: Duplicating Product Facts in Markdown

**What people do:** Hardcode plan prices, usage limits, and rubric labels directly inside page prose.
**Why it's wrong:** Pricing and scoring copy will drift from the real product configuration.
**Do this instead:** Keep prose in MDX, but build fact tables and repeated labels from `config/billing*.ts` and `config/rubric.ts`.

### Anti-Pattern 4: Scroll Scenes That Own Document Structure

**What people do:** Let a GSAP timeline dictate layout, focus behavior, and content visibility for the entire page.
**Why it's wrong:** It produces brittle maintenance, poor accessibility, and hard-to-debug regressions.
**Do this instead:** Keep motion as enhancement around already-correct HTML sections.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Analytics / gtag | Existing `AnalyticsScripts` plus typed public-page event helpers | Keep consent gate; use `afterInteractive` only after opt-in |
| Supabase Auth | Reuse existing `/signup` and `/auth/callback` flow | New public pages should drive primary CTA traffic here |
| Waitlist pipeline | Reuse `/api/waitlist` only for newsletter or launch-interest capture | Do not make this the default conversion target if free signup is available |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/(marketing)` routes <-> `lib/marketing/*` | Server imports | Central place for route metadata, schema, and content composition |
| `lib/marketing/content.ts` <-> `content/marketing/*.mdx` | File-system loader | Easy to swap for CMS later without changing route files |
| Growth Pricing page <-> `config/billing.ts` and `config/billing-features.ts` | Server imports | Single source of truth for plans, credits, and feature lists |
| Delivery Rubric / Scoring Logic pages <-> `config/rubric.ts` | Server imports | Reuse real rubric labels, weights, and stage expectations |
| Landing hub <-> `views/components/landing/*` and `views/components/marketing/*` | Component composition | Existing landing pieces should be decomposed, not duplicated |
| Public analytics layer <-> consent storage and web vitals reporter | Client events | Keep all public-surface instrumentation behind the same consent check already used by `AnalyticsScripts` |

## Sources

- `.planning/PROJECT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `app/layout.tsx`
- `app/(marketing)/layout.tsx`
- `app/(marketing)/page.tsx`
- `app/(marketing)/blog/page.tsx`
- `app/(marketing)/blog/[slug]/page.tsx`
- `app/(public)/try/page.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `views/components/landing/LandingClient.tsx`
- `views/components/landing/LandingBlog.tsx`
- `views/components/landing/LandingPricing.tsx`
- `views/components/landing/useHeroDeliveryFunnel.ts`
- `views/components/AnalyticsScripts.tsx`
- `views/components/seo/HomeJsonLd.tsx`
- `lib/blog.ts`
- `config/billing.ts`
- `config/billing-features.ts`
- `config/rubric.ts`
- `app/api/waitlist/route.ts`
- `app/(auth)/signup/page.tsx`
- `docs/seo.md`
- Next.js Route Groups: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Next.js Public Pages guide: https://nextjs.org/docs/app/guides/public-pages
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js MDX guide: https://nextjs.org/docs/app/guides/mdx
- Next.js Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Next.js JSON-LD guide: https://nextjs.org/docs/app/guides/json-ld
- Next.js Font optimization: https://nextjs.org/docs/app/getting-started/fonts
- Next.js Script guide: https://nextjs.org/docs/app/guides/scripts
- Next.js `useReportWebVitals`: https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals
- web.dev `prefers-reduced-motion`: https://web.dev/prefers-reduced-motion/
- WCAG 2.1 Understanding 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html

---
*Architecture research for: Pitchr v1.1 public growth surfaces*
*Researched: 2026-03-08*
