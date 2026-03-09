# Pitchr Landing Page — Animated Product Demo Sections (V2)

Build 4 full-width animated product demo sections for the Pitchr landing page. Each section is a **silent demo video** — a self-playing animated sequence that shows the real product in action, no explanatory text needed. The animations themselves tell the story by showing real-world problems and how Pitchr solves them.

**The Notion model:** Notion's landing page doesn't explain features with text blocks + animated widgets. It shows a miniaturized replica of the actual Notion interface, with a cursor moving around, typing, dragging blocks, and the UI responding in real-time. The interface IS the explanation. That's what we're building.

## Context

- Landing page: `views/components/landing/LandingClient.tsx` with styles in `app/(marketing)/landing.css`
- Brand: coral `#ff5941`, orange `#ffaa33`, dark `#e63b26`, glass surfaces with `backdrop-blur`
- Existing libs: GSAP (already used in HeroPresenterTiles), CSS keyframes, Intersection Observer
- Theme: CSS custom properties (`--bg`, `--bg-card`, `--text`, `--border`, `--accent`, etc.) light/dark
- Components: named exports, `'use client'`, `@/*` imports, Tailwind + CSS variables
- Use `yarn` only, never `npm`
- Score color: `hsl(score * 1.2, 72%, 45%)` — red at 0, green at 100
- Score bands: 0-39 red `#ef4444`, 40-59 orange `#ffaa33`, 60-79 blue `#3b82f6`, 80-100 green `#22c55e`

## CRITICAL DESIGN PRINCIPLE: Show, Don't Tell

Every section follows this pattern:
1. **No descriptive text blocks** — the animated demo IS the content
2. **Only a short headline** above each demo (max 6 words) — e.g., "Stop guessing. Start closing."
3. **Full-width animated panel** that plays like a screen recording of the real app
4. **App chrome included** — sidebar, header, page structure visible (shrunk down) so it feels like watching someone use the real product
5. **Cursor animation** where appropriate — a fake cursor moving, clicking, typing to make it feel like a live demo
6. **Problem → Solution flow** — show the pain point first, then show Pitchr solving it

### Real Pitchr App Chrome (MUST include in demos)

Every mini-demo should be wrapped in a **miniaturized app shell** that matches the real app:

**Sidebar (slim, left side, ~40px wide in mini version):**
- Pitchr logo icon at top (small coral "P" or flame icon)
- 6 nav icons stacked vertically (matching real sidebar: Dashboard, Session, History, Analytics, Progress, Arena)
- Active page highlighted with coral accent
- Bottom: small avatar circle

**Top area of main content:**
- Page title text (small, bold) matching current demo context
- Optional action button (coral, small)

**Main content area:**
- The actual animated feature demo fills this space
- Uses real component layouts scaled down

This chrome should be subtle — thin lines, small icons, low opacity — so the demo content dominates but you still feel like you're looking at a real app.

### Real Component Reference Files (READ these for visual accuracy)

- `views/components/dashboard/ScoreRing.tsx` — SVG score ring (radius 80, strokeWidth 8, strokeDasharray/offset, HSL color, glow, center number + band label)
- `views/components/dashboard/RadarChart.tsx` — 5-point pentagon radar, concentric grids, coral fill polygon
- `views/components/results/ScoreHero.tsx` — score ring + 5 mini rubric rings + metric strip + verdict
- `views/components/results/ScoreDashboard.tsx` — rubric bars (6px, rounded, colored fill on `${color}18` track, stagger animation) + delivery metrics (icon + value + unit + status badge)
- `views/components/results/TopFixes.tsx` — rank badge circle (#1/#2/#3) + category + impact pill (high red/med orange/low gray) + issue text + green arrow + fix text, 3px colored left border
- `views/components/results/RewriteDiffPanel.tsx` — before/after script diff
- `views/components/progress/ScoreTimeline.tsx` — SVG line chart with colored zone bands, gradient fill under line, data point circles, glow on latest
- `views/components/SessionCanvas.tsx` — recording UI with slide viewer, camera view, toolbar buttons (mic/camera/play/stop)
- `views/components/MetricsPanel.tsx` — live metrics during session (WPM, fillers, checklist, rubric preview)

## Project Rules

- **Always use `yarn`** — never `npm`
- Named exports only, `'use client'` on interactive components
- `@/*` path alias for all non-relative imports
- `import type` for type-only imports
- 2-space indent, semicolons, single quotes (double in JSX)
- Tailwind for layout, CSS variables for theming
- PascalCase components, `use` prefix hooks, UPPER_SNAKE constants
- Do NOT add new dependencies — use GSAP, CSS keyframes, Intersection Observer, requestAnimationFrame
- Do NOT use default exports
- Run `yarn build` after completing each task to verify no TypeScript errors

## Key Files

- `views/components/landing/LandingClient.tsx` — main landing page
- `app/(marketing)/landing.css` — landing styles
- `CLAUDE.md` — full project conventions (READ THIS)

---

## Tasks

### Task 1: Create shared demo infrastructure

Create `views/components/landing/demos/` with:

**`useScrollPlay` hook:**
- Intersection Observer that triggers animation playback when element enters viewport
- Returns `{ ref, isPlaying, hasPlayed }` — `isPlaying` true while in view (first time), `hasPlayed` true after first play
- Options: `threshold` (0.2), `once` (true — play once, don't replay on scroll back)

**`DemoShell` component:**
- The miniaturized app shell wrapper used by ALL demo sections
- Renders a **scaled-down replica of the real Pitchr app chrome**:
  - Left sidebar (40-48px wide): Pitchr "P" logo icon at top, 6 small icon circles below (vertically stacked, 8px gap), active one has coral dot/highlight, bottom has avatar circle
  - Main area: thin top bar with small page title text (prop) + optional coral action button, then content area below
- Container: rounded-xl, border `var(--border-color)`, shadow, overflow hidden
- Background: `var(--bg-primary)` for sidebar, `var(--bg-surface)` for content
- **Aspect ratio:** 16:10 or similar, max-width ~700px on desktop, full-width on mobile
- Props: `title: string`, `activeNav?: number` (which sidebar icon is highlighted), `actionButton?: string`, `children` (the demo content)
- Must look convincing at a glance — like a screenshot of a real SaaS app

**`DemoCursor` component:**
- Animated fake cursor (small arrow pointer SVG, ~16px)
- Animates position via CSS transforms based on a sequence of `{ x, y, duration, action? }` waypoints
- Actions: `'click'` (cursor does a small press animation + ripple at click point), `'type'` (cursor disappears, typing begins)
- Smooth easing between waypoints: `cubic-bezier(0.33, 1, 0.68, 1)`
- Appears/disappears naturally (fade in at start, fade out when not needed)

**CSS in `landing.css`:**
- `.demo-shell` styles (the app chrome)
- `.demo-cursor` styles (pointer + click ripple)
- Keyframes: `cursorClick` (scale 0.85 → 1), `rippleExpand` (scale 0 → 1.5, opacity 1 → 0), `fadeSlideUp`, `fadeSlideRight`, `barFill`, `ringFill`, `checkDraw`, `scatterOut`, `typeChar`
- `@media (prefers-reduced-motion: reduce)` — show static final state for all demos

**Success criteria:**
- `DemoShell` renders a convincing miniaturized app window with sidebar + header chrome
- `DemoCursor` moves smoothly between waypoints and performs click/type actions
- Shell looks like the real Pitchr app at ~40% scale
- Works in both light and dark mode
- Reduced motion shows static final-state screenshot

---

### Task 2: Section 1 — "Stop guessing. Start closing."

Create `views/components/landing/DemoSection1.tsx`.

**Layout:** Full-width section with just a centered headline above the demo.
- Headline: "Stop guessing. Start closing." (serif, ~40px, centered)
- Below: full-width `DemoShell` containing the animated sequence

**The Demo — "Bad Feedback vs. Pitchr" (plays on scroll-enter, ~8s total):**

This demo tells a story in two acts without any explanatory text. The viewer watches a founder get useless feedback, then sees Pitchr give precise, actionable analysis.

**ACT 1: The iMessage/Slack spam (0–3s)**

The demo shell shows a mock **messaging/feedback view** (not the Pitchr app yet — this is the "before" world):

- The shell temporarily hides the Pitchr sidebar chrome. Instead it shows a clean messaging-style layout (like iMessage or Slack threads) — no Pitchr branding yet
- A "conversation" between the founder and friends/mentors about their pitch:
- Messages appear rapidly (chat-bubble style, alternating left/right):
  - **(0–0.3s)** 👤 Founder: "Hey, can you listen to my pitch and give honest feedback?" (right-aligned, coral-tinted bubble)
  - **(0.3–0.7s)** 👤 Friend 1: "Yeah sounds great! Love the energy 🔥" (left, gray bubble)
  - **(0.7–1.1s)** 👤 Friend 2: "Maybe try adding more passion? Idk" (left, gray bubble)
  - **(1.1–1.5s)** 👤 Mentor: "I think it's solid, maybe add some numbers?" (left, gray bubble)
  - **(1.5–1.9s)** 👤 Friend 3: "It's a bit long but otherwise 👍" (left, gray bubble)
  - **(1.9–2.3s)** 👤 Friend 1: "Dude just send it, it's fine" (left, gray bubble)
  - **(2.3–2.5s)** 👤 Founder: "..." (typing indicator, three dots pulsing — the founder is stuck, uncertain)
- Each message cascades in with a subtle slide-up + fade animation (0.2s per message)
- Messages are small text (11-12px) in rounded bubbles with tiny avatar circles
- The overall feeling: chaotic, vague, unhelpful — the founder has no idea what to actually fix

**ACT 2: The Pitchr reveal (3–8s)**

Smooth transition: the messaging view fades/slides away, and the **real Pitchr app chrome** fades in (sidebar appears, header appears). The demo shell now shows the Pitchr results page.

- **(3–3.5s)** Transition: messages scatter/fade out (use `scatterOut` — each message flies in a random direction + fades). Simultaneously, the Pitchr sidebar slides in from left (0.3s), the page title "Pitch Analysis" appears in the header area.

- **(3.5–5s)** The **ScoreHero area** builds in:
  - Large score ring (center-ish, ~80px in the mini view) — SVG circle fills from 0 → 82 over 1.2s
  - Score number counts up 0 → 82 in center (requestAnimationFrame, HSL color interpolation — passes through red, orange, blue, lands on green)
  - Below ring: "Investor-Ready" band label fades in (green text)
  - To the right of the ring: 5 mini rubric indicators appear with stagger (0.1s each):
    - Tiny colored dots/rings + labels: Structure 16/20, Clarity 17/20, Evidence 14/20, Market 18/20, Delivery 17/20
  - Below everything: metric strip with 3 small pills: "142 WPM" • "2 fillers" • "1:52 duration" — slide up with fade

- **(5–6.5s)** Below the score section, **Top Fixes** slide in:
  - The DemoCursor appears and scrolls down slightly (smooth scroll animation within the demo)
  - 3 fix cards appear with stagger (0.15s between each), each sliding in from right:
    - Fix 1: 3px red left border, red "#1" circle, "Evidence · High" pill, "Add TAM/SAM market sizing with concrete numbers" + green arrow + "Include $4.2B market size from industry reports"
    - Fix 2: 3px orange left border, orange "#2" circle, "Structure · Med" pill, "Opening hook is too generic" + green arrow + "Lead with your strongest traction metric"
    - Fix 3: 3px gray left border, gray "#3" circle, "Delivery · Low" pill, "Minor filler word usage in section 2" + green arrow + "Practice the transition between problem and solution"
  - Cards match real `TopFixes.tsx` layout at miniature scale

- **(6.5–8s)** The DemoCursor moves to the first fix card and clicks it — the card briefly highlights (border glows coral), then the cursor fades out. The entire results view settles into a static "final state" that persists after the animation ends.

**Implementation notes:**
- Act 1 does NOT use `DemoShell` — it renders its own messaging-style container (simple rounded rect, no sidebar)
- Act 2 transitions INTO `DemoShell` with the Pitchr chrome appearing
- This creates a dramatic before/after: messy chat world → clean, structured Pitchr analysis
- The transition between acts should feel like a "reveal" — satisfying and premium
- Score ring: SVG `circle` with `strokeDasharray`/`strokeDashoffset`, same pattern as real `ScoreRing.tsx`
- All timing driven by a single orchestrating `useEffect` triggered by `useScrollPlay`

**Success criteria:**
- Viewer watches the demo and immediately understands: "I get useless feedback from friends → Pitchr gives me real, precise analysis"
- No text explanation needed — the animated sequence tells the whole story
- The Pitchr results view is recognizable as a real app (has sidebar, header, real component layouts)
- Messages feel like real iMessage/Slack bubbles
- Score ring climbs with visible color interpolation
- Fix cards match real TopFixes pattern
- ~8s total, plays once on scroll
- Mobile: container scales down, animation still reads clearly
- Dark mode: all surfaces use CSS variables correctly

---

### Task 3: Section 2 — "Paste. Analyze. Improve."

Create `views/components/landing/DemoSection2.tsx`.

**Layout:** Centered headline + full-width demo.
- Headline: "Paste. Analyze. Improve." (serif, centered)
- Full-width `DemoShell` containing the animated sequence

**The Demo — "Full Pitchr Workflow" (~10s total):**

This shows the **complete end-to-end product experience** — from opening the app, pasting a pitch, getting analyzed, to seeing results. Like watching a 10-second screen recording of someone using Pitchr for the first time.

**SCENE 1: The Session Page (0–3.5s)**

The DemoShell shows the **Session page** (sidebar nav: "Session" icon is highlighted/active):

- **(0–0.5s)** The page loads in. Main content area shows the session setup:
  - Top: "New Session" page title in header
  - Center: the SessionCanvas-style layout — a large rounded content area
  - Inside: a text input area (rounded, `--bg-surface` bg, `--border-color` border) with placeholder text "Paste your pitch here..." in muted color
  - Below the input: two small mode pills — "Elevator Pitch" (active, coral) and "VC Pitch" (inactive, outlined)
  - Below modes: a large coral "Analyze My Pitch" button (rounded, full-width of content area, with subtle glow)

- **(0.5–0.8s)** DemoCursor appears, moves to the text input area, clicks it (cursor press animation + input border briefly highlights coral)

- **(0.8–2.5s)** Typewriter effect — text appears character-by-character in the input area (~40 chars/second):
  > "We're building an AI pitch coach that gives founders investor-grade feedback in under 30 seconds. The pitch coaching market is $2.1B and growing 34% YoY. We've helped 200+ founders improve their scores by an average of 40 points..."
  - Blinking cursor `|` at end of text as it types
  - DemoCursor is hidden during typing (replaced by text cursor in the input)

- **(2.5–3s)** DemoCursor reappears, moves down to the "Analyze My Pitch" button

- **(3–3.5s)** DemoCursor clicks the button:
  - Button does click animation: scale(0.96) → scale(1.02) → scale(1)
  - Coral ripple expands outward from click point
  - Button text changes to a small spinner + "Analyzing..."

**SCENE 2: Processing (3.5–5.5s)**

The input area slides up and fades, replaced by a **processing view** in the same content area:

- **(3.5–4s)** Clean transition — input fades up, processing steps fade in below the button (which is now in "loading" state)

- **(4–5.5s)** 5 processing steps appear sequentially (0.25s apart, each taking ~0.3s to complete):
  1. ○ "Transcribing audio..." → ✓ (circle → spinner → green checkmark with SVG stroke draw)
  2. ○ "Scoring structure & clarity..." → ✓
  3. ○ "Analyzing delivery metrics..." → ✓
  4. ○ "Detecting filler words..." → ✓
  5. ○ "Generating fixes & rewrite..." → ✓ (this one takes 0.4s — slight dramatic pause)

  - Each step: 14px circle indicator + 11px text label
  - Spinner: CSS `border` technique (2px border, transparent top = spinning arc)
  - Checkmark: SVG path, drawn in via `stroke-dashoffset` animation (0.2s)
  - Steps stack vertically with 8px gap
  - After last checkmark, brief 0.3s pause

**SCENE 3: Results Page (5.5–10s)**

Smooth transition: processing view slides up, the header title changes to "Pitch Analysis", and the **full results page** builds in. The sidebar "Session" icon deactivates, no specific icon highlights (or "History" highlights).

- **(5.5–6s)** Transition: page content cross-fades to results layout

- **(6–7.2s)** **Score Hero section** builds:
  - Left side: Large score ring (SVG, ~70px) fills 0 → 84 with color transition
  - Score counter in center: 0 → 84 (lands on green)
  - "Investor-Ready" label fades in below ring
  - Right side: 5 mini rubric score indicators appear with stagger:
    - Each: small colored ring (20px) + category label + "score/20" text
    - Structure 18/20, Clarity 15/20, Evidence 17/20, Market 18/20, Delivery 16/20
  - Below: metric strip slides up — "142 WPM" pill, "2 fillers" pill, "1:52 / 2:00" pill
  - Below metrics: one-line verdict in small italic text: "Strong pitch with clear market positioning. Strengthen evidence with specific metrics."

- **(7.2–8.5s)** **Top Fixes section** builds (DemoCursor scrolls the content area down slightly):
  - Section header: "Priority Fixes" with small icon
  - 3 fix cards slide in from right with 0.15s stagger
  - Same layout as Task 2 but different content:
    - #1 (red/high): "Quantify customer traction — '200+ founders' needs revenue/retention data"
    - #2 (orange/med): "Add competitive differentiation — why not just use ChatGPT?"
    - #3 (gray/low): "Reduce speaking pace in market sizing section (162 WPM → aim for 140)"

- **(8.5–10s)** **Rewrite preview** appears below fixes:
  - Section header: "AI Rewrite" with small icon
  - Two-line diff-style preview (matching `RewriteDiffPanel` style):
    - Red line (strikethrough, red-tinted bg): "We're building an AI pitch coach that gives founders feedback..."
    - Green line (green-tinted bg): "Pitchr is the AI pitch coach that's helped 200+ founders raise $50M+ by turning vague feedback into investor-ready presentations in 30 seconds."
  - Lines slide in with stagger (red first, green replaces 0.3s later)
  - DemoCursor moves to the rewrite section, hovers, then fades out
  - The view settles as the static final state

**Implementation notes:**
- Three scenes in one continuous DemoShell (sidebar stays constant, only content area changes)
- Scene transitions: content cross-fade with slight slide-up (0.3s)
- DemoCursor orchestrated across all scenes — appears, clicks, types, scrolls, clicks, hovers, disappears
- Typewriter: `requestAnimationFrame` with character index increment, ~40 chars/sec
- Score ring: same SVG pattern as real ScoreRing.tsx, `requestAnimationFrame` for counter
- All timing from single orchestrating `useEffect` triggered by `useScrollPlay`

**Success criteria:**
- Viewer watches the complete Pitchr flow: paste pitch → analyze → see results
- Feels like watching a real screen recording of the app (sidebar, page titles, real layouts)
- The DemoCursor makes it feel like a human is using the app
- Processing step checkmarks draw in satisfyingly
- Results page is recognizable as real Pitchr (score ring + rubric + fixes + rewrite preview)
- ~10s total, plays once
- Mobile: scales down, still readable
- Dark mode: correct

---

### Task 4: Section 3 — "Your toolkit." (Feature Grid)

Create `views/components/landing/DemoSection3.tsx`.

**Layout:**
- Headline: "Your toolkit." (serif, centered, large)
- 2-column grid (3 rows desktop, 1-col mobile) of 6 feature demo cards
- Cards stagger-reveal on scroll (0.1s between each)

**Each card structure:**
- No text labels, category names, or taglines — just the mini demo
- Top-left: tiny feature name in muted text (10px, e.g., "Score & Rubric") — subtle, not prominent
- **The entire card IS the mini demo** — a small `DemoShell` (without sidebar for space efficiency — just a thin top bar with 3 dots + feature page title) showing the feature in action
- Bottom-right: small arrow icon (→) linking to `/features/[slug]`
- Hover: card lifts (translateY -3px), border glows coral, shadow deepens
- Click navigates to feature page via Next.js `Link`

**The 6 cards — each is a mini animated "screen recording" of that feature page:**

#### Card 1: **Score & Rubric** → `/features/score-rubric`

Mini demo shows the results page score section:
- Thin top bar: "Pitch Analysis" title
- Content: Score ring (~40px) fills 0 → 87 with color change + "Investor-Ready" label
- Right of ring: 5 tiny rubric bars fill with stagger (labels: S, C, E, M, D with scores)
- Below: mini radar pentagon fills from center outward
- ~3s animation, loops after 4s pause

#### Card 2: **Top Fixes** → `/features/top-fixes`

Mini demo shows the fixes section of results:
- Thin top bar: "Priority Fixes" title
- Content: DemoCursor scrolls through 3 fix cards that slide in from right
- Each card: colored left border + rank badge circle + 1-line issue text + small impact pill
- Cursor clicks fix #1 — card expands slightly showing the green arrow + fix suggestion
- ~3s animation, loops

#### Card 3: **AI Rewrite** → `/features/ai-rewrite`

Mini demo shows the rewrite panel:
- Thin top bar: "AI Rewrite" title + toggle buttons "Original" / "Rewrite" (small)
- Content starts showing "Original" text (3-4 small lines of text)
- DemoCursor clicks "Rewrite" toggle
- Text transforms: each line cross-fades to improved version (red bg → green bg, line by line with stagger)
- Green highlighted words/phrases pulse briefly to draw attention to changes
- ~4s animation, loops

#### Card 4: **Delivery Metrics** → `/features/delivery-metrics`

Mini demo shows the delivery section from results:
- Thin top bar: "Delivery Analysis" title
- Content: a mini "recording" moment plays first — small waveform bars pulsing (3 bars, like during a session) for 1s
- Then waveform fades, delivery results appear:
  - 3 metric cards in a row: WPM gauge (semicircle SVG filling to 142), filler count (number ticks 0→2), duration bar (fills to 85%)
  - Below: small event timeline — 3 colored pills ("0:32 · Filler", "1:15 · Hesitation", "1:44 · Filler") slide in
- ~4s animation, loops

#### Card 5: **QA Pack** → `/features/qa-pack`

Mini demo shows the QA session page:
- Thin top bar: "Investor Q&A" title + "LIVE" badge (pulsing green dot)
- Content shows a mini chat interface:
  - Left bubble (dark bg, "VC" mini avatar): "What's your competitive moat?" appears with typewriter
  - Brief pause (0.5s)
  - Right bubble (light bg, "You" mini avatar): "We have 3 proprietary advantages..." appears with typewriter
  - Left bubble: "How do you plan to monetize?" appears
  - Typing indicator (3 dots pulsing) appears on right side
- ~4s animation, loops (clears and replays conversation)

#### Card 6: **Deck Analysis** → `/features/deck-analysis`

Mini demo shows a deck being analyzed:
- Thin top bar: "Deck Analysis" title
- Content: 3 mini slide thumbnails in a row (small rectangles, ~16:9 aspect, with placeholder content lines)
- DemoCursor drags (or: upload animation — slides "drop in" from above one by one)
- Then score badges pop in on each slide sequentially:
  - Slide 1: score "72" badge (blue) with scale pop (0→1.1→1)
  - Slide 2: score "85" badge (green) with pop
  - Slide 3: score "64" badge (orange) with pop
- Below: overall "Deck Score: 74" text fades in with a small progress bar filling
- ~3.5s animation, loops

**Success criteria:**
- 6 cards, each IS a mini screen recording of the feature in action
- No explanatory text needed — the demos speak for themselves
- Demos loop subtly after initial play (not distracting)
- Cards feel premium — clean borders, glassmorphism, coral hover glow
- 2-col grid on desktop, 1-col on mobile
- All links to `/features/[slug]` work
- Dark mode correct

---

### Task 5: Section 4 — "Track your growth." (Growth Grid)

Create `views/components/landing/DemoSection4.tsx`.

**Layout:** Same pattern as Section 3 but 2x2 grid (4 cards).
- Headline: "Track your growth." (serif, centered)
- 2-col grid on desktop, 1-col on mobile

**The 4 cards:**

#### Card 1: **Progress** → `/features/progress`

Mini demo shows the progress dashboard page:
- Thin top bar: "Progress" title
- Content: miniaturized version of the real progress page
  - Top: level badge "Level 7" + XP bar filling to ~70%
  - Center: SVG line chart draws left-to-right showing scores: 42 → 55 → 48 → 63 → 71 → 78 → 85
    - 7 data points with small circles, line uses stroke-dashoffset animation
    - Subtle colored zone bands behind chart (red/orange/blue/green at very low opacity)
    - Gradient fill under line (coral → transparent)
    - Latest point has glow pulse
  - Below chart: "7 sessions • +43 points improvement" text fades in
- ~4s animation, loops (line erases, redraws)

#### Card 2: **Analytics** → `/features/analytics`

Mini demo shows the analytics page:
- Thin top bar: "Analytics" title + time range pills ("7D" "30D" "90D" — "30D" highlighted)
- Content:
  - Top: 3 stat boxes in a row — "Score: 78" (with tiny up arrow), "Sessions: 12", "Avg WPM: 145"
  - Below: 5 horizontal rubric category bars filling with stagger:
    - Structure (85%, green), Clarity (72%, blue), Evidence (58%, orange), Market (80%, green), Delivery (74%, blue)
    - Each bar: small category label left, percentage right, thin rounded colored bar filling
  - Below bars: mini bar chart (4-5 tiny bars representing session scores) fades in
- ~4s animation, loops

#### Card 3: **Arena** → `/features/arena`

Mini demo shows the arena page:
- Thin top bar: "Pitch Arena" title + fire streak badge "🔥 5"
- Content:
  - Top: "Weekly Challenge" card with difficulty badge "Hard" (orange pill) + "60-Second Elevator Pitch" bold text
  - Below: mini leaderboard (3 rows sliding in with stagger):
    - 🥇 "Sarah K." — 92 (green badge)
    - 🥈 "Mike T." — 88 (green badge)
    - 🥉 "You" — 85 (green badge) — this row has a subtle coral bg highlight
  - DemoCursor clicks "You" row — row briefly pulses/highlights
  - Below: "Join Challenge" button with coral glow
- ~4s animation, loops

#### Card 4: **Projects** → `/features/projects`

Mini demo shows the projects page:
- Thin top bar: "Projects" title + "+ New" button (small, coral)
- Content: 2-column grid of project cards (at mini scale):
  - Card A: "Series A Pitch" title + score badge "85" (green) + "3 sessions" subtitle + mini progress bar
  - Card B: "Product Demo" title + score badge "72" (blue) + "5 sessions" subtitle + mini progress bar
  - Cards slide in from bottom with stagger
  - DemoCursor clicks Card A — card border highlights coral, cursor moves to it
  - Card A could expand slightly or show a "Last run: 2h ago" detail
- ~3.5s animation, loops

**Success criteria:**
- 4 cards, each a mini screen recording of the growth/tracking feature
- Same visual quality and patterns as Section 3
- Demos loop subtly
- All links work
- Responsive, dark mode correct

---

### Task 6: Create feature detail page template

Create `app/(marketing)/features/[slug]/page.tsx`.

**Config:** Create `config/features.ts` with 10 feature slugs:
`score-rubric`, `top-fixes`, `ai-rewrite`, `delivery-metrics`, `qa-pack`, `deck-analysis`, `progress`, `analytics`, `arena`, `projects`

Each entry:
```typescript
{
  slug: string;
  label: string;
  headline: string;
  tagline: string;
  benefits: Array<{ icon: string; title: string; description: string }>;
  color: string;
}
```

**Feature detail page layout:**
1. Hero: label pill + large headline + tagline + **large `DemoShell`** with expanded, detailed version of the card's mini demo (bigger, slower, more detail visible)
2. Benefits: 3 blocks in a grid (icon + title + description)
3. CTA: "Ready to level up your pitch?" + coral button → waitlist
4. Back link: "← Back to home"

**Fully build `score-rubric` as template** — expanded demo:
- Full DemoShell with sidebar chrome
- Large score ring (~100px) fills to 87 with color transition
- Full 5-category rubric breakdown with bars, labels, score fractions
- Radar chart (pentagon) fills from center
- Metric strip below
- DemoCursor interacts — clicks a rubric category, it highlights

Other 9 slugs render with config data using a simpler static layout.

**Success criteria:**
- `/features/score-rubric` fully built with animated expanded demo
- All 10 slugs resolve (no 404s)
- Responsive, dark/light, Pitchr brand
- Back navigation works

---

### Task 7: Integrate into LandingClient.tsx

Insert the 4 sections into `LandingClient.tsx`:

**Hero (existing) → DemoSection1 → DemoSection2 → Delivery (existing) → Rubric (existing) → DemoSection3 → DemoSection4 → Growth Trajectory (existing) → Stats (existing) → Testimonial (existing) → Pricing (existing) → CTA (existing) → Footer (existing)**

- Import all 4 new components
- Add `id` anchors: `problem`, `how-it-works`, `toolkit`, `growth`
- Smooth scroll flow, no layout jumps
- Both themes correct
- Existing sections unaffected

**Success criteria:**
- All sections in correct order, smooth scrolling
- Scroll anchors work
- No performance jank — test quick scroll through entire page
- No regressions to existing sections

---

### Task 8: Polish pass

Final quality across all sections + feature pages:

1. **Timing:** Snappy and premium — entry < 0.4s, sequences ≤ 10s, easing `cubic-bezier(0.16, 1, 0.3, 1)`
2. **DemoCursor:** Smooth, natural movement — not too fast, not too slow. Click animations satisfying.
3. **App chrome:** Sidebar icons are subtle but recognizable. Active page indicator visible. The chrome makes it feel like a real app, not a decorative illustration.
4. **Play-once:** Sections 1 & 2 play once on scroll, don't replay. Sections 3 & 4 card demos loop subtly.
5. **Viewports:** 375px, 768px, 1440px, 1920px — demos scale cleanly, text remains readable, grids collapse properly
6. **Reduced motion:** Static final-state "screenshots" of each demo
7. **Dark mode:** All surfaces correct, no invisible text/borders
8. **Focus states:** Cards/links keyboard-navigable with coral focus rings
9. **No horizontal overflow** on any viewport
10. **`yarn build`** succeeds with zero errors

**Success criteria:**
- Demos feel like watching embedded Loom recordings of the real app
- The DemoCursor + app chrome create the illusion of a live product walkthrough
- No text is needed to understand what each feature does — the demo shows it
- Mobile demos scale cleanly
- Dark mode perfect
- Build passes

---

## EXIT_SIGNAL Protocol

When you complete all tasks and verify with `yarn build`:

```
RALPH_STATUS:
STATUS: COMPLETE
EXIT_SIGNAL: true
REASON: All 8 tasks completed, yarn build passes, all demo sections integrated
```

If tasks remain, always set `EXIT_SIGNAL: false` and continue working.
