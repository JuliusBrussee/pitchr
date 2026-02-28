# Codebase Concerns

**Analysis Date:** 2026-02-22

## Tech Debt

**Monolithic Page Components:**
- Issue: Pages like `app/(app)/analytics/page.tsx` (839 lines), `app/(app)/settings/page.tsx` (625 lines), and `app/(app)/history/page.tsx` (604 lines) are significantly oversized and handle multiple concerns in a single file
- Files: `app/(app)/analytics/page.tsx`, `app/(app)/settings/page.tsx`, `app/(app)/history/page.tsx`, `app/(app)/deck/page.tsx` (584 lines)
- Impact: Difficult to test individual features, harder to reuse logic, reduced maintainability, increased cognitive load when debugging
- Fix approach: Extract sub-components (grid/list views, filter panels, modal dialogs) into separate component files in `views/components/`. Create shared utility functions for data computation (e.g., `computeTrend()` from analytics should be in `lib/analytics.ts`)

**Orb State Duplication:**
- Issue: Orb state (`idle`, `active`, `listening`, `thinking`) is duplicated between `useSessionState` hook and `ThemeProvider` context, causing potential sync issues
- Files: `hooks/useSessionState.ts` (line 70), `views/components/ThemeProvider.tsx` (if context exists)
- Impact: Risk of state divergence where UI shows different states than business logic, difficult debugging of theme/visual feedback
- Fix approach: Create single source of truth—either move all orb state to a dedicated context or remove duplication by deriving theme state from session hook

**Unescaped Special Characters:**
- Issue: Known historical issue with UTF-8 corruption (mojibake) mentioned in CLAUDE.md—em dashes (`â€"`) instead of `—`, curly quotes corrupted. Fixed in commit `b8733df3` but risk remains with future edits
- Files: All files (structural issue, not isolated to specific files)
- Impact: Garbled text in comments, strings, and documentation; rendering issues in UI
- Fix approach: Enforce UTF-8 encoding in editor config (`.editorconfig`), use pre-commit hooks to validate UTF-8 in all files

## Known Bugs

**WebSocket Connection Resource Leak:**
- Symptoms: WebSocket connections may not fully close if client navigates away while recording; connections accumulate in memory
- Files: `hooks/useSTT.ts` (lines 268-281 `stop()` method, lines 405-423 WebSocket lifecycle), `app/(app)/session/page.tsx` (cleanup in useEffect)
- Trigger: Start recording → navigate to different page without clicking stop → repeat; check DevTools Network > WS tab
- Workaround: Always click stop before navigating; close browser tab fully between sessions
- Root cause: `20000ms` timeout (line 281) before closing WebSocket; if component unmounts first, connection lingers

**MediaStream Track Release Incomplete:**
- Symptoms: Camera/microphone remains active even after stopping session; indicators in browser stay on
- Files: `hooks/useMediaStream.ts` (cleanup at line 55), `hooks/useSTT.ts` (stopMic function, lines 183-202)
- Trigger: Use media stream → stop → check browser camera indicator; indicator sometimes persists
- Impact: Battery drain on laptops, permission dialogs on next session, potential audio feedback if not stopped
- Fix approach: Add explicit `track.stop()` + wait for `track.readyState` change; verify `audioContext.state` is `closed`

**Silent Error Suppression in Audio Playback:**
- Symptoms: Audio fails to play but user sees no error message
- Files: `hooks/useSTT.ts` (lines 513, 580, 600 have `.catch(() => {})` and try-catch blocks with empty handlers), `views/components/SessionCanvas.tsx` (line 42: `.catch(() => {})`)
- Trigger: Network issues, browser autoplay policy, codec unsupported, speaker device disconnected
- Impact: User thinks feature is broken with no indication why; coach feedback audio silently fails
- Fix approach: Log errors to console in development, display user-friendly message in production (e.g., "Could not play audio: codec not supported")

**Empty Error Handlers in Critical Paths:**
- Symptoms: Silent failures that are hard to debug
- Files: `hooks/useSTT.ts` (lines 187, 191, 199, 334, 471, 514, 581), `hooks/useMediaStream.ts` (lines 42, 64)
- Impact: Errors are swallowed, making troubleshooting impossible for user support
- Fix approach: Add `console.warn()` or error reporting to all catch blocks; escalate critical errors to user UI

**Transcript Race Condition in Auto-Submit:**
- Symptoms: Occasionally submits empty or partial transcript for analysis
- Files: `app/(app)/session/page.tsx` (lines 216-281, auto-submit effect)
- Trigger: Stop recording → auto-submit fires before all STT message handlers complete
- Root cause: `stt.saved` may become true before all `committed_transcript` messages arrive from WebSocket
- Fix approach: Add buffer (50-100ms) before checking transcript completeness, or listen for explicit "transcription_complete" message from server

## Security Considerations

**No Authentication or Authorization:**
- Risk: Any user can view/delete any other user's pitch runs, decks, and analysis results; no data isolation
- Files: `app/api/pitch/run/route.ts`, `app/api/pitch/run/[runId]/route.ts`, `app/api/deck/route.ts`, `app/api/deck/[deckId]/route.ts` (all lack auth checks)
- Current mitigation: MVP assumes single user; Supabase has no RLS policies enabled
- Recommendation: Implement user authentication (Supabase Auth or similar) before multi-user deployment; add RLS policies to `runs`, `decks`, `slides` tables; validate user ownership in all API routes

**Supabase Client Instantiation with Placeholder Values:**
- Risk: If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, client falls back to placeholder values (`'http://placeholder'`, `'placeholder'`), causing cryptic failures
- Files: `lib/supabase.ts` (lines 3-6)
- Impact: Difficult debugging; app appears to work locally but fails in production if env vars are missing
- Recommendation: Throw explicit error at initialization time: `if (!supabaseUrl || !anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required')`

**PDF File Upload Size Limit Not Enforced:**
- Risk: 50 MB limit is documented in Supabase bucket policy, but frontend does not validate before upload; user waits for large file to process before getting error
- Files: `app/(app)/deck/page.tsx` (upload handler around line 400+), `app/api/deck/upload/route.ts`
- Current mitigation: Supabase rejects >50 MB with HTTP 413
- Recommendation: Add client-side validation: `if (file.size > 50 * 1024 * 1024) throw new Error('File too large')`; provide clear feedback before upload starts

**Text Injection via Unvalidated Deck Slides:**
- Risk: PDF text extraction is unvalidated; malicious or corrupted PDFs could inject large strings into database, causing performance issues or UI breaks
- Files: `services/deckService.ts` (extractPdfText function, lines 54-77)
- Current mitigation: None; database stores raw extracted text
- Recommendation: Sanitize extracted text: trim lines >1000 chars, limit total slide text to 10KB per slide, validate UTF-8

**Placeholder Orb State in Context:**
- Risk: `ThemeProvider` may pass undefined or stale orb state if session hook initialization is delayed
- Files: `app/(app)/session/page.tsx` (lines 128-130), `views/components/ThemeProvider.tsx`
- Impact: Aura animation lags, visual feedback mismatched with actual recording state
- Recommendation: Ensure session hook initializes before first render; use suspense boundary or loading state

## Performance Bottlenecks

**CORS Preflight Overhead on Edge Functions (FIXED):**
- Problem: Without `Access-Control-Max-Age`, every cross-origin fetch to an edge function triggered a fresh OPTIONS preflight request. Cold-start preflights took 1-2s each, and pages making 3-5 concurrent data fetches could stall for 1+ minutes.
- Files: `supabase/functions/_shared/cors.ts`, all edge function `index.ts` files
- Fix: Added `Access-Control-Max-Age: 86400` to shared CORS headers. Browser now caches preflights for 24h after the first request.
- Note: Any change to `cors.ts` requires redeploying all edge functions.

**Unstable useCallback Dependencies in Data-Fetching Pages (FIXED):**
- Problem: `showTooltip` (from `useSmartTooltip`) was listed as a `useCallback` dependency for `loadRuns` in dashboard, progress, history, and analytics pages. If the reference ever became unstable (e.g., due to context value changes), it would recreate `loadRuns`, re-trigger the `useEffect`, and fire duplicate fetch requests.
- Files: `app/(app)/dashboard/page.tsx`, `app/(app)/progress/page.tsx`, `app/(app)/history/page.tsx`, `app/(app)/analytics/page.tsx`
- Fix: Replaced direct `showTooltip` dependency with a ref (`showTooltipRef`). Callbacks only used in error paths should never drive re-execution of data-fetching effects.

**LLM Response Latency on Cold Start:**
- Problem: First pitch analysis request waits for LLM initialization + response (typically 5-30 seconds depending on provider)
- Files: `services/analysisService.ts` (lines 247-329, `analyzeWithContext`), `services/judgeAgentService.ts` (LLM call)
- Cause: No caching of model weights; network latency; token counting overhead
- Improvement path: Cache LLM model in memory after first call; implement response streaming for perceived speed improvement; add progress indicators ("Analyzing structure...", "Analyzing delivery...")

**useHeadTracking Inference Overhead:**
- Problem: MediaPipe FaceLandmarker runs on every frame (30+ FPS), causing high CPU usage and frame drops on lower-end machines
- Files: `lib/headTracking/useHeadTracking.ts` (1126 lines, complex state machine)
- Cause: No frame rate throttling; inference happens on main thread
- Improvement path: Throttle inference to 5-10 FPS; offload to Web Worker if possible; add GPU acceleration toggle

**PageSize PDF Extraction Memory Spike:**
- Problem: Large PDFs (100+ slides) loaded entirely in memory during text extraction
- Files: `services/deckService.ts` (lines 54-77)
- Cause: `PDFParse` loads entire PDF into memory; no streaming
- Improvement path: Implement chunked extraction (50 slides at a time); lazy-load slides only when requested

**Session Canvas Component Rendering:**
- Problem: MetricsPanel recomputes metrics on every transcript update, potentially causing re-renders
- Files: `views/components/MetricsPanel.tsx` (383 lines), `app/(app)/session/page.tsx` (lines 172-178)
- Impact: Visible lag during fast speech, jank in metrics display
- Fix approach: Memoize MetricsPanel props; debounce transcript updates (100ms); use CSS containment for metrics sub-components

## Fragile Areas

**Complex WebSocket Lifecycle in useSTT:**
- Files: `hooks/useSTT.ts` (main WebSocket logic, 633 lines total)
- Why fragile: Multiple WebSocket instances (wsRef, answerWsRef, targetWsRef) managed with loose coupling; race conditions between resume/stop/close; timeout-based cleanup (line 281) is unreliable
- Safe modification: Add invariant checks before WebSocket operations; document state transitions in comments; add integration tests for resume/stop/answer flows
- Test coverage: Minimal; no tests for WebSocket message ordering or timeout scenarios

**Realtime Checklist Sync Between STT and Session:**
- Files: `app/(app)/session/page.tsx` (lines 166-169), `hooks/useSTT.ts` (lines 474-485), `hooks/useSessionState.ts` (lines 78-81)
- Why fragile: Three independent sources of truth for checklist state; if STT message arrives out-of-order, checklist displays wrong items; no version tracking
- Safe modification: Add unique ID or timestamp to each checklist update; validate sequence before applying; add unit tests for checklist merge logic
- Test coverage: None

**Deck Text Caching with Unbounded Growth:**
- Files: `app/(app)/session/page.tsx` (line 48: `deckTextCacheRef`, lines 84-103)
- Why fragile: Cache grows indefinitely if user switches between many decks; no cache invalidation or size limit
- Safe modification: Implement LRU cache with max 10 entries; clear cache on session start; consider moving to Zustand store if persistence is needed
- Test coverage: None

**Auto-Submit Effect with Race Conditions:**
- Files: `app/(app)/session/page.tsx` (lines 216-281)
- Why fragile: Relies on `stt.saved` flag and mutable ref (`autoSubmitLockRef`); if two stop events fire in quick succession, lock may cause double-submission or missed submission
- Safe modification: Use flag in closure instead of ref; test with rapid session start/stop cycles; add timeout to prevent hanging state
- Test coverage: None

## Scaling Limits

**LocalStorage Size Cap for Run History:**
- Current capacity: ~5-10 MB on most browsers (varies); each run with full analysis ~50KB uncompressed
- Limit: After ~100-200 runs, localStorage approaches quota; IndexedDB not used
- Scaling path: Migrate to IndexedDB with automatic cleanup (keep last 500 runs); implement pagination; add cleanup job to remove runs >6 months old

**Supabase Storage Bucket Limits:**
- Current capacity: 50 MB per file; no hard limit on bucket size (depends on plan)
- Limit: Bucket could fill quickly if many users upload 50 MB PDFs
- Scaling path: Implement soft quota per user (100 MB); add cleanup job for orphaned files; transition to Postgres Large Objects if PPTX/PDF storage becomes too expensive

**Concurrent WebSocket Connections:**
- Current capacity: Browser can maintain ~6-10 concurrent WebSockets; server backend may have lower limits
- Limit: If server is shared and reaches connection limit, new sessions fail silently (connection timeout)
- Scaling path: Implement backpressure—queue new sessions if server is saturated; add explicit error message when connection pool exhausted

**Head Tracking MediaPipe Model:**
- Current capacity: Runs on main thread, ~30 FPS on modern devices; 60 FPS on high-end
- Limit: Low-end Android phones, older laptops drop to 5-10 FPS with stuttering
- Scaling path: Implement adaptive frame rate based on device capability; test on target device fleet; consider TensorFlow Lite for Android

## Dependencies at Risk

**pdf-parse Worker Path Hardcoding:**
- Risk: Worker path assumes `node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs` exists; npm updates or monorepo setups could break this
- Files: `services/deckService.ts` (lines 60-64)
- Impact: PDF extraction silently fails with cryptic worker error
- Migration plan: Use `import.meta.url` or dynamic import to resolve worker path; fallback to CDN if local path unavailable

**MediaPipe Tasks Vision:**
- Risk: Binary download (180+ MB) required at install time; network issues during CI/CD installation
- Files: `lib/headTracking/useHeadTracking.ts` (lines 4-10 imports)
- Impact: Build failures in offline/restricted environments
- Recommendation: Pre-cache binary in Docker image or use vendor-bundled version; add mirror fallback

**@supabase/supabase-js Version Pinning:**
- Risk: Currently at 2.97.0; types may break with major version bumps
- Files: `lib/supabase.ts`, all API routes using Supabase client
- Impact: Type errors after `npm update`
- Recommendation: Keep on current major version until breaking changes are reviewed; test upgrading in CI before merging

## Missing Critical Features

**Error Recovery and Retry Logic:**
- Problem: If LLM call fails (timeout, rate limit, provider down), analysis fails immediately with no automatic retry
- Blocks: User cannot resubmit same pitch without transcribing again; bad UX on unreliable networks
- Files: `services/judgeAgentService.ts`, `controllers/pitchController.ts`
- Fix: Implement exponential backoff with 3 retries; store queue of failed runs; add manual retry button on error page

**Real-Time WebSocket Reconnection:**
- Problem: If server disconnects during recording, STT gracefully stops but user loses live checklist feedback and must restart
- Blocks: Cannot continue recording if network hiccup occurs; no graceful degradation
- Files: `hooks/useSTT.ts` (WebSocket onclose handler at line 437)
- Fix: Implement auto-reconnect with exponential backoff; buffer audio while disconnected; resume when connection restores

**Undo/Replay for Session Metrics:**
- Problem: If user accidentally starts session with wrong mode, no way to switch without starting over
- Blocks: Wastes time for demo/testing; frustrating if mode is realized mid-recording
- Files: `app/(app)/session/page.tsx` (pitch mode selection fixed at line 50)
- Fix: Allow mode change while `!isSessionActive`; add "Start Over" button that clears metrics but keeps transcript

**Export/Share Analysis Results:**
- Problem: No way to export analysis as PDF, JSON, or share a link
- Blocks: Users cannot easily send results to co-founders or advisors
- Files: `app/(app)/results/[runId]/page.tsx`
- Fix: Add export menu with PDF (use @react-pdf/renderer) and JSON options; generate shareable links with expiry

## Test Coverage Gaps

**useSTT Hook Integration:**
- What's not tested: WebSocket message ordering, resume/stop/pause state machine, microphone permission denial, network timeout recovery
- Files: `hooks/useSTT.ts`
- Risk: Changes to WebSocket lifecycle could introduce silent failures; mode switching bugs could go unnoticed
- Priority: High (core feature)

**Session Page Auto-Submit Effect:**
- What's not tested: Race conditions between recorder.stopRecording() and analysis submission, empty transcript handling, audio upload failure recovery
- Files: `app/(app)/session/page.tsx` (lines 216-281)
- Risk: Double-submissions, lost data, stale state leaks between sessions
- Priority: High (user-facing data integrity)

**PDF Extraction and Validation:**
- What's not tested: Corrupted PDFs, non-UTF8 text extraction, large PDFs (>1000 pages), PDFs with images only (no text)
- Files: `services/deckService.ts` (extractPdfText, convertPptxToPdf)
- Risk: Unhandled crashes on edge case files; poor error messages
- Priority: Medium (data import)

**Head Tracking Engagement Band Calculation:**
- What's not tested: Calibration logic, state transitions (facing→away→down), extreme poses, edge cases (user blinking, partial face in frame)
- Files: `lib/headTracking/useHeadTracking.ts`, `lib/headTracking/engagementBand.ts`
- Risk: False positive/negative engagement scores; user frustration with inaccurate feedback
- Priority: Medium (feature quality)

**API Route Validation:**
- What's not tested: Invalid JSON bodies, missing required fields, oversized payloads, SQL injection attempts (if raw SQL used anywhere), XSS in transcript field
- Files: `app/api/pitch/run/route.ts`, `app/api/pitch/run/[runId]/route.ts`, `app/api/deck/upload/route.ts`
- Risk: Crashes, data corruption, security vulnerabilities
- Priority: High (security)

**Analyt Page Rendering with Large Run Lists:**
- What's not tested: Performance with 1000+ runs, memory leaks with rapid pagination, sorting stability
- Files: `app/(app)/analytics/page.tsx`
- Risk: OOM crashes on larger accounts, poor UX
- Priority: Medium (scale testing)

---

*Concerns audit: 2026-02-22*
