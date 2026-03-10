# AI Pitch Deck Builder — Full Research & Implementation Blueprint

**Date:** 2026-03-10
**Scope:** Build a Chronicle AI-caliber pitch deck creation experience for Pitchr
**Status:** Research complete, ready for phased implementation

---

## Table of Contents

1. [Competitive Landscape Analysis](#1-competitive-landscape-analysis)
2. [What Makes Chronicle AI Best-in-Class](#2-what-makes-chronicle-ai-best-in-class)
3. [Pitchr's Current Deck Infrastructure](#3-pitchrs-current-deck-infrastructure)
4. [Architecture Design: Multi-Agent Deck Builder](#4-architecture-design-multi-agent-deck-builder)
5. [AI Agent System Design](#5-ai-agent-system-design)
6. [Slide Rendering Engine](#6-slide-rendering-engine)
7. [Conversational Editing Agent ("Coach")](#7-conversational-editing-agent-coach)
8. [Data Pipeline & Content Ingestion](#8-data-pipeline--content-ingestion)
9. [Design Intelligence & Layout Engine](#9-design-intelligence--layout-engine)
10. [Export & Sharing](#10-export--sharing)
11. [Technology Choices & Trade-offs](#11-technology-choices--trade-offs)
12. [Implementation Phases](#12-implementation-phases)
13. [Smart Moves & Differentiators](#13-smart-moves--differentiators)
14. [Risk Analysis](#14-risk-analysis)

---

## 1. Competitive Landscape Analysis

### Chronicle AI
- **Story-first engine**: Analyzes content → organizes into narrative frameworks (hook → problem → solution → proof)
- **Storyline Stage**: Shows structural backbone before generating slides — users tweak chapters, swap layouts, define narrative intent
- **Muse Agent**: Conversational AI for iterative refinement ("Make this more punchy", "Less corporate, more human")
- **Freeform canvas**: Widget-based design system, not card/grid constrained
- **Output quality**: 85-90% client-ready vs ~60% for competitors
- **Integrations**: ChatGPT, Claude, Perplexity, image gen (Nano Banana, Runway Gen-4, Ideogram 3.0)
- **Funding**: $7.5M seed (Accel, Square Peg), 5,000+ teams
- **Pricing**: Token-based with free tier

### Gamma
- **Web-native content model**: Card-based blocks (scrollable webpage, not traditional slides)
- **Multiple entry points**: Prompt, notes, file/URL import
- **Agent editing**: Per-slide or whole-deck AI modifications
- **Layout intelligence**: Auto-selects layout types (timelines, icon grids, comparison cards)
- **Programmatic API**: Automate creation, integrate with tools
- **Scale**: 250M+ presentations generated

### Beautiful.ai
- **Smart Slides**: Auto-adjusts design, layout, spacing as content changes
- **Design rules engine**: Enforces professional design constraints automatically
- **No freeform**: Constrained to smart templates (trade-off: consistency vs flexibility)

### Presenton (Open Source)
- **Architecture**: FastAPI backend + Next.js frontend + Nginx proxy in Docker
- **Pipeline**: 5-phase generation with structured LLM calls + JSON schema validation
- **Concurrent generation**: `asyncio.gather()` for batched slide content (10 slides at a time)
- **Multi-provider**: Supports OpenAI, Anthropic, Google, Ollama (local models)
- **Image providers**: DALL-E 3, GPT Image 1.5, Gemini Flash, Pexels, Pixabay, ComfyUI
- **Export**: PPTX and PDF with custom templates
- **License**: Apache 2.0

### Key Insight

Chronicle wins because of **narrative intelligence** — it understands story structure, not just content placement. Gamma wins on **speed and accessibility**. Beautiful.ai wins on **design consistency**. Presenton proves the architecture is **achievable as open source**.

Pitchr's unfair advantage: **we already understand pitches**. We score them, analyze them, identify weaknesses. No competitor has this feedback loop. The deck builder can be the *output* of our analysis — "here's what's wrong with your pitch, and here's the deck that fixes it."

---

## 2. What Makes Chronicle AI Best-in-Class

### The 5 Things Chronicle Does That Others Don't

1. **Storyline Stage (Pre-Generation Planning)**
   - Before any slide is created, users see the narrative structure
   - They can reorder chapters, change the story arc, set narrative intent per section
   - This is the key UX insight: let humans control story, let AI control design

2. **Narrative Connectors**
   - Each slide has an implicit "and therefore..." connection to the next
   - The AI maintains story coherence when slides are added/removed/reordered
   - Content on slide 3 references context established on slide 2

3. **Conversational Iteration (Muse)**
   - Not regenerate-and-replace — surgical edits that preserve context
   - Scope control: edit one slide, one section, or the whole deck
   - Understands high-level intent: "more punchy" translates to shorter sentences, stronger verbs, bigger numbers up front

4. **Design Intelligence Without Constraints**
   - Freeform canvas means no "template jail"
   - But the AI still applies visual hierarchy, spacing, typography rules
   - Best of both worlds: freedom + quality

5. **Interactive Widgets**
   - Peek/Deep Hover for progressive disclosure
   - Embeddable content (videos, live data, external tools)
   - Presentations feel like interactive documents, not static slides

### What We Should Steal vs. What We Should Skip

| Steal | Skip |
|-------|------|
| Storyline Stage (narrative planning) | Freeform canvas (too complex for v1) |
| Conversational iteration agent | Widget ecosystem (scope creep) |
| Story-first content generation | Real-time collaboration (later) |
| Layout intelligence | Token-based pricing model |
| Multi-format export | |

---

## 3. Pitchr's Current Deck Infrastructure

### What Already Exists

Pitchr already has a functional deck generation pipeline:

**Data Model** (`types/deckGeneration.ts`):
- 8 slide types: `hook`, `problem`, `solution`, `traction`, `market`, `business_model`, `team`, `ask`
- Layout hints: `centered`, `two-column`, `comparison`, `cards`, `big-number`
- 4 templates: `minimal-dark`, `corporate-clean`, `bold-gradient`, `startup-fresh`
- Structured slide schema: headline, subheadline, bullets (text + detail), callout (value + label)

**Generation Service** (`services/deckGenerationService.ts`):
- LLM-powered content generation with structured JSON output
- Validation + repair pipeline (generate → validate → repair if invalid)
- PDF rendering via `@react-pdf/renderer`
- Storage in Supabase (deck record + per-slide text records)
- Placeholder stripping as defense-in-depth

**PDF Components** (`views/components/deck-pdf/`):
- `DeckDocument.tsx` — orchestrates all slides
- `SlideBase.tsx` — base layout with template theming
- Specialized slide components: `TitleSlide`, `ContentSlide`, `MetricsSlide`, `ComparisonSlide`, `TeamSlide`, `AskSlide`, `MarketSlide`

**Prompt Engineering** (`lib/prompts/deckGeneration.ts`):
- World-class system prompt with narrative arc guidance
- Specific quality rules (no placeholders, no buzzwords, bold claims)
- Schema examples with realistic data
- Repair prompt for invalid outputs

**Edge Functions**:
- `deck-list`, `deck-detail`, `deck-upload` — CRUD operations
- `deck-upload` handles PDF upload + text extraction

### What's Missing for Chronicle-Level Quality

1. **No narrative planning stage** — goes straight to generation
2. **No conversational editing** — regenerate entire deck or nothing
3. **No interactive preview** — only PDF output
4. **No freeform editing** — template-locked layouts
5. **No image/visual generation** — text-only slides
6. **No PPTX export** — PDF only
7. **No content ingestion** — only company name + description as input
8. **No slide-level editing** — all-or-nothing generation
9. **No feedback loop** — analysis results don't inform deck generation

---

## 4. Architecture Design: Multi-Agent Deck Builder

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Input    │  │ Storyline │  │  Slide   │  │  Export &    │  │
│  │  Wizard   │  │  Planner  │  │  Editor  │  │  Share       │  │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │              │               │          │
└───────┼──────────────┼──────────────┼───────────────┼──────────┘
        │              │              │               │
┌───────┼──────────────┼──────────────┼───────────────┼──────────┐
│       ▼              ▼              ▼               ▼          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DECK ORCHESTRATOR (API Route)              │   │
│  │  Manages generation pipeline, state, and agent routing  │   │
│  └─────────┬──────────┬──────────┬──────────┬──────────────┘   │
│            │          │          │          │                   │
│     ┌──────▼───┐ ┌────▼────┐ ┌──▼─────┐ ┌─▼──────────┐       │
│     │ Research │ │Narrative│ │Content │ │  Design    │       │
│     │  Agent   │ │  Agent  │ │ Agent  │ │  Agent     │       │
│     └──────┬───┘ └────┬────┘ └──┬─────┘ └─┬──────────┘       │
│            │          │         │          │                   │
│     ┌──────▼───┐ ┌────▼────┐ ┌──▼─────┐ ┌─▼──────────┐       │
│     │ Web      │ │Story    │ │Per-    │ │  Layout    │       │
│     │ Search / │ │Arc      │ │Slide   │ │  Selection │       │
│     │ RAG      │ │Builder  │ │Writer  │ │  + Theming │       │
│     └──────────┘ └─────────┘ └────────┘ └────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 COACH AGENT (Chat)                       │  │
│  │  Conversational editing, refinement, and iteration       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         BACKEND                               │
└───────────────────────────────────────────────────────────────┘
        │              │              │               │
┌───────▼──────────────▼──────────────▼───────────────▼──────────┐
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Supabase │  │   Claude   │  │  Image   │  │  PptxGenJS / │  │
│  │ Storage  │  │   API      │  │  Gen API │  │  react-pdf   │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────┘  │
│                      INFRASTRUCTURE                           │
└───────────────────────────────────────────────────────────────┘
```

### Architecture Pattern: Coordinator + Sequential Pipeline

Using Google ADK's proven patterns, the Deck Orchestrator acts as a **Coordinator Agent** that dispatches work to specialized agents in a **Sequential Pipeline** with **Loop/Review** for quality gates:

```
Input → Research Agent → Narrative Agent → Content Agent → Design Agent → Review Loop → Output
                                                                              ↓
                                                                    (if fails quality check)
                                                                              ↓
                                                                    Content Agent (targeted fix)
```

---

## 5. AI Agent System Design

### Agent 1: Research Agent

**Purpose:** Gather context about the company, market, and competitors to inform narrative generation.

**Inputs:**
- Company name + description (manual input)
- Uploaded documents (pitch transcript, business plan, one-pager)
- Website URL (for auto-extraction)
- Previous Pitchr analysis results (if available — this is our secret weapon)

**Process:**
1. Extract structured data from all inputs (company info, metrics, team, market)
2. If URL provided: fetch and extract key claims, metrics, team info
3. If previous Pitchr run exists: pull scored analysis, identified weaknesses, suggested fixes
4. Synthesize into a **Company Brief** — a structured JSON document

**Output: Company Brief Schema**
```typescript
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
  // FROM PITCHR ANALYSIS (unique advantage)
  pitchrInsights?: {
    overallScore?: number;
    weakestCategories?: string[];
    topFixes?: string[];
    rewrittenScript?: string;
  };
}
```

**LLM Configuration:**
- Model: `claude-sonnet-4-6` (fast, good at extraction)
- Temperature: 0.2 (factual extraction)
- Structured output with JSON schema validation

### Agent 2: Narrative Agent

**Purpose:** Design the story arc and slide structure before any content is written.

**Inputs:**
- Company Brief from Research Agent
- User's chosen pitch type (`elevator` | `vc_pitch` | `board_update` | `sales_pitch`)
- User's chosen slide count (6-12, default 8)

**Process:**
1. Analyze the Company Brief to identify the strongest story elements
2. Select the optimal narrative framework:
   - **Problem-Solution-Proof** (default for VC pitches)
   - **Vision-Reality-Bridge** (for visionary founders)
   - **Data-First** (for traction-heavy companies)
   - **Underdog** (for pre-revenue with strong team/insight)
3. Generate a **Storyline** — ordered list of slides with narrative purpose and key message
4. Assign narrative connectors ("and therefore...", "but the real insight is...", "which means...")

**Output: Storyline Schema**
```typescript
interface Storyline {
  framework: 'problem-solution-proof' | 'vision-reality-bridge' | 'data-first' | 'underdog';
  frameworkRationale: string;
  slides: Array<{
    position: number;
    type: SlideType;
    narrativePurpose: string;  // "Establish urgency by quantifying the pain"
    keyMessage: string;        // "Freight carriers lose $340B/yr to empty miles"
    connector: string;         // "And the reason nobody's fixed this is..."
    suggestedLayout: LayoutHint;
    contentGuidance: string;   // Specific instructions for Content Agent
    dataPointsToInclude: string[];  // From Company Brief
  }>;
  overallTone: string;  // "Confident but grounded — let numbers do the bragging"
  audienceAssumptions: string;  // "Series A partner meeting, 30-min slot"
}
```

**LLM Configuration:**
- Model: `claude-sonnet-4-6` (narrative reasoning)
- Temperature: 0.5 (creative but structured)
- This is where Pitchr's analysis insights shine — if we know the pitch scored 45/100 on "evidence", the Narrative Agent prioritizes evidence-heavy slides

### Agent 3: Content Agent

**Purpose:** Write the actual slide content following the Storyline's guidance.

**Inputs:**
- Company Brief
- Storyline
- Per-slide content guidance

**Process:**
1. For each slide in the Storyline, generate content following the narrative purpose
2. Use the Company Brief as the factual source — never invent data
3. Apply Pitchr's existing quality rules (no placeholders, no buzzwords, bold claims)
4. Ensure each slide narratively connects to the next using the connector hints
5. Run a self-review pass: does each headline stand alone? Does each bullet answer "so what?"

**Output:** `GeneratedDeck` (existing schema, extended)

**Extended Slide Schema:**
```typescript
interface EnhancedSlide extends GeneratedSlide {
  speakerNotes?: string;          // What the founder should SAY on this slide
  narrativeConnector?: string;     // How this connects to the next slide
  confidenceLevel: 'high' | 'medium' | 'low';  // How much real data backs this slide
  suggestedVisual?: string;        // "Bar chart showing MoM growth" or "Product screenshot"
}
```

**LLM Configuration:**
- Model: `claude-sonnet-4-6` (content quality)
- Temperature: 0.4 (creative but controlled)
- Max tokens: 8192
- Use existing `DECK_GENERATION_SYSTEM_PROMPT` as base, enhanced with Storyline context

### Agent 4: Design Agent

**Purpose:** Select optimal layouts, visual treatments, and theme parameters for each slide.

**Inputs:**
- Enhanced slide content from Content Agent
- Template selection from user
- Layout hints from Storyline

**Process:**
1. For each slide, determine the optimal layout based on content density and type
2. Calculate visual hierarchy: what's the most important element on each slide?
3. Select data visualization types for metric-heavy slides
4. Ensure visual variety across the deck (no 8 identical layouts)
5. Apply brand colors and typography from the selected template

**Output: Design Manifest**
```typescript
interface DesignManifest {
  slides: Array<{
    slideIndex: number;
    layout: LayoutDefinition;
    visualHierarchy: {
      primary: 'headline' | 'callout' | 'chart' | 'image';
      secondary: 'bullets' | 'subheadline' | 'comparison';
    };
    dataVisualization?: {
      type: 'bar' | 'line' | 'pie' | 'metric-card' | 'comparison-table';
      data: Record<string, unknown>;
    };
    imagePrompt?: string;  // For AI image generation
    colorOverrides?: Partial<DeckTemplate['colors']>;
  }>;
}
```

**Implementation note:** For v1, this can be rule-based rather than LLM-based. Map slide types to layout algorithms:
- `hook` → full-bleed centered with large headline
- `problem` → two-column with callout card
- `traction` → big-number hero with supporting metrics
- `market` → comparison grid or chart
- `team` → card layout
- `ask` → centered with prominent funding amount

### Agent 5: Review Agent (Quality Gate)

**Purpose:** Evaluate the generated deck against investor expectations and Pitchr's scoring rubric.

**Inputs:**
- Complete generated deck (content + design manifest)
- Company Brief (for fact-checking)
- Pitchr's existing rubric categories

**Process:**
1. Score each slide on: clarity, specificity, narrative flow, visual appropriateness
2. Check for common failure modes:
   - Placeholder text that slipped through
   - Buzzword usage
   - Missing narrative connectors
   - Slides that don't answer "so what?"
   - Over-reliance on inferred data
3. Generate targeted fix instructions for any slide scoring below threshold
4. Return pass/fail with specific remediation instructions

**Output:**
```typescript
interface DeckReview {
  overallScore: number;  // 0-100
  passesQualityGate: boolean;  // >= 75
  slideReviews: Array<{
    slideIndex: number;
    score: number;
    issues: string[];
    fixInstructions: string;  // Specific, actionable fix for Content Agent
  }>;
}
```

**Loop behavior:** If `passesQualityGate === false`, route failing slides back to Content Agent with fix instructions. Max 2 repair loops.

---

## 6. Slide Rendering Engine

### Current State: `@react-pdf/renderer`

The current system uses `@react-pdf/renderer` to generate static PDFs. This works but produces non-interactive, non-editable output.

### Recommended Architecture: Dual Rendering

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
     │  Preview   │  │  (react-pdf) │  │  Export  │
     │  (React)   │  │              │  │(PptxGen) │
     └────────────┘  └──────────────┘  └──────────┘
```

### Web Preview Renderer (Primary)

Build slides as React components rendered in the browser. This enables:
- Real-time editing
- Animations and transitions
- Interactive elements
- Responsive scaling

**Technology: React + Tailwind + CSS Grid**

```typescript
// Slide renderer maps slide data to React components
interface SlideRendererProps {
  slide: EnhancedSlide;
  template: DeckTemplate;
  designManifest: DesignManifest['slides'][number];
  isEditing: boolean;
  onContentChange?: (field: string, value: string) => void;
}

// Layout components
const LAYOUT_RENDERERS: Record<LayoutHint, React.FC<SlideRendererProps>> = {
  'centered': CenteredLayout,
  'two-column': TwoColumnLayout,
  'comparison': ComparisonLayout,
  'cards': CardsLayout,
  'big-number': BigNumberLayout,
};
```

**Why not Canvas (Fabric.js/Konva)?**

For v1, HTML/CSS slides are the right choice because:
- Faster to build (weeks vs months)
- Text editing is native (canvas text editing is painful)
- Accessible by default
- Easier to make responsive
- Can still export to PDF/PPTX via separate renderers

Canvas-based freeform editing (a la Chronicle) would be a v2/v3 feature if user demand warrants it. See [canvas-editing-technologies.md](canvas-editing-technologies.md) for comprehensive research on Konva, Fabric.js, tldraw, Excalidraw, PixiJS, and HTML/CSS approaches — **Konva.js + react-konva** is the recommended canvas library when that time comes.

### PDF Export (Enhanced)

Keep `@react-pdf/renderer` but enhance the existing `DeckDocument` component tree:
- Add chart rendering (react-pdf supports SVG paths)
- Add image embedding (from AI-generated or stock images)
- Improve layout fidelity to match web preview

### PPTX Export (New)

Add `pptxgenjs` for PowerPoint export:
- Maps slide data JSON → PptxGenJS API calls
- Supports all major slide objects: text, tables, shapes, images, charts
- Works in Node.js (API route) and browser
- Template-aware: applies brand fonts, colors, sizes

```typescript
// services/pptxExportService.ts
import PptxGenJS from 'pptxgenjs';

export async function exportDeckToPptx(
  slides: EnhancedSlide[],
  template: DeckTemplate,
  designManifest: DesignManifest,
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Apply template as slide master
  pptx.defineSlideMaster({
    title: template.name,
    background: { color: template.colors.background },
    // ... font definitions, logo placement
  });

  for (const [i, slide] of slides.entries()) {
    const pptxSlide = pptx.addSlide({ masterName: template.name });
    const manifest = designManifest.slides[i];

    // Route to layout-specific renderer
    renderSlideContent(pptxSlide, slide, manifest, template);
  }

  return Buffer.from(await pptx.write({ outputType: 'nodebuffer' }));
}
```

---

## 7. Conversational Editing Agent ("Coach")

This is the Chronicle "Muse" equivalent — and our biggest differentiator because we combine it with pitch coaching intelligence.

### Architecture

```
User Message: "Make the traction slide more impressive"
       │
       ▼
┌─────────────────────────────────┐
│        Coach Agent              │
│                                 │
│  1. Parse intent                │
│     - Scope: slide 4 (traction) │
│     - Action: enhance impact    │
│                                 │
│  2. Load context                │
│     - Current slide content     │
│     - Company Brief metrics     │
│     - Pitchr analysis scores    │
│                                 │
│  3. Generate edit               │
│     - Rewrite headline          │
│     - Reorder bullets by impact │
│     - Add stronger callout      │
│                                 │
│  4. Return diff                 │
│     - Old content → New content │
│     - Explanation of changes    │
└─────────────────────────────────┘
       │
       ▼
UI shows diff preview → User accepts/rejects
```

### Intent Classification

The Coach Agent classifies user messages into action types:

```typescript
type CoachAction =
  | { type: 'rewrite_slide'; slideIndex: number; guidance: string }
  | { type: 'rewrite_section'; slideIndex: number; section: 'headline' | 'bullets' | 'callout'; guidance: string }
  | { type: 'adjust_tone'; scope: 'deck' | 'slide'; slideIndex?: number; tone: string }
  | { type: 'add_slide'; afterIndex: number; slideType: SlideType; guidance: string }
  | { type: 'remove_slide'; slideIndex: number }
  | { type: 'reorder_slides'; newOrder: number[] }
  | { type: 'change_template'; templateId: TemplateId }
  | { type: 'answer_question'; question: string }
  | { type: 'pitch_coaching'; feedback: string };  // Unique to Pitchr
```

### Pitch Coaching Integration (Our Moat)

What Chronicle can't do: tell you *why* your deck is weak from an investor's perspective. The Coach Agent has access to:

1. **Pitchr's rubric scores** — "Your evidence score is 35/100 because slide 3 has no concrete metrics"
2. **The rewritten script** — "Here's how an investor would want to hear this"
3. **Ranked fixes** — "The #1 thing to fix is your market sizing — it's a top-down guess"

Example interaction:
```
User: "Why does my traction slide feel weak?"
Coach: "Your traction slide scores 42/100 on evidence. It says 'growing fast'
        but doesn't quantify. Here's what I'd change:

        Before: 'Growing fast with strong user engagement'
        After:  '3,200 active users, 47% MoM growth, 89% D30 retention'

        The specific numbers turn a claim into proof. Want me to apply this?"
```

### System Prompt for Coach

```typescript
const COACH_SYSTEM_PROMPT = `You are Pitchr's AI pitch coach, combining
world-class deck design expertise with deep knowledge of what investors
actually look for.

You have access to:
1. The current deck content and structure
2. The Company Brief with all available data
3. Pitchr's pitch analysis results (scores, fixes, rewritten sections)

Your job is to help founders iteratively improve their deck through
conversation. You can:
- Edit specific slides or sections
- Explain WHY something works or doesn't (using investor psychology)
- Suggest structural changes to the narrative arc
- Apply Pitchr's analysis insights to strengthen weak areas

Rules:
- Always explain the "why" behind your suggestions
- Show before/after when making changes
- Never invent data — use what's in the Company Brief
- Keep the founder's voice — enhance, don't replace
- If the user asks for something that would weaken the deck,
  explain why and suggest an alternative`;
```

---

## 8. Data Pipeline & Content Ingestion

### Multi-Source Input System

Chronicle accepts prompts, URLs, PDFs, and PPTXs. We should match and exceed this:

```
┌─────────────────────────────────────────────────┐
│                INPUT SOURCES                    │
│                                                 │
│  ┌────────┐ ┌──────┐ ┌──────┐ ┌─────────────┐  │
│  │ Text   │ │ URL  │ │ PDF/ │ │  Pitchr     │  │
│  │ Prompt │ │      │ │ PPTX │ │  Analysis   │  │
│  └───┬────┘ └──┬───┘ └──┬───┘ └──────┬──────┘  │
│      │         │        │            │          │
│      ▼         ▼        ▼            ▼          │
│  ┌──────────────────────────────────────────┐   │
│  │         CONTENT EXTRACTION LAYER         │   │
│  │                                          │   │
│  │  Text: direct passthrough                │   │
│  │  URL: fetch + HTML-to-text extraction    │   │
│  │  PDF: pdf-parse (already in stack)       │   │
│  │  PPTX: pptx-parser or LibreOffice       │   │
│  │  Pitchr: structured analysis JSON        │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                           │
│                     ▼                           │
│  ┌──────────────────────────────────────────┐   │
│  │         RESEARCH AGENT                   │   │
│  │    Synthesizes all sources into          │   │
│  │    Company Brief                         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Pitchr Analysis Integration (Unique Differentiator)

When a user has previously analyzed their pitch on Pitchr, we can pre-populate the Company Brief with rich structured data:

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
    // Extract company info from the pitch transcript
    company: {
      name: run.company_name || 'Unknown',
      oneLiner: extractOneLiner(analysis),
      stage: inferStage(analysis),
    },
    traction: extractTraction(analysis),
    // ... more extraction from the analysis
  };
}
```

This creates the **analysis → deck** loop:
1. User records/pastes their pitch
2. Pitchr analyzes and scores it
3. User sees their score + ranked fixes
4. User clicks "Generate Deck" — pre-populated with all the analysis insights
5. The deck is built to *address the weaknesses* Pitchr identified
6. User can re-analyze the deck content as a new pitch

This is a flywheel no competitor can match.

---

## 9. Design Intelligence & Layout Engine

### Rule-Based Layout Engine (v1)

Rather than an LLM for layout decisions (slow, expensive, unpredictable), use a deterministic rule engine:

```typescript
// lib/deck/layoutEngine.ts

interface LayoutDecision {
  layout: LayoutHint;
  gridTemplate: string;  // CSS Grid template
  contentZones: ContentZone[];
  emphasisElement: 'headline' | 'callout' | 'chart' | 'image';
}

const LAYOUT_RULES: Record<SlideType, (slide: EnhancedSlide) => LayoutDecision> = {
  hook: (slide) => ({
    layout: 'centered',
    gridTemplate: '"headline" auto "subheadline" auto / 1fr',
    contentZones: [
      { id: 'headline', x: 0, y: 0.3, w: 1, h: 0.2 },
      { id: 'subheadline', x: 0.1, y: 0.55, w: 0.8, h: 0.15 },
    ],
    emphasisElement: 'headline',
  }),

  traction: (slide) => {
    const hasCallout = !!slide.callout;
    const bulletCount = slide.bullets.length;

    if (hasCallout && bulletCount <= 3) {
      return {
        layout: 'big-number',
        gridTemplate: '"callout callout" auto "bullets bullets" auto / 1fr 1fr',
        contentZones: [
          { id: 'callout', x: 0.25, y: 0.15, w: 0.5, h: 0.3 },
          { id: 'bullets', x: 0.05, y: 0.55, w: 0.9, h: 0.35 },
        ],
        emphasisElement: 'callout',
      };
    }
    // ... more rules based on content characteristics
  },

  market: (slide) => {
    const hasCompetitors = slide.bullets.length >= 3;
    return {
      layout: hasCompetitors ? 'comparison' : 'two-column',
      // ... grid definitions
    };
  },
  // ... other slide types
};
```

### Visual Hierarchy Algorithm

```typescript
function calculateVisualHierarchy(slide: EnhancedSlide): VisualHierarchy {
  const elements = [];

  // Score each element by information density and importance
  if (slide.callout) {
    elements.push({
      id: 'callout',
      importance: 10,  // Callouts are always high-importance
      size: 'xl',
    });
  }

  elements.push({
    id: 'headline',
    importance: 8,
    size: slide.headline.length > 30 ? 'lg' : 'xl',
  });

  if (slide.subheadline) {
    elements.push({
      id: 'subheadline',
      importance: 5,
      size: 'md',
    });
  }

  slide.bullets.forEach((bullet, i) => {
    elements.push({
      id: `bullet-${i}`,
      importance: Math.max(3, 6 - i),  // First bullets more important
      size: 'sm',
    });
  });

  // Sort by importance and assign visual weight
  return elements.sort((a, b) => b.importance - a.importance);
}
```

### Template System Enhancement

Extend the existing 4 templates with layout-specific overrides:

```typescript
interface EnhancedDeckTemplate extends DeckTemplate {
  layoutOverrides: Partial<Record<LayoutHint, {
    gridGap: number;
    contentPadding: { top: number; right: number; bottom: number; left: number };
    calloutStyle: 'card' | 'pill' | 'banner' | 'floating';
    bulletStyle: 'dash' | 'dot' | 'number' | 'icon';
    headlineAlignment: 'left' | 'center';
  }>>;
  animations?: {
    slideTransition: 'fade' | 'slide' | 'none';
    elementEntrance: 'fade-up' | 'fade-in' | 'none';
  };
}
```

---

## 10. Export & Sharing

### Export Formats

| Format | Library | Use Case |
|--------|---------|----------|
| **Web Link** | Next.js page route | Shareable, trackable, interactive |
| **PDF** | `@react-pdf/renderer` (existing) | Email attachments, printing |
| **PPTX** | `pptxgenjs` (new) | Editing in PowerPoint/Google Slides |
| **PNG/JPG** | `html2canvas` or Puppeteer | Social media, thumbnails |

### Shareable Web Links

Create a public route that renders the deck as an interactive web presentation:

```
/deck/[deckId]/present  — Full-screen presentation mode
/deck/[deckId]/view     — Scrollable view with speaker notes
/deck/[deckId]/embed    — Embeddable iframe version
```

Features:
- Keyboard navigation (arrow keys, space)
- Progress indicator
- View tracking (time per slide, total views) — stored in Supabase
- Password protection (optional)
- Expiring links

### Analytics (Viewer Tracking)

```typescript
interface DeckViewEvent {
  deckId: string;
  viewerId?: string;  // If logged in or identified
  slideIndex: number;
  dwellTimeMs: number;
  timestamp: string;
  referrer?: string;
}

// Aggregate for the deck owner's dashboard
interface DeckAnalytics {
  totalViews: number;
  uniqueViewers: number;
  avgTimePerSlide: number[];  // Per-slide dwell times
  dropOffSlide: number;       // Where most viewers stop
  completionRate: number;     // % who view all slides
}
```

---

## 11. Technology Choices & Trade-offs

### What to Use From the Current Stack

| Component | Current | Decision | Rationale |
|-----------|---------|----------|-----------|
| LLM | Claude via `lib/llm/router.ts` | **Keep** | Already abstracted, supports fallback |
| PDF Rendering | `@react-pdf/renderer` | **Keep + enhance** | Working, extend for images/charts |
| Storage | Supabase Storage + Postgres | **Keep** | Already handles deck CRUD |
| Auth | Supabase Auth | **Keep** | Already protects routes |
| Styling | Tailwind CSS 4 | **Keep** | Perfect for slide layouts |

### What to Add

| Component | Library | Why This One |
|-----------|---------|--------------|
| PPTX Export | `pptxgenjs` | Most mature JS PowerPoint lib, works in Node + browser, TypeScript support, 3.4K GitHub stars |
| Chart Rendering | `recharts` or inline SVG | Already React-based, renders to SVG (works in both web preview and PDF) |
| HTML to Image | `html2canvas` | For slide thumbnails and social media export |
| Slide Navigation | Custom React | Simple enough to build, no framework needed |
| Markdown Support | `react-markdown` | For rich text in speaker notes |

### What NOT to Add (and Why)

| Temptation | Why Not |
|------------|---------|
| Fabric.js / Konva.js (freeform canvas) | Months of engineering for text editing, accessibility, mobile support. HTML slides are 90% as good with 10% of the effort. Revisit in v3. |
| reveal.js (presentation framework) | Opinionated, hard to customize, overkill when we control the renderer. |
| Polotno (design editor SDK) | Commercial license, dependency risk, doesn't match our design language. |
| Real-time collaboration (Yjs/CRDT) | Massive engineering effort, not needed for v1. Founders build decks alone. |
| AI image generation | Cost and complexity. Use stock photos (Unsplash API, free) for v1. AI images in v2. |

---

## 12. Implementation Phases

### Phase 1: Enhanced Generation Pipeline (2-3 weeks)

**Goal:** Multi-agent content generation with narrative planning — no UI changes yet.

1. **Research Agent** — Extract structured Company Brief from text input
2. **Narrative Agent** — Generate Storyline with narrative connectors
3. **Content Agent** — Write slide content following Storyline guidance
4. **Review Agent** — Quality gate with repair loop
5. **Wire up the pipeline** — Orchestrator chains agents sequentially
6. **Enhance existing `generateDeck`** — Use new pipeline, maintain backward compat
7. **Add tests** — Unit tests for each agent, integration test for full pipeline

**Files to create/modify:**
```
services/deckAgents/researchAgent.ts      (new)
services/deckAgents/narrativeAgent.ts     (new)
services/deckAgents/contentAgent.ts       (new)
services/deckAgents/designAgent.ts        (new)
services/deckAgents/reviewAgent.ts        (new)
services/deckAgents/orchestrator.ts       (new)
services/deckAgents/types.ts              (new)
lib/prompts/deckAgents/                   (new directory)
services/deckGenerationService.ts         (modify — use orchestrator)
types/deckGeneration.ts                   (extend — EnhancedSlide, etc.)
```

### Phase 2: Storyline Stage UI (1-2 weeks)

**Goal:** Users see and can edit the narrative structure before slides are generated.

1. **Storyline editor page** — drag-to-reorder slides, edit key messages, change framework
2. **Slide type selector** — add/remove slides from the storyline
3. **Framework picker** — visual selection of narrative framework
4. **"Generate Slides" button** — sends confirmed storyline to Content Agent
5. **Loading states** — streaming progress as each slide is generated

**Files to create:**
```
app/(app)/deck/create/page.tsx            (new)
app/(app)/deck/create/storyline/page.tsx  (new)
views/components/deck-builder/            (new directory)
  StorylineEditor.tsx
  SlideTypeCard.tsx
  FrameworkPicker.tsx
  NarrativeConnector.tsx
hooks/useDeckBuilder.ts                   (new)
```

### Phase 3: Interactive Slide Preview & Editing (2-3 weeks)

**Goal:** Web-based slide preview with inline editing.

1. **Slide renderer components** — one per layout type (centered, two-column, etc.)
2. **Inline text editing** — click headline/bullet to edit
3. **Slide navigation** — thumbnail strip, keyboard nav, slide count
4. **Template switcher** — live preview of all 4 templates
5. **Slide reordering** — drag slides in thumbnail strip

**Files to create:**
```
views/components/deck-preview/            (new directory)
  SlideRenderer.tsx
  SlideCanvas.tsx
  SlideThumbnailStrip.tsx
  layouts/
    CenteredLayout.tsx
    TwoColumnLayout.tsx
    ComparisonLayout.tsx
    CardsLayout.tsx
    BigNumberLayout.tsx
  InlineEditor.tsx
  TemplateSwitcher.tsx
app/(app)/deck/[deckId]/edit/page.tsx     (new)
app/(app)/deck/[deckId]/present/page.tsx  (new)
```

### Phase 4: Coach Agent (Conversational Editing) (2 weeks)

**Goal:** Chat-based deck refinement with pitch coaching intelligence.

1. **Chat panel UI** — slide-aware chat alongside the deck preview
2. **Coach Agent service** — intent classification + targeted edits
3. **Diff preview** — show before/after for each edit suggestion
4. **Pitchr analysis integration** — Coach references analysis scores and fixes
5. **Accept/reject UX** — apply or dismiss each suggestion

**Files to create:**
```
services/deckAgents/coachAgent.ts         (new)
lib/prompts/deckAgents/coach.ts           (new)
views/components/deck-builder/
  CoachChat.tsx                           (new)
  EditDiffPreview.tsx                     (new)
  CoachSuggestion.tsx                     (new)
hooks/useDeckCoach.ts                     (new)
app/api/deck/coach/route.ts              (new)
```

### Phase 5: Multi-Format Export (1 week)

**Goal:** Export to PPTX, enhanced PDF, and shareable web link.

1. **PPTX export service** — `pptxgenjs` integration
2. **Enhanced PDF** — images, charts, better typography
3. **Public deck page** — shareable web link with view tracking
4. **Export UI** — format picker, download button

**Files to create:**
```
services/pptxExportService.ts             (new)
app/api/deck/export/route.ts              (new)
app/(public)/deck/[deckId]/page.tsx       (new)
views/components/deck-builder/
  ExportDialog.tsx                        (new)
```

### Phase 6: Analysis → Deck Flywheel (1 week)

**Goal:** Connect pitch analysis to deck generation for the killer feedback loop.

1. **"Generate Deck" CTA on results page** — pre-populates builder with analysis insights
2. **Company Brief from analysis** — auto-extract from scored runs
3. **Weakness-aware generation** — Narrative Agent prioritizes fixing weak categories
4. **Re-analyze deck content** — "Score this deck" button creates a new pitch run from deck text

**Files to modify/create:**
```
services/deckFromAnalysis.ts              (new)
app/(app)/results/[runId]/page.tsx        (modify — add "Generate Deck" CTA)
views/components/results/                 (modify — add deck generation entry point)
```

---

## 13. Smart Moves & Differentiators

### 1. The Analysis → Deck Flywheel (Unique Moat)

No competitor has a pitch analysis engine feeding into deck generation. This creates:
- **Lock-in**: Users analyze on Pitchr to get better decks
- **Data advantage**: Every analysis teaches us what investors care about
- **Upsell path**: Free analysis → paid deck generation

### 2. Investor-Calibrated Content (Not Just AI-Generated)

Our system prompt and rubric are built from real investor feedback patterns. The Content Agent doesn't just write — it writes what investors want to see, in the order they want to see it. This is embedded in our prompt engineering, not bolt-on.

### 3. Speaker Notes as First-Class Output

Chronicle and Gamma generate slides. We generate slides + speaker notes + pitch scripts. The founder gets not just the deck but what to *say* on each slide. This ties directly to our core product (pitch coaching).

### 4. Confidence Scoring Per Slide

Each slide is tagged with `confidenceLevel: 'high' | 'medium' | 'low'` based on how much real data backs it. This is transparent — the founder sees which slides need more data before presenting to investors. No other tool does this.

### 5. Narrative Framework Selection (Not Just Templates)

Users choose a *story structure*, not a visual template. The same data produces different decks depending on the framework:
- **Problem-Solution-Proof**: Standard VC pitch
- **Data-First**: When traction is the strongest asset
- **Underdog**: When the team/insight is the differentiator
- **Vision-Reality-Bridge**: For moonshot pitches

### 6. Progressive Enhancement Strategy

Start simple, add complexity based on demand:
- v1: Text-based slides with smart layouts
- v2: AI-generated images + data visualizations
- v3: Freeform canvas editor
- v4: Real-time collaboration
- v5: Investor CRM integration (track who views your deck)

### 7. Use Pitchr's Existing Edge Functions

The `deck-upload`, `deck-list`, `deck-detail` edge functions already handle deck CRUD. The new builder feeds into this existing infrastructure — generated decks are stored identically to uploaded decks.

### 8. Streaming Generation UX

Don't make users wait for the full pipeline. Stream progress:
1. "Researching your company..." (Research Agent)
2. "Designing your story arc..." (Narrative Agent, show storyline)
3. "Writing slide 1 of 8..." (Content Agent, show each slide as it completes)
4. "Reviewing quality..." (Review Agent)
5. "Your deck is ready!"

This creates a "watching AI think" experience similar to ChatGPT's streaming, but more structured and satisfying.

### 9. Claude Structured Outputs for Reliability

Use Claude's `output_config.format: "json_schema"` with Zod schemas for all agent outputs. This eliminates the current "parse and pray" pattern in `deckGenerationService.ts` and guarantees valid structured output:

```typescript
import { z } from 'zod';

const StorylineSchema = z.object({
  framework: z.enum(['problem-solution-proof', 'vision-reality-bridge', 'data-first', 'underdog']),
  slides: z.array(z.object({
    position: z.number(),
    type: z.enum(['hook', 'problem', 'solution', 'traction', 'market', 'business_model', 'team', 'ask']),
    narrativePurpose: z.string(),
    keyMessage: z.string(),
    connector: z.string(),
    suggestedLayout: z.enum(['centered', 'two-column', 'comparison', 'cards', 'big-number']),
  })),
});
```

### 10. Cost Control via Agent Routing

Not every deck generation needs the full 5-agent pipeline:
- **Quick deck** (simple description): Skip Research Agent, simplified Narrative Agent
- **Full deck** (rich input + analysis): All 5 agents
- **Deck refresh** (editing existing): Only Coach Agent

Route based on input richness to control LLM costs.

---

## 14. Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM output quality inconsistency | Medium | High | Review Agent + repair loop + fallback prompts |
| PPTX rendering fidelity | Medium | Medium | Limit to supported PptxGenJS features, test across PowerPoint/Google Slides/Keynote |
| Pipeline latency (5 LLM calls) | High | Medium | Parallel where possible, streaming UX, caching Company Briefs |
| Structured output schema complexity | Low | Medium | Keep schemas flat, use Zod validation |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users want freeform editing (canvas) | Medium | High | HTML inline editing covers 80% of needs. Track feature requests. |
| Quality doesn't match Chronicle | Medium | High | Narrative framework + review loop + iterative improvement. Our pitch expertise is the differentiator, not visual design. |
| Users don't connect analysis → deck | Low | Medium | Strong CTA on results page, onboarding nudge |
| LLM cost per deck generation | Medium | Medium | Agent routing, cache briefs, use Sonnet for simpler agents |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Chronicle ships similar analysis features | Low | High | Our analysis engine has deep domain expertise built over time. Hard to replicate quickly. |
| Free tier abuse (deck generation is expensive) | Medium | Medium | Generation count limits per plan tier, rate limiting |

---

## Sources

- [Chronicle AI Full Review 2026](https://max-productive.ai/ai-tools/chronicle/)
- [Chronicle HQ](https://chroniclehq.com)
- [Chronicle AI Presentation Maker](https://chroniclehq.com/ai-presentation-maker)
- [Chronicle — The Cursor for Presentations](https://www.globenewswire.com/news-release/2025/06/03/3092926/0/en/Meet-Chronicle-The-Cursor-for-Presentations-with-100k-Waitlisted-Users-Launches-Public-Beta.html)
- [Workflow Control Is the Next AI Battleground](https://aibenchmarked.medium.com/chronicle-hq-review-2025-does-workflow-control-beat-gammas-ai-magic-a7d291e004ac)
- [Google Developers — Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
- [O'Reilly — Designing Effective Multi-Agent Architectures](https://www.oreilly.com/radar/designing-effective-multi-agent-architectures/)
- [How to Build Multi-Agent Systems (2026 Guide)](https://dev.to/eira-wexford/how-to-build-multi-agent-systems-complete-2026-guide-1io6)
- [AI Pitch Deck Generator — Multimodal Agent Architecture](https://dev.to/bibhupradhan/ai-pitch-deck-generator-a-multimodal-ai-agent-that-generates-complete-startup-pitch-decks-392c)
- [Presenton — Open-Source AI Presentation Generator](https://github.com/presenton/presenton)
- [Presenton DeepWiki — Architecture](https://deepwiki.com/presenton/presenton)
- [PptxGenJS — Programmatic PowerPoint](https://github.com/gitbrent/PptxGenJS)
- [pptx-generator-pro — React + PptxGenJS](https://github.com/nitishahuja/pptx-generator-pro)
- [Claude API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Claude Office Skills — PPTX Generation](https://github.com/tfriedel/claude-office-skills)
- [Gamma AI Pitch Deck Generator](https://gamma.app/products/presentations/pitch-decks)
- [Beautiful.ai](https://www.beautiful.ai/)
- [Konva.js Canvas Editor](https://konvajs.org/docs/sandbox/Canvas_Editor.html)
- [Fabric.js](https://fabricjs.com/)
- [React Flow — Slide Shows Tutorial](https://reactflow.dev/learn/tutorials/slide-shows-with-react-flow)
- [14 Best AI Pitch Deck Generators in 2026](https://www.contentbeta.com/blog/ai-pitch-deck-generator/)
- [7 Agentic AI Trends to Watch in 2026](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/)
