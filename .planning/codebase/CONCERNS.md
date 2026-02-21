# Codebase Concerns

**Analysis Date:** 2025-02-21

## Tech Debt

**Monolithic Page Components:**
- Issue: Pages are extremely large (settings: 587 lines, history: 534, deck: 529, analytics: 493) with multiple sub-components and state logic mixed together. Violates the "sub-components extracted if >300 lines" guideline from CLAUDE.md.
- Files: `app/(app)/settings/page.tsx`, `app/(app)/history/page.tsx`, `app/(app)/deck/page.tsx`, `app/(app)/analytics/page.tsx`
- Impact: Difficult to test individual UI pieces, hard to reuse logic, performance degradation from re-rendering entire page on state change, maintenance nightmare.
- Fix approach: Extract sub-components (charts, cards, lists, modals) into separate files in `views/components/` with named exports. Move filtering/sorting logic into custom hooks.

**Mock Data Hardcoded in Pages:**
- Issue: Mock data (`MOCK_RUNS`, `MOCK_DECKS`, `SCORE_TREND`, etc.) is duplicated across page files instead of centralized. Makes updates error-prone and wastes time on data consistency.
- Files: `app/(app)/history/page.tsx`, `app/(app)/deck/page.tsx`, `app/(app)/analytics/page.tsx`, `app/(app)/dashboard/page.tsx`
- Impact: Changes to data structure require updating multiple files. Tests cannot share fixtures.
- Fix approach: Consolidate all mock data to `config/mockData.ts` with typed exports. Import and use in pages.

**Duplicate Orb State Management:**
- Issue: Orb state (`orbState`, `setOrbState`) is duplicated between `useSessionState` hook (lines 33-34 in `hooks/useSessionState.ts`) and `ThemeProvider` context. State can become out of sync.
- Files: `hooks/useSessionState.ts`, `views/components/SiriBubble/index.tsx` (or theme context)
- Impact: Inconsistent UI state, user confusion about visual feedback, potential bugs when states diverge.
- Fix approach: Single source of truth in context. Remove from `useSessionState` or make it derived from context.

## Known Bugs

**MediaStream Not Fully Released on Navigation:**
- Symptoms: Browser memory/CPU usage doesn't drop after navigating away from session page. Video tracks remain active in background.
- Files: `hooks/useMediaStream.ts` (lines 42, 64), `hooks/useSTT.ts`
- Trigger: Start recording → navigate to different page → memory usage stays high.
- Workaround: Manually close DevTools, close browser tab. Browser gc eventually cleans up.
- Root cause: `.catch(() => {})` suppresses errors in `video.play()` calls (lines 42, 64 in useMediaStream.ts). If play() fails silently, cleanup may not run. Need proper error handling + ensure `stop()` is called in cleanup.

**Speech Bubbles Grow Indefinitely in Long Sessions:**
- Symptoms: After 30+ minutes of continuous session, multiple speech bubbles visible at once, overlapping UI, visual clutter grows.
- Files: `hooks/useSessionState.ts` (line 132, `setSpeechBubbles(prev => [...prev, bubble])`)
- Trigger: Session runs >30 mins, coach messages keep queuing.
- Cause: `useEffect` cleanup (lines 142-148) runs on speechBubbles change, not on timer interval. If bubbles accumulate faster than they expire, array grows unbounded.
- Fix: Cap speechBubbles array length (max 5), or debounce the expiry cleanup with a fixed interval timer.

**Empty Catch Blocks Suppress Errors Silently:**
- Symptoms: Errors in audio playback, video initialization, or async operations disappear with no logging. Hard to debug user issues.
- Files: `server.ts` (lines 116, 178), `hooks/useSTT.ts` (line 114), `hooks/useMediaStream.ts` (lines 42, 64)
- Pattern: `.catch(() => {})` or `catch { }` with no logging/state update
- Impact: Silent failures in critical paths (video autoplay, audio context close). Users see frozen UI, no error message.
- Fix: Replace all `.catch(() => {})` with proper logging:
  ```typescript
  .catch((err) => {
    console.error('Failed to play video:', err);
    setError(`Playback error: ${err.message}`);
  })
  ```

## Security Considerations

**Missing Environment Variable Validation:**
- Risk: Code assumes env vars exist but doesn't validate. `ELEVENLABS_API_KEY_STT`, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_WS_URL` checked nowhere at startup. If missing, app crashes or behaves unpredictably.
- Files: `server.ts`, `hooks/useSTT.ts`, `app/api/pitch/run/route.ts`
- Current mitigation: `.env.example` documents required vars, but no runtime check.
- Recommendations: Add validation at app startup (e.g., in `app/(app)/layout.tsx` or `server.ts`). Throw clear error if required vars missing.

**Supabase Client Not Protected from XSS:**
- Risk: Supabase anon key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY`) exposed in browser. If malicious JS runs on page, attacker can read/write decks/slides.
- Files: `services/deckService.ts` (line 6), any component calling it
- Current mitigation: Only data is deck names/slides, not sensitive. RLS not visible in code.
- Recommendations: Verify Supabase RLS policies are enforced (decks/slides only readable by creator). Add CSP headers to prevent XSS. Consider moving deck operations to server-side API routes.

**PDF Parsing External Dependencies:**
- Risk: `pdf-parse` + `pdfjs-dist` load WASM from `node_modules` at runtime. If npm lockfile is compromised, malicious WASM could execute.
- Files: `services/deckService.ts` (line 57, dynamic import), `server.ts` (PDF handling)
- Current mitigation: Yarn lockfile used (more secure than npm).
- Recommendations: Pin `pdf-parse` version strictly in `package.json`. Monitor security advisories. Consider vendoring WASM file.

**No Input Validation on Deck Upload:**
- Risk: Large file uploads (>100MB PPTX) can exhaust server memory during `convertPptxToPdf` → `extractPdfText`.
- Files: `app/api/deck/upload/route.ts`
- Current mitigation: None visible.
- Recommendations: Add file size check (max 50MB). Add timeout on PDF conversion. Stream parsing instead of loading entire PDF into memory.

## Performance Bottlenecks

**Head Tracking Hook is 864 Lines, Complex State Machine:**
- Problem: `lib/headTracking/useHeadTracking.ts` is monolithic with 20+ refs, nested state machines (calibration, rolling window, EMA smoothing). Very hard to reason about performance. requestAnimationFrame loop does heavy computation every frame.
- Files: `lib/headTracking/useHeadTracking.ts`
- Cause: Combining calibration logic, state machine, rolling window management, EMA filters, and pose estimation in one place.
- Improvement path: Extract state machines into separate utilities (e.g., `calibrationStateMachine.ts`, `rollingWindowTracker.ts`). Memoize expensive computations (pose estimation, state classification). Profile frame loop to find hot spots.

**Score Trend Chart Renders 12+ Bar Elements on Every State Change:**
- Problem: `ScoreTrendChart` in `app/(app)/analytics/page.tsx` (lines 283-387) re-renders entire chart even when range changes slightly. No memoization.
- Files: `app/(app)/analytics/page.tsx`, `views/components/ScoreTrendChart` (if extracted)
- Cause: No `React.memo()`, no key optimization on bar elements.
- Improvement path: Wrap `ScoreTrendChart` in `React.memo()`. Memoize bar renderers. Use CSS transforms for hover effects instead of state.

**useSessionState Hook Simulates Metrics Every 2 Seconds:**
- Problem: Two setInterval timers (lines 97, 125 in `hooks/useSessionState.ts`) fire regardless of visibility. If tab is backgrounded, still consuming CPU updating state that's not displayed.
- Files: `hooks/useSessionState.ts`
- Cause: No document.hidden check or `useVisibilityChange` hook.
- Improvement path: Pause intervals when tab is hidden using `document.visibilitychange` event. Resume when tab becomes visible.

**Large Page Components Force Re-renders of All Sub-components:**
- Problem: Pages like `analytics/page.tsx` (493 lines) with multiple sub-components re-render the whole tree when a single state (e.g., `range`) changes.
- Files: `app/(app)/analytics/page.tsx`, similar large pages
- Cause: Sub-components passed as inline components, not extracted to separate files. Parent state changes trigger child re-renders.
- Improvement path: Extract sub-components to separate files. Use `React.memo()` on sub-components. Lift state closer to where it's needed.

## Fragile Areas

**PDF/PPTX Conversion Pipeline:**
- Files: `services/deckService.ts` (lines 31-50, `convertPptxToPdf`), `app/api/deck/upload/route.ts`
- Why fragile: Relies on external `soffice` binary (LibreOffice headless). If not installed, silently fails. No retry logic. Temp files may not clean up if process crashes.
- Safe modification: Wrap `execFileAsync` call in timeout. Check if `soffice` exists before calling. Log all errors. Use `fs.rm(..., { force: true })` in finally block (already done on line 48).
- Test coverage: Gaps - no tests for conversion failure, missing soffice, corrupted PPTX, timeout.

**Supabase Storage Upload Without Retry:**
- Files: `services/deckService.ts` (line 89-96, `uploadToStorage`)
- Why fragile: Network timeout or 5xx error throws immediately. No exponential backoff. If upload fails midway, no resume capability.
- Safe modification: Add retry loop with exponential backoff. Log each attempt. Consider adding pause-resume for large files using Supabase resumable uploads.
- Test coverage: Gaps - no tests for network failures, auth errors, storage quota exceeded.

**useHeadTracking Depends on MediaPipe WASM from CDN:**
- Files: `lib/headTracking/useHeadTracking.ts` (lines 119-121, CDN URL for WASM + task model)
- Why fragile: If CDN is down or CORS fails, entire head tracking feature breaks. No fallback. No offline capability.
- Safe modification: Cache WASM + model locally in public/. Add connectivity check before fetch. Provide graceful degradation (disable head tracking UI if unavailable).
- Test coverage: Gaps - no tests for WASM load failure, CORS errors, slow networks.

**Session Recording Requires Concurrent Audio + Video Streams:**
- Files: `hooks/useMediaStream.ts`, `hooks/useSTT.ts`
- Why fragile: Browser permission model is all-or-nothing. If user denies audio, video still starts but STT fails silently. State can become inconsistent.
- Safe modification: Check both audio + video permissions before starting. If one fails, stop both and show clear message.
- Test coverage: Gaps - no tests for permission denial, partial permissions, devices that don't have audio.

## Scaling Limits

**localStorage Limited to ~5-10MB per Domain:**
- Current capacity: MOCK_RUNS is 8 items, assuming ~50KB each = 400KB. Safe.
- Limit: If users do 1000+ runs, each run with transcript (~30KB) + analysis (~5KB), need ~35MB. Will fail with QuotaExceededError.
- Scaling path: Migrate to Supabase (already started in `deckService.ts`). Create `runs` table with same schema as Run interface. Implement paginated history queries. Archive old runs to separate table.

**Head Tracking Rolling Window Unbounded Growth:**
- Current capacity: 60-second window with ~60 Hz tracking = ~3600 samples. Memory footprint: ~3600 * 16 bytes per sample = ~58KB per session. Safe.
- Limit: If window is extended to 10 minutes, or if tracking frequency increases to 120Hz, could grow to 200KB+.
- Scaling path: Implement fixed-size circular buffer instead of growing array (line 165-176). Already has eviction logic (line 192-205) but doesn't compact array until head > 1024. Reduce compaction threshold.

**PDF Extraction Loads Entire PDF into Memory:**
- Current capacity: Assuming 50MB PPTX converts to ~50MB PDF, pdf-parse loads all pages into `Uint8Array`. Max memory: ~2 * 50MB (input + parsed) = 100MB per request. Safe for small slides.
- Limit: 200+ slide decks (500MB+ PDF) will OOM or timeout (30s default on Vercel).
- Scaling path: Stream PDF parsing. Only extract text for first N pages (cap at 50 slides). Implement pagination. Or use server-side PDF parsing with higher memory limits.

**Database Query N+1 Problem in Deck Display:**
- Current capacity: 6 decks listed on page, each needs 1 deck query + 1 slides query = 12 queries. Acceptable for demo.
- Limit: 100+ decks will cause 200+ queries, slow UI down.
- Scaling path: `getDeckWithSlides` already batches (Promise.all on line 141). Ensure slides are queried once per page load, not on every render. Add pagination to `/api/decks` endpoint.

## Dependencies at Risk

**pdf-parse Has Infrequent Updates, Security Unknown:**
- Risk: Last updated months ago, depends on older `pdfjs-dist`. If 0-day found in PDF parsing, fix may be slow.
- Impact: Decks page becomes unusable if exploit exists.
- Migration plan: Monitor `npm audit` output. Switch to `pdfjs-only` package if maintained more actively. Or implement minimal PDF text extraction (regex-based fallback for plain text PDFs).

**ElevenLabs STT Vendor Lock-in:**
- Risk: Entire `server.ts` + `hooks/useSTT.ts` hardcoded to ElevenLabs WebSocket API. If service goes down or pricing skyrockets, no quick switch.
- Impact: Users can't record pitch if ElevenLabs is down.
- Migration plan: Already have `LLM_PROVIDER=openrouter` switch in `.env.example`. Create similar abstraction for STT: `STT_PROVIDER=elevenlabs|google|openai`. Implement provider adapters in `lib/stt/providers/`.

**MediaPipe Vision WASM Pinned to @latest, Unpredictable Updates:**
- Risk: WASM URL in `useHeadTracking.ts` (line 120) points to CDN `@latest`. Breaking API changes could break head tracking.
- Impact: Head tracking fails silently if API changes.
- Migration plan: Pin to specific version (e.g., `@0.10.2`). Monitor releases monthly. Test WASM compatibility before updating.

**Tailwind CSS v4 Migration Not Fully Validated:**
- Risk: Using Tailwind 4.2.0 which just released. Some edge cases with CSS variables, dark mode, custom plugins may not be covered.
- Impact: Styling breaks in edge cases (old browsers, specific theme combinations).
- Migration plan: Test dark mode thoroughly across all pages. Validate CSS variable fallbacks. Check CSS coverage with `@tailwindcss/postcss` plugin.

## Missing Critical Features

**No Error Boundary Component:**
- Problem: If any sub-component throws, entire page crashes with white screen. No graceful fallback UI.
- Blocks: Users can't recover from errors without hard refresh.
- How to add: Create `views/components/ErrorBoundary.tsx` wrapping top-level routes. Display user-friendly message with "Try Again" button.

**No Offline Support:**
- Problem: All pages require real-time API calls. If network drops, app is unusable.
- Blocks: Mobile users on shaky networks, demos without internet, offline analysis.
- How to add: Add Service Worker + `next-pwa` for caching. Cache completed runs + mock data. Allow offline session recording (sync when online).

**No Toast/Notification System:**
- Problem: User actions (save, delete, upload) have no visual feedback. Unclear if action succeeded or failed.
- Blocks: Can't inform users of errors without modal (too heavy-handed).
- How to add: Implement toast queue in context provider (e.g., `views/components/ToastProvider.tsx`). Use in API error handlers. Auto-dismiss after 5 seconds.

**No Undo/History for Session Changes:**
- Problem: If user deletes a run or deck by accident, it's gone forever (in localStorage) or stuck in DB with no soft delete.
- Blocks: Users can't recover from mistakes.
- How to add: Add `deleted_at` soft-delete column to runs/decks. Implement trash bin UI. Hard-delete after 30 days.

## Test Coverage Gaps

**No Tests for Page Components:**
- What's not tested: Settings, History, Deck, Analytics, Results pages. No snapshot tests, no integration tests.
- Files: `app/(app)/**/*.tsx`
- Risk: Refactoring breaks UI silently. Regressions in filters, sorting, animations go unnoticed.
- Priority: High - Pages are complex and fragile due to monolithic size.

**No Tests for Head Tracking State Machine:**
- What's not tested: Calibration flow, state transitions (facing → away → down), rolling window math, EMA filtering.
- Files: `lib/headTracking/useHeadTracking.ts`
- Risk: Pose estimation breaks, engagement score calculation wrong, metrics drift.
- Priority: High - Complex state machine with subtle bugs.

**No Tests for Audio/Video Hooks:**
- What's not tested: Stream acquisition, permission denial, device enumeration, cleanup on unmount, concurrent access.
- Files: `hooks/useMediaStream.ts`, `hooks/useSTT.ts`
- Risk: Memory leaks, audio feedback loops, codec issues go unnoticed.
- Priority: High - Critical for core recording feature.

**No Tests for Supabase Integration:**
- What's not tested: Upload success/failure, DB errors, storage quota exceeded, network timeouts, auth failures.
- Files: `services/deckService.ts`, `app/api/deck/**/*.ts`
- Risk: Users can't upload decks without noticing.
- Priority: Medium - Deck feature is new, easy to break.

**No Tests for LLM Pipeline:**
- What's not tested: Prompt injection, JSON repair, rate limiting, API failures, model timeouts.
- Files: `services/analysisService.ts`, `lib/llm/**/*.ts`
- Risk: Invalid analysis results, silent failures to API calls.
- Priority: Medium - Core scoring logic, but fallback to mock exists.

**No End-to-End Tests:**
- What's not tested: Full user flow (upload deck → start session → record → get results).
- Risk: Multiple systems working independently but breaking when integrated.
- Priority: Medium - Can use Playwright or Cypress. `.playwright-mcp` directory suggests setup already started.

---

*Concerns audit: 2025-02-21*
