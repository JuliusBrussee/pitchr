# Code Review — Pitchr Codebase

**Date:** 2026-02-28
**Scope:** Email/newsletter pipeline, blog system, dashboard/progress UI, database migrations

---

## Critical Issues (3)

### C1. Auth bypass on `newsletter-send` when bearer token is unset
**File:** `supabase/functions/newsletter-send/index.ts:50-56`

```typescript
function isAuthorized(req: Request): boolean {
  const expectedToken = Deno.env.get('NEWSLETTER_CRON_BEARER_TOKEN');
  if (!expectedToken) return true; // ANYONE can trigger sends
```

Combined with `verify_jwt = false` in `supabase/config.toml:62` and wildcard CORS (`Access-Control-Allow-Origin: *`), this means any unauthenticated request from any origin can trigger newsletter sends to all subscribers if the env var is missing. Should default to `return false`.

### C2. No rate limiting on public waitlist endpoint
**File:** `app/api/waitlist/route.ts`

`POST /api/waitlist` is publicly accessible with zero rate limiting. An attacker can abuse the Resend API quota by mass-submitting emails (each triggers a welcome email), fill the waitlist table with junk, or enumerate emails (see C3).

### C3. Email enumeration via distinct HTTP status codes
**File:** `app/api/waitlist/route.ts:114-129`

Existing users get `200`, new users get `201` with different messages. An attacker can determine whether any email is registered. Both paths should return the same status and message.

---

## High Severity Issues (9)

### H1. GET handler auto-unsubscribes users
**File:** `app/api/newsletter/unsubscribe/route.ts:91-116`

The GET handler performs a database UPDATE. Email security scanners (Barracuda, Proofpoint, Microsoft Safe Links) routinely follow GET links, which would auto-unsubscribe users without consent. GET should render a confirmation page, not execute the write.

### H2. IP address stored without privacy disclosure
**File:** `app/api/waitlist/route.ts:67-80`

Raw IP addresses stored as PII without GDPR-required consent or disclosure.

### H3. Welcome email failure silently swallowed
**File:** `app/api/waitlist/route.ts:16-27`

If Resend fails, the user never gets their email but the response says "Check your inbox." No retry, no dead-letter queue, no alerting.

### H4. Race condition: duplicate welcome emails
**File:** `app/api/waitlist/route.ts:91-111`

Two concurrent requests for the same email can both pass `!row.welcome_email_sent_at` check before either persists the flag.

### H5. Sequential email sending will exceed edge function timeout
**File:** `supabase/functions/newsletter-send/index.ts:325-389`

Emails sent one-at-a-time in a `for` loop. Default limit is 1,000,000 recipients (line 12-13). Supabase edge functions timeout at 60-150s. Use Resend's batch API or add concurrency.

### H6. Wildcard CORS on admin newsletter endpoint
**File:** `supabase/functions/_shared/cors.ts:2`

`Access-Control-Allow-Origin: *` on an admin/cron endpoint allows any website to make cross-origin requests.

### H7. Unescaped URL injection in newsletter HTML
**File:** `supabase/functions/newsletter-send/index.ts:84-88`

When `html_body` lacks `{{unsubscribe_url}}`, the fallback injects the URL into `href` without HTML-escaping. The `escapeHtml` function exists (line 70) but isn't applied here.

### H8. Blog slug path traversal
**File:** `lib/blog.ts:40-42`

```typescript
const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
```

The slug from the URL is joined into a file path without sanitization. A slug like `../../etc/passwd` resolves outside the blog directory. Add `slug.includes('..')` guard and validate resolved path stays within `BLOG_DIR`.

### H9. MDX `code` component override conflicts with rehype-pretty-code
**File:** `views/components/blog/MDXComponents.tsx:65`

```typescript
code: (props) => <code className="blog-inline-code" {...props} />,
```

Applies inline-code styling to all `<code>` elements including syntax-highlighted code blocks inside `<pre>`. Should check for `language-*` className to distinguish block vs inline code.

### H10. No `prefers-reduced-motion` support for 15+ animations
**File:** `app/globals.css`

CSS defines ~15 animation keyframes (`fadeInUp`, `momentumStatReveal`, `trendLineReveal`, `winGlowPulse`, `glowPulse`, `scoreRingFill`, `barFillSlide`, etc.) and none are gated behind `prefers-reduced-motion`. Users with vestibular disorders experience a full barrage of animations including infinite loops. WCAG 2.3.3 violation.

### H11. Duplicate constants across progress components
**Files:** `views/components/progress/SkillLadder.tsx`, `CategoryProgressCard.tsx`, `ProgressKanban.tsx`

`COACHING_TIPS`, `STATUS_CONFIG`, and `MiniSparkline` are duplicated (with minor variations) across 3+ files. Updating one requires remembering to update all others. Extract to shared modules.

### H12. SVG gradient ID collision in `TrendChart`
**File:** `views/components/progress/MomentumPanel.tsx:151`

```typescript
<linearGradient id="trendGrad" ...>
```

Static `id="trendGrad"` — if multiple `MomentumPanel` instances render on the same page, gradient IDs collide causing visual glitches. Use React's `useId()` hook.

---

## Medium Severity Issues (19)

| # | Issue | File(s) |
|---|-------|---------|
| M1 | `newsletter_opt_in` defaults to `true` (opt-out model, GDPR risk) | `app/api/waitlist/route.ts:81` |
| M2 | Code duplication between `services/emailService.ts` and `supabase/functions/_shared/email.ts` | Both files |
| M3 | Hardcoded `localhost:3000` fallback for `APP_BASE_URL` in production | `services/emailService.ts:39`, `newsletter-send/index.ts:46` |
| M4 | Duplicate response logic in unsubscribe GET/POST handlers | `app/api/newsletter/unsubscribe/route.ts:62-116` |
| M5 | Outer catch swallows error without logging | `app/api/waitlist/route.ts:131-135` |
| M6 | Weak email validation regex (accepts `@a.b`, `foo@bar..baz`) | `app/api/waitlist/route.ts:56` |
| M7 | No fetch timeout on Resend API calls | `services/emailService.ts:48`, `_shared/email.ts:28` |
| M8 | CLAUDE.md missing Resend/newsletter env vars | `.env.example` vs `CLAUDE.md` |
| M9 | YouTube embed component doesn't validate `id` prop | `views/components/blog/MDXComponents.tsx:23-34` |
| M10 | Campaign status rollback misleading after partial send | `newsletter-send/index.ts:449-455` |
| M11 | Index sort direction mismatch (`desc` in index, `asc` in query) | Migration `20260228000004` line 18 |
| M12 | `getAllPosts()` redundantly re-reads all MDX files on each call | `lib/blog.ts:64-73` |
| M13 | `ReadingProgress` forces layout recalculation on every scroll event | `views/components/blog/ReadingProgress.tsx:9-18` |
| M14 | CSS `z-index: 9999` / `10000` on blog overlays will conflict with modals | `app/(marketing)/blog/blog.css:105,118` |
| M15 | `FixTracker` list items use `onClick` on `<div>` — keyboard inaccessible | `views/components/progress/FixTracker.tsx:132-143` |
| M16 | Missing ARIA labels on all SVG charts (6+ components) | `ProgressHero`, `SkillLadder`, `MomentumPanel`, `ScoreTimeline`, `RadarChart`, `Sparkline` |
| M17 | `CoachSummary` "Start drill" looks clickable but has no handler | `views/components/dashboard/CoachSummary.tsx:56-59` |
| M18 | `--glow-color` CSS property set on `SkillTrack` but never consumed | `views/components/progress/SkillLadder.tsx:124` |
| M19 | Naming collision: two different `StreakBadge` components | `dashboard/StreakBadge.tsx` vs `progress/StreakBadge.tsx` |

---

## Low Severity Issues (16)

| # | Issue | File(s) |
|---|-------|---------|
| L1 | `&apos;` not supported in all email clients (use `&#39;`) | `services/emailService.ts:100` |
| L2 | Type assertions instead of Supabase generics | `app/api/waitlist/route.ts:101,125` |
| L3 | UUID regex rejects v6/v7 UUIDs | `unsubscribe/route.ts:5`, `newsletter-send/index.ts:11` |
| L4 | Unbounded `while (true)` in `loadSentWaitlistIds` | `newsletter-send/index.ts:195` |
| L5 | `NODE_ENV=development` in Deno env example (no effect) | `supabase/functions/.env.example:28` |
| L6 | Dashboard components use hardcoded hex colors instead of CSS variables | `views/components/progress/*.tsx` |
| L7 | Inline animation styles bypass CSS class system, can't be overridden by `prefers-reduced-motion` | `MomentumPanel.tsx`, `SkillLadder.tsx` |
| L8 | `coverImage` returns `null` but type declares `string \| undefined` | `lib/blog.ts:30` vs `types/blog.ts:8` |
| L9 | `LandingBlog` silently swallows fetch errors | `views/components/landing/LandingBlog.tsx:13-18` |
| L10 | Blog `img` override hardcodes 800x450 dimensions for all images | `views/components/blog/MDXComponents.tsx:68-76` |
| L11 | Inline prop types instead of named interfaces on blog components | `BlogCard.tsx:5`, `BlogHero.tsx:6` |
| L12 | Date strings parsed without timezone, may show wrong day in western TZs | Multiple blog files |
| L13 | `ProgressKanban` uses hardcoded 4-column grid with no responsive breakpoints | `views/components/progress/ProgressKanban.tsx:60` |
| L14 | `SkillLadder` sorted array recalculates on every render (missing `useMemo`) | `views/components/progress/SkillLadder.tsx:328-332` |
| L15 | `FixTracker` filter tabs lack `aria-pressed` or `aria-selected` | `views/components/progress/FixTracker.tsx:91-108` |
| L16 | `BANDS` array uses `7.99`/`11.99` max values — fragile with floating point scores | `views/components/progress/SkillLadder.tsx:46-51` |

---

## Priority Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 12 |
| Medium | 19 |
| Low | 16 |
| **Total** | **50** |

### Top 7 fixes to prioritize:

1. **C1** — Make `isAuthorized` default to `false` when token is unset
2. **H1** — Change unsubscribe GET to render a confirmation page, not execute the write
3. **C2 + C3** — Add rate limiting to `POST /api/waitlist` and normalize response codes
4. **H8** — Add path traversal guard to `getPostBySlug`
5. **H10** — Add `prefers-reduced-motion` media query to `globals.css`
6. **H5** — Add batching/concurrency to newsletter sending or lower the recipient limit
7. **H11** — Extract duplicated constants (`COACHING_TIPS`, `STATUS_CONFIG`) to shared modules
