# Onboarding Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Each task is designed for a subagent using the `frontend-design` skill.

**Goal:** Build an 8-screen step-based onboarding flow with interactive scoring demo, before/after rewrite, session preview, and progressive coach toasts.

**Architecture:** Step-based flow at `/setup` with a state machine in `OnboardingFlow.tsx`. Each step is an independent component. Coach toasts use a context provider at the app layout level. Onboarding completion tracked in localStorage + Supabase user metadata.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, CSS variables for theming, existing UI components (GlassCard, CategoryBar, ScoreBadge), SiriBubble orb, lucide-react icons.

**Design doc:** `docs/plans/2026-02-26-onboarding-flow-design.md`

---

## Task 1: Onboarding Config & Data (Foundation)

> **No frontend-design skill needed.** Pure data/config task.

**Files:**
- Create: `config/onboarding.ts`
- Create: `hooks/useOnboarding.ts`

**Step 1: Create `config/onboarding.ts` with all onboarding content**

```typescript
// config/onboarding.ts

export const ONBOARDING_STEPS = [
  'hook',
  'problem',
  'session-demo',
  'realtime-intel',
  'rubric',
  'scoring-demo',
  'rewrite-demo',
  'personalization',
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

// Bad pitch used in scoring demo (Screen 6) and rewrite demo (Screen 7)
export const DEMO_BAD_PITCH = `We're building a platform that helps companies do better. Our solution leverages AI and machine learning to optimize workflows. We think the market is really big and we have some traction. We're looking to raise some money to grow faster.`;

// AI-rewritten version for Screen 7
export const DEMO_REWRITTEN_PITCH = `We're building Pitchr, an AI pitch coach that scores your fundraising pitch in under 30 seconds. Today, founders practice alone with no structured feedback -- 73% walk into investor meetings with fixable weaknesses they never caught. Pitchr identifies exactly what to fix, rewrites your weak lines, and tracks improvement over time. We've onboarded 240 founders in 8 weeks with 62% weekly retention. The pitch coaching market is $2.1B and growing 18% annually -- we're the only tool that scores and rewrites in real-time. We're raising $1.5M to hire 3 engineers and launch our deck analysis feature by Q3.`;

// Predetermined scores for the demo (Screen 6)
export const DEMO_SCORES = {
  overall: 34,
  verdict: 'Vague claims, no numbers, no differentiation. An investor stops listening after sentence two.',
  rubric: [
    { category: 'structure', label: 'Structure', score: 8, maxScore: 20 },
    { category: 'clarity', label: 'Clarity', score: 7, maxScore: 20 },
    { category: 'evidence', label: 'Evidence', score: 5, maxScore: 20 },
    { category: 'market', label: 'Market', score: 6, maxScore: 20 },
    { category: 'delivery', label: 'Delivery', score: 8, maxScore: 20 },
  ],
};

// Rewrite demo scores (Screen 7)
export const DEMO_REWRITE_SCORE = 81;

// Weak phrases to highlight in the bad pitch (red)
export const DEMO_BAD_HIGHLIGHTS = [
  'helps companies do better',
  'leverages AI and machine learning',
  'optimize workflows',
  'really big',
  'some traction',
  'some money',
  'grow faster',
];

// Strong phrases to highlight in the rewrite (green)
export const DEMO_GOOD_HIGHLIGHTS = [
  'scores your fundraising pitch in under 30 seconds',
  '73% walk into investor meetings with fixable weaknesses',
  '240 founders in 8 weeks',
  '62% weekly retention',
  '$2.1B and growing 18% annually',
  'raising $1.5M',
  'launch our deck analysis feature by Q3',
];

// Rubric explorer content (Screen 5)
export const RUBRIC_EXPLORER = [
  {
    id: 'structure',
    label: 'Structure',
    weight: 20,
    description: 'Problem -> Solution -> Why Now -> Traction -> Ask',
    good: 'Clear arc that builds urgency and ends with a specific ask.',
    bad: 'Jumps between topics with no logical flow.',
  },
  {
    id: 'clarity',
    label: 'Clarity',
    weight: 20,
    description: 'Every sentence earns its place',
    good: 'Concrete language, no jargon, each line advances the pitch.',
    bad: 'Buzzwords, filler phrases, vague claims.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    weight: 20,
    description: 'Specific numbers, named customers',
    good: '"240 founders in 8 weeks with 62% retention."',
    bad: '"We have strong traction and growing demand."',
  },
  {
    id: 'market',
    label: 'Market',
    weight: 20,
    description: 'TAM sourced, competitors named, moat clear',
    good: '"$2.1B market growing 18% -- only real-time scoring tool."',
    bad: '"The market is huge and we have no real competitors."',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    weight: 20,
    description: '130-160 WPM, <3% filler words',
    good: 'Confident pace, clean delivery, no "um" or "like."',
    bad: 'Rushing at 200 WPM with "um" every other sentence.',
  },
];

// Coach toast messages for progressive hints
export const COACH_TOASTS: Record<string, string> = {
  dashboard: 'This is home base. Your scores, trends, and next moves -- all here.',
  session: 'Pick your mode, hit record, and let it rip. The AI\'s listening.',
  results: 'Scroll down. The fixes are ranked -- top one has the biggest impact.',
  history: 'Every pitch you\'ve run lives here. Track your progress over time.',
  deck: 'Upload your deck and practice slide-by-slide. The AI reads along.',
  progress: 'Your score timeline. Watch the line go up.',
};
```

**Step 2: Create `hooks/useOnboarding.ts`**

```typescript
// hooks/useOnboarding.ts
'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pitchr_onboarding';
const TOAST_PREFIX = 'pitchr-toast-seen:';

export interface OnboardingState {
  isComplete: boolean;
  displayName: string;
  preferredMode: 'elevator' | 'vc_pitch';
}

const DEFAULTS: OnboardingState = {
  isComplete: false,
  displayName: '',
  preferredMode: 'elevator',
};

function loadState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function persistState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  const complete = useCallback((name: string, mode: 'elevator' | 'vc_pitch') => {
    const next: OnboardingState = {
      isComplete: true,
      displayName: name,
      preferredMode: mode,
    };
    persistState(next);
    setState(next);
  }, []);

  const reset = useCallback(() => {
    persistState(DEFAULTS);
    setState(DEFAULTS);
    // Also clear all toast flags
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(TOAST_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  }, []);

  return { state, loaded, complete, reset };
}
```

**Step 3: Run type check**

Run: `yarn tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to new files

**Step 4: Commit**

```bash
git add config/onboarding.ts hooks/useOnboarding.ts
git commit -m "feat(onboarding): add config data and useOnboarding hook"
```

---

## Task 2: Onboarding Shell & Progress Bar (Subagent 1 - frontend-design)

> **Use frontend-design skill.** This builds the main onboarding page shell, progress bar, step transitions, and keyboard/swipe navigation.

**Files:**
- Create: `app/(app)/setup/page.tsx`
- Create: `views/components/onboarding/OnboardingFlow.tsx`
- Create: `views/components/onboarding/ProgressBar.tsx`
- Create: `views/components/onboarding/StepTransition.tsx`
- Create: `views/components/onboarding/index.ts`

**Context the subagent needs:**
- App layout at `app/(app)/layout.tsx` wraps all `(app)` routes with `SidebarProvider` + `AppSidebar`. The setup page should hide the sidebar — create a custom layout OR use CSS to hide it.
- Use `useOnboarding` hook from `hooks/useOnboarding.ts` for completion state.
- Use `useAuth` from `views/components/AuthProvider.tsx` for auth check.
- Use `useRouter` from `next/navigation` for redirects.
- CSS variables: `--bg-primary`, `--bg-surface`, `--border-color`, `--text-primary`, `--text-secondary`, `--text-muted`, `--blur-strength`.
- Accent coral: `#ff5941`. Use for active progress dots and CTAs.
- `animate-fade-in-up` class available in globals.css.
- Named exports only. `'use client'` on all components.
- Import paths use `@/*` alias.

**Design spec:**

1. **`app/(app)/setup/page.tsx`** — Full-screen page that hides the sidebar. Checks auth (redirect to `/login` if no user). Checks `useOnboarding().state.isComplete` (redirect to `/dashboard` if done, unless `?replay=true` in URL). Renders `<OnboardingFlow />`.

2. **`OnboardingFlow.tsx`** — State machine managing `currentStep` (0-7). Renders `<ProgressBar>` at top + current step component inside `<StepTransition>`. Handles `onNext`, `onBack`, `onSkip` callbacks. Keyboard: ArrowRight/Enter advance, ArrowLeft goes back. Touch swipe on mobile (track touchstart/touchend X delta > 50px).

3. **`ProgressBar.tsx`** — 8 small dots (12px) in a horizontal row with a thin connecting line. Current dot filled coral (`#ff5941`), completed dots filled coral, future dots use `var(--border-color)`. "Skip" link on the right side in `var(--text-muted)`. Step counter text: "1 / 8" on the left.

4. **`StepTransition.tsx`** — Wrapper that applies fade + slide-left animation (300ms ease-out) when `key` changes. Use CSS transitions: entering element fades in from right (opacity 0, translateX 20px -> 0), exiting fades out left.

**Step components are NOT built here** — they'll be placeholder `<div>`s with step names. Each subsequent task builds the real step components.

**Commit:** `feat(onboarding): add setup page shell with progress bar and step navigation`

---

## Task 3: Hook Step + Problem Step (Subagent 2 - frontend-design)

> **Use frontend-design skill.** Screens 1 and 2 — pure typography and animation screens.

**Files:**
- Create: `views/components/onboarding/steps/HookStep.tsx`
- Create: `views/components/onboarding/steps/ProblemStep.tsx`

**Context the subagent needs:**
- These are full-viewport-height centered content screens (minus progress bar).
- CSS variables for colors (see Task 2 context).
- Accent coral `#ff5941` for highlighted words.
- `GlassCard` available from `@/views/components/ui` (see `views/components/ui/GlassCard.tsx`).
- Each step receives `onNext: () => void` as a prop.
- Named exports, `'use client'`, `@/*` imports.

**Design spec:**

**HookStep (Screen 1):**
- Centered vertically and horizontally.
- Main text: "Most pitches fail in the first 30 seconds." — `text-4xl md:text-5xl font-bold`, `var(--text-primary)`.
- "30 seconds" wrapped in `<span>` with color `#ff5941`.
- Fade-in animation: text starts opacity 0, animates to 1 over 800ms with slight translateY.
- Subtitle appears 600ms later: "Yours doesn't have to." — `text-lg`, `var(--text-secondary)`.
- CTA button appears 400ms after subtitle: "Show me why" with ArrowRight icon. Coral bg (`#ff5941`), white text, rounded-xl, px-6 py-3, hover scale 1.02.

**ProblemStep (Screen 2):**
- Centered vertically.
- Three lines appear one at a time (600ms stagger):
  1. "You practice alone."
  2. "You guess what's wrong."
  3. "You walk into the room hoping."
- Each line: `text-2xl md:text-3xl font-semibold`, `var(--text-primary)`. Fade-in-up animation.
- After all three (1.8s delay), pivot line appears: "Pitchr replaces hope with data." — same size but color `#ff5941`, with a subtle scale animation.
- CTA button appears 400ms after pivot: "Next" with ArrowRight icon. Same style as HookStep CTA.

**Commit:** `feat(onboarding): add hook and problem steps with staggered animations`

---

## Task 4: Session Demo Step (Subagent 3 - frontend-design)

> **Use frontend-design skill.** Screen 3 — animated mock of the recording interface.

**Files:**
- Create: `views/components/onboarding/steps/SessionDemoStep.tsx`

**Context the subagent needs:**
- This is a MOCK — no real camera, mic, or permissions. All CSS/JS animation.
- CSS variables for theming (see Task 2 context).
- `GlassCard` from `@/views/components/ui`.
- The SiriBubble orb can be imported: `import { SiriBubble } from '@/views/components/SiriBubble'` — render it small (120x120px container) with `orbState="active"`.
- Receives `onNext: () => void` prop.
- Named exports, `'use client'`, `@/*` imports.

**Design spec:**

- Two-column layout on desktop (mock session left, description right), stacked on mobile.
- **Left: Mock Session Interface** inside a `GlassCard`:
  - Top: dark rounded rectangle simulating camera viewport (aspect-ratio 16/9, `var(--bg-secondary)` bg). Inside: a centered gradient circle placeholder (simulating a face silhouette) with subtle pulse animation.
  - Below camera: the SiriBubble orb rendered small (120x120) in `active` state.
  - Below orb: row of 3 animated metric counters:
    - "WPM" — number that ticks from 90 to 142 over 4 seconds using `requestAnimationFrame`.
    - "Duration" — timer counting up from 0:00 to 0:08 (1 second intervals).
    - "Fillers" — counter that goes 0 -> 1 -> 2 with a red flash on each increment (at 2s and 5s).
  - Each counter: label in `text-xs var(--text-muted)`, value in `text-lg font-bold var(--text-primary)`.

- **Right: Description:**
  - Headline: "Record with your camera. The AI listens in real-time." — `text-2xl font-bold var(--text-primary)`.
  - Three callout items that animate in with staggered delays (0.5s, 1.2s, 1.8s):
    - "Live WPM tracking" with Activity icon
    - "Filler word detection" with AlertCircle icon
    - "Engagement monitoring" with Eye icon
  - Each callout: small coral dot + text in `text-sm var(--text-secondary)`.

- CTA: "What does it catch?" with ArrowRight icon, coral button.

- All animations auto-play on mount, loop every 8 seconds (reset counters).

**Commit:** `feat(onboarding): add session demo step with animated mock interface`

---

## Task 5: Realtime Intel Step (Subagent 4 - frontend-design)

> **Use frontend-design skill.** Screen 4 — animated metrics panel demo.

**Files:**
- Create: `views/components/onboarding/steps/RealtimeIntelStep.tsx`

**Context the subagent needs:**
- Pure animation, no real data. All mock/hardcoded.
- CSS variables, `GlassCard`, `@/*` imports, named exports, `'use client'`.
- RUBRIC_COLORS from `views/components/ui/colors.ts`: structure `#ff5941`, clarity `#ffaa33`, evidence `#22c55e`, market `#f97316`, delivery `#ef4444`.
- Receives `onNext: () => void` prop.

**Design spec:**

- Two-column layout (animated panel left, description right). Stacked on mobile.
- **Left: Animated Metrics Panel** inside a `GlassCard`:
  - **Checklist** (top section): 4 items that check off sequentially (1s intervals on mount):
    1. "Problem stated" — checks at 1s
    2. "Solution introduced" — checks at 2s
    3. "Traction mentioned" — checks at 3s (stays unchecked to show incomplete)
    4. "Ask defined" — stays unchecked
  - Unchecked: circle outline, `var(--text-muted)` text. Checked: filled green circle (#22c55e) with checkmark, `var(--text-primary)` text. Checking animation: scale pop (0.8 -> 1.1 -> 1.0) over 300ms.

  - **WPM Gauge** (middle section):
    - Horizontal bar with three zones: red zone (< 130), green zone (130-160, labeled "Sweet Spot"), red zone (> 160).
    - Animated needle/indicator dot that moves from 100 to 145 over 3 seconds, settling in the green zone.
    - Current value displayed: "145 WPM" in `font-bold`.

  - **Filler Counter** (bottom section):
    - Large number "3" that ticks up from 0, with a brief red flash (`#ef4444` bg pulse) on each increment.
    - Label: "Filler words detected" in `text-xs var(--text-muted)`.

- **Right: Description:**
  - Headline: "While you speak, Pitchr tracks structure, delivery, and confidence." — `text-2xl font-bold`.
  - Subtitle: "Every word counts." — `text-lg var(--text-secondary)`, appears 800ms later.

- CTA: "Then comes the score" with ArrowRight icon.

- Animations auto-play on mount.

**Commit:** `feat(onboarding): add realtime intelligence step with animated metrics`

---

## Task 6: Rubric Step (Subagent 5 - frontend-design)

> **Use frontend-design skill.** Screen 5 — interactive rubric explorer.

**Files:**
- Create: `views/components/onboarding/steps/RubricStep.tsx`

**Context the subagent needs:**
- Import `RUBRIC_EXPLORER` from `@/config/onboarding`.
- Import `RUBRIC_COLORS` from `@/views/components/ui/colors`.
- Import `GlassCard` from `@/views/components/ui`.
- Import `SCORE_BANDS` from `@/config/rubric` — array of `{ min, max, label, color }`.
- Receives `onNext: () => void` prop.
- Named exports, `'use client'`, `@/*` imports.

**Design spec:**

- Centered layout, max-width 700px.
- Headline: "Five categories. One score. Zero guesswork." — `text-2xl font-bold var(--text-primary)`.
- Subtitle: "Tap any category to see what the AI evaluates." — `text-sm var(--text-secondary)`.

- **5 Category Cards** in a vertical stack with 8px gap:
  - Each card is a `GlassCard` with `padding="sm"`.
  - Left: colored circle (12px) using `RUBRIC_COLORS[category.id]`.
  - Middle: category label (`font-semibold`), weight shown as "/20".
  - Right: chevron icon that rotates on expand.
  - Clickable — toggles expanded state.
  - **Expanded content** (animated slide-down, 200ms):
    - Description text in `var(--text-secondary)`.
    - Two rows:
      - Green checkmark + "Good:" + `category.good` text
      - Red X + "Bad:" + `category.bad` text
  - Stagger entrance animation: each card fades in 100ms after the previous.

- **Score Bands** at bottom in a horizontal row:
  - 4 pills showing: "0-39 Needs Work" (red), "40-59 Getting There" (yellow), "60-79 Solid" (blue), "80-100 Investor-Ready" (green).
  - Each pill: small colored dot + label, `text-xs`, semi-transparent colored bg.

- CTA: "Watch it score" with ArrowRight icon.

**Commit:** `feat(onboarding): add interactive rubric explorer step`

---

## Task 7: Scoring Demo Step (Subagent 6 - frontend-design)

> **Use frontend-design skill.** Screen 6 — the "holy shit" interactive scoring moment.

**Files:**
- Create: `views/components/onboarding/steps/ScoringDemoStep.tsx`

**Context the subagent needs:**
- Import from `@/config/onboarding`: `DEMO_BAD_PITCH`, `DEMO_SCORES`.
- Import `CategoryBar` from `@/views/components/ui` — props: `{ label, score, maxScore, color, delay }`.
- Import `ScoreBadge` from `@/views/components/ui` — props: `{ score, showLabel, size }`.
- Import `RUBRIC_COLORS, getRubricColor` from `@/views/components/ui/colors`.
- Import `GlassCard` from `@/views/components/ui`.
- `SiriBubble` from `@/views/components/SiriBubble` — render with `orbState` prop.
- Receives `onNext: () => void` prop.
- Named exports, `'use client'`, `@/*` imports.

**Design spec:**

- **Phase 1: Pre-score (initial state):**
  - Bad pitch text displayed in a `GlassCard` with `text-sm leading-relaxed var(--text-secondary)`. Slightly italic.
  - Below: large coral button: "Score this pitch" with Zap icon. Prominent, centered.

- **Phase 2: Analyzing (after click, 3 seconds):**
  - Button disappears.
  - SiriBubble orb appears centered (150x150) in `active` state.
  - Below orb: "Analyzing..." text with a subtle pulse animation.
  - 5 small step indicators (one per rubric category) that light up sequentially (600ms each):
    - Structure -> Clarity -> Evidence -> Market -> Delivery
    - Each: small dot that fills with its rubric color when active.
  - After all 5 complete (3s total), transition to Phase 3.

- **Phase 3: Results revealed:**
  - Orb transitions to `negative` state (score is 34, which is bad).
  - Large score counter animates from 0 to 34 using `requestAnimationFrame` (1.5s duration, ease-out). `text-6xl font-bold`. Color: `#ef4444` (needs-work red).
  - `ScoreBadge` appears below with `showLabel={true}` — shows "Needs Work".
  - Verdict text fades in 500ms after score: the `DEMO_SCORES.verdict` string in `text-sm font-medium var(--text-primary)`.
  - 5 `CategoryBar` components animate in with staggered delays (use the `delay` prop: 0, 1, 2, 3, 4). Each shows the predetermined score from `DEMO_SCORES.rubric`.

- CTA: "But we don't just score. We fix." with ArrowRight icon. Appears 500ms after results.

**Commit:** `feat(onboarding): add interactive scoring demo step`

---

## Task 8: Rewrite Demo Step (Subagent 7 - frontend-design)

> **Use frontend-design skill.** Screen 7 — before/after reveal.

**Files:**
- Create: `views/components/onboarding/steps/RewriteDemoStep.tsx`

**Context the subagent needs:**
- Import from `@/config/onboarding`: `DEMO_BAD_PITCH`, `DEMO_REWRITTEN_PITCH`, `DEMO_BAD_HIGHLIGHTS`, `DEMO_GOOD_HIGHLIGHTS`, `DEMO_SCORES`, `DEMO_REWRITE_SCORE`.
- Import `GlassCard` from `@/views/components/ui`.
- Import `getScoreColor, getScoreBandLabel` from `@/views/components/ui/colors`.
- Receives `onNext: () => void` prop.
- Named exports, `'use client'`, `@/*` imports.

**Design spec:**

- Two-column layout on desktop, stacked on mobile.

- **Left column: "Before"**
  - Label: "BEFORE" in `text-xs font-bold uppercase tracking-wider`, color `#ef4444`.
  - `GlassCard` containing the bad pitch text.
  - Weak phrases from `DEMO_BAD_HIGHLIGHTS` are wrapped in `<mark>` with red/coral background (`rgba(239, 68, 68, 0.15)`) and red text color.
  - Text renders with `text-sm leading-relaxed`.

- **Right column: "After"** (slides in from right, 600ms delay)
  - Label: "AFTER" in `text-xs font-bold uppercase tracking-wider`, color `#22c55e`.
  - `GlassCard` containing the rewritten pitch text.
  - Strong phrases from `DEMO_GOOD_HIGHLIGHTS` are wrapped in `<mark>` with green background (`rgba(34, 197, 94, 0.15)`) and green text color.

- **Score transition** (centered below both columns):
  - Animated counter: starts at `DEMO_SCORES.overall` (34), animates to `DEMO_REWRITE_SCORE` (81) over 2 seconds.
  - `text-5xl font-bold`, color transitions from red to green during animation.
  - Band label transitions: "Needs Work" -> "Investor-Ready".
  - Arrow icon between old and new score.

- **Tagline** appears after score animation:
  - "Same pitch. Same founder. Better words." — `text-xl font-semibold var(--text-primary)`, centered.

- CTA: "Let's set you up" with ArrowRight icon.

**Commit:** `feat(onboarding): add before/after rewrite demo step`

---

## Task 9: Personalization Step (Subagent 8 - frontend-design)

> **Use frontend-design skill.** Screen 8 — name input, mode picker, and launch.

**Files:**
- Create: `views/components/onboarding/steps/PersonalizationStep.tsx`

**Context the subagent needs:**
- This step calls `onComplete(name, mode)` instead of `onNext`. The parent `OnboardingFlow` will handle calling `useOnboarding().complete()` and routing.
- Import `GlassCard` from `@/views/components/ui`.
- Import `getModeColor, getModeBgColor` from `@/views/components/ui/colors`.
- Pitch modes: `'elevator'` (label "Elevator Pitch", subtitle "60 seconds. Hook them fast.", icon: Zap from lucide) and `'vc_pitch'` (label "VC Pitch", subtitle "Full deck. Close the round.", icon: BarChart3 from lucide).
- Mode colors: elevator `#f97316`, vc_pitch `#ff5941`.
- Receives `onComplete: (name: string, mode: 'elevator' | 'vc_pitch') => void` prop.
- Named exports, `'use client'`, `@/*` imports.

**Design spec:**

- Centered layout, max-width 500px.

- **Name input:**
  - Label: "What should we call you?" — `text-xl font-semibold var(--text-primary)`.
  - Input: large text input (`text-lg`), glassmorphic styling (transparent bg, `var(--border-color)` border, `var(--blur-strength)` blur), rounded-xl, autofocus, placeholder "First name".
  - On focus: border transitions to coral (`#ff5941`).

- **Mode picker** (appears 400ms after mount):
  - Label: "What are you prepping for?" — `text-xl font-semibold var(--text-primary)`, margin-top 2rem.
  - Two selectable cards side by side:
    - Each: `GlassCard` with `padding="md"`, clickable.
    - Icon (Zap or BarChart3) + mode label + subtitle.
    - Selected state: border becomes mode color, subtle mode-color bg tint, icon color fills.
    - Unselected: default border, muted text.
    - Hover: slight scale (1.02) and border color hint.

- **Launch section** (appears after both name and mode are selected):
  - Personalized text: "Alright {name}, let's find out where your pitch breaks." — `text-lg font-medium var(--text-primary)`. {name} in coral.
  - Big CTA button: "Run My First Pitch" with ArrowRight icon. Coral gradient bg (#ff5941 -> #e63b26), white text, rounded-xl, px-8 py-4, `text-lg font-semibold`. Animated breathing glow (like the dashboard "Run a Pitch" button).
  - Below: small link "or explore the dashboard first" in `text-sm var(--text-muted)`, underline on hover. This also calls `onComplete`.

**Commit:** `feat(onboarding): add personalization step with name and mode picker`

---

## Task 10: Coach Toast System (Subagent 9 - frontend-design)

> **Use frontend-design skill.** Progressive toast hints that appear on first page visits.

**Files:**
- Create: `views/components/ui/CoachToast.tsx`
- Create: `hooks/useCoachToast.ts`
- Modify: `app/layout.tsx` — add CoachToastProvider (or add to existing ToastProvider area)

**Context the subagent needs:**
- Import `COACH_TOASTS` from `@/config/onboarding` — `Record<string, string>` mapping page keys to messages.
- Import `useOnboarding` from `@/hooks/useOnboarding` — check `state.isComplete` before showing toasts.
- Existing `ToastProvider` is at `views/components/Toast.tsx` and wraps the app in `app/layout.tsx`. Do NOT replace it. The coach toast is a separate, independent component.
- CSS variables for theming. Named exports, `'use client'`, `@/*` imports.

**Design spec:**

**`hooks/useCoachToast.ts`:**
- Takes `pageKey: string` parameter.
- Checks localStorage for `pitchr-toast-seen:{pageKey}`.
- If not seen AND onboarding is complete: returns `{ message: string, dismiss: () => void }`.
- `dismiss` sets the localStorage flag and hides the toast.
- Auto-dismiss after 8 seconds.
- Returns `null` if already seen or onboarding not complete.

**`views/components/ui/CoachToast.tsx`:**
- Component that renders conditionally based on `useCoachToast` result.
- Positioned fixed, bottom-right on desktop (bottom: 24px, right: 24px), bottom-center on mobile (bottom: 16px, left/right: 16px).
- Width: 300px desktop, full-width minus 32px mobile.
- Glassmorphic card: `var(--bg-surface)` bg, `backdrop-blur`, `var(--border-color)` border, rounded-xl.
- **Coral left border** (3px solid `#ff5941`).
- Content: message text in `text-sm var(--text-primary)`.
- Close button: X icon in `var(--text-muted)`, top-right.
- Entrance animation: slide up 12px + fade in (200ms ease-out).
- Exit animation: fade out (150ms).
- Respects `prefers-reduced-motion` media query — skip slide animation, just appear/disappear.
- z-index: 50 (below the main toast system at z-[9999]).

**Integration:**
- Each page that should show a toast imports `CoachToast` and renders it with the page key:
  ```tsx
  <CoachToast pageKey="dashboard" />
  ```
- Add `<CoachToast pageKey="dashboard" />` to dashboard page, `<CoachToast pageKey="session" />` to session page, etc. (this can be a follow-up task or done here for dashboard only as proof of concept).

**Commit:** `feat(onboarding): add coach toast system for progressive page hints`

---

## Task 11: Settings Integration + Wiring (Subagent 10 - frontend-design)

> **Use frontend-design skill.** Wire onboarding into settings page + auth redirect.

**Files:**
- Modify: `app/(app)/settings/page.tsx` — add "Onboarding & Tips" section
- Modify: `app/auth/callback/route.ts` — redirect new users to `/setup`
- Modify: `app/(app)/dashboard/page.tsx` — use `displayName` from onboarding for greeting

**Context the subagent needs:**

- Settings page at `app/(app)/settings/page.tsx` uses `SectionCard` (local component, see lines 49-98) and `SettingRow` (lines 102-126). Follow same patterns.
- Import `useOnboarding` from `@/hooks/useOnboarding`.
- Import `RotateCcw` and `MessageCircle` icons from `lucide-react`.
- Auth callback at `app/auth/callback/route.ts` currently redirects to `redirectTo` param or `/dashboard`.
- Dashboard greeting at `app/(app)/dashboard/page.tsx` uses `getGreeting()` function.

**Design spec:**

**Settings — "Onboarding & Tips" section:**
- Add a new `SectionCard` between "Achievements" and "Plan & Billing" sections.
- Icon: `RotateCcw`, iconColor: `#3b82f6` (blue).
- Title: "Onboarding & Tips".
- Two setting rows:
  1. **"Replay onboarding"** — description: "Walk through the product introduction again". Button: "Replay" with RotateCcw icon. On click: calls `useOnboarding().reset()` then `router.push('/setup')`.
  2. **"Reset page tips"** — description: "Show coach tips again on each page". Button: "Reset Tips" with MessageCircle icon. On click: clears all `pitchr-toast-seen:*` localStorage keys, shows success toast.

**Auth callback — new user detection:**
- After successful code exchange, check if user metadata has `onboarding_completed`. If not, redirect to `/setup` instead of `/dashboard`.
- Implementation: After `exchangeCodeForSession`, call `supabase.auth.getUser()` to read metadata. If `user.user_metadata.onboarding_completed !== true`, redirect to `/setup`.
- If `redirectTo` param is explicitly set, respect it (don't override).

**Dashboard greeting — personalized name:**
- In the greeting section, check `useOnboarding().state.displayName`. If set, show "Good morning, {name}" instead of just "Good morning".

**Commit:** `feat(onboarding): add settings section and wire auth redirect`

---

## Task 12: Integration Test & Polish

> **No frontend-design skill needed.** Manual integration verification.

**Steps:**

1. Run `yarn build` — verify no build errors.
2. Run `yarn dev` — verify the full flow:
   - Navigate to `/setup` — should see onboarding.
   - Click through all 8 screens.
   - Verify animations play correctly.
   - Verify scoring demo interaction works.
   - Verify rewrite demo highlights and score animation.
   - Enter name, select mode, click "Run My First Pitch" — should navigate to `/session?mode={mode}`.
   - Check localStorage has `pitchr_onboarding` with `isComplete: true`.
   - Navigate to `/dashboard` — should see personalized greeting.
   - Check coach toast appears on dashboard.
   - Go to settings — verify "Onboarding & Tips" section.
   - Click "Replay" — should go back to `/setup`.
3. Test keyboard navigation: ArrowRight, ArrowLeft, Enter.
4. Test mobile responsive: all screens should stack properly.
5. Test skip: clicking "Skip" should go to dashboard.

**Commit:** `feat(onboarding): integration polish and fixes`

---

## Subagent Dispatch Summary

| Task | Subagent | Skill | Depends On | Description |
|------|----------|-------|------------|-------------|
| 1 | None (do first) | N/A | Nothing | Config + useOnboarding hook |
| 2 | Subagent 1 | frontend-design | Task 1 | Shell, progress bar, step navigation |
| 3 | Subagent 2 | frontend-design | Task 1 | Hook step + Problem step |
| 4 | Subagent 3 | frontend-design | Task 1 | Session demo step |
| 5 | Subagent 4 | frontend-design | Task 1 | Realtime intel step |
| 6 | Subagent 5 | frontend-design | Task 1 | Rubric explorer step |
| 7 | Subagent 6 | frontend-design | Task 1 | Scoring demo step |
| 8 | Subagent 7 | frontend-design | Task 1 | Rewrite demo step |
| 9 | Subagent 8 | frontend-design | Task 1 | Personalization step |
| 10 | Subagent 9 | frontend-design | Task 1 | Coach toast system |
| 11 | Subagent 10 | frontend-design | Tasks 1-10 | Settings + auth wiring |
| 12 | None (do last) | N/A | All | Integration test |

**Parallelization:** After Task 1 completes, Tasks 2-10 can ALL run in parallel as separate subagents in isolated worktrees. Task 11 runs after all merge. Task 12 is final verification.
