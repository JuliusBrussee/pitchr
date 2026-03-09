Build 4 Notion-style animated feature showcase sections for the Pitchr landing page. Each section uses the Pitchr brand (coral #ff5941, orange #ffaa33, dark #e63b26), glassmorphism surfaces, and fast/flashy scroll-triggered animations. All feature cards link to dedicated detail pages.

## Context

- Landing page lives at `views/components/landing/LandingClient.tsx` (709 lines) with styles in `app/(marketing)/landing.css`
- Brand: coral #ff5941, orange #ffaa33, dark #e63b26, glass surfaces with backdrop-blur
- Existing animation libs: GSAP (already used in HeroPresenterTiles), CSS keyframes, Intersection Observer pattern
- Theme: CSS custom properties (--bg, --bg-card, --text, --border, --accent, etc.) with light/dark modes
- Components use named exports, 'use client' directive, @/* imports, Tailwind + CSS variables
- Use `yarn` only, never `npm`
- Score bands: 0-39 red #ef4444, 40-59 orange #ffaa33, 60-79 blue #3b82f6, 80-100 green #22c55e

## Tasks

### Task 1: Create shared animation infrastructure

Create `views/components/landing/animations/` with:

- `useScrollReveal` hook — Intersection Observer that adds `.visible` class to refs when they enter viewport, with configurable stagger delay between child elements. Should support `threshold`, `rootMargin`, and `once` (don't re-trigger) options.
- `AnimatedCard` component — glassmorphism card (`backdrop-filter: blur(20px)`, `var(--bg-surface)` background, `var(--border-color)` border) with hover lift (translateY -4px + box-shadow), coral border glow on hover, and click-through via Next.js `Link` to a feature page URL prop.
- Add CSS keyframes to `landing.css`: `cascadeIn` (translateY + opacity), `scatterOut` (translate + rotate + opacity out), `scoreCountUp` (for score counter), `radarFill` (polygon scale), `slideInRight` (translateX + opacity), `typeWriter` (width reveal), `stepCheckIn` (scale pop + opacity), `barFill` (width 0 to 100%).

**Success criteria:**
- `useScrollReveal` triggers `.visible` on scroll-into-view, stagger works with 0.1s default delay between children
- `AnimatedCard` renders glassmorphism card, hover animates lift + coral glow, click navigates to provided href
- All keyframes defined in landing.css and work in both light and dark mode
- Respects `prefers-reduced-motion: reduce` — disables animations, shows final state

### Task 2: Build Section 1 — "Stop guessing. Start closing."

Create `views/components/landing/PainPointSection.tsx`.

Layout: left text block + right animated panel (stacks vertically on mobile).

Left side:
- Small label: "The Problem"
- Bold headline: "Stop guessing. Start closing."
- Subtext: "Friends say 'sounds great.' Investors don't. Get the feedback that actually moves the needle."
- Arrow CTA button linking to #toolkit (Section 3)

Right side animated panel (triggered on scroll enter):
- Phase A (0–1.2s): 6 vague feedback bubbles cascade in rapidly with slight random rotations. Messages: "Sounds great!", "Maybe add more passion?", "I think it's fine", "Try adding some numbers?", "It's a bit long maybe?", "Love the energy!" — styled as chat-bubble cards with avatar circles and names.
- Phase B (1.2–1.8s): All bubbles scatter outward and fade (scatterOut keyframe).
- Phase C (1.8–4s): Pitchr analysis card slides in from right showing: (1) Score ring animating from 0 to 47 (red) then climbing to 82 (green) with color transition, (2) mini 5-point radar chart filling in, (3) top fix card: "Add TAM/SAM sizing — investors need concrete market data" with "High Impact" badge.

Use CSS animations + requestAnimationFrame for score counter. No new dependencies.

**Success criteria:**
- On scroll, vague feedback spam cascades in → scatters away → Pitchr card with animated score + radar appears
- Score visibly climbs from 47 (red) to 82 (green) with smooth color interpolation
- Feels fast and impactful — total sequence under 4s
- Mobile: stacks vertically, animation still plays at reduced scale
- Dark mode: correct contrast, bubbles use --bg-surface

### Task 3: Build Section 2 — "Watch your pitch transform."

Create `views/components/landing/TransformSection.tsx`.

Layout: left text block + right animated panel.

Left side:
- Label: "How It Works"
- Headline: "Watch your pitch transform."
- Subtext: "Paste or record your pitch. Get a score, ranked fixes, and a rewritten script in under 30 seconds."
- Arrow CTA linking to signup/waitlist

Right side animated panel (scroll-triggered):
- Phase A (0–1.5s): Mock input field with typewriter effect typing: "We're building a platform that helps founders practice and perfect their investor pitch using AI-powered feedback..."
- Phase B (1.5–2s): Coral "Analyze" button below input pulses with glow, then shows a "click" animation (scale down then up).
- Phase C (2–3.5s): 5 processing steps appear sequentially below, each with a circle that draws a checkmark SVG on completion:
  1. "Transcribing audio..."
  2. "Scoring structure & clarity..."
  3. "Analyzing delivery metrics..."
  4. "Detecting filler words..."
  5. "Generating fixes & rewrite..."
- Phase D (3.5–5s): Results card reveals with: score ring (82, green), delivery metrics strip (142 WPM pill, 2 fillers pill, 98% time compliance pill), 3 fix cards sliding in from right with rank numbers.

**Success criteria:**
- Smooth typewriter → button click → step cascade with checkmarks → results reveal
- Each processing step check draws in via SVG stroke animation
- Results card uses Pitchr's actual UI patterns (score ring style, metric pill style)
- Mobile: stacks, animation plays, text remains readable
- Total sequence ~5s, triggered once on scroll

### Task 4: Build Section 3 — "Your investor-ready toolkit." (Feature Grid)

Create `views/components/landing/ToolkitSection.tsx`.

Full-width section with:
- Bold large headline: "Your investor-ready toolkit."
- 2-column grid (3 rows on desktop, single column on mobile) of 6 `AnimatedCard` components
- Cards stagger-reveal on scroll (0.1s between each)

Each card contains:
- Small category label + bold tagline + arrow icon (top-right) linking to `/features/[slug]`
- Animated visual preview that plays on scroll-reveal and loops subtly

The 6 cards:

1. **Score & Rubric** — "Know exactly where you stand." → `/features/score-rubric`
   Visual: Mini radar chart that fills from center outward, 5 category labels around it

2. **Top Fixes** — "Ranked by investor impact." → `/features/top-fixes`
   Visual: 3 fix items sliding in with rank numbers (1, 2, 3) and red/orange/yellow impact badges

3. **AI Rewrite** — "Your pitch, but better." → `/features/ai-rewrite`
   Visual: Two-line diff view — red strikethrough line fading to green highlighted replacement

4. **Delivery Metrics** — "Every um. Every pause. Every second." → `/features/delivery-metrics`
   Visual: WPM semicircle gauge filling + filler counter ticking from 0 to 3

5. **QA Pack** — "Prep for the hard questions." → `/features/qa-pack`
   Visual: 3 question cards fanning out from a stack (slight rotation offset)

6. **Deck Analysis** — "Score your slides too." → `/features/deck-analysis`
   Visual: 3 mini slide thumbnails with score badges (72, 85, 64) appearing on each

**Success criteria:**
- 6 cards in 2-col grid on desktop, 1-col on mobile
- Each card has a distinct mini-animation that starts on scroll-reveal
- Animations loop subtly (not distracting) after initial play
- Glassmorphism styling with coral accent glow on hover
- All 6 links render (target pages can be placeholder for now)
- Cards feel premium — clean typography, generous padding, smooth transitions

### Task 5: Build Section 4 — "Track every improvement." (Feature Grid)

Create `views/components/landing/GrowthSection.tsx`.

Same pattern as Section 3 but 2x2 grid (4 cards).

Headline: "Track every improvement."

The 4 cards:

1. **Progress Dashboard** — "Watch your score climb." → `/features/progress`
   Visual: Mini line chart with dots, line draws left-to-right showing score going from ~45 to ~85, area under fills with gradient

2. **Analytics** — "Deep dive into your data." → `/features/analytics`
   Visual: 3 horizontal category bars filling to different widths with category labels (Structure, Clarity, Evidence)

3. **Arena & Challenges** — "Compete. Improve. Win." → `/features/arena`
   Visual: Challenge card mockup with difficulty badge + mini 3-row leaderboard with rank medals

4. **Projects** — "Organize every pitch." → `/features/projects`
   Visual: 2 project cards stacked with slight offset, each showing project name + score badge

**Success criteria:**
- 4 cards in 2-col grid on desktop, 1-col on mobile
- Each card has distinct animation matching its feature
- Same glassmorphism + hover pattern as Section 3
- Links navigate to `/features/[slug]`

### Task 6: Create feature detail page template

Create `app/(marketing)/features/[slug]/page.tsx` with a layout.

The page should:
- Read the slug param and look up feature data from a config object
- Render a hero section: feature label + large headline + tagline + full-width animated demo (larger/expanded version of the card's mini-animation)
- Body: 2-3 benefit blocks (icon + title + description) explaining the feature
- CTA section: "Ready to level up your pitch?" + coral button → waitlist/signup
- Footer: reuse existing landing footer pattern

Create a feature config at `config/features.ts` with entries for all 10 feature slugs (score-rubric, top-fixes, ai-rewrite, delivery-metrics, qa-pack, deck-analysis, progress, analytics, arena, projects). Each entry: `{ slug, label, headline, tagline, benefits: [{icon, title, description}], color }`.

Start by fully building out the `score-rubric` page as the template. Other slugs should render with their config data but can use a simpler layout until individually polished.

**Success criteria:**
- `/features/score-rubric` renders complete page with hero, animated demo, benefits, CTA
- All 10 slugs resolve and render (no 404s) — non-template ones show config-driven content
- Page uses Pitchr brand, glassmorphism, dark/light mode
- Responsive layout
- Back navigation to landing page

### Task 7: Integrate all sections into LandingClient.tsx

Insert the 4 new sections into `LandingClient.tsx` in this order after the existing hero section:

Hero (existing) → **PainPointSection** → **TransformSection** → Delivery section (existing) → Rubric Radar (existing) → **ToolkitSection** → **GrowthSection** → Growth Trajectory (existing) → Stats Bar (existing) → Testimonial (existing) → Pricing (existing) → CTA (existing) → Footer (existing)

- Import all 4 new section components
- Ensure scroll flow is smooth — no layout jumps between sections
- Verify all Intersection Observers fire correctly in sequence as user scrolls
- Test both light and dark mode for all new sections
- Add smooth scroll anchors: `#problem` (Section 1), `#how-it-works` (Section 2), `#toolkit` (Section 3), `#growth` (Section 4)

**Success criteria:**
- Full page scrolls through all sections in correct order without layout breaks
- Both light and dark themes render correctly on all new sections
- Scroll anchors work from nav or CTAs
- No performance jank — test by scrolling quickly through entire page
- Existing sections unaffected — no regressions

### Task 8: Polish pass — animations, timing, responsive, accessibility

Final quality pass across all 4 new sections + feature pages:

- Fine-tune animation timings for "fast and flashy" feel — nothing should feel sluggish
- Ensure animations play once on scroll-in and don't replay on scroll-back (unless intentionally looping like card previews)
- Test viewports: mobile (375px), tablet (768px), desktop (1440px), wide (1920px)
- Verify `prefers-reduced-motion: reduce` disables all animations and shows static final states
- Check dark mode contrast on every new element — text must be readable, borders visible
- Ensure all interactive elements (cards, CTAs, links) have visible focus states for keyboard navigation
- Verify no horizontal overflow on any viewport
- Check that landing.css additions don't bloat the file unnecessarily — consolidate duplicate keyframes
- Run `yarn build` to confirm no TypeScript errors or build failures

**Success criteria:**
- Animations feel snappy and impressive — comparable to Notion's landing page energy
- Mobile layouts are clean with appropriate spacing and readable text
- Reduced motion shows static final state for every animation
- Dark mode passes visual inspection — no invisible text or borders
- All cards/links are keyboard-navigable with visible focus rings
- `yarn build` succeeds with zero errors
- No horizontal scroll on any viewport width
