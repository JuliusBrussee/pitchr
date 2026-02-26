# Onboarding Flow Design

## Overview

Step-based, coach-toned onboarding that pitches Pitchr to founders the way founders pitch to investors — bold, confident, zero fluff. 8 screens with two interactive moments, followed by progressive toast tips on each page.

**Trigger:** Post-signup redirect to `/setup`. Revisitable from settings.
**Tone:** Provocative coach energy. Challenges the founder. Zero fluff. Premium visuals.
**Duration:** ~60-90 seconds for 8 screens.

## Screen Flow

### Screen 1 — "The Hook"

> "Most pitches fail in the first 30 seconds."

- Dark screen, bold white text, dramatic fade-in
- "30 seconds" in coral accent
- Subtitle: "Yours doesn't have to."
- CTA: "Show me why ->"

### Screen 2 — "The Problem"

> "You practice alone. You guess what's wrong. You walk into the room hoping."

- Three lines appear one at a time with staggered animation
- Pivot line fades in: "Pitchr replaces hope with data."
- CTA: "Next ->"

### Screen 3 — "The Session Experience"

Animated mock of the recording interface (no real permissions):
- Camera feed area with stylized placeholder/loop
- SiriBubble orb in `active` state, pulsing and reacting
- Live metrics ticking: WPM counter climbing (90 -> 142), duration timer, filler counter
- Callout labels animate in with staggered delays: "Live WPM" -> "Filler detection" -> "Engagement tracking"

> "Record with your camera. The AI listens in real-time."

CTA: "What does it catch? ->"

### Screen 4 — "Real-Time Intelligence"

Animated metrics panel demo:
- Checklist filling in: Problem stated -> Solution introduced -> Traction mentioned -> Ask defined (1s intervals)
- WPM gauge with green sweet spot zone (130-160), needle animates
- Filler word counter ticking up with subtle red flash
- Engagement band shifting (good -> could improve)

> "While you speak, Pitchr tracks structure, delivery, and confidence. Every word counts."

CTA: "Then comes the score ->"

### Screen 5 — "The Rubric"

5 rubric categories as interactive cards (tap/hover to reveal):
- Structure (20): "Problem -> Solution -> Why Now -> Traction -> Ask"
- Clarity (20): "Every sentence earns its place"
- Evidence (20): "Specific numbers, named customers"
- Market (20): "TAM sourced, competitors named, moat clear"
- Delivery (20): "130-160 WPM, <3% filler words"

Score bands at bottom: Needs Work (0-39) -> Getting There (40-59) -> Solid (60-79) -> Investor-Ready (80-100)

CTA: "Watch it score ->"

### Screen 6 — "Live Scoring Demo" (interactive)

- Hardcoded bad pitch text (~3 sentences) appears
- User clicks "Score this pitch"
- Orb transitions to `active` state
- 3-second compressed analysis animation (AnalyzingOverlay style)
- Rubric scores animate in one by one using CategoryBar components
- Lands on 34/100 "Needs Work" via ScoreBadge
- Brutal one-line verdict appears

CTA: "But we don't just score. We fix. ->"

### Screen 7 — "Before/After Rewrite" (interactive)

- Left: same bad pitch with weak phrases highlighted in red/coral
- Right: AI-rewritten version slides in with improved phrases in green
- Diff-style reveal animation
- Score counter animates from 34 -> 78 "Solid" (requestAnimationFrame lerp)
- Mobile: stacked vertically

> "Same pitch. Same founder. Better words."

CTA: "Let's set you up ->"

### Screen 8 — "Personalization + Launch"

Two inputs:
1. "What should we call you?" — first name text input
2. "What are you prepping for?" — two selectable cards:
   - Elevator Pitch: "60 seconds. Hook them fast."
   - VC Pitch: "Full deck. Close the round."

> "Alright [Name], let's find out where your pitch breaks."

Big coral CTA: "Run My First Pitch ->" (navigates to `/session?mode={selected}`)
Small link: "or explore the dashboard first ->" (navigates to `/dashboard`)
Both mark onboarding as complete.

## Progress Bar

- 8 dots at top of screen, coral fill on current step
- Subtle connecting line between dots
- "Skip" link on the right
- Sticky at top with glassmorphic background
- Keyboard navigation: ArrowRight/Enter to advance, ArrowLeft to go back
- Touch/swipe support on mobile

## Progressive Toast System

### Toast Design

- Small glassmorphic card (280px desktop, full-width mobile)
- Slides in from bottom-right (desktop) or bottom-center (mobile)
- Coral left border accent (3px)
- `backdrop-blur` + `var(--bg-surface)` background
- `var(--text-primary)` text, `var(--border-color)` border
- "x" close button, auto-dismiss after 8 seconds
- Max one toast visible at a time
- Entrance: slide up 12px + fade in (200ms ease-out)
- Exit: fade out (150ms)
- Respects `prefers-reduced-motion`

### Toast Messages

| Page | Message |
|------|---------|
| Dashboard | "This is home base. Your scores, trends, and next moves -- all here." |
| Session | "Pick your mode, hit record, and let it rip. The AI's listening." |
| Results | "Scroll down. The fixes are ranked -- top one has the biggest impact." |
| History | "Every pitch you've run lives here. Track your progress over time." |
| Deck | "Upload your deck and practice slide-by-slide. The AI reads along." |
| Progress | "Your score timeline. Watch the line go up." |

### Toast Tracking

- localStorage key per page: `pitchr-toast-seen:{page}`
- Settings page: "Reset tips" button clears all toast flags + onboarding completion flag
- Fires on first visit to each page after onboarding is complete

## Technical Architecture

### State Management

- Onboarding completion: Supabase user metadata (`onboarding_completed: true`)
- Display name: Supabase user metadata (`display_name`)
- Mode preference: localStorage (`pitchr-preferred-mode`)
- Toast seen flags: localStorage (`pitchr-toast-seen:{page}`)
- Settings "Reset tips" clears all localStorage flags and resets Supabase metadata

### Component Structure

```
app/(app)/setup/
  page.tsx                        — Shell: progress bar + step router

views/components/onboarding/
  OnboardingFlow.tsx              — Step state machine, transitions, keyboard/swipe
  steps/
    HookStep.tsx                  — Screen 1: bold text + fade-in
    ProblemStep.tsx               — Screen 2: staggered line reveals
    SessionDemoStep.tsx           — Screen 3: mock session vignette
    RealtimeIntelStep.tsx         — Screen 4: animated metrics panel
    RubricStep.tsx                — Screen 5: interactive rubric cards
    ScoringDemoStep.tsx           — Screen 6: live scoring demo
    RewriteDemoStep.tsx           — Screen 7: before/after diff
    PersonalizationStep.tsx       — Screen 8: name + mode + launch
  shared/
    ProgressBar.tsx               — 8-dot progress indicator
    StepTransition.tsx            — Fade/slide animation wrapper
    CoachText.tsx                 — Bold provocative text with accent styling

views/components/ui/
  CoachToast.tsx                  — Toast component
  CoachToastProvider.tsx          — Context provider at app layout level

hooks/
  useOnboarding.ts               — Checks completion, redirects to /setup if needed
  useCoachToasts.ts               — Fires toasts on first page visit

config/
  onboarding.ts                   — Sample pitch text, scores, rewrite text, toast messages
```

### Reused Components

- `SiriBubble` orb (Screen 3 miniature, Screen 6 animation)
- `CategoryBar` (Screen 5 rubric, Screen 6 scoring)
- `ScoreBadge` (Screen 6 + 7 score display)
- `GlassCard` (throughout for containers)

### Transitions

- Fade + slide-left between steps (300ms ease-out)
- Keyboard: ArrowRight/Enter advance, ArrowLeft goes back
- Touch swipe on mobile
- Each step's internal animations trigger on mount

### Post-Signup Redirect

- Signup flow checks `onboarding_completed` in user metadata
- If false/missing: redirect to `/setup`
- If true: redirect to `/dashboard`
- `/setup` page itself checks: if already completed, redirect to `/dashboard` (unless `?replay=true`)

### Settings Integration

- Settings page adds "Onboarding & Tips" section
- "Replay onboarding" button: resets `onboarding_completed` metadata, navigates to `/setup`
- "Reset page tips" button: clears all `pitchr-toast-seen:*` localStorage keys
