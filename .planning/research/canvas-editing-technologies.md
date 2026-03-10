# Canvas Editing Technologies for Pitch Deck Editor

**Date:** 2026-03-10
**Context:** Next.js 15 / React 19 stack — evaluating canvas libraries for v2/v3 freeform slide editing
**Status:** Research complete

---

## Table of Contents

1. [Library Analysis](#1-library-analysis)
2. [Commercial Editor Approaches](#2-commercial-editor-approaches)
3. [Cross-Cutting Concerns](#3-cross-cutting-concerns)
4. [Comparison Matrix](#4-comparison-matrix)
5. [Recommendations](#5-recommendations)

---

## 1. Library Analysis

### 1.1 Konva.js + react-konva (Recommended)

**Version:** Konva 9.3.22, react-konva 19.2.0
**Stars:** ~13K | **Downloads:** ~674K/week | **License:** MIT

**React 19 compatibility:** Excellent. react-konva v19.x is purpose-built for React 19, with fixes for ref attributes and strict mode. Version numbering aligns with React versions.

**Key features:**
- Declarative React components: `<Stage>`, `<Layer>`, `<Rect>`, `<Text>`, `<Image>`, `<Group>`, `<Transformer>`
- Built-in `Transformer` component for resize/rotate handles
- Native drag-and-drop with `draggable` prop and drag events
- Layered rendering (multiple `<Layer>` elements for performance)
- Shape caching for performance optimization
- Client-side only (renders empty div on server)

**Text editing:** Canvas API does not support inline text editing. Konva's documented pattern is to overlay an HTML `<textarea>` on double-click, sync changes back on blur. Functional but requires careful positioning.

**Undo/redo:** Not built-in, but well-documented React pattern: maintain a history array of immutable state snapshots with a historyStep pointer. Integrates naturally with React state management.

**Mobile/touch:** Native touch event support. Better mobile story than Fabric.js.

**Bundle size:** ~70-80 KB gzipped. Supports tree-shaking via `react-konva/lib/ReactKonvaCore` for minimal builds.

**Notable:** [Polotno](https://polotno.com/) is a full design editor SDK built on Konva + React, proving the architecture works for production slide/design editors.

---

### 1.2 Fabric.js

**Version:** 7.2.0 (Feb 2026)
**Stars:** ~30K | **Downloads:** ~348K/week | **License:** MIT

**React integration:** No official React wrapper. Uses uncontrolled component pattern via `useRef` + `useEffect` to create a `fabric.Canvas` on a `<canvas>` element. Works with React 19 since it manipulates the DOM directly via refs.

**Key features:**
- Interactive object model (select, move, scale, rotate, group)
- On-canvas text editing with IME support and curved text
- SVG-to-canvas and canvas-to-SVG parsing
- WebGL-accelerated image filters
- Clipping regions, custom controls API
- Full TypeScript support (v6+), ES modules (v7)

**Weaknesses:**
- **No built-in undo/redo** — must implement via JSON state snapshots
- **Poor mobile text editing** — tapping barely registers, browser zoom issues on Android
- **No built-in rich text** — character-level bold/italic on IText but no paragraph-level
- Text editing in groups not supported
- Larger bundle (~100-120 KB gzipped)
- Not React-native; requires manual lifecycle management

---

### 1.3 tldraw

**Version:** SDK 4.4.1
**Stars:** ~45K | **Downloads:** ~72K/week
**License:** tldraw License (NOT MIT). Production use requires commercial license or "Made with tldraw" watermark.

**Architecture:** Full infinite canvas SDK for React. DOM-based rendering (not HTML5 Canvas), supports anything the browser supports.

**Key features:**
- Complete drawing/diagramming toolset out of the box
- Deep extensibility: custom shapes, tools, bindings, UI components
- Built-in multiplayer collaboration (self-hostable)
- Full undo/redo built-in

**Weaknesses for slide editing:**
- **Very large bundle** (~400-500+ KB gzipped)
- **Commercial license required** for production without watermark
- **Opinionated hand-drawn aesthetic** — wrong for professional pitch decks
- Designed for whiteboarding, not structured slide layouts
- Would need to constrain canvas to fixed-dimension "frames" and build slide navigation

---

### 1.4 Excalidraw

**Version:** 0.18.0
**Stars:** ~90K+ | **License:** MIT (npm package)

**React 19:** v0.18.0 ships with React 19 support. Some CSS issues reported with Next.js 15.

**Weaknesses for slide editing:**
- **Hand-drawn aesthetic** fundamentally wrong for professional pitch decks
- No concept of "slides" or fixed-dimension pages
- Large bundle (~200-300+ KB gzipped)

---

### 1.5 PixiJS + @pixi/react

**Version:** PixiJS v8, @pixi/react v8 | **License:** MIT

**React 19:** Designed exclusively for React 19.

**Key issue:** PixiJS is a rendering engine, not an editor. No selection, transformation, drag-drop, or editing logic. Enormous engineering effort to build editor primitives. Better suited for games/visualizations.

**Not recommended** for a slide editor.

---

### 1.6 HTML/CSS-based Approach (contentEditable + CSS transforms)

Each slide element is a DOM node positioned with CSS `transform`. Text editing uses native `contentEditable` or rich text editor (Slate.js, TipTap).

**Drag-and-drop options:**
- **dnd-kit**: `@dnd-kit/react` v0.3.x targets React 19 but is pre-1.0
- **hello-pangea/dnd** (fork of react-beautiful-dnd): Full React 19 compatibility
- **Pragmatic Drag and Drop** (Atlassian): Framework-agnostic, headless

**Pros:**
- Native rich text editing (real text selection, fonts, IME, accessibility)
- Best mobile text editing
- CSS transforms are GPU-accelerated
- Easy PDF export via html2canvas + jsPDF
- Familiar React patterns, smallest bundle

**Cons:**
- Must build all manipulation UI (resize handles, rotation, snapping)
- contentEditable is inconsistent across browsers
- Performance degrades with many DOM nodes (100+ elements per slide)

---

### 1.7 Slidev / reveal.js

Not suitable as editor foundations. Slidev is Vue-based. reveal.js is a presentation framework, not an editor. Neither provides visual drag-and-drop editing.

---

## 2. Commercial Editor Approaches

| Product | Rendering Tech | Notes |
|---|---|---|
| **Canva** | Hybrid Canvas 2D + WebGL | WebGL for image filters. ~230M monthly users. |
| **Google Slides** | DOM-based (HTML/CSS) | Traditional DOM rendering. |
| **Pitch.com** | DOM-based | Cloud-first, real-time collaboration. |
| **Beautiful.ai** | DOM-based with smart layouts | Auto-adjusts layouts as content changes. |
| **Gamma.app** | DOM-based (card/block) | AI-powered, card-based, more document than canvas. |
| **Figma** | WebGL + WebAssembly (C++) | Custom rendering engine, years of engineering. |

**Key insight:** Most slide-focused tools (Google Slides, Pitch, Beautiful.ai, Gamma) use **DOM-based rendering**. Canvas/WebGL is used by design tools (Canva, Figma) where pixel-level control is essential.

---

## 3. Cross-Cutting Concerns

### PDF Export

| Approach | Rendering | Text Quality | Effort |
|---|---|---|---|
| html2canvas + jsPDF | Rasterize slides as images | Non-selectable text | Low |
| @react-pdf/renderer | Vector PDF from React components | Selectable text, but must duplicate layout | Medium |
| Server-side (Puppeteer) | Headless browser print to PDF | Best quality, full CSS support | High (needs server) |
| Canvas toDataURL + jsPDF | Canvas screenshot per slide | Non-selectable text | Low |

### Real-Time Collaboration

- **Yjs** (CRDT): ~900K weekly downloads. Network-agnostic, offline editing, version snapshots, undo/redo, shared cursors.
- **CollabCanvas**: Production example combining Yjs + Konva + Cloudflare Workers with sub-100ms latency.
- **tldraw**: Built-in collaboration sync.

### Undo/Redo

- **tldraw, Excalidraw**: Built-in
- **Konva**: Well-documented React pattern with immutable state history
- **Fabric.js**: Manual via JSON serialization (heavier)

---

## 4. Comparison Matrix

| Criteria | Konva + react-konva | Fabric.js | tldraw | Excalidraw | PixiJS | HTML/CSS + DnD |
|---|---|---|---|---|---|---|
| **React 19** | Excellent (v19.x) | Good (via refs) | Good | Good (v0.18) | Excellent (v8) | Excellent |
| **Next.js 15** | Good (client-only) | Good (client-only) | Good | CSS issues | Good (client-only) | Excellent |
| **Bundle size** | ~70-80 KB | ~100-120 KB | ~400-500+ KB | ~200-300+ KB | ~100-150 KB | Minimal |
| **Text editing** | Overlay textarea | On-canvas (poor mobile) | Built-in | Built-in | Basic bitmap | Native (best) |
| **Rich text** | Via HTML overlay | Limited | Limited | Limited | None | Full (Slate/TipTap) |
| **Object manipulation** | Excellent (Transformer) | Excellent | Good | Good | Manual | Manual |
| **Drag-and-drop** | Built-in | Built-in | Built-in | Built-in | Manual | Via library |
| **Undo/redo** | Pattern documented | Manual (JSON) | Built-in | Built-in | Manual | Manual |
| **Mobile/touch** | Good | Poor (text) | Good | Good | Good | Best |
| **Collaboration** | Yjs proven | Yjs possible | Built-in | Built-in | Manual | Yjs possible |
| **Slide editor fit** | High | High | Low | Low | Low | Medium-high |

---

## 5. Recommendations

### For Pitchr v1: HTML/CSS + DnD (Already Decided)

The main research document correctly identifies HTML/CSS as the right v1 choice:
- Fastest to build
- Native text editing
- Accessible by default
- Matches how most slide tools (Google Slides, Pitch, Beautiful.ai) work

### For Pitchr v2/v3 Canvas Editing: Konva.js + react-konva

When freeform canvas editing is needed:

1. **Best React integration** — declarative components that feel natural in React
2. **Built-in Transformer** — resize/rotate handles with no additional code
3. **Proven architecture** — Polotno (commercial Canva-like editor) validates this stack
4. **Smallest canvas bundle** (~70-80 KB gzipped) with tree-shaking
5. **Collaboration proven** — CollabCanvas demonstrates Yjs + Konva working together
6. **Good mobile/touch** support

**Recommended hybrid architecture:**

```
Layer 1: Konva canvas (shapes, images, backgrounds, layout)
Layer 2: HTML overlays (text editing via TipTap/Slate on double-click)
Layer 3: React UI (toolbar, sidebar, slide navigator)
State:   Zustand or Jotai for slide data + undo/redo history
Export:  stage.toDataURL() per slide → jsPDF for PDF assembly
Collab:  Yjs when needed (proven with Konva)
```

### What to Avoid

- **tldraw**: Commercial license, massive bundle, whiteboard aesthetic
- **Excalidraw**: Hand-drawn style wrong for professional pitch decks
- **PixiJS**: Renderer only, enormous effort to build editor primitives
- **Fabric.js**: Poor mobile text editing, no React integration, larger bundle vs Konva

### Commercial SDK Option

If budget allows, **Polotno SDK** ($199-399/month) built on Konva + React provides a complete design editor. Fastest path to production freeform editing.

---

## Sources

- [react-konva on npm](https://www.npmjs.com/package/react-konva)
- [Konva.js Canvas Editor Docs](https://konvajs.org/docs/sandbox/Canvas_Editor.html)
- [Konva.js Undo-Redo Docs](https://konvajs.org/docs/react/Undo-Redo.html)
- [Fabric.js GitHub](https://github.com/fabricjs/fabric.js/releases)
- [tldraw SDK & licensing](https://tldraw.dev/get-a-license/plans)
- [Excalidraw v0.18.0](https://github.com/excalidraw/excalidraw/releases/tag/v0.18.0)
- [@pixi/react v8](https://pixijs.com/blog/pixi-react-v8-live)
- [CollabCanvas (Yjs + Konva)](https://github.com/adam0white/CollabCanvas)
- [Polotno SDK](https://polotno.com/)
- [Fabric.js vs Konva comparison](https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan)
