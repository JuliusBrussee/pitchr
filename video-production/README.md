# Pitchr Launch Video — Production Package

## What This Is

A complete, zero-ambiguity production package for creating a 68-second cinematic AI-generated launch video for pitchr.live. Every scene, camera angle, lighting setup, character detail, and audio element is specified to the point where there is no room for interpretation.

## File Structure

```
video-production/
├── README.md                              ← You are here
├── PRODUCTION_PACKAGE.md                  ← Master document with full specs
└── prompts/
    ├── 01_character_reference.md          ← Midjourney v7: founder portrait generation
    ├── 02_scene1_anxiety.md               ← Kling 3.0: late-night desk scene
    ├── 03_scene2_attempt.md               ← Kling 3.0: stumbling pitch in co-working space
    ├── 04_scene3a_overshoulder.md         ← Kling 3.0: over-shoulder laptop shot
    ├── 05_scene3b_ui_recording.md         ← Screen recording: Pitchr UI spec
    ├── 06_scene4_transformation.md        ← Kling 3.0: 4-cut montage (fix list, retry, score, smile)
    ├── 07_scene5_investor_ready.md        ← Sora 2 Pro: pitch stage hero moment
    ├── 08_scene6_cta_close.md             ← Motion graphics: logo animation + CTA
    ├── 09_music_suno.md                   ← Suno v4: ambient soundtrack
    └── 10_voiceover_elevenlabs.md         ← ElevenLabs: VO script + settings
```

## Production Order

### Step 1: Character Lock (30 min)
Generate founder portraits with `01_character_reference.md` in Midjourney v7. Pick the best one. This becomes the master reference for ALL video generation.

### Step 2: Prototype Pass (2-3 hours)
Run all Kling prompts (Scenes 1, 2, 3A, 4A-D) with **Kling Turbo** (fast/cheap). Check character consistency, camera movements, and emotional beats. Iterate prompts as needed.

### Step 3: Audio Generation (30 min)
Generate music with `09_music_suno.md` and voiceover with `10_voiceover_elevenlabs.md` in parallel with Step 2.

### Step 4: Hero Render (2-3 hours)
Re-render all approved scenes with **Kling 3.0 Pro**. Generate Scene 5 with **Sora 2 Pro** using `07_scene5_investor_ready.md`. Generate 3-5 variations per scene, pick the best.

### Step 5: Screen Recording (30 min)
Record Pitchr UI following `05_scene3b_ui_recording.md`. Record both the 62/100 score (Scene 3) and 85/100 score (Scene 4 Cut C).

### Step 6: Motion Graphics (1-2 hours)
Build Scene 6 following `08_scene6_cta_close.md` in DaVinci Fusion, After Effects, or Remotion.

### Step 7: Assembly & Post (2-3 hours)
Import everything into DaVinci Resolve. Follow the post-production checklist in `PRODUCTION_PACKAGE.md`. Apply per-scene color grades. Mix audio. Export.

## Total Time: ~2-3 days (solo creator)
## Total Cost: ~$70-280 depending on subscription choices

## Key Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Primary video tool | Kling 3.0 Pro | Native 4K, best character consistency via Universal Reference, built-in audio, realistic micro-expressions |
| Hero scene tool | Sora 2 Pro | Best temporal coherence for complex multi-element stage scene with crane movement |
| Character ethnicity | South Asian male, 28 | Represents Pitchr's diverse founder audience |
| Identity lock method | Mole on right neck + silver watch + charcoal hoodie | Specific physical markers that persist across all camera angles |
| Color narrative | Cool/dark → Warm/bright | Visual arc mirrors emotional journey (anxiety → confidence) |
| Camera narrative | Handheld → Steady | Camera stability increases with founder's confidence |
| Music approach | Original via Suno | Custom timing to match scene beats exactly |
| All cuts | Hard cuts only | Premium commercial feel — no dissolves or wipes |
