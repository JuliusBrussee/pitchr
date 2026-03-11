# SEO — Pitchr (pitchr.live)

Manual steps and checklists for indexing and off-site SEO. Technical and on-page SEO are implemented in the codebase (robots, sitemap, metadata, structured data).

---

## Verification steps (QA)

After `yarn build && yarn start`, verify:

1. **Runtime** — `curl -s -o /dev/null -w "%{http_code}" https://pitchr.live/robots.txt` and same for `/sitemap.xml`, `/`, `/about`, `/blog` → expect 200.
2. **robots.txt** — Response body contains `Sitemap: https://pitchr.live/sitemap.xml` and disallow list (e.g. `/api/`, `/auth/`, `/dashboard`, `/session`, …). No disallow of `/`, `/about`, `/blog`, `/terms`, `/privacy`.
3. **sitemap.xml** — All `<loc>` URLs use `https://pitchr.live` only; no localhost or query strings; includes `/`, `/blog`, `/about`, `/terms`, `/privacy` and blog post URLs; each has `<lastmod>`.
4. **View source (homepage)** — Contains meaningful text (“Pitchr”, “AI pitch coach”, “Ship pitches”), `<title>`, `<meta name="description">`, `<link rel="canonical" href="https://pitchr.live">`, and `application/ld+json` (Organization, WebSite, SoftwareApplication).
5. **Canonical per page** — Each indexable page has its own canonical (e.g. `/about` → `https://pitchr.live/about`). Check “View Page Source” for `/about`, `/blog`, `/terms`, `/privacy`.
6. **No noindex** — Search codebase for `noindex`, `nofollow`, `X-Robots-Tag`; ensure none apply to public marketing pages.
7. **Redirects** — On Vercel, `www.pitchr.live` → 301 to `https://pitchr.live`. No redirect chains > 1 hop.
8. **Structured data** — Homepage and /about include valid JSON-LD. Validate with [Rich Results Test](https://search.google.com/test/rich-results) or [validator.schema.org](https://validator.schema.org/).

---

## 1. Google Search Console

### Verify ownership

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://pitchr.live` (URL prefix).
3. Choose a verification method:
   - **HTML tag:** Add the meta tag to `app/layout.tsx` in the `<head>` (or use the existing `metadataBase` and add a verification meta in `metadata.other` if supported), or
   - **DNS:** Add the TXT record to your domain (pitchr.live) at your DNS provider.
4. Click **Verify**.

### Submit sitemap

1. In Search Console, open **Sitemaps** (left sidebar).
2. Enter: `https://pitchr.live/sitemap.xml`
3. Click **Submit**. Status should move to “Success” after crawlers run.

### Request indexing

1. Use **URL Inspection** (top search bar).
2. Enter a URL (e.g. `https://pitchr.live` or `https://pitchr.live/about`).
3. Click **Request indexing** so Google recrawls sooner.

---

## 2. Check indexing

- In a search engine: `site:pitchr.live`  
  You should see the homepage, /about, /blog, /terms, /privacy, and blog posts. App routes (e.g. /dashboard) should not appear.
- Confirm `/robots.txt` returns 200 and includes: `Sitemap: https://pitchr.live/sitemap.xml`
- Confirm `/sitemap.xml` returns 200 and lists canonical URLs (all `https://pitchr.live/...`).

---

## 3. Off-site SEO (brand queries)

To strengthen rankings for “pitchr” and “pitchr live”:

- **Consistent name:** Use “Pitchr” (and “Pitchr live” where relevant) everywhere: GitHub repo, LinkedIn, Product Hunt, press, social bios.
- **Links:** Add pitchr.live to:
  - GitHub repo description / website link
  - Founder/team LinkedIn profiles (website)
  - Product Hunt, launch posts, hackathon pages
  - Any press or partner page that mentions Pitchr
- **Profiles:** Create or update profiles (e.g. Product Hunt, LinkedIn company) with the same branding and link to https://pitchr.live.

---

## 4. Release checklist

Before each release, quick checks:

- [ ] **robots.txt** — `/robots.txt` returns 200; contains `Sitemap: https://pitchr.live/sitemap.xml`; disallow list includes `/api/`, `/auth/`, `/dashboard`, and other private routes.
- [ ] **sitemap** — `/sitemap.xml` returns 200; only indexable URLs (e.g. `/`, `/about`, `/blog`, `/terms`, `/privacy`, blog posts); all URLs use `https://pitchr.live`.
- [ ] **Titles** — Home: “Pitchr | AI Pitch Coach for Founders”; other pages use template “Page | Pitchr”. No accidental “noindex” in meta or headers.
- [ ] **Canonical** — Each public page has its own canonical (e.g. `/about` → `https://pitchr.live/about`). No www in canonical URLs; www redirects to non-www.

---

## 5. Structured data

- Homepage: Organization, WebSite, SoftwareApplication (in `HomeJsonLd`).
- Blog posts: BlogPosting, BreadcrumbList, and FAQPage when the post has FAQ content.
- About: FAQPage for the FAQ section.

Validate with [Google’s Rich Results Test](https://search.google.com/test/rich-results) or [Schema.org Validator](https://validator.schema.org/) by pasting the page URL.
