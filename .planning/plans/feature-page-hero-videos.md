# Demo Documentation

## Product Demo (Cinematic Walkthrough)

**Route:** `/demo` and `/product-demo`
**Component:** `views/components/demo/DemoClient.tsx`
**CSS:** `views/components/demo/demo.css` (~1,969 lines)

### How It Works

The product demo is a fully automated, cinematic walkthrough of the entire Pitchr app. It renders all four main screens (Dashboard, Session, Results, Q&A) inside a single 1440x900 "stage", then uses CSS transforms to pan and zoom a virtual camera between them — like a screen recording, but built entirely in React/CSS with no video files.

### Architecture

**Orchestrator:** `DemoClient.tsx` manages step progression, camera position, cursor animation, and screen visibility via a single `step` state counter that indexes into `DEMO_STEPS`.

**Stage & Camera System:**
- A 1440x900px fixed stage contains all four screens stacked (only one is `opacity: 1` at a time via `.demo-screen--active`)
- `scaleFactor` is computed on mount/resize to fit the stage into the actual viewport width (`vpWidth / 1440`)
- Each step defines a CSS `transform` string (e.g. `scale(1.5) translate(-35%, -2%)`) that gets composed with the scale factor
- Transitions between transforms create smooth camera pans/zooms via CSS `transition` on `.demo-stage`

**Step System:** `demoData.ts` exports `DEMO_STEPS` — an array of 17 steps across 6 sections:

| Section | Steps | Duration | What Happens |
|---------|-------|----------|--------------|
| Dashboard | 2 | 6.9s | Overview → zoom out, cursor clicks "Start Session" |
| Session | 4 | 11.8s | Full view → zoom transcript (typewriter) → zoom checklist → zoom out |
| Analysis | 1 | 3s | Analyzing overlay with spinner |
| Results | 5 | 18.1s | Full view → zoom score → zoom fixes → zoom rewrite → zoom out, cursor clicks "Start Q&A" |
| Q&A | 4 | 27.5s | Gate screen → connecting → live turns (18s) → complete |
| CTA | 1 | 4s | Call-to-action overlay |

Each step defines: `screen`, `transform`, `duration` (ms), `urlText` (browser URL bar), `label`/`subtitle`, optional `cursor` position + click timing, optional `scrollTo` selector, optional `qaPhase`/`qaVisibleTurns`.

**Auto-advance:** A `setTimeout` fires `advance()` after each step's `duration`. On advance, the label fades out (300ms), then step increments and label fades back in. Loops back to step 0 after the last step.

### Screen Components

All under `views/components/demo/screens/`:

- **DemoDashboard.tsx** — Coach card, score ring (SVG `stroke-dashoffset`), sparkline (SVG polyline), radar chart (SVG polygon), category breakdown bars, recent sessions table
- **DemoSession.tsx** — Typewriter transcript (3 chars per 100ms tick), live coverage checklist with progressive state changes, live metrics (duration counter, WPM, filler count)
- **DemoResults.tsx** — Animated score ring count-up (1.2s easing), 5 rubric mini-rings with rationales, verdict, delivery metrics strip, top fixes grid with impact badges, rewrite before/after hunks. Supports `scrollTo` prop to programmatically scroll to fixes or rewrite sections.
- **DemoQA.tsx** — State machine with 4 phases (gate → connecting → active → complete). Countdown ring timer, waveform bars during speaking, Q&A turns with investor/founder dialogue, evaluation metrics.

### Support Components

- **DemoBrowserFrame.tsx** — macOS-style browser chrome (traffic lights, lock icon, animated URL bar)
- **DemoSidebar.tsx** — App nav sidebar (Dashboard, Session, History, Analytics, Progress, Arena), user info, theme toggle
- **DemoCursor.tsx** — Animated cursor that moves to target coordinates with spring-like easing, shows click ripple animation
- **DemoStepLabel.tsx** — Title + subtitle above browser, fades in/out with step transitions
- **DemoAnalyzingOverlay.tsx** — "Analyzing..." loading overlay with dot-pulse animation
- **DemoCTA.tsx** — Final call-to-action overlay

### Mock Data

All in `demoData.ts`:
- `DEMO_TRANSCRIPT` — Fictional "Ledgr" fintech elevator pitch (~155 words)
- `DEMO_SCORE` = 72
- `DEMO_RUBRIC` — 5 categories (Structure 16/20, Clarity 15/20, Evidence 13/20, Market 12/20, Delivery 16/20)
- `DEMO_FIXES` — 4 ranked fixes with impact levels (high/high/medium/low)
- `DEMO_DELIVERY` — WPM 148, duration 63s, 2 fillers
- `DEMO_REWRITE_HUNKS` — 3 before/after pairs
- `DEMO_CHECKLIST` — 8 items in various states
- `DEMO_COACH_SUMMARY`, `DEMO_SPARKLINE`, `DEMO_RECENT_RUNS`, `DEMO_QA_TURNS` (6 turns)

### Key Techniques

- **No video files** — everything is live React + CSS animations, making it resolution-independent and easy to update
- **CSS transform camera** — `scale()` + `translate()` on a fixed stage creates cinematic zooms/pans with hardware-accelerated transitions
- **Viewport scaling** — stage scales to fit any screen width via `vpWidth / 1440` ratio
- **Tick-based animations** — 100ms `setInterval` drives typewriter, counter, and progressive reveal effects
- **Step-driven state** — single `step` integer controls everything: which screen is visible, camera position, cursor target, label text, scroll position
- **Grouped dot indicator** — bottom dots are grouped by section with coral accent on active step

---

## Feature Page Hero Demos (Landing Page)

**Route:** `/demos`
**Component:** `views/components/landing-demos/LandingDemosClient.tsx`
**CSS:** `app/(marketing)/landing-demos.css` (~1,873 lines)

These are standalone, scroll-triggered demo animations for the marketing landing page. Each is self-contained with its own IntersectionObserver and tick-based animation loop. They share a `BrowserFrame` and `DpSidebar` but are otherwise independent of the product demo.

### 1. SessionDemo — Live Session Experience

**Component:** `views/components/landing-demos/SessionDemo.tsx`
**Feature page:** Session / Recording
**Shows:** The actual session recording experience

- Sidebar with mode toggle (Elevator / VC Pitch)
- Recording canvas
- Live transcript with typewriter effect (3 chars per 100ms tick)
- Coverage checklist — items progressively check off based on character count thresholds
- Live metrics: duration, WPM, fillers
- Scroll-triggered via IntersectionObserver at 15% threshold

### 2. ResultsDemo — Results & Scoring

**Component:** `views/components/landing-demos/ResultsDemo.tsx`
**Feature page:** Results / Analysis
**Shows:** The actual results page

- Animated score ring (0 → 72) with 1.2s cubic-bezier easing
- Rubric mini-rings for all 5 categories with rationales (staggered animation)
- Verdict text
- Metrics strip (WPM, duration, word count, fillers)
- Top fixes with impact colors and ranked cards (staggered fade-up)
- Rewrite comparison (original vs. rewrite side-by-side)
- Progressive reveal driven by tick counter

### 3. DashboardDemo — Dashboard & Progress

**Component:** `views/components/landing-demos/DashboardDemo.tsx`
**Feature page:** Dashboard / Progress Tracking
**Shows:** The actual dashboard

- Coach summary card with AI insight icon
- Score ring with trend delta
- Sparkline chart (SVG polyline)
- Radar chart (SVG pentagon polygon)
- Category breakdown bars with eased progress bar fills
- Recent sessions list with staggered animation
- 100ms tick intervals, scroll-triggered

### Additional Landing Demos

- **LiveQADemo** (`LiveQADemo.tsx`) — State-machine Q&A with 6 phases, investor/founder dialogue, real-time metrics (Clarity, Confidence, Concision), waveform animation
- **DeckGenDemo** (`DeckGenDemo.tsx`) — Pitch deck generation: form input → generation → slide preview → speaker notes. Multi-step state machine.
- **SessionReviewDemo** (`SessionReviewDemo.tsx`) — Session review with performance metrics and comparison charts
- **BentoGrid** (`BentoGrid.tsx`) — Grid layout for organizing demo sections
- **ProgressSection** (`ProgressSection.tsx`) — Progress tracking visualization
