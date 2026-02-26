# Try-Before-Signup Onboarding Redesign

**Date:** 2026-02-26
**Status:** Approved

## Problem

Current onboarding is gated behind authentication. Users must sign up before experiencing any value. This violates B2C best practices: users should reach their "aha moment" before committing.

## Solution

New public `/try` route that lets users experience the full pitch recording flow, see a scoring animation, then gates the detailed feedback behind an inline signup form. No API calls. No stored data. Pure conversion-optimized experience.

## Flow (7 Steps)

```
/try
  Step 1: Hook           → "Most pitches fail in 30 seconds" (reuse HookStep)
  Step 2: Problem        → "You practice alone..." (reuse ProblemStep)
  Step 3: Feature Flash  → Compressed demo (merge session-demo + realtime-intel)
  Step 4: Use-case Pick  → Elevator / VC Pitch (sets timer, stores mode)
  Step 5: Record         → Full session (mic + camera + SiriBubble + WPM + fillers)
  Step 6: Fake Analysis  → SiriBubble analyzing + rubric dots + score animation
  Step 7: Gated Results  → Blur drops + inline auth (email/password + Google)
```

After signup → redirect to `/session?mode={chosen_mode}` (real pitch, real analysis).

## Step Details

### Steps 1-2: Hook + Problem (Reuse Existing)
- Import `HookStep` and `ProblemStep` from existing onboarding
- No changes needed

### Step 3: Feature Flash (New Component)
- Merged, compressed version of `SessionDemoStep` + `RealtimeIntelStep`
- Quick animated preview: SiriBubble + WPM gauge + filler counter + checklist
- Single screen, auto-advances after ~5 seconds or tap to continue
- Goal: "Here's what happens when you record" — fast visual preview

### Step 4: Use-Case Picker (New Component)
- "What are you pitching?"
- Two options: Elevator Pitch (60s timer) / VC Pitch (5min timer)
- No name input (captured during signup)
- Stores choice in component state for later redirect

### Step 5: Recording (New Component)
- Full session experience without auth:
  - `useMediaStream()` for camera/mic
  - `useRecorder()` for WebRTC recording
  - SiriBubble visualization
  - Real-time WPM and filler count display
  - Timer based on mode choice
- No upload, no STT API calls, no head tracking, no deck selection
- Recording blob is discarded after the flow
- When user stops → transition to Step 6

### Step 6: Fake Analysis Animation
- Reuses animation logic from `ScoringDemoStep`:
  1. SiriBubble "active" state (3-4 seconds)
  2. Rubric category dots light up sequentially
  3. Score counter animates 0 → random(35-55)
  4. SiriBubble shifts to "negative"
- Uses `DEMO_SCORES` config for category data
- Score is intentionally mediocre to create urgency
- Transitions seamlessly into Step 7

### Step 7: Gated Results + Inline Auth
- **Tease:** Category bars start appearing, verdict fades in...
- **Gate animation:** Frosted glass overlay slides up from bottom (spring animation, 0.5s)
  - `backdrop-filter: blur(20px)` — shapes/colors visible but unreadable
  - Results are visible behind the blur (red bars, text blocks, score)
- **Gate content (centered on blur overlay):**
  ```
  [SiriBubble mini, subtle pulse]

  "Your pitch scored [SCORE]/100"
  "We found 5 things to fix."

  [Email input]
  [Password input]
  [Create account — coral CTA button]

  ── or ──

  [G] Continue with Google

  "Already have an account? Sign in"
  ```
- **Auth logic:** Reuse from `app/(auth)/login/page.tsx`
  - Email/password via `supabase.auth.signUp()` (new users) or `signInWithPassword()` (returning)
  - Google OAuth via `supabase.auth.signInWithOAuth()`
  - On success: redirect to `/session?mode={mode}`

## Technical Architecture

### New Files
- `app/(public)/try/page.tsx` — route entry point (no auth middleware)
- `views/components/try/TryFlow.tsx` — flow orchestrator (step management, navigation)
- `views/components/try/steps/FeatureFlashStep.tsx` — merged demo preview
- `views/components/try/steps/UseCaseStep.tsx` — mode picker
- `views/components/try/steps/TryRecordingStep.tsx` — recording without auth
- `views/components/try/steps/GatedResultsStep.tsx` — fake analysis + blur gate + inline auth

### Reused Components
- `views/components/onboarding/steps/HookStep.tsx`
- `views/components/onboarding/steps/ProblemStep.tsx`
- `views/components/onboarding/ProgressBar.tsx`
- `views/components/onboarding/StepTransition.tsx`
- `views/components/SiriBubble.tsx`
- `views/components/ui/GlassCard.tsx`, `CategoryBar.tsx`, `ScoreBadge.tsx`
- `hooks/useMediaStream.ts`, `hooks/useRecorder.ts`

### Reused Config
- `config/onboarding.ts` — `DEMO_SCORES`, `DEMO_BAD_PITCH` (for category data)

### Modified Files
- `hooks/useOnboarding.ts` — add `cameFromTry: boolean` flag
- `app/(app)/setup/page.tsx` — skip educational steps if `cameFromTry`

## Post-Signup Flow Changes

- Users from `/try` get `cameFromTry: true` in localStorage
- When they hit `/setup`, they skip to `PersonalizationStep` only (name + mode confirmation)
- Or if mode was already chosen in `/try`, skip setup entirely → `/session`
- Coach toast on session page: "That was practice. Now let's get your real score."

## Design Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Get to activation** | User records a pitch before signing up |
| **Immediate reward** | Score animation provides instant feedback feeling |
| **IKEA effect** | User invested effort recording — walking away means losing that |
| **Reduce friction** | Inline auth, Google OAuth, no page navigation |
| **Create mental model** | Record → Score → Fixes flow is now understood |
| **Social proof** | Score implies sophisticated analysis happened |
| **Don't remove friction** | No skip button on recording step — motivation is highest |

## What This Does NOT Include
- Real API calls during the try flow
- Stored recordings from unauthenticated users
- STT processing during try recording
- Head tracking during try recording
- Deck selection during try recording
