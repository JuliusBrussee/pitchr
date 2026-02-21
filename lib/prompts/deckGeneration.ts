export const DECK_GENERATION_SYSTEM_PROMPT = `You are a world-class pitch deck writer who has crafted decks for YC Demo Day, a16z, and Sequoia-funded startups. Write as if presenting to a skeptical partner meeting at a top-tier VC firm. Every word must earn its place.

## Content Quality

- Headlines must make BOLD CLAIMS, not describe categories. "We Cut Freight Waste 40%" not "Our Solution".
- Every bullet must answer "so what?" -- if a reader shrugs, rewrite it with a specific number, name, or proof point.
- Use concrete data: revenue figures, customer counts, growth rates, market sizes with sources. If the user hasn't provided specific data, create realistic placeholder figures clearly marked with [placeholder].
- Subheadlines must advance the narrative, not restate the headline.
- Callout values should be the single most jaw-dropping stat on that slide -- the number that makes an investor lean forward.

## Banned Patterns

NEVER use these words or phrases: innovative, cutting-edge, seamless, leverage, synergy, next-generation, best-in-class, world-class, disruptive, revolutionary, game-changing, robust, scalable (without specifics), end-to-end, holistic, paradigm.

NEVER reference the deck itself, its design, visual style, theme, template, layout, slides, or presentation format. Write ONLY about the company, its market, and its story. No meta-language.

NEVER use vague claims without evidence. "Fast-growing" must become "3.2x YoY growth". "Large market" must become "$47B by 2027 (Gartner)".

## Format Rules

- Return valid JSON only. No markdown wrapping, no explanations.
- Every headline: max 8 words, must work as a standalone statement.
- Bullet text: max 8 words, punchy and scannable.
- Bullet detail: max 20 words, provides supporting context with specifics.
- Follow a narrative arc: Problem -> Solution -> Why this team, why now -> The ask.`;

export const DECK_GENERATION_SCHEMA_TEXT = `[
  {
    "type": "title",
    "headline": "Kill Empty Miles With AI",
    "subheadline": "RouteAI matches underutilized trucks to nearby loads in real time, cutting deadhead miles 40% for mid-market carriers.",
    "bullets": [],
    "callout": null
  },
  {
    "type": "problem",
    "headline": "$340B Wasted on Empty Truck Miles",
    "subheadline": "US freight carriers lose billions annually driving trucks with nothing in them.",
    "bullets": [
      { "text": "38% of trucks drive empty", "detail": "US freight runs 60B deadhead miles annually, per ATA 2024 data" },
      { "text": "Brokers take 15-20% margins", "detail": "Carriers net $1.75/mile after broker fees vs $2.10 direct" },
      { "text": "Manual dispatch kills margins", "detail": "Average dispatcher manages only 8 trucks, missing 73% of nearby loads" }
    ],
    "callout": { "value": "$340B", "label": "Annual deadhead cost in US freight" }
  },
  {
    "type": "solution",
    "headline": "AI Matches Trucks to Loads Live",
    "subheadline": "Our routing engine sees every available load within 50 miles and auto-negotiates rates in under 90 seconds.",
    "bullets": [
      { "text": "Real-time load matching", "detail": "Ingests 12M daily load posts from DAT, Truckstop, and direct shipper feeds" },
      { "text": "Auto-negotiated rates", "detail": "ML model trained on 400M historical lanes sets optimal price in 90 seconds" },
      { "text": "One-tap driver accept", "detail": "Drivers see matched loads ranked by profit per mile on a mobile app" }
    ],
    "callout": { "value": "90sec", "label": "From empty truck to confirmed backhaul" }
  },
  {
    "type": "market",
    "headline": "$932B US Freight, We Own Backhaul",
    "subheadline": "Starting with mid-market carriers (50-500 trucks) who lack tech but hemorrhage margin on empty miles.",
    "bullets": [
      { "text": "$932B US trucking market", "detail": "Total US freight spend in 2024, growing 4.2% CAGR (FreightWaves)" },
      { "text": "$147B in backhaul alone", "detail": "Serviceable market: carriers spending on deadhead reduction tools" },
      { "text": "$18B mid-market carriers", "detail": "12,400 fleets with 50-500 trucks, our initial beachhead segment" }
    ],
    "callout": { "value": "$147B", "label": "Serviceable backhaul optimization market" }
  },
  {
    "type": "product",
    "headline": "Three Screens. Zero Empty Miles.",
    "subheadline": "Dispatch dashboard, driver app, and shipper portal -- connected by one routing engine.",
    "bullets": [
      { "text": "Dispatch command center", "detail": "Full fleet view with AI-suggested loads ranked by margin contribution" },
      { "text": "Driver mobile app", "detail": "One-swipe accept, turn-by-turn nav, BOL capture, and proof of delivery" },
      { "text": "Shipper self-serve portal", "detail": "Post loads, track shipments live, and pay via integrated factoring" }
    ],
    "callout": null
  },
  {
    "type": "business_model",
    "headline": "We Earn $48 Per Matched Load",
    "subheadline": "Transaction fee on every AI-matched load, plus SaaS subscription for dispatch tools.",
    "bullets": [
      { "text": "$48 avg transaction fee", "detail": "5.5% take rate on average $870 backhaul load, paid by carrier" },
      { "text": "$899/mo dispatch SaaS", "detail": "Per-fleet subscription for AI routing, analytics, and driver app access" },
      { "text": "82% gross margin blended", "detail": "Near-zero marginal cost per match -- compute runs at $0.003/transaction" }
    ],
    "callout": { "value": "$2.1M", "label": "ARR as of January 2025" }
  },
  {
    "type": "traction",
    "headline": "214 Carriers Live, 3.2x YoY Growth",
    "subheadline": "Signed our first carrier in March 2023. Hit $2.1M ARR by December 2024.",
    "bullets": [
      { "text": "214 active carriers", "detail": "Managing 11,200 trucks across 34 states, up from 67 carriers a year ago" },
      { "text": "1.4M loads matched in 2024", "detail": "Averaging 4,100 matches/day in Q4, up 280% from Q1" },
      { "text": "94% carrier retention", "detail": "Net revenue retention 118% -- carriers expand truck count after onboarding" }
    ],
    "callout": { "value": "3.2x", "label": "Year-over-year ARR growth" }
  },
  {
    "type": "competition",
    "headline": "Brokers Guess. Convoy Failed. We Learn.",
    "subheadline": "Legacy brokers rely on phone calls; digital brokers collapsed under thin margins. We sell to carriers directly.",
    "bullets": [
      { "text": "C.H. Robinson, Echo", "detail": "Manual broker model: 15-20% take rate, 48hr average matching time" },
      { "text": "Convoy (shut down 2023)", "detail": "Tried to be the broker -- burned $900M subsidizing rates, went bankrupt" },
      { "text": "Our moat: carrier-side AI", "detail": "Proprietary model trained on 400M lanes; carriers own the relationship, we optimize it" }
    ],
    "callout": null
  },
  {
    "type": "team",
    "headline": "Ex-Uber Freight Meets ML PhDs",
    "subheadline": "Team of 22 combining deep freight operations experience with applied machine learning.",
    "bullets": [
      { "text": "Sarah Chen, CEO", "detail": "Former Head of Carrier Ops at Uber Freight, scaled from 0 to 40K carriers" },
      { "text": "Marcus Rivera, CTO", "detail": "PhD ML from Stanford, led routing optimization at Amazon Logistics for 4 years" },
      { "text": "12 engineers, 6 in sales", "detail": "Hired 14 people in 2024; engineering team averages 9 years in logistics tech" }
    ],
    "callout": null
  },
  {
    "type": "ask",
    "headline": "Raising $18M to Own Backhaul",
    "subheadline": "Series A to expand from 214 to 2,000 carriers and launch shipper marketplace.",
    "bullets": [
      { "text": "50% -- engineering", "detail": "$9M to triple engineering team and build shipper self-serve marketplace" },
      { "text": "30% -- sales expansion", "detail": "$5.4M for 20 carrier sales reps across Southeast and Midwest regions" },
      { "text": "20% -- data infrastructure", "detail": "$3.6M for real-time ELD integrations and expanded load board partnerships" }
    ],
    "callout": { "value": "$18M", "label": "Series A target" }
  }
]`;

export function buildDeckGenerationPrompt(
  companyName: string,
  description: string,
): string {
  return `Create a 10-slide pitch deck for this startup:

Company: ${companyName}

Description:
"""
${description}
"""

Instructions:
1. Generate exactly 10 slides in this order: title, problem, solution, market, product, business_model, traction, competition, team, ask.
2. For the title slide, use "${companyName}" as the company name in the subheadline.
3. Match the QUALITY and SPECIFICITY of the example below -- but write entirely original content about this company. Do not reuse any text from the example.
4. Every headline must make a bold, specific claim. Never use generic labels like "Our Solution" or "The Problem".
5. Every bullet detail must include a concrete number, named entity, or verifiable fact. No hand-waving.
6. Write content ONLY about the company. Do not reference the deck itself, its appearance, its design, its theme, or how it will be presented.
7. If the description lacks specific data, create realistic placeholders marked with [placeholder].

Return a JSON array of 10 slide objects matching this schema and quality level:
${DECK_GENERATION_SCHEMA_TEXT}`;
}

export function buildDeckRepairPrompt(
  invalidOutput: string,
  companyName: string,
  description: string,
): string {
  return `The previous model output is invalid JSON or does not match the required schema.
Repair it into valid JSON only -- a JSON array of exactly 10 slide objects.

Quality rules (preserve these during repair):
- Headlines must make bold, specific claims -- not generic category labels.
- Bullets must contain concrete numbers, names, or proof points.
- Do NOT reference the deck, its design, theme, style, or presentation format anywhere in the content.
- Do NOT use banned buzzwords: innovative, cutting-edge, seamless, leverage, synergy, next-generation, best-in-class, disruptive, revolutionary, game-changing.

Company: ${companyName}
Description:
"""
${description}
"""

Invalid output:
"""
${invalidOutput}
"""

Return only a valid JSON array of 10 objects matching this schema:
${DECK_GENERATION_SCHEMA_TEXT}`;
}
