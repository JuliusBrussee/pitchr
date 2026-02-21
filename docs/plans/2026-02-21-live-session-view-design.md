# Live Session View — Design Document

**Status:** Approved
**Date:** 2026-02-21

## Overview

The Live Session View is the core screen of Pitchr where users practice their pitch with real-time AI feedback. It features a Zoom-like interface with webcam, slide viewer, AI companion (SiriBubble), live metrics, and pitch checklist.

## Decisions

- **Fidelity:** Interactive prototype — real webcam/mic via `getUserMedia`, placeholder metrics data
- **Deck format:** Placeholder for now (image-based rendering later, PPT conversion deferred)
- **Video feeds:** One real webcam feed (speaker) + slide placeholder as the main view; clickable to swap focus
- **UI style:** Light + dark mode, frosted glass effects in light mode, rounded corners, microinteractions
- **Reactive background:** Ambient aura gradients that shift color based on SiriBubble state
- **Architecture:** Simplified composable — 5 components + 2 hooks

## Layout

3-column grid: Sidebar (240px) | Main Canvas (flex-1) | Metrics Panel (320px)

```
┌──────────┬──────────────────────────┬───────────────┐
│ Sidebar  │     Main Canvas          │  Metrics      │
│  240px   │     flex-1               │  Panel 320px  │
│          │                          │               │
│ Nav:     │  ┌─────────────────────┐ │  Live Summary │
│ Dashboard│  │  Slides / Pres.     │ │  WPM, Fillers │
│ Live*    │  │  (placeholder)      │ │  Concise,     │
│ History  │  │                     │ │  Clarity      │
│ Analytics│  │   [SiriBubble] (TR) │ │               │
│ ──────── │  │   speech bubbles    │ │  ─────────── │
│ Deck Mgr │  │         ┌─────┐    │ │  Pitch        │
│ Settings │  │         │ Cam │(BR)│ │  Checklist    │
│          │  └─────────────────────┘ │               │
│          │  [cam] [mic] controls    │  ─────────── │
│ [Start]  │                          │  Live Insights│
└──────────┴──────────────────────────┴───────────────┘
```

## Components

### 1. `views/components/AppSidebar.tsx`

Navigation sidebar with two sections and a bottom CTA.

**Nav section (top):**
- Dashboard, Live Session (active), History, Analytics
- Each item: icon + label, rounded-pill shape
- Active item: frosted glass highlight

**Tools section (middle):**
- Deck Manager, Settings
- Subtle divider between nav and tools

**CTA (bottom, pinned):**
- "Start Session" button with accent color from current orb state

**Behavior:**
- Frosted glass surface in light mode, dark surface in dark mode

### 2. `views/components/SessionCanvas.tsx`

Main content area containing slides, webcam, SiriBubble, and controls.

**Slide Viewer (main focus by default):**
- Rounded rectangle showing uploaded slides or placeholder
- Placeholder: soft gradient card with "Upload or generate your deck"
- Expands to fill canvas in mic-only mode

**Webcam Feed (bottom-right overlay):**
- ~200x150px rounded rectangle with real webcam stream
- Click to swap focus with slides (smooth transition)

**SiriBubble (top-right, 64px):**
- Existing SiriBubble component at `sm` size
- State driven by session state
- Generates speech bubble pills ("Great eye contact!", "Take a breath")
- Speech bubbles: frosted glass pills, fade in/out with slide animation

**Media Controls (above canvas, centered):**
- Camera toggle + Microphone toggle
- Camera off → mic-only mode, webcam hides, slides expand

### 3. `views/components/MetricsPanel.tsx`

Vertical right panel with three scrollable sections.

**Live Summary:**
- WPM (numeric + small gauge), Filler Words (incrementing count)
- Conciseness (score/10 + progress bar), Clarity (score/10 + progress bar)
- Values animate smoothly on change

**Pitch Checklist:**
- Generated list of talking points
- States: completed (green check), partial (amber half-circle), uncovered (gray circle)

**Live Insights:**
- Scrolling feed of AI feedback cards with timestamps
- Auto-scrolls to latest

### 4. `views/components/ThemeProvider.tsx`

Light/dark mode context + reactive aura background.

**Theme toggle:** Sun/moon icon in sidebar header
**Light mode:** Frosted glass (`backdrop-blur-xl`), white/gray surfaces, low-opacity borders
**Dark mode:** Dark surfaces, subtle frosted glass, brighter accents

**Reactive Aura:**
- Radial gradient "auras" on page background
- Color shifts based on SiriBubble state (purple→idle, green→positive, red→negative)
- ~5-10% opacity, ~1.5s CSS transition
- Atmospheric, not overwhelming

### 5. `app/(app)/session/page.tsx`

Page component wiring everything together with session state context.

## Hooks

### `hooks/useMediaStream.ts`
- Manages `getUserMedia` for webcam and microphone
- Provides stream, toggle camera, toggle mic, active states
- Cleanup on unmount

### `hooks/useSessionState.ts`
- Shared session state: orb state, metrics values, media mode, checklist items
- Provides context for all components to read/update
- Simulated metric updates for prototype (will be replaced with real analysis)

## Color System

| SiriBubble State | Aura Color | Accent |
|---|---|---|
| idle | Purple/Blue (#6B21A8/#2563EB) | Purple |
| active | Cyan/Blue (#06B6D4/#3B82F6) | Cyan |
| positive | Green/Teal (#22C55E/#10B981) | Green |
| negative | Red/Orange (#EF4444/#F97316) | Red |
| neutral | Yellow/Amber (#EAB308/#F59E0B) | Amber |

## Microinteractions

- Webcam/slide focus swap: smooth scale + opacity transition (~300ms)
- Speech bubbles: fade in + slide up, fade out after 4s
- Metric value changes: number counter animation
- Checklist state changes: icon morph + color transition
- Theme toggle: smooth background color transition
- Nav hover: subtle scale + glow
- Start Session button: pulse animation when idle
