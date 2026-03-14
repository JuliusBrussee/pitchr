# Pitchr Launch Video — Production Package v1.0

> Zero-ambiguity, scene-by-scene production bible for creating an ultra-realistic AI-generated launch video for pitchr.live.

---

## FINAL TOOL STACK (March 2026 — Validated)

### Video Generation

| Tool | Role | Why This One | Pricing |
|------|------|-------------|---------|
| **Kling 3.0 Pro** | Primary video generator | Native 4K, up to 15s/generation, best character consistency via Universal Reference (7 ref images), built-in audio, micro-expression realism with skin pores and hair strands | $0.153/second (pay-as-go) or $66/mo Pro |
| **Sora 2 Pro** | Hero shots only (Scene 5) | Best temporal coherence, cinematic physics, 4D spatiotemporal consistency — character emerges from behind objects with same lighting/clothing | $200/mo (ChatGPT Pro) |
| **Kling Turbo** | Prototype pass | Fast, cheap iteration — test all prompts here before hero render | Included in Pro |

### Image Generation (Keyframes)

| Tool | Role | Why |
|------|------|-----|
| **Flux 2 Pro** (via fal.ai) | Primary keyframe generator | #1 photorealism (Elo 1265), camera-accurate optics — Kling responds best to photographically realistic inputs | Pay-per-image (~$0.04 each) |
| **Midjourney v7** | Mood/composition reference | Unmatched aesthetic and compositional quality for hero shots and mood boards | $10/mo Basic |

### Audio

| Tool | Role | Why |
|------|------|-----|
| **ElevenLabs** (Creator) | Voiceover | Industry standard cinematic narration, 30-second voice cloning, 29 languages | $22/mo Creator |
| **Udio** | Custom soundtrack | Best cinematic instrumental quality — 48kHz output, clean instrument separation, superior to Suno for ambient/orchestral | ~$10/mo |

### Post-Production

| Tool | Role |
|------|------|
| **DaVinci Resolve 19** (free) | Timeline edit, color grade, sound mix, compositing |
| **Topaz Video AI 5** | Upscale to 4K, stabilize, remove artifacts | $199 one-time |

---

## THE CHARACTER — "THE FOUNDER"

> This exact description must appear in EVERY prompt to maintain character consistency across all 6 scenes.

### Character Anchor (Copy-Paste Into Every Prompt)

```
A 28-year-old South Asian male startup founder. Oval face, warm medium-brown skin tone,
clean-shaven with faint 5-o'clock shadow along the jawline. Dark brown eyes with thick
straight eyebrows. Short black hair, side-parted to the left, neat but slightly tousled.
Small dark mole on the right side of his neck just below the ear. Slim athletic build,
5'10" height. Wearing a charcoal heather cotton hoodie with a small embroidered logo on
the left chest (abstract "P" mark in coral-orange thread). Dark indigo slim-fit jeans.
Clean white Nike Air Force 1 sneakers. Silver minimalist watch on left wrist (thin round
face, black leather strap).
```

### Character Identity Lock Strategy

1. **Generate 10 reference portraits in Midjourney v7:**
   ```
   Editorial portrait photograph of a 28-year-old South Asian male, oval face, warm
   medium-brown skin, clean-shaven with faint stubble along jawline, dark brown eyes,
   thick straight eyebrows, short black side-parted hair slightly tousled, small dark
   mole on right side of neck below ear, wearing charcoal heather cotton hoodie, warm
   studio lighting, 85mm lens, f/1.4, shallow depth of field, neutral grey background,
   photojournalistic style --ar 2:3 --v 7 --style raw
   ```
2. **Pick the single best portrait** — this becomes your MASTER REFERENCE
3. **Upload to Kling 3.0 as Universal Reference** for all scenes
4. **Upload to Sora 2 as Character Reference** for Scene 5

---

## VIDEO SPECIFICATIONS

| Parameter | Value |
|-----------|-------|
| Total Duration | 68 seconds |
| Primary Aspect Ratio | 9:16 (1080x1920) for Instagram Reels / TikTok |
| Secondary Aspect Ratio | 16:9 (3840x2160) for YouTube / Website |
| Frame Rate | 24fps (cinematic motion blur) |
| Color Depth | 10-bit |
| Codec | H.265/HEVC |
| Bitrate | 50 Mbps (9:16), 80 Mbps (16:9) |
| Audio | 48kHz, 24-bit, stereo |

---

## SCENE-BY-SCENE PRODUCTION BIBLE

---

### SCENE 1: THE ANXIETY
**Duration:** 0:00 – 0:08 (8 seconds)
**Emotional Arc:** Isolation → Determination → Quiet Dread

#### Environment (Exact Description)

A small studio apartment bedroom repurposed as a home office. Time: 11:47 PM (visible on a digital clock on the desk — small red LED digits). The room is dark except for two light sources:

1. **Key light:** A brass gooseneck desk lamp with a warm Edison bulb (2700K color temperature), positioned to the left of the founder, casting a warm golden pool of light on the left side of his face, the desk surface, and the wall behind. The light falls off sharply — the right side of the room is in deep shadow.

2. **Fill light:** The cool blue-white glow (6500K) from a 14" MacBook Pro screen directly in front of the founder. This creates a subtle blue rim on the right side of his face, his chin, and the front of his hoodie.

**Desk contents (visible in frame):**
- MacBook Pro 14" (screen showing a blurred text document — NOT the Pitchr app yet)
- 3 crumpled yellow sticky notes to the left of the laptop
- 2 flat sticky notes with handwritten text (illegible at this distance)
- A white ceramic mug, half-full with dark coffee, positioned at the right edge of the desk
- A black iPhone 15 Pro lying face-down next to the mug
- A small stack of 3-4 business cards held together with a binder clip

**Room background (soft focus, barely visible):**
- A bookshelf with books and a small potted succulent
- A grey fabric office chair (the founder is sitting in it)
- Exposed brick wall texture behind the desk (warm terracotta tones)

#### Camera

- **Lens:** 85mm prime, f/1.4 (extremely shallow depth of field — only the founder's face and the desk lamp are in sharp focus; everything else falls into creamy bokeh)
- **Movement:** Slow, steady dolly-in starting from a medium close-up (chest up) and ending at a tight close-up (face only, forehead to chin). The dolly-in covers approximately 18 inches of forward movement over 8 seconds. Speed: constant, no acceleration/deceleration.
- **Angle:** Eye level, straight-on, very slight (2-degree) upward tilt
- **Stabilization:** Perfect — no handheld shake. Tripod-smooth. This is deliberate and controlled.

#### Character Action (Beat-by-Beat)

| Timestamp | Action |
|-----------|--------|
| 0:00-0:02 | Founder sits motionless, staring at laptop screen. His lips are pressed together. Jaw slightly clenched. Brow furrowed — 2mm crease between eyebrows. Hands rest on the desk, fingers interlaced. |
| 0:02-0:04 | His lips begin to move — silently mouthing words (rehearsing his pitch). No sound comes out. Eyes stay fixed on the screen. His right thumb unconsciously rubs against his left index finger (nervous habit). |
| 0:04-0:06 | He closes his eyes for 1.5 seconds. Takes a slow, deep breath — his chest rises and falls visibly under the hoodie. When his eyes reopen, there is a flash of determination. |
| 0:06-0:08 | He exhales slowly through his nose. His jaw unclenches. He lifts his right hand and runs it through his hair once (a self-soothing gesture). His gaze drops to the sticky notes, then back to the screen. |

#### Color Grade

- **Overall:** Desaturated warm tones. Shadows pushed toward deep navy blue (not pure black). Highlights are warm amber/gold from the desk lamp. Midtones are muted — skin tones are natural but not vibrant.
- **Blacks:** Lifted slightly (IRE 5-8, not crushed to 0). This creates an indie drama/documentary feel.
- **Film grain:** Subtle 35mm grain overlay at 15% opacity. Grain should be fine, not chunky.
- **Contrast:** Medium-low. The image feels soft and intimate, not punchy.

#### Audio Design

| Layer | Description | Volume |
|-------|-------------|--------|
| Room tone | Low-frequency hum of a quiet apartment — refrigerator hum in another room, very faint | -30dB |
| City ambient | Distant traffic: occasional car passing, muted through closed windows | -36dB |
| Clock tick | Slow, mechanical clock tick — one tick per 1.2 seconds, slightly reverb'd | -28dB |
| Breath | Founder's slow exhale at 0:04 — subtle, naturalistic | -22dB |
| Music | Sustained low C2 piano note with soft sustain pedal, barely audible, slowly building | -34dB → -28dB |

#### Kling 3.0 Prompt (Final)

```
[Reference: Upload founder master portrait as Universal Reference]

A 28-year-old South Asian male founder sits alone at a desk in a dimly lit studio
apartment at night. He wears a charcoal heather hoodie. A warm brass desk lamp with
an Edison bulb illuminates the left side of his face in golden 2700K light. A MacBook
Pro screen in front of him casts cool blue-white 6500K light on the right side of his
face. The desk has crumpled yellow sticky notes, a half-full white coffee mug, and a
face-down iPhone.

His lips press together with a furrowed brow, then begin moving silently — rehearsing
words. He closes his eyes, takes a deep breath, reopens them with quiet determination,
then runs his right hand through his short black hair.

Camera: 85mm prime lens, f/1.4, extremely shallow depth of field. Slow steady dolly-in
from medium close-up to tight close-up over 8 seconds. Eye level, tripod-smooth, no
handheld shake.

Style: Desaturated warm tones, lifted blacks, subtle 35mm film grain. Navy-blue
shadows, amber-gold highlights. Documentary realism. Cinematic 24fps.

Negative: jittery motion, morphing, flickering, frame inconsistency, AI smoothing,
overlit, flash photography, neon colors.
```

#### Text Overlay: NONE (pure visual storytelling)

---

### SCENE 2: THE ATTEMPT
**Duration:** 0:08 – 0:20 (12 seconds)
**Emotional Arc:** False Confidence → Stumble → Frustration → Reset

#### Environment (Exact Description)

A modern co-working space during daytime. Time: approximately 2:00 PM (bright daylight). The space is an open-plan office with:

- **Floor:** Light grey polished concrete
- **Walls:** White with one accent wall in warm light wood paneling
- **Windows:** Floor-to-ceiling glass windows on the left side, letting in abundant soft daylight (overcast sky — diffused light, no harsh shadows)
- **Furniture (background, out of focus):**
  - Two white standing desks with monitors, 15 feet behind the founder
  - A green pothos plant hanging from a macrame planter
  - 2-3 other people working at desks (blurred, anonymous — they don't look up)
- **The founder's setup:**
  - An iPhone 15 Pro mounted on a small black tabletop tripod (Joby GorillaPod style) at eye level, positioned 4 feet in front of him on a white desk
  - The phone's screen faces the founder (he can see himself in the camera preview)
  - The red recording indicator dot is visible on the phone screen

#### Camera

- **Lens:** 50mm prime, f/2.0 (moderate depth of field — founder is sharp, background people/desks are softly blurred but recognizable)
- **Movement:** Subtle handheld micro-shake. NOT dramatic — just 1-2mm of organic movement that makes it feel like a documentary cameraman is filming. The frame breathes slightly.
- **Framing:** Medium shot — head to waist. Founder is centered, with 20% headroom. The phone-on-tripod is visible at the bottom-right edge of frame.
- **Angle:** Eye level, straight-on

#### Character Action (Beat-by-Beat)

| Timestamp | Action |
|-----------|--------|
| 0:08-0:10 | Founder stands with feet shoulder-width apart, hands at sides. He takes a breath, squares his shoulders, and begins speaking with forced confidence. His chin lifts slightly. His right hand comes up in a rehearsed gesture (pointing forward). |
| 0:10-0:13 | Mid-sentence, he stumbles on a word. His hand freezes mid-gesture. His eyes break from the camera and dart down-left for 0.5 seconds. He says "um..." audibly. His shoulders drop 1 inch. He brings his left hand up and touches the back of his neck (anxiety gesture). |
| 0:13-0:15 | He stops speaking entirely. Closes his mouth. Looks down at the floor for 1.5 seconds. His jaw works slightly — frustration. He exhales audibly through his nose. |
| 0:15-0:18 | He looks back up at the phone camera. Takes a fresh breath. Says "Okay, let me start over." His voice is quieter, less confident. He straightens his posture again but the confidence is thinner now. |
| 0:18-0:20 | He begins again, speaking to the camera. This time his gestures are smaller, more tentative. We see him from this medium shot as he speaks — the visual cuts just as he's getting going. |

#### Outfit Change: NONE (same charcoal hoodie, same jeans, same watch — continuity)

#### Color Grade

- **Overall:** Warm naturalistic tones. Slightly overexposed highlights from the window light (+0.5 stop). Skin tones are accurate and warm.
- **Shadows:** Neutral to slightly warm (not blue like Scene 1 — this is daytime)
- **Highlights:** Soft, blown-out window light wrapping around his shoulder (natural rim light effect)
- **Contrast:** Medium. More natural-looking than Scene 1.
- **Film grain:** Very subtle — 8% opacity. Lighter than Scene 1.

#### Audio Design

| Layer | Description | Volume |
|-------|-------------|--------|
| Room ambience | Open-plan office: keyboard clicks, distant conversation murmur, HVAC hum | -26dB |
| Founder's voice | Clear but slightly room-reverb'd. Authentic quality — not studio-polished. He says: "So, the problem we're solving is... um... basically, like, founders struggle to..." then stops. | -12dB |
| Music | Ambient pad continues from Scene 1, now slightly warmer. Adds a second layer — a high sustained violin harmonic (barely audible). | -26dB |

#### Kling 3.0 Prompt (Final)

```
[Reference: Same founder Universal Reference]

Same 28-year-old South Asian male founder, charcoal hoodie, stands in a bright modern
co-working space. Floor-to-ceiling windows on the left cast soft overcast daylight.
White desks, green hanging plants, 2-3 blurred people working in background.

He stands facing an iPhone mounted on a small black tabletop tripod 4 feet in front
of him. He begins speaking confidently with a forward-pointing gesture, then stumbles
mid-sentence. His hand freezes. His eyes dart down. He says "um" and touches the back
of his neck. He stops, looks at the floor in frustration, exhales, then says "okay,
let me start over" and begins again with less confidence.

Camera: 50mm lens, f/2.0, medium shot (head to waist), centered framing. Subtle
handheld micro-shake — 1-2mm organic movement, documentary feel. Eye level.

Style: Warm naturalistic tones, slightly overexposed window highlights, natural skin
tones. Soft window rim light on shoulders. 24fps cinematic. Light film grain.

Audio: Office ambience (keyboard clicks, murmur), founder's voice with room reverb,
he stumbles saying "um" and pauses.

Negative: static camera, jittery motion, morphing, flickering, AI smoothing,
perfect lighting, studio setup.
```

#### Text Overlay (Added in Post-Production)

- **Timing:** Fades in at 0:16, holds until 0:20
- **Text:** "Every founder starts here."
- **Font:** Inter, 400 weight, 16px (9:16) / 24px (16:9)
- **Color:** #ffffff at 85% opacity
- **Position:** Lower-third, 8% from bottom, center-aligned
- **Animation:** 400ms fade-in, no fade-out (cuts with scene)

---

### SCENE 3: THE ANALYSIS — PITCHR IN ACTION
**Duration:** 0:20 – 0:36 (16 seconds)
**Emotional Arc:** Curiosity → Discovery → Recognition → Hope

#### This Scene is a HYBRID (AI Video + Screen Recording)

**Shot A (0:20–0:26):** AI-generated over-shoulder shot of founder looking at laptop
**Shot B (0:26–0:36):** Screen recording of actual Pitchr UI with animations

#### Shot A — Over-Shoulder (AI-Generated, 6 seconds)

**Environment:** Same co-working space from Scene 2, but now the founder is seated at a white standing desk (lowered to sitting height). He sits in a dark grey Herman Miller-style mesh office chair.

**Camera:**
- **Lens:** 35mm, f/2.8
- **Framing:** Over-the-right-shoulder. We see the back of the founder's right shoulder and head (sharp), and the laptop screen in front of him (slightly soft focus initially, then rack-focuses to the screen at 0:23)
- **Movement:** Slow push-in, starting from behind-shoulder and ending closer to the screen. 6 inches of forward movement over 6 seconds.
- **Angle:** Slightly elevated (10 degrees above eye level, looking down at the screen)

**Character Action:**
| Timestamp | Action |
|-----------|--------|
| 0:20-0:22 | We see his right shoulder and the back of his head. He's looking at the laptop screen. His right hand moves the trackpad. |
| 0:22-0:24 | He taps the trackpad decisively (clicking the "Analyze" button). His head tilts slightly forward — leaning in. |
| 0:24-0:26 | His head nods almost imperceptibly — a micro-nod of recognition as results appear. His right hand lifts off the trackpad and rests on the desk. |

**On the laptop screen (composited in post):** The Pitchr results page loading — but for the AI generation, the screen should just show a blurred warm-orange glow (the Pitchr brand color) that brightens at 0:22 when he clicks. The actual UI will be composited over this.

**Kling 3.0 Prompt (Shot A):**
```
[Reference: Same founder Universal Reference]

Over-the-right-shoulder shot of the same 28-year-old South Asian male founder sitting
at a white desk in a bright co-working space. He wears the charcoal hoodie. We see the
back of his right shoulder and head in the foreground (sharp focus). A 14-inch MacBook
Pro laptop is open on the desk in front of him, screen glowing with warm orange-tinted
light.

His right hand operates the trackpad. He taps it decisively, then leans forward slightly.
His head gives an almost imperceptible nod of recognition.

Camera: 35mm lens, f/2.8, over-shoulder framing. Slow push-in (6 inches over 6 seconds).
Slightly elevated angle (10 degrees above eye level). Rack focus from shoulder to screen
at 3 seconds.

Style: Clean modern tech aesthetic, warm daylight from windows, slightly cool-toned
compared to previous scenes. Naturalistic. 24fps.

Negative: front-facing shot, morphing, jitter, AI smoothing.
```

#### Shot B — Pitchr UI Screen Recording (10 seconds)

**This is NOT AI-generated. This is a real screen recording of the Pitchr app.**

**What to capture (in this exact order):**

| Timestamp | UI Element | Visual Description |
|-----------|-----------|-------------------|
| 0:26-0:29 | **ScoreHero component** | A 110x110px SVG ring (5px stroke) animates clockwise from 0 to 62%. The ring color transitions from red (#b72700 at 0%) through amber (#917200 at 50%) to the final score color (at 62/100, the hue = 74.4°, yielding approximately #5d8a17 — a muted olive-green). Inside the ring: the number counts up from 0 to 62 in bold 30px Inter font, with "/100" below in 10px muted grey. Below the ring: a pill badge appears reading "Solid" in olive-green text on olive-green/10% background. Animation: ring draws over 1100ms with cubic ease-out, number counts in sync. |
| 0:29-0:32 | **Rubric mini-rings** | Five mini rings (44x44px, 4px stroke each) cascade in from the right side, staggered 80ms apart. Each has a category label and score: **Structure** (#ff5941, 14/20), **Clarity** (#ffaa33, 13/20), **Evidence** (#22c55e, 11/20), **Market** (#f97316, 12/20), **Delivery** (#ef4444, 12/20). Each ring animates its fill clockwise. Below each: a one-line rationale in 11px text. |
| 0:32-0:34 | **Delivery Events Timeline** | A horizontal row of colored pill buttons appears. Each pill shows a timestamp and label: filler events in amber (#ffaa33) — "0:12 · like", "0:23 · basically", "0:31 · um"; hesitation events in blue (#3b82f6) — "0:18 · long pause"; stutter events in red (#ef4444) — "0:27 · restart". Legend dots in upper right corner. |
| 0:34-0:36 | **TopFixes cards** | Two fix cards slide in from below. Each card has a 3px left border colored by impact (red = high, amber = medium). Card 1: Rank "1" in a red circle, category "structure", impact "High" badge, issue text, green arrow → fix suggestion. Card 2: Same pattern with amber "Med" badge. |

**Screen Recording Settings:**
- Record at 2x resolution (2160x3840 for 9:16) for clean compositing
- Use a real or staged pitch analysis in the Pitchr app
- Dark mode OFF — use light theme for maximum contrast and visibility in the video
- Ensure animations play at native speed (do not speed up)

**Color Grade for Shot B:**
- Keep the UI at native colors — do NOT grade the screen recording
- Add a very subtle vignette around the edges (10% opacity black) to draw the eye to center
- Add a slight warm glow bloom at the edges where the UI meets the dark border (simulating screen light spill)

#### Audio Design (Full Scene 3)

| Layer | Description | Volume |
|-------|-------------|--------|
| UI sound — click | Soft mechanical click when founder taps trackpad at 0:22 | -18dB |
| UI sound — score reveal | A bright, short "ding" tone (C5 note, 200ms, sine wave with fast decay) when score ring completes at 0:29 | -16dB |
| UI sound — cascade | 5 very quiet "tick" sounds (one per rubric ring, staggered 80ms) | -24dB |
| Music | Ambient pad now adds a gentle piano figure — two ascending notes (C4, E4) played slowly, with reverb tail. Builds anticipation. | -22dB |
| Room ambience | Continues from Scene 2 but quieter — the UI takes focus | -32dB |

#### Text Overlay (Added in Post-Production)

- **Timing:** Fades in at 0:33, holds until 0:36
- **Text:** "AI-powered pitch analysis in 30 seconds."
- **Font:** Inter, 500 weight, 14px
- **Color:** #ffffff at 90% opacity
- **Position:** Bottom center, 6% from bottom
- **Animation:** 300ms fade-in

---

### SCENE 4: THE TRANSFORMATION
**Duration:** 0:36 – 0:50 (14 seconds)
**Emotional Arc:** Learning → Practice → Growth → Confidence

#### This is a MONTAGE — 4 quick cuts

---

**CUT A: THE FIX LIST (0:36 – 0:39, 3 seconds)**

**Visual:** Extreme close-up of a phone screen showing Pitchr's TopFixes component. The phone is held in the founder's left hand (we see his fingers gripping the phone edges, the silver watch on his wrist). The screen shows:
- Fix #1: Red circle with "1", "structure" label, "High" impact badge, issue text, green arrow with fix suggestion
- Fix #2 partially visible below

**Camera:** Macro close-up, rack focus from the phone screen (sharp) to the founder's eyes (blurred background, then sharp) over 3 seconds. 85mm, f/1.4.

**Kling 3.0 Prompt:**
```
[Reference: Same founder Universal Reference]

Extreme close-up of a phone held in a man's left hand. His fingers grip the edges of
a black iPhone. A silver watch with black leather strap is visible on his wrist. The
phone screen shows text with red and amber colored badges and green arrow icons (the
screen content will be composited in post — show a warm-lit blurred screen glow).

Camera rack-focuses from the phone screen to the man's eyes in the blurred background
over 3 seconds. His dark brown eyes are visible with a look of focused concentration.

Camera: 85mm macro close-up, f/1.4, extremely shallow depth of field. Steady, no
movement. Warm ambient lighting.

Style: Warm tones, intimate, documentary realism. 24fps.
```

---

**CUT B: THE CONFIDENT RE-TRY (0:39 – 0:44, 5 seconds)**

**Visual:** Same co-working space as Scene 2, but the light has changed — it's now golden morning light (suggesting a new day, time progression). The founder stands in the same position, speaking to the same phone on tripod, but everything about his delivery is different:

**Character Action:**
| Timestamp | Action |
|-----------|--------|
| 0:39-0:41 | He speaks with open, natural gestures. His right hand extends palm-up (inclusive gesture). His posture is upright but relaxed — shoulders back but not tense. |
| 0:41-0:44 | He continues speaking with flow — no stumbles, no "um". His left hand comes up to reinforce a point (two-finger emphasis gesture). A slight smile appears at the corner of his mouth. |

**Camera:** Same 50mm, f/2.0, medium shot as Scene 2 — BUT the camera is now STEADY (no handheld shake). This mirrors his gained confidence. The stillness of the camera reflects the stillness of his mind.

**Lighting change:** Golden morning sunlight (color temp ~4000K, vs the overcast ~6500K of Scene 2) streams through the windows at a low angle, creating warm shafts of light. One shaft of light catches the dust particles in the air behind him (visible bokeh particles).

**Kling 3.0 Prompt:**
```
[Reference: Same founder Universal Reference]

Same 28-year-old South Asian male founder in charcoal hoodie, standing in the same
bright co-working space. Golden morning sunlight streams through floor-to-ceiling
windows at a low angle, creating warm light shafts with visible dust particles.

He speaks to an iPhone on a tripod with confident, open gestures — right hand extends
palm-up, then left hand makes a two-finger emphasis gesture. His posture is upright
and relaxed. No stumbling. A slight confident smile appears at the corner of his mouth.

Camera: 50mm, f/2.0, steady medium shot (head to waist), centered. NO handheld shake —
perfectly still camera reflecting confidence. Eye level.

Style: Warm golden morning tones (4000K sunlight), slightly amber highlights. Warm
color grade. Visible light shafts and floating dust particles in bokeh. 24fps cinematic.

Negative: handheld shake, stumbling, nervousness, cold lighting, overcast.
```

---

**CUT C: THE SCORE CLIMBS (0:44 – 0:47, 3 seconds)**

**Visual:** Screen recording of Pitchr ScoreHero component, but this time the score animates to 85/100.

**The ring animation:**
- Ring draws clockwise from 0% to 85%
- Color: at 85/100, hue = 102°, approximately #35911f (bright green)
- Number counts 0 → 85 in 1100ms
- Badge below reads: "Investor-Ready" in green text on green/10% background
- The ring has a subtle glow effect (box-shadow with the score color at 20% opacity)

**Camera (simulated):** The screen recording has a subtle 3D parallax tilt applied in post — the UI appears to tilt 2-3 degrees as if we're slowly orbiting around a phone screen. This adds depth and prevents the flat-screen-recording look.

**Brand accent:** A subtle radial gradient glow in Pitchr orange (#ff5941) emanates from behind the score ring, pulsing once when the score lands on 85.

---

**CUT D: THE KNOWING SMILE (0:47 – 0:50, 3 seconds)**

**Visual:** Tight close-up of the founder's face. Same golden morning light from Cut B, but now we're CLOSE — forehead to chin, filling the frame. His face is in sharp focus. Background is completely blown out into warm golden bokeh.

**Character Action:**
| Timestamp | Action |
|-----------|--------|
| 0:47-0:48 | His expression is neutral-focused. He's just finished speaking. |
| 0:48-0:49 | The corners of his mouth turn upward — a subtle, genuine smile. Not a grin — a small smile of quiet satisfaction. His eyes soften. |
| 0:49-0:50 | He gives a single, almost imperceptible nod. He knows. |

**Camera:** 85mm, f/1.4, tight close-up. Slow dolly-in (3 inches over 3 seconds). Golden hour light hitting his face from the left at a 45-degree angle, creating Rembrandt lighting (triangle of light on the shadow side of his face).

**Kling 3.0 Prompt:**
```
[Reference: Same founder Universal Reference]

Tight close-up of the same 28-year-old South Asian male founder's face, forehead to
chin filling the frame. Golden morning sunlight hits his face from the left at a
45-degree angle, creating Rembrandt lighting with a triangle of light on the right
cheek. Background is completely blown out into warm golden bokeh.

His expression transitions from neutral-focused to a subtle, genuine smile — corners
of mouth turn up slightly. His eyes soften. He gives one almost imperceptible nod.

Camera: 85mm, f/1.4, tight close-up. Slow dolly-in (3 inches over 3 seconds).
Tripod-smooth.

Style: Warm golden tones, high-key highlights, Rembrandt lighting, aspirational,
intimate. Extremely shallow depth of field with creamy bokeh. 24fps.

Negative: grinning, laughing, exaggerated expression, cold light, flash.
```

#### Audio Design (Full Scene 4 Montage)

| Layer | Description | Volume |
|-------|-------------|--------|
| Music | Transition point — ambient pads now gain a gentle rhythm. A soft kick drum enters (muted, not punchy — more felt than heard, 80bpm). Piano figure becomes a repeating 4-note ascending pattern (C4-E4-G4-C5). The energy builds but stays restrained. | -18dB |
| Voice (Cut B) | Founder's voice, now clear and confident — no muffling, no room reverb. He says: "Pitchr analyzes your pitch across five dimensions — structure, clarity, evidence, market awareness, and delivery." Smooth, no filler words. | -10dB |
| Score sound (Cut C) | Rising tone — a synthesized ascending glissando over 1.5 seconds, landing on a satisfying "arrival" note (C5) | -16dB |

#### Text Overlay

- **Timing:** Fades in at 0:44, holds until 0:50
- **Text:** "Practice. Improve. Repeat."
- **Font:** Inter, 600 weight (semibold), 18px
- **Color:** #ffffff at 95% opacity
- **Position:** Bottom center, 6% from bottom
- **Animation:** 400ms fade-in, 400ms fade-out at end

---

### SCENE 5: THE MOMENT — INVESTOR READY
**Duration:** 0:50 – 1:00 (10 seconds)
**Emotional Arc:** Command → Authority → Triumph

#### Environment (Exact Description)

A modern pitch stage / presentation room. NOT a massive auditorium — an intimate, high-end space that seats 20-30 people. Think: Y Combinator Demo Day style, or a VC firm's presentation room.

- **Stage area:** A small raised platform (6 inches, dark grey carpet) with no podium — just open space. A large 65" flat-screen TV mounted on a minimal black stand behind the founder shows a blurred slide deck (the Pitchr logo is barely visible on the slide in warm orange).
- **Lighting:** Professional three-point setup:
  - **Key:** Soft 5600K daylight LED panel, positioned 45 degrees left, creating clean, even illumination on the founder's face
  - **Hair/rim light:** Warm 3200K tungsten spot from behind-right, creating a warm golden edge on his right shoulder and the right side of his hair
  - **Ambient fill:** Soft wash of cool blue-grey light on the background wall
  - **Stage spots:** 3 warm-toned downlights creating pools of light on the stage floor
- **Audience (foreground, out of focus):** The backs of 4-5 heads visible in the bottom 15% of frame — silhouettes in soft focus. One person has their hand on their chin (engaged listening posture).
- **Background wall:** Dark charcoal with subtle texture, with the stage TV and 2 recessed warm spotlights.

#### Character — Outfit Change

The founder is now wearing:
- **A dark navy blue blazer** over the SAME charcoal hoodie (the hoodie is visible at the neckline — this connects him to Scenes 1-4 while elevating the look)
- Same dark indigo jeans
- Same white sneakers
- Same silver watch
- His hair is slightly neater — same style but freshly combed

#### Camera (Two Shots, Cut Together)

**Shot A (0:50–0:55, 5 seconds): Wide Establishing → Crane Up**
- **Lens:** 24mm anamorphic (2.39:1 aspect ratio feel within 9:16 frame — achieved through letterboxing with thin black bars top and bottom, 5% each)
- **Starting frame:** Wide shot showing the full stage, the founder, the TV behind him, and the audience silhouettes in the foreground
- **Movement:** Slow crane up — camera starts at audience eye level and rises 3 feet over 5 seconds, ending slightly above the founder's eye level, looking slightly down. This creates a "hero reveal" — the founder grows in stature as the camera rises.
- **Speed:** Constant, smooth, no jerking

**Shot B (0:55–1:00, 5 seconds): Close-Up**
- **Lens:** 85mm, f/1.8
- **Framing:** Medium close-up — chest to top of head. Founder is slightly right of center (rule of thirds). The blurred stage lights create warm circular bokeh in the background.
- **Movement:** Static, tripod-locked. No movement. Let the performance breathe.

#### Character Action

| Timestamp | Action |
|-----------|--------|
| 0:50-0:52 | Wide shot: Founder stands center-stage, feet planted shoulder-width apart. Right hand gestures outward — an expansive, inclusive gesture. He speaks with authority — his voice carries. |
| 0:52-0:55 | He takes one step forward (toward the audience). His left hand comes up with a palm-down "grounding" gesture. He makes direct eye contact with someone in the audience. Crane continues rising. |
| 0:55-0:57 | Cut to close-up: We see his face mid-sentence. His expression is focused, confident — the furrow from Scene 1 is gone. His eyes are bright and direct. |
| 0:57-1:00 | He delivers a key line with a slight forward lean. A small, confident smile appears (the same one from Cut D of Scene 4, but broader — this time he KNOWS). He gives a definitive single nod. |

#### Color Grade

- **Overall:** Premium commercial grade. Teal and orange color grade (industry standard for authority/aspiration).
- **Shadows:** Pushed toward deep teal/cyan (#0a4d5c)
- **Highlights:** Warm amber/orange, especially the rim light and stage spots
- **Skin tones:** Protected — natural warmth, not affected by the teal push
- **Contrast:** Higher than previous scenes — this is the "hero" moment, so the image pops more
- **Lens flare:** ONE subtle anamorphic lens flare (horizontal blue streak) appears at 0:53 as the crane passes a stage light. It lasts 1.5 seconds and fades.

#### Sora 2 Pro Prompt (Shot A — Wide/Crane)

```
[Character Reference: Upload founder master portrait]

A confident 28-year-old South Asian male founder stands center-stage on a modern pitch
stage in an intimate presentation room seating 30 people. He wears a dark navy blazer
over a charcoal hoodie (hoodie visible at neckline), dark jeans, white sneakers. A
65-inch screen behind him displays a blurred slide with a warm orange logo.

Professional three-point lighting: soft 5600K key from the left, warm 3200K rim light
from behind-right creating golden edge on his shoulder, cool blue-grey ambient fill on
background wall. Three warm downlights create pools of light on the dark grey stage
floor. Audience silhouettes visible in foreground — 4-5 people, one with hand on chin.

He gestures expansively with his right hand, then takes one step forward with a
grounding palm-down gesture, making direct eye contact with the audience.

Cinematography: 24mm anamorphic lens, slow crane up from audience eye level rising
3 feet over 5 seconds. Teal and orange cinematic color grade. One subtle horizontal
blue anamorphic lens flare appears midway. Premium commercial aesthetic. 24fps.

Sound: Confident male voice speaking with authority and room presence. Subtle audience
ambient energy. No music.
```

#### Audio Design

| Layer | Description | Volume |
|-------|-------------|--------|
| Founder's voice | Clear, authoritative, room-filling. He says: "...and that's why Pitchr exists. Because every founder deserves to walk into that room and know — truly know — that their pitch will land." | -8dB |
| Room presence | Subtle room reverb on voice (medium-sized room, 0.8s RT60). Audience shifting sounds — fabric rustling, a single quiet cough at 0:52 (hyperrealism detail). | -30dB |
| Music | The rhythm from Scene 4 continues but the piano figure now plays a resolved chord (C major, sustained, with reverb). A string pad enters — warm, swelling, aspirational. Not overwhelming — supportive. | -20dB |

#### Text/Graphics Overlay

- **Timing:** Appears at 0:57, holds until 1:00
- **Element:** A score badge graphic (NOT text — a designed element)
  - Dark rounded rectangle pill (24px border-radius), background #111111 at 90% opacity
  - Left side: mini score ring (40px diameter) showing 92/100 in green (#35911f)
  - Right side: "Investor Ready" text in white (#ffffff), Inter 600 weight, 14px
  - Pitchr logo mark (the "P" curve from logo.svg) in brand orange (#ff5941) at 12px, left of the text
- **Position:** Top-right corner, 5% from top, 5% from right edge
- **Animation:** Slides in from right (200ms, ease-out), ring fills (800ms), holds, then stays visible into Scene 6

---

### SCENE 6: THE CLOSE — CTA
**Duration:** 1:00 – 1:08 (8 seconds)
**Emotional Arc:** Resolution → Brand → Action

#### This is 100% Motion Graphics (No AI Video)

Build in DaVinci Resolve Fusion, After Effects, or Remotion.

**Background:** Pure black (#000000)

**Animation Timeline:**

| Time | Element | Animation |
|------|---------|-----------|
| 1:00 | Score badge from Scene 5 stays visible for 0.5s, then fades to black | 400ms fade-out |
| 1:00.5 | Black screen holds | 500ms |
| 1:01 | Pitchr logo appears | The "P" logomark (from logo.svg — the curved stroke path) draws itself on-screen like a pen stroke, left to right, in white (#F4F4F4). Line drawing animation over 800ms, ease-in-out. |
| 1:01.8 | Logo complete | The three vertical bars (the "sound wave" rectangles from the logo SVG) pop in sequentially, 100ms apart, with a subtle scale-up bounce (from 80% to 100% scale, spring easing). |
| 1:02 | Glow pulse | A radial gradient glow in Pitchr orange (#ff5941) at 15% opacity blooms from behind the logo, expands to 200% size, then fades to 5% opacity over 600ms. |
| 1:02.5 | Tagline appears | "Your pitch, perfected." fades in below the logo. Inter, 300 weight (light), 16px, #F4F4F4 at 80% opacity. Tracking: +0.05em. 400ms fade-in. |
| 1:03.5 | URL appears | "pitchr.live" fades in below the tagline. Inter, 500 weight (medium), 20px, #ff5941 (brand orange). 300ms fade-in. |
| 1:04-1:08 | Hold | Everything stays on screen for 4 seconds. No animation. Let it breathe. |

**Audio:**

| Layer | Description | Volume |
|-------|-------------|--------|
| Music resolve | The string pad and piano resolve to a single sustained C3 note (piano, soft sustain pedal). The note rings for 3 seconds and naturally decays. | -16dB |
| Logo sound | A subtle "whoosh" (white noise filtered through a low-pass sweep, 200ms) plays at 1:01 when the logo draws. | -22dB |
| Bar pops | Three tiny "tick" sounds (1kHz sine, 50ms each, with 100ms spacing) play when the sound wave bars appear. | -26dB |
| Silence | After 1:03, all sound fades to silence over 2 seconds. The last 3 seconds are pure silence with the logo/URL visible. | — |

---

## VOICEOVER SCRIPT (Optional — If Using VO)

**Total duration:** Distributed across Scenes 2-5 (NOT Scene 1 — let silence build tension)

**ElevenLabs Settings:**
- Voice: Clone the founder's voice, OR use "Daniel" (warm, confident male voice with slight British inflection)
- Stability: 0.65 (some natural variation)
- Clarity + Similarity: 0.78
- Style: 0.45 (subtle expressiveness)

**Script:**

| Scene | Timestamp | Line | Delivery Notes |
|-------|-----------|------|----------------|
| 2 | 0:15-0:19 | "Every founder starts with the same fear." | Quiet, reflective. Slower pace — 110 WPM. |
| 3 | 0:26-0:32 | "Will my pitch actually land?" | Even quieter. A question hanging in the air. 100 WPM. |
| 4 | 0:40-0:47 | "Pitchr uses AI to score your pitch in under 30 seconds — across structure, clarity, evidence, market, and delivery." | Pace picks up — 140 WPM. Confident, informative. Slight emphasis on "30 seconds" and "five dimensions." |
| 5 | 0:55-1:00 | "Practice. Improve. Become investor-ready." | Each word is its own beat. 90 WPM. Resolute. Final. |

---

## MUSIC GENERATION — SUNO v4 PROMPT

```
Cinematic ambient soundtrack, 68 seconds. Starts with a single sustained low C2 piano
note with soft sustain pedal, barely audible. At 0:08, add a warm string pad (viola,
sustained, pp). At 0:20, add two ascending piano notes (C4, E4) with long reverb tails.
At 0:36, introduce a very soft muted kick drum at 80bpm — more felt than heard. Piano
becomes a repeating ascending 4-note figure (C4-E4-G4-C5, quarter notes). At 0:50,
strings swell to mf, add a resolved C major chord. At 1:00, everything resolves to a
single sustained C3 piano note that decays naturally over 4 seconds to silence.
No vocals. No guitar. No percussion beyond the soft kick. Warm, aspirational, minimal.
Reference mood: Ólafur Arnalds meets Tycho. 85bpm max.
```

---

## POST-PRODUCTION CHECKLIST

### DaVinci Resolve Timeline

1. Import all AI-generated clips (Scenes 1, 2, 4A-D, 5A-B) + screen recording (Scene 3B) + motion graphics (Scene 6)
2. Arrange on timeline following scene timestamps above
3. **Compositing (Scene 3A):** Use Fusion to track the Pitchr UI screen recording onto the laptop screen in the over-shoulder shot. Use corner-pin tracking on the laptop screen corners.
4. **Transitions:** All cuts are HARD CUTS. No dissolves. No wipes. No fancy transitions. Hard cuts = premium feel.
5. **Color Grade:** Apply the per-scene color specifications above using DaVinci's color wheels. Use qualifier to protect skin tones when pushing teal into shadows.
6. **Film grain:** Add Resolve's built-in film grain at 15% (Scenes 1-2), 8% (Scenes 3-4), 5% (Scene 5), 0% (Scene 6).
7. **Sound mix:** Follow the per-scene audio tables above. Master output: -14 LUFS (Instagram standard).
8. **Export:** H.265, 50Mbps, 24fps, 10-bit, 1080x1920 (9:16) and 3840x2160 (16:9).

---

## TOTAL COST ESTIMATE

| Item | Cost |
|------|------|
| Midjourney v7 Standard (keyframes) | $30/mo |
| Kling 3.0 Pro (~180 seconds of generation including iterations) | ~$27.50 |
| Sora 2 Pro (Scene 5 only, ~40 seconds including iterations) | $200/mo (ChatGPT Pro) or ~$8 via API |
| ElevenLabs Starter (VO) | $11/mo |
| Suno v4 (music) | Free |
| DaVinci Resolve 19 | Free |
| **TOTAL (minimum)** | **~$70-80** |
| **TOTAL (with Pro subs)** | **~$280** |

---

*Production Package v1.0 — Generated for pitchr.live launch — March 2026*
