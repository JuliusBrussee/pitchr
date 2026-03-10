# Template & Component Variant System — Deep Research

**Date:** 2026-03-11
**Scope:** Architecture for a Chronicle AI-caliber theme system, component variant system, and "turn into" block transformations for Pitchr's web-based slide editor
**Status:** Research complete
**Depends on:** [pitch-deck-builder.md](./pitch-deck-builder.md), [canvas-editing-technologies.md](./canvas-editing-technologies.md)

---

## Table of Contents

1. [Reference Implementation Analysis](#1-reference-implementation-analysis)
2. [Theme Architecture](#2-theme-architecture)
3. [Component Variant System](#3-component-variant-system)
4. [Block Transformation System ("Turn Into")](#4-block-transformation-system-turn-into)
5. [Component Registry & Renderer Architecture](#5-component-registry--renderer-architecture)
6. [Data Model & TypeScript Interfaces](#6-data-model--typescript-interfaces)
7. [Design System for Slide Components](#7-design-system-for-slide-components)
8. [State Management](#8-state-management)
9. [Implementation Recommendations](#9-implementation-recommendations)

---

## 1. Reference Implementation Analysis

### 1.1 Chronicle AI — Widget-Based Design System

Chronicle uses **150+ pre-built widgets** with pixel-perfect layouts. Key architectural observations from the product:

**Theme System:**
- Themes have **chapter presets**: Neutral Light, Neutral Dark, Accent — each shown with a color dot indicator
- A theme dropdown (e.g., "Retro tech", "Chronicle") instantly recolors the entire slide
- **Scope toggle**: "This chapter" vs "Whole document" — meaning themes are applied at two levels
- Theme changes are instant and preserve all content (strong indicator of CSS custom properties)
- Background customization is per-slide, independent of theme

**Component Variant System:**
- Dropdown on a widget (e.g., "Vertical card") that can switch to "Horizontal card"
- A "Size" dropdown (e.g., "Large") controls the visual weight
- Cards with title + bullet text reflow based on variant selection
- 3x2 grids of cards where each card is independently styled

**"Turn into" / Remix System:**
- A "Turn into" menu offers: Paragraph, Heading, Image, Video, Card, Chart (Beta), Embed/link, Mockup, Sticky note
- The "Remix" button in the bottom toolbar offers **64 remix options** — variant combinations of the current widget
- Patent-pending widget intelligence enables **1-click conversion between data formats** (e.g., timeline to Gantt chart)

**Architectural inference:** Chronicle likely uses a widget definition layer where each widget type declares its accepted data schema, its available variants, and its rendering logic. The theme is a separate concern injected via CSS custom properties or a runtime style context. The "Turn into" system maps content fields between widget schemas, preserving what it can and dropping what it cannot.

### 1.2 Notion — Block-Based "Turn Into" Architecture

Notion's official engineering blog describes their "everything is a block" data model:

- **Uniform block schema**: All blocks share the same base data model and schema on the backend. The `type` field determines how a block is rendered, but properties are stored in a superset structure.
- **Type switching preserves data**: Changing a block's type changes only the `type` attribute. Content and properties persist — unused properties (like `checked` on a heading) are simply ignored but retained. When you turn a heading back into a to-do, the `checked` state is still there.
- **Blocks are better units for sync**: Using blocks instead of full documents for synchronization reduces network traffic and merge conflicts in real-time collaboration.
- **Nested blocks via content arrays**: A block's `content` attribute stores an array of child block IDs, enabling infinite nesting (text inside toggles, pages inside pages).

**Key takeaway for Pitchr:** The superset property model is the critical insight. Rather than having separate schemas per block type, store a union of all possible properties. Each renderer reads only the properties it cares about. This makes type switching a single field change with zero data migration.

### 1.3 Figma — Component Variants & Instance Swap

Figma's variant system operates on several principles:

- **Component sets**: Similar components are grouped into a single container. Variants differ by named properties (e.g., `size=small|medium|large`, `state=default|hover|active`).
- **Override preservation**: When swapping between variants or instances, Figma preserves any overrides the user made. Only the "structure" changes; content customizations survive.
- **Instance swap property**: A specific property type that lets nested components be swapped out (e.g., swapping an icon inside a button). This is compositional variant selection.
- **Property inheritance**: The primary variant acts as the base. All other variants inherit its properties. Only explicitly overridden properties differ.

**Key takeaway for Pitchr:** The variant-as-property-combination model is powerful. Instead of having `VerticalCard` and `HorizontalCard` as separate component types, have a single `Card` component with a `direction` variant property. This reduces the number of component types while increasing configurability.

### 1.4 Framer — Component Overrides & Property Controls

Framer's approach adds a code-level dimension:

- **Primary variant inheritance**: Changes to the primary variant cascade to all others unless explicitly overridden. Overridden properties show a blue highlight.
- **Property controls**: Code components declare their configurable properties via `addPropertyControls`, defining the editing interface. This is essentially a schema for what the component accepts.
- **Design-code bridge**: Visual variants (designed on canvas) and code variants (defined in React) can interoperate. Variables let each instance override specific fields.

**Key takeaway for Pitchr:** The property controls concept maps directly to a TypeScript interface for each component — defining what props are editable, what their types are, and what their options are. This drives both the rendering and the editing UI.

---

## 2. Theme Architecture

### 2.1 Design Token Hierarchy

Following the industry-standard three-tier token system used by major design systems (Material, Spectrum, PrimeVue):

```
Tier 1: Primitive Tokens    — Raw values: colors, font sizes, spacing values
Tier 2: Semantic Tokens     — Meaning-based aliases: --color-text-primary, --space-section
Tier 3: Component Tokens    — Scoped to components: --card-bg, --heading-size
```

For a slide editor, we need a fourth tier:

```
Tier 4: Slide Tokens        — Scoped to slide context: --slide-bg, --slide-accent
```

### 2.2 Theme Definition Interface

```typescript
// A "theme" is the full design language for a deck
interface DeckTheme {
  id: string;
  name: string;                    // "Retro Tech", "Chronicle", "Midnight"

  // Primitive tokens — the raw palette
  primitives: {
    colors: {
      neutral: ColorScale;         // 50-950 scale (like Tailwind)
      accent: ColorScale;
      secondary: ColorScale;
      success: string;
      warning: string;
      error: string;
    };
    typography: {
      fontFamilies: {
        display: string;           // "Inter", "Playfair Display"
        body: string;              // "Inter", "Source Sans Pro"
        mono: string;              // "JetBrains Mono"
      };
      fontSizes: Record<FontSizeToken, number>;   // xs through 5xl
      fontWeights: Record<FontWeightToken, number>;
      lineHeights: Record<LineHeightToken, number>;
    };
    spacing: Record<SpaceToken, number>;  // 0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64
    radii: Record<RadiusToken, number>;   // none, sm, md, lg, xl, full
    shadows: Record<ShadowToken, string>;
  };

  // Chapter presets — the "Neutral Light / Dark / Accent" variants
  chapterPresets: {
    'neutral-light': ChapterPreset;
    'neutral-dark': ChapterPreset;
    'accent': ChapterPreset;
    [custom: string]: ChapterPreset;  // user-defined presets
  };

  // Default chapter preset
  defaultPreset: string;
}

// A color scale like Tailwind's gray-50 through gray-950
interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

// Chapter preset maps semantic roles to primitive tokens
interface ChapterPreset {
  id: string;
  name: string;                     // "Neutral Light", "Dark", "Accent"
  colorDot: string;                 // CSS color for the indicator dot in UI

  // Semantic color assignments
  colors: {
    background: string;             // slide background
    backgroundSecondary: string;    // card/section backgrounds
    backgroundTertiary: string;     // nested surfaces
    text: string;                   // primary text
    textSecondary: string;          // secondary/muted text
    textInverse: string;            // text on accent backgrounds
    accent: string;                 // primary accent
    accentHover: string;            // accent interaction state
    border: string;                 // borders and dividers
    borderSubtle: string;           // subtle separators
  };

  // Optional typography overrides per preset
  typography?: {
    headlineWeight?: number;
    bodyWeight?: number;
  };
}

type FontSizeToken = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
type FontWeightToken = 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
type LineHeightToken = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
type SpaceToken = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24';
type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type ShadowToken = 'none' | 'sm' | 'md' | 'lg' | 'xl';
```

### 2.3 How Instant Theme Switching Works

Chronicle's instant theme switching almost certainly uses **CSS custom properties** (CSS variables). Here is the recommended approach:

**Strategy: CSS Custom Properties on a Scoping Element**

```
[data-theme="retro-tech"]                    ← document-level theme
  [data-chapter="intro"]                     ← chapter grouping
    [data-preset="neutral-light"]            ← chapter preset
      [data-slide-id="slide-1"]              ← individual slide
        [data-slide-bg-override="..."]       ← per-slide background override
```

Each level sets CSS custom properties that cascade down:

```css
/* Document-level theme sets primitives */
[data-theme="retro-tech"] {
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --color-accent-500: #ff5941;
  --color-neutral-50: #fafaf9;
  --color-neutral-900: #1c1917;
  --radius-md: 8px;
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Chapter preset maps semantic tokens to primitives */
[data-preset="neutral-light"] {
  --slide-bg: var(--color-neutral-50);
  --slide-bg-secondary: var(--color-neutral-100);
  --slide-text: var(--color-neutral-900);
  --slide-text-secondary: var(--color-neutral-500);
  --slide-accent: var(--color-accent-500);
  --slide-border: var(--color-neutral-200);
}

[data-preset="neutral-dark"] {
  --slide-bg: var(--color-neutral-900);
  --slide-bg-secondary: var(--color-neutral-800);
  --slide-text: var(--color-neutral-50);
  --slide-text-secondary: var(--color-neutral-400);
  --slide-accent: var(--color-accent-500);
  --slide-border: var(--color-neutral-700);
}

[data-preset="accent"] {
  --slide-bg: var(--color-accent-500);
  --slide-bg-secondary: var(--color-accent-600);
  --slide-text: white;
  --slide-text-secondary: rgba(255, 255, 255, 0.8);
  --slide-accent: white;
  --slide-border: rgba(255, 255, 255, 0.2);
}
```

**Why this is instant:** Changing a `data-theme` attribute on a parent element causes all CSS custom properties to recompute via the cascade. The browser does not re-layout the DOM — it only recalculates paint. This is a single-frame update (sub-16ms on modern hardware).

**Why not Tailwind theme?** Tailwind generates static utility classes at build time. Dynamic theme switching requires runtime values. CSS custom properties are the right tool because they are inherited, composable, and zero-JS to propagate. Tailwind can reference custom properties in its config (e.g., `bg-[var(--slide-bg)]`), giving us the best of both worlds.

**Why not runtime style injection?** Inline styles via React's `style` prop would work but have drawbacks: they do not cascade (each component must explicitly read the theme), they cannot use pseudo-selectors, and they are harder to debug. CSS custom properties cascade naturally and are visible in DevTools.

### 2.4 Theme Scope: Chapter vs Document

Chronicle's "This chapter" vs "Whole document" toggle maps to where the `data-preset` attribute is placed:

- **Whole document**: Set `data-preset` on the deck container element. All slides inherit.
- **This chapter**: Set `data-preset` on the chapter wrapper element. Only slides in that chapter inherit. Other chapters keep their own preset.
- **Per-slide override**: Individual slides can override specific variables (e.g., a custom background image) without breaking the preset cascade.

```typescript
interface ThemeScope {
  // Document-level theme (always set)
  themeId: string;

  // Document-level default preset
  defaultPreset: string;

  // Chapter-level preset overrides
  chapterPresets: Record<string, string>;  // chapterId → presetId

  // Slide-level overrides (sparse — only slides with custom settings)
  slideOverrides: Record<string, SlideStyleOverride>;
}

interface SlideStyleOverride {
  backgroundType?: 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;      // URL or storage reference
  backgroundOpacity?: number;
  // Can override any semantic token
  tokenOverrides?: Partial<ChapterPreset['colors']>;
}
```

### 2.5 Compatibility with Current Pitchr Templates

The current `DeckTemplate` interface in `types/deckGeneration.ts` maps to this system as follows:

| Current `DeckTemplate` field | New system equivalent |
|---|---|
| `colors.background` | `ChapterPreset.colors.background` |
| `colors.backgroundSecondary` | `ChapterPreset.colors.backgroundSecondary` |
| `colors.text` | `ChapterPreset.colors.text` |
| `colors.textSecondary` | `ChapterPreset.colors.textSecondary` |
| `colors.accent` | `ChapterPreset.colors.accent` |
| `colors.accentSecondary` | `ChapterPreset.colors.accentHover` |
| `fonts.headline` | `DeckTheme.primitives.typography.fontFamilies.display` |
| `fonts.body` | `DeckTheme.primitives.typography.fontFamilies.body` |
| `layout.headlineSize` | `DeckTheme.primitives.typography.fontSizes['3xl']` |
| `layout.bodySize` | `DeckTheme.primitives.typography.fontSizes['base']` |
| `layout.padding` | `DeckTheme.primitives.spacing['8']` |
| `layout.calloutStyle` | Component variant property on Callout widget |

Each existing `TemplateId` (`minimal-dark`, `corporate-clean`, `bold-gradient`, `startup-fresh`) becomes a `DeckTheme` with a single chapter preset. Migration is straightforward — the new system is a strict superset.

---

## 3. Component Variant System

### 3.1 What is a "Variant"?

A variant is a **visual configuration** of a component that changes its layout, size, or visual treatment **without changing its data**. The same content renders differently based on variant selection.

Examples from Chronicle:
- **Card**: Vertical card / Horizontal card / Minimal card / Accent card
- **Text**: Paragraph / Heading / Subheading / Quote / Caption
- **Size**: Small / Medium / Large
- **Grid**: 1-column / 2-column / 3-column / 2x2 / 3x2

### 3.2 Variant Property Model (Figma-Inspired)

Rather than treating each visual configuration as a separate component type, model variants as **property combinations** on a single component type:

```typescript
// Each component type declares its available variant properties
interface ComponentVariantSchema {
  componentType: string;
  variantProperties: VariantProperty[];
}

interface VariantProperty {
  name: string;           // "direction", "size", "style"
  type: 'enum';
  options: string[];      // ["vertical", "horizontal"]
  default: string;        // "vertical"
  label: string;          // "Card Direction" (for UI)
}

// Example: Card component variants
const CARD_VARIANTS: ComponentVariantSchema = {
  componentType: 'card',
  variantProperties: [
    {
      name: 'direction',
      type: 'enum',
      options: ['vertical', 'horizontal'],
      default: 'vertical',
      label: 'Card Direction',
    },
    {
      name: 'size',
      type: 'enum',
      options: ['small', 'medium', 'large'],
      default: 'medium',
      label: 'Size',
    },
    {
      name: 'style',
      type: 'enum',
      options: ['default', 'outlined', 'accent', 'minimal'],
      default: 'default',
      label: 'Style',
    },
  ],
};
```

### 3.3 Variant Selection in Data Model

Each component instance stores its current variant selections:

```typescript
interface ComponentInstance {
  id: string;
  type: string;                         // "card", "text", "chart", etc.
  variants: Record<string, string>;     // { direction: "horizontal", size: "large", style: "accent" }
  content: ComponentContent;            // type-specific content data
  position?: LayoutPosition;            // position within parent grid/container
}
```

Switching a variant is a single state update: `{ ...component, variants: { ...component.variants, direction: 'horizontal' } }`. No data migration needed.

### 3.4 How Variant Switching Renders

The renderer for each component type reads the variant selections and adjusts layout accordingly:

```typescript
// Pseudocode — component reads its own variant selections
function CardWidget({ instance, theme }: WidgetProps) {
  const direction = instance.variants.direction ?? 'vertical';
  const size = instance.variants.size ?? 'medium';
  const style = instance.variants.style ?? 'default';

  // Direction controls the flex layout
  const layoutClass = direction === 'horizontal' ? 'flex-row' : 'flex-col';

  // Size controls the scale
  const sizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-5 text-base',
    large: 'p-8 text-lg',
  }[size];

  // Style controls the visual treatment (using theme CSS variables)
  const styleClasses = {
    default: 'bg-[var(--slide-bg-secondary)] border border-[var(--slide-border)]',
    outlined: 'bg-transparent border-2 border-[var(--slide-accent)]',
    accent: 'bg-[var(--slide-accent)] text-[var(--slide-text-inverse)]',
    minimal: 'bg-transparent',
  }[style];

  return (
    <div className={cn(layoutClass, sizeClasses, styleClasses, 'rounded-[var(--radius-md)]')}>
      {instance.content.title && <h3>{instance.content.title}</h3>}
      {instance.content.body && <p>{instance.content.body}</p>}
      {instance.content.image && <img src={instance.content.image} />}
    </div>
  );
}
```

---

## 4. Block Transformation System ("Turn Into")

### 4.1 The Core Problem

When a user turns a "Paragraph" into a "Card", or a "Card" into a "Chart", the system must:

1. Identify which content fields map between the two types
2. Preserve mappable content
3. Initialize new required fields with sensible defaults
4. Discard unmappable fields (but ideally retain them as hidden metadata for undo)

### 4.2 Superset Content Model (Notion Pattern)

The key insight from Notion: **store all possible content fields in a single superset structure**. Each component type reads only the fields it needs. Unused fields persist silently.

```typescript
// Universal content superset — every possible field across all component types
interface ComponentContent {
  // Text fields (used by: paragraph, heading, card, callout, sticky-note)
  title?: string;
  body?: string;                    // rich text (markdown or structured)
  caption?: string;

  // Media fields (used by: image, video, card, mockup)
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'embed';
  mediaAlt?: string;
  mediaThumbnail?: string;

  // Data fields (used by: chart, metric-card, comparison)
  dataPoints?: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area';

  // List fields (used by: card with bullets, comparison, checklist)
  items?: Array<{
    text: string;
    detail?: string;
    icon?: string;
    checked?: boolean;              // for checklists — Notion-style silent retention
  }>;

  // Callout fields (used by: metric-card, callout, big-number)
  calloutValue?: string;
  calloutLabel?: string;

  // Embed fields (used by: embed, mockup)
  embedUrl?: string;
  embedType?: 'iframe' | 'link-preview' | 'mockup-frame';

  // Layout-specific (used by: grid containers)
  columns?: number;
  children?: string[];              // IDs of child components (for nesting)
}
```

### 4.3 Content Mapping Rules

Define explicit mapping rules for each transformation pair. When fields do not map directly, use heuristics:

```typescript
interface TransformRule {
  from: string;                     // source component type
  to: string;                       // target component type
  fieldMappings: FieldMapping[];
  defaults: Partial<ComponentContent>;  // defaults for fields the source doesn't have
}

interface FieldMapping {
  sourceField: keyof ComponentContent;
  targetField: keyof ComponentContent;
  transform?: (value: unknown) => unknown;  // optional value transformation
}

// Example: Paragraph → Card
const PARAGRAPH_TO_CARD: TransformRule = {
  from: 'paragraph',
  to: 'card',
  fieldMappings: [
    { sourceField: 'body', targetField: 'body' },
    // First sentence of body becomes the card title
    {
      sourceField: 'body',
      targetField: 'title',
      transform: (body: unknown) => {
        if (typeof body !== 'string') return '';
        const firstSentence = body.split(/[.!?]/)[0];
        return firstSentence?.trim() ?? '';
      },
    },
  ],
  defaults: {
    // Card gets default variant selections
  },
};

// Example: Card → Chart
const CARD_TO_CHART: TransformRule = {
  from: 'card',
  to: 'chart',
  fieldMappings: [
    { sourceField: 'title', targetField: 'title' },
    // If card has items, try to extract data points
    {
      sourceField: 'items',
      targetField: 'dataPoints',
      transform: (items: unknown) => {
        if (!Array.isArray(items)) return [];
        return items.map((item: { text: string; detail?: string }) => ({
          label: item.text,
          value: parseFloat(item.detail ?? '0') || 0,
        }));
      },
    },
  ],
  defaults: {
    chartType: 'bar',
  },
};
```

### 4.4 Transformation Registry

```typescript
// Registry of all valid transformations
const TRANSFORM_REGISTRY: Map<string, TransformRule[]> = new Map();

// Helper to get valid "Turn Into" targets for a component type
function getAvailableTransforms(sourceType: string): string[] {
  return TRANSFORM_REGISTRY.get(sourceType)?.map(r => r.to) ?? [];
}

// Execute a transformation
function transformComponent(
  component: ComponentInstance,
  targetType: string,
): ComponentInstance {
  const rules = TRANSFORM_REGISTRY.get(component.type);
  const rule = rules?.find(r => r.to === targetType);

  if (!rule) {
    // Fallback: keep content as-is, just change type
    return { ...component, type: targetType, variants: {} };
  }

  const newContent: ComponentContent = { ...rule.defaults };

  for (const mapping of rule.fieldMappings) {
    const sourceValue = component.content[mapping.sourceField];
    if (sourceValue !== undefined) {
      (newContent as Record<string, unknown>)[mapping.targetField] =
        mapping.transform ? mapping.transform(sourceValue) : sourceValue;
    }
  }

  // CRITICAL: Preserve all original content as _previousContent for undo
  return {
    ...component,
    type: targetType,
    variants: {},  // Reset variants — new type has its own variant space
    content: {
      ...component.content,  // Keep ALL original fields (Notion pattern)
      ...newContent,          // Override with mapped values
    },
  };
}
```

### 4.5 Transformation Matrix

Which types can transform into which, with content compatibility:

| From \ To | Paragraph | Heading | Card | Image | Video | Chart | Embed | Callout | Sticky |
|---|---|---|---|---|---|---|---|---|---|
| **Paragraph** | -- | title | title+body | -- | -- | -- | -- | body | body |
| **Heading** | title→body | -- | title | -- | -- | -- | -- | title | title |
| **Card** | title+body | title | -- | media | media | items→data | embed | callout | title+body |
| **Image** | caption | caption | media+caption | -- | -- | -- | -- | caption | caption |
| **Chart** | title | title | title+data→items | -- | -- | -- | -- | callout | title |
| **Callout** | value+label | value | value+label | -- | -- | -- | -- | -- | value+label |

Cells marked `--` mean either it is the same type or the transformation has no useful content mapping (user gets an empty component of the target type).

---

## 5. Component Registry & Renderer Architecture

### 5.1 Component Type Registry

A central registry maps component type strings to their metadata, variant schemas, and React renderers:

```typescript
interface ComponentTypeDefinition {
  type: string;                          // "card", "paragraph", "chart"
  label: string;                         // "Card" (for UI)
  icon: string;                          // icon identifier for menus
  category: ComponentCategory;
  variantSchema: ComponentVariantSchema;

  // Which content fields this type uses (for UI: show/hide editing fields)
  contentFields: Array<{
    field: keyof ComponentContent;
    required: boolean;
    label: string;
    editor: 'text' | 'richtext' | 'media' | 'data' | 'embed' | 'items';
  }>;

  // Default content for new instances of this type
  defaultContent: Partial<ComponentContent>;

  // Default variant selections for new instances
  defaultVariants: Record<string, string>;

  // Which types this can be transformed into
  transformTargets: string[];
}

type ComponentCategory = 'text' | 'media' | 'data' | 'layout' | 'interactive';

// The registry itself
const COMPONENT_REGISTRY: Map<string, ComponentTypeDefinition> = new Map();

// Renderer registry — maps type to React component
const RENDERER_REGISTRY: Map<string, React.ComponentType<WidgetProps>> = new Map();

// Register a component type
function registerComponentType(
  definition: ComponentTypeDefinition,
  renderer: React.ComponentType<WidgetProps>,
): void {
  COMPONENT_REGISTRY.set(definition.type, definition);
  RENDERER_REGISTRY.set(definition.type, renderer);
}
```

### 5.2 Widget Renderer Props

All widget renderers receive the same prop interface:

```typescript
interface WidgetProps {
  instance: ComponentInstance;
  isEditing: boolean;
  isSelected: boolean;
  onContentChange: (field: keyof ComponentContent, value: unknown) => void;
  onVariantChange: (property: string, value: string) => void;
  onTransform: (targetType: string) => void;
}
```

### 5.3 Universal Widget Renderer

The top-level renderer that dispatches to the correct component:

```typescript
function WidgetRenderer({ instance, ...props }: WidgetProps) {
  const Renderer = RENDERER_REGISTRY.get(instance.type);

  if (!Renderer) {
    return <UnknownWidget type={instance.type} />;
  }

  return <Renderer instance={instance} {...props} />;
}
```

### 5.4 Making it Extensible

Adding a new component type requires three things:

1. **Define** the type metadata (content fields, variants, transform targets)
2. **Implement** the React renderer component
3. **Register** both in the registry

No changes to the core rendering pipeline, data model, or state management. This is the "plugin" pattern — the same approach used by ProseMirror, TipTap, and WordPress Gutenberg for block extensibility.

```typescript
// Example: adding a new "Timeline" component type
registerComponentType(
  {
    type: 'timeline',
    label: 'Timeline',
    icon: 'clock',
    category: 'data',
    variantSchema: {
      componentType: 'timeline',
      variantProperties: [
        { name: 'direction', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', label: 'Direction' },
        { name: 'style', type: 'enum', options: ['default', 'minimal', 'connected'], default: 'default', label: 'Style' },
      ],
    },
    contentFields: [
      { field: 'title', required: false, label: 'Title', editor: 'text' },
      { field: 'items', required: true, label: 'Timeline Items', editor: 'items' },
    ],
    defaultContent: {
      items: [
        { text: 'Q1 2026', detail: 'Launch MVP' },
        { text: 'Q2 2026', detail: 'First 100 customers' },
        { text: 'Q3 2026', detail: 'Series A' },
      ],
    },
    defaultVariants: { direction: 'horizontal', style: 'default' },
    transformTargets: ['card', 'paragraph', 'chart'],
  },
  TimelineWidget,  // React component
);
```

---

## 6. Data Model & TypeScript Interfaces

### 6.1 Complete Deck Data Model

```typescript
// ─── Top Level ───

interface Deck {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;

  // Theme configuration
  theme: ThemeScope;

  // Ordered chapters containing slides
  chapters: Chapter[];

  // Deck-level metadata
  metadata: {
    aspectRatio: '16:9' | '4:3';
    slideCount: number;
    generatedBy?: 'ai' | 'manual' | 'template';
  };
}

// ─── Theme Scope ───

interface ThemeScope {
  themeId: string;                           // references a DeckTheme
  defaultPreset: string;                     // "neutral-light"
  chapterPresets: Record<string, string>;    // chapterId → presetId
  slideOverrides: Record<string, SlideStyleOverride>;
}

// ─── Chapter ───

interface Chapter {
  id: string;
  title: string;                              // "Introduction", "Problem", etc.
  slides: Slide[];
}

// ─── Slide ───

interface Slide {
  id: string;
  chapterId: string;
  position: number;

  // Content as a tree of components
  rootComponent: ComponentInstance;

  // Slide-level settings
  transition?: SlideTransition;
  speakerNotes?: string;
  duration?: number;                          // suggested duration in seconds
}

interface SlideTransition {
  type: 'none' | 'fade' | 'slide-left' | 'slide-up' | 'dissolve';
  duration: number;                           // ms
}

// ─── Component Instance ───

interface ComponentInstance {
  id: string;
  type: string;                               // registered component type
  variants: Record<string, string>;           // current variant selections
  content: ComponentContent;                  // superset content model
  children?: ComponentInstance[];              // for container/grid types
  position?: LayoutPosition;                  // position within parent
}

interface LayoutPosition {
  // For grid children
  gridColumn?: number;
  gridRow?: number;
  gridColumnSpan?: number;
  gridRowSpan?: number;

  // For freeform (v2/v3 canvas mode)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

// ─── Content (superset, from section 4.2) ───

interface ComponentContent {
  title?: string;
  body?: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'embed';
  mediaAlt?: string;
  mediaThumbnail?: string;
  dataPoints?: Array<{ label: string; value: number | string; color?: string }>;
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  items?: Array<{ text: string; detail?: string; icon?: string; checked?: boolean }>;
  calloutValue?: string;
  calloutLabel?: string;
  embedUrl?: string;
  embedType?: 'iframe' | 'link-preview' | 'mockup-frame';
  columns?: number;
  children?: string[];
}
```

### 6.2 Relationship to Current `GeneratedSlide`

The current `GeneratedSlide` maps to the new model as follows:

```typescript
// Current GeneratedSlide → new ComponentInstance conversion
function migrateGeneratedSlide(slide: GeneratedSlide): Slide {
  return {
    id: generateId(),
    chapterId: '',  // assigned by chapter grouping logic
    position: 0,
    rootComponent: {
      id: generateId(),
      type: mapSlideTypeToComponentType(slide.type, slide.layout_hint),
      variants: mapLayoutHintToVariants(slide.layout_hint),
      content: {
        title: slide.headline,
        body: slide.subheadline,
        items: slide.bullets.map(b => ({ text: b.text, detail: b.detail })),
        calloutValue: slide.callout?.value,
        calloutLabel: slide.callout?.label,
      },
    },
  };
}

function mapSlideTypeToComponentType(
  type: AnySlideType,
  layoutHint?: LayoutHint,
): string {
  // Slide types map to layout containers, not content components
  switch (layoutHint) {
    case 'centered': return 'layout-centered';
    case 'two-column': return 'layout-two-column';
    case 'comparison': return 'layout-comparison';
    case 'cards': return 'layout-card-grid';
    case 'big-number': return 'layout-big-number';
    default: return 'layout-centered';
  }
}
```

### 6.3 Storage Strategy

**Supabase schema** (extends current `decks` / `slides` tables):

```sql
-- Deck metadata + theme scope
ALTER TABLE decks ADD COLUMN theme_scope JSONB DEFAULT '{}';
ALTER TABLE decks ADD COLUMN chapters JSONB DEFAULT '[]';

-- Slide component tree stored as JSONB
ALTER TABLE slides ADD COLUMN component_tree JSONB;
ALTER TABLE slides ADD COLUMN chapter_id TEXT;
ALTER TABLE slides ADD COLUMN speaker_notes TEXT;
ALTER TABLE slides ADD COLUMN transition JSONB;
```

The component tree is stored as a single JSONB column per slide. This avoids the complexity of normalizing a recursive tree into relational tables while still allowing JSONB path queries for search/filtering.

---

## 7. Design System for Slide Components

### 7.1 Core Components

These are the minimum components needed for a Chronicle-caliber editor:

**Text Components:**
| Type | Variants | Content Fields |
|---|---|---|
| `heading` | size: h1/h2/h3, align: left/center/right | title |
| `paragraph` | size: sm/base/lg, align: left/center/right | body |
| `quote` | style: default/large/attributed | body, caption (attribution) |
| `callout` | style: card/pill/banner, color: accent/neutral/success/warning | calloutValue, calloutLabel |

**Media Components:**
| Type | Variants | Content Fields |
|---|---|---|
| `image` | fit: cover/contain/fill, corners: square/rounded/circle | mediaUrl, mediaAlt, caption |
| `video` | autoplay: on/off, controls: show/hide | mediaUrl, mediaThumbnail |
| `mockup` | device: phone/tablet/laptop/browser | mediaUrl, embedUrl |

**Data Components:**
| Type | Variants | Content Fields |
|---|---|---|
| `chart` | chartType: bar/line/pie/donut/area, style: default/minimal | title, dataPoints, chartType |
| `metric-card` | size: sm/md/lg, style: default/accent/outlined | calloutValue, calloutLabel, caption |
| `comparison` | columns: 2/3, style: table/cards | title, items |
| `timeline` | direction: horizontal/vertical, style: default/minimal | title, items |

**Layout Components (containers):**
| Type | Variants | Content Fields |
|---|---|---|
| `card` | direction: vertical/horizontal, size: sm/md/lg, style: default/outlined/accent/minimal | title, body, items, mediaUrl |
| `grid` | columns: 1/2/3/4, gap: sm/md/lg | children (ComponentInstance[]) |
| `split` | ratio: 50-50/60-40/40-60/70-30, direction: left-right/right-left | children (2 ComponentInstance[]) |
| `stack` | gap: sm/md/lg, align: start/center/stretch | children (ComponentInstance[]) |

### 7.2 Card Component Deep Dive

The Card is the most complex component because it has the most variant dimensions and is used in grids:

```
┌─────────────────────────────────────────────────────────────────┐
│ Card Variants                                                    │
│                                                                  │
│ direction: vertical          direction: horizontal               │
│ ┌──────────────┐             ┌─────────────────────────────┐     │
│ │  [image]     │             │ [image]  │  Title           │     │
│ │              │             │          │  Body text here  │     │
│ │  Title       │             │          │  • Bullet 1      │     │
│ │  Body text   │             │          │  • Bullet 2      │     │
│ │  • Bullet 1  │             └─────────────────────────────┘     │
│ │  • Bullet 2  │                                                 │
│ └──────────────┘             style: accent                       │
│                              ┌─────────────────────────────┐     │
│ style: outlined              │████████████████████████████ │     │
│ ┌──────────────┐             │████  Title  ████████████████│     │
│ │ ┌──────────┐ │             │████  Body   ████████████████│     │
│ │ │  Title   │ │             │████  (white text on accent) │     │
│ │ │  Body    │ │             └─────────────────────────────┘     │
│ │ └──────────┘ │                                                 │
│ └──────────────┘             size: large (1.5x padding, larger  │
│                              font sizes, more visual weight)     │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Grid Layout Reflow

When card variants change inside a grid, the grid must reflow:

```
3x2 grid with vertical cards:
┌────┐ ┌────┐ ┌────┐
│ V  │ │ V  │ │ V  │
│card│ │card│ │card│
└────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐
│ V  │ │ V  │ │ V  │
│card│ │card│ │card│
└────┘ └────┘ └────┘

Same grid, cards switched to horizontal:
┌──────────────┐ ┌──────────────┐
│  H card      │ │  H card      │
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│  H card      │ │  H card      │
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│  H card      │ │  H card      │
└──────────────┘ └──────────────┘
```

The grid automatically adjusts its column count based on child variant dimensions. This can be handled with CSS Grid's `auto-fit` / `auto-fill` with `minmax()`, or explicitly by the grid component reading its children's variant dimensions.

### 7.4 Theme-Aware Component CSS

Every component uses CSS custom properties from the theme cascade. No component should hardcode colors:

```css
/* Card component — reads from theme */
.slide-card {
  background: var(--slide-bg-secondary);
  color: var(--slide-text);
  border: 1px solid var(--slide-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
}

.slide-card[data-style="accent"] {
  background: var(--slide-accent);
  color: var(--slide-text-inverse);
  border-color: transparent;
}

.slide-card[data-style="outlined"] {
  background: transparent;
  border-width: 2px;
  border-color: var(--slide-accent);
}

.slide-card h3 {
  font-family: var(--font-display);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}
```

When a theme changes, every component instantly updates because the CSS variable values change at the parent level. No React re-renders needed for color changes.

---

## 8. State Management

### 8.1 Recommended Approach

Given Pitchr's existing patterns (React hooks + context providers), the deck editor state should use a **Zustand store** for the slide data and a **React context** for the theme:

```typescript
// ─── Zustand store for deck editing state ───

interface DeckEditorState {
  // Core data
  deck: Deck;

  // Selection state
  selectedSlideId: string | null;
  selectedComponentId: string | null;

  // History for undo/redo
  history: Deck[];
  historyIndex: number;

  // Actions
  setTheme: (themeId: string) => void;
  setChapterPreset: (chapterId: string, presetId: string) => void;
  setDocumentPreset: (presetId: string) => void;
  setSlideOverride: (slideId: string, override: SlideStyleOverride) => void;

  updateComponent: (slideId: string, componentId: string, updates: Partial<ComponentInstance>) => void;
  changeVariant: (slideId: string, componentId: string, property: string, value: string) => void;
  transformComponent: (slideId: string, componentId: string, targetType: string) => void;

  addSlide: (afterSlideId: string, slide: Slide) => void;
  removeSlide: (slideId: string) => void;
  reorderSlides: (slideIds: string[]) => void;

  undo: () => void;
  redo: () => void;
}
```

### 8.2 Undo/Redo Strategy

Use **immutable state snapshots** (the Konva/React pattern). Every mutation pushes the previous state onto the history stack:

```typescript
// Simplified undo/redo logic
function withHistory(
  set: (fn: (state: DeckEditorState) => Partial<DeckEditorState>) => void,
) {
  return (mutator: (deck: Deck) => Deck) => {
    set((state) => {
      const newDeck = mutator(state.deck);
      return {
        deck: newDeck,
        history: [...state.history.slice(0, state.historyIndex + 1), state.deck],
        historyIndex: state.historyIndex + 1,
      };
    });
  };
}
```

For large decks, consider **structural sharing** (Immer) or **command pattern** (storing deltas instead of full snapshots) to reduce memory usage.

### 8.3 Theme Context

The theme itself is relatively static (changes infrequently), so a React context is appropriate:

```typescript
interface ThemeContextValue {
  theme: DeckTheme;
  resolvePreset: (chapterId: string) => ChapterPreset;
  resolveSlideOverride: (slideId: string) => SlideStyleOverride | undefined;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useSlideTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useSlideTheme must be used within ThemeProvider');
  return ctx;
}
```

---

## 9. Implementation Recommendations

### 9.1 Migration Path from Current System

The current system (`DeckTemplate` + `GeneratedSlide` + PDF-only rendering) should be evolved, not replaced:

**Phase 1 — Theme System (1-2 weeks)**
- Define `DeckTheme` and `ChapterPreset` interfaces
- Migrate current 4 templates to new theme format (backward compatible)
- Implement CSS custom property injection for web preview
- Keep PDF export path unchanged (it reads from template object directly)

**Phase 2 — Component Registry (1-2 weeks)**
- Build `ComponentInstance` data model and superset `ComponentContent`
- Create the component registry with initial types: heading, paragraph, card, metric-card, image
- Build `WidgetRenderer` dispatcher
- Write migration function from `GeneratedSlide` to new format

**Phase 3 — Variant System (1-2 weeks)**
- Add variant properties to component definitions
- Build variant selector UI (dropdowns per variant property)
- Implement variant-aware rendering in each component

**Phase 4 — "Turn Into" Transformations (1 week)**
- Define transformation rules between component types
- Build transform registry and execution logic
- Add "Turn Into" menu UI

**Phase 5 — Chapter Presets & Theme Scoping (1 week)**
- Add chapter structure to deck data model
- Implement scope toggle (chapter vs document)
- Add per-slide background overrides

### 9.2 Key Architectural Decisions

| Decision | Recommendation | Rationale |
|---|---|---|
| Theme propagation | CSS custom properties | Instant updates, zero React re-renders for color changes, cascade-based scoping |
| Component data model | Superset content (Notion pattern) | Enables type switching without data loss, simplest to implement |
| Variant model | Property combinations (Figma pattern) | Fewer component types, combinatorial flexibility |
| Component rendering | Registry + dispatcher | Extensible (add types without changing core), clean separation |
| State management | Zustand store | Already aligned with team patterns, supports undo/redo well |
| Undo/redo | Immutable snapshots | Simple to implement, works with Zustand, proven pattern |
| Storage | JSONB component tree per slide | Avoids recursive relational modeling, enables flexible schema evolution |
| Tailwind integration | CSS vars referenced in Tailwind utilities | `bg-[var(--slide-bg)]` — keeps Tailwind for layout, CSS vars for theming |

### 9.3 What to Avoid

- **Do not build a canvas editor for this phase.** HTML/CSS-based rendering with the component system is the right v1 approach. Canvas (Konva) is for v2/v3 freeform editing. See [canvas-editing-technologies.md](./canvas-editing-technologies.md).
- **Do not over-normalize the database.** A JSONB component tree per slide is correct. Normalizing components into their own table creates join complexity with no query benefit.
- **Do not build all component types at once.** Start with heading, paragraph, card, metric-card, image. Add chart, timeline, comparison, mockup after the core system works.
- **Do not use inline styles for theming.** CSS custom properties are strictly superior for cascading theme support.
- **Do not create separate React components for each variant.** One component per type reads its variant props and adjusts rendering — no `VerticalCard.tsx` + `HorizontalCard.tsx`.

### 9.4 Performance Considerations

- **Theme switching:** Sub-1ms via CSS cascade. No React re-render.
- **Variant switching:** Single state update + one component re-render. No DOM restructuring if using CSS for layout changes (flex-direction, grid-template-columns).
- **"Turn into" transformation:** Pure data transformation (O(1) field mapping), followed by one component unmount/mount.
- **Large decks (50+ slides):** Virtualize the slide navigator panel. Only render the visible slide(s) at full fidelity; thumbnail slides can use a simplified renderer or static screenshots.
- **Undo/redo memory:** For decks with 20+ slides, switch from full snapshots to Immer-based patches (structural sharing). A 20-slide deck with full component trees is roughly 50-100KB per snapshot; 100 undo steps = 5-10MB, which is acceptable for modern browsers but worth monitoring.

---

## Sources

- [Notion: Exploring Notion's Data Model](https://www.notion.com/blog/data-model-behind-notion) — block-based architecture, superset schema
- [Notion: Transforming content blocks](https://www.notion.com/help/guides/transforming-content-blocks-in-notion) — "Turn Into" UX patterns
- [Figma: Create and use variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants) — component sets, variant properties
- [Figma: Swap components and instances](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances) — override preservation
- [Figma: Component architecture](https://www.figma.com/best-practices/component-architecture/) — design system patterns
- [Framer: Components](https://www.framer.com/support/using-framer/design-components/) — primary variant inheritance, overrides
- [Framer: Property Controls](https://www.framer.com/developers/property-controls) — code-level variant definition
- [Chronicle AI](https://chroniclehq.com/) — widget system, theme chapters, remix options
- [Chronicle AI Review (2026)](https://max-productive.ai/ai-tools/chronicle/) — 150+ widgets, patent-pending conversions
- [CSS Custom Properties for Theme Switching](https://dev.to/tailwine/css-custom-properties-for-theme-switching-6d1) — instant theme recoloring
- [Advanced Theming with Design Tokens](https://david-supik.medium.com/advanced-theming-techniques-with-design-tokens-bd147fe7236e) — three-tier token hierarchy
- [Theming in Modern Design Systems](https://whoisryosuke.com/blog/2020/theming-in-modern-design-systems) — scoped theming patterns
- [CSS Custom Properties Guide (CSS-Tricks)](https://css-tricks.com/a-complete-guide-to-custom-properties/) — cascade, inheritance, scoping
- [Polymorphic Components (Steve Kinney)](https://stevekinney.com/courses/react-typescript/polymorphic-components-and-as-prop) — as-prop pattern
- [Variants tip for React components](https://swizec.com/blog/variants-a-quick-tip-for-better-react-components/) — variant prop pattern
- [Minimalist Notion Implementation](https://medium.com/@arcilamatt/minimalist-notion-implementation-part-1-everything-is-a-block-debda338b61a) — block model recreation
