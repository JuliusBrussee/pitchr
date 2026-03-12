# Variation F5 — Split-Screen Proof Mode

## Concept
Left side: demo continues as usual. Right side: rotating proof cards (metrics, quotes, rubric scores) slide in on "proof" steps, then collapse back to full-width demo on non-proof steps.

## Architecture

| File | Purpose |
|------|---------|
| `demoData.ts` | Extends base `DemoStep` with `caption` and `proofPanel?: { header, cards: ProofCard[] }` |
| `DemoCinematicCaption.tsx` | Word-by-word animated caption above browser (copied from Variation F, prefixed) |
| `DemoProofPanel.tsx` | Right-side proof panel with card type renderers (metric, quote, rubric, statrow) |
| `DemoClient.tsx` | Orchestrator with split-screen flex layout |
| `demo.css` | Split layout, proof panel, card styles, all animations |

## Proof Step Map

| Step | Content | Proof Panel |
|------|---------|-------------|
| 0–6 | Dashboard → Session → Analyzing | None — full-width demo |
| 7 | Results appear | Metric "72/100" + mini rubric bars |
| 8 | Score Breakdown | Full rubric card (5 animated bars) |
| 9 | Top Fixes | Stat row "4 fixes / < 60s" + quote |
| 10 | Rewrite | Quote card (before/after proof) |
| 11–13 | Start Q&A → Connecting → Active | None — full-width demo |
| 14 | Live Q&A | Stat row "6 questions / 1 min" + metric "95%" |
| 15 | Session Complete | Metric "3-day streak" + quote |
| 16 | CTA | All 3 key metrics stacked |

## Layout Technique
Flex container wraps browser + proof panel. Browser `max-width` animates `100% → 65%` via springy cubic-bezier. Proof panel slides from `translateX(100%) → 0`. Cards stagger in with `translateY(24px) → 0`.

## Card Types
- **Metric**: Large gradient number (48px), label below
- **Quote**: Italic text, left border accent (#ff5941), optional attribution
- **Rubric**: 5 horizontal bars with animated gradient fills
- **Stat Row**: 2–3 stats side by side (icon + number + label)
