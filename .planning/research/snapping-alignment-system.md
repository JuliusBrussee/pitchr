# Snapping & Alignment Guide System for Slide Editor

**Date:** 2026-03-11
**Context:** Next.js 15 / React 19 — DOM-based v1 editor with Konva.js v2 migration path
**Status:** Research complete

---

## Table of Contents

1. [How Professional Editors Implement Snapping](#1-how-professional-editors-implement-snapping)
2. [Library Evaluation](#2-library-evaluation)
3. [Core Algorithms](#3-core-algorithms)
4. [Architecture for DOM-Based Editor (v1)](#4-architecture-for-dom-based-editor-v1)
5. [Architecture for Konva Canvas Editor (v2)](#5-architecture-for-konva-canvas-editor-v2)
6. [Visual Guide Rendering](#6-visual-guide-rendering)
7. [Performance Considerations](#7-performance-considerations)
8. [Implementation Recommendations](#8-implementation-recommendations)

---

## 1. How Professional Editors Implement Snapping

### 1.1 What Triggers Snapping

All professional editors (PowerPoint, Keynote, Google Slides, Pitch.com, Chronicle AI) follow the same pattern:

- **Drag events**: Primary trigger. On every `mousemove`/`pointermove` during a drag, the system recalculates snap candidates and adjusts element position.
- **Resize events**: Edge/corner resize handles snap to alignment points of other elements.
- **Element creation**: When drawing a new shape, edges snap to guides during the draw action.
- **Arrow key nudge**: Some editors snap to grid on keyboard movement (optional).

### 1.2 Rendering Approach

| Editor | Rendering | Guide Lines | Snap Model |
|--------|-----------|-------------|------------|
| **Google Slides** | DOM-based | Colored overlay lines (red for center, blue for edges) | Edge, center, margin, spacing |
| **Pitch.com** | DOM-based | Pink/magenta guide lines | Edge, center, spacing |
| **Chronicle AI** | DOM-based (widgets) | Blue guide lines + distance labels | Edge, center, spacing, margin |
| **PowerPoint** | Native | Red dashed lines | Edge, center, grid, spacing |
| **Keynote** | Native | Yellow guide lines + distance values | Edge, center, spacing |
| **Canva** | Canvas/WebGL | Pink/magenta lines + distance labels | Edge, center, spacing, margin |
| **Figma** | WebGL/Wasm | Red lines + distance labels | Edge, center, spacing, smart distribute |

### 1.3 Guide Line Rendering Strategy

All DOM-based editors use a **separate overlay layer** for snap guides, positioned above the slide content but below drag handles:

```
z-index layers (bottom to top):
  1. Slide background
  2. Slide elements (text, images, shapes)
  3. Snap guide lines (overlay)         <-- absolute-positioned div
  4. Selection handles / resize handles
  5. Toolbar / UI chrome
```

Guide lines are rendered as absolutely-positioned `<div>` elements (1px wide/tall) or SVG `<line>` elements on this overlay. They are created/destroyed on every drag frame.

---

## 2. Library Evaluation

### 2.1 interact.js — Best for DOM-Based Snapping

**Version:** 1.10.x | **Downloads:** ~500K/week | **License:** MIT

interact.js provides the most mature snapping system for DOM elements. Three snap modifiers cover all use cases:

- **`snap()`** — Snap pointer coordinates to targets during drag
- **`snapSize()`** — Snap dimensions during resize
- **`snapEdges()`** — Snap edge positions during resize

**Key capabilities:**
- `relativePoints` — Define which element points participate in snapping (top-left, center, bottom-right, etc.)
- `interact.snappers.grid()` — Built-in grid snapping with configurable cell size, offset, range, and limits
- Dynamic targets via functions — Calculate snap targets at runtime (for snapping to other elements)
- Per-target range — Different snap distances for different target types
- Event data — `event.modifiers[0].target` provides which snap target was hit

**Limitation:** interact.js handles the snap *position calculation* but does NOT render visual guide lines. Guide line rendering must be implemented separately.

```typescript
// interact.js snap configuration for a slide element
import interact from 'interactjs';

interact('.slide-element').draggable({
  modifiers: [
    // Grid snapping (base grid)
    interact.modifiers.snap({
      targets: [
        interact.snappers.grid({ x: 10, y: 10, range: 5 }),
      ],
      relativePoints: [
        { x: 0, y: 0 },     // top-left
        { x: 0.5, y: 0.5 }, // center
        { x: 1, y: 1 },     // bottom-right
      ],
    }),
    // Element-to-element snapping (dynamic targets)
    interact.modifiers.snap({
      targets: function(x, y, interaction) {
        return getElementSnapTargets(interaction.element);
      },
      range: 8,
    }),
  ],
  listeners: {
    move(event) {
      // Apply position delta
      const target = event.target;
      const x = (parseFloat(target.dataset.x) || 0) + event.dx;
      const y = (parseFloat(target.dataset.y) || 0) + event.dy;
      target.style.transform = `translate(${x}px, ${y}px)`;
      target.dataset.x = x;
      target.dataset.y = y;

      // Render guide lines based on active snaps
      renderGuideLines(event.modifiers);
    },
    end() {
      clearGuideLines();
    },
  },
});
```

### 2.2 @dnd-kit — Limited Snapping

**Version:** 1.0.x (new rewrite) | **License:** MIT

The newer `@dnd-kit/react` (v1.0) is a full rewrite targeting React 19. It supports plugins and modifiers for constraining drag movement, but snapping is basic:

- Grid restriction via modifier (restrict movement to grid cells)
- No built-in element-to-element snapping
- No alignment guide rendering
- Would need custom plugin to implement full snapping system

**Verdict:** Good for sortable lists, but not designed for freeform canvas snapping. Would require building the entire snapping algorithm as a custom plugin. Not recommended when interact.js provides this out of the box.

### 2.3 Konva.js Built-In Snapping (for v2)

Konva's official snapping example provides a complete reference implementation. Key architecture:

- **`getLineGuideStops(skipShape)`** — Collects all snap targets: stage edges, stage center, and all edges/centers of other objects
- **`getObjectSnappingEdges(node)`** — Returns the 6 snap points of the dragged object (start/center/end on each axis) with offset corrections
- **`getGuides(stops, bounds)`** — Compares all stops against all bounds, filters by threshold, picks closest match per axis
- **`drawGuides(guides)`** — Renders blue dashed `Konva.Line` elements across the full canvas

Threshold: `GUIDELINE_OFFSET = 5` pixels.

This is the gold standard reference implementation. The algorithm translates directly to DOM-based editing.

### 2.4 Standalone / Custom Implementation

For a DOM-based editor, the recommended approach is:

1. **Use interact.js** for drag/resize handling with grid snap modifier
2. **Implement custom snapping algorithm** (based on Konva's pattern) for element-to-element alignment
3. **Render guide lines** via a React overlay component

This gives the best control, smallest bundle impact, and cleanest integration with React state.

---

## 3. Core Algorithms

### 3.1 Snap Point Collection

Every element on the slide generates snap points. For a bounding box `{ x, y, width, height }`:

```typescript
interface SnapPoint {
  position: number;    // The coordinate value to snap to
  type: 'start' | 'center' | 'end';
  elementId: string;
}

interface SnapTargets {
  vertical: SnapPoint[];   // x-axis snap lines
  horizontal: SnapPoint[]; // y-axis snap lines
}

function collectSnapTargets(
  elements: SlideElement[],
  skipId: string,
  slideWidth: number,
  slideHeight: number,
  margins: { top: number; right: number; bottom: number; left: number }
): SnapTargets {
  // 1. Slide boundary guides
  const vertical: SnapPoint[] = [
    { position: 0, type: 'start', elementId: 'slide' },
    { position: slideWidth / 2, type: 'center', elementId: 'slide' },
    { position: slideWidth, type: 'end', elementId: 'slide' },
  ];
  const horizontal: SnapPoint[] = [
    { position: 0, type: 'start', elementId: 'slide' },
    { position: slideHeight / 2, type: 'center', elementId: 'slide' },
    { position: slideHeight, type: 'end', elementId: 'slide' },
  ];

  // 2. Margin guides
  vertical.push(
    { position: margins.left, type: 'start', elementId: 'margin' },
    { position: slideWidth - margins.right, type: 'end', elementId: 'margin' },
  );
  horizontal.push(
    { position: margins.top, type: 'start', elementId: 'margin' },
    { position: slideHeight - margins.bottom, type: 'end', elementId: 'margin' },
  );

  // 3. Element edge & center guides
  for (const el of elements) {
    if (el.id === skipId) continue;
    const box = getElementBounds(el); // { x, y, width, height }

    vertical.push(
      { position: box.x, type: 'start', elementId: el.id },
      { position: box.x + box.width / 2, type: 'center', elementId: el.id },
      { position: box.x + box.width, type: 'end', elementId: el.id },
    );
    horizontal.push(
      { position: box.y, type: 'start', elementId: el.id },
      { position: box.y + box.height / 2, type: 'center', elementId: el.id },
      { position: box.y + box.height, type: 'end', elementId: el.id },
    );
  }

  return { vertical, horizontal };
}
```

### 3.2 Snap Detection (Closest Match Within Threshold)

```typescript
const SNAP_THRESHOLD = 5; // pixels — standard across PowerPoint, Keynote, Konva

interface SnapMatch {
  guidePosition: number;  // Where the guide line renders
  offset: number;         // Correction to apply to element position
  type: 'start' | 'center' | 'end';
  orientation: 'V' | 'H';
  sourceElementId: string;
}

function findSnaps(
  draggedBounds: { x: number; y: number; width: number; height: number },
  targets: SnapTargets,
  threshold: number = SNAP_THRESHOLD
): SnapMatch[] {
  const results: SnapMatch[] = [];

  // Dragged element's snap edges
  const dragV = [
    { pos: draggedBounds.x, type: 'start' as const },
    { pos: draggedBounds.x + draggedBounds.width / 2, type: 'center' as const },
    { pos: draggedBounds.x + draggedBounds.width, type: 'end' as const },
  ];
  const dragH = [
    { pos: draggedBounds.y, type: 'start' as const },
    { pos: draggedBounds.y + draggedBounds.height / 2, type: 'center' as const },
    { pos: draggedBounds.y + draggedBounds.height, type: 'end' as const },
  ];

  // Find closest vertical snap
  let bestV: (SnapMatch & { diff: number }) | null = null;
  for (const target of targets.vertical) {
    for (const edge of dragV) {
      const diff = Math.abs(target.position - edge.pos);
      if (diff < threshold && (!bestV || diff < bestV.diff)) {
        bestV = {
          guidePosition: target.position,
          offset: target.position - edge.pos,
          type: edge.type,
          orientation: 'V',
          sourceElementId: target.elementId,
          diff,
        };
      }
    }
  }

  // Find closest horizontal snap
  let bestH: (SnapMatch & { diff: number }) | null = null;
  for (const target of targets.horizontal) {
    for (const edge of dragH) {
      const diff = Math.abs(target.position - edge.pos);
      if (diff < threshold && (!bestH || diff < bestH.diff)) {
        bestH = {
          guidePosition: target.position,
          offset: target.position - edge.pos,
          type: edge.type,
          orientation: 'H',
          sourceElementId: target.elementId,
          diff,
        };
      }
    }
  }

  if (bestV) results.push(bestV);
  if (bestH) results.push(bestH);
  return results;
}
```

### 3.3 Equal Spacing Detection

This is the most sophisticated snapping feature. When three or more elements are involved, it detects when the dragged element creates equal spacing between existing elements.

```typescript
interface SpacingGuide {
  orientation: 'horizontal' | 'vertical';
  spacing: number;
  positions: number[];   // The gap positions to render markers at
  elements: string[];    // Element IDs involved
}

function findEqualSpacing(
  draggedBounds: BoundingBox,
  otherElements: SlideElement[],
  threshold: number = SNAP_THRESHOLD
): SpacingGuide[] {
  const results: SpacingGuide[] = [];

  // Sort elements by x-position for horizontal spacing
  const sortedByX = [...otherElements]
    .map(el => ({ id: el.id, ...getElementBounds(el) }))
    .sort((a, b) => a.x - b.x);

  // Check horizontal equal spacing
  // For each pair of elements, check if the dragged element
  // could sit at equal spacing from both
  for (let i = 0; i < sortedByX.length; i++) {
    const elA = sortedByX[i];

    // Case 1: Dragged element is BETWEEN elA and elB
    for (let j = i + 1; j < sortedByX.length; j++) {
      const elB = sortedByX[j];

      // Gap from elA's right edge to elB's left edge
      const totalGap = elB.x - (elA.x + elA.width);
      // Where dragged element should be for equal spacing
      const equalGapSize = (totalGap - draggedBounds.width) / 2;

      if (equalGapSize > 0) {
        const idealX = elA.x + elA.width + equalGapSize;
        const diff = Math.abs(draggedBounds.x - idealX);

        if (diff < threshold) {
          results.push({
            orientation: 'horizontal',
            spacing: equalGapSize,
            positions: [
              elA.x + elA.width,     // right edge of A
              idealX,                // left edge of dragged (snapped)
              idealX + draggedBounds.width,  // right edge of dragged
              elB.x,                 // left edge of B
            ],
            elements: [elA.id, 'dragged', elB.id],
          });
        }
      }
    }

    // Case 2: Dragged element extends the pattern (to the left or right)
    if (i > 0) {
      const elPrev = sortedByX[i - 1];
      const existingGap = elA.x - (elPrev.x + elPrev.width);

      // Check if dragged element is at same gap to the right of elA
      const idealX = elA.x + elA.width + existingGap;
      const diff = Math.abs(draggedBounds.x - idealX);

      if (diff < threshold) {
        results.push({
          orientation: 'horizontal',
          spacing: existingGap,
          positions: [
            elPrev.x + elPrev.width,
            elA.x,
            elA.x + elA.width,
            idealX,
          ],
          elements: [elPrev.id, elA.id, 'dragged'],
        });
      }
    }
  }

  // Repeat the same logic for vertical spacing (sort by y)
  // ... (mirror the above with y/height instead of x/width)

  return results;
}
```

### 3.4 Grid Snapping

Simplest algorithm. Round to nearest grid intersection:

```typescript
function snapToGrid(
  position: { x: number; y: number },
  gridSize: number = 10,
  gridOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  return {
    x: Math.round((position.x - gridOffset.x) / gridSize) * gridSize + gridOffset.x,
    y: Math.round((position.y - gridOffset.y) / gridSize) * gridSize + gridOffset.y,
  };
}
```

### 3.5 Snap Priority System

When multiple snaps are active, they must be prioritized. PowerPoint/Keynote use this order:

1. **Element edge-to-edge** (highest priority) — Most useful for visual alignment
2. **Element center-to-center** — Critical for centering elements relative to each other
3. **Margin guides** — Maintaining consistent slide margins
4. **Slide center** — Centering on the slide
5. **Equal spacing** — Distributing elements evenly
6. **Grid** (lowest priority) — Subtle baseline alignment

Only the highest-priority match per axis is applied. Equal spacing guides can render alongside edge/center guides.

---

## 4. Architecture for DOM-Based Editor (v1)

### 4.1 Component Architecture

```
<SlideEditor>
  ├── <SlideCanvas>                    // Positioned container (16:9 aspect ratio)
  │   ├── <SlideBackground />         // Background color/image
  │   ├── {elements.map(el =>
  │   │     <DraggableElement />       // Each slide element with drag/resize
  │   │   )}
  │   ├── <SnapGuideOverlay />         // Renders active guide lines (z-index: 50)
  │   └── <SelectionHandles />         // Resize/rotate handles (z-index: 60)
  └── <EditorToolbar />
```

### 4.2 Snapping Hook

Encapsulate all snapping logic in a single hook:

```typescript
// hooks/useSnapping.ts
interface UseSnappingOptions {
  elements: SlideElement[];          // All elements on current slide
  slideWidth: number;
  slideHeight: number;
  margins?: { top: number; right: number; bottom: number; left: number };
  gridSize?: number;                 // 0 = no grid snapping
  threshold?: number;               // Default 5px
  enabled?: boolean;
}

interface SnapResult {
  position: { x: number; y: number };  // Corrected position
  guides: GuideLineData[];              // Active guide lines to render
  spacingGuides: SpacingGuide[];        // Active spacing guides
}

function useSnapping(options: UseSnappingOptions) {
  const targetsRef = useRef<SnapTargets | null>(null);

  // Recalculate snap targets when elements change (but NOT on every drag frame)
  const updateTargets = useCallback((skipId: string) => {
    targetsRef.current = collectSnapTargets(
      options.elements,
      skipId,
      options.slideWidth,
      options.slideHeight,
      options.margins ?? { top: 40, right: 40, bottom: 40, left: 40 }
    );
  }, [options.elements, options.slideWidth, options.slideHeight, options.margins]);

  // Called on every drag frame — must be fast
  const snap = useCallback((
    elementId: string,
    proposedBounds: BoundingBox
  ): SnapResult => {
    if (!options.enabled || !targetsRef.current) {
      return { position: { x: proposedBounds.x, y: proposedBounds.y }, guides: [], spacingGuides: [] };
    }

    const matches = findSnaps(proposedBounds, targetsRef.current, options.threshold);
    const spacingGuides = findEqualSpacing(proposedBounds, options.elements.filter(e => e.id !== elementId));

    let correctedX = proposedBounds.x;
    let correctedY = proposedBounds.y;

    for (const match of matches) {
      if (match.orientation === 'V') correctedX += match.offset;
      if (match.orientation === 'H') correctedY += match.offset;
    }

    // Apply grid snapping only if no element snaps are active
    if (matches.length === 0 && options.gridSize) {
      const gridSnapped = snapToGrid({ x: correctedX, y: correctedY }, options.gridSize);
      correctedX = gridSnapped.x;
      correctedY = gridSnapped.y;
    }

    // Apply spacing correction
    if (spacingGuides.length > 0) {
      // Spacing takes precedence over grid but not over edge/center snaps
      // ... apply spacing offset
    }

    return {
      position: { x: correctedX, y: correctedY },
      guides: matches.map(m => ({
        position: m.guidePosition,
        orientation: m.orientation,
        type: m.type,
      })),
      spacingGuides,
    };
  }, [options.enabled, options.threshold, options.gridSize, options.elements]);

  return { snap, updateTargets };
}
```

### 4.3 DraggableElement with Snapping

```typescript
// components/DraggableElement.tsx
'use client';

import { useRef, useCallback } from 'react';

interface DraggableElementProps {
  element: SlideElement;
  onPositionChange: (id: string, x: number, y: number) => void;
  snap: (id: string, bounds: BoundingBox) => SnapResult;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function DraggableElement({ element, onPositionChange, snap, onDragStart, onDragEnd }: DraggableElementProps) {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { x: element.x, y: element.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onDragStart(element.id);
  }, [element.id, element.x, element.y, onDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const proposedX = elementStart.current.x + dx;
    const proposedY = elementStart.current.y + dy;

    const result = snap(element.id, {
      x: proposedX,
      y: proposedY,
      width: element.width,
      height: element.height,
    });

    onPositionChange(element.id, result.position.x, result.position.y);
    // Guide lines are rendered by SnapGuideOverlay via shared state
  }, [element.id, element.width, element.height, snap, onPositionChange]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    onDragEnd();
  }, [onDragEnd]);

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${element.x}px, ${element.y}px)`,
        width: element.width,
        height: element.height,
        cursor: 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Element content */}
    </div>
  );
}
```

### 4.4 Using interact.js for Drag Handling (Alternative)

interact.js can replace the manual pointer event handling above, providing built-in inertia, auto-scroll, and basic grid snapping. Element-to-element snapping would still use the custom `useSnapping` hook:

```typescript
import interact from 'interactjs';
import { useEffect, useRef } from 'react';

function useInteractDraggable(
  elementRef: RefObject<HTMLElement>,
  elementId: string,
  snapFn: (id: string, bounds: BoundingBox) => SnapResult,
  onUpdate: (id: string, x: number, y: number) => void,
  gridSize: number = 0
) {
  useEffect(() => {
    if (!elementRef.current) return;

    const modifiers = [];
    if (gridSize > 0) {
      modifiers.push(
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: gridSize, y: gridSize, range: 4 })],
          relativePoints: [{ x: 0, y: 0 }],
        })
      );
    }

    const interactable = interact(elementRef.current).draggable({
      modifiers,
      listeners: {
        start() { /* record initial position */ },
        move(event) {
          const rect = elementRef.current!.getBoundingClientRect();
          const result = snapFn(elementId, {
            x: parseFloat(elementRef.current!.dataset.x || '0') + event.dx,
            y: parseFloat(elementRef.current!.dataset.y || '0') + event.dy,
            width: rect.width,
            height: rect.height,
          });
          onUpdate(elementId, result.position.x, result.position.y);
        },
        end() { /* clear guides */ },
      },
    });

    return () => interactable.unset();
  }, [elementRef, elementId, snapFn, onUpdate, gridSize]);
}
```

---

## 5. Architecture for Konva Canvas Editor (v2)

Konva's official Objects Snapping example provides a production-ready foundation. The key functions:

### 5.1 Konva Snapping Implementation (Reference)

Konva's approach uses four functions that run on every `dragmove` event on the layer:

1. **`getLineGuideStops(skipShape)`** — Collects all possible snap coordinates from stage boundaries and all other shapes. Returns `{ vertical: number[], horizontal: number[] }`.

2. **`getObjectSnappingEdges(node)`** — For the dragged shape, returns 6 snap points (3 vertical, 3 horizontal) using `getClientRect()` for the bounding box and `absolutePosition()` for the position offset correction.

3. **`getGuides(lineGuideStops, itemBounds)`** — Cross-compares all stops against all edges. Filters by `GUIDELINE_OFFSET = 5` pixels. Sorts by distance, picks the closest match per axis.

4. **`drawGuides(guides)`** — Creates `Konva.Line` elements with `stroke: 'rgb(0, 161, 255)'`, `dash: [4, 6]`, spanning the full canvas (`-6000` to `6000` points). Destroys previous guides first.

Position correction happens after guide detection:

```javascript
// From Konva's official example
layer.on('dragmove', function (e) {
  // 1. Clear previous guides
  layer.find('.guid-line').forEach((l) => l.destroy());

  // 2. Collect snap targets (all shapes except dragged)
  var lineGuideStops = getLineGuideStops(e.target);

  // 3. Get dragged shape's snap edges
  var itemBounds = getObjectSnappingEdges(e.target);

  // 4. Find matching guides within threshold
  var guides = getGuides(lineGuideStops, itemBounds);
  if (!guides.length) return;

  // 5. Render guide lines
  drawGuides(guides);

  // 6. Correct position to snap
  var absPos = e.target.absolutePosition();
  guides.forEach((lg) => {
    if (lg.orientation === 'V') absPos.x = lg.lineGuide + lg.offset;
    if (lg.orientation === 'H') absPos.y = lg.lineGuide + lg.offset;
  });
  e.target.absolutePosition(absPos);
});
```

### 5.2 React-Konva Adaptation

For react-konva, the algorithm moves into React state management:

```typescript
// hooks/useKonvaSnapping.ts
function useKonvaSnapping(stageRef: RefObject<Konva.Stage>) {
  const [guides, setGuides] = useState<GuideLineData[]>([]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const shape = e.target;
    const stage = stageRef.current;
    if (!stage) return;

    const stops = getLineGuideStops(stage, shape);
    const edges = getObjectSnappingEdges(shape);
    const matchedGuides = getGuides(stops, edges);

    setGuides(matchedGuides);

    // Apply position correction
    const absPos = shape.absolutePosition();
    matchedGuides.forEach((g) => {
      if (g.orientation === 'V') absPos.x = g.lineGuide + g.offset;
      if (g.orientation === 'H') absPos.y = g.lineGuide + g.offset;
    });
    shape.absolutePosition(absPos);
  }, [stageRef]);

  const handleDragEnd = useCallback(() => {
    setGuides([]);
  }, []);

  return { guides, handleDragMove, handleDragEnd };
}

// In the component:
// <Layer onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
//   {elements}
//   {guides.map(g => <Line key={...} points={...} stroke="rgb(0,161,255)" dash={[4,6]} />)}
// </Layer>
```

### 5.3 Migration Path: DOM (v1) to Konva (v2)

The snapping algorithm is **identical** between DOM and Konva — only the I/O layer changes:

| Concern | DOM (v1) | Konva (v2) |
|---------|----------|------------|
| Get element bounds | `getBoundingClientRect()` | `getClientRect()` |
| Get element position | `dataset.x/y` or transform parse | `absolutePosition()` |
| Set element position | `style.transform` | `absolutePosition()` |
| Render guide lines | Absolute `<div>` overlay | `<Line>` Konva shapes |
| Drag events | `pointermove` / interact.js | Konva `dragmove` |
| Threshold calculation | Same algorithm | Same algorithm |

**Shared module:** The core snapping functions (`collectSnapTargets`, `findSnaps`, `findEqualSpacing`, `snapToGrid`) should be pure functions that take bounding boxes and return snap results. The same module works for both DOM and Konva.

```
lib/snapping/
  ├── types.ts              // SnapPoint, SnapMatch, SnapResult, etc.
  ├── collectTargets.ts     // collectSnapTargets()
  ├── findSnaps.ts          // findSnaps(), findEqualSpacing()
  ├── gridSnap.ts           // snapToGrid()
  ├── index.ts              // Re-exports
  └── __tests__/
      └── snapping.test.ts  // Pure function tests (no DOM/Canvas needed)
```

---

## 6. Visual Guide Rendering

### 6.1 Guide Line Styles (Matching PowerPoint/Chronicle)

```css
/* Alignment guides */
.snap-guide {
  position: absolute;
  pointer-events: none;
  z-index: 50;
}

.snap-guide--vertical {
  width: 1px;
  height: 100%;
  top: 0;
  background: rgb(0, 161, 255); /* Konva blue — also used by Chronicle */
}

.snap-guide--horizontal {
  height: 1px;
  width: 100%;
  left: 0;
  background: rgb(0, 161, 255);
}

/* Center alignment — can use different color like Google Slides */
.snap-guide--center {
  background: rgb(255, 0, 85); /* Red for center guides */
}

/* Margin guides — dashed */
.snap-guide--margin {
  background: repeating-linear-gradient(
    to right,
    rgb(0, 161, 255) 0px,
    rgb(0, 161, 255) 4px,
    transparent 4px,
    transparent 10px
  );
}
```

### 6.2 SnapGuideOverlay React Component

```typescript
// components/SnapGuideOverlay.tsx
'use client';

interface SnapGuideOverlayProps {
  guides: GuideLineData[];
  spacingGuides: SpacingGuide[];
  slideWidth: number;
  slideHeight: number;
}

export function SnapGuideOverlay({ guides, spacingGuides, slideWidth, slideHeight }: SnapGuideOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Alignment guide lines */}
      {guides.map((guide, i) => (
        <div
          key={`guide-${i}`}
          className={`snap-guide snap-guide--${guide.orientation === 'V' ? 'vertical' : 'horizontal'}`}
          style={guide.orientation === 'V'
            ? { left: guide.position }
            : { top: guide.position }
          }
        />
      ))}

      {/* Spacing indicators */}
      {spacingGuides.map((sg, i) => (
        <SpacingIndicator key={`spacing-${i}`} guide={sg} />
      ))}
    </div>
  );
}

function SpacingIndicator({ guide }: { guide: SpacingGuide }) {
  // Render double-arrow markers between elements showing equal spacing
  // Uses small SVG arrows + distance label
  return (
    <div className="spacing-indicator" style={{ /* positioned between gaps */ }}>
      <svg /* double-headed arrow */ />
      <span className="spacing-label">{Math.round(guide.spacing)}px</span>
    </div>
  );
}
```

### 6.3 Spacing Guide Rendering Detail

PowerPoint and Keynote show equal spacing with paired arrows and pink/blue distance labels. The visual pattern:

```
  ┌──────┐    ←─ 40px ─→    ┌──────┐    ←─ 40px ─→    ┌──────┐
  │  A   │                   │  B   │                   │  C   │
  └──────┘                   └──────┘                   └──────┘
```

Each spacing indicator is a horizontal or vertical bar with arrows at both ends, positioned in the gap between elements. The distance value is centered on the bar.

---

## 7. Performance Considerations

### 7.1 The Problem

On every `pointermove` during drag (60 fps = 16ms budget per frame), the system must:
1. Calculate the dragged element's new proposed bounds
2. Compare against all snap targets (N elements x 3 edges x 2 axes = 6N comparisons)
3. Check equal spacing (O(N^2) pair comparisons)
4. Apply corrections
5. Re-render guide lines

### 7.2 Performance Strategies

**For slides with < 50 elements (typical):** No optimization needed. 50 elements = 300 comparisons per axis, trivially fast (< 0.1ms).

**For slides with 50-200 elements:**

1. **Pre-compute snap targets on drag start** (not on every move). Targets only change when OTHER elements move, which doesn't happen during a single drag operation.

2. **Sort targets once**, then use binary search to find candidates within threshold:

```typescript
function findNearestSorted(sortedPositions: number[], target: number, threshold: number): number | null {
  let lo = 0;
  let hi = sortedPositions.length - 1;
  let best: number | null = null;
  let bestDiff = threshold;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const diff = Math.abs(sortedPositions[mid] - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = sortedPositions[mid];
    }
    if (sortedPositions[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return best;
}
```

3. **Throttle spacing calculation** to every 3rd frame (spacing changes are less sensitive to latency than edge/center snapping).

4. **Use `requestAnimationFrame` batching** — Don't process every `pointermove`. Buffer the latest event and process once per frame:

```typescript
const pendingMove = useRef<PointerEvent | null>(null);
const rafId = useRef<number>(0);

const handlePointerMove = useCallback((e: React.PointerEvent) => {
  pendingMove.current = e.nativeEvent;
  if (!rafId.current) {
    rafId.current = requestAnimationFrame(() => {
      if (pendingMove.current) {
        processSnapping(pendingMove.current);
        pendingMove.current = null;
      }
      rafId.current = 0;
    });
  }
}, []);
```

5. **Minimize DOM updates** for guide lines — reuse existing DOM elements instead of creating/destroying. Use a fixed pool of guide line divs and toggle visibility:

```typescript
// Pre-create guide line elements, toggle display
const MAX_GUIDES = 6; // Rarely need more than 3 vertical + 3 horizontal
const guidePool = useRef<HTMLDivElement[]>([]);
```

### 7.3 Benchmark Targets

| Slide Complexity | Elements | Snap Calculation | Target |
|-----------------|----------|-----------------|--------|
| Simple | 5-15 | < 0.05ms | Easily within 16ms frame |
| Moderate | 15-40 | < 0.1ms | Comfortable |
| Complex | 40-100 | < 0.5ms | Fine |
| Heavy (edge case) | 100-200 | < 2ms | Needs binary search optimization |

For a pitch deck editor, slides almost never exceed 20-30 elements. Performance will not be an issue with the naive O(N) algorithm.

---

## 8. Implementation Recommendations

### 8.1 v1 (DOM-Based) Implementation Plan

**Phase 1: Core snapping (1-2 days)**
- Implement `lib/snapping/` pure functions: `collectTargets`, `findSnaps`, `snapToGrid`
- Write unit tests for all snapping algorithms
- Create `useSnapping` hook

**Phase 2: Drag integration (1 day)**
- Integrate snapping with drag handler (pointer events or interact.js)
- Apply position corrections during drag

**Phase 3: Visual guides (1 day)**
- Build `SnapGuideOverlay` component
- Style guide lines (blue for edges, red for centers)
- Add/remove guides reactively during drag

**Phase 4: Equal spacing (1 day)**
- Implement `findEqualSpacing` algorithm
- Build spacing indicator UI (arrows + distance labels)
- Integrate with drag flow

**Phase 5: Resize snapping (0.5 days)**
- Apply snapping during element resize (edge snapping only)
- Guide lines appear during resize too

**Total estimate: 4-5 days**

### 8.2 Library Recommendation

**For v1 (DOM-based):**
- **Custom pointer events** (not interact.js) for drag handling — simpler, no dependency, full control
- **Custom snapping algorithm** based on Konva's pattern — pure functions, testable
- **React overlay component** for guide lines — standard React, no extra libraries

Rationale: interact.js adds ~30KB for features we mostly don't need (inertia, auto-scroll, multi-touch gestures). The drag handling code is ~50 lines. The snapping algorithm is ~100 lines. Both are straightforward to implement and test without a library.

**For v2 (Konva-based):**
- Use Konva's native drag events + the same pure snapping functions
- Render guides as `<Line>` Konva shapes instead of DOM elements
- Zero migration cost for the snapping logic itself

### 8.3 Configuration Defaults

Based on analysis of PowerPoint, Keynote, and Chronicle AI:

```typescript
const SNAPPING_DEFAULTS = {
  // Snap threshold in pixels — how close before snap activates
  threshold: 5,

  // Grid
  gridSize: 10,         // 10px grid (PowerPoint default)
  gridEnabled: false,    // Off by default, toggle in toolbar

  // Margins (percentage of slide dimensions, converted to px)
  marginPercent: 5,      // 5% margin = ~48px on 960px wide slide

  // What to snap to
  snapToElements: true,  // Edge and center alignment
  snapToGrid: false,     // Grid snapping (togglable)
  snapToMargins: true,   // Slide margin guides
  snapToSlideCenter: true, // Slide center lines
  snapToSpacing: true,   // Equal spacing detection

  // Guide line colors
  guideColor: 'rgb(0, 161, 255)',     // Blue (edges)
  centerGuideColor: 'rgb(255, 0, 85)', // Red (centers)
  spacingGuideColor: 'rgb(255, 0, 85)', // Red (spacing)
  marginGuideColor: 'rgb(0, 161, 255)', // Blue dashed (margins)

  // Guide line rendering
  guideDash: [4, 6],     // Dash pattern for margin guides
};
```

### 8.4 User Controls

PowerPoint and Keynote expose snapping toggles. Recommended UI:

- **View menu or toolbar toggle:** "Snap to Grid" (on/off)
- **View menu or toolbar toggle:** "Snap to Guides" (on/off) — covers element + margin snapping
- **Hold Alt/Option during drag:** Temporarily disable all snapping
- **Shift+drag:** Constrain to horizontal or vertical movement only
- **Grid size selector:** 5px / 10px / 20px / 40px (in settings)

### 8.5 Edge Cases to Handle

1. **Rotated elements** — Use `getClientRect()` which returns the axis-aligned bounding box of rotated shapes. Snap to the AABB, not the original dimensions.

2. **Grouped elements** — Treat the group's bounding box as a single snap target. Individual elements within a group should NOT generate snap points.

3. **Zoom level** — Snap threshold must be in *slide coordinates*, not screen coordinates. When zoomed to 200%, a 5px threshold in slide space = 10px on screen. Always calculate in slide space.

4. **Elements outside slide bounds** — Elements dragged partially off-slide should still snap to slide edges.

5. **Many elements at same position** — Deduplicate snap targets at the same coordinate to avoid rendering multiple overlapping guide lines.

6. **Snap during paste** — When pasting an element, snap it to the nearest alignment point relative to existing content (or offset from the original position if same-slide paste).

---

## Sources

- [Konva.js Objects Snapping (official example)](https://konvajs.org/docs/sandbox/Objects_Snapping.html) — Full source code for the reference snapping implementation
- [interact.js Snapping API](https://interactjs.io/docs/snapping) — `snap()`, `snapSize()`, `snapEdges()` modifiers with grid and element targets
- [dnd-kit documentation](https://dndkit.com) — Modifier system for drag constraints (limited snapping)
- [Canvas editing technologies research](../research/canvas-editing-technologies.md) — Library comparison for Pitchr
- [Pitch deck builder research](../research/pitch-deck-builder.md) — Chronicle AI competitive analysis

