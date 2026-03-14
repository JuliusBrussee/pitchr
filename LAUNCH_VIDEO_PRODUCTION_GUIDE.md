# Pitchr Launch Video — AI Video Production Guide

> A complete framework for creating a cinematic, AI-generated launch video for **pitchr.live** inspired by the hyper-realistic, editorial AI video style popularized by creators like @by.shlabu.

---

## Part 1: Style Analysis & Creative Direction

### The @by.shlabu Aesthetic (Reverse-Engineered)

Based on the style visible in their Instagram content, creators like @by.shlabu produce AI-generated videos that feel **indistinguishable from real footage**. Key characteristics:

| Element | Technique |
|---------|-----------|
| **Realism** | Hyper-realistic human faces, natural skin textures, believable environments |
| **Camera Work** | Slow dolly-ins, shallow depth of field, subtle handheld micro-shake |
| **Lighting** | Golden hour warmth, studio rim lighting, motivated practicals |
| **Color Grade** | Warm tones, slightly lifted blacks, muted highlights — cinematic LUT feel |
| **Pacing** | Slow, deliberate, contemplative — lets shots breathe |
| **Sound Design** | Ambient room tone, subtle foley, minimal/no dialogue — mood-driven |
| **Aspect Ratio** | 9:16 vertical (Instagram native) or 16:9 cinematic |
| **Duration** | 15-45 seconds per clip, 60-90 seconds assembled |

### Why This Style Works for Pitchr

- **Authority**: Realistic, polished visuals = premium product perception
- **Emotion**: Slow camera + warm light = aspiration and trust
- **Contrast**: Show the "struggle" (bad pitch) → "transformation" (Pitchr analysis) → "triumph" (investor-ready)
- **Shareability**: Cinematic reels get saved/shared 3-5x more than talking-head content

---

## Part 2: Recommended AI Video Stack (March 2026)

### Primary Tool: **Kling 3.0** (or Kling 2.6)
- **Why**: Up to 3-minute clips, native 4K@60fps, integrated audio generation
- **Best for**: Character-consistent scenes, realistic environments, longer takes
- **Cost**: ~$30-66/month (Pro/Enterprise)

### Secondary Tool: **Sora 2 Pro**
- **Why**: Best temporal coherence, cinematic physics, 20-second narrative sequences
- **Best for**: Hero shots, product reveals, emotional close-ups
- **Cost**: ChatGPT Plus ($20/mo) or Pro ($200/mo for higher limits)

### Supporting Tools:
| Tool | Purpose |
|------|---------|
| **Midjourney v7** / **Imagen 4** | Generate reference frames / keyframes for image-to-video |
| **Runway Gen-4.5** | Quick iterations, style transfer, image-to-video with reference matrices |
| **ElevenLabs** | Voiceover narration (warm, confident founder voice) |
| **Udio** or **Suno** | Custom soundtrack — ambient, aspirational, minimal |
| **Topaz Video AI** | Upscale + stabilize final output to 4K |
| **DaVinci Resolve** (free) | Final cut, color grade, sound mix, export |

### Workflow Strategy
```
Prototype (cheap/fast) → Refine (premium models) → Assemble (editor)
```
1. **Keyframe first**: Generate still images in Midjourney for each scene
2. **Test animate**: Use Kling Turbo or Runway for quick motion tests (saves 60-80% cost)
3. **Hero render**: Re-generate final scenes with Sora 2 Pro or Kling 3.0 at max quality
4. **Post-production**: Color grade, sound design, and edit in DaVinci Resolve

---

## Part 3: The Pitchr Launch Video — Scene-by-Scene Breakdown

### Video Specs
- **Duration**: 60-75 seconds
- **Aspect Ratio**: 9:16 (Instagram Reels / TikTok primary), also render 16:9 (YouTube/website)
- **Resolution**: 4K (upscaled if needed)
- **Frame Rate**: 24fps (cinematic motion blur)
- **Audio**: Custom ambient track + subtle foley + optional VO
- **Tone**: Aspirational, warm, confident — "your pitch just leveled up"

---

### Scene 1: THE ANXIETY (0:00 – 0:08)

**Concept**: A founder alone, preparing. The weight of it all.

**Visual**:
- Close-up of hands gripping a phone/laptop in a dimly lit room
- Slow dolly-in on the founder's face — slight furrow, lips moving silently (rehearsing)
- Warm desk lamp as key light, blue screen glow as fill
- Scattered sticky notes, coffee cup, late-night energy

**Character**:
- Mid-20s to early-30s founder, diverse casting (represent Pitchr's audience)
- Casual but put-together (hoodie + clean look — startup energy)
- Micro-expressions: slight anxiety, determination

**Camera**:
```
[CAMERA: Slow dolly-in, 85mm lens, f/1.4, shallow DOF]
[LIGHTING: Warm practical desk lamp (3200K key) + cool laptop screen (6500K fill) + dark room]
[STYLE: Desaturated warm tones, lifted blacks, subtle film grain — indie drama feel]
[AUDIO: Room tone, distant city hum, soft clock tick]
```

**Prompt (Kling/Sora)**:
> A young founder sits at a desk late at night, illuminated by a warm desk lamp and the cool glow of a laptop screen. Close-up on their face, lips moving silently as they rehearse. Slow dolly-in. 85mm anamorphic lens, shallow depth of field. Warm golden tones with blue screen accent. Cinematic 24fps. Scattered sticky notes and coffee cup on desk. Documentary realism. Film grain. Muted ambient soundtrack.

**Text Overlay** (added in post): *None yet — let the visual speak*

---

### Scene 2: THE ATTEMPT (0:08 – 0:18)

**Concept**: The founder tries their pitch. It's messy. Real. Human.

**Visual**:
- Medium shot: founder standing, speaking to camera/phone on tripod
- Handheld micro-shake — raw, authentic feel
- They stumble, pause, say "um...", restart
- Background: apartment/co-working space, slightly blurred

**Character**:
- Same founder from Scene 1
- Standing posture shifts: confident start → uncertainty → restart

**Camera**:
```
[CAMERA: Medium shot, slight handheld shake, 50mm, f/2.0]
[LIGHTING: Soft overhead daylight + window side light]
[STYLE: Warm naturalistic, slight overexposure on highlights — raw documentary]
[AUDIO: Their voice (muffled/distorted to suggest imperfection), room echo]
```

**Prompt**:
> A young founder stands in a bright co-working space, speaking earnestly to a phone on a tripod. Medium shot with subtle handheld movement. They pause mid-sentence, look down, restart. 50mm lens, naturalistic lighting from large windows. Warm tones, soft overexposure. Documentary style, 24fps. Background slightly blurred with other people working.

**Text Overlay**: Subtle caption fading in — *"Every founder starts here."*

---

### Scene 3: THE ANALYSIS — PITCHR IN ACTION (0:18 – 0:32)

**Concept**: The magic moment. Pitchr analyzes the pitch in real-time. This is where product meets emotion.

**Visual** (hybrid approach — AI video + screen recording/motion graphics):
- Over-shoulder shot: founder taps "Analyze" on pitchr.live
- Screen fills frame — show the actual Pitchr UI:
  - Score rings animating from 0 → 62/100
  - Rubric radar chart filling in (Structure, Clarity, Evidence, Market, Delivery)
  - Delivery timeline highlighting filler words
  - Ranked fixes appearing with AI rewrites
- Camera slowly pushes in on the screen

**Character**:
- Same founder, shot from behind/over shoulder
- Slight head nod as they see results — recognition moment

**Camera**:
```
[CAMERA: Over-shoulder, slow push-in, 35mm, f/2.8]
[LIGHTING: Screen glow dominant + soft ambient fill]
[STYLE: Clean, modern, slightly cool-toned — tech product aesthetic]
[AUDIO: Soft UI sounds, subtle "ding" on score reveal, ambient electronic pad]
```

**Production Note**: This scene is best done as a **hybrid**:
1. AI-generate the over-shoulder human shot
2. Screen-record actual Pitchr UI with animations
3. Composite in DaVinci Resolve — track the screen onto the laptop/phone

**Text Overlay**: *"AI-powered pitch analysis in under 30 seconds."*

---

### Scene 4: THE TRANSFORMATION (0:32 – 0:48)

**Concept**: The founder applies the fixes. Practices again. Confidence builds.

**Visual** (montage — 3-4 quick cuts):

**Cut A** — Close-up on phone screen showing Pitchr's "Ranked Fixes" with AI rewrites
```
[CAMERA: Extreme close-up, rack focus from fix list to founder's eyes]
[DURATION: 3 seconds]
```

**Cut B** — Founder speaking again, this time with more energy and flow
```
[CAMERA: Same medium shot as Scene 2, but steadier — confidence reflected in camera stability]
[LIGHTING: Warmer, brighter — morning light now (time progression)]
[DURATION: 4 seconds]
```

**Cut C** — Score ring animating: 62 → 78 → 85
```
[CAMERA: Screen recording with subtle parallax motion]
[STYLE: Pitchr brand orange (#ff5733) glow radiating from score]
[DURATION: 3 seconds]
```

**Cut D** — Close-up: founder's subtle smile. They know.
```
[CAMERA: 85mm, f/1.4, slow dolly, golden hour light hitting face]
[STYLE: Warm, aspirational, shallow DOF with bokeh]
[DURATION: 4 seconds]
```

**Audio**: Music builds — ambient pads transition to something more rhythmic and hopeful

**Text Overlay**: *"Practice. Improve. Repeat."*

---

### Scene 5: THE MOMENT — INVESTOR READY (0:48 – 0:58)

**Concept**: The founder delivers the pitch for real. Polished. Confident. Commanding.

**Visual**:
- Wide establishing shot: modern conference room or pitch stage
- Founder standing, gesturing naturally, speaking with conviction
- Slow crane-up or orbital camera move — hero framing
- Warm, premium lighting: soft key + hair light + ambient fill

**Character**:
- Same founder — now in slightly more polished outfit (blazer over hoodie, or clean button-down)
- Posture: open, commanding, grounded
- Expression: focused confidence, slight smile

**Camera**:
```
[CAMERA: Wide establishing → slow crane up, 24mm then cutting to 85mm close-up]
[LIGHTING: Soft studio key (5600K) + warm hair light (3200K) + subtle stage spots]
[STYLE: Premium commercial grade — teal and orange color grade, clean blacks, subtle lens flare]
[AUDIO: Confident voice (clear, no filler words), room presence, subtle audience energy]
```

**Prompt**:
> A confident young founder stands on a modern pitch stage, presenting to an engaged audience. Slow crane-up reveal. 24mm anamorphic lens, teal and orange cinematic grade. Professional studio lighting with warm rim light. The founder gestures naturally, speaking with authority. Bokeh stage lights in background. Cinematic 24fps, premium commercial aesthetic. Subtle lens flare.

**Text Overlay**: Score badge animates in — **"92/100 — Investor Ready"** in Pitchr orange (#ff5733)

---

### Scene 6: THE CTA — CLOSE (0:58 – 1:05)

**Concept**: Clean, punchy brand close.

**Visual**:
- Cut to black
- Pitchr logo animates in (use existing animated tile/glow effect from landing page)
- Tagline fades in below

**Animation** (motion graphics in After Effects or DaVinci):
```
[0.0s] Black screen
[0.3s] Pitchr logo assembles from scattered tiles (reference HeroPresenterTiles.tsx animation)
[1.0s] Glow pulse in brand orange (#ff5733)
[1.5s] Tagline fades in: "Your pitch, perfected."
[2.5s] URL: pitchr.live
[3.0s] Hold → fade
```

**Audio**: Music resolves to single sustained note. Subtle "whoosh" on logo reveal.

---

## Part 4: Step-by-Step Production Checklist

### Phase 1: Pre-Production (Day 1-2)

- [ ] **Lock the script**: Finalize narration/text overlays based on scenes above
- [ ] **Character design**: Generate 5-10 reference images of "the founder" in Midjourney
  - Prompt: `portrait of a [age] [ethnicity] startup founder, wearing [outfit], [expression], studio lighting, 85mm, shallow DOF, editorial photography --ar 2:3 --v 7`
  - Pick ONE consistent character and save as reference for all scenes
- [ ] **Scene keyframes**: Generate 1 still image per scene in Midjourney/Imagen 4
  - Use the camera/lighting specs from each scene description above
  - These become your "storyboard" AND your image-to-video input frames
- [ ] **Music selection**: Generate 60-75s ambient track in Udio/Suno
  - Prompt: `ambient cinematic, minimal piano, building electronic pads, aspirational, warm, 90bpm, modern startup commercial`
- [ ] **VO recording** (optional): Script a 3-4 sentence voiceover, record with ElevenLabs
  - Suggested VO: *"Every founder starts with the same fear. Will my pitch land? Pitchr uses AI to analyze your pitch in 30 seconds — scoring structure, clarity, evidence, market, and delivery. Practice. Improve. Become investor-ready. pitchr.live"*

### Phase 2: Generation (Day 2-4)

- [ ] **Prototype pass**: Animate all keyframes using Kling Turbo (fast, cheap)
  - Test camera movements, character consistency, timing
  - Iterate prompts until motion feels natural
- [ ] **Hero pass**: Re-generate winning scenes with Sora 2 Pro or Kling 3.0
  - Use the detailed prompts from each scene above
  - Generate 3-5 variations per scene, pick best
- [ ] **Screen capture**: Record Pitchr UI in action
  - Use a real pitch analysis session
  - Capture: score animation, rubric radar, delivery timeline, ranked fixes
  - Record at 2x resolution for clean compositing
- [ ] **Logo animation**: Build or screen-record the tile animation from landing page
  - Or recreate in After Effects with the HeroPresenterTiles.tsx animation as reference

### Phase 3: Post-Production (Day 4-5)

- [ ] **Assembly**: Import all clips into DaVinci Resolve timeline
  - Follow the scene-by-scene breakdown for ordering
  - Cut to music beats — let rhythm drive transitions
- [ ] **Compositing**: Track Pitchr UI onto screens in over-shoulder shots
  - Use DaVinci Fusion or After Effects for screen replacement
- [ ] **Color Grade**:
  - Overall: Warm highlights, slightly lifted blacks, subtle film grain
  - Scene 1: Cooler, moodier — blue-shifted shadows
  - Scenes 4-5: Warmer, brighter — golden highlights
  - Use Pitchr brand orange (#ff5733) as accent color in grade
- [ ] **Sound Design**:
  - Layer: Music + VO (optional) + room tone + UI sounds + foley
  - Add subtle reverb to voices for cinematic depth
  - Use sidechain compression on music when VO plays
- [ ] **Text & Graphics**:
  - Font: Inter (matches Pitchr brand)
  - Captions: Clean, minimal, lower-third positioning
  - Score animations: Recreate from Pitchr UI or screen-record
- [ ] **Export**:
  - 9:16 @ 4K for Instagram Reels / TikTok
  - 16:9 @ 4K for YouTube / website embed
  - Both at 24fps, H.265, high bitrate

### Phase 4: Distribution (Day 5-6)

- [ ] **Instagram Reels**: Full 60-75s version + 15s teaser cut
- [ ] **TikTok**: Same as Reels, add trending sound underneath if applicable
- [ ] **Product Hunt**: Embed 16:9 version in launch page
- [ ] **Website**: Hero video on pitchr.live landing page
- [ ] **Twitter/X**: 30s punchy cut focusing on Scene 3 (the analysis moment)
- [ ] **LinkedIn**: 45s cut with more context captions for professional audience

---

## Part 5: Prompt Library — Ready-to-Use

### Character Consistency Anchor (use in EVERY scene prompt)
```
A young startup founder in their late 20s, [specific ethnicity], short dark hair,
wearing a charcoal hoodie with a subtle logo, clean-shaven, warm brown eyes,
slight stubble. [ADD: specific scar/mole/accessory for identity locking]
```

### Scene 1 — Anxiety
```
A young founder sits alone at a desk late at night. Warm desk lamp illuminates
their face, cool laptop glow creates blue fill light. Close-up, slow dolly-in.
85mm anamorphic lens, f/1.4, shallow depth of field. Scattered sticky notes,
half-empty coffee cup. Their lips move silently, rehearsing. Desaturated warm
tones, lifted blacks, 35mm film grain. Documentary realism. 24fps cinematic.
Ambient room tone with distant city hum.
```

### Scene 2 — The Attempt
```
Same young founder now standing in a bright co-working space, speaking to a phone
on a tripod. Medium shot with subtle handheld micro-shake. They pause, say "um",
look down briefly, restart with renewed energy. 50mm lens, f/2.0. Soft window
light from the left, warm naturalistic tones. Slight overexposure on highlights.
Documentary feel, authentic, raw. 24fps. Background blurred with other people
working at desks.
```

### Scene 4B — Confident Re-try
```
Same young founder speaking with confident energy in a bright morning-lit room.
Medium shot, steady camera (no handheld shake — reflects gained confidence).
50mm, f/2.0. Golden morning light streaming through windows. Warmer color grade
than previous scene. Natural gestures, smooth speech, no hesitation.
Aspirational, warm, hopeful energy. 24fps cinematic.
```

### Scene 5 — Investor Ready
```
Confident young founder stands on a modern pitch stage, presenting to a small
engaged audience visible in soft bokeh. Slow crane-up establishing shot, then
cut to 85mm close-up. Teal and orange cinematic color grade. Professional
three-point lighting: 5600K key, 3200K warm hair light, soft ambient fill.
Natural confident gestures, authoritative speaking. Subtle lens flare from
stage lights. Premium commercial aesthetic. 24fps. Audience silhouettes
visible in foreground.
```

---

## Part 6: Creative Inspiration & References

### Visual References to Study
- **Apple "Shot on iPhone" campaigns** — intimate, human, cinematic
- **Stripe product videos** — clean tech + human element
- **Linear app launch video** — minimal, confident, premium
- **Notion "Your wiki, docs, & projects" ad** — warm, aspirational, founder-focused
- **@bywaviboy** (Instagram) — AI Creative Director, 169K followers, teaches AI video creation

### Music/Vibe References
- Ólafur Arnalds — ambient piano + electronic
- Bonobo — warm, textured electronic
- Tycho — aspirational, sunrise energy
- Custom Udio/Suno prompt: `cinematic ambient, warm piano arpeggios, subtle electronic pads building, aspirational modern commercial, 85bpm, no vocals`

### Out-of-the-Box Ideas

1. **"Split-screen time collapse"**: Left side = anxious night rehearsal (Scene 1), right side = confident stage pitch (Scene 5). Same founder, same words, different energy. Walls dissolve as score rises.

2. **"Score as environment"**: The Pitchr score literally transforms the environment — at 40/100 the room is dim and cluttered, at 80/100 the same room is bright, organized, golden. Score drives the world.

3. **"Invisible audience"**: POV shot from the investor's perspective. We see the founder pitching TO US. As the pitch improves (via Pitchr), the founder literally comes into sharper focus (rack focus effect representing investor attention).

4. **"The rewind"**: Video plays forward showing a bad pitch → rewinds with a glitch effect → replays with improvements applied, cycling 2-3 times until the pitch is perfect. Score counter in corner ticks up each cycle.

5. **"One continuous take"**: Entire video is one unbroken camera move through a space — starting in a dark room (anxiety), moving through a hallway (the analysis), emerging into a bright stage (triumph). No cuts. Pure cinematic flex.

---

## Part 7: Budget & Timeline Summary

### Minimum Viable Video (Solo Creator)
| Item | Cost | Time |
|------|------|------|
| Midjourney v7 (keyframes) | $30/mo | Day 1 |
| Kling 3.0 Pro (animation) | $66/mo | Day 2-3 |
| ElevenLabs (VO) | $11/mo | Day 1 |
| Udio (music) | Free tier | Day 1 |
| DaVinci Resolve (edit) | Free | Day 4-5 |
| **Total** | **~$107** | **5 days** |

### Premium Version (Higher quality)
| Item | Cost | Time |
|------|------|------|
| Midjourney v7 + Imagen 4 | $30 + $20/mo | Day 1 |
| Sora 2 Pro (hero scenes) | $200/mo (ChatGPT Pro) | Day 2-4 |
| Kling 3.0 Pro (supporting scenes) | $66/mo | Day 2-4 |
| ElevenLabs Pro (VO) | $22/mo | Day 1 |
| Udio Pro (custom music) | $10/mo | Day 1 |
| Topaz Video AI (upscale) | $199 one-time | Day 5 |
| DaVinci Resolve (edit) | Free | Day 5-6 |
| **Total** | **~$547** | **6 days** |

---

## Quick-Start: Do This First

1. **Open Midjourney** → Generate your founder character (5-10 variations, pick one)
2. **Generate Scene 1 keyframe** → Dark desk, warm lamp, close-up face
3. **Animate in Kling Turbo** → Test the dolly-in, check realism
4. If it looks good → proceed with all scenes
5. If not → adjust prompt, try Sora 2, iterate

The single most important thing: **character consistency**. Lock your founder's face first, then build every scene around that same person.

---

*Generated for pitchr.live launch — March 2026*
