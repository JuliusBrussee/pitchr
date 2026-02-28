# Blog Audit Report

**Audit Date:** 2026-02-28
**Total Posts:** 6
**Average Score:** 55/100
**Directory:** `content/blog/`

---

## Health Overview

| Metric | Count |
|--------|-------|
| Posts Scoring 90+ (Excellent) | 0 |
| Posts Scoring 70-89 (Good) | 0 |
| Posts Scoring 50-69 (Needs Work) | 3 |
| Posts Scoring <50 (Poor) | 3 |
| Orphan Pages (no inbound links) | 3 |
| Dead-End Pages (no outbound links) | 3 |
| Cannibalization Issues | 1 |
| Stale Content (90+ days) | 0 |
| Posts Missing Images | 6 |
| Posts Missing FAQ | 3 |
| Blog Posts in Sitemap | 0 |

---

## Per-Post Scores

| Post | Total | Content /30 | SEO /25 | E-E-A-T /15 | Technical /15 | AI Citation /15 | Issues |
|------|-------|-------------|---------|-------------|---------------|-----------------|--------|
| reduce-filler-words-in-pitch | **68** | 26 | 17 | 7 | 6 | 12 | 5 |
| first-time-founder-pitch-mistakes | **67** | 27 | 18 | 6 | 6 | 10 | 6 |
| ai-pitch-coach-for-founders | **66** | 24 | 19 | 8 | 6 | 9 | 5 |
| 5-mistakes-founders-make-when-pitching | **45** | 17 | 12 | 5 | 6 | 5 | 10 |
| pitch-deck-vs-verbal-pitch | **44** | 16 | 13 | 3 | 6 | 6 | 9 |
| how-to-nail-your-elevator-pitch | **40** | 14 | 13 | 2 | 6 | 5 | 11 |

---

## Critical Site-Wide Issues

These affect all 6 posts and should be fixed first.

### 1. Blog posts missing from sitemap
`app/sitemap.ts` only lists `/`, `/terms`, `/privacy`. All 6 blog URLs must be added. Without this, search engines rely solely on crawl discovery.

### 2. Zero images across all 6 posts
No `coverImage` in any frontmatter, no inline images. This means:
- Every post is missing `og:image` and `twitter:image` (social shares render with no preview)
- Google Image search is inaccessible
- Blogs with images get 94% more views

### 3. Schema type is `Article` instead of `BlogPosting`
In `app/(marketing)/blog/[slug]/page.tsx` line 63, `Article` should be `BlogPosting` — the more specific Schema.org type Google recommends for blog content.

### 4. No `FAQPage` schema for posts with FAQ sections
Posts 2, 3, and 6 have FAQ sections but none emit `FAQPage` structured data. Missed opportunity for FAQ rich results.

### 5. No named author on any post
All 6 posts use `author: "Pitchr Team"`. Google's quality rater guidelines penalize content attributed to generic team names. The JSON-LD marks "Pitchr Team" as `@type: Person`, which is semantically incorrect.

### 6. No `dateModified` in schema or frontmatter
No `lastModified` field exists. When posts are updated, there's no way to signal freshness via structured data.

---

## Internal Link Graph

### Current State

```
ai-pitch-coach ──────→ first-time-founder
       ↑                       │
       │                       ↓
reduce-filler-words ←──────────┘
```

Posts 1, 4, and 5 are **completely disconnected** — zero inbound, zero outbound links.

### Link Inventory

| Post | Inbound | Outbound | Status |
|------|---------|----------|--------|
| 5-mistakes-founders-make | 0 | 0 | ORPHAN + DEAD END |
| ai-pitch-coach-for-founders | 1 | 1 | Weak |
| first-time-founder-pitch-mistakes | 1 | 1 | Weak |
| how-to-nail-your-elevator-pitch | 0 | 0 | ORPHAN + DEAD END |
| pitch-deck-vs-verbal-pitch | 0 | 0 | ORPHAN + DEAD END |
| reduce-filler-words-in-pitch | 1 | 1 | Weak |

**Total internal links: 3** (target: 3-5 per post = 18-30 total)

### Recommended Links to Add

**From `5-mistakes-founders-make-when-pitching`:**
- Line 49 (delivery section) → `reduce-filler-words-in-pitch`
- Line 16 ("pitches we analyze") → `ai-pitch-coach-for-founders`
- Line 47 (flat delivery) → `first-time-founder-pitch-mistakes`

**From `how-to-nail-your-elevator-pitch`:**
- Line 53 (common mistakes) → `5-mistakes-founders-make-when-pitching`
- Line 65 (record yourself) → `reduce-filler-words-in-pitch`
- Line 60 (Pitchr mention) → `ai-pitch-coach-for-founders`

**From `pitch-deck-vs-verbal-pitch`:**
- Line 24 (energy and conviction) → `reduce-filler-words-in-pitch`
- Line 28 (elevator encounters) → `how-to-nail-your-elevator-pitch`
- Line 52 (deck forwarded) → `5-mistakes-founders-make-when-pitching`

**From connected posts (add more links):**
- `ai-pitch-coach` → `how-to-nail-your-elevator-pitch` (line 46)
- `ai-pitch-coach` → `5-mistakes-founders-make-when-pitching` (line 52)
- `first-time-founder` → `how-to-nail-your-elevator-pitch` (line 78)
- `first-time-founder` → `pitch-deck-vs-verbal-pitch` (line 67)
- `reduce-filler-words` → `first-time-founder-pitch-mistakes` (line 73)
- `reduce-filler-words` → `5-mistakes-founders-make-when-pitching` (line 43)

---

## Topic Cannibalization

| Keyword Area | Competing Posts | Risk | Recommendation |
|-------------|----------------|------|----------------|
| "pitch mistakes founders" | `5-mistakes-founders-make` + `first-time-founder-pitch-mistakes` | MODERATE | DIFFERENTIATE |

**Analysis:** Both posts target "pitch mistakes founders make" but have different angles:
- Post 1 focuses on **content mistakes** (what you say): solution-first framing, missing business model, jargon
- Post 3 focuses on **delivery mistakes** (how you say it): pace, hedge words, pauses, reading slides

**Recommended fixes:**
1. Rename Post 1 to sharpen its content-vs-delivery angle (e.g., "5 Content Mistakes That Kill Investor Pitches")
2. Add cross-links in both posts disambiguating content vs. delivery mistakes
3. Expand Post 1 from 536 words to 1,200+ words (too thin to rank for any keyword)

---

## SEO Issues by Post

### Meta Descriptions Too Short (4 of 6)

| Post | Current Length | Target | Gap |
|------|--------------|--------|-----|
| 5-mistakes-founders-make | 101 chars | 150-160 | -49 chars |
| how-to-nail-your-elevator-pitch | 107 chars | 150-160 | -43 chars |
| pitch-deck-vs-verbal-pitch | 108 chars | 150-160 | -42 chars |
| reduce-filler-words-in-pitch | 130 chars | 150-160 | -20 chars |

### Title Tags Too Short (3 of 6)

| Post | Current Length | Target |
|------|--------------|--------|
| reduce-filler-words-in-pitch | 41 chars | 50-60 |
| how-to-nail-your-elevator-pitch | 47 chars | 50-60 |
| pitch-deck-vs-verbal-pitch | 48 chars | 50-60 |

### Missing FAQ Sections

| Post | Words | Has FAQ? |
|------|-------|----------|
| 5-mistakes-founders-make | 536 | No |
| how-to-nail-your-elevator-pitch | 444 | No |
| pitch-deck-vs-verbal-pitch | 537 | No |

---

## E-E-A-T Scores

| Post | Author /4 | Sources /4 | Trust /4 | Experience /3 | Total /15 |
|------|-----------|-----------|----------|---------------|-----------|
| ai-pitch-coach-for-founders | 1 | 1 | 3 | 3 | **8** |
| reduce-filler-words-in-pitch | 1 | 1 | 3 | 2 | **7** |
| first-time-founder-pitch-mistakes | 1 | 0 | 3 | 2 | **6** |
| 5-mistakes-founders-make | 1 | 1 | 2 | 1 | **5** |
| pitch-deck-vs-verbal-pitch | 1 | 0 | 2 | 0 | **3** |
| how-to-nail-your-elevator-pitch | 1 | 0 | 1 | 0 | **2** |

**Average: 5.2/15 (34.4%)**

Key E-E-A-T gaps:
- **Author attribution (1/4 on all posts):** Generic "Pitchr Team" instead of named individuals
- **Source citations (0-1/4):** Zero external source links; multiple unsourced statistics
- **Experience signals (0-3/3):** Posts 4 and 5 have zero first-person experience markers

---

## Content Quality Summary

| Post | Words | Depth /8 | Readability /5 | Originality /5 | Structure /5 | Engagement /4 | Grammar /3 | Total /30 |
|------|-------|----------|----------------|-----------------|--------------|---------------|------------|-----------|
| first-time-founder-pitch-mistakes | 1,629 | 7 | 4 | 4 | 5 | 4 | 3 | **27** |
| reduce-filler-words-in-pitch | 1,520 | 7 | 4 | 4 | 5 | 3 | 3 | **26** |
| ai-pitch-coach-for-founders | 1,432 | 6 | 4 | 4 | 4 | 3 | 3 | **24** |
| 5-mistakes-founders-make | 536 | 3 | 4 | 2 | 2 | 3 | 3 | **17** |
| pitch-deck-vs-verbal-pitch | 537 | 3 | 4 | 2 | 3 | 2 | 2 | **16** |
| how-to-nail-your-elevator-pitch | 444 | 2 | 3 | 1 | 2 | 3 | 3 | **14** |

**AI Detection:** All 6 posts pass comfortably. Burstiness scores are natural (0.578-0.771). One borderline phrase ("deep dive" in Post 5) used as a noun label, not flagged.

---

## Freshness Report

| Post | Date | Days Old |
|------|------|----------|
| ai-pitch-coach-for-founders | 2026-02-28 | 0 |
| reduce-filler-words-in-pitch | 2026-02-27 | 1 |
| first-time-founder-pitch-mistakes | 2026-02-26 | 2 |
| how-to-nail-your-elevator-pitch | 2026-02-25 | 3 |
| 5-mistakes-founders-make-when-pitching | 2026-02-20 | 8 |
| pitch-deck-vs-verbal-pitch | 2026-02-15 | 13 |

All content is fresh (<14 days old). **Risk:** Six posts in 13 days followed by a gap creates a "burst and abandon" pattern. Plan 2+ posts/month to maintain freshness signals.

---

## Prioritized Action Queue

| Priority | Action | Impact | Effort | Posts Affected |
|----------|--------|--------|--------|----------------|
| 1 | Add blog posts to sitemap (`app/sitemap.ts`) | Critical SEO | Low | All 6 |
| 2 | Add cover images + `og:image` to all posts | Social + engagement | Medium | All 6 |
| 3 | Add named authors with bios (replace "Pitchr Team") | E-E-A-T +6-8 pts | Medium | All 6 |
| 4 | Fix JSON-LD: `Article` → `BlogPosting`, add `publisher`, `dateModified` | Technical SEO | Low | All 6 |
| 5 | Add `FAQPage` schema for posts with FAQ sections | Rich results | Low | Posts 2, 3, 6 |
| 6 | Add 15+ internal links across all posts | SEO + AI citation | Low | All 6 |
| 7 | Expand `how-to-nail-your-elevator-pitch` to 1,200+ words with FAQ, sources | Content +16 pts | High | Post 4 |
| 8 | Expand `5-mistakes-founders-make` to 1,200+ words with FAQ, sources | Content +13 pts | High | Post 1 |
| 9 | Expand `pitch-deck-vs-verbal-pitch` to 1,200+ words with FAQ, sources | Content +12 pts | High | Post 5 |
| 10 | Add inline source citations for all statistical claims | E-E-A-T +4-6 pts | Medium | All 6 |
| 11 | Lengthen meta descriptions to 150-160 chars with stats | SEO +2-4 pts | Low | Posts 1, 4, 5, 6 |
| 12 | Differentiate Posts 1 and 3 (rename Post 1, add cross-links) | Fix cannibalization | Low | Posts 1, 3 |
| 13 | Add TL;DR callout boxes at top of each post | AI citation | Low | All 6 |
| 14 | Add `lastModified` frontmatter field | Future freshness | Low | All 6 |
| 15 | Add `BreadcrumbList` schema to blog template | Technical SEO | Low | All 6 |

---

## Next Steps

1. **Quick wins (1-2 hours):** Fix sitemap, JSON-LD schema, add internal links, lengthen meta descriptions
2. **Medium effort (1 day):** Add cover images, author bios, FAQ schema, TL;DR boxes
3. **Major rewrites (2-3 days):** Expand the three thin posts (4, 1, 5) to 1,200+ words each
4. Run `/blog analyze <file>` on `how-to-nail-your-elevator-pitch.mdx` (lowest score) for detailed fixes
5. Run `/blog geo <file>` on `reduce-filler-words-in-pitch.mdx` (highest score) for AI citation optimization
