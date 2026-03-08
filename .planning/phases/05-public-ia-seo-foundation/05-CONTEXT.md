# Phase 5: Public IA and SEO Foundation - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Pitchr's public marketing routes server-first, crawlable, and structurally ready for dedicated Delivery Rubric, Scoring Logic, and Growth Pricing pages. This phase clarifies route ownership, crawlable content shape, metadata/link foundations, and the public information architecture. It does not add new public surfaces beyond the Lean Three or expand into later conversion, demo, or motion scope.

</domain>

<decisions>
## Implementation Decisions

### Route ownership and public shell
- The landing page remains the public hub and keeps its fuller narrative sections rather than collapsing to teaser cards only.
- Public navigation becomes route-first once the new pages exist. Delivery Rubric, Scoring Logic, and Growth Pricing should be first-class destinations instead of living only as in-page anchors on the landing page.
- Each dedicated route should own a distinct visitor question or intent, even if the landing page still repeats some broader product story.
- The three new routes should share one common public-page shell in phase 5, with route-specific bodies inside that shell.

### Page depth and crawlable content
- Each new route should ship as a solid server-rendered primer in phase 5, not as a thin bridge page.
- The opening of each route should feel story-first and cinematic, but the page still needs to resolve its main question quickly in visible HTML.
- Copy should be rewritten per route rather than copied wholesale from the landing page. Core product claims stay aligned, but each route should speak in its own language for its own intent.
- Every route should use a common scaffold: opening story/answer block, main explainer sections, a small FAQ or trust block, and onward links.

### Public link cluster and breadcrumbs
- The landing page should hand visitors from the relevant story sections into the dedicated routes from within the narrative itself.
- Do not use the literal phrase "go deeper" in those handoff links.
- The three dedicated pages should cross-link to one another as a connected triad, not as isolated standalone pages.
- `/blog` should participate as a two-way part of the cluster: deep pages point to relevant Journal articles, and Journal articles point back to the most relevant deep page.
- Dedicated pages should show visible breadcrumbs in the UI and mirror that hierarchy in metadata/schema.

### Claude's Discretion
- Exact handoff link wording, as long as it avoids the phrase "go deeper"
- Exact balance of duplicated home-page narrative versus route-specific rewrites
- Exact breadcrumb styling, related-pages module design, and how cinematic the story-first openings feel
- Exact metadata titles, descriptions, and breadcrumb labels, as long as they reinforce the route's distinct intent

</decisions>

<specifics>
## Specific Ideas

- The landing page can stay broad and narrative-heavy, but the dedicated routes should sharpen the specific question each page answers.
- The deep pages should not read like dry reference docs even though they need answerable, crawlable structure.
- The handoff from the landing page into dedicated routes should feel natural inside the story sections rather than bolted on as a separate card grid.
- `/blog` remains the canonical editorial route even if the UI frames it as Journal.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(marketing)/page.tsx` plus `views/components/seo/HomeJsonLd.tsx`: existing home-route pattern for server-rendered route setup plus page-local JSON-LD
- `views/components/landing/LandingBlog.tsx`, `views/components/landing/LandingPricing.tsx`, and `views/components/landing/LaunchCountdown.tsx`: existing public marketing sections that can inform route handoffs or shared section patterns
- `views/components/blog/BlogCard.tsx`, `views/components/blog/BlogHero.tsx`, `views/components/blog/TableOfContents.tsx`, and `views/components/blog/ReadingProgress.tsx`: reusable editorial modules for Journal integration
- `lib/blog.ts`, `content/blog/*`, `types/blog.ts`, and `lib/blogAuthors.ts`: current content and metadata pipeline for `/blog`
- `app/sitemap.ts` and `app/robots.ts`: current sitemap and crawl-control foundations

### Established Patterns
- The landing route is server-rendered at `app/(marketing)/page.tsx`, but most of the meaningful homepage narrative currently lives in the client component `views/components/landing/LandingClient.tsx`.
- Several landing sections are currently client-only islands loaded with `ssr: false`, which is a direct crawlability constraint for phase 5.
- `app/(marketing)/about/page.tsx` and `app/(marketing)/blog/[slug]/page.tsx` show the current pattern for canonical metadata and page-local JSON-LD.
- `app/(marketing)/blog/page.tsx` and the landing page already establish a hub-and-spoke public model where `/blog` is the canonical editorial route.
- There is no shared public marketing shell yet. `app/(marketing)/layout.tsx` and `app/(public)/layout.tsx` are pass-through wrappers, and public pages currently build shells locally.
- Base URL handling is inconsistent today: `app/layout.tsx` uses `NEXT_PUBLIC_APP_URL`, while sitemap and some JSON-LD implementations hardcode `https://pitchr.live`.

### Integration Points
- New public routes should live under `app/(marketing)` alongside the existing marketing pages.
- Shared public shell, breadcrumb, and metadata helpers will likely need new shared modules because these patterns are currently duplicated or page-local.
- Journal integration can reuse the existing `lib/blog.ts` content pipeline and blog card/hero components.
- Existing landing navigation and footer patterns in `views/components/landing/LandingClient.tsx` provide the immediate public IA handoff points.
- Existing auth already supports `redirectTo` in `/signup`, but conversion-specific handoff behavior belongs to a later phase rather than being finalized here.

</code_context>

<deferred>
## Deferred Ideas

- Full long-form deep-dive storytelling and reusable section systems beyond the phase 5 primer level - Phase 6
- Shared motion system work and flagship interactive scoring demo - Phase 7
- Conversion-specific CTA routing, attribution, and page-specific signup optimization - Phase 8
- Any `/blog` to `/journal` route migration or alias rollout - future work only

</deferred>

---

*Phase: 05-public-ia-seo-foundation*
*Context gathered: 2026-03-08*
