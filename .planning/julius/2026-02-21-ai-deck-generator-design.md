# AI Pitch Deck Generator — Design Doc

## Goal

Generate professional 10-slide pitch deck PDFs from a freeform text description using Claude, with 4 visual template presets and `@react-pdf/renderer` for server-side PDF creation.

## Decisions

- **Input:** Freeform text prompt (company name + pitch description)
- **Output:** PDF only (landscape A4, rendered server-side)
- **Templates:** 4 visual presets (Minimal Dark, Corporate Clean, Bold Gradient, Startup Fresh)
- **Slide structure:** Fixed 10-slide VC format (Title, Problem, Solution, Market, Product, Business Model, Traction, Competition, Team, Ask)
- **Architecture:** Single-shot generation (one LLM call, one render pass, one API call)
- **PDF engine:** `@react-pdf/renderer` (React components that render to PDF)
- **LLM:** Existing router (`lib/llm/router.ts`) — Claude primary, Gemini fallback

## Data Flow

```
Frontend Form                    API Route                     Service Layer
-----------------                ---------                     -------------
User fills form    --POST-->   /api/deck/generate   --call-->  deckGenerationService
  - companyName                   |                              |
  - description                   |                         1. Build prompt
  - templateId                    |                         2. Call LLM (router)
                                  |                         3. Parse slide JSON
                                  |                         4. Render PDF (@react-pdf)
                                  |                         5. Upload to Supabase Storage
                                  |                         6. Insert deck + slides records
                              <--JSON--                     7. Return DeckRecord
                                  |
Frontend receives deck record, refreshes deck list
```

## API Contract

### POST /api/deck/generate

**Request:**
```typescript
interface GenerateDeckRequest {
  companyName: string;
  description: string;
  templateId: 'minimal-dark' | 'corporate-clean' | 'bold-gradient' | 'startup-fresh';
}
```

**Response:** `DeckRecord` (same shape as upload endpoint returns)

## LLM Prompt Strategy

**System prompt:** Role as world-class pitch deck writer (YC/a16z/Sequoia caliber). Constraints: fixed 10-slide structure, strict JSON output, no markdown. Quality rules: standalone headlines (max 8 words), concise bullets (max 6 words), data-driven, storytelling arc.

**User prompt:** Company name + description, then explicit per-slide instructions with expected output fields.

**Quality techniques:**
- Few-shot example (one ideal slide in prompt)
- Temperature 0.4
- Max tokens 8192
- JSON schema enforcement via prompt + validation
- Repair fallback if JSON parse fails (same pattern as analysisService)

**Output schema:**
```typescript
interface GeneratedSlide {
  type: 'title' | 'problem' | 'solution' | 'market' | 'product' |
        'business_model' | 'traction' | 'competition' | 'team' | 'ask';
  headline: string;
  subheadline?: string;
  bullets: Array<{ text: string; detail?: string }>;
  callout?: { value: string; label: string };
}

type GeneratedDeck = GeneratedSlide[];  // always 10 items
```

## Template System

4 templates, each a configuration object:

| Template | Background | Text | Accent | Vibe |
|----------|-----------|------|--------|------|
| Minimal Dark | #0f0f0f | #ffffff | #ff5941 | Sleek, modern |
| Corporate Clean | #ffffff | #1a1a2e | #2563eb | Professional |
| Bold Gradient | #1a1a2e->#3b1d8e | #ffffff | #ffaa33 | Confident |
| Startup Fresh | #fafafa | #1f2937 | #10b981 | Approachable |

```typescript
interface DeckTemplate {
  id: string;
  name: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentSecondary: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  layout: {
    headlineSize: number;
    bodySize: number;
    bulletSize: number;
    padding: number;
    calloutStyle: 'card' | 'pill' | 'banner';
  };
}
```

Templates defined in `config/deckTemplates.ts`.

## PDF Rendering

Using `@react-pdf/renderer`:
- Each slide type gets a dedicated React component
- Components receive `GeneratedSlide` data + `DeckTemplate` style
- All pages: landscape A4, page numbers, accent bar decoration
- Slide-type-specific layouts:
  - **Title:** Centered, large headline, tagline, company name
  - **Problem/Solution:** Headline + numbered bullets
  - **Market:** Headline + prominent callout stat + bullets
  - **Traction:** Metrics in grid/card layout
  - **Competition:** Table-like comparison
  - **Team:** Card layout per member
  - **The Ask:** Centered funding amount + use-of-funds breakdown

Components in `views/components/deck-pdf/`.

## Frontend UX

1. User clicks "Create with AI" on deck page
2. Modal opens with:
   - Template picker (horizontal row of 4 preview cards, selected = accent border)
   - Company Name input (required)
   - Pitch Description textarea (required, with placeholder guidance)
3. "Generate Deck" button (disabled until fields filled)
4. Loading state: spinner + "Generating your pitch deck..."
5. Success: modal closes, deck appears in list with "AI Generated" badge
6. Error: toast with retry

**New components:**
- `GenerateDeckModal` — full modal
- `TemplateCard` — preview card per template
- `GenerateDeckForm` — form + submit logic

All: glassmorphism styling, `'use client'`, named exports, Tailwind.

## New Files

```
config/deckTemplates.ts              # 4 template definitions
lib/prompts/deckGeneration.ts        # System + user prompts for deck generation
services/deckGenerationService.ts    # LLM call + JSON parse + PDF render + upload
app/api/deck/generate/route.ts       # POST handler
views/components/deck-pdf/           # @react-pdf slide components
  TitleSlide.tsx
  ContentSlide.tsx                   # Shared layout for Problem/Solution/Product/etc.
  MetricsSlide.tsx                   # Traction/Market with callout stats
  ComparisonSlide.tsx                # Competition table layout
  TeamSlide.tsx                      # Team cards
  AskSlide.tsx                       # Funding ask layout
  DeckDocument.tsx                   # Top-level Document component
  styles.ts                          # Shared @react-pdf StyleSheet helpers
views/components/GenerateDeckModal.tsx
views/components/TemplateCard.tsx
```

## Dependencies

New: `@react-pdf/renderer` (yarn add)

## Error Handling

- LLM failure: retry once, then return error to frontend
- JSON parse failure: attempt repair with second LLM call (existing pattern)
- PDF render failure: return error with slide data (debug info)
- Storage upload failure: return error, no partial deck records
- Input validation: company name required (1-100 chars), description required (10-5000 chars)
