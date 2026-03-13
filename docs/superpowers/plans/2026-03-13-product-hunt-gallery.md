# Product Hunt Gallery Images — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 Product Hunt gallery images (1270x760px) as self-contained HTML files, then capture them as PNGs using Playwright.

**Architecture:** Each slide is a standalone HTML file at 2x resolution (2540x1520px) with screenshot images referenced via relative path. A capture script uses Playwright to screenshot each HTML file, then downscales to 1270x760px via `sips`. All output goes to `branding/product-hunt/`.

**Tech Stack:** HTML/CSS (inline, self-contained), Playwright (already installed) for PNG capture, `sips` (macOS built-in) for downscaling.

**Spec:** `docs/superpowers/specs/2026-03-13-product-hunt-gallery-design.md`

**Key assets:**
- Logo SVG (white): `public/logo-white.svg` — the "P" icon with signal bars
- Logo icon SVG: `public/icon.svg` — coral rounded square with P icon
- Screenshots source: `/Users/julb/Downloads/Untitled (1)/`
- Brand colors: coral `#ff5941`, amber `#ffaa33`, green `#4ade80`, deep coral `#e63b26`

---

## Chunk 1: Setup & Shared Assets

### Task 1: Create directories, crop screenshots, and prepare assets

**Files:**
- Create: `branding/product-hunt/` (root)
- Create: `branding/product-hunt/screenshots/` (cropped screenshots)
- Create: `branding/product-hunt/slides/` (HTML source files)
- Create: `branding/product-hunt/output/` (final PNGs)

- [ ] **Step 1: Create full directory structure**

```bash
mkdir -p branding/product-hunt/{screenshots,slides,output}
```

- [ ] **Step 2: Copy source screenshots to working directory**

```bash
cp "/Users/julb/Downloads/Untitled (1)/Screenshot 2026-03-07 at 21.37.06 1.png" branding/product-hunt/screenshots/dashboard.png
cp "/Users/julb/Downloads/Untitled (1)/image 1.png" branding/product-hunt/screenshots/session.png
cp "/Users/julb/Downloads/Untitled (1)/image 2.png" branding/product-hunt/screenshots/analysis.png
cp "/Users/julb/Downloads/Untitled (1)/image 3.png" branding/product-hunt/screenshots/investor-qa.png
```

- [ ] **Step 3: Crop sidebar from screenshots**

The spec says: "Screenshots should be cropped to remove the sidebar navigation for cleaner framing." The sidebar is ~220px wide on the left side of each screenshot.

Use CSS `object-position` and overflow hidden in the slide HTML to visually hide the sidebar — this is simpler and non-destructive. Each slide's screenshot frame uses:

```css
.screenshot-frame {
  overflow: hidden; /* clips the overscan */
}
.screenshot-frame img {
  width: 115%; /* overscan to push sidebar off-frame */
  margin-left: -12%; /* shift left to crop sidebar */
  border-radius: 16px;
  display: block;
}
```

No file-level cropping needed — this CSS approach handles it in each slide.

- [ ] **Step 4: Commit setup**

```bash
git add branding/product-hunt/screenshots/
git commit -m "chore: add PH gallery directory and source screenshots"
```

### Task 2: Create the Playwright capture script

**Files:**
- Create: `branding/product-hunt/capture.mjs`

This script opens each slide HTML at 2540x1520 viewport, captures a PNG, then uses `sips` to downscale each to the final 1270x760.

- [ ] **Step 1: Write the capture script**

Create `branding/product-hunt/capture.mjs`:

```javascript
import { chromium } from 'playwright';
import { readdir, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { execFileSync } from 'child_process';

const DIR = new URL('.', import.meta.url).pathname;
const SLIDES_DIR = join(DIR, 'slides');
const OUTPUT_DIR = join(DIR, 'output');

async function capture() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 2540, height: 1520 },
    deviceScaleFactor: 1,
  });

  const files = (await readdir(SLIDES_DIR))
    .filter(f => f.endsWith('.html'))
    .sort();

  for (const file of files) {
    const page = await context.newPage();
    await page.goto(`file://${join(SLIDES_DIR, file)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Wait for fonts + images

    const name = basename(file, '.html');
    const hiresPath = join(OUTPUT_DIR, `${name}-2x.png`);
    const finalPath = join(OUTPUT_DIR, `${name}.png`);

    // Capture at 2x resolution
    await page.screenshot({ path: hiresPath, type: 'png' });
    console.log(`Captured 2x: ${name}-2x.png (2540x1520)`);

    // Downscale to 1270x760 using sips (macOS)
    execFileSync('sips', ['--resampleWidth', '1270', hiresPath, '--out', finalPath]);
    console.log(`Downscaled:  ${name}.png (1270x760)`);

    await page.close();
  }

  await browser.close();
  console.log(`\nDone! ${files.length} images saved to ${OUTPUT_DIR}`);
  console.log('Final images (1270x760): *not* the -2x files.');
}

capture().catch(console.error);
```

- [ ] **Step 2: Commit capture script**

```bash
git add branding/product-hunt/capture.mjs
git commit -m "feat: add Playwright capture script for PH gallery with downscaling"
```

---

## Chunk 2: Slide HTML Files (Slides 1-3)

Each slide is a fully self-contained HTML file at 2540x1520px. Screenshots are referenced via relative `../screenshots/` path (works with Playwright `file://`). The font is Inter loaded from Google Fonts — Playwright loads external resources fine via `file://` + `waitUntil: 'networkidle'`. System font `system-ui` is the fallback if offline.

### Shared CSS pattern for all slides

Every slide HTML file follows this skeleton. **The implementing agent must write the complete HTML for each slide** — not a partial description. Use this as the base:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 2540px; height: 1520px;
      background: #050505;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      position: relative;
    }
    .gradient-blob {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 1;
      width: 100%; height: 100%;
    }
    .headline {
      font-weight: 800;
      line-height: 1.1;
      background: linear-gradient(135deg, #ff5941, #ffaa33);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle { color: #9a9a98; line-height: 1.5; }
    .screenshot-frame {
      background: rgba(255,255,255,0.02);
      border: 2px solid rgba(255,255,255,0.06);
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 60px 160px rgba(255,89,65,0.06), 0 20px 60px rgba(0,0,0,0.4);
      overflow: hidden;
    }
    .screenshot-frame img {
      width: 115%;
      margin-left: -12%;
      border-radius: 16px;
      display: block;
    }
    .tag {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 40px;
      font-size: 22px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .tag-coral { background: rgba(255,89,65,0.15); color: #ff5941; }
    .tag-amber { background: rgba(255,170,51,0.15); color: #ffaa33; }
    .tag-green { background: rgba(74,222,128,0.15); color: #4ade80; }
  </style>
</head>
<body>
  <!-- Gradient blobs (vary per slide) -->
  <div class="gradient-blob" style="width: 800px; height: 800px; top: -200px; right: -100px; background: rgba(255,89,65,0.15); filter: blur(120px);"></div>
  <div class="gradient-blob" style="width: 600px; height: 600px; bottom: -150px; left: -100px; background: rgba(255,170,51,0.1); filter: blur(100px);"></div>

  <div class="content">
    <!-- Slide-specific content here -->
  </div>
</body>
</html>
```

**Logo SVG** — use inline in slides that need it. Source: `public/logo-white.svg`. The logo is a stylized "P" with signal bars. For the gallery images, pair it with a text span:

```html
<div class="logo" style="display: flex; align-items: center; margin-bottom: 32px;">
  <span style="width: 40px; height: 40px; background: #e63b26; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" fill="none" viewBox="0 0 430 559">
      <path stroke="#F4F4F4" stroke-linecap="round" stroke-linejoin="round" stroke-width="70" d="M35 524V211c0-100 74-176 150-176h48c93 0 162 70 162 168 0 84-62 162-166 170l-80 6c-60 4-114 52-114 100"/>
      <rect fill="#fff" width="36" height="190" x="197" y="113" rx="18"/>
      <rect fill="#fff" width="31" height="151" x="267" y="136" rx="15.5"/>
      <rect fill="#fff" width="32" height="151" x="132" y="133" rx="16"/>
    </svg>
  </span>
  <span style="font-size: 28px; font-weight: 700; color: #ededec; margin-left: 12px;">Pitchr</span>
</div>
```

All pixel values below are at **2x** (double the spec values for 2540x1520 rendering).

### Task 3: Slide 1 — Hero / Thumbnail

**Files:**
- Create: `branding/product-hunt/slides/01-hero.html`

- [ ] **Step 1: Write the complete slide 1 HTML file**

Create `branding/product-hunt/slides/01-hero.html` using the shared skeleton above. The content div should contain:

1. **Gradient blobs:** coral top-right (`width: 900px; height: 900px; top: -300px; right: -150px; background: rgba(255,89,65,0.18); filter: blur(120px)`), amber bottom-left (`width: 700px; height: 700px; bottom: -200px; left: -150px; background: rgba(255,170,51,0.12); filter: blur(100px)`)

2. **Content layout:** `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 1520px; padding: 60px 80px;`

3. **Logo:** Pitchr icon + wordmark (as shown in shared pattern above), `margin-bottom: 32px`

4. **Headline:** `<h1 class="headline" style="font-size: 72px; text-align: center; margin-bottom: 24px;">Your pitch coach<br>that never sleeps.</h1>`

5. **Subtitle:** `<p class="subtitle" style="font-size: 26px; text-align: center; max-width: 800px; margin-bottom: 32px;">Record your pitch. Get an investor-grade score, ranked fixes, and a rewritten script — in seconds.</p>`

6. **Tags row:** `<div style="display: flex; gap: 16px; margin-bottom: 48px;">` with three tags: `AI Scoring` (coral), `Priority Fixes` (amber), `Investor Q&A` (green)

7. **Screenshot:** `<div class="screenshot-frame" style="max-width: 1120px; transform: perspective(2000px) rotateX(3deg);"><img src="../screenshots/dashboard.png" alt="Dashboard"></div>`

- [ ] **Step 2: Visually verify in browser**

```bash
open branding/product-hunt/slides/01-hero.html
```

Check: dark bg, gradient text legible, screenshot tilted with shadow, tags visible, balanced composition at 2540x1520.

- [ ] **Step 3: Commit slide 1**

```bash
git add branding/product-hunt/slides/01-hero.html
git commit -m "feat: add PH gallery slide 1 — hero/thumbnail"
```

### Task 4: Slide 2 — Practice Session

**Files:**
- Create: `branding/product-hunt/slides/02-session.html`

- [ ] **Step 1: Write the complete slide 2 HTML file**

Create `branding/product-hunt/slides/02-session.html` using the shared skeleton. Split layout:

1. **Gradient blobs:** amber top-left (`width: 800px; height: 800px; top: -250px; left: -200px; background: rgba(255,170,51,0.18); filter: blur(120px)`), coral bottom-right (`width: 600px; height: 600px; bottom: -200px; right: -100px; background: rgba(255,89,65,0.12); filter: blur(100px)`)

2. **Content layout:** `display: flex; align-items: center; gap: 80px; padding: 80px 100px; min-height: 1520px;`

3. **Left side (flex: 1):** Screenshot in glassmorphic frame with `transform: perspective(1600px) rotateY(3deg) rotateX(1deg)`. Image: `../screenshots/session.png`

4. **Right side (flex: 0 0 38%):**
   - Headline: `<h1 class="headline" style="font-size: 56px; margin-bottom: 24px;">Load your deck.<br>Hit record.<br>Get scored live.</h1>`
   - Body: `<p class="subtitle" style="font-size: 26px; margin-bottom: 32px;">Upload your pitch deck, set your time target, and practice against a real-time rubric. Track every beat of your pitch as you go.</p>`
   - Bullets: three flex rows with colored dot + label text:
     - `#ff5941` dot (12px circle) + "Live timing & beat tracking" (24px, `#9a9a98`)
     - `#ffaa33` dot + "Deck slide sync"
     - `#4ade80` dot + "5-dimension rubric preview"

- [ ] **Step 2: Visually verify**

```bash
open branding/product-hunt/slides/02-session.html
```

Check: screenshot on left tilted slightly right, copy on right is readable, bullet dots colored correctly.

- [ ] **Step 3: Commit slide 2**

```bash
git add branding/product-hunt/slides/02-session.html
git commit -m "feat: add PH gallery slide 2 — practice session"
```

### Task 5: Slide 3 — Instant Analysis

**Files:**
- Create: `branding/product-hunt/slides/03-analysis.html`

- [ ] **Step 1: Write the complete slide 3 HTML file**

Create `branding/product-hunt/slides/03-analysis.html` using the shared skeleton. Centered layout:

1. **Gradient blobs:** coral top-center (larger/stronger: `width: 1000px; height: 800px; top: -300px; left: 50%; margin-left: -500px; background: rgba(255,89,65,0.22); filter: blur(120px)`), amber bottom-right (subtle: `width: 500px; height: 500px; bottom: -150px; right: -100px; background: rgba(255,170,51,0.08); filter: blur(100px)`)

2. **Content layout:** `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 1520px; padding: 60px 80px;`

3. **Headline:** `<h1 class="headline" style="font-size: 60px; text-align: center; margin-bottom: 24px;">Investor-grade feedback.<br>In seconds, not weeks.</h1>`

4. **Subtitle:** `<p class="subtitle" style="font-size: 26px; text-align: center; max-width: 840px; margin-bottom: 48px;">Every pitch gets a score out of 100 with category breakdowns, ranked priority fixes, and actionable next steps.</p>`

5. **Screenshot:** `<div class="screenshot-frame" style="max-width: 1200px; transform: perspective(1800px) rotateX(4deg);"><img src="../screenshots/analysis.png" alt="Analysis"></div>`

- [ ] **Step 2: Visually verify**

```bash
open branding/product-hunt/slides/03-analysis.html
```

Check: headline prominent, analysis screenshot shows score 57 + priority fixes, forward tilt adds depth.

- [ ] **Step 3: Commit slide 3**

```bash
git add branding/product-hunt/slides/03-analysis.html
git commit -m "feat: add PH gallery slide 3 — instant analysis"
```

---

## Chunk 3: Slide HTML Files (Slides 4-6)

### Task 6: Slide 4 — Investor Q&A Drill

**Files:**
- Create: `branding/product-hunt/slides/04-investor-qa.html`

- [ ] **Step 1: Write the complete slide 4 HTML file**

Create `branding/product-hunt/slides/04-investor-qa.html` using the shared skeleton. Split layout (mirrors slide 2 — copy LEFT, screenshot RIGHT):

1. **Gradient blobs:** coral left-center (`width: 700px; height: 700px; top: 50%; margin-top: -350px; left: -200px; background: rgba(255,89,65,0.15); filter: blur(120px)`), amber top-right (`width: 600px; height: 600px; top: -200px; right: -100px; background: rgba(255,170,51,0.15); filter: blur(100px)`)

2. **Content layout:** `display: flex; align-items: center; gap: 80px; padding: 80px 100px; min-height: 1520px;`

3. **Left side (flex: 0 0 38%):**
   - Headline: `<h1 class="headline" style="font-size: 56px; margin-bottom: 24px;">Get grilled<br>by an AI investor.<br>Before the real one.</h1>`
   - Body: `<p class="subtitle" style="font-size: 26px; margin-bottom: 32px;">Practice handling tough VC questions in a live 60-second drill. Real-time voice conversation with an AI investor who adapts to your answers.</p>`
   - Tags: `<div style="display: flex; gap: 16px;"><span class="tag tag-coral">Live Voice</span><span class="tag tag-amber">Adaptive AI</span></div>`

4. **Right side (flex: 1):** Screenshot in glassmorphic frame with `transform: perspective(1600px) rotateY(-3deg) rotateX(1deg)`. Image: `../screenshots/investor-qa.png`

- [ ] **Step 2: Visually verify**

```bash
open branding/product-hunt/slides/04-investor-qa.html
```

Check: mirrors slide 2 layout (copy left, screenshot right), Q&A transcript visible, tags readable.

- [ ] **Step 3: Commit slide 4**

```bash
git add branding/product-hunt/slides/04-investor-qa.html
git commit -m "feat: add PH gallery slide 4 — investor Q&A drill"
```

### Task 7: Slide 5 — Track Your Progress

**Files:**
- Create: `branding/product-hunt/slides/05-progress.html`

- [ ] **Step 1: Write the complete slide 5 HTML file**

Create `branding/product-hunt/slides/05-progress.html` using the shared skeleton. Centered layout:

1. **Gradient blobs:** coral bottom-center (`width: 900px; height: 700px; bottom: -250px; left: 50%; margin-left: -450px; background: rgba(255,89,65,0.2); filter: blur(120px)`), amber top-left (`width: 500px; height: 500px; top: -150px; left: -100px; background: rgba(255,170,51,0.1); filter: blur(100px)`)

2. **Content layout:** `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 1520px; padding: 60px 80px;`

3. **Headline:** `<h1 class="headline" style="font-size: 60px; text-align: center; margin-bottom: 24px;">From 57 to 91.<br>In 28 sessions.</h1>`

4. **Subtitle:** `<p class="subtitle" style="font-size: 26px; text-align: center; max-width: 800px; margin-bottom: 48px;">Watch your score climb session by session. Pitchr tracks your rubric breakdown, streaks, and performance trends over time.</p>`

5. **Screenshot:** `<div class="screenshot-frame" style="max-width: 1160px; transform: perspective(1600px) rotateX(5deg) rotateY(-1deg);"><img src="../screenshots/dashboard.png" alt="Dashboard"></div>` — same screenshot as slide 1, different tilt for visual variety.

- [ ] **Step 2: Visually verify**

```bash
open branding/product-hunt/slides/05-progress.html
```

Check: headline numbers prominent, tilt more dramatic than slide 1, upward trend visible.

- [ ] **Step 3: Commit slide 5**

```bash
git add branding/product-hunt/slides/05-progress.html
git commit -m "feat: add PH gallery slide 5 — track progress"
```

### Task 8: Slide 6 — Closing CTA

**Files:**
- Create: `branding/product-hunt/slides/06-cta.html`

- [ ] **Step 1: Write the complete slide 6 HTML file**

Create `branding/product-hunt/slides/06-cta.html` using the shared skeleton. Centered, **no screenshot**:

1. **Gradient blobs:** central coral glow (`width: 800px; height: 800px; top: 50%; left: 50%; margin-top: -400px; margin-left: -400px; background: rgba(255,89,65,0.18); filter: blur(120px)`), amber top-right (`width: 500px; height: 500px; top: -150px; right: -100px; background: rgba(255,170,51,0.12); filter: blur(100px)`)

2. **Content layout:** `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 1520px; padding: 60px 80px;`

3. **Logo (larger):** Pitchr icon at 56px square (`background: #e63b26; border-radius: 16px`) + "Pitchr" wordmark at 36px white. `margin-bottom: 40px`

4. **Headline:** `<h1 class="headline" style="font-size: 76px; text-align: center; margin-bottom: 32px;">Ship pitches<br>that close rounds.</h1>`

5. **Subtitle:** `<p class="subtitle" style="font-size: 28px; text-align: center; margin-bottom: 56px;">Free to start. No credit card required.</p>`

6. **Feature pills — two rows:**
   ```html
   <div style="display: flex; flex-direction: column; align-items: center; gap: 24px;">
     <div style="display: flex; gap: 24px;">
       <div class="pill"><span class="pill-dot" style="background: #ff5941;"></span>AI Scoring /100</div>
       <div class="pill"><span class="pill-dot" style="background: #ffaa33;"></span>Priority Fixes</div>
       <div class="pill"><span class="pill-dot" style="background: #4ade80;"></span>Investor Q&A Drills</div>
     </div>
     <div style="display: flex; gap: 24px;">
       <div class="pill"><span class="pill-dot" style="background: #ff5941;"></span>Script Rewrites</div>
       <div class="pill"><span class="pill-dot" style="background: #ffaa33;"></span>Delivery Metrics</div>
       <div class="pill"><span class="pill-dot" style="background: #4ade80;"></span>Progress Tracking</div>
     </div>
   </div>
   ```

   Pill CSS (add to `<style>`):
   ```css
   .pill {
     background: rgba(255,255,255,0.04);
     border: 2px solid rgba(255,255,255,0.08);
     border-radius: 48px;
     padding: 16px 32px;
     display: flex;
     align-items: center;
     gap: 12px;
     color: #ededec;
     font-size: 24px;
     font-weight: 500;
   }
   .pill-dot {
     width: 14px; height: 14px;
     border-radius: 50%;
     display: inline-block;
   }
   ```

- [ ] **Step 2: Visually verify**

```bash
open branding/product-hunt/slides/06-cta.html
```

Check: largest headline of all slides, clean with no screenshot, pills readable, coral glow dramatic but not overpowering.

- [ ] **Step 3: Commit slide 6**

```bash
git add branding/product-hunt/slides/06-cta.html
git commit -m "feat: add PH gallery slide 6 — closing CTA"
```

---

## Chunk 4: Capture & Export

### Task 9: Run Playwright capture and downscale all slides

**Files:**
- Read: `branding/product-hunt/slides/*.html` (all 6)
- Output: `branding/product-hunt/output/*.png` (6 final at 1270x760) + `*-2x.png` (6 hi-res at 2540x1520)

- [ ] **Step 1: Run the capture script**

```bash
cd /Users/julb/Desktop/GitHub/pitchr && node branding/product-hunt/capture.mjs
```

Expected output:
```
Captured 2x: 01-hero-2x.png (2540x1520)
Downscaled:  01-hero.png (1270x760)
Captured 2x: 02-session-2x.png (2540x1520)
Downscaled:  02-session.png (1270x760)
...
Done! 6 images saved to branding/product-hunt/output
```

- [ ] **Step 2: Verify final output dimensions are exactly 1270x760**

```bash
sips -g pixelWidth -g pixelHeight branding/product-hunt/output/01-hero.png branding/product-hunt/output/02-session.png branding/product-hunt/output/03-analysis.png branding/product-hunt/output/04-investor-qa.png branding/product-hunt/output/05-progress.png branding/product-hunt/output/06-cta.png
```

Each should report `pixelWidth: 1270` and `pixelHeight: 760`.

- [ ] **Step 3: Open final images to visually verify**

```bash
open branding/product-hunt/output/01-hero.png branding/product-hunt/output/02-session.png branding/product-hunt/output/03-analysis.png branding/product-hunt/output/04-investor-qa.png branding/product-hunt/output/05-progress.png branding/product-hunt/output/06-cta.png
```

Visual checklist for each image:
- [ ] Gradient blobs visible but subtle (not overwhelming)
- [ ] Headline text sharp and readable at 1270px
- [ ] Screenshot clearly shows app content (no blur from downscale)
- [ ] Glassmorphic frame shadow visible
- [ ] Tags/pills legible
- [ ] No content clipping at edges
- [ ] Overall composition is balanced

- [ ] **Step 4: Commit final output**

```bash
git add branding/product-hunt/output/
git commit -m "feat: export final PH gallery images (6 slides, 1270x760)"
```

### Task 10: Visual polish pass

After initial capture, iterate on any slides that need adjustment.

- [ ] **Step 1: Compare each image to the spec checklist**

For each of the 6 images, check against `docs/superpowers/specs/2026-03-13-product-hunt-gallery-design.md`:
- Gradient blob position matches spec (top-right, bottom-left, etc.)
- Font sizes are readable after downscale
- Screenshot frame shadow and tilt look natural
- Whitespace between elements is balanced
- Tags/pills have enough contrast
- Split layouts (slides 2, 4) have proper visual weight distribution

- [ ] **Step 2: Fix any issues in the HTML source files**

Edit the relevant `branding/product-hunt/slides/*.html` files. Common fixes:
- Increase gradient blob opacity if too subtle after downscale
- Adjust padding/margins if elements feel cramped
- Tweak font sizes if text is too small at final resolution
- Adjust tilt angle if perspective looks off

- [ ] **Step 3: Re-capture fixed slides**

```bash
cd /Users/julb/Desktop/GitHub/pitchr && node branding/product-hunt/capture.mjs
```

- [ ] **Step 4: Re-verify and commit**

```bash
open branding/product-hunt/output/01-hero.png branding/product-hunt/output/02-session.png branding/product-hunt/output/03-analysis.png branding/product-hunt/output/04-investor-qa.png branding/product-hunt/output/05-progress.png branding/product-hunt/output/06-cta.png
git add branding/product-hunt/
git commit -m "polish: finalize PH gallery images after visual review"
```
