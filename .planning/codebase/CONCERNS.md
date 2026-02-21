# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

**Monolithic Page Components:**
- Issue: Large page components contain all UI logic inline without extraction, making them difficult to test and maintain.
- Files:
  - `app/(app)/analytics/page.tsx` (667 lines)
  - `app/(app)/history/page.tsx` (597 lines)
  - `app/(app)/settings/page.tsx` (593 lines)
  - `app/(app)/deck/page.tsx` (422 lines)
- Impact: High cognitive complexity per file, difficult to identify and fix bugs, component reuse not possible, testing limited to full-page tests.
- Fix approach: Extract reusable sub-components (cards, sections, lists) into separate files in `views/components/`. Create a component library structure: `views/components/[FeatureName]/[ComponentName].tsx`.

**Mock Data Embedded in Components:**
- Issue: Hard-coded mock data (MOCK_SESSIONS, MOCK_CHECKLIST, SCORE_TREND, etc.) lives inline in page components instead of centralized mock data modules.
- Files:
  - `app/(app)/analytics/page.tsx` (lines 18-141)
  - `app/(app)/history/page.tsx` (lines 18-200+)
  - `app/(app)/dashboard/page.tsx` (lines 18-100+)
  - `app/(app)/deck/page.tsx` (lines 19-102)
  - `hooks/useSessionState.ts` (lines 44-71)
- Impact: When real API integration occurs, every component needs manual updates. Mock data changes are scattered across the codebase.
- Fix approach: Create `lib/mocks/` directory with separate files for each domain (sessions, decks, analytics, etc.). Export factory functions for generating consistent mock data structures.

**Unimplemented Backend Infrastructure:**
- Issue: Empty placeholder directories with only `.gitkeep` files suggest future backend functionality that hasn't been implemented.
- Files:
  - `controllers/` (deck, feedback, qna, session all empty)
  - `lib/` (audio, scoring, video all empty)
  - `models/` (empty)
- Impact: Critical features (audio analysis, scoring, QnA) cannot be used until implemented. Application is purely frontend with mock data.
- Fix approach: Prioritize backend implementation roadmap. Create issue tracking for each module: audio processor, scoring engine, session recorder. Consider API layer abstraction before real backends are added.

**Error Handling Suppressed:**
- Issue: Error handlers explicitly ignore errors with empty catch blocks.
- Files:
  - `hooks/useMediaStream.ts` (lines 42, 64): `catch(() => {})` on video.play() calls
  - `views/components/SessionCanvas.tsx` (lines 258-260): Empty catch for autoplay errors
- Impact: Silent failures on media stream issues (no camera, no microphone permission denied). Users get black screen with no feedback.
- Fix approach: Replace empty catches with proper error logging and user-facing toast/modal notifications. Use `console.warn()` or error boundary context for debugging.

**Theme State Duplication:**
- Issue: Orb state is managed in both `useSessionState` hook and `ThemeProvider` context, creating potential sync issues.
- Files:
  - `hooks/useSessionState.ts` (line 74): manages `orbState`
  - `views/components/ThemeProvider.tsx` (line 41): manages `orbState`
  - `app/(app)/session/page.tsx` (lines 17-19): syncs them with useEffect
- Impact: Manual sync required, state can become out of sync if one source updates before the other is notified.
- Fix approach: Move orb state to ThemeProvider as the single source of truth. Remove from useSessionState or keep as callback-based updates only.

## Known Bugs

**MediaStream Not Released on Unmount:**
- Symptoms: Memory leak on navigation; camera/microphone resources remain allocated even after leaving session page.
- Files: `hooks/useMediaStream.ts` (lines 23-57)
- Trigger: Navigate to session page (stream acquired), then navigate away.
- Workaround: Browser refresh clears resources.
- Root cause: The cleanup function marks `active = false` but doesn't guarantee all pending state updates are cancelled; stream tracks should be stopped in all code paths.

**Speech Bubbles Never Expire in Session:**
- Symptoms: Speech bubble array grows indefinitely during long sessions, causing performance degradation.
- Files: `hooks/useSessionState.ts` (lines 141-148)
- Trigger: Keep session active for >30 minutes.
- Cause: Expiration cleanup only runs when `speechBubbles` changes; if expiry loop stops, old bubbles persist.
- Impact: Memory accumulation, potential UI slowdown.
- Fix: Convert to sliding window or bound the array size to last 10 bubbles.

**Camera Overlay Click Doesn't Toggle Focus on Mobile:**
- Symptoms: Tap on camera overlay on mobile may not register due to button size (<48px).
- Files: `views/components/SessionCanvas.tsx` (lines 62-68, 73-79)
- Cause: Overlay button is `w-48 h-36` (192x144px) but on mobile this scales poorly.
- Impact: Usability on tablet/mobile devices.
- Fix: Ensure minimum touch target of 48x48px; test on iOS Safari.

## Security Considerations

**No Input Validation on Deck Search:**
- Risk: Unvalidated search input could expose to XSS if search results are rendered unsafely in future API integration.
- Files: `app/(app)/deck/page.tsx` (lines 156-164)
- Current mitigation: React automatically escapes JSX, so current inline mock data is safe.
- Recommendations: When integrating real API, sanitize all API responses. Use DOMPurify if rendering user-generated content.

**Media Stream Access Without Consent UI:**
- Risk: `useMediaStream` requests camera/microphone on mount without prior user warning. Browsers may deny on first load.
- Files: `hooks/useMediaStream.ts` (lines 29-32)
- Current mitigation: Error state is captured but not shown to user.
- Recommendations: Show permission request dialog before attempting to acquire media. Check `navigator.permissions.query()` first.

**No CSRF Protection on Form Submissions:**
- Risk: Once backend APIs are added, deck uploads and session submissions will lack CSRF tokens.
- Files: `app/(app)/deck/page.tsx` (lines 190-193): onDrop handler
- Current mitigation: No real submission yet (mock only).
- Recommendations: Use Next.js middleware for token generation; ensure all POST/PUT handlers require matching tokens.

## Performance Bottlenecks

**Large Animated Page Renders:**
- Problem: Analytics page animates all stat cards with staggered delays, creating multiple layout reflows.
- Files: `app/(app)/analytics/page.tsx` (lines 195-668)
- Cause: Individual `animate-fade-in-up` with sequential animationDelays on ~40+ elements.
- Improvement path: Use CSS animation groups or Framer Motion batch animations. Render off-screen and then transition in.

**Three.js Orb Rendering on Every State Change:**
- Problem: `SiriBubble` component re-renders 3D scene when orb state changes.
- Files: `views/components/SiriBubble/SiriBubble.tsx`, `views/components/SiriBubble/Orb.tsx`
- Cause: State changes (idle → active → positive) trigger full re-render; Three.js materials/shaders should update without scene recreation.
- Improvement path: Use `useFrame` hook from React Three Fiber to update shader values directly; avoid component re-renders.

**Metrics Panel Re-renders on Every Interval Update:**
- Problem: `useSessionState` updates metrics every 2 seconds, causing `MetricsPanel` and all sub-components to re-render.
- Files: `hooks/useSessionState.ts` (lines 97-103), `views/components/MetricsPanel.tsx`
- Cause: All metric state in single hook; no granular update batching.
- Improvement path: Use independent atoms (Jotai/Zustand) for each metric, or memoize `MetricsPanel` children with React.memo() and useCallback.

**No Image Optimization for Deck Thumbnails:**
- Problem: Deck cards render large gradient backgrounds and SVG icons without optimization.
- Files: `app/(app)/deck/page.tsx` (lines 331-373)
- Impact: With 100+ decks, no lazy loading or image resizing.
- Improvement path: Add Next.js Image component for real thumbnails; use CSS gradients as fallbacks.

## Fragile Areas

**Session State Simulation Logic:**
- Files: `hooks/useSessionState.ts` (lines 88-139)
- Why fragile: Hard-coded Math.random() intervals and arbitrary thresholds (0.15, 0.7, 0.85, 0.4) for simulation. Changing one number can break UX expectations (metrics grow too fast, checklist progresses unrealistically).
- Safe modification: Extract magic numbers to named constants at module top. Add JSDoc explaining simulation intent. Create unit tests for state progression patterns.
- Test coverage: No tests exist for useSessionState; impossible to verify metric bounds or checklist progression.

**MediaStream Toggle State Consistency:**
- Files: `hooks/useMediaStream.ts` (lines 67-83), `views/components/SessionCanvas.tsx`
- Why fragile: `isCameraOn` and `isMicOn` state in hook; track.enabled in browser; UI button state all must stay in sync. If track.enable fails silently, UI state is wrong.
- Safe modification: Always return result of track.enable(); validate state before toggling. Add defensive checks.
- Test coverage: No tests for toggle behavior or error scenarios.

**Theme Aura Color Calculation:**
- Files: `views/components/ThemeProvider.tsx` (lines 6-21)
- Why fragile: Hard-coded RGBA colors for aura gradients. CSS custom properties for theme colors live elsewhere in `globals.css`. If color palette is updated, aura colors become mismatched.
- Safe modification: Consider moving AURA_COLORS to CSS custom properties or a shared theme config file. Generate aura colors dynamically from primary color.
- Test coverage: No visual regression tests; aura appearance changes are manual.

**Speech Bubble Expiration Cleanup:**
- Files: `hooks/useSessionState.ts` (lines 142-148)
- Why fragile: Cleanup timer is set in a separate useEffect that depends on speechBubbles array. If bubbles stop being added, cleanup stops too.
- Safe modification: Use a single interval that runs constantly (not triggered by state changes). Or use a more robust solution with timestamps checked on every render.

## Scaling Limits

**Single State Hook for All Session Data:**
- Current capacity: Works fine for 1 active session with <100 bubbles, 8 checklist items, 2 metrics fields.
- Limit: Real speech bubbles could be thousands during long sessions; metrics history unbounded.
- Scaling path: Move to incremental metrics tracking (store only last 50 data points). Use separate state management (Zustand/Redux) for session history. Archive completed sessions to database.

**Mock Data Array Size:**
- Current capacity: MOCK_SESSIONS in History page has 100+ items; MOCK_DECKS has 6 items.
- Limit: With 10,000 sessions, in-memory array filtering becomes slow.
- Scaling path: Implement pagination/virtualization. Use server-side search when API is added.

**Animation Frame Budget:**
- Current capacity: ~50 animated elements per page with requestAnimationFrame calls.
- Limit: Mobile devices (60fps target) will drop frames with 100+ simultaneous animations.
- Scaling path: Reduce animation counts per page. Use CSS animations instead of JS state updates where possible.

## Dependencies at Risk

**Three.js Major Version (0.183.1):**
- Risk: Three.js releases frequently and contains breaking changes. No version lock strategy in place.
- Impact: Next major release (r185+) could break SiriBubble component.
- Migration plan: Pin to `^0.183.1` with careful testing of minors. Consider extracting Orb into a composable that doesn't depend on specific Three.js internals.

**React 19.2.4 Experimental Features:**
- Risk: React 19 is recent; some features still stabilizing.
- Impact: Use Compiler, server components, or transitions could have unexpected behavior.
- Migration plan: Test against React canary releases; report issues upstream.

**Tailwind CSS with Custom CSS Variables:**
- Risk: Heavy reliance on `var(--bg-surface)` custom properties alongside Tailwind classes. No type safety.
- Impact: Typos in CSS variable names are runtime errors not caught by linter.
- Migration plan: Consider switching to CSS-in-JS (styled-components, emotion) or Tailwind's config for all colors, then leverage its type-checking.

## Missing Critical Features

**No Data Persistence:**
- Problem: All data (sessions, decks, analytics) is mock and lost on refresh.
- Blocks: Cannot retain user progress, build learning curves, or provide analytics.

**No Real Media Analysis:**
- Problem: Metrics (WPM, filler words, clarity scores) are simulated, not real.
- Blocks: Core value proposition (coaching feedback) is non-functional.

**No Authentication:**
- Problem: No user accounts, login, or multi-user support.
- Blocks: Cannot deploy to production or serve multiple users.

**No Slide Deck Integration:**
- Problem: Slide Viewer shows placeholder; no PDF/PPTX parsing.
- Blocks: Users cannot upload their own decks.

**No Recording/Playback:**
- Problem: Sessions are not recorded; cannot review past recordings.
- Blocks: Users cannot study their own performance.

## Test Coverage Gaps

**useSessionState Hook:**
- What's not tested: Metric simulation bounds, checklist progression logic, speech bubble expiration, interval cleanup on session stop.
- Files: `hooks/useSessionState.ts`
- Risk: State mutations could produce invalid values (negative WPM, out-of-range scores) without detection.
- Priority: High — this is core session logic.

**useMediaStream Hook:**
- What's not tested: Error handling paths, track toggle behavior, cleanup on unmount.
- Files: `hooks/useMediaStream.ts`
- Risk: Silent failures leave camera/mic in inconsistent states.
- Priority: High — affects user experience and device resource management.

**SessionCanvas Component:**
- What's not tested: Focus mode toggle, camera overlay interactions, media control button states.
- Files: `views/components/SessionCanvas.tsx`
- Risk: UI state could diverge from actual media state.
- Priority: Medium — visual component, caught in manual testing.

**Page Components (Analytics, History, Deck, Settings, Dashboard):**
- What's not tested: Rendering, filtering, sorting, animations.
- Files: `app/(app)/**/page.tsx`
- Risk: Large refactors could silently break UI; no regression detection.
- Priority: Medium — can be covered with snapshot or visual tests.

**MetricsPanel and InsightCard Components:**
- What's not tested: Metric display formatting, color coding logic, insight rendering.
- Files: `views/components/MetricsPanel.tsx`
- Risk: Display bugs (wrong colors, truncated text) only visible in manual testing.
- Priority: Low — cosmetic, but important for UX.

---

*Concerns audit: 2026-02-21*
