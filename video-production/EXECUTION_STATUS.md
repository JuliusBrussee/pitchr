# Pitchr Launch Video — Execution Status

## COMPLETED (Automated)

### Assets Built
- [x] **Founder character reference** — `captures/founder_master_reference.png` (generated via ChatGPT DALL-E)
- [x] **Scene 6 logo animation** — `scene6/animation.html` (working HTML/CSS/JS, screen-record at 1080x1920)
- [x] **Video capture page** — `http://localhost:3000/video-capture?score=62` and `?score=85` (mock Pitchr UI for Scenes 3B/4C)
- [x] **Music tracks** — 2 tracks generated on Udio: "Silent Aspirations" + "Gentle Climax" (ambient neo-classical, 2:10 each)
- [x] **UI screenshots** — score62, score85, score92, landing page, demo page (in `captures/`)
- [x] **Production bible** — `PRODUCTION_PACKAGE.md` (900+ lines, zero-ambiguity)
- [x] **10 prompt files** — ready to copy-paste into each tool

### Research Completed
- [x] Kling 3.0 prompt engineering guide
- [x] Sora 2 prompt engineering guide
- [x] Higgsfield Soul ID / Soul Cinema / Photodump research
- [x] Tool comparison and pricing

---

## REMAINING — Manual Steps (Do in Browser)

### Step 1: Download Udio Music
1. Go to udio.com/create → My Library
2. Listen to "Silent Aspirations" and "Gentle Climax"
3. Download the better one (click ··· → Download)
4. Save to `video-production/audio/soundtrack.mp3`

### Step 2: Generate Voiceover on ElevenLabs
1. Go to elevenlabs.io/app/speech-synthesis/text-to-speech
2. Select voice: "Daniel" (warm confident male) or search for a South Asian male voice
3. Settings: Stability 0.65, Clarity 0.78, Style 0.45
4. Generate these 4 lines separately, download each:

**Line 1:** "Every founder starts with the same fear."
- Delivery: quiet, reflective, 110 WPM

**Line 2:** "Will my pitch actually land?"
- Delivery: even quieter, upward inflection on "land?"

**Line 3:** "Pitchr uses AI to score your pitch in under thirty seconds — across structure, clarity, evidence, market, and delivery."
- Delivery: confident, 140 WPM, slight emphasis on "thirty seconds"

**Line 4:** "Practice. Improve. Become investor-ready."
- Delivery: each word is its own beat, 90 WPM, resolute

5. Save all to `video-production/audio/`

### Step 3: Generate Video Scenes

**Option A: Higgsfield (RECOMMENDED — best character consistency)**
1. Subscribe to Higgsfield Creator ($24/mo) at higgsfield.ai/pricing
2. Go to Character → Create Soul ID → Upload `founder_master_reference.png`
3. Use Soul Cinema to generate keyframes for each scene (paste prompts from `prompts/02-07`)
4. Use Kling 3.0 integration (included free) to animate keyframes into video

**Option B: Kling 3.0 Standalone**
1. Subscribe to Kling Standard ($6.99/mo) to skip free-tier queue
2. Go to Image Generation → paste character prompt from `prompts/01_character_reference.md`
3. Upload best result as Universal Reference
4. Go to Video Generation → paste each scene prompt from `prompts/02-07`
5. For Scene 5: use Sora 2 Pro via ChatGPT (you have Plus) — paste from `prompts/07_scene5_investor_ready.md`

**Option C: ChatGPT/Sora (Free with your Plus plan)**
1. Use ChatGPT to generate videos with Sora
2. Paste each scene prompt from `prompts/02-07` into ChatGPT
3. Ask it to generate video for each scene
4. Note: character consistency may be weaker without Soul ID

### Step 4: Screen Record Pitchr UI
1. Start Pitchr dev server: `cd C:\dev\pitchr && npm run dev`
2. Open OBS Studio, set canvas to 430x932 (mobile)
3. Navigate to `http://localhost:3000/video-capture?score=62`
4. Click "Hide Controls", then "Replay Animations"
5. Record for 5 seconds → save as `scene3b_score62.mp4`
6. Repeat with `?score=85` → save as `scene4c_score85.mp4`

### Step 5: Screen Record Scene 6
1. Start static server: `cd C:\dev\pitchr\video-production\scene6 && npx http-server -p 8888`
2. Open browser at 1080x1920 viewport
3. Navigate to `http://localhost:8888/animation.html`
4. Record with OBS for 10 seconds → save as `scene6_cta.mp4`

### Step 6: Assemble in DaVinci Resolve
1. Download DaVinci Resolve 19 (free) from blackmagicdesign.com
2. Import all video clips + screen recordings + music + VO
3. Follow the assembly order in `PRODUCTION_PACKAGE.md` (Scene 1-6)
4. Apply per-scene color grades (specs in production bible)
5. Mix audio following the dB levels in each scene's audio table
6. Export: H.265, 24fps, 1080x1920 (9:16) and 3840x2160 (16:9)

---

## Cost Summary

| Service | Status | Cost |
|---------|--------|------|
| ChatGPT Plus | Already subscribed | $20/mo (included) |
| Udio | Generated on free tier | $0 |
| ElevenLabs | Free tier (10k chars) | $0 |
| Higgsfield Creator (recommended) | Needs subscription | $24/mo |
| OR Kling Standard | Alternative | $6.99/mo |
| DaVinci Resolve | Free | $0 |
| **Total** | | **$24-44** |
