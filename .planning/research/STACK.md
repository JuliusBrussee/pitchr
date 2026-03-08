# Stack Research

**Domain:** Pitchr v1.1 public growth surfaces with motion-rich marketing pages, deep-dive product content, and SEO/GEO discoverability
**Researched:** 2026-03-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js App Router | `^15.0.3` | Static public routes, metadata, sitemap, robots, and route composition | Already the repo standard and the best fit for server-first marketing pages with selective client enhancement. |
| React | `^19.0.0` | UI composition and selective hydration | Already in use. Lets indexable content stay HTML-first while interactivity stays scoped to leaf components. |
| Local MDX + `gray-matter` + `next-mdx-remote` | `gray-matter ^4.0.3`, `next-mdx-remote ^6.0.0` | Long-form product pages and Journal content | Reuses the existing blog pipeline instead of adding a new CMS or content system for this milestone. |
| GSAP | `^3.14.2` | Scroll scenes, hero motion, and timeline-driven visual storytelling | Already installed. Strongest option in this repo for premium motion when isolated to client islands instead of page-wide orchestration. |
| Next metadata, JSON-LD, `next/image`, `next/font` | built-in | SEO, GEO, image optimization, and font loading | These are the right primitives for public pages because they improve crawlability and performance without extra infrastructure. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `rehype-slug` | `^6.0.0` | Heading anchors for long-form pages | Use on Scoring Logic and Journal pages where deep linking to sections improves scanning and citations. |
| `rehype-autolink-headings` | `^7.1.0` | Clickable heading anchors | Use with slugs for long-form content that should be easy to reference internally and externally. |
| `@sentry/nextjs` | `^10.40.0` | Runtime monitoring | Use for public-surface regressions, especially after adding heavier media and motion. |
| `@playwright/test` | `^1.58.2` | End-to-end regression coverage | Use for public route smoke tests, metadata assertions, reduced-motion paths, and CTA routing. |
| `vitest` + Testing Library | `^4.0.18`, `^16.3.2` | Component and rendering tests | Use for metadata builders, schema generation, route composition, and critical marketing sections. |
| `@react-three/fiber` + `three` | `^9.5.0`, `^0.169.0` | Optional high-end graphics only | Use only if one hero scene truly needs 3D. Do not make this the default visual system for all public pages. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Lighthouse / PageSpeed Insights | Verify Core Web Vitals and page quality | Treat these as release gates for motion-heavy public pages. |
| Playwright | Verify no-login public routes end to end | Include tests for visible HTML copy, CTA links, reduced motion, and mobile layout. |
| Existing `docs/seo.md` process | Manual SEO verification checklist | Extend it to cover the new deep-dive routes, sitemap entries, canonicals, and schema. |

## Installation

```bash
# Core
npm install next react react-dom gsap gray-matter next-mdx-remote

# Supporting
npm install @sentry/nextjs rehype-slug rehype-autolink-headings

# Dev dependencies
npm install -D @playwright/test vitest @testing-library/react @testing-library/jest-dom
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GSAP for premium scroll scenes | Framer Motion | Use Framer Motion only for simpler section reveals or if page-level timelines are removed from scope. |
| Local MDX in repo | Headless CMS | Use a CMS only when non-engineers need frequent publishing across many growth pages. Not justified for this milestone. |
| Static App Router pages | Dynamic request-time rendering | Use dynamic rendering only if page content depends on live personalized data, which these public pages should not. |
| Existing `/blog` pipeline as Journal | New `/journal` system from scratch | Use a new route only if you commit to redirects and canonical migration. Otherwise keep `/blog` and brand it as Journal in UI copy. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| One giant `'use client'` landing page for all public content | Hurts crawlability, bundle size, and maintainability | Server-first route entries with small client islands for motion and toggles |
| Canvas-only or video-only explanation of scoring logic | Hides meaning from crawlers, LLMs, and assistive tech | Semantic HTML copy with animation as reinforcement |
| Net-new CMS or animation framework for v1.1 | Adds migration and maintenance cost without solving the current bottleneck | Reuse local MDX and existing GSAP |
| Site-wide R3F or WebGL as the default presentation layer | High performance risk for mobile and Core Web Vitals | Use 2D CSS/SVG/GSAP by default, with one isolated 3D scene at most |
| Waitlist-only conversion on deep product pages | Conflicts with the stated goal of free-signup conversion | Primary CTA should route to existing signup or trial flow |

## Stack Patterns by Variant

**If a page is mostly explanatory and search-driven:**
- Use a static Server Component route under `app/(marketing)`
- Keep all primary claims in HTML text
- Add metadata, JSON-LD, breadcrumbs, and internal links on the server

**If a page needs premium motion:**
- Keep the route server-first
- Mount GSAP in a lazy-loaded client island
- Gate complex motion behind `prefers-reduced-motion`, viewport, and capability checks

**If a page needs an interactive demo:**
- Render the explanation and example state on the server first
- Hydrate only the interactive controls or replay behavior
- Keep the demo optional rather than the only way to understand the page

**If the page is Journal content:**
- Reuse the existing `/blog` MDX pipeline
- Align visual design and linking with the new growth pages
- Treat Journal articles as supporting authority pages in the same content cluster

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@^15.0.3` | `react@^19.0.0`, `react-dom@^19.0.0` | Already the repo baseline; keep marketing work aligned to this stack. |
| `gsap@^3.14.2` | Next.js App Router client components | Safe when dynamically imported inside client islands rather than top-level route files. |
| `next-mdx-remote@^6.0.0` | existing MDX file pipeline | Keep frontmatter parsing and page loaders typed so content and metadata stay consistent. |

## Notion Pattern Notes

From direct inspection of `https://www.notion.com/` on 2026-03-08:

- Notion serves a relatively small HTML response first, then relies on aggressively cached hashed JS and CSS assets.
- Static assets are cached immutably for a year, while public HTML stays edge-delivered and dynamic.
- The page preconnects to image and video origins and preloads the hero poster, hero video, fonts, and critical CSS.
- Product demos are shown as poster-backed videos, tabbed carousels, and screenshot-rich cards, but the core page story remains visible HTML text.
- The "fast" feel comes from server-rendered text, stable asset caching, early media hints, and selective interactivity, not from hiding everything behind JS.

## Sources

- `.planning/PROJECT.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `package.json`
- `lib/blog.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- `docs/seo.md`
- Next.js App Router docs: https://nextjs.org/docs/app
- Next.js Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Next.js MDX guide: https://nextjs.org/docs/app/guides/mdx
- Next.js Image Optimization: https://nextjs.org/docs/app/api-reference/components/image
- Next.js Font Optimization: https://nextjs.org/docs/app/getting-started/fonts
- GSAP docs: https://gsap.com/docs/v3/
- Direct inspection of `https://www.notion.com/` on 2026-03-08 via Playwright and response-header analysis

---
*Stack research for: Pitchr v1.1 public growth surfaces*
*Researched: 2026-03-08*
