# Pitchr — Launch Readiness TODO

## Completed

- [x] **Sitemap + robots.txt** — `app/sitemap.ts`, `app/robots.ts` auto-generate SEO files
- [x] **OG / Twitter card tags** — Added to root `app/layout.tsx`
- [x] **Mobile navigation** — Collapsible sidebar with hamburger menu on `<md` breakpoint, backdrop overlay, auto-close on nav
- [x] **Toast notification system** — `ToastProvider` + `useToast()` hook, 4 types (error/success/info/warning), glassmorphic styling
- [x] **Silent error fixes** — Dashboard, History, Analytics, Progress pages now surface fetch errors via toast
- [x] **Retry UX** — "Try Again" buttons on all data pages when fetch fails
- [x] **Sentry error monitoring** — `@sentry/nextjs` integrated, opt-in via `NEXT_PUBLIC_SENTRY_DSN` env var
- [x] **Global error boundary** — `app/global-error.tsx` catches unhandled errors, reports to Sentry, shows retry

## High Priority

- [ ] **Set up Sentry project** — Create account at sentry.io, add `NEXT_PUBLIC_SENTRY_DSN` to production env
- [ ] **GA4 analytics** — Add Google Analytics for funnel tracking (landing → signup → first pitch → results)
- [ ] **OG image** — Design and add `og:image` for social sharing previews (1200x630px)
- [ ] **WebSocket disconnect handling** — Surface warning in UI when STT WebSocket drops mid-recording, add reconnection logic
- [ ] **Browser back during analysis** — Add `beforeunload` warning when pitch is being analyzed
- [ ] **Skeleton loading states** — Replace "Loading..." text with skeleton shimmer on Dashboard, History, Analytics, Progress
- [ ] **Delete confirmation** — Add confirm dialog before deleting pitch runs (History page)
- [ ] **Camera/mic permission denied** — Show clear UI guidance when `getUserMedia` fails (currently shows error string)

## Medium Priority

- [ ] **Lazy load Three.js orb** — Dynamic import for `SiriBubble` to reduce initial bundle (~224 KB on /demo)
- [ ] **Pagination on analytics/dashboard** — Currently loads all runs at once; add server-side pagination
- [ ] **Debounce rapid form submissions** — Prevent double-clicks on "Start Session", deck upload, etc.
- [ ] **Empty transcript guard** — Validate transcript is non-empty before submitting for analysis
- [ ] **Max transcript length** — Add character limit to prevent extremely long pitches from hitting LLM token limits
- [ ] **Session resume on reload** — Persist session state so page refresh doesn't lose in-progress recording
- [ ] **RecordingPlayer autoplay catch** — `videoRef.current.play().catch(() => {})` in RecordingPlayer needs comment
- [ ] **InvestorDrill billing catch** — Silent catch on `/api/billing/usage` fetch (low impact, optional feature)
- [ ] **Orb state deduplication** — `orbState` is duplicated between `useSessionState` and `ThemeProvider` context

## Low Priority / Post-Launch

- [ ] **E2E test suite** — Add Playwright smoke tests for critical flows (login → session → results)
- [ ] **Service unit tests** — `analysisService`, `scoringService`, `runService` have no tests
- [ ] **Component extraction** — Analytics page (1229 lines), History page (620 lines) are monolithic
- [ ] **Service worker / offline detection** — Graceful degradation when network is unavailable
- [ ] **Lighthouse audit** — Run performance audit, optimize Core Web Vitals
- [ ] **Bundle analysis** — `@react-pdf/renderer` is heavy; evaluate lazy loading or code splitting
- [ ] **Structured data (JSON-LD)** — Add schema.org markup for better SEO
- [ ] **Canonical tags** — Add canonical URLs to prevent duplicate content issues
- [ ] **Favicon** — Verify favicon is present in `/public` directory
- [ ] **MediaStream cleanup** — Known issue: stream not fully released on unmount (memory leak on nav away)
- [ ] **Speech bubbles overflow** — Grow indefinitely in long sessions
- [ ] **ElevenLabs TTS** — `services/elevenlabs/` is empty; implement coach voice (Tier 1 feature)
