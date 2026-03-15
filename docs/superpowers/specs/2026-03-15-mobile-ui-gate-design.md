# Mobile UI Gate — Design Spec

## Overview

Add a separate mobile UI layer to Pitchr that activates when a phone is detected. The desktop/landscape experience stays completely untouched. The mobile UI shares the same backend, API layer, auth flow, and routing — only the presentation layer changes.

## Goals

- Phone users get a purpose-built mobile experience, not a squashed desktop layout
- Desktop users see zero changes to their experience
- Mobile bundle is significantly lighter (no Three.js, GSAP scroll plugins, Remotion)
- Load times are tracked side-by-side between mobile and desktop with measurable targets

## Non-Goals

- Tablet-specific layout (tablets get desktop view; see tablet handling in section 1)
- Native app or PWA offline-first capabilities
- Redesigning the marketing pages (responsive CSS fixes only)
- Changing any backend, API, or data layer

---

## 1. Detection & Routing Architecture

### Server-Side Detection

**Middleware scope:** Expand the matcher in `middleware.ts` to cover all page routes while excluding static assets. Use the standard Next.js exclusion pattern:

```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)']
```

This ensures UA detection runs on page navigations (including marketing, auth, and public routes) but not on static asset fetches. The UA detection is a lightweight addition that runs before the existing auth check.

On the first request, parse the `User-Agent` header to detect mobile phones (not tablets). Set a cookie (`x-device-type: mobile | desktop`) with `path=/`, `SameSite=Lax`, `Secure` (in production), and no `max-age` (session cookie — re-evaluated on each browser session).

**Response propagation:** The existing `updateSession()` in `lib/supabase/middleware.ts` constructs its own `NextResponse` objects internally, which would discard any cookie set beforehand. To fix this, the device detection logic must be integrated **inside** `updateSession()` so the `x-device-type` cookie is set on the same response object that `updateSession` returns. This requires modifying `lib/supabase/middleware.ts` — not just the top-level `middleware.ts`. The change is small: after `updateSession` creates its response, append `response.cookies.set('x-device-type', detectedType, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })` before returning.

**Tablet handling:** Tablets are classified as `desktop`. Detection uses UA phone indicators (e.g. `Mobile` token in Chrome UA, `iPhone` but not `iPad`). An iPad in portrait (768px) gets the desktop sidebar layout. This is intentional — the sidebar fits at 768px and the desktop experience is better on tablet-sized screens.

### Layout Architecture

**Root layout (`app/layout.tsx`):** This is already mostly a Server Component (meta tags, theme script, analytics). It becomes device-aware by reading the `x-device-type` cookie via `cookies()` and:
- Rendering different font `<link>` tags based on device type (see section 5 font optimization)
- Adding `viewport-fit=cover` to the viewport meta export (required for `env(safe-area-inset-bottom)` on iOS)
- Passing `deviceType` down via a `<DeviceTypeProvider>` context wrapper so all route groups can access it

This is the first point where device-type branching occurs, and it covers **all** route groups including `(app)`, `(auth)`, `(marketing)`, and `(public)`.

**App layout (`app/(app)/layout.tsx`):** The current `'use client'` component wrapping 7 nested providers. To enable server-side cookie reading without breaking this structure:

1. **Extract a Server Component wrapper:** Create `app/(app)/layout.tsx` as a Server Component that reads the `x-device-type` cookie via `cookies()` and passes `deviceType` as a prop to a new `AppLayoutClient` component. (Server Components cannot use `useContext`, so the cookie is the source of truth at this layer.)
2. **`AppLayoutClient`** is the existing `'use client'` layout logic (providers, sidebar, etc.), now receiving `deviceType` as a prop.
3. The client component conditionally renders `<DesktopAppShell>` or `<MobileAppShell>` based on the prop.
4. **`EarlyAdopterClaimer`** and other renderless components sit inside `AppLayoutClient` above the shell conditional, so they run in both mobile and desktop shells.

This is a structural refactor of the layout file, but the provider tree and all child components remain identical.

**Marketing layout (`app/(marketing)/layout.tsx`):** No shell changes. Marketing pages remain CSS-fix-only. The `deviceType` value is available via `DeviceTypeProvider` if any marketing component needs to conditionally skip heavy desktop elements in the future, but this is not required for the initial implementation.

### Hydration Safety

The `deviceType` prop flows from server to client as a static value — no mismatch is possible because the server and client render the same shell based on the same cookie value. There is no client-side fallback that disagrees with the server.

The `useDeviceType()` hook simply reads the prop from context (set by `AppLayoutClient`). It does **not** check `window.innerWidth` or override the server decision. If a desktop user opens DevTools mobile view, they still get the desktop shell — this is correct behavior (they're on a desktop browser).

### Code Splitting

Desktop-heavy components are excluded from the mobile bundle using conditional rendering, not conditional `dynamic()` calls:

```tsx
// At module level (always)
const OrbPreview = dynamic(() => import('./OrbPreview'));

// In JSX (conditionally rendered)
{deviceType === 'desktop' && <OrbPreview />}
```

When `deviceType === 'mobile'`, the `<OrbPreview>` component never renders, so the chunk is never requested by the browser. The bundler may still generate the chunk, but mobile clients never download it.

---

## 2. Mobile App Shell & Navigation

### Bottom Tab Bar

- Fixed to viewport bottom, 56px tall + `env(safe-area-inset-bottom)` padding for notched phones
- 5 tabs: **Dashboard**, **Session**, **History**, **Projects**, **More**
- Active tab: `var(--accent)` (#ff5941). Inactive: `var(--text-muted)`
- Session tab visually emphasized (slightly larger icon or accent ring) as the primary action
- Glass morphism background: `var(--bg-surface)`, backdrop blur, `border-top` with `var(--border-color)`
- Hides during an active recording session to maximize screen space

### "More" Menu

- Tapping "More" opens a bottom sheet (not a new page)
- Contains: Settings, Insights, Progress, Arena, Q&A, Upload
- Includes project selector (current project name as tappable row, expands inline)
- Theme toggle and billing status live here
- Same glass card styling as the rest of the app

**Navigation from "More" items:** Tapping an item (e.g. Settings) closes the sheet and navigates to that page. The bottom tab bar remains visible with the **"More" tab highlighted** (standard iOS/Android pattern — "More" stays active when viewing any of its sub-pages). The header bar shows the sub-page title. Tapping any primary tab navigates away normally.

### Header Bar

- Replaces the sidebar's contextual role. Slim top bar (48px):
  - Page title (left-aligned, 16px semibold)
  - Active project name as a tappable pill/badge (opens project switcher bottom sheet)
- No hamburger menu — bottom tabs handle all navigation

### Page Transitions

- No animated transitions between tabs — instant swap for speed
- Scroll position preserved per tab using a context-based store (`MobileScrollContext`) that continuously saves `window.scrollY` on scroll events (debounced at 100ms), keyed by pathname. On navigation back to a tab, the stored position is restored via `window.scrollTo()` after the page component mounts. This continuous-save approach avoids the timing problem of trying to capture scroll position at navigation time (App Router transitions are async and there is no reliable `beforeNavigation` event). The scroll map is capped to entries for the 5 primary tab routes plus known "More" sub-pages — entries for unknown pathnames are evicted when the map exceeds 15 entries.

### SidebarProvider Decoupling

The mobile shell does **not** wrap with `SidebarProvider`. The session recording state currently entangled with sidebar UI state is separated:

**What moves to `SessionStateContext`:**
- `isSessionActive`, `onStartSession`, `isProjectSwitchLocked`
- `registerSession(callbacks)`, `unregisterSession()`
- The callbacks that the session page currently registers via `useSidebarSession()`

**What stays in `SidebarProvider` (desktop-only):**
- `isSidebarOpen`, `toggleSidebar`, `closeSidebar`
- Sidebar UI state and animations

**Provider tree placement:** `SessionStateContext` sits inside `AppLayoutClient`, above the shell conditional, so both `DesktopAppShell` and `MobileAppShell` can access it. `SidebarProvider` wraps only `DesktopAppShell`.

**Migration:** The existing `useSidebarSession()` hook is replaced by `useSessionControl()` which reads from `SessionStateContext`. The session page (`app/(app)/session/page.tsx`) switches to `useSessionControl()`. The desktop sidebar's "Start Session" button also reads from `SessionStateContext` instead of its own internal state. This is a breaking internal API change but the external behavior is identical.

---

## 3. Mobile Session Page (Tabbed Layout)

### Structure

Two tabs at the top of the session page: **Record** and **Metrics**. Each gets the full screen. A persistent control bar sits at the bottom.

### Record Tab

- Camera feed fills the space between tab bar and control bar
- Floating overlays on camera:
  - Top-left: recording indicator (pulsing dot + elapsed time) in blurred dark pill
  - Top-right: slide counter ("2 / 8") in same pill styling
- Slide counter hides when no deck is loaded
- Camera-off (mic-only) mode: centered waveform visualization instead of black screen

### Metrics Tab

Scrollable vertical layout:
- 2x2 grid of metric cards (WPM, Fillers, Duration, Energy) with rolling digit animations (same `RollingChar` component as desktop)
- Pitch Checklist with live check/pending states
- Live Rubric category bars (Structure, Clarity, Evidence, Market, Delivery)
- Beat Progress section (if available)
- Engagement band indicator (if camera is on)
- All data from same `useSessionState()` and `MetricValues` — no duplication

### Persistent Control Bar

- Camera toggle, skip-back, pause/play (primary), stop (danger), skip-forward, timer
- No mic toggle (mic is always required for pitching)
- Sits above the bottom tab bar area (which is hidden during active session)

### Pre-Session Config

- Before recording, the Record tab shows deck selector and mode/duration settings in a compact stacked form
- Once recording begins, config collapses and camera takes over

### Mobile getUserMedia Considerations

Mobile browsers have significant differences from desktop for media capture:
- **iOS Safari:** Requires explicit user gesture to start `getUserMedia`. The "Start Session" button tap satisfies this.
- **Background interruption:** When the user switches apps or locks the screen, the media stream may be killed. Detect this via the `MediaStreamTrack.onended` event. On stream loss: pause the session timer, show a "Recording paused — tap to resume" overlay, and restart the stream when the user returns.
- **Screen lock:** Add `navigator.wakeLock.request('screen')` during active recording to prevent auto-lock. Wrap in `try/catch` — this is progressive enhancement (supported in Safari 16.4+ and modern Chrome, but can fail silently). Release on session end.
- **Orientation lock:** Request portrait lock via `screen.orientation.lock('portrait')` during recording. Wrap in `try/catch` — this API is **not supported in iOS Safari** and is Android/Chrome-only. On iOS, accept that the user may rotate and ensure the session UI handles landscape gracefully (camera feed scales, controls remain accessible).

---

## 4. Mobile Page Adaptations

### Dashboard

- Single column layout
- ScoreRing centered at top, full width
- Stats cards stack vertically
- RadarChart scales to container width (SVG-based)
- CoachSummary, Insights, Recommendations: full-width stacked cards
- Recent runs as compact list

### Results (`/results/[runId]`)

- Single column (remove the `xl:grid-cols-2` split)
- ScoreHero scales down (already uses `clamp()`)
- RewriteDiffPanel: horizontal scroll on diff view instead of side-by-side
- TopFixes, SectionAccordion, VocabDiagnostics work as-is (already vertical)
- Share card simplified: fewer visible options, rest behind "more" action

### History

- Always list view on mobile (no grid toggle)
- Search input full-width at top
- Mode filter pills horizontally scrollable (no wrapping)
- Run cards show condensed info (score, date, mode) — tap to expand via RunDetailModal

### Projects

- Single column card list
- "New project" as floating action button, positioned at `bottom: calc(56px + env(safe-area-inset-bottom) + 16px)` to clear the tab bar. During active sessions (when tab bar is hidden), the FAB repositions to standard `bottom: 16px`.

### Settings

- Works mostly as-is (`max-w-3xl mx-auto`)
- Tab bar becomes horizontally scrollable pill bar
- Form inputs full width with min 44px height touch targets

### Auth Pages

- Already centered card layout with `max-w-[380px]` — no changes needed

---

## 5. Performance Strategy

### Mobile Bundle Exclusions

| Component | Approx Size (gzipped) | Replacement on Mobile |
|-----------|----------------------|----------------------|
| Three.js + GLSL shaders | ~150KB | Not rendered |
| GSAP ScrollTrigger | ~15KB | Not loaded |
| Remotion | ~80KB | Not loaded |
| Full MetricsPanel sidebar | ~8KB | MobileMetricsTab |
| PIP overlay logic | ~3KB | Not rendered |

Exclusion via conditional JSX rendering (see section 1 code splitting pattern).

### Image Optimization

- Create 640px-wide mobile variants of hero images (hero-bg.webp: 137KB -> ~40KB mobile)
- Compress apple-touch-icon.png from 867KB to under 100KB
- Use Next.js `<Image>` with `sizes` prop for responsive serving

### Font Optimization

The current root layout (`app/layout.tsx`) loads all fonts via a single Google Fonts script injection. To split by device:

- Convert `app/layout.tsx` to a Server Component (it's mostly static already — theme script, meta tags, analytics)
- Read the `x-device-type` cookie server-side
- Render different font `<link>` tags:
  - **Mobile:** Inter (400, 500, 600) + `display=swap`
  - **Desktop:** Inter (400, 500, 600, 700, 800) + Instrument Serif + JetBrains Mono
- Instrument Serif lazy-loaded on mobile via a small client component (`<LazyFont href="..." />`) that appends a `<link rel="stylesheet">` to `<head>` on mount, placed only in results/dashboard page components that use serif headings

### Caching

- Supabase auth token cache: 30s (already implemented)
- Prefetch next likely route (e.g. Dashboard -> prefetch Session page chunk)
- Browser HTTP caching via Next.js defaults for static assets

---

## 6. Load Time Tracking

### Metrics Captured (tagged by device type)

| Metric | Description | Mobile Target | Desktop Target |
|--------|-------------|---------------|----------------|
| FCP | First Contentful Paint | < 1.5s | < 1.0s |
| LCP | Largest Contentful Paint | < 2.5s | < 1.8s |
| INP | Interaction to Next Paint | < 200ms | < 100ms |
| CLS | Cumulative Layout Shift | < 0.1 | < 0.1 |
| TTI | Time to Interactive | < 3.5s | < 2.0s |
| Bundle Size | JS shipped to client | < 250KB gz | < 350KB gz |
| Session Start | Tab to recording ready | < 2.0s | < 1.5s |
| Results Load | Full results page render | < 1.5s | < 1.0s |

### Implementation

- Extend Vercel Analytics + Speed Insights to tag events with `device_type` from cookie
- Add `performance.mark()` / `performance.measure()` at key milestones (session ready, results rendered, dashboard painted)
- Comparison dashboard via Vercel analytics API showing mobile vs desktop side-by-side
- Lighthouse CI in build pipeline with separate mobile/desktop configs; builds fail if mobile scores drop below thresholds

---

## 7. Deep Linking & Cold Start

When a user opens a shared URL (e.g. `/results/abc123`) on mobile for the first time:

1. The middleware runs on all routes (expanded matcher), so the `x-device-type` cookie is set on the very first request.
2. The Server Component layout reads the cookie and renders the correct shell.
3. If the page requires auth, the existing auth redirect flow handles it — the device cookie persists through the redirect.

No special handling needed. The middleware expansion in section 1 ensures the cookie exists on every route.

---

## 8. Testing Strategy

### Unit Tests (Vitest)

- `useDeviceType()` hook: test that it reads context value correctly
- UA parsing utility: test with a matrix of real-world UA strings (iPhone, Android, iPad, desktop Chrome, etc.)
- `MobileScrollContext`: test save/restore behavior

### E2E Tests (Playwright)

- Add mobile viewport tests using Playwright's `devices` presets:
  - `iPhone 13`: full session flow (start recording, check metrics tab, stop, view results)
  - `Pixel 5`: navigation flow (all tabs, "More" sheet, project switching)
- Run the same test suite at desktop viewport to verify no regressions
- Cookie-based detection: test that setting `x-device-type: mobile` cookie renders mobile shell even at desktop viewport (verifies server-side detection)

### Performance Tests

- Lighthouse CI mobile config with score thresholds
- Bundle size assertions: fail CI if mobile JS exceeds 250KB gzipped

---

## 9. File Structure

New mobile components live in a dedicated subdirectory:

```
views/
  components/
    mobile/
      MobileAppShell.tsx      # Bottom tab bar shell wrapper
      BottomTabBar.tsx         # Fixed bottom navigation
      MobileHeader.tsx         # Slim top bar with title + project pill
      MoreSheet.tsx            # Bottom sheet for secondary nav
      MobileSessionPage.tsx    # Tabbed session container
      MobileMetricsTab.tsx     # Metrics grid + checklist + rubric
      MobileRecordTab.tsx      # Camera view with floating overlays
      MobileScrollContext.tsx  # Scroll position preservation
```

Modified files:
- `app/layout.tsx` — add `viewport-fit: cover` to viewport export, `DeviceTypeProvider` wrapper, conditional font `<link>` tags
- `app/(app)/layout.tsx` — refactor to Server Component + `AppLayoutClient`
- `lib/supabase/middleware.ts` — integrate UA detection inside `updateSession()`, set `x-device-type` cookie on the response object it returns
- `middleware.ts` — expand matcher to cover all routes

New shared state:
- `contexts/SessionStateContext.tsx` — extracted from `SidebarProvider`, shared between desktop sidebar and mobile control bar
- `contexts/DeviceTypeContext.tsx` — provides `deviceType` to all route groups

New utilities:
- `hooks/useDeviceType.ts` — reads device type from `DeviceTypeContext`
- `hooks/useSessionControl.ts` — replaces `useSidebarSession()`, reads from `SessionStateContext`
- `lib/detectDevice.ts` — UA parsing utility (used by middleware)
- `lib/performance.ts` — custom performance marks and device-tagged reporting

---

## 10. Boundaries

### Changes

- `app/layout.tsx` — `DeviceTypeProvider`, conditional font loading, `viewport-fit: cover`
- `app/(app)/layout.tsx` — refactored to Server Component wrapper + `AppLayoutClient`
- `lib/supabase/middleware.ts` — UA detection integrated into `updateSession()`
- `middleware.ts` — matcher expanded to all routes
- `SessionStateContext` extracted from `SidebarProvider` (shared state)
- `useSidebarSession()` replaced by `useSessionControl()` (session page updated)
- New mobile component set (8 components in `views/components/mobile/`)
- Performance instrumentation module
- Marketing page responsive CSS fixes (no new components)
- Image asset mobile variants
- E2E test suite additions for mobile viewports

### Does NOT Change

- Desktop visual appearance and behavior (zero pixel changes)
- Backend, API routes, edge functions, Supabase schema
- Auth flow, billing flow, project management logic
- All data hooks and controllers (shared between both shells)
- Routing structure (same URLs, same pages)
- Dark/light theme system
- `(auth)` and `(marketing)` layout structures (auth works as-is, marketing gets CSS fixes only)
