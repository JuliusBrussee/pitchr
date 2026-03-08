# Pitfalls Research

**Domain:** Pitchr v1.1 public growth surfaces, motion-heavy marketing pages, and SEO/GEO discoverability in an existing Next.js app
**Researched:** 2026-03-08
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: SEO-Critical Copy Hidden Behind Client-Only Components

**What goes wrong:**
Public pages look impressive in the browser but ship weak HTML, thin source content, or delayed copy because core sections only exist after hydration.

**Why it happens:**
Teams treat the landing page like an app experience and put heroes, pricing, blog previews, and demos inside large `'use client'` trees.

**How to avoid:**
Render route entries, headings, explanations, FAQs, proof blocks, and CTA copy on the server. Limit client code to motion, toggles, and optional demo controls.

**Warning signs:**
- Source HTML is thin compared to what users see after load
- `dynamic(..., { ssr: false })` is used for SEO-critical sections
- Lighthouse shows large JS cost before content becomes useful

**Phase to address:**
Phase 5 - Public IA and SEO Foundation

---

### Pitfall 2: Motion That Makes the Site Feel Slower Than It Looks

**What goes wrong:**
Scroll scenes, oversized media, or full-page animation layers hurt LCP, INP, mobile smoothness, and battery use.

**Why it happens:**
Premium motion is added everywhere instead of being isolated to a few high-value moments with strong fallbacks.

**How to avoid:**
Use a shared motion boundary, lazy-load GSAP scenes, preload only key hero assets, and keep static poster or HTML fallbacks for every animated block.

**Warning signs:**
- Large client bundles pulled into every public route
- Janky scroll on mid-tier laptops or mobile devices
- Core Web Vitals regress after adding "brand" motion

**Phase to address:**
Phase 7 - Motion, Demos, and Brand System

---

### Pitfall 3: Deep Pages That Are Just Pretty Forks of the Landing Page

**What goes wrong:**
Each new page repeats generic brand language and visual motifs but fails to own a distinct user intent, so search and LLM discoverability stay weak.

**Why it happens:**
Teams start from design comps instead of defining the question each page must answer.

**How to avoid:**
Assign one primary intent per page, make the title/H1/opening answer explicit, and build a tight internal link network across Delivery Rubric, Growth Pricing, Journal, and Scoring Logic.

**Warning signs:**
- Multiple pages compete for the same keyword or topic
- Page openings sound interchangeable
- Internal links are decorative rather than topical

**Phase to address:**
Phase 5 - Public IA and SEO Foundation

---

### Pitfall 4: Wrong Conversion Path for the Traffic You Earn

**What goes wrong:**
Visitors arrive on a strong product page, then hit a waitlist or generic CTA flow that discards the intent that brought them there.

**Why it happens:**
The existing marketing surface is still optimized for pre-launch waitlist behavior while the new milestone is supposed to drive free signup.

**How to avoid:**
Make free signup the primary CTA on all new deep pages, keep page-specific CTA copy, and preserve context into the signup experience.

**Warning signs:**
- Waitlist appears as the main CTA on problem-intent pages
- CTA copy is identical across every page
- No attribution or deep-link logic distinguishes which public page converted the user

**Phase to address:**
Phase 8 - Conversion and Discoverability Hardening

---

### Pitfall 5: Journal and Product Pages Splitting Authority Instead of Compounding It

**What goes wrong:**
`Journal` is introduced as a concept, but the codebase still uses `/blog`, leading to naming drift, duplicate content risk, and weak internal linking.

**Why it happens:**
Brand language evolves faster than route design, and teams create new routes without a redirect/canonical plan.

**How to avoid:**
Keep the existing `/blog` content pipeline for this milestone, surface it as Journal in the UI if desired, and decide on any URL migration before building duplicate paths.

**Warning signs:**
- Both `/blog` and `/journal` exist with overlapping content
- Canonical strategy is unclear
- The Journal is visually separate from product deep-dive pages

**Phase to address:**
Phase 6 - Deep-Dive Pages and Content System

---

### Pitfall 6: Marketing Claims Drift From Real Product Logic

**What goes wrong:**
Pricing, scoring dimensions, rubric terminology, or free-plan limits on public pages stop matching the actual application.

**Why it happens:**
Teams hardcode facts inside page prose or Figma-derived copy instead of deriving them from the same config the product uses.

**How to avoid:**
Use typed billing and rubric config as the source of truth for public tables, proof strips, and repeated labels.

**Warning signs:**
- Pricing page copy conflicts with the app
- Scoring Logic page describes dimensions that no longer exist
- Updating product rules requires manual copy sweeps

**Phase to address:**
Phase 6 - Deep-Dive Pages and Content System

---

### Pitfall 7: Demos That Look Premium but Explain Nothing

**What goes wrong:**
Visitors remember the animation but still cannot tell how Pitchr scores a pitch, what changes between takes, or why they should trust the output.

**Why it happens:**
Teams optimize for brand spectacle rather than product legibility, especially when inspired by sites like Notion without adapting the pattern to their own product logic.

**How to avoid:**
Anchor every demo in one concrete narrative: input, scoring process, output, and user outcome. Use examples, annotations, and before/after comparisons.

**Warning signs:**
- Reviewers say "this looks cool" but cannot explain the feature back to you
- The demo has no visible labels or narrative
- Most meaning is inside motion rather than surrounding text

**Phase to address:**
Phase 7 - Motion, Demos, and Brand System

---

### Pitfall 8: Accessibility Regressions From Pinned or Scroll-Driven Scenes

**What goes wrong:**
Reduced-motion users, keyboard users, and screen readers have a worse experience because motion scenes control layout or meaning.

**Why it happens:**
Animation is treated as a layout system instead of an enhancement layer.

**How to avoid:**
Respect `prefers-reduced-motion`, preserve DOM order, ensure focus is never trapped by scenes, and provide text equivalents for every important visual.

**Warning signs:**
- Pinned scenes trap scroll or focus
- Content appears only once an animation plays
- Keyboard navigation becomes confusing inside visual sections

**Phase to address:**
Phase 7 - Motion, Demos, and Brand System

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep adding sections to `LandingClient.tsx` | Fastest way to ship visuals | Turns public SEO, motion, and content into one brittle client bundle | Never for this milestone |
| Hardcode pricing or rubric facts in prose | Quick copy iteration | Public pages drift from product truth | Never |
| Build one-off motion per page with no shared utilities | Faster first prototype | Cleanup, reduced-motion handling, and performance tuning become duplicated | Only for a throwaway exploration branch |
| Create `/journal` alongside `/blog` without migration plan | Fast brand rename | Duplicate content and canonical confusion | Never |
| Lead with waitlist because it already exists | Lowest implementation cost | Wastes problem-intent traffic that should convert to free signup | Only on pages that are explicitly prelaunch |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Next metadata + JSON-LD | Hand-authoring metadata per route | Centralize builders in `lib/marketing/*` so titles, canonicals, and schema stay consistent |
| Existing blog pipeline | Replacing it for style reasons | Reuse `content/blog` and `lib/blog.ts`, then restyle the presentation layer |
| Existing signup flow | Sending deep-page traffic to generic or waitlist endpoints | Route primary CTA to the existing signup path and preserve page context |
| Existing billing and rubric config | Duplicating facts in MDX | Import config on the server and derive comparison or explainer blocks from it |
| GSAP in App Router | Importing motion code at route top level | Dynamically import motion scenes inside client islands only |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Hydrating the full landing and all deep pages | Slow TTI, large JS, weak mobile performance | Server-render most sections and hydrate only leaves | Usually visible immediately on mid-range mobile |
| Autoplaying too many rich media elements | High bandwidth use and scroll jank | Use poster-first media, preload only the main hero, and keep other demos metadata-only until needed | Breaks once multiple demo sections stack on one page |
| Full-page WebGL or 3D defaults | Battery drain, GPU pressure, weak accessibility | Reserve 3D for one isolated scene at most | Breaks on lower-end laptops and most phones |
| Unbounded animation timelines | Memory leaks and broken navigation | Create shared mount/unmount patterns and cleanup hooks | Shows up after route transitions and repeated visits |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing internal product details in public schema or demo data | Information disclosure or misleading public claims | Publish only user-facing facts and sanitized sample data |
| Tracking public-page behavior without honoring consent | Compliance and trust risk | Keep analytics behind the existing consent gate |
| Embedding third-party demos or media without control | Performance and privacy regressions | Prefer hosted assets you control and sanitize any embeds |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Beautiful but vague" hero sections | Users do not understand what Pitchr actually does | State the problem, user, and outcome in the first screen |
| Pricing pages that feel detached from product value | Visitors compare numbers before understanding why to care | Tie Growth Pricing directly to saved time, score improvement, and free-plan entry |
| Journal content that reads like standalone thought pieces | Weak product relevance and weaker conversion | Link articles back to concrete product pages and scoring logic |
| Overcomplicated scroll storytelling | Users lose place and miss the CTA | Use 1-2 memorable animated moments per page, not constant motion |

## "Looks Done But Isn't" Checklist

- [ ] **Deep-dive pages:** Source HTML contains the core explanation, not just shells and placeholders
- [ ] **Motion system:** Reduced-motion mode is tested and legible, not merely disabled
- [ ] **Conversion flow:** Primary CTA routes to free signup, not legacy waitlist
- [ ] **Journal alignment:** `/blog` branding, links, sitemap, and metadata match the public IA decision
- [ ] **SEO/GEO:** Canonical tags, sitemap entries, breadcrumbs, and visible entity framing are present on every new page
- [ ] **Demo blocks:** Every visualization has labels, surrounding context, and a static fallback

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Client-only SEO regressions | MEDIUM | Move critical sections back to server render, rebuild metadata, and rerun source HTML checks |
| Motion-induced performance drop | MEDIUM | Disable the heaviest scenes, lazy-load motion, compress assets, and retest Core Web Vitals |
| Wrong CTA strategy | LOW | Swap CTA targets and copy, then preserve page attribution into signup |
| Journal/blog authority split | MEDIUM | Consolidate routes, add redirects/canonicals, and repair internal links |
| Demo spectacle with weak clarity | LOW | Add annotated explanations, labels, and before/after states without rebuilding the whole page |
| Accessibility regressions | HIGH | Remove or simplify the offending scene, restore semantic structure, and retest keyboard and reduced-motion paths |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SEO-critical copy hidden in client-only components | Phase 5 | View-source and rendered HTML show meaningful page copy |
| Motion harming performance | Phase 7 | Lighthouse and manual device checks stay within target CWV budgets |
| Deep pages with no distinct intent | Phase 5 | Each page has a unique title, H1, opening answer, and internal-link role |
| Wrong conversion path | Phase 8 | Primary CTA on each page routes to free signup and preserves intent context |
| Journal/blog authority split | Phase 6 | Only one canonical content path exists for editorial content |
| Marketing claims drifting from product truth | Phase 6 | Public facts are derived from typed config, not duplicated manually |
| Demos that explain nothing | Phase 7 | Reviewers can describe the feature and value after seeing the page once |
| Accessibility regressions from scenes | Phase 7 | Reduced-motion, keyboard, and screen-reader paths remain usable |

## Sources

- `.planning/PROJECT.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `app/(marketing)/page.tsx`
- `views/components/landing/LandingClient.tsx`
- `lib/blog.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- `docs/seo.md`
- Next.js App Router docs: https://nextjs.org/docs/app
- Google Search Central, helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central, AI features: https://developers.google.com/search/docs/appearance/ai-features
- Direct inspection of `https://www.notion.com/` on 2026-03-08 via Playwright and response-header analysis

---
*Pitfalls research for: Pitchr v1.1 public growth surfaces*
*Researched: 2026-03-08*
