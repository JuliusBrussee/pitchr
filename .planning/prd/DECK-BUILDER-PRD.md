# Pitchr Deck Builder & Canvas Editor — Product Requirements Document

> **One sentence:** Transform Pitchr's basic PDF deck generator into a Chronicle AI-caliber intelligent deck builder with multi-agent narrative generation, interactive web-based slide editing, a professional theme/component system, and multi-format export — uniquely powered by Pitchr's pitch analysis flywheel.

- **Version:** 1.0
- **Date:** 2026-03-11
- **Status:** Approved for implementation
- **Depends on:** Current deck infrastructure (`types/deckGeneration.ts`, `services/deckGenerationService.ts`, `views/components/deck-pdf/`, `app/api/deck/generate/`)
- **Research base:** `.planning/research/pitch-deck-builder.md`, `canvas-editing-technologies.md`, `canvas-editor-deep-dive.md`, `editor-ux-patterns.md`, `snapping-alignment-system.md`, `template-component-system.md`

---

## Table of Contents

1. [Problem & Opportunity](#1-problem--opportunity)
2. [Product Vision](#2-product-vision)
3. [Competitive Landscape](#3-competitive-landscape)
4. [What Exists Today](#4-what-exists-today)
5. [System Architecture](#5-system-architecture)
6. [Data Model](#6-data-model)
7. [Multi-Agent Generation Pipeline](#7-multi-agent-generation-pipeline)
8. [Slide Editor](#8-slide-editor)
9. [Theme System](#9-theme-system)
10. [Component & Variant System](#10-component--variant-system)
11. [Coach Agent (Conversational Editing)](#11-coach-agent-conversational-editing)
12. [Snapping & Element Manipulation](#12-snapping--element-manipulation)
13. [Export & Sharing](#13-export--sharing)
14. [Analysis-to-Deck Flywheel](#14-analysis-to-deck-flywheel)
15. [Content Ingestion Pipeline](#15-content-ingestion-pipeline)
16. [Present Mode](#16-present-mode)
17. [Billing & Credits](#17-billing--credits)
18. [Database Migrations](#18-database-migrations)
19. [API Contracts](#19-api-contracts)
20. [Implementation Phases](#20-implementation-phases)
21. [Technology Decisions](#21-technology-decisions)
22. [Testing Strategy](#22-testing-strategy)
23. [Risk Analysis](#23-risk-analysis)
24. [Out of Scope](#24-out-of-scope)

---

## 1. Problem & Opportunity

### The Problem

Pitchr's current deck generation is a one-shot PDF pipeline: user enters company name + description → LLM generates 8 slides → `@react-pdf/renderer` produces a static PDF. Users cannot edit slides, there is no narrative planning, no conversational iteration, no PPTX export, and no connection between pitch analysis results and deck generation.

### The Opportunity

Pitchr has a unique advantage no competitor possesses: **a pitch analysis engine that scores, identifies weaknesses, and suggests fixes**. By connecting this analysis to deck generation, we create a flywheel:

1. User records/pastes pitch → Pitchr scores it (e.g., 62/100)
2. Pitchr identifies weaknesses ("evidence score: 35/100 — no concrete metrics on slide 3")
3. User clicks "Generate Deck" → system pre-populates with analysis insights
4. AI builds a deck that **specifically addresses the identified weaknesses**
5. User can re-analyze the deck content as a new pitch → score improves

No competitor (Chronicle, Gamma, Beautiful.ai, Pitch.com) has this feedback loop. It creates lock-in, data advantage, and a clear upsell path.

### Success Criteria

- A user can generate a deck from text, URL, PDF, or previous Pitchr analysis
- The generation pipeline uses narrative planning (storyline stage) before content writing
- Users can edit slides in-browser with inline text editing and component manipulation
- Themes can be switched instantly with chapter-level preset control
- Decks can be exported as PDF, PPTX, and shareable web links
- The Coach Agent provides conversational editing informed by Pitchr analysis scores
- Deck generation costs 2-5 credits (tiered by input complexity)

---

## 2. Product Vision

### Short-term (this PRD, ~10 weeks)

Build an interactive deck editor with AI-powered narrative generation, inline editing, theme system, and multi-format export. DOM-based rendering (HTML/CSS + React).

### Medium-term (v2, ~Q3 2026)

Add AI image generation, data visualizations (charts), and Konva.js canvas editing for freeform element positioning. Add remix feature (64+ layout variations per slide).

### Long-term (v3, ~Q4 2026+)

Real-time collaboration (Yjs), investor CRM integration (track deck views), animated transitions, and advanced present mode (peek/deep hover).

---

## 3. Competitive Landscape

### Chronicle AI (Primary Target)

- **$7.5M seed** (Accel, Square Peg), 5,000+ teams, 100K+ waitlisted at beta launch
- **Key differentiators:** Storyline Stage (narrative planning before slide generation), Muse Agent (conversational iteration), freeform widget canvas, 150+ pre-built widgets, 64+ remix layout options, Peek/Deep Hover present mode
- **Output quality:** 85-90% client-ready
- **Weaknesses:** High learning curve (4-6 hrs), expensive token-based pricing, no pitch analysis feedback loop

### Gamma

- **250M+ presentations generated**, card-based scrollable format
- **Key differentiators:** Speed of creation, Agent editing (per-slide or whole-deck), slash commands, web-native output
- **Weaknesses:** Outputs feel generic, PPT export loses fidelity, not designed for formal investor presentations

### Beautiful.ai

- **Key differentiators:** 300+ Smart Slides with constraint-based auto-layout, design quality floor enforced automatically
- **Weaknesses:** Less creative freedom, limited AI content generation

### Pitch.com

- **Key differentiators:** Real-time collaboration, per-slide assignees, inline element editors
- **Weaknesses:** Limited AI features, traditional editing paradigm

### Pitchr's Unfair Advantage

| Capability | Chronicle | Gamma | Beautiful.ai | Pitchr (planned) |
|---|---|---|---|---|
| Pitch analysis scoring | No | No | No | **Yes (existing)** |
| Analysis → deck generation | No | No | No | **Yes (unique)** |
| Weakness-aware content | No | No | No | **Yes (unique)** |
| Speaker notes as first-class | No | Partial | No | **Yes** |
| Confidence scoring per slide | No | No | No | **Yes** |
| Narrative framework selection | Yes | No | No | **Yes** |
| Conversational editing | Yes (Muse) | Yes (Agent) | Partial | **Yes (Coach)** |

---

## 4. What Exists Today

### Working Infrastructure

| Component | Files | Status |
|---|---|---|
| **Types** | `types/deckGeneration.ts` | 8 slide types, 5 layout hints, 4 templates |
| **Templates** | `config/deckTemplates.ts` | 4 visual presets (minimal-dark, corporate-clean, bold-gradient, startup-fresh) |
| **Generation service** | `services/deckGenerationService.ts` | Single LLM call → JSON → PDF render → Supabase upload |
| **Prompt engineering** | `lib/prompts/deckGeneration.ts` | ~1000 lines, narrative arc guidance, quality rules, repair prompt |
| **PDF rendering** | `views/components/deck-pdf/` | 7 slide components (Title, Content, Metrics, Comparison, Team, Ask, Market) using `@react-pdf/renderer` |
| **API route** | `app/api/deck/generate/route.ts` | POST endpoint, 2 credits, billing integration |
| **Edge functions** | `supabase/functions/deck-{list,detail,upload}/` | CRUD operations |
| **Database** | `supabase/migrations/` | `decks` + `slides` tables |
| **UI modal** | `views/components/GenerateDeckModal.tsx` | Template picker, form, generation progress overlay |
| **Deck manager** | `views/components/ProjectDeckManager.tsx` | Upload, list, delete, download |
| **LLM router** | `lib/llm/router.ts` | Claude primary, Gemini fallback |

### What's Missing

1. No narrative planning stage (goes straight to generation)
2. No conversational editing (regenerate entire deck or nothing)
3. No interactive web preview (only PDF output)
4. No freeform/inline editing (template-locked layouts)
5. No image/visual generation (text-only slides)
6. No PPTX export (PDF only)
7. No multi-source content ingestion (only company name + description)
8. No slide-level editing (all-or-nothing generation)
9. No feedback loop (analysis results don't inform deck generation)
10. No theme system beyond the 4 static template configs
11. No component variant/transform system

---

## 5. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                            │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  Input     │  │ Storyline  │  │  Slide    │  │  Export &     │  │
│  │  Wizard    │  │  Planner   │  │  Editor   │  │  Share        │  │
│  └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └──────┬────────┘  │
└────────┼───────────────┼───────────────┼───────────────┼────────────┘
         │               │               │               │
┌────────┼───────────────┼───────────────┼───────────────┼────────────┐
│        ▼               ▼               ▼               ▼            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                DECK ORCHESTRATOR (API Route)                 │   │
│  │   Manages generation pipeline, state, and agent routing      │   │
│  └──────┬──────────┬──────────┬──────────┬─────────────────────┘   │
│         │          │          │          │                          │
│  ┌──────▼───┐ ┌────▼────┐ ┌──▼─────┐ ┌─▼──────────┐              │
│  │ Research │ │Narrative│ │Content │ │  Design    │              │
│  │  Agent   │ │  Agent  │ │ Agent  │ │  Agent     │              │
│  └──────────┘ └─────────┘ └────────┘ └────────────┘              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                 COACH AGENT (Chat Interface)                 │   │
│  │   Conversational editing, refinement, pitch coaching         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           BACKEND                                  │
└────────────────────────────────────────────────────────────────────┘
         │               │               │               │
┌────────▼───────────────▼───────────────▼───────────────▼────────────┐
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Supabase │  │  Claude   │  │  Stock   │  │  PptxGenJS /      │  │
│  │ Storage  │  │  API      │  │  Photos  │  │  @react-pdf       │  │
│  └──────────┘  └───────────┘  └──────────┘  └───────────────────┘  │
│                        INFRASTRUCTURE                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Generation

```
User Input (text/URL/PDF/analysis)
    │
    ▼
Research Agent ──→ Company Brief (structured JSON)
    │
    ▼
Narrative Agent ──→ Storyline (ordered slides with narrative purpose + connectors)
    │                    │
    │            User reviews/edits storyline
    │                    │
    ▼                    ▼
Content Agent ──→ Enhanced slides (content + speaker notes + confidence)
    │
    ▼
Design Agent ──→ Design manifest (layouts + visual hierarchy + data viz)
    │
    ▼
Review Agent ──→ Quality gate (score + pass/fail + targeted fixes)
    │                    │
    │           (if fails: loop back to Content Agent, max 2x)
    │                    │
    ▼                    ▼
Slide Editor ──→ Interactive web preview with inline editing
    │
    ▼
Export Pipeline ──→ PDF / PPTX / Web Link
```

### Data Flow: Editing

```
User types in Coach chat: "Make the traction slide more impressive"
    │
    ▼
Coach Agent:
  1. Parse intent → { type: 'rewrite_slide', slideIndex: 3, guidance: 'enhance impact' }
  2. Load context → current slide content + Company Brief + Pitchr analysis scores
  3. Generate edit → rewritten headline + reordered bullets + stronger callout
  4. Return diff → before/after with explanation
    │
    ▼
UI shows diff preview → User accepts/rejects → Slide updates in place
```

### Rendering Architecture: Dual Renderer

```
               ┌─────────────────┐
               │   Slide Data    │
               │   (JSON)        │
               └────────┬────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
  ┌────────────┐  ┌──────────────┐  ┌──────────┐
  │  Web       │  │  PDF Export  │  │  PPTX    │
  │  Preview   │  │  (@react-   │  │  Export   │
  │  (React +  │  │   pdf)      │  │  (Pptx   │
  │  Tailwind) │  │              │  │  GenJS)  │
  └────────────┘  └──────────────┘  └──────────┘
```

All three renderers consume the same `Slide` data model. The web preview is the primary editing surface. PDF and PPTX are export-only renderers.

---

## 6. Data Model

### 6.1 Core Interfaces

```typescript
// ─── Top Level ───

interface Deck {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  theme: ThemeScope;
  chapters: Chapter[];
  metadata: {
    aspectRatio: '16:9' | '4:3';
    slideCount: number;
    generatedBy: 'ai' | 'manual' | 'template' | 'analysis';
    sourceRunId?: string;       // Pitchr analysis run that seeded this deck
    narrativeFramework?: NarrativeFramework;
  };
}

// ─── Theme Scope ───

interface ThemeScope {
  themeId: string;                           // references a DeckTheme
  defaultPreset: string;                     // "neutral-light"
  chapterPresets: Record<string, string>;    // chapterId → presetId
  slideOverrides: Record<string, SlideStyleOverride>;
}

interface SlideStyleOverride {
  backgroundType?: 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  tokenOverrides?: Partial<ChapterPresetColors>;
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
  rootComponent: ComponentInstance;
  transition?: SlideTransition;
  speakerNotes?: string;
  duration?: number;                          // suggested duration in seconds
  confidenceLevel?: 'high' | 'medium' | 'low';
  narrativeConnector?: string;                // "And the reason nobody's fixed this is..."
}

interface SlideTransition {
  type: 'none' | 'fade' | 'slide-left' | 'slide-up' | 'dissolve';
  duration: number;                           // ms
}

// ─── Component Instance ───

interface ComponentInstance {
  id: string;
  type: string;                               // registered component type
  variants: Record<string, string>;           // { direction: "horizontal", size: "large" }
  content: ComponentContent;                  // superset content model
  children?: ComponentInstance[];              // for container/grid types
  position?: LayoutPosition;                  // position within parent
}

interface LayoutPosition {
  // Grid children
  gridColumn?: number;
  gridRow?: number;
  gridColumnSpan?: number;
  gridRowSpan?: number;
  // Freeform (v2/v3 canvas mode)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

// ─── Content (Notion-style superset) ───

interface ComponentContent {
  // Text fields (heading, paragraph, card, callout, sticky-note)
  title?: string;
  body?: string;
  caption?: string;

  // Media fields (image, video, card, mockup)
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'embed';
  mediaAlt?: string;
  mediaThumbnail?: string;

  // Data fields (chart, metric-card, comparison)
  dataPoints?: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area';

  // List fields (card with bullets, comparison, checklist)
  items?: Array<{
    text: string;
    detail?: string;
    icon?: string;
    checked?: boolean;
  }>;

  // Callout fields (metric-card, callout, big-number)
  calloutValue?: string;
  calloutLabel?: string;

  // Embed fields (embed, mockup)
  embedUrl?: string;
  embedType?: 'iframe' | 'link-preview' | 'mockup-frame';

  // Layout-specific (grid containers)
  columns?: number;
}
```

### 6.2 Agent Output Interfaces

```typescript
// ─── Research Agent Output ───

interface CompanyBrief {
  company: {
    name: string;
    oneLiner: string;
    stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth';
    founded?: string;
  };
  problem: {
    painPoints: string[];
    quantifiedCost?: string;
    affectedAudience: string;
    existingAlternatives: string[];
  };
  solution: {
    mechanism: string;
    keyDifferentiator: string;
    evidence: string[];
  };
  traction: {
    metrics: Array<{ name: string; value: string; trend?: string }>;
    customers?: number;
    revenue?: string;
    growth?: string;
  };
  market: {
    tam?: string;
    sam?: string;
    som?: string;
    competitors: Array<{ name: string; strength: string; weakness: string }>;
  };
  businessModel: {
    revenueModel: string;
    pricing?: string;
    unitEconomics?: { cac?: string; ltv?: string; payback?: string };
  };
  team: Array<{
    name: string;
    role: string;
    credential: string;
  }>;
  fundraising: {
    amount?: string;
    useOfFunds?: Array<{ category: string; percentage: number; detail: string }>;
    milestones?: string[];
  };
  // Pitchr analysis data (unique differentiator)
  pitchrInsights?: {
    overallScore?: number;
    weakestCategories?: string[];
    topFixes?: string[];
    rewrittenScript?: string;
  };
}

// ─── Narrative Agent Output ───

type NarrativeFramework =
  | 'problem-solution-proof'   // Standard VC pitch
  | 'vision-reality-bridge'    // For visionary founders
  | 'data-first'               // When traction is strongest asset
  | 'underdog';                // When team/insight is the differentiator

interface Storyline {
  framework: NarrativeFramework;
  frameworkRationale: string;
  slides: Array<{
    position: number;
    type: SlideType;
    narrativePurpose: string;     // "Establish urgency by quantifying the pain"
    keyMessage: string;           // "Freight carriers lose $340B/yr to empty miles"
    connector: string;            // "And the reason nobody's fixed this is..."
    suggestedLayout: LayoutHint;
    contentGuidance: string;      // Instructions for Content Agent
    dataPointsToInclude: string[];
  }>;
  overallTone: string;            // "Confident but grounded"
  audienceAssumptions: string;    // "Series A partner meeting, 30-min slot"
}

// ─── Content Agent Output ───

interface EnhancedSlide extends GeneratedSlide {
  speakerNotes?: string;
  narrativeConnector?: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  suggestedVisual?: string;       // "Bar chart showing MoM growth"
}

// ─── Design Agent Output ───

interface DesignManifest {
  slides: Array<{
    slideIndex: number;
    layout: LayoutHint;
    visualHierarchy: {
      primary: 'headline' | 'callout' | 'chart' | 'image';
      secondary: 'bullets' | 'subheadline' | 'comparison';
    };
    dataVisualization?: {
      type: 'bar' | 'line' | 'pie' | 'metric-card' | 'comparison-table';
      data: Record<string, unknown>;
    };
    imagePrompt?: string;
    colorOverrides?: Partial<ChapterPresetColors>;
  }>;
}

// ─── Review Agent Output ───

interface DeckReview {
  overallScore: number;           // 0-100
  passesQualityGate: boolean;     // >= 75
  slideReviews: Array<{
    slideIndex: number;
    score: number;
    issues: string[];
    fixInstructions: string;
  }>;
}

// ─── Coach Agent ───

type CoachAction =
  | { type: 'rewrite_slide'; slideIndex: number; guidance: string }
  | { type: 'rewrite_section'; slideIndex: number; section: 'headline' | 'bullets' | 'callout'; guidance: string }
  | { type: 'adjust_tone'; scope: 'deck' | 'slide'; slideIndex?: number; tone: string }
  | { type: 'add_slide'; afterIndex: number; slideType: SlideType; guidance: string }
  | { type: 'remove_slide'; slideIndex: number }
  | { type: 'reorder_slides'; newOrder: number[] }
  | { type: 'change_template'; templateId: string }
  | { type: 'answer_question'; question: string }
  | { type: 'pitch_coaching'; feedback: string };
```

### 6.3 Backward Compatibility

The new `Slide` model is a superset of the current `GeneratedSlide`. Migration function:

```typescript
function migrateGeneratedSlide(slide: GeneratedSlide): Slide {
  return {
    id: generateId(),
    chapterId: '',
    position: 0,
    rootComponent: {
      id: generateId(),
      type: mapSlideTypeToLayoutType(slide.type, slide.layout_hint),
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
```

Existing stored decks in the `slides` table continue working — the `text` column holds extracted text. The new `component_tree` JSONB column is nullable, allowing gradual migration. The web editor only activates for decks that have `component_tree` populated.

---

## 7. Multi-Agent Generation Pipeline

### 7.1 Agent Overview

| Agent | Purpose | Model | Temperature | Input | Output |
|---|---|---|---|---|---|
| **Research** | Extract structured company data | `claude-sonnet-4-6` | 0.2 | Text/URL/PDF/analysis | `CompanyBrief` |
| **Narrative** | Design story arc and slide structure | `claude-sonnet-4-6` | 0.5 | `CompanyBrief` + pitch type + slide count | `Storyline` |
| **Content** | Write slide content following storyline | `claude-sonnet-4-6` | 0.4 | `CompanyBrief` + `Storyline` | `EnhancedSlide[]` |
| **Design** | Select layouts and visual treatments | Rule-based (v1) | N/A | `EnhancedSlide[]` + template | `DesignManifest` |
| **Review** | Quality gate with repair loop | `claude-sonnet-4-6` | 0.2 | Full deck + `CompanyBrief` | `DeckReview` |

### 7.2 Pipeline Flow

```
Input → Research Agent → Narrative Agent → [User edits storyline] → Content Agent
                                                                         │
                                                                         ▼
                                                              Design Agent (rule-based)
                                                                         │
                                                                         ▼
                                                              Review Agent
                                                                         │
                                                              ┌──────────┤
                                                              │ pass     │ fail (max 2x)
                                                              ▼          ▼
                                                           Output    Content Agent
                                                                    (targeted fix)
```

### 7.3 Agent Routing (Cost Control)

Not every generation needs the full 5-agent pipeline:

| Mode | Trigger | Agents Used | Estimated LLM Calls | Credits |
|---|---|---|---|---|
| **Quick** | Simple text description, <200 words | Research (light) → Content → Design | 2 | 2 |
| **Full** | Rich input, uploaded docs, or analysis data | All 5 agents | 4-6 | 3 |
| **From Analysis** | "Generate Deck" from results page | Research (pre-populated) → Narrative → Content → Design → Review | 4-5 | 3 |
| **Refresh** | Editing existing deck via Coach | Coach Agent only | 1 per edit | 0 (included) |

### 7.4 Streaming UX

Generation streams progress to the frontend:

```
Step 1: "Researching your company..."        (Research Agent, ~3s)
Step 2: "Designing your story arc..."         (Narrative Agent, ~4s → show storyline for user review)
Step 3: "Writing slide 1 of 8..."            (Content Agent, ~2s per slide, show each as it completes)
Step 4: "Applying design intelligence..."    (Design Agent, ~1s)
Step 5: "Reviewing quality..."              (Review Agent, ~3s)
Step 6: "Your deck is ready!"
```

Implementation: Use Server-Sent Events (SSE) from the generation API route. The frontend subscribes and updates a progress stepper component.

### 7.5 Structured Output

All agent outputs use Zod schemas with Claude's structured output mode (`output_config.format: "json_schema"`). This replaces the current "parse and pray" pattern in `deckGenerationService.ts`.

```typescript
import { z } from 'zod';

const StorylineSchema = z.object({
  framework: z.enum(['problem-solution-proof', 'vision-reality-bridge', 'data-first', 'underdog']),
  frameworkRationale: z.string(),
  slides: z.array(z.object({
    position: z.number(),
    type: z.enum(['hook', 'problem', 'solution', 'traction', 'market', 'business_model', 'team', 'ask']),
    narrativePurpose: z.string(),
    keyMessage: z.string(),
    connector: z.string(),
    suggestedLayout: z.enum(['centered', 'two-column', 'comparison', 'cards', 'big-number']),
    contentGuidance: z.string(),
    dataPointsToInclude: z.array(z.string()),
  })),
  overallTone: z.string(),
  audienceAssumptions: z.string(),
});
```

### 7.6 File Structure

```
services/deckAgents/
  orchestrator.ts               # Pipeline coordinator
  researchAgent.ts              # Company Brief extraction
  narrativeAgent.ts             # Storyline generation
  contentAgent.ts               # Per-slide content writing
  designAgent.ts                # Layout selection (rule-based v1)
  reviewAgent.ts                # Quality gate
  types.ts                      # Agent-specific interfaces
lib/prompts/deckAgents/
  research.ts                   # Research Agent system + user prompts
  narrative.ts                  # Narrative Agent system + user prompts
  content.ts                    # Content Agent system + user prompts
  review.ts                     # Review Agent system + user prompts
  coach.ts                      # Coach Agent system + user prompts
```

---

## 8. Slide Editor

### 8.1 Overview

A web-based slide editor rendered with React + Tailwind. DOM-based (not Canvas) for v1. Each slide is a 16:9 container with positioned component instances.

### 8.2 Editor Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Top Bar: Deck Title | Chapter X of Y | Share | Export | Present    │
├──────────┬──────────────────────────────────────────┬──────────────┤
│          │                                          │              │
│  Slide   │                                          │   Coach      │
│  Nav     │          SLIDE CANVAS                    │   Chat       │
│  (left   │          (16:9, scaled)                  │   Panel      │
│  sidebar │                                          │   (right     │
│  with    │     ┌──────────────────────────┐         │   sidebar,   │
│  chapter │     │   Floating Toolbar       │         │   collaps-   │
│  groups) │     │   (appears on selection) │         │   ible)      │
│          │     └──────────────────────────┘         │              │
│          │                                          │              │
│          │     ┌──────────────────────────┐         │              │
│          │     │   Snap Guide Overlay     │         │              │
│          │     │   (z-index: 50)          │         │              │
│          │     └──────────────────────────┘         │              │
│          │                                          │              │
│          │     ┌──────────────────────────┐         │              │
│          │     │   Selection Handles      │         │              │
│          │     │   (z-index: 60)          │         │              │
│          │     └──────────────────────────┘         │              │
│          │                                          │              │
├──────────┴──────────────────────────────────────────┴──────────────┤
│ Bottom Toolbar: + Insert | Remix (v2) | Theme | Background | ...  │
└───────────────────────────────────────────────────────────────────┘
```

### 8.3 Editor Components

| Component | File | Purpose |
|---|---|---|
| `DeckEditor` | `views/components/deck-editor/DeckEditor.tsx` | Root editor container, state management, keyboard shortcuts |
| `SlideCanvas` | `deck-editor/SlideCanvas.tsx` | 16:9 scaled container, click-to-deselect, snap guide overlay |
| `SlideNavigator` | `deck-editor/SlideNavigator.tsx` | Left sidebar with chapter groups, slide thumbnails, drag-to-reorder |
| `WidgetRenderer` | `deck-editor/WidgetRenderer.tsx` | Dispatch component → maps `type` to React renderer |
| `DraggableElement` | `deck-editor/DraggableElement.tsx` | Wraps each component with drag, resize, selection handles |
| `FloatingToolbar` | `deck-editor/FloatingToolbar.tsx` | Context-sensitive formatting toolbar (appears above selected element) |
| `BottomToolbar` | `deck-editor/BottomToolbar.tsx` | Persistent: Insert, Theme, Background, more |
| `InsertPanel` | `deck-editor/InsertPanel.tsx` | Grid of insertable component types |
| `ThemePanel` | `deck-editor/ThemePanel.tsx` | Theme switcher, chapter preset picker, scope toggle |
| `CoachChat` | `deck-editor/CoachChat.tsx` | Right sidebar chat with Coach Agent |
| `EditDiffPreview` | `deck-editor/EditDiffPreview.tsx` | Before/after diff for Coach suggestions |
| `SnapGuideOverlay` | `deck-editor/SnapGuideOverlay.tsx` | Alignment guide lines during drag |
| `SpeakerNotesPanel` | `deck-editor/SpeakerNotesPanel.tsx` | Per-slide speaker notes editor |

### 8.4 Interaction Patterns

| Action | Trigger | Behavior |
|---|---|---|
| Select element | Single click | Show resize handles + floating toolbar |
| Edit text | Double click | Enter inline editing mode (`contentEditable`) |
| Deselect | Click canvas background | Remove all selection |
| Move element | Click + drag | Pointer events, snap guides appear, position corrected to snaps |
| Resize element | Drag corner/edge handle | Maintain aspect ratio (corner), free resize (edge), snap to guides |
| Multi-select | Shift+click or drag rectangle | Select multiple elements |
| Delete | Delete/Backspace key | Remove selected element(s) |
| Duplicate | Cmd+D | Duplicate selected element(s) |
| Undo/Redo | Cmd+Z / Cmd+Shift+Z | Immutable history stack |
| Copy/Paste | Cmd+C/V | Copy element data, paste at cursor position |
| Nudge | Arrow keys | Move 1px (or 10px with Shift) |
| Insert | Bottom toolbar "+" or "/" key | Open insert panel |
| Tab | Tab key | Cycle through elements on current slide |
| Escape | Esc key | Exit text editing or deselect |

### 8.5 State Management

Zustand store for deck editor state with undo/redo:

```typescript
interface DeckEditorState {
  // Data
  deck: Deck;
  selectedElementIds: string[];
  activeSlideId: string;

  // History (immutable snapshots)
  history: Deck[];
  historyIndex: number;

  // UI state
  isEditing: boolean;           // text editing mode
  activePanel: 'insert' | 'theme' | 'coach' | null;
  snapGuides: GuideLineData[];
  spacingGuides: SpacingGuide[];
  zoom: number;

  // Actions
  updateComponent: (slideId: string, componentId: string, updates: Partial<ComponentInstance>) => void;
  updateContent: (slideId: string, componentId: string, field: keyof ComponentContent, value: unknown) => void;
  updateVariant: (slideId: string, componentId: string, property: string, value: string) => void;
  transformComponent: (slideId: string, componentId: string, targetType: string) => void;
  addComponent: (slideId: string, parentId: string, component: ComponentInstance) => void;
  removeComponent: (slideId: string, componentId: string) => void;
  moveComponent: (slideId: string, componentId: string, position: LayoutPosition) => void;

  addSlide: (chapterId: string, afterPosition: number) => void;
  removeSlide: (slideId: string) => void;
  reorderSlides: (slideIds: string[]) => void;
  duplicateSlide: (slideId: string) => void;

  setTheme: (themeId: string) => void;
  setChapterPreset: (chapterId: string, presetId: string) => void;
  setSlideOverride: (slideId: string, override: SlideStyleOverride) => void;

  undo: () => void;
  redo: () => void;

  setSelection: (ids: string[]) => void;
  setActiveSlide: (slideId: string) => void;
}
```

### 8.6 Page Routes

```
app/(app)/deck/create/page.tsx             # Input wizard (text, URL, PDF, analysis)
app/(app)/deck/create/storyline/page.tsx   # Storyline review/edit before generation
app/(app)/deck/[deckId]/edit/page.tsx      # Full slide editor
app/(app)/deck/[deckId]/present/page.tsx   # Present mode (fullscreen)
app/(public)/deck/[deckId]/page.tsx        # Public shareable view
```

---

## 9. Theme System

### 9.1 Architecture

CSS custom properties with `data-theme` and `data-preset` attributes. Theme changes are instant (single-frame CSS cascade update, no React re-renders for color changes).

```
[data-theme="retro-tech"]                    ← document-level (primitives)
  [data-chapter="intro"]                     ← chapter grouping
    [data-preset="neutral-light"]            ← chapter preset (semantic tokens)
      [data-slide-id="slide-1"]              ← individual slide
        [data-slide-bg-override="..."]       ← per-slide override
```

### 9.2 DeckTheme Interface

```typescript
interface DeckTheme {
  id: string;
  name: string;
  primitives: {
    colors: {
      neutral: ColorScale;       // 50-950 (Tailwind-style)
      accent: ColorScale;
      secondary: ColorScale;
      success: string;
      warning: string;
      error: string;
    };
    typography: {
      fontFamilies: {
        display: string;         // e.g., "Inter", "Playfair Display"
        body: string;
        mono: string;
      };
      fontSizes: Record<FontSizeToken, number>;
      fontWeights: Record<FontWeightToken, number>;
      lineHeights: Record<LineHeightToken, number>;
    };
    spacing: Record<SpaceToken, number>;
    radii: Record<RadiusToken, number>;
    shadows: Record<ShadowToken, string>;
  };
  chapterPresets: {
    'neutral-light': ChapterPreset;
    'neutral-dark': ChapterPreset;
    'accent': ChapterPreset;
    [custom: string]: ChapterPreset;
  };
  defaultPreset: string;
}

interface ChapterPreset {
  id: string;
  name: string;
  colorDot: string;                 // CSS color for UI indicator
  colors: ChapterPresetColors;
  typography?: {
    headlineWeight?: number;
    bodyWeight?: number;
  };
}

interface ChapterPresetColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  accent: string;
  accentHover: string;
  border: string;
  borderSubtle: string;
}

interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}
```

### 9.3 Migration from Existing Templates

Each current `TemplateId` becomes a `DeckTheme` with a single chapter preset. The new system is a strict superset:

| Current `DeckTemplate` field | New system mapping |
|---|---|
| `colors.background` | `ChapterPreset.colors.background` |
| `colors.text` | `ChapterPreset.colors.text` |
| `colors.accent` | `ChapterPreset.colors.accent` |
| `fonts.headline` | `DeckTheme.primitives.typography.fontFamilies.display` |
| `fonts.body` | `DeckTheme.primitives.typography.fontFamilies.body` |
| `layout.padding` | `DeckTheme.primitives.spacing['8']` |
| `layout.calloutStyle` | Component variant on Callout widget |

### 9.4 Initial Themes

Migrate existing 4 templates + add 4 new themes:

| Theme | Vibe | Chapter Presets |
|---|---|---|
| `minimal-dark` (existing) | Sleek, modern | Dark only |
| `corporate-clean` (existing) | Professional | Light only |
| `bold-gradient` (existing) | Confident | Dark only |
| `startup-fresh` (existing) | Approachable | Light only |
| `pitch-pro` (new) | Investor-grade | Light, Dark, Accent |
| `founder-night` (new) | Dark mode premium | Dark, Accent |
| `demo-day` (new) | Stage-ready, bold | Light, Dark, Accent |
| `clean-slate` (new) | Minimal, content-first | Light, Dark |

### 9.5 Theme Panel UI

- **Theme dropdown:** Named themes with preview swatch
- **Chapter presets:** Neutral Light / Neutral Dark / Accent — each with color dot + "Aa" preview
- **Scope toggle:** "This chapter" vs "Whole document"
- **Background customization:** Color, gradient, or image per slide

---

## 10. Component & Variant System

### 10.1 Component Type Registry

```typescript
interface ComponentTypeDefinition {
  type: string;
  label: string;
  icon: string;
  category: 'text' | 'media' | 'data' | 'layout' | 'interactive';
  variantSchema: ComponentVariantSchema;
  contentFields: Array<{
    field: keyof ComponentContent;
    required: boolean;
    label: string;
    editor: 'text' | 'richtext' | 'media' | 'data' | 'embed' | 'items';
  }>;
  defaultContent: Partial<ComponentContent>;
  defaultVariants: Record<string, string>;
  transformTargets: string[];
}

interface ComponentVariantSchema {
  componentType: string;
  variantProperties: Array<{
    name: string;
    type: 'enum';
    options: string[];
    default: string;
    label: string;
  }>;
}
```

### 10.2 Component Types (v1)

**Text Components:**

| Type | Variants | Content Fields |
|---|---|---|
| `heading` | size: h1/h2/h3, align: left/center/right | title |
| `paragraph` | size: sm/base/lg, align: left/center/right | body |
| `quote` | style: default/large/attributed | body, caption |
| `callout` | style: card/pill/banner, color: accent/neutral/success | calloutValue, calloutLabel |

**Media Components:**

| Type | Variants | Content Fields |
|---|---|---|
| `image` | fit: cover/contain, corners: square/rounded/circle | mediaUrl, mediaAlt, caption |

**Data Components:**

| Type | Variants | Content Fields |
|---|---|---|
| `metric-card` | size: sm/md/lg, style: default/accent/outlined | calloutValue, calloutLabel, caption |
| `comparison` | columns: 2/3, style: table/cards | title, items |

**Layout Components (containers):**

| Type | Variants | Content Fields |
|---|---|---|
| `card` | direction: vertical/horizontal, size: sm/md/lg, style: default/outlined/accent/minimal | title, body, items, mediaUrl |
| `grid` | columns: 1/2/3/4, gap: sm/md/lg | children (ComponentInstance[]) |
| `split` | ratio: 50-50/60-40/40-60, direction: left-right/right-left | children (2 ComponentInstance[]) |
| `stack` | gap: sm/md/lg, align: start/center/stretch | children (ComponentInstance[]) |

### 10.3 "Turn Into" Transformation

Content-preserving type transformation using the Notion superset pattern:

```typescript
// Switching type is a single state update — content persists silently
function transformComponent(component: ComponentInstance, targetType: string): ComponentInstance {
  const rule = TRANSFORM_REGISTRY.get(`${component.type}→${targetType}`);

  return {
    ...component,
    type: targetType,
    variants: {},  // Reset — new type has its own variant space
    content: {
      ...component.content,        // Keep ALL original fields (Notion pattern)
      ...(rule?.mappedContent ?? {}), // Apply field mappings
    },
  };
}
```

**Transformation matrix (v1):**

| From → To | paragraph | heading | card | callout | metric-card |
|---|---|---|---|---|---|
| **paragraph** | — | title | title+body | body | — |
| **heading** | title→body | — | title | title | — |
| **card** | title+body | title | — | callout | callout |
| **callout** | value+label | value | value+label | — | direct |
| **metric-card** | value+label | value | value+label | direct | — |

### 10.4 Variant Switching in UI

Floating toolbar shows variant dropdowns for the selected component:

```
┌─────────────────────────────────────────────────────┐
│ [Card ▾]  [Vertical ▾]  [Medium ▾]  [Default ▾]   │
│  type      direction      size        style         │
│                                                     │
│ [Turn into ▾]  [B] [I] [Color ▾] [Align ▾]        │
│  transform     formatting                           │
└─────────────────────────────────────────────────────┘
```

Switching a variant is a single state update: `{ ...component, variants: { ...component.variants, direction: 'horizontal' } }`.

---

## 11. Coach Agent (Conversational Editing)

### 11.1 Overview

The Coach Agent combines Chronicle's "Muse" editing agent with Pitchr's pitch analysis intelligence. It lives in a collapsible right sidebar chat panel alongside the slide editor.

### 11.2 Capabilities

| Capability | Example User Message | Agent Response |
|---|---|---|
| Rewrite slide | "Make the traction slide more impressive" | Returns rewritten headline, bullets, callout with before/after diff |
| Adjust tone | "Less corporate, more human" | Rewrites selected slide or whole deck with adjusted tone |
| Add slide | "Add a competitive advantage slide after the market slide" | Generates new slide content positioned in the storyline |
| Pitch coaching | "Why does my market slide feel weak?" | References Pitchr analysis scores, explains weaknesses, suggests specific fixes |
| Answer question | "What should I put on a team slide with only 2 founders?" | Provides strategic advice informed by pitch coaching knowledge |
| Change narrative | "Lead with traction instead of the problem" | Suggests reordered storyline with updated narrative connectors |

### 11.3 Pitch Coaching Integration (Unique Moat)

The Coach has access to Pitchr's rubric scores and analysis:

```
User: "Why does my traction slide feel weak?"
Coach: "Your traction slide scores 42/100 on evidence. It says 'growing fast'
        but doesn't quantify. Here's what I'd change:

        Before: 'Growing fast with strong user engagement'
        After:  '3,200 active users, 47% MoM growth, 89% D30 retention'

        The specific numbers turn a claim into proof. Want me to apply this?"
```

### 11.4 UI Pattern

- **Accept/Reject per suggestion:** Each Coach response that includes content changes shows a diff preview with Accept/Reject buttons
- **Chat history persists** for the editing session
- **Scope awareness:** Coach knows which slide is currently selected and focuses suggestions there
- **Keyboard shortcut:** Cmd+/ to toggle Coach panel

### 11.5 API

```
POST /api/deck/coach
  Body: {
    deckId: string;
    message: string;
    activeSlideId?: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
  Response: {
    message: string;
    suggestedEdits?: Array<{
      slideId: string;
      field: string;
      before: string;
      after: string;
    }>;
    action?: CoachAction;
  }
```

---

## 12. Snapping & Element Manipulation

### 12.1 Overview

Smart snapping guides appear when dragging or resizing elements, showing alignment with other elements, slide center, and margins. Based on Konva.js's documented algorithm pattern, implemented as pure functions.

### 12.2 Snap Types

| Type | Priority | Description |
|---|---|---|
| Element edge-to-edge | 1 (highest) | Align edges of dragged element to edges of other elements |
| Element center-to-center | 2 | Align centers of elements |
| Slide margins | 3 | Snap to configurable slide margins (default 5% of slide width) |
| Slide center | 4 | Center on the slide |
| Equal spacing | 5 | Equal gaps between 3+ elements |
| Grid | 6 (lowest) | Optional 10px grid (togglable) |

**Threshold:** 5px (standard across PowerPoint, Keynote, Konva).

### 12.3 Visual Guide Rendering

- **Alignment guides:** 1px solid lines, blue (`rgb(0, 161, 255)`) for edges, red (`rgb(255, 0, 85)`) for centers
- **Margin guides:** Dashed blue lines
- **Spacing indicators:** Double-headed arrows with distance labels between element gaps
- **Overlay layer:** Absolute-positioned div at z-index 50, pointer-events: none

### 12.4 Implementation

Pure functions in `lib/snapping/` — rendering-agnostic, works for both DOM (v1) and future Konva canvas (v2):

```
lib/snapping/
  types.ts              # SnapPoint, SnapMatch, SnapResult, SpacingGuide
  collectTargets.ts     # collectSnapTargets(elements, skipId, slideDimensions, margins)
  findSnaps.ts          # findSnaps(draggedBounds, targets, threshold)
  findSpacing.ts        # findEqualSpacing(draggedBounds, otherElements, threshold)
  gridSnap.ts           # snapToGrid(position, gridSize)
  index.ts              # Re-exports
```

### 12.5 User Controls

- **Hold Alt/Option during drag:** Temporarily disable all snapping
- **Shift+drag:** Constrain to horizontal or vertical movement only
- **Grid toggle:** In bottom toolbar settings

---

## 13. Export & Sharing

### 13.1 Export Formats

| Format | Library | Purpose | Status |
|---|---|---|---|
| **PDF** | `@react-pdf/renderer` (existing) | Email attachments, printing | Enhance existing |
| **PPTX** | `pptxgenjs` (new) | Editing in PowerPoint/Google Slides/Keynote | New |
| **Web Link** | Next.js page route | Shareable, trackable, interactive | New |

### 13.2 PPTX Export

Add `pptxgenjs` for PowerPoint export. Maps slide data JSON → PptxGenJS API calls:

```typescript
// services/pptxExportService.ts
export async function exportDeckToPptx(
  deck: Deck,
  theme: DeckTheme,
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 16:9

  // Apply theme as slide master
  pptx.defineSlideMaster({
    title: theme.name,
    background: { color: theme.chapterPresets[deck.theme.defaultPreset].colors.background },
  });

  for (const chapter of deck.chapters) {
    for (const slide of chapter.slides) {
      const pptxSlide = pptx.addSlide({ masterName: theme.name });
      renderComponentToPptx(pptxSlide, slide.rootComponent, theme);
    }
  }

  return Buffer.from(await pptx.write({ outputType: 'nodebuffer' }));
}
```

### 13.3 Shareable Web Links

```
/deck/[deckId]/present     # Full-screen presentation mode (keyboard nav)
/deck/[deckId]/view        # Scrollable view with optional speaker notes
```

Features:
- Keyboard navigation (arrow keys, space)
- Progress bar indicator
- View tracking: total views, time per slide, drop-off slide (stored in Supabase)
- Password protection (optional)
- Expiring links (optional)

### 13.4 Export API

```
POST /api/deck/export
  Body: { deckId: string; format: 'pdf' | 'pptx' }
  Response: { downloadUrl: string; expiresAt: string }
```

### 13.5 View Analytics (Supabase)

```typescript
interface DeckViewEvent {
  deckId: string;
  viewerId?: string;
  slideIndex: number;
  dwellTimeMs: number;
  timestamp: string;
  referrer?: string;
}

interface DeckAnalytics {
  totalViews: number;
  uniqueViewers: number;
  avgTimePerSlide: number[];
  dropOffSlide: number;
  completionRate: number;
}
```

---

## 14. Analysis-to-Deck Flywheel

### 14.1 Flow

```
Results Page (/results/[runId])
  └── "Generate Deck from This Analysis" CTA button
       │
       ▼
  buildBriefFromAnalysis(runId)
    - Extract overall score, weakest categories, top fixes, rewritten script
    - Extract company info, traction, market from pitch transcript
    - Pre-populate CompanyBrief with structured analysis data
       │
       ▼
  Deck Builder (/deck/create?fromRun=runId)
    - CompanyBrief is pre-populated (no manual entry needed)
    - Narrative Agent prioritizes fixing weak categories
    - Content Agent uses rewritten script as source material
    - Generated slides directly address identified weaknesses
       │
       ▼
  Finished Deck
    └── "Score This Deck" button
         - Extracts text from all slides
         - Creates new pitch run from deck text
         - Shows improved score vs. original analysis
```

### 14.2 Implementation

```typescript
// services/deckFromAnalysis.ts
export async function buildBriefFromAnalysis(
  runId: string,
  supabase: SupabaseClient,
): Promise<Partial<CompanyBrief>> {
  const run = await fetchRunDetail(supabase, runId);
  const analysis = run.analysis_v2;

  return {
    pitchrInsights: {
      overallScore: analysis.overall_score,
      weakestCategories: analysis.categories
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
        .map(c => c.name),
      topFixes: analysis.ranked_fixes.slice(0, 5).map(f => f.description),
      rewrittenScript: analysis.rewritten_script,
    },
    company: {
      name: run.company_name || 'Unknown',
      oneLiner: extractOneLiner(analysis),
      stage: inferStage(analysis),
    },
    traction: extractTraction(analysis),
  };
}
```

### 14.3 UI Changes

- **Results page:** Add "Generate Deck" CTA below the score hero
- **Deck create page:** "From Analysis" tab pre-selects the latest run
- **Deck editor:** Badge showing "Generated from analysis (score: 62/100)"
- **Deck editor:** "Re-score" button that creates a new pitch run from deck text

---

## 15. Content Ingestion Pipeline

### 15.1 Supported Input Sources

| Source | Method | Parser |
|---|---|---|
| **Text prompt** | Direct input (textarea) | Passthrough to Research Agent |
| **URL** | Paste website URL | Fetch + HTML-to-text extraction (cheerio) |
| **PDF** | File upload | `pdf-parse` (already in stack) |
| **PPTX** | File upload | Existing upload pipeline (LibreOffice → PDF → text extraction) |
| **Pitchr Analysis** | "Generate from analysis" button | Structured JSON from `analysis_v2` column |

### 15.2 Input Wizard UI

```
┌─────────────────────────────────────────┐
│          How would you like to start?    │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │  ✍️  │  │  🔗  │  │  📄  │  │  📊  │ │
│  │Write │  │ URL  │  │Upload│  │From  │ │
│  │ it   │  │      │  │      │  │Score │ │
│  └──────┘  └──────┘  └──────┘  └──────┘ │
│                                          │
│  Company Name: [________________]        │
│                                          │
│  Describe your company and pitch:        │
│  [                                     ] │
│  [                                     ] │
│  [                                     ] │
│                                          │
│  Pitch type: [VC Pitch ▾]               │
│  Slide count: [8 ▾]                     │
│  Framework: [Auto-detect ▾]             │
│  Theme: [Pitch Pro ▾]                   │
│                                          │
│  [Generate Deck]                         │
└─────────────────────────────────────────┘
```

---

## 16. Present Mode

### 16.1 v1 Features

- Full-screen takeover (Cmd+Enter or button)
- Slide-by-slide navigation (arrow keys, space, click)
- Progress bar at bottom
- Slide counter (e.g., "3 / 8")
- Speaker notes panel (presenter view — Cmd+P to toggle)
- Escape to exit
- Dark background around slide content

### 16.2 v2 Features (Future)

- Peek: Hover on element to isolate attention
- Cursor spotlight/highlight
- Timer display
- Audience view via shared link
- Animated transitions between slides

### 16.3 Route

```
app/(app)/deck/[deckId]/present/page.tsx
```

---

## 17. Billing & Credits

### 17.1 Credit Costs

| Action | Credits | Rationale |
|---|---|---|
| Quick deck generation | 2 | Same as current (2 LLM calls) |
| Full deck generation (all agents) | 3 | 4-6 LLM calls but batched |
| Deck from analysis | 3 | Pre-populated brief reduces work |
| Coach edit (per message) | 0 | Included with deck — encourages engagement |
| PPTX export | 0 | Pure computation, no LLM cost |
| PDF export | 0 | Existing functionality |

### 17.2 Resource Type

Add `deck_builder` to the `CreditResource` type for the new generation modes. The existing `deck_generation` resource continues working for backward compatibility.

### 17.3 Plan Limits

| Feature | Free | Day Pass | Pro |
|---|---|---|---|
| Deck generation | 1/period | 5/period | 20/period |
| Coach Agent | Not available | Available | Available |
| PPTX export | Not available | Available | Available |
| Web link sharing | Available (watermark) | Available | Available |
| View analytics | Not available | Not available | Available |

---

## 18. Database Migrations

### 18.1 Extend `decks` Table

```sql
-- Add component tree and theme support to decks
ALTER TABLE decks ADD COLUMN IF NOT EXISTS theme_scope JSONB DEFAULT '{}';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS chapter_data JSONB DEFAULT '[]';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS generated_by TEXT;       -- 'ai' | 'manual' | 'template' | 'analysis'
ALTER TABLE decks ADD COLUMN IF NOT EXISTS source_run_id UUID REFERENCES runs(id);
```

### 18.2 Extend `slides` Table

```sql
-- Add component tree and metadata to slides
ALTER TABLE slides ADD COLUMN IF NOT EXISTS component_tree JSONB;    -- nullable for backward compat
ALTER TABLE slides ADD COLUMN IF NOT EXISTS chapter_id TEXT;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS speaker_notes TEXT;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS transition JSONB;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS confidence_level TEXT;    -- 'high' | 'medium' | 'low'
ALTER TABLE slides ADD COLUMN IF NOT EXISTS narrative_connector TEXT;
```

### 18.3 Deck Views Table (New)

```sql
CREATE TABLE IF NOT EXISTS deck_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id),
  slide_index INTEGER NOT NULL,
  dwell_time_ms INTEGER NOT NULL DEFAULT 0,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deck_views_deck_id ON deck_views(deck_id);
CREATE INDEX idx_deck_views_created_at ON deck_views(created_at);
```

### 18.4 Company Briefs Cache (New)

```sql
CREATE TABLE IF NOT EXISTS company_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  brief_data JSONB NOT NULL,
  source_type TEXT NOT NULL,        -- 'manual' | 'url' | 'pdf' | 'analysis'
  source_run_id UUID REFERENCES runs(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_company_briefs_user_id ON company_briefs(user_id);
```

---

## 19. API Contracts

### 19.1 Generation Pipeline

```
POST /api/deck/generate/v2
  Body: {
    mode: 'quick' | 'full' | 'from-analysis';
    companyName: string;
    description?: string;
    sourceUrl?: string;
    sourceRunId?: string;
    pitchType: 'elevator' | 'vc_pitch' | 'board_update' | 'sales_pitch';
    slideCount: number;           // 6-12, default 8
    framework?: NarrativeFramework;  // null = auto-detect
    themeId: string;
    templateId?: TemplateId;      // backward compat
    projectId?: string;
  }
  Response (SSE stream): {
    event: 'progress' | 'storyline' | 'slide' | 'review' | 'complete' | 'error';
    data: {
      step?: string;
      storyline?: Storyline;      // sent at 'storyline' event for user review
      slide?: Slide;              // sent per slide as generated
      review?: DeckReview;
      deck?: Deck;                // final complete deck
      error?: string;
    };
  }
```

### 19.2 Storyline Confirmation

```
POST /api/deck/generate/v2/confirm-storyline
  Body: {
    generationId: string;          // from the SSE stream
    storyline: Storyline;          // potentially edited by user
  }
  Response: { acknowledged: true }

  # After confirmation, the SSE stream continues with Content Agent
```

### 19.3 Deck CRUD (Enhanced)

```
GET    /api/deck/[deckId]           # Full deck with component trees
PUT    /api/deck/[deckId]           # Save deck (auto-save from editor)
DELETE /api/deck/[deckId]           # Delete deck + storage

PUT /api/deck/[deckId]/slide/[slideId]
  Body: { componentTree: ComponentInstance; speakerNotes?: string }
```

### 19.4 Coach Agent

```
POST /api/deck/coach
  Body: {
    deckId: string;
    message: string;
    activeSlideId?: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
  Response: {
    message: string;
    suggestedEdits?: Array<{
      slideId: string;
      field: string;
      before: string;
      after: string;
    }>;
    action?: CoachAction;
  }
```

### 19.5 Export

```
POST /api/deck/export
  Body: { deckId: string; format: 'pdf' | 'pptx' }
  Response: { downloadUrl: string; expiresAt: string }
```

### 19.6 View Analytics

```
POST /api/deck/[deckId]/view       # Record a view event
  Body: { slideIndex: number; dwellTimeMs: number; referrer?: string }

GET /api/deck/[deckId]/analytics   # Get view analytics
  Response: DeckAnalytics
```

---

## 20. Implementation Phases

### Phase 1: Enhanced Generation Pipeline (2-3 weeks)

**Goal:** Multi-agent content generation with narrative planning. No editor UI yet — output is still PDF, but quality is dramatically higher.

**Tasks:**
1. Create `services/deckAgents/` directory with agent types
2. Implement Research Agent (text input → `CompanyBrief`)
3. Implement Narrative Agent (`CompanyBrief` → `Storyline`)
4. Implement Content Agent (`Storyline` → `EnhancedSlide[]`)
5. Implement Design Agent (rule-based layout selection)
6. Implement Review Agent (quality gate with repair loop)
7. Build Orchestrator to chain agents sequentially
8. Create `lib/prompts/deckAgents/` with all agent prompts
9. Add Zod schemas for all agent outputs
10. Wire new pipeline into existing `POST /api/deck/generate` (backward compat)
11. Update `GenerateDeckModal` with framework picker and slide count selector
12. Add SSE streaming for generation progress
13. Unit tests for each agent + integration test for full pipeline
14. Database migration: extend `decks` and `slides` tables

**Files to create:**
```
services/deckAgents/orchestrator.ts
services/deckAgents/researchAgent.ts
services/deckAgents/narrativeAgent.ts
services/deckAgents/contentAgent.ts
services/deckAgents/designAgent.ts
services/deckAgents/reviewAgent.ts
services/deckAgents/types.ts
lib/prompts/deckAgents/research.ts
lib/prompts/deckAgents/narrative.ts
lib/prompts/deckAgents/content.ts
lib/prompts/deckAgents/review.ts
supabase/migrations/YYYYMMDD_extend_decks_slides.sql
```

**Files to modify:**
```
types/deckGeneration.ts           (add EnhancedSlide, Storyline, etc.)
services/deckGenerationService.ts (use new pipeline)
views/components/GenerateDeckModal.tsx (add framework picker, slide count)
app/api/deck/generate/route.ts   (SSE streaming)
```

**Definition of done:**
- `yarn test` passes with agent unit tests
- Full pipeline generates 8-slide deck from text input with storyline + speaker notes + confidence levels
- PDF output matches or exceeds current quality
- Generation time < 45 seconds for full pipeline

---

### Phase 2: Storyline Stage UI (1-2 weeks)

**Goal:** Users see and can edit the narrative structure before slides are generated.

**Tasks:**
1. Create deck creation wizard page (`/deck/create`)
2. Build input wizard (text, URL, PDF upload, from analysis tabs)
3. Build storyline editor (drag-to-reorder slides, edit key messages)
4. Build framework picker (visual selection of narrative framework)
5. Wire SSE stream to show storyline for user review before content generation
6. Add "Generate Slides" confirmation button
7. Loading states with streaming progress

**Files to create:**
```
app/(app)/deck/create/page.tsx
views/components/deck-builder/InputWizard.tsx
views/components/deck-builder/StorylineEditor.tsx
views/components/deck-builder/SlideTypeCard.tsx
views/components/deck-builder/FrameworkPicker.tsx
views/components/deck-builder/NarrativeConnector.tsx
views/components/deck-builder/GenerationProgress.tsx
hooks/useDeckBuilder.ts
app/api/deck/generate/v2/route.ts
app/api/deck/generate/v2/confirm-storyline/route.ts
```

**Definition of done:**
- User can choose input method, set pitch type/count/framework
- Storyline appears for review, user can reorder/edit
- After confirmation, slides generate with visible progress
- Deck is saved to Supabase and appears in deck list

---

### Phase 3: Interactive Slide Editor (2-3 weeks)

**Goal:** Web-based slide preview with inline editing, selection, and manipulation.

**Tasks:**
1. Create Zustand store for deck editor state with undo/redo
2. Build `DeckEditor` root component with editor layout
3. Build `SlideCanvas` (16:9 scaled container)
4. Build `WidgetRenderer` (dispatch by component type)
5. Implement core widget renderers: heading, paragraph, callout, metric-card, card, grid, split, stack
6. Build `DraggableElement` with pointer event drag handling
7. Build selection system (click, shift+click, drag-select)
8. Build resize handles (corner + edge)
9. Build `FloatingToolbar` (variant dropdowns, formatting, transform menu)
10. Build `SlideNavigator` (left sidebar with chapter groups and slide thumbnails)
11. Implement inline text editing (double-click → `contentEditable`)
12. Build `BottomToolbar` (Insert, Theme, Background)
13. Implement keyboard shortcuts (Cmd+Z, Cmd+C/V, Delete, arrows, Cmd+D)
14. Build auto-save (debounced PUT to API)
15. Create deck edit page route

**Files to create:**
```
app/(app)/deck/[deckId]/edit/page.tsx
views/components/deck-editor/DeckEditor.tsx
views/components/deck-editor/SlideCanvas.tsx
views/components/deck-editor/SlideNavigator.tsx
views/components/deck-editor/WidgetRenderer.tsx
views/components/deck-editor/DraggableElement.tsx
views/components/deck-editor/FloatingToolbar.tsx
views/components/deck-editor/BottomToolbar.tsx
views/components/deck-editor/InsertPanel.tsx
views/components/deck-editor/SpeakerNotesPanel.tsx
views/components/deck-editor/SelectionHandles.tsx
views/components/deck-editor/widgets/
  HeadingWidget.tsx
  ParagraphWidget.tsx
  CalloutWidget.tsx
  MetricCardWidget.tsx
  CardWidget.tsx
  GridWidget.tsx
  SplitWidget.tsx
  StackWidget.tsx
  ImageWidget.tsx
  ComparisonWidget.tsx
stores/deckEditorStore.ts
hooks/useDeckEditor.ts
hooks/useInlineEdit.ts
hooks/useKeyboardShortcuts.ts
app/api/deck/[deckId]/route.ts      (GET, PUT, DELETE)
app/api/deck/[deckId]/slide/[slideId]/route.ts
```

**Definition of done:**
- Slides render as interactive React components in a 16:9 canvas
- Elements can be selected, moved, resized
- Text can be edited inline via double-click
- Floating toolbar shows variant options for selected elements
- Undo/redo works with Cmd+Z/Cmd+Shift+Z
- Changes auto-save to Supabase
- Slide navigator shows chapter groups with thumbnails

---

### Phase 4: Theme System (1 week)

**Goal:** Instant theme switching with chapter presets.

**Tasks:**
1. Define `DeckTheme` and `ChapterPreset` interfaces
2. Create 8 theme definitions (4 migrated + 4 new)
3. Implement CSS custom property infrastructure (`data-theme`, `data-preset` attributes)
4. Build `ThemePanel` component (theme dropdown, preset picker, scope toggle)
5. Migrate existing `DeckTemplate` config to new `DeckTheme` format
6. Wire theme panel to Zustand store
7. Ensure all widget renderers use `var(--slide-*)` CSS variables exclusively

**Files to create:**
```
config/deckThemes.ts                # 8 theme definitions
views/components/deck-editor/ThemePanel.tsx
styles/slide-themes.css             # CSS custom property definitions
lib/deck/themeUtils.ts              # Theme → CSS variable mapping
```

**Files to modify:**
```
config/deckTemplates.ts             (add DeckTheme format alongside existing)
views/components/deck-editor/SlideCanvas.tsx  (add data-theme/data-preset attributes)
All widget components                (use var(--slide-*) variables)
```

**Definition of done:**
- Switching theme in the panel instantly recolors all slides (sub-16ms)
- Chapter presets (Light/Dark/Accent) work independently per chapter
- Per-slide background override works
- Themes persist when deck is saved and reopened

---

### Phase 5: Component Variants & "Turn Into" (1 week)

**Goal:** Variant switching and content-preserving type transformation.

**Tasks:**
1. Create component type registry (`lib/deck/componentRegistry.ts`)
2. Define variant schemas for all component types
3. Implement "Turn Into" transformation with content mapping rules
4. Build variant dropdown UI in floating toolbar
5. Build "Turn Into" menu (right-click or floating toolbar button)
6. Implement grid reflow on variant change
7. Test all transformation paths for content preservation

**Files to create:**
```
lib/deck/componentRegistry.ts       # Type definitions, variant schemas, renderers
lib/deck/transformRules.ts          # Content mapping rules for "Turn Into"
```

**Definition of done:**
- Variant dropdowns in floating toolbar change component layout instantly
- "Turn Into" menu shows valid transformation targets
- Content persists through transformations (Notion superset pattern)
- Grid containers reflow when child variant dimensions change

---

### Phase 6: Snapping & Alignment (4-5 days)

**Goal:** Smart snap guides during drag and resize.

**Tasks:**
1. Implement core snapping pure functions in `lib/snapping/`
2. Create `useSnapping` hook
3. Integrate snapping with `DraggableElement` drag handler
4. Build `SnapGuideOverlay` component
5. Implement equal spacing detection
6. Add resize snapping
7. Unit tests for all snapping algorithms

**Files to create:**
```
lib/snapping/types.ts
lib/snapping/collectTargets.ts
lib/snapping/findSnaps.ts
lib/snapping/findSpacing.ts
lib/snapping/gridSnap.ts
lib/snapping/index.ts
views/components/deck-editor/SnapGuideOverlay.tsx
hooks/useSnapping.ts
```

**Definition of done:**
- Blue alignment guides appear when element edges/centers align during drag
- Red center guides appear when centering on slide or relative to other elements
- Equal spacing indicators appear between 3+ aligned elements
- Snapping threshold: 5px
- Alt/Option key temporarily disables snapping
- All snapping functions have unit tests

---

### Phase 7: Coach Agent (2 weeks)

**Goal:** Chat-based deck refinement with pitch coaching intelligence.

**Tasks:**
1. Implement Coach Agent service with intent classification
2. Create Coach system prompt with pitch coaching knowledge
3. Build `CoachChat` panel component (right sidebar)
4. Build `EditDiffPreview` component (before/after with accept/reject)
5. Wire Coach to Pitchr analysis data when available
6. Build Coach API route
7. Add Cmd+/ keyboard shortcut to toggle Coach panel
8. Test pitch coaching interactions

**Files to create:**
```
services/deckAgents/coachAgent.ts
lib/prompts/deckAgents/coach.ts
views/components/deck-editor/CoachChat.tsx
views/components/deck-editor/EditDiffPreview.tsx
views/components/deck-editor/CoachSuggestion.tsx
hooks/useDeckCoach.ts
app/api/deck/coach/route.ts
```

**Definition of done:**
- Coach chat panel opens/closes with Cmd+/
- Coach can rewrite slides, adjust tone, add/remove slides
- Coach references Pitchr analysis scores when available
- Each suggestion shows before/after diff with Accept/Reject buttons
- Accepted edits update the slide in real-time

---

### Phase 8: Multi-Format Export (1 week)

**Goal:** Export to PPTX, enhanced PDF, and shareable web link.

**Tasks:**
1. Add `pptxgenjs` dependency
2. Implement PPTX export service (component tree → PptxGenJS API)
3. Enhance existing PDF export (use new component data model)
4. Build export dialog UI (format picker, download button)
5. Create public deck page route (`/deck/[deckId]`)
6. Implement view tracking (Supabase)
7. Build view analytics endpoint

**Files to create:**
```
services/pptxExportService.ts
app/api/deck/export/route.ts
app/(public)/deck/[deckId]/page.tsx
app/api/deck/[deckId]/view/route.ts
app/api/deck/[deckId]/analytics/route.ts
views/components/deck-editor/ExportDialog.tsx
supabase/migrations/YYYYMMDD_create_deck_views.sql
```

**Definition of done:**
- PPTX export produces a valid PowerPoint file openable in PowerPoint, Google Slides, and Keynote
- PDF export uses the new component data model for better fidelity
- Web links are shareable and track views
- Export dialog shows PDF/PPTX options with download buttons

---

### Phase 9: Analysis-to-Deck Flywheel (1 week)

**Goal:** Connect pitch analysis results to deck generation.

**Tasks:**
1. Implement `buildBriefFromAnalysis` service
2. Add "Generate Deck" CTA on results page
3. Build "From Analysis" tab in input wizard
4. Wire pre-populated CompanyBrief to generation pipeline
5. Add "Re-score" button in deck editor (creates new pitch run from deck text)
6. Create company briefs cache table

**Files to create:**
```
services/deckFromAnalysis.ts
supabase/migrations/YYYYMMDD_create_company_briefs.sql
```

**Files to modify:**
```
app/(app)/results/[runId]/page.tsx     (add "Generate Deck" CTA)
views/components/deck-builder/InputWizard.tsx  (add "From Analysis" tab)
views/components/deck-editor/DeckEditor.tsx    (add "Re-score" button)
```

**Definition of done:**
- Results page shows "Generate Deck" button that pre-populates the builder
- Generated deck addresses weaknesses identified by Pitchr analysis
- "Re-score" button in editor creates a new pitch run from deck text
- Company briefs are cached for reuse

---

### Phase 10: Present Mode & Polish (1 week)

**Goal:** Full-screen presentation mode and final polish.

**Tasks:**
1. Build present mode page with fullscreen API
2. Implement slide navigation (keyboard, click, touch)
3. Add speaker notes panel (presenter view)
4. Add progress bar and slide counter
5. Final polish: loading states, error handling, empty states
6. Accessibility pass: keyboard navigation, ARIA labels, focus management
7. Mobile responsiveness for view/present modes

**Files to create:**
```
app/(app)/deck/[deckId]/present/page.tsx
views/components/deck-present/PresentMode.tsx
views/components/deck-present/PresenterNotes.tsx
views/components/deck-present/SlideProgress.tsx
```

**Definition of done:**
- Cmd+Enter enters fullscreen present mode
- Arrow keys navigate between slides
- Speaker notes visible in presenter view (separate window or bottom panel)
- Escape exits present mode
- Mobile-responsive view mode

---

### Phase Summary

| Phase | Duration | Effort | Dependencies |
|---|---|---|---|
| 1. Generation Pipeline | 2-3 weeks | Backend-heavy | None |
| 2. Storyline Stage UI | 1-2 weeks | Frontend | Phase 1 |
| 3. Slide Editor | 2-3 weeks | Frontend-heavy | Phase 1 |
| 4. Theme System | 1 week | Frontend + CSS | Phase 3 |
| 5. Component Variants | 1 week | Frontend | Phase 3, 4 |
| 6. Snapping | 4-5 days | Pure functions + UI | Phase 3 |
| 7. Coach Agent | 2 weeks | Full-stack | Phase 1, 3 |
| 8. Export | 1 week | Backend + UI | Phase 3 |
| 9. Analysis Flywheel | 1 week | Full-stack | Phase 1, 2 |
| 10. Present Mode | 1 week | Frontend | Phase 3 |

**Total: ~10-13 weeks**

Phases 3-6 can run in parallel with Phase 7. Phases 8-10 can run in parallel with each other.

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 7

---

## 21. Technology Decisions

### 21.1 Keep from Current Stack

| Component | Library | Rationale |
|---|---|---|
| LLM | Claude via `lib/llm/router.ts` | Already abstracted with fallback |
| PDF Rendering | `@react-pdf/renderer` | Working, extend for new data model |
| Storage | Supabase Storage + Postgres | Already handles deck CRUD |
| Auth | Supabase Auth | Already protects routes |
| Styling | Tailwind CSS 4 | Perfect for slide layouts |
| Build | Next.js 15 App Router | Current stack |

### 21.2 Add

| Component | Library | Version | Rationale |
|---|---|---|---|
| PPTX Export | `pptxgenjs` | Latest | Most mature JS PowerPoint lib, TypeScript, 3.4K+ stars |
| State Management | `zustand` | Latest | Already likely in deps, perfect for editor state + undo/redo |
| Schema Validation | `zod` | Already in stack | For agent structured outputs |

### 21.3 Do NOT Add (and Why)

| Temptation | Reason to Skip |
|---|---|
| Fabric.js / Konva.js | v2/v3 feature. DOM-based editing is 90% as good with 10% of the effort for v1. |
| reveal.js | Opinionated, hard to customize, overkill when we control the renderer. |
| tldraw / Excalidraw | Wrong aesthetic for professional pitch decks, massive bundle, licensing issues. |
| Real-time collaboration (Yjs) | Massive engineering effort, not needed for v1. Founders build decks alone. |
| AI image generation | Cost and complexity. Text-only slides for v1. |
| TipTap / BlockNote | `contentEditable` with basic formatting is sufficient for v1 slide text editing. |
| interact.js | Custom pointer events are simpler (~50 lines) with full control. |

### 21.4 v1 Rendering: HTML/CSS + React (DOM-based)

**Why not Canvas?**
- Fastest to build (weeks vs months)
- Native text editing (canvas text editing is painful)
- Accessible by default
- CSS transforms are GPU-accelerated
- Easy responsive scaling
- Matches how most slide tools (Google Slides, Pitch, Beautiful.ai) work

**v2 Migration Path:** The snapping algorithm, component registry, theme system, and data model are all rendering-agnostic. Only the rendering layer changes when moving to Konva.js canvas. See `canvas-editing-technologies.md` for the migration plan.

---

## 22. Testing Strategy

### 22.1 Unit Tests

| Area | Test Focus | Framework |
|---|---|---|
| Agent services | Each agent produces valid output from test input | Vitest |
| Snapping algorithms | All snap detection functions with edge cases | Vitest |
| Component transformations | All "Turn Into" paths preserve content correctly | Vitest |
| Theme utilities | CSS variable generation, scope cascade | Vitest |
| Layout engine | Rule-based layout selection for each slide type | Vitest |

### 22.2 Integration Tests

| Area | Test Focus | Framework |
|---|---|---|
| Generation pipeline | Full orchestrator produces valid deck from text input | Vitest |
| PPTX export | Generated PPTX is valid and openable | Vitest |
| Deck CRUD | Create, read, update, delete through API | Vitest |

### 22.3 Component Tests

| Area | Test Focus | Framework |
|---|---|---|
| Widget renderers | Each widget renders correctly for all variant combinations | Vitest + @testing-library/react |
| Editor interactions | Selection, drag, resize, inline edit | Vitest + @testing-library/react |
| Theme switching | Correct CSS variables applied | Vitest + @testing-library/react |

### 22.4 E2E Tests

| Area | Test Focus | Framework |
|---|---|---|
| Deck creation flow | Input wizard → storyline → generate → editor | Playwright |
| Editor editing | Select, edit text, change variant, undo, save | Playwright |
| Export flow | Export to PDF/PPTX, verify download | Playwright |
| Present mode | Enter, navigate, exit | Playwright |

---

## 23. Risk Analysis

### 23.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM output quality inconsistency | Medium | High | Review Agent + repair loop (max 2x) + fallback prompts + structured output schemas |
| Pipeline latency (5 LLM calls = 15-30s) | High | Medium | Parallel where possible, streaming UX, agent routing (skip agents for simple inputs) |
| PPTX rendering fidelity | Medium | Medium | Limit to supported PptxGenJS features, test across PowerPoint/Google Slides/Keynote |
| contentEditable cross-browser issues | Medium | Low | Limit formatting to bold/italic/color, no complex rich text for v1 |
| Editor performance with many elements | Low | Medium | Typical pitch deck has 5-15 elements per slide — well within DOM limits |
| Structured output schema complexity | Low | Medium | Keep schemas flat, Zod validation with clear error messages |

### 23.2 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Users want freeform canvas editing | Medium | High | HTML inline editing covers 80% of needs. Track feature requests. Canvas is planned for v2. |
| Quality doesn't match Chronicle | Medium | High | Narrative framework + review loop + iterative improvement. Our pitch expertise is the differentiator, not visual design. |
| Coach Agent produces unhelpful suggestions | Medium | Medium | Include Pitchr analysis context, accept/reject UX, iterative prompt improvement |
| Users don't discover analysis → deck flow | Low | Medium | Strong CTA on results page, onboarding nudge, marketing highlight |

### 23.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM cost per deck generation (3-5 Claude calls) | Medium | Medium | Agent routing (skip agents for simple inputs), cache Company Briefs, use Sonnet for lighter agents |
| Free tier abuse | Medium | Medium | 1 deck/period for free tier, credit gating on all generation |
| Chronicle ships similar analysis features | Low | High | Our analysis engine has deep domain expertise built over months. Hard to replicate quickly. |

---

## 24. Out of Scope

### Explicitly Not in This PRD

1. **Freeform canvas editing (Konva.js)** — v2/v3 feature. DOM-based editing first.
2. **AI image generation** — v2 feature. Text-only slides for v1.
3. **Real-time collaboration** — v3+ feature. Founders build decks alone initially.
4. **Animated slide transitions** — v2 feature. Static transitions only for v1.
5. **Chart/data visualization rendering** — v2 feature. Use callout/metric-card for numbers in v1.
6. **Remix feature (64+ layout variations)** — v2 feature. Requires the layout engine and AI remix endpoint.
7. **Mobile editing** — View/present only on mobile for v1. Full editing is desktop.
8. **Embed support (Figma, YouTube, Airtable)** — v2+ feature. Images only for media in v1.
9. **Enterprise features** — SSO, team workspaces, admin controls.
10. **Investor CRM integration** — v3+ feature (track who views your deck, share analytics with investors).

### Architecture Decisions Deferred to v2

1. Canvas rendering library (Konva.js recommended — see `canvas-editing-technologies.md`)
2. Rich text editor (TipTap recommended for text blocks within canvas)
3. Real-time sync protocol (Yjs recommended — proven with Konva)
4. Image generation provider (Unsplash API for stock photos as interim)
5. Chart rendering library (recharts or inline SVG)

---

## Appendix A: File Structure (Complete)

```
# New files created by this PRD
# Organized by implementation phase

# Phase 1: Generation Pipeline
services/deckAgents/
  orchestrator.ts
  researchAgent.ts
  narrativeAgent.ts
  contentAgent.ts
  designAgent.ts
  reviewAgent.ts
  types.ts
lib/prompts/deckAgents/
  research.ts
  narrative.ts
  content.ts
  review.ts
  coach.ts

# Phase 2: Storyline Stage UI
app/(app)/deck/create/page.tsx
views/components/deck-builder/
  InputWizard.tsx
  StorylineEditor.tsx
  SlideTypeCard.tsx
  FrameworkPicker.tsx
  NarrativeConnector.tsx
  GenerationProgress.tsx
hooks/useDeckBuilder.ts

# Phase 3: Slide Editor
app/(app)/deck/[deckId]/edit/page.tsx
views/components/deck-editor/
  DeckEditor.tsx
  SlideCanvas.tsx
  SlideNavigator.tsx
  WidgetRenderer.tsx
  DraggableElement.tsx
  FloatingToolbar.tsx
  BottomToolbar.tsx
  InsertPanel.tsx
  SpeakerNotesPanel.tsx
  SelectionHandles.tsx
  widgets/
    HeadingWidget.tsx
    ParagraphWidget.tsx
    CalloutWidget.tsx
    MetricCardWidget.tsx
    CardWidget.tsx
    GridWidget.tsx
    SplitWidget.tsx
    StackWidget.tsx
    ImageWidget.tsx
    ComparisonWidget.tsx
stores/deckEditorStore.ts
hooks/useDeckEditor.ts
hooks/useInlineEdit.ts
hooks/useKeyboardShortcuts.ts

# Phase 4: Theme System
config/deckThemes.ts
views/components/deck-editor/ThemePanel.tsx
styles/slide-themes.css
lib/deck/themeUtils.ts

# Phase 5: Component Variants
lib/deck/componentRegistry.ts
lib/deck/transformRules.ts

# Phase 6: Snapping
lib/snapping/
  types.ts
  collectTargets.ts
  findSnaps.ts
  findSpacing.ts
  gridSnap.ts
  index.ts
views/components/deck-editor/SnapGuideOverlay.tsx
hooks/useSnapping.ts

# Phase 7: Coach Agent
services/deckAgents/coachAgent.ts
views/components/deck-editor/
  CoachChat.tsx
  EditDiffPreview.tsx
  CoachSuggestion.tsx
hooks/useDeckCoach.ts

# Phase 8: Export
services/pptxExportService.ts
views/components/deck-editor/ExportDialog.tsx
app/(public)/deck/[deckId]/page.tsx

# Phase 9: Analysis Flywheel
services/deckFromAnalysis.ts

# Phase 10: Present Mode
app/(app)/deck/[deckId]/present/page.tsx
views/components/deck-present/
  PresentMode.tsx
  PresenterNotes.tsx
  SlideProgress.tsx

# API Routes (all phases)
app/api/deck/generate/v2/route.ts
app/api/deck/generate/v2/confirm-storyline/route.ts
app/api/deck/[deckId]/route.ts
app/api/deck/[deckId]/slide/[slideId]/route.ts
app/api/deck/coach/route.ts
app/api/deck/export/route.ts
app/api/deck/[deckId]/view/route.ts
app/api/deck/[deckId]/analytics/route.ts

# Database Migrations
supabase/migrations/YYYYMMDD_extend_decks_slides.sql
supabase/migrations/YYYYMMDD_create_deck_views.sql
supabase/migrations/YYYYMMDD_create_company_briefs.sql
```

## Appendix B: Dependency Changes

```
# New dependencies (yarn add)
pptxgenjs                    # PPTX export
zustand                      # Editor state management (if not already installed)

# Existing dependencies (no changes needed)
@react-pdf/renderer          # PDF export (already installed)
zod                          # Schema validation (already installed)
@supabase/supabase-js        # Database (already installed)
pdf-parse                    # PDF text extraction (already installed)
```

## Appendix C: Environment Variables

No new environment variables required. All integrations use existing keys:
- `ANTHROPIC_API_KEY` — Claude API for all agents
- `GOOGLE_AI_API_KEY` — Gemini fallback (existing router)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Storage and DB
- `STRIPE_*` — Billing (existing credit system)
