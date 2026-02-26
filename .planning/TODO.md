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
- [x] **GA4 analytics** — Google Analytics 4 script added to `app/layout.tsx`, opt-in via `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var
- [x] **WebSocket disconnect handling** — STT WebSocket `onclose` now detects unclean disconnects mid-recording and surfaces error message
- [x] **Browser back during analysis** — `beforeunload` event prevents accidental navigation during pitch analysis
- [x] **Skeleton loading states** — Shimmer skeleton components on Dashboard, History, Analytics, Progress pages
- [x] **Delete confirmation** — `window.confirm` dialog before deleting pitch runs on History page
- [x] **Camera/mic permission denied** — Human-readable error messages for NotAllowedError, NotFoundError, NotReadableError
- [x] **Lazy load Three.js orb** — `next/dynamic` with `ssr: false` for SiriBubble on demo page
- [x] **Debounce rapid form submissions** — 1s debounce guard on StartSessionButton prevents double-clicks
- [x] **Max transcript length** — 50,000 character limit prevents extremely long pitches from hitting LLM token limits
- [x] **RecordingPlayer autoplay catch** — Comment added explaining browser autoplay policy
- [x] **InvestorDrill billing catch** — Comment added explaining best-effort budget fetch
- [x] **Structured data (JSON-LD)** — SoftwareApplication schema.org markup in `app/layout.tsx`
- [x] **Canonical tags** — `alternates.canonical` added to metadata in `app/layout.tsx`
- [x] **MediaStream cleanup** — Extra cleanup effect ensures all tracks are stopped on stream change / unmount

## High Priority

- [ ] **Set up Sentry project** — Create account at sentry.io, add `NEXT_PUBLIC_SENTRY_DSN` to production env
- [ ] **OG image** — Design and add `og:image` for social sharing previews (1200x630px)
- [ ] **Favicon** — No favicon in `/public` — design and add `favicon.ico` + `apple-touch-icon.png`

## Medium Priority

- [ ] **Pagination on analytics/dashboard** — Currently loads all runs at once; add server-side pagination
- [ ] **Empty transcript guard** — Validate transcript is non-empty before submitting for analysis (partially covered — empty check exists, but no UI guard for text input mode)
- [ ] **Session resume on reload** — Persist session state so page refresh doesn't lose in-progress recording
- [ ] **Orb state deduplication** — `orbState` is duplicated between `useSessionState` and `ThemeProvider` context

## Low Priority / Post-Launch

- [ ] **E2E test suite** — Add Playwright smoke tests for critical flows (login → session → results)
- [ ] **Service unit tests** — `analysisService`, `scoringService`, `runService` have no tests
- [ ] **Component extraction** — Analytics page (1229 lines), History page (620 lines) are monolithic
- [ ] **Service worker / offline detection** — Graceful degradation when network is unavailable
- [ ] **Lighthouse audit** — Run performance audit, optimize Core Web Vitals
- [ ] **Bundle analysis** — `@react-pdf/renderer` is heavy; evaluate lazy loading or code splitting
- [ ] **Speech bubbles overflow** — Grow indefinitely in long sessions
- [ ] **ElevenLabs TTS** — `services/elevenlabs/` is empty; implement coach voice (Tier 1 feature)
