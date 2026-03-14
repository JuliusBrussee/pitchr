# Scene 6: THE CLOSE — Motion Graphics Spec

## This scene is 100% motion graphics. No AI video generation.

### Build in: DaVinci Resolve Fusion, After Effects, or Remotion

---

## Background
- Solid black: #000000
- No texture, no grain, no gradient — pure black

## Logo Reference
The Pitchr logo (from `public/logo.svg`) consists of:
1. **The "P" curve:** A single continuous stroke path — starts at bottom-left, curves up through a large arc, forming the shape of a lowercase "p" with a rounded bowl. Stroke: 70px, round linecap/linejoin. Color: #F4F4F4 (off-white on dark backgrounds).
2. **Three vertical bars** (the "sound wave" / "equalizer" motif):
   - Center bar: 36x190px rectangle, positioned at x=197, y=113, border-radius 18px
   - Right bar: 31x151px rectangle, x=267, y=136, border-radius 15.5px
   - Left bar: 32x151px rectangle, x=132, y=133, border-radius 16px
   - All three are filled in #F4F4F4

## Animation Timeline

| Time (from 1:00) | Element | Animation Detail |
|-------------------|---------|-----------------|
| 0.0s | Score badge from Scene 5 | Still visible from previous scene. Begins 400ms fade-out. |
| 0.5s | Black screen | Pure black holds for 500ms. Silence. |
| 1.0s | P curve stroke | The curved stroke path draws itself on-screen like a pen writing the letter. Animation follows the SVG path from bottom-left, up, around the bowl, and back down. **Stroke-dasharray/dashoffset animation** over 800ms with ease-in-out timing. Color: #F4F4F4. |
| 1.8s | Three vertical bars | Pop in sequentially, 100ms apart (left, center, right). Each bar: starts at 0% opacity and 80% scale, animates to 100% opacity and 100% scale with spring easing (overshoot to 105%, settle to 100%). Duration per bar: 200ms. |
| 2.0s | Orange glow pulse | A radial gradient centered on the logo: inner color #ff5941 at 15% opacity, outer edge transparent. Starts at 100% of logo size, expands to 200% over 400ms, then opacity fades from 15% to 5% over 200ms. Remains at 5% as subtle persistent glow. |
| 2.5s | Tagline | "Your pitch, perfected." fades in below the logo. Font: Inter, 300 weight (light), tracking +0.05em. Size: 16px (9:16) / 24px (16:9). Color: #F4F4F4 at 80% opacity. 400ms linear fade-in. Positioned 30px below the logo bottom edge. Center-aligned. |
| 3.5s | URL | "pitchr.live" fades in below the tagline. Font: Inter, 500 weight (medium). Size: 20px (9:16) / 28px (16:9). Color: #ff5941 (brand orange — this is the ONLY color element, drawing the eye). 300ms linear fade-in. Positioned 16px below the tagline. Center-aligned. |
| 4.0–8.0s | Hold | Everything stays perfectly still for 4 seconds. No animation. No movement. This stillness after all the motion creates a moment of calm authority. |

## Vertical Positioning (9:16 Frame)

All elements are vertically centered as a group:
- Logo: center of frame
- Tagline: 30px below logo
- URL: 16px below tagline
- The entire group sits at 45% from the top of the frame (slightly above true center, which feels more visually balanced)

## Audio

| Time | Sound | Specification |
|------|-------|--------------|
| 0.0s | Music fade | String pad and piano from Scene 5 resolve to a single sustained C3 piano note (soft dynamics, with sustain pedal held). The note begins its natural decay. |
| 1.0s | Logo whoosh | White noise filtered through a resonant low-pass sweep (cutoff drops from 8kHz to 200Hz over 200ms). Very subtle — more felt than heard. -22dB. |
| 1.8s | Bar tick sounds | Three tiny sine wave ticks: 1kHz frequency, 50ms duration each, with 100ms spacing between them. Staccato and crisp. -26dB. |
| 3.0s | Music fade-out | The sustained C3 piano note has naturally decayed by now. Any remaining reverb tail fades to silence over 1 second. |
| 4.0–8.0s | Silence | Complete silence. The logo and URL sit in silence for 4 seconds. |

## Export Notes

- Render this scene as a separate element, then drop into the main timeline
- For the Remotion option: this can be coded as a React component referencing the actual logo.svg
- The logo stroke animation can be achieved with CSS `stroke-dasharray` / `stroke-dashoffset` — calculate total path length from the SVG
