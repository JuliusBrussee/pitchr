# Canvas Editing Deep Dive — Chronicle AI-Caliber Deck Editor

**Date:** 2026-03-11
**Context:** Requirements extracted from Chronicle AI (app.chroniclehq.com) screenshots + deep technology research
**Status:** Research complete
**Dependencies:** [pitch-deck-builder.md](./pitch-deck-builder.md), [canvas-editing-technologies.md](./canvas-editing-technologies.md), [snapping-alignment-system.md](./snapping-alignment-system.md), [template-component-system.md](./template-component-system.md), [editor-ux-patterns.md](./editor-ux-patterns.md)

---

## Requirements from Chronicle AI Screenshots

### Requirement 1: Theme System with Chapter Presets
**Source screenshots:** Theme panel (Retro tech / Chronicle themes, Neutral light / Neutral dark / Accent presets)

- **Theme dropdown** with named themes (e.g., "Retro tech", "Chronicle") that instantly recolors the entire slide
- **Chapter presets**: Neutral Light, Neutral Dark, Accent — each with a colored dot indicator and "Aa" preview
- **Scope toggle**: "This chapter" vs "Whole document"
- Background customization per slide (independent of theme)
- Theme changes are instant and content-preserving

**Recommended approach:** CSS custom properties with `data-theme` and `data-preset` attributes. Theme primitives (fonts, color scales) set at document level, semantic tokens (slide-bg, slide-text, slide-accent) set at preset level. Instant switching via CSS cascade — no React re-renders needed for color changes. Tailwind references variables via `bg-[var(--slide-bg)]`.

**Key interfaces:**
- `DeckTheme` — full design language (primitives + chapter presets)
- `ChapterPreset` — semantic color assignments (background, text, accent, border)
- `ThemeScope` — document-level theme + chapter-level preset overrides + per-slide overrides

### Requirement 2: Component Variant System
**Source screenshots:** "Vertical card" dropdown, size variant "Large", card grid (3x2), "Turn into" menu

- **Variant dropdowns** on widgets: Vertical card ↔ Horizontal card, Small / Medium / Large
- **"Turn into" menu**: Paragraph, Heading, Image, Video, Card, Chart (Beta), Embed/link, Mockup, Sticky note
- **Data-preserving transforms**: same content, different layout when switching variants or types
- **Grid reflow**: when cards change from vertical to horizontal, the grid automatically adjusts

**Recommended approach:** Figma-inspired variant-as-property model. A `Card` has properties `direction: vertical|horizontal`, `size: sm|md|lg`, `style: default|outlined|accent|minimal`. Stored as `variants: Record<string, string>` on each instance — switching is a single state update.

For "Turn Into", use Notion's superset content model — all possible fields stored on every component, each renderer reads only what it needs. Unused fields persist silently, enabling lossless round-trip transformations.

**Key interfaces:**
- `ComponentInstance` — id, type, variants, content (superset), children, position
- `ComponentContent` — universal superset (title, body, items, mediaUrl, dataPoints, calloutValue, etc.)
- `ComponentTypeDefinition` — registry entry with variant schema, content fields, transform targets
- `TransformRule` — field mappings between component types with optional value transforms

### Requirement 3: Snapping & Alignment System
**Source:** PPT-like editing requirement (direct from user)

- Smart snap guides: center, edge, spacing alignment
- Snap to grid, other elements, slide margins
- Visual alignment guides (colored lines when elements align)
- Equal spacing indicators between 3+ elements

**Recommended approach:** Custom pure functions (based on Konva.js algorithm pattern) + React overlay for guide lines. No library needed — the core algorithm is ~100 lines.

**Algorithm:** Collect snap points from all elements (3 per axis: start, center, end) + slide boundaries + margins. On every drag frame, find closest match within 5px threshold per axis. Apply position correction. Render guide lines on overlay layer.

**Implementation: 4-5 days total:**
1. Core snapping pure functions (1-2 days)
2. Drag integration (1 day)
3. Visual guide overlay (1 day)
4. Equal spacing detection (1 day)

### Requirement 4: Editor UX (Bottom Toolbar + Floating Toolbar + Slide Creation)
**Source screenshots:** Bottom bar with Insert/Remix/Theme/Background, floating formatting toolbar, slide creation options

- **Bottom persistent toolbar**: + Insert, Remix, Theme, Background, ...
- **Floating formatting toolbar** (contextual): block type dropdown, size variant, font, color, alignment, shape options
- **Slide creation**: + Blank slide, Start with template, Generate with AI
- **"Remix"**: AI-powered layout remixing — cycles through 64+ visual arrangements while keeping content fixed
- **Chapter navigation**: sidebar with chapter list, breadcrumb showing "Chapter X of Y"

**Recommended approach:** Start with Beautiful.ai's constraint-based approach (enforced good design) + Chronicle's AI remix + Notion-style slash commands. Bottom toolbar for primary actions, floating toolbar for formatting.

### Requirement 5: Rich Content Blocks
**Source screenshots:** Display headings, body text, images, card grids, callout text

**Minimum component types needed:**

| Category | Types |
|----------|-------|
| **Text** | heading (h1/h2/h3), paragraph, quote, callout |
| **Media** | image, video, mockup |
| **Data** | chart, metric-card, comparison, timeline |
| **Layout** | card (vertical/horizontal), grid, split, stack |

---

## Architecture Summary

### Data Flow

```
Theme (CSS Variables)     Component Registry         Snapping Engine
  │                          │                           │
  ▼                          ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     SLIDE EDITOR                              │
│                                                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Theme    │  │ Component │  │ Snap     │  │ Undo/    │   │
│  │ Context  │  │ Registry  │  │ Engine   │  │ Redo     │   │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐   │
│  │              Zustand Store (DeckEditorState)           │   │
│  │  deck → chapters → slides → rootComponent → children  │   │
│  │  selection, history, theme scope                       │   │
│  └───────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌───────────────────────▼───────────────────────────────┐   │
│  │                  SLIDE CANVAS                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │ Widget   │ │ Widget   │ │ Widget   │              │   │
│  │  │ Renderer │ │ Renderer │ │ Renderer │              │   │
│  │  └──────────┘ └──────────┘ └──────────┘              │   │
│  │  ┌─────────────────────────────────────┐              │   │
│  │  │ Snap Guide Overlay (z-index: 50)    │              │   │
│  │  └─────────────────────────────────────┘              │   │
│  │  ┌─────────────────────────────────────┐              │   │
│  │  │ Selection Handles (z-index: 60)     │              │   │
│  │  └─────────────────────────────────────┘              │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ Bottom       │  │ Floating         │  │ Side Panel   │   │
│  │ Toolbar      │  │ Toolbar          │  │ (Theme/Nav)  │   │
│  └──────────────┘  └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Concern | v1 (DOM-based) | v2 (Canvas) |
|---------|----------------|-------------|
| **Rendering** | React + Tailwind + CSS Grid | Konva.js + react-konva |
| **Text editing** | contentEditable / TipTap | HTML overlay on double-click |
| **Drag/drop** | Pointer events (custom) | Konva native drag |
| **Snapping** | Pure functions + React overlay | Same functions + Konva Lines |
| **Themes** | CSS custom properties | CSS custom properties (overlay) |
| **State** | Zustand + undo/redo history | Same |
| **Rich text** | TipTap or BlockNote | TipTap overlay |
| **Export** | @react-pdf + pptxgenjs | Same |

### Key Insight: Migration-Safe Architecture

The snapping algorithm, component registry, theme system, and data model are all **rendering-agnostic**. The same pure functions, interfaces, and state management work for both DOM (v1) and Konva canvas (v2). Only the rendering layer changes.

---

## Implementation Phases

### Phase 1: Theme System (1 week)
- CSS custom property infrastructure (`data-theme`, `data-preset`)
- `DeckTheme` definitions for initial themes (Minimal Dark, Bold, Clean, Accent)
- Chapter preset system (Neutral Light / Dark / Accent)
- Theme panel UI (dropdown + presets + scope toggle)
- Migrate existing `DeckTemplate` to new `DeckTheme` format

### Phase 2: Component Registry & Data Model (1-2 weeks)
- `ComponentInstance` / `ComponentContent` superset model
- Component type registry with variant schemas
- Widget renderer dispatch system
- Core components: heading, paragraph, card, image, metric-card, grid
- Migrate existing `GeneratedSlide` to new component model

### Phase 3: Editor Chrome (1 week)
- Bottom persistent toolbar (Insert, Remix, Theme, Background)
- Floating contextual toolbar (block type, size, font, color, alignment)
- Slide navigator sidebar with chapter grouping
- Slide creation options (Blank, Template, AI Generate)

### Phase 4: Component Variants & "Turn Into" (1 week)
- Variant property system on components
- Variant dropdown UI in floating toolbar
- "Turn into" transformation menu
- Transform rules for all component type pairs
- Grid reflow on variant change

### Phase 5: Snapping & Element Manipulation (1 week)
- Snap point collection + detection algorithm
- Drag with snap correction
- Visual guide overlay (alignment lines)
- Equal spacing detection
- Resize with snapping
- Keyboard nudge (arrows + shift+arrows)

### Phase 6: AI Remix & Polish (1-2 weeks)
- AI remix endpoint (generate layout variations from current content)
- Remix UI (cycle through layout options)
- Undo/redo with immutable history
- Keyboard shortcuts (Cmd+Z, Cmd+C/V, Delete, etc.)
- Present mode (basic fullscreen with slide navigation)

**Total estimate: 6-9 weeks for Chronicle-caliber editing experience**

---

## Detailed Research Documents

Each topic has its own comprehensive research document:

1. **[snapping-alignment-system.md](./snapping-alignment-system.md)** — Algorithms, library evaluation, DOM/Konva implementations, performance, visual guide rendering
2. **[template-component-system.md](./template-component-system.md)** — Theme architecture, variant system, "Turn Into" transforms, component registry, data model, state management
3. **[editor-ux-patterns.md](./editor-ux-patterns.md)** — Chronicle/Gamma/Beautiful.ai/Pitch.com UX analysis, interaction patterns, block system, AI features, present mode
4. **[canvas-editing-technologies.md](./canvas-editing-technologies.md)** — Library comparison (Konva, Fabric.js, tldraw, Excalidraw, PixiJS, HTML/CSS)
5. **[pitch-deck-builder.md](./pitch-deck-builder.md)** — Full blueprint including multi-agent system, narrative engine, export pipeline
