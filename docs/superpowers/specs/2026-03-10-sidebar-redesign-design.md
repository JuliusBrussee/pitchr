# Sidebar Redesign — Warm & Branded

**Date:** 2026-03-10
**Status:** Approved

## Overview

Elevate the dashboard sidebar from generic to premium by applying the "Warm & Branded" visual direction. Uses Pitchr's coral/orange brand palette sparingly for active states, icon containers, and the CTA. Adds a gradient avatar, diamond-icon credits bar, and warm gradient wash.

## Changes

### 1. Container — Warm Gradient Wash

Add a subtle top-down gradient to the sidebar background:

```
background: linear-gradient(180deg, rgba(255,89,65,0.04) 0%, transparent 40%), var(--bg-surface);
```

All other container properties (w-60, rounded-2xl, border, backdrop-filter) remain unchanged. Mobile behavior unchanged.

### 2. Logo — Glowing Icon

Add a glow shadow to the PitchrLogo container:

```
box-shadow: 0 0 20px rgba(255,89,65,0.3);
```

Theme toggle stays in same position.

### 3. Nav Items — Icon Pill Backgrounds

Each nav item gets an icon container:

- **Container**: 28×28px, rounded-lg
- **Inactive**: `background: rgba(255,255,255,0.04)`, icon color `var(--text-muted)`
- **Active row**: `background: rgba(255,89,65,0.1)`, `border: 1px solid rgba(255,89,65,0.12)`
- **Active icon container**: `background: rgba(255,89,65,0.15)`, icon color `#ff5941`
- **Active text**: `var(--text-primary)`, `font-weight: 500`
- Row gap increased from `gap-1` to `gap-[3px]`

Light mode equivalents:
- Inactive icon bg: `rgba(0,0,0,0.04)`
- Active row bg: `rgba(255,89,65,0.06)`
- Active row border: `rgba(255,89,65,0.1)`
- Active icon bg: `rgba(255,89,65,0.1)`

### 4. Tools Section

Same icon pill treatment as main nav items. No other changes.

### 5. User Section — Stacked with Diamond Credits Bar

Replace current email + logout row with a two-part block:

**Top part** (user info):
- Square avatar: 32×32px, `border-radius: 8px`, `background: linear-gradient(135deg, #ff5941, #ffaa33)`, white first-initial text (13px, weight 600)
- Initial derived from user email (first character before @) or display name
- Email (11px, truncated) + "Pro Plan" label (10px, muted)
- Logout icon top-right

**Bottom part** (credits bar):
- Separate row below user info: `padding: 6px 8px`, `border-radius: 8px`
- Background: `rgba(255,170,51,0.06)`, border: `1px solid rgba(255,170,51,0.1)`
- Diamond SVG icon (12×12px, `#ffaa33`, 70% opacity) + "12 remaining" text (10px, `#ffaa33`, 80% opacity)
- Credits count sourced from existing billing/subscription data

Light mode equivalents:
- Credits bar bg: `rgba(255,170,51,0.06)`
- Credits bar border: `rgba(255,170,51,0.12)`

### 6. Legal Links — Moved to Settings

Remove Terms and Privacy links from sidebar. Add them to the Settings page (e.g., at bottom of settings content area).

### 7. Start Session CTA — Enhanced Glow

Add stronger box-shadow to existing button:

```
box-shadow: 0 0 24px rgba(255,89,65,0.35);
```

Existing animation (spin, breathe, shine) remains unchanged.

## Files to Modify

| File | Change |
|------|--------|
| `views/components/AppSidebar.tsx` | All sidebar visual changes (gradient wash, icon pills, user section, remove legal links) |
| `app/globals.css` | Light-mode CSS variable additions if needed |
| `app/(app)/settings/page.tsx` (or equivalent) | Add Terms/Privacy links |

## What Stays the Same

- Sidebar width (w-60), border-radius, padding
- Mobile hamburger/overlay behavior (layout.tsx unchanged)
- Project selector component (ProjectSelect)
- All navigation routes and items (NAV_ITEMS, TOOL_ITEMS arrays)
- StartSessionButton component internals (just enhanced shadow on wrapper)
- SidebarContext state management
- Theme toggle functionality

## Out of Scope

- Collapsible/resizable sidebar
- Nav item badges or notification dots
- Sidebar animations on page transitions
- Changes to page content areas
