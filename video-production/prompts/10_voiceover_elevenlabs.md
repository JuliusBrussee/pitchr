# Voiceover — ElevenLabs Settings & Script

## ElevenLabs Configuration

### Voice Selection
- **Option A (Recommended):** Clone the actual founder's voice from a 30-second sample
- **Option B:** Use "Daniel" preset — warm, confident male voice with slight British inflection
- **Option C:** Use "Josh" preset — deeper, authoritative American male voice

### Generation Settings
| Parameter | Value | Reason |
|-----------|-------|--------|
| Model | Turbo v3 | Fastest, best quality for short-form |
| Stability | 0.65 | Allows natural variation, not robotic |
| Clarity + Similarity | 0.78 | Clear articulation while keeping warmth |
| Style | 0.45 | Subtle expressiveness, not overdramatic |
| Speaker Boost | ON | Improves clarity for final mix |

### Output Settings
- Format: WAV, 48kHz, 24-bit
- Mono (single channel — will be centered in stereo mix)

---

## Script — Line by Line

### Line 1 (Scene 2 — 0:15 to 0:19)
**Text:** "Every founder starts with the same fear."

**Delivery direction:** Quiet, reflective, intimate. As if speaking to oneself. 110 WPM pace — slower than conversational. Slight downward inflection at the end (statement, not question). No dramatic emphasis on any word — let the sentence carry itself.

**ElevenLabs prompt note:** Generate this line separately. Keep voice low in register (chest voice, not head voice).

---

### Line 2 (Scene 3 — 0:26 to 0:30)
**Text:** "Will my pitch actually land?"

**Delivery direction:** Even quieter than Line 1. A genuine question hanging in the air — upward inflection at "land?" but subtle, not exaggerated. 100 WPM. A breath before "actually" — a micro-pause of 200ms. The word "land" should feel weighted, like it carries the entire sentence's meaning.

---

### Line 3 (Scene 4 — 0:40 to 0:47)
**Text:** "Pitchr uses AI to score your pitch in under thirty seconds — across structure, clarity, evidence, market, and delivery."

**Delivery direction:** Pace picks up — 140 WPM. Confident, informative, forward-moving. Slight emphasis (not louder, just 10% slower) on "thirty seconds" and each of the five dimension names. The dash before "across" is a 300ms breath pause. The five dimensions should flow as a natural list — slight upward inflection on each except "delivery" which gets a downward resolve.

---

### Line 4 (Scene 5 — 0:55 to 1:00)
**Text:** "Practice. Improve. Become investor-ready."

**Delivery direction:** Each word is its own beat. 90 WPM — the slowest line. 400ms pause between each sentence. "Practice" is neutral. "Improve" is slightly warmer. "Become investor-ready" is resolute and final — the voice settles, confident and certain. Downward inflection on "ready." This is the last spoken word in the video.

---

## Mixing Notes for DaVinci Resolve

| Line | Placement in Mix | Volume | Effects |
|------|-----------------|--------|---------|
| Line 1 | Center, slight L/R spread (10%) | -10dB | Subtle room reverb (0.6s RT60, 15% wet) |
| Line 2 | Center | -11dB | Same reverb, slightly more wet (20%) |
| Line 3 | Center | -9dB | Lighter reverb (10% wet) — voice is closer/more present |
| Line 4 | Center | -8dB | Minimal reverb (8% wet) — direct and intimate |

**Sidechain:** Apply sidechain compression to the music track, keyed to the VO. When VO plays, music ducks by -4dB with 50ms attack and 300ms release. This ensures the voice always sits cleanly above the music without fighting.
