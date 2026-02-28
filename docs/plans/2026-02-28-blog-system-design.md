# Blog System Design

## Overview

SEO-optimized blog for Pitchr's marketing site. MDX files in the repo, statically generated, magazine-grid listing with individual post pages.

## Decisions

- **Content format**: MDX files in `content/blog/` with YAML frontmatter
- **MDX tooling**: `next-mdx-remote` (compile at build time, no Next config changes)
- **Listing layout**: Magazine grid — featured hero card + 3-column grid
- **Routing**: Separate `/blog` listing + `/blog/[slug]` post pages under `(marketing)` group
- **Landing page**: "From the Blog" section with 3 latest posts + "View all" link

## Content Structure

```
content/blog/
├── how-to-nail-your-elevator-pitch.mdx
├── 5-mistakes-founders-make.mdx
└── pitch-deck-vs-verbal-pitch.mdx
```

Frontmatter schema:

```yaml
title: string          # required
date: string           # required, YYYY-MM-DD
author: string         # required
category: string       # required
tags: string[]         # optional
excerpt: string        # required, used in cards + meta description
coverImage: string     # optional, path to cover image
readingTime: number    # optional, auto-calculated if omitted
featured: boolean      # optional, shows in hero position
```

## Routes

| Route | Purpose | Rendering |
|-------|---------|-----------|
| `/blog` | Magazine grid listing | Static |
| `/blog/[slug]` | Individual post | Static via `generateStaticParams` |

## Pages

### Blog Listing (`/blog`)

- Header: title + subtitle + category filter pills
- Featured post: full-width hero card (cover image, title, excerpt, author, date, reading time)
- Post grid: 3-col desktop, 2-col tablet, 1-col mobile
- Cards: cover image, category badge, title, excerpt (2 lines), author, date, reading time

### Individual Post (`/blog/[slug]`)

- SEO: full meta tags, OG image, JSON-LD Article structured data
- Header: cover image, title, author, date, reading time, category badge
- Table of contents: auto-generated from headings, sticky sidebar on desktop
- Content: MDX rendered with custom components
- Footer: author bio, related posts (same category), back link

### Landing Page Section

- "From the Blog" section between testimonial and CTA
- 3 latest post cards in a row
- "View all posts" link to `/blog`

## MDX Custom Components

- `<Callout type="tip|warning|info">` — styled callout boxes
- `<CodeBlock>` — syntax-highlighted code with copy button
- `<Image>` — Next.js Image with caption
- `<YouTube>` — responsive YouTube embed
- `<Quote>` — styled blockquote with attribution

## SEO

- `generateMetadata` per post: title, description, OG tags, canonical URL
- JSON-LD `Article` structured data on post pages
- Auto-generated sitemap including all blog posts
- Proper h1/h2/h3 hierarchy

## Styling

- CSS variables for theming (light/dark)
- Coral/orange accent colors for links and highlights
- Glass/surface effects matching landing page cards
- Typography: clean body text, generous line-height
- Responsive breakpoints: 900px, 600px (matching landing page)

## Files to Create

```
lib/blog.ts                                    # getAllPosts, getPostBySlug, getRelatedPosts
app/(marketing)/blog/page.tsx                  # listing page
app/(marketing)/blog/[slug]/page.tsx           # post page
app/(marketing)/blog/blog.css                  # blog styles
views/components/blog/BlogCard.tsx             # post card component
views/components/blog/BlogHero.tsx             # featured post hero
views/components/blog/TableOfContents.tsx       # sticky TOC
views/components/blog/MDXComponents.tsx         # custom MDX components
views/components/landing/LandingBlog.tsx        # landing page section
content/blog/*.mdx                             # sample posts
```

## Dependencies

- `next-mdx-remote` — MDX compilation/rendering
- `gray-matter` — frontmatter parsing
- `rehype-slug` + `rehype-autolink-headings` — heading anchors for TOC
- `rehype-pretty-code` + `shiki` — syntax highlighting
