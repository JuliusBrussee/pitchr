# Scene 3B: PITCHR UI SCREEN RECORDING — Instructions

## This is NOT AI-generated. This is a real screen recording.

### Setup

1. Open pitchr.live in Chrome on a high-DPI display
2. Set browser to **Light Mode**
3. Window size: 430px wide (mobile viewport) at 2x device pixel ratio
4. Use a screen recorder that captures at native resolution (OBS recommended at 60fps, downscale to 24fps in post)

### What to Record

Run a real (or staged) pitch analysis. Record the results page loading from the moment the score ring begins to animate.

### Exact Visual Elements to Capture

#### 1. ScoreHero Component (capture 3 seconds of animation)

**Main Score Ring:**
- SVG circle, 110x110px viewport, radius 52px, stroke-width 5px
- Background track: `var(--border-color)` (light grey)
- Progress stroke: Color determined by HSL formula — `hsl(hue, 72%, 45%)` where hue = `(score/100) * 120`
  - At 62/100: hue = 74.4° → muted olive-green
  - At 85/100: hue = 102° → bright green
- Animation: Stroke draws clockwise from 12 o'clock position over 1100ms with cubic ease-out `1 - (1-t)^3`
- Starts after 350ms delay

**Score Number:**
- Counts from 0 → target score, synced with ring animation
- Font: 30px bold Inter, tabular-nums, tight tracking
- Color: same as ring stroke color
- Below: "/100" in 10px muted grey

**Band Label Badge:**
- Appears below the ring after animation completes
- Pill shape: 11px semibold Inter, rounded-full
- At 62: "Solid" (olive-green text on olive-green/10% bg)
- At 85: "Investor-Ready" (green text on green/10% bg)

#### 2. Rubric Mini-Rings (capture 3 seconds)

Five rows appear with staggered 80ms delay between each:

| Category | Color | Example Score |
|----------|-------|---------------|
| Structure | #ff5941 (brand coral-red) | 14/20 |
| Clarity | #ffaa33 (warm amber) | 13/20 |
| Evidence | #22c55e (green) | 11/20 |
| Market | #f97316 (orange) | 12/20 |
| Delivery | #ef4444 (red) | 12/20 |

Each row has:
- 44x44px mini ring (4px stroke) that animates fill clockwise
- Score number centered inside ring (12px bold, color-matched)
- Category label: 12px medium Inter, capitalized
- "/max_score" suffix: 10px muted grey
- One-line rationale: 11px secondary grey, single line

#### 3. Delivery Events Timeline (capture 2 seconds)

- Header: "Delivery Events" in 12px semibold uppercase tracking-wider muted grey
- Legend dots in upper right (2px colored circles with count)
- Content: Row of pill buttons that appear simultaneously

Pill button styling:
- 11px text, rounded-md border
- Each pill: timestamp ("0:12") · dot separator · label ("like")
- Colors by type:
  - Filler: #ffaa33 border/text on #ffaa33/5% background
  - Hesitation: #3b82f6
  - Stutter: #ef4444
  - Repetition: #f97316
  - Vocab: #14b8a6

#### 4. TopFixes Cards (capture 2 seconds)

Two cards slide up from below:

Card styling:
- Rounded-xl border, 4px padding
- 3px left border colored by impact:
  - High: #ef4444
  - Medium: #ffaa33
  - Low: #6b7280
- Rank number: 10px bold in a 20px circle, colored by impact
- Category: 12px medium muted
- Impact badge: 10px semibold uppercase, colored pill
- Issue text: 14px primary color
- Fix: 14px secondary color with green ArrowRight icon (#22c55e) prefix

### Post-Processing

1. Crop to just the UI (remove browser chrome)
2. Add subtle dark vignette around edges (10% opacity black radial gradient)
3. Add a warm glow bloom at edges (simulating screen light spill into the dark frame)
4. Apply subtle 3D parallax tilt in post (2-3 degree rotation over 10 seconds) to prevent flat-screen-recording look
5. DO NOT color grade the UI — keep native colors for accuracy

### Recording Checklist

- [ ] Light mode enabled
- [ ] Score animation plays smoothly (no frame drops)
- [ ] All five rubric categories visible
- [ ] Delivery events have at least 3-4 filler/hesitation pills
- [ ] At least 2 fix cards visible
- [ ] Recording is at 2x resolution minimum
- [ ] No cursor visible (hide cursor before recording)
