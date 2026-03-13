# Product Hunt Gallery Images — Design Spec

**Date:** 2026-03-13
**Dimensions:** 1270x760px (Product Hunt standard)
**Style:** Cinematic Gradient + 3D Tilt
**Count:** 6 images
**Primary message:** "Your pitch coach that never sleeps"

## Visual Theme

All slides share:
- **Background:** Near-black (#050505) with coral/amber radial gradient blobs
- **Headlines:** Bold (800 weight), coral-to-amber gradient text (`linear-gradient(135deg, #ff5941, #ffaa33)`)
- **Screenshots:** Wrapped in glassmorphic frame (subtle white border, dark inner bg, large box-shadow) with 3D perspective tilt (`perspective(800-1000px) rotateX/Y`)
- **Accent colors:** Coral `#ff5941`, Amber `#ffaa33`, Green `#4ade80`, Deep coral `#e63b26`
- **Body text:** `#9a9a98` on dark, `#ededec` for white text
- **Tags/pills:** Colored background at 15% opacity with matching text color
- **Logo:** Pitchr icon (coral rounded square) + wordmark, white on dark

## Layout Variation Pattern

Centered → Split-L → Centered → Split-R → Centered → Centered (no screenshot)

This alternating rhythm prevents visual fatigue while keeping the cinematic feel consistent.

---

## Slide 1 — Hero / Thumbnail

**Role:** First impression in PH feed. Must communicate the product in 2 seconds.
**Layout:** Centered, top-down

**Content (top to bottom):**
1. Pitchr logo (icon + wordmark)
2. Headline: **"Your pitch coach that never sleeps."** (gradient text, ~36px)
3. Subtitle: "Record your pitch. Get an investor-grade score, ranked fixes, and a rewritten script — in seconds." (~13px, gray)
4. Three tags in a row: `AI Scoring` (coral) · `Priority Fixes` (amber) · `Investor Q&A` (green)
5. Dashboard screenshot — tilted forward (`perspective(1000px) rotateX(3deg)`)

**Screenshot:** Dashboard page (score 63, performance trend chart, rubric breakdown)
**Gradient:** Radial from top-right (coral), secondary from bottom-left (amber)

**Why this works:** Score circle + upward trend line instantly communicates "this helps you improve." The three tags are scannable feature anchors.

---

## Slide 2 — Practice Session

**Role:** Shows the core product experience
**Layout:** Split — screenshot LEFT, copy RIGHT

**Left side:**
- Session page screenshot in glassmorphic frame
- Tilted slightly right: `perspective(800px) rotateY(3deg) rotateX(1deg)`

**Right side:**
1. Headline: **"Load your deck. Hit record. Get scored live."** (gradient, ~28px)
2. Body: "Upload your pitch deck, set your time target, and practice against a real-time rubric. Track every beat of your pitch as you go." (gray, ~13px)
3. Three bullet points with colored dots:
   - 🔴 Live timing & beat tracking
   - 🟠 Deck slide sync
   - 🟢 5-dimension rubric preview

**Screenshot:** Session page (deck slides, timeline bar, live summary, pitch checklist, rubric preview)
**Gradient:** Radial from top-left (amber), secondary from bottom-right (coral)

---

## Slide 3 — Instant Analysis

**Role:** Shows the AI scoring output (the money shot)
**Layout:** Centered, top-down

**Content (top to bottom):**
1. Headline: **"Investor-grade feedback. In seconds, not weeks."** (gradient, ~30px)
2. Subtitle: "Every pitch gets a score out of 100 with category breakdowns, ranked priority fixes, and actionable next steps." (gray)
3. Analysis page screenshot — tilted forward (`perspective(900px) rotateX(4deg)`)

**Screenshot:** Pitch Analysis page (score 57/100, category breakdowns with colored circles, priority fixes section with HIGH/MED severity badges)
**Gradient:** Radial from top-center (coral, stronger), secondary from bottom-right (amber, subtle)

**Why this works:** Shows depth of analysis — the multi-category scoring and ranked fixes demonstrate this isn't a toy.

---

## Slide 4 — Investor Q&A Drill

**Role:** Differentiator feature — no other pitch tool does this
**Layout:** Split — copy LEFT, screenshot RIGHT (mirrors slide 2)

**Left side:**
1. Headline: **"Get grilled by an AI investor. Before the real one."** (gradient, ~28px)
2. Body: "Practice handling tough VC questions in a live 60-second drill. Real-time voice conversation with an AI investor who adapts to your answers." (gray)
3. Two tags: `Live Voice` (coral) · `Adaptive AI` (amber)

**Right side:**
- Investor Q&A screenshot in glassmorphic frame
- Tilted slightly left: `perspective(800px) rotateY(-3deg) rotateX(1deg)`

**Screenshot:** Investor Q&A page (circular timer at 0:32, live transcript with VC/You conversation bubbles, audio waveform)
**Gradient:** Radial from left-center (coral), secondary from top-right (amber)

---

## Slide 5 — Track Your Progress

**Role:** Closes the improvement narrative with real data
**Layout:** Centered, top-down

**Content (top to bottom):**
1. Headline: **"From 57 to 91. In 28 sessions."** (gradient, ~30px)
2. Subtitle: "Watch your score climb session by session. Pitchr tracks your rubric breakdown, streaks, and performance trends over time." (gray)
3. Dashboard screenshot — more dramatic tilt (`perspective(800px) rotateX(5deg) rotateY(-1deg)`)

**Screenshot:** Dashboard page (score circle 63, upward trend line, "Best: 91 / Average: 63 / Sessions: 28", rubric radar chart)
**Gradient:** Radial from bottom-center (coral), secondary from top-left (amber)

**Why this works:** "57 to 91" is a concrete, compelling number from the actual app. Social proof through product data.

---

## Slide 6 — Closing CTA

**Role:** Final push to try the product. Clean exit, no screenshot.
**Layout:** Centered, no screenshot

**Content (top to bottom):**
1. Pitchr logo (larger — 28px icon)
2. Headline: **"Ship pitches that close rounds."** (gradient, ~38px)
3. Subtitle: "Free to start. No credit card required." (gray)
4. Two rows of feature pills (rounded capsules with colored dots):
   - Row 1: `AI Scoring /100` (coral) · `Priority Fixes` (amber) · `Investor Q&A Drills` (green)
   - Row 2: `Script Rewrites` (coral) · `Delivery Metrics` (amber) · `Progress Tracking` (green)

**Gradient:** Central radial glow (coral), secondary from top-right (amber)

**Why this works:** Uses the official tagline. Feature pills recap the full product. No screenshot = visual breathing room after 4 screenshot-heavy slides.

---

## Implementation Notes

- Screenshots should be cropped to remove the sidebar navigation for cleaner framing (show just the main content area, or include sidebar at reduced opacity)
- All images export as PNG at 2x resolution (2540x1520) then downscale to 1270x760 for sharpness
- The glassmorphic screenshot frame uses: `background: rgba(255,255,255,0.02)`, `border: 1px solid rgba(255,255,255,0.06)`, `border-radius: 12px`, `box-shadow: 0 30px 80px rgba(255,89,65,0.06), 0 10px 30px rgba(0,0,0,0.4)`
- Gradient blobs should be large and soft (use `filter: blur(40-60px)` or large radial-gradient stops)
- Font: system font stack or Inter/Geist (matching the app's typography)

## Screenshot Source Files

1. `/Users/julb/Downloads/Untitled (1)/Screenshot 2026-03-07 at 21.37.06 1.png` — Dashboard
2. `/Users/julb/Downloads/Untitled (1)/image 1.png` — Session page
3. `/Users/julb/Downloads/Untitled (1)/image 2.png` — Pitch Analysis
4. `/Users/julb/Downloads/Untitled (1)/image 3.png` — Investor Q&A
