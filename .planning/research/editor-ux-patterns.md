# Editor UX Patterns: Chronicle AI & Modern Slide Editors

**Date:** 2026-03-11
**Context:** Research for Pitchr pitch deck editor (Next.js 15 / React 19). Documents complete editor UX patterns from Chronicle AI and comparable tools.
**Status:** Research complete

---

## Table of Contents

1. [Chronicle AI — Complete Editor UX](#1-chronicle-ai--complete-editor-ux)
2. [Competitor Editor UX](#2-competitor-editor-ux)
3. [Interaction Patterns](#3-interaction-patterns)
4. [Block/Widget System Architecture](#4-blockwidget-system-architecture)
5. [AI-Powered Editing Features](#5-ai-powered-editing-features)
6. [Present Mode Patterns](#6-present-mode-patterns)
7. [Mobile Editing Patterns](#7-mobile-editing-patterns)
8. [Comparison Matrix](#8-comparison-matrix)
9. [Implications for Pitchr](#9-implications-for-pitchr)
10. [Sources](#10-sources)

---

## 1. Chronicle AI — Complete Editor UX

Chronicle (app.chroniclehq.com) positions itself as the "Cursor for presentations" — a freeform canvas editor with AI-augmented storytelling. It launched public beta in June 2025 with 100K+ waitlisted users.

### 1.1 Canvas & Layout

- **Freeform smart canvas:** Not grid-locked. Elements can be placed anywhere with pixel-level precision. The founders explicitly chose freeform over constrained layouts: "Limiting the freedom on what layouts can be created makes most presentation tools too casual for real use cases."
- **Vertical chapter scrolling:** Presentations are organized into "chapters" (equivalent to slides), but the editor shows them in a continuous vertical scroll rather than paginated view. Chapter navigation sidebar on the left keeps large decks organized.
- **Dark editor background** with bordered slide containers — the canvas sits on a dark workspace, with the active slide rendered as a light/dark card depending on theme.
- **Snapping behavior** is customizable — elements snap to alignment guides, edges, and centers of other elements.

### 1.2 Top Bar

- **Breadcrumb navigation:** Shows document title, current chapter number (e.g., "Pitch: Pitchr / Chapter 9 of 15")
- **Action buttons:** Share, Export (PDF now, PowerPoint rolling out 2026), Present
- **User avatar** for account/collaboration indicator

### 1.3 Bottom Toolbar (Persistent)

A persistent bottom toolbar with primary actions:

| Button | Function |
|--------|----------|
| **+ Insert** | Opens widget/content block insertion panel |
| **Remix** | AI-powered layout remixing (64+ styles) |
| **Theme** | Opens theme customization panel |
| **Background** | Slide background settings (colors, gradients, images) |
| **...** | Additional options menu |

This bottom placement keeps the canvas area maximally clear and follows the pattern of tools like Figma (bottom toolbar for creation tools).

### 1.4 Floating Formatting Toolbar (Contextual)

Appears above the selected element. Contains context-sensitive controls:

- **Block type dropdown:** Switch between Heading, Paragraph, etc.
- **Size variant selector:** Display, Large, Medium, Small
- **Font picker** (Aa icon)
- **Color picker** for text/element color
- **Alignment controls** (left, center, right, justify)
- **Shape/border options** for container elements
- **Additional formatting:** Bold, italic, links, lists

This is the "Turn into" mechanism — selecting a block and changing its type via the dropdown transforms it in place (e.g., Paragraph to Heading, text block to Card, etc.).

### 1.5 Theme Panel (Left Side)

- **Scope toggle:** "This chapter" vs. "Whole document" — apply theme changes granularly or globally
- **Theme dropdown:** Named presets (Retro tech, Chronicle, etc.)
- **Chapter presets:** Neutral light, Neutral dark, Accent — each shows a color dot + "Aa" text preview
- **Close button** at bottom of panel
- **Light/dark mode:** Backgrounds automatically adapt based on theme

### 1.6 Widget/Content Block Types

Chronicle uses "widgets" — pre-engineered, interactive content blocks with built-in animation and motion:

| Category | Types |
|----------|-------|
| **Text** | Display heading, heading, paragraph, callout text |
| **Media** | Image (rounded corners, freely positioned), video |
| **Cards** | Vertical card, horizontal card, icon-headed card, number-headed card, quote card |
| **Layout** | Grid layouts (2-column, 3-column), layout grids |
| **Data** | Chart (beta), metrics/big numbers |
| **Interactive** | Sticky note, mockup |
| **Embeds** | Figma, Airtable, Google Sheets, YouTube, Notion, Loom, Cal.com, Looker, 30+ integrations |

### 1.7 "Turn Into" Menu

Right-click or transform menu options for any selected block:
- Paragraph, Heading, Image, Video, Card, Chart (Beta), Embed/link, Mockup, Sticky note

This allows non-destructive type transformation — content persists while the rendering type changes.

### 1.8 Slide Creation Options

At the top of the chapter/slide list:
- **+ Blank slide** — empty canvas
- **Start with template** — browse template library
- **Generate with AI** — AI creates slide from prompt/topic

### 1.9 AI Features

- **Generate:** Convert raw ideas, rough notes, PDFs, URLs, or pasted text into complete presentations. User selects presentation type (pitch, sales, proposal), slide count, creativity level ("creative vs. faithful"), language, and theme.
- **Remix:** Cycles through 64+ layout variations for any slide. Costs ~1 AI token. Transforms the visual arrangement without changing content. Users report this is "daunting" with so many options.
- **Rewrite:** Transforms raw thoughts into polished content directly inside a slide.
- **Narrative engine:** Organizes content into storytelling frameworks (hook, problem, solution, proof sequences) — this is Chronicle's key differentiator vs. competitors.

### 1.10 Collaboration

- Real-time shared editing with live cursors
- Access management and permissions
- Keyboard-first workflow with shortcut support

### 1.11 Export & Sharing

- Share as live website (interactive, web-native)
- PDF export (available now)
- PowerPoint export (announced November 2025, rolling out 2026)
- Live presentation mode

---

## 2. Competitor Editor UX

### 2.1 Gamma

**Editor paradigm:** Card-based, scrollable format. Not a traditional slide-by-slide editor.

**Card system:**
- Cards are the fundamental building blocks — each acts as a flexible slide, section, or canvas
- Cards auto-adjust height to fit content (fluid sizing by default)
- Fixed aspect ratios available (e.g., 16:9) via Page Setup
- Add cards by hovering between existing cards for "+" button, or via AI sparkle icon
- Right-click card edges for quick menu (copy, restyle, add notes, change layout)
- Cards can be hidden (removed from presentation but preserved in document)
- No limit on total cards

**Content editing:**
- Type "/" within a card to insert new blocks (slash commands, Notion-style)
- Drag from insert menu for media and elements
- AI sparkle icon suggests new cards based on existing content topics

**AI Agent (Gamma 3.0, September 2025):**
- Natural language AI collaborator that can research the web, refine content, restyle entire presentations, create diagrams, understand screenshots/links
- Bulk editing: "make the tone more formal" or "restyle this deck with a dark theme" applies across entire presentation
- Agent chat with multiple output options to review and select

**Strengths:** Speed of creation, generous free plan, multi-format output (decks, docs, websites)
**Weaknesses:** Outputs often feel generic, PPT export loses charts/fonts/animations, requires manual hierarchy fixes, card-based format not ideal for formal presentations

### 2.2 Beautiful.ai

**Editor paradigm:** Constraint-based Smart Slides — auto-formatting that eliminates manual layout work.

**Smart Slides:**
- 300+ professionally designed intelligent layouts
- Auto-adjust spacing, text sizing, and visual positioning as content changes
- Eliminates "nudging text boxes" — design constraints enforce good layout automatically
- Categories: Chart/Data, Impact, Comparison, People/Team, Diagram/Process, Big Number

**October 2025 editor update:**
- **Slide Navigator:** Thumbnail sidebar for browsing, adding, deleting, drag-to-reorder slides. Collapsible/resizable.
- **Control Bar:** Sits directly under the active slide. Context-aware — surfaces relevant controls for whatever is selected. Replaces traditional top toolbar pattern.

**DesignerBot AI:**
- AI assistant for content generation and design suggestions
- Less autonomous than Gamma Agent — more suggestion-based

**Theme system:**
- Define colors, fonts, logos, footers once
- Themes apply instantly to AI-generated decks and any Smart Slides added
- Strong brand consistency enforcement

**Strengths:** Professional output with zero design skill, brand consistency, real-time collaboration
**Weaknesses:** Less creative freedom (constrained layouts), limited customization beyond Smart Slide parameters

### 2.3 Pitch.com

**Editor paradigm:** Traditional slide editor with modern collaboration features. Closest to "Google Slides but better."

**Editor features:**
- Inline element editors — every element has a point-click-edit interface showing most relevant options
- Slide templates and style switching
- Background colors and images per slide
- Speaker notes per slide

**Collaboration (key differentiator):**
- Real-time multi-user editing (Google Docs-style)
- Per-slide assignees and statuses (project management integration)
- Emoji reactions on slides (lightweight feedback)
- Integrated video meetings for remote collaboration
- Version history and auto-save

**Strengths:** Team workflows, data integration, brand consistency, structured editing
**Weaknesses:** Less AI-powered content generation than competitors, more traditional editing paradigm

---

## 3. Interaction Patterns

### 3.1 Selection

| Pattern | Implementation |
|---------|---------------|
| **Single click** | Select element, show resize handles and contextual toolbar |
| **Double click** | Enter text editing mode within element |
| **Click canvas** | Deselect all elements |
| **Multi-select** | Shift+click or drag-select rectangle (Chronicle, Gamma) |
| **Tab** | Cycle through elements on current slide |

### 3.2 Drag & Drop

- **Element repositioning:** Click and drag selected elements. Snap guides appear during drag (horizontal/vertical alignment with other elements, slide center, margins).
- **Reorder slides:** Drag thumbnails in sidebar/filmstrip to reorder chapters/slides.
- **Insert from panel:** Drag widgets/blocks from insert panel onto canvas.
- **Cross-slide move:** Some editors allow dragging elements between slides via filmstrip.

Best practice from UX research: Drag-and-drop provides direct manipulation that other methods cannot match, but should always have a keyboard/menu alternative for accessibility.

### 3.3 Resize

- **Corner handles:** Maintain aspect ratio by default, free resize with modifier key (Shift)
- **Edge handles:** Resize in one dimension only
- **Minimum sizes:** Prevent elements from becoming too small to interact with
- **Snap to common sizes:** Elements snap to standard proportions during resize

### 3.4 Text Editing

- **Double-click to edit:** Standard pattern — double-click text element to enter inline editing
- **Floating toolbar appears** above/near text with formatting options (bold, italic, color, alignment)
- **Auto-resize:** Text containers grow vertically as content is added (Chronicle, Gamma)
- **Slash commands:** "/" to insert new block types within a container (Gamma)
- **Markdown shortcuts:** "# " for heading, "- " for list, "**" for bold (Gamma, Notion-style)

### 3.5 Keyboard Shortcuts

Common patterns across editors:

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |
| Cmd/Ctrl+C/V/X | Copy/Paste/Cut |
| Cmd/Ctrl+D | Duplicate element |
| Delete/Backspace | Remove selected element |
| Arrow keys | Nudge element (1px or grid unit) |
| Shift+Arrow | Nudge element larger increment (10px) |
| Cmd/Ctrl+A | Select all on current slide |
| Cmd/Ctrl+G | Group selected elements |
| / | Open block/widget insert menu (Gamma) |
| Esc | Deselect / exit text editing mode |

### 3.6 Context Menus

- **Right-click element:** Cut, Copy, Paste, Duplicate, Delete, Lock, Group, Bring Forward/Send Back, Turn Into
- **Right-click canvas:** Paste, Add element, Slide settings
- **Right-click slide thumbnail:** Duplicate slide, Delete slide, Hide slide, Move up/down

---

## 4. Block/Widget System Architecture

### 4.1 Notion's Block Model (Foundation)

Modern slide editors borrow heavily from Notion's block architecture:

- **Everything is a block:** Text, images, lists, containers, even pages/slides themselves
- **Block structure:** Each block has an ID (UUID), type, properties, content (ordered child block IDs), and parent pointer
- **Type-agnostic properties:** Properties persist independently of type. Converting a heading to paragraph preserves all properties — they are simply rendered differently. This enables "Turn Into" transformations.
- **Hierarchical render tree:** Blocks nest via content arrays. Different block types render children differently (lists indent, toggles collapse, grids arrange).
- **Structural indentation:** Indenting moves a block into its sibling's content array (tree manipulation, not CSS).
- **Transaction-based operations:** All changes expressed as atomic operations, batched into transactions — enables undo/redo, real-time sync, and conflict resolution.

### 4.2 Slide Editor Block Adaptations

In a presentation context, the block model adapts:

| Notion concept | Slide editor equivalent |
|---------------|----------------------|
| Page | Slide / Chapter |
| Block | Widget / Content element |
| Content array | Slide element list (z-ordered) |
| Block type | Widget type (heading, card, chart, image) |
| Properties | Position (x, y), size (w, h), style, content data |
| Nesting | Grouped elements, cards containing text + images |

### 4.3 Implementation Frameworks

Open-source block editor frameworks relevant to a React/Next.js stack:

- **BlockNote** (blocknotejs.org): React block editor built on ProseMirror/Tiptap. Notion-style. Good for text-heavy blocks within slides.
- **Yoopta-Editor**: React rich-text editor supporting Notion/Craft/Medium-style block editing. Extensible block types.
- **Blocky Editor**: Lightweight, framework-agnostic block editor. Small bundle, embeddable.

For the canvas/spatial positioning layer, see the companion research doc: `canvas-editing-technologies.md` (Konva.js recommended).

### 4.4 Chronicle's Widget System

Chronicle's widgets are differentiated from simple blocks:

- **Pre-engineered with motion:** Charts animate on reveal, images have hover states, cards transition smoothly
- **Interactive by default:** Each widget comes with built-in interactivity (unlike static blocks)
- **Pixel-perfect constraints:** Widgets enforce design quality — spacing, typography, visual hierarchy are baked in
- **64+ remix layouts:** Each widget can be rendered in multiple layout variations via the Remix feature

This is a hybrid approach: structured blocks for content, but with rich visual presets and animation built into each block type.

---

## 5. AI-Powered Editing Features

### 5.1 Feature Comparison

| Feature | Chronicle | Gamma | Beautiful.ai | Pitch.com |
|---------|-----------|-------|-------------|-----------|
| **Generate from prompt** | Yes (topic, URL, PDF, text) | Yes (text prompt) | Yes (DesignerBot) | Limited |
| **Remix/restyle** | 64+ layout styles per slide | Agent can restyle entire deck | Smart Slide auto-layout | Template switching |
| **Content rewrite** | In-slide rewrite tool | Agent chat rewrite | No | No |
| **Narrative structuring** | Yes (hook/problem/solution) | No | No | No |
| **Bulk AI editing** | No | Yes (Agent applies across deck) | No | No |
| **Web research** | Yes (AI-assisted) | Yes (Agent researches web) | No | No |
| **Design feedback** | No | Yes (Agent gives feedback) | Implicit (Smart Slides) | No |

### 5.2 Remix Deep Dive

Chronicle's Remix is specifically a **layout transformation** feature:
- Takes existing content (text, images, data) on a slide
- Generates 64+ alternative visual arrangements
- User cycles through options and picks preferred layout
- Content stays the same; only spatial arrangement and styling changes
- Costs ~1 AI token per remix
- Users report the large number of options can be overwhelming

This is distinct from content generation — Remix is purely about **visual layout exploration** with fixed content.

### 5.3 Generation Workflow (Chronicle)

1. Input: paste text, upload PDF, share URL, or type rough notes
2. Select presentation type: pitch, sales, proposal, report, etc.
3. Choose slide/chapter count
4. Set creativity level slider: "faithful" (stick close to source) vs. "creative" (interpret freely)
5. Select language and theme (light/dark)
6. Review AI-generated outline, adjust chapter titles and ordering
7. Generate — AI produces full presentation with styled widgets
8. Refine individual slides in editor

---

## 6. Present Mode Patterns

### 6.1 Chronicle Present Mode

Chronicle's present mode has unique interaction features:

- **Peek:** Hovering over a data point or element fades everything else while the target enlarges — isolates audience attention on a single element
- **Deep Hover:** Enables zoom-in interactions on specific content areas during live presentation
- **Cursor-based highlighting:** Presenter's cursor acts as a spotlight/highlight tool
- **Intent-based revelation:** Content can be revealed progressively based on presenter actions

These features give Chronicle a "live demo" feel rather than static slide-flipping.

### 6.2 Standard Present Mode Patterns

Common across all editors:
- Full-screen takeover (F5 / Cmd+Enter)
- Slide-by-slide navigation (arrow keys, click, swipe)
- Speaker notes panel (presenter view on secondary display)
- Laser pointer / cursor highlight
- Slide overview / jump-to-slide grid
- Timer/clock display
- Audience view sharing (link-based for remote)

### 6.3 Web-Native Presentation

Both Chronicle and Gamma support sharing presentations as interactive web pages rather than static PDF/PPT:
- Scrollable web format (not just slide-by-slide)
- Embedded interactive elements (charts, videos, embeds)
- Responsive layout for different screen sizes
- Analytics on viewer engagement

---

## 7. Mobile Editing Patterns

### 7.1 Current State

Mobile editing support is limited across all AI slide editors:

- **Chronicle:** Desktop-only. No mobile app. Presentations are "mobile-friendly" for viewing but not editing.
- **Gamma:** Mobile viewing works well (scrollable cards). Editing is limited on mobile.
- **Beautiful.ai:** Responsive viewing. Limited mobile editing.
- **Pitch.com:** Mobile web app with emoji reactions and commenting. Editing capabilities more limited than desktop.

### 7.2 Touch Interaction Patterns (for future implementation)

For touch-based slide editing:

| Action | Touch gesture |
|--------|--------------|
| Select element | Tap |
| Move element | Long press + drag |
| Resize element | Pinch on selected element |
| Edit text | Double tap |
| Zoom canvas | Two-finger pinch |
| Pan canvas | Two-finger drag |
| Context menu | Long press |
| Scroll between slides | Swipe vertically |
| Undo | Three-finger swipe left (iOS convention) |

### 7.3 Mobile-First Considerations

- Bottom toolbar placement works well for mobile (thumb-accessible)
- Floating contextual toolbar should position above selection but within viewport
- Panels (theme, insert) should slide up as bottom sheets on mobile
- Touch targets minimum 44x44px (Apple HIG) / 48x48dp (Material)
- Consider read-only or light-edit mode on mobile, full editing on tablet/desktop

---

## 8. Comparison Matrix

| Feature | Chronicle | Gamma | Beautiful.ai | Pitch.com |
|---------|-----------|-------|-------------|-----------|
| **Editor paradigm** | Freeform smart canvas | Card-based scrollable | Constraint-based Smart Slides | Traditional slide editor |
| **Content model** | Widgets (pre-engineered blocks) | Cards with nested blocks | Smart Slide templates | Slide elements |
| **AI generation** | Strong (narrative engine) | Strong (Agent + 20 models) | Moderate (DesignerBot) | Limited |
| **Layout freedom** | Full freeform | Card constraints | Smart Slide constraints | Full freeform |
| **Design quality floor** | High (widget presets) | Medium (needs manual fixes) | High (auto-formatting) | Medium (user skill dependent) |
| **Collaboration** | Real-time cursors | Real-time | Real-time | Real-time + assignees |
| **Present mode** | Peek/Deep Hover | Standard | Standard | Standard |
| **Export** | PDF, web link | PDF, PPT (lossy), web | PDF, PPT, web | PDF, PPT |
| **Learning curve** | High (4-6 hrs) | Low (<1 hr) | Low (<1 hr) | Medium (1-2 hrs) |
| **Mobile editing** | None | Limited | Limited | Limited (commenting) |
| **Target user** | Founders, sales, consultants | Individuals, early drafts | Teams, brand-consistent | Teams, collaborative |
| **Pricing model** | AI token-based | Freemium | Subscription | Freemium |

---

## 9. Implications for Pitchr

### 9.1 Key Takeaways for Editor Design

**From Chronicle:**
- The freeform canvas with pre-engineered widgets is the gold standard for professional pitch decks — but has the highest implementation complexity and learning curve
- Bottom toolbar pattern is excellent for keeping canvas area clear
- Floating contextual toolbar for formatting is essential
- "Turn Into" block transformation is a powerful content flexibility pattern
- The Remix feature (layout exploration) is highly valuable for users who are not designers
- Chapter/section organization with vertical scrolling is good for long decks
- Peek/Deep Hover present mode features are genuinely differentiating

**From Gamma:**
- Card-based scrollable format is fastest to build but least professional for investor presentations
- Slash commands ("/") for block insertion is intuitive for Notion-familiar users
- AI Agent for bulk editing across entire decks is powerful
- Fluid card sizing (auto-height) reduces layout friction

**From Beautiful.ai:**
- Constraint-based auto-layout (Smart Slides) dramatically lowers the design skill floor
- Context-aware Control Bar under the slide is an elegant UX pattern
- 300+ slide templates organized by use case provides strong starting points
- Brand theme system with one-click application is essential for teams

**From Pitch.com:**
- Per-slide assignees and statuses integrate presentation building into team workflows
- Inline element editors (point-click-edit) reduce toolbar hunting
- Emoji reactions for lightweight feedback reduce comment noise

### 9.2 Recommended Approach for Pitchr

Given Pitchr's focus on pitch coaching (not general presentation creation), the editor should:

1. **Start with a constrained block system** (Beautiful.ai approach) — pitch decks benefit from enforced good design more than freeform freedom
2. **Add AI remix for layout exploration** (Chronicle approach) — let users explore layouts without design skill
3. **Use slash commands and "Turn Into"** (Gamma/Notion approach) — familiar to target users (founders, startup teams)
4. **Implement floating contextual toolbar** — universal best practice across all editors
5. **Bottom persistent toolbar** for primary actions (Insert, Remix, Theme)
6. **Chapter-based organization** for standard pitch deck sections (Problem, Solution, Market, Team, etc.)
7. **Present mode with basic audience attention tools** — not full Peek/Deep Hover initially, but cursor highlight and progressive reveal
8. **Template-first creation** — provide pitch-deck-specific templates (not generic) with AI generation as accelerator

### 9.3 Technical Architecture Notes

The block/widget data model should follow Notion's pattern:
- Each element is a typed block with ID, type, properties, children, and parent
- Properties are type-agnostic (persist through "Turn Into" transformations)
- Changes are expressed as atomic operations for undo/redo and real-time sync
- See `canvas-editing-technologies.md` for canvas rendering layer (Konva.js recommended)
- Consider BlockNote or Yoopta-Editor for rich text editing within slide blocks

---

## 10. Sources

- [Chronicle AI Presentation Tool Full Review 2026](https://max-productive.ai/ai-tools/chronicle/)
- [Chronicle: AI Presentation Maker](https://chroniclehq.com/ai-presentation-maker)
- [Chronicle Academy](https://chroniclehq.com/academy)
- [Chronicle: New AI tool for making beautiful slide decks (WonderTools)](https://wondertools.substack.com/p/chronicle)
- [Chronicle Review (Automateed)](https://www.automateed.com/chronicle-review)
- [Chronicle HQ AI Review (iSEOAI)](https://iseoai.com/chronicle-hq-ai/)
- [Meet Chronicle: The 'Cursor for Presentations' (GlobeNewsWire)](https://www.globenewswire.com/news-release/2025/06/03/3092926/0/en/Meet-Chronicle-The-Cursor-for-Presentations-with-100k-Waitlisted-Users-Launches-Public-Beta.html)
- [Chronicle vs Gamma Compared](https://chroniclehq.com/gamma-ai-alternative)
- [Gamma Review 2026 (Max Productive)](https://max-productive.ai/ai-tools/gamma/)
- [What are cards in Gamma (Help Center)](https://help.gamma.app/en/articles/11016396-what-are-cards-in-gamma-and-how-to-do-they-work)
- [Gamma AI Chat Editor (MagicSlides)](https://www.magicslides.app/blog/gamma-ai-chat-editor-rewrite-slides)
- [Beautiful.ai Smart Slides](https://www.beautiful.ai/smart-slides)
- [Beautiful.ai Review 2025 (SkyWork)](https://skywork.ai/blog/beautiful-ai-review-2025/)
- [Beautiful.ai Editor Update October 2025](https://support.beautiful.ai/hc/en-us/articles/39691310811533-New-Updates-to-our-Editor-October-2025)
- [Pitch.com Product](https://pitch.com/product)
- [Pitch Product Redesign & Collaboration](https://pitch.com/blog/pitch-product-redesign-collaboration-features)
- [AI Presentation Tools Comparison 2026 (ShareUHack)](https://www.shareuhack.com/en/posts/ai-presentation-tools-comparison)
- [Notion Data Model (Block Architecture)](https://www.notion.com/blog/data-model-behind-notion)
- [BlockNote (Block Editor for React)](https://www.blocknotejs.org/)
- [Drag & Drop UX Best Practices (Pencil & Paper)](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)
- [CKEditor Floating Toolbar Design (GitHub)](https://github.com/ckeditor/ckeditor5-design/issues/98)
- [Pitch Deck Software Review 2026 (Monday.com)](https://monday.com/blog/crm-and-sales/pitch-deck-software/)
