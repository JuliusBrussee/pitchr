# Project Research Summary

**Project:** Pitchr: Project-Specific Rubric Context
**Domain:** Public deep-dive growth pages, Journal alignment, premium motion design, and SEO/GEO discoverability for an existing Next.js product
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

This milestone is not a rebrand and not a generic "make the landing page nicer" effort. It is a brownfield growth expansion inside an existing Next.js App Router product. The correct move is to keep Pitchr's landing page as a hub, then build a small set of dedicated public deep-dive pages that each own one clear user intent: Delivery Rubric, Growth Pricing, Scoring Logic, and Journal support content. Those pages should educate, prove trust, and convert directly to free signup.

Research points to one consistent architecture choice: server-first public pages with narrow client islands for motion and interactive demos. The repo already has the right baseline for this. The main technical debt today is that the landing page is still one large client component and some SEO-relevant sections are disabled for SSR. The priority is to separate crawlable content from motion, not to add more visual complexity on top of the current structure.

The biggest risk is building something that looks premium but performs poorly, explains too little, or sends visitors into the wrong CTA flow. Notion is useful here as a pattern reference, not a template: it feels fast because it serves meaningful HTML first, aggressively caches hashed assets, preloads only critical media, and uses demos as support for the story rather than as a replacement for text.

## Key Findings

### Recommended Stack

Stay inside the current stack. Next.js 15, React 19, local MDX, the existing blog pipeline, GSAP, metadata builders, JSON-LD, and `next/image` are enough to ship this milestone without bringing in a new CMS or animation framework. The right design choice is not "which new tool do we need"; it is "where do we stop hydrating content that should be static HTML."

**Core technologies:**
- Next.js App Router: static public routes, metadata, sitemap, and robots control
- React 19: selective hydration and composable route sections
- Local MDX plus `gray-matter` and `next-mdx-remote`: long-form product pages and Journal content
- GSAP: premium motion inside isolated client islands
- Next metadata, JSON-LD, `next/image`, and `next/font`: SEO/GEO structure and performance primitives

### Expected Features

The must-have set is clear: one hub-and-spoke IA, one strong deep page per core intent, answer-first HTML copy, proof and FAQ blocks, repeated free-signup CTA, and a crawlable content cluster linking Journal, Pricing, Delivery Rubric, and Scoring Logic together. The strongest differentiators are not "more animation"; they are interactive scored examples, methodology transparency, and concrete before/after comparisons that show why Pitchr is better than generic feedback.

**Must have (table stakes):**
- Dedicated public deep-dive pages with unique slugs, titles, H1s, and internal links
- Answer-first hero, how-it-works section, trust or FAQ block, and repeated free-signup CTA on every page
- Crawlable SEO and GEO baseline: HTML-first copy, sitemap inclusion, canonicals, breadcrumbs, and matching structured data
- Journal support content linked directly into product pages

**Should have (competitive):**
- Interactive scored example or rubric simulator
- Citation-backed methodology blocks on Scoring Logic and Delivery Rubric pages
- Intent-aware CTA copy and deep-link routing into signup

**Defer (v2+):**
- Broad long-tail page expansion
- CMS migration
- Site-wide 3D or WebGL presentation system

### Architecture Approach

The recommended architecture keeps all indexable growth pages under `app/(marketing)`, reuses `/blog` as the underlying Journal route, loads content from local MDX, and pushes motion into explicit client enhancement boundaries. That gives Pitchr the right tradeoff: strong HTML output, low operational overhead, and enough room to build ambitious motion without repeating the current monolithic landing-page pattern.

**Major components:**
1. `app/(marketing)` public route layer - landing hub, deep-dive pages, blog routes, sitemap, and robots
2. `lib/marketing/*` content and metadata layer - route registry, content loader, schema builders, and CTA/related-link configuration
3. `views/components/marketing/*` section system - reusable heroes, proof blocks, FAQs, comparison modules, and signup CTAs
4. `views/components/marketing/motion/*` client enhancement layer - GSAP scenes, reduced-motion handling, and page-specific animations

### Critical Pitfalls

1. **Client-only SEO regressions** - keep core public copy server-rendered and visible in source HTML
2. **Motion harming Core Web Vitals** - isolate motion, lazy-load it, and keep poster or HTML fallbacks
3. **Deep pages with no unique intent** - assign one clear question and answer per page
4. **Wrong CTA path** - route deep-page traffic to free signup, not legacy waitlist flows
5. **Journal/blog authority split** - keep one canonical editorial route and align branding around it

## Implications for Roadmap

Based on research, this milestone should start at **Phase 5**, because the current roadmap's highest existing phase is 4.

### Phase 5: Public IA and SEO Foundation
**Rationale:** The page structure, route ownership, metadata strategy, and server-first rendering model must be fixed before any premium visuals are added.
**Delivers:** Marketing route boundaries, deep-page slug plan, metadata/schema builders, sitemap/robots updates, and decomposition of SEO-critical content out of the monolithic landing client.
**Addresses:** hub-and-spoke IA, crawlability, entity framing, and unique page intent
**Avoids:** client-only SEO regressions and duplicated intent pages

### Phase 6: Deep-Dive Pages and Content System
**Rationale:** Once the route and metadata contract exist, Pitchr can build the real content surfaces without drift.
**Delivers:** Delivery Rubric, Growth Pricing, and Scoring Logic pages; Journal alignment via the existing `/blog` pipeline; shared section components; content sourced from MDX and typed config
**Uses:** local MDX, existing `lib/blog.ts`, billing config, rubric config
**Implements:** content and facts merge pattern

### Phase 7: Motion, Demos, and Brand System
**Rationale:** Motion should enhance already-correct pages, not define them.
**Delivers:** shared motion boundary, page-specific scroll scenes, annotated demos, scored examples, and reduced-motion fallbacks
**Addresses:** the user's visual ambition without sacrificing legibility or accessibility
**Avoids:** performance collapse and "beautiful but vague" storytelling

### Phase 8: Conversion and Discoverability Hardening
**Rationale:** The final stage should focus on funnel quality and search/LLM discoverability after the content surfaces exist.
**Delivers:** free-signup CTA routing, attribution, analytics hardening, public web-vitals checks, proof or FAQ refinement, and validation of crawl/index behavior
**Addresses:** signup conversion, GEO readiness, and page cluster authority
**Avoids:** earning traffic that still drops into the wrong flow

### Phase Ordering Rationale

- Phase 5 comes first because public IA and crawlable rendering are structural decisions, not polish decisions.
- Phase 6 follows because content and product facts need a stable route, metadata, and section contract.
- Phase 7 comes after that so motion enhances an already-sound page system instead of defining it.
- Phase 8 closes the loop with conversion and discoverability validation, which only makes sense once the pages exist.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 7:** precise motion budget and visual implementation details if a 3D hero or more advanced graphics are considered
- **Phase 8:** conversion instrumentation details and how signup context should be preserved

Phases with standard patterns (skip research-phase):
- **Phase 5:** route groups, metadata, sitemap, and robots work are well-documented
- **Phase 6:** local MDX content architecture and typed config integration are already established in this repo

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Strongly grounded in the current repo and official Next.js patterns |
| Features | HIGH | User intent is clear and matches strong public-page patterns in comparable product-led sites |
| Architecture | HIGH | Directly grounded in existing `app/(marketing)`, blog pipeline, and landing implementation |
| Pitfalls | HIGH | Risks are concrete, repo-specific, and already visible in the current landing structure |

**Overall confidence:** HIGH

### Gaps to Address

- Decide whether the public brand label remains `Journal` in UI while the canonical route stays `/blog`
- Decide whether the first interactive demo should live on Delivery Rubric or Scoring Logic
- Decide how much motion budget is acceptable on mobile before degrading to static or low-motion versions

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md`
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `app/(marketing)/page.tsx`
- `views/components/landing/LandingClient.tsx`
- `lib/blog.ts`
- `app/sitemap.ts`
- `app/robots.ts`

### Secondary (MEDIUM confidence)
- `docs/seo.md`
- Direct inspection of `https://www.notion.com/` on 2026-03-08 via Playwright and response-header analysis
- Google Search Central, helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central, AI features: https://developers.google.com/search/docs/appearance/ai-features

### Tertiary (LOW confidence)
- Pattern comparison against public product pages from Notion, Figma, and Stripe for interaction and page-structure ideas

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
