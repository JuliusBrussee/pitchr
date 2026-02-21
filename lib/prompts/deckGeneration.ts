export const DECK_GENERATION_SYSTEM_PROMPT = `You are a world-class pitch deck writer who has crafted decks for YC Demo Day, a16z, and Sequoia-funded startups.

You create concise, high-impact slide content that tells a compelling investment story.

Rules:
- Return valid JSON only. No markdown wrapping, no explanations.
- Every headline must work as a standalone statement (max 8 words).
- Bullet text must be punchy and scannable (max 8 words per bullet text).
- Bullet detail provides supporting context (max 20 words).
- Use specific numbers, names, and data wherever possible. If the user hasn't provided specific data, create realistic placeholder figures clearly marked with [placeholder].
- Follow a narrative arc: Problem -> Solution -> Why this team, why now -> The ask.
- Callout values should be the single most impressive stat on that slide.`;

export const DECK_GENERATION_SCHEMA_TEXT = `[
  {
    "type": "title",
    "headline": "Company tagline (max 8 words)",
    "subheadline": "One sentence value proposition",
    "bullets": [],
    "callout": null
  },
  {
    "type": "problem",
    "headline": "Problem headline",
    "subheadline": "Context sentence",
    "bullets": [
      { "text": "Pain point 1", "detail": "Supporting detail" },
      { "text": "Pain point 2", "detail": "Supporting detail" },
      { "text": "Pain point 3", "detail": "Supporting detail" }
    ],
    "callout": { "value": "$X", "label": "Cost of problem" }
  },
  {
    "type": "solution",
    "headline": "Solution headline",
    "subheadline": "How it works in one sentence",
    "bullets": [
      { "text": "Capability 1", "detail": "What it does" },
      { "text": "Capability 2", "detail": "What it does" },
      { "text": "Capability 3", "detail": "What it does" }
    ],
    "callout": { "value": "Xmin", "label": "Time to value" }
  },
  {
    "type": "market",
    "headline": "Market headline",
    "subheadline": "Market context",
    "bullets": [
      { "text": "TAM", "detail": "$X total addressable market" },
      { "text": "SAM", "detail": "$X serviceable market" },
      { "text": "SOM", "detail": "$X initial target" }
    ],
    "callout": { "value": "$XB", "label": "TAM" }
  },
  {
    "type": "product",
    "headline": "Product headline",
    "subheadline": "Product description",
    "bullets": [
      { "text": "Feature 1", "detail": "Description" },
      { "text": "Feature 2", "detail": "Description" },
      { "text": "Feature 3", "detail": "Description" }
    ],
    "callout": null
  },
  {
    "type": "business_model",
    "headline": "Business model headline",
    "subheadline": "Revenue model summary",
    "bullets": [
      { "text": "Revenue stream", "detail": "How it works" },
      { "text": "Pricing", "detail": "Price points" },
      { "text": "Unit economics", "detail": "Key metric" }
    ],
    "callout": { "value": "$X", "label": "ARR or MRR" }
  },
  {
    "type": "traction",
    "headline": "Traction headline",
    "subheadline": "Growth context",
    "bullets": [
      { "text": "Metric 1", "detail": "Number and context" },
      { "text": "Metric 2", "detail": "Number and context" },
      { "text": "Metric 3", "detail": "Number and context" }
    ],
    "callout": { "value": "X%", "label": "MoM growth" }
  },
  {
    "type": "competition",
    "headline": "Competition headline",
    "subheadline": "Competitive landscape",
    "bullets": [
      { "text": "Competitor 1", "detail": "What they lack" },
      { "text": "Competitor 2", "detail": "What they lack" },
      { "text": "Our moat", "detail": "Why we win" }
    ],
    "callout": null
  },
  {
    "type": "team",
    "headline": "Team headline",
    "subheadline": "Why this team",
    "bullets": [
      { "text": "Founder 1", "detail": "Role and background" },
      { "text": "Founder 2", "detail": "Role and background" },
      { "text": "Key hire", "detail": "Role and background" }
    ],
    "callout": null
  },
  {
    "type": "ask",
    "headline": "The Ask",
    "subheadline": "What we're raising",
    "bullets": [
      { "text": "Use of funds 1", "detail": "X% \u2014 what it achieves" },
      { "text": "Use of funds 2", "detail": "X% \u2014 what it achieves" },
      { "text": "Use of funds 3", "detail": "X% \u2014 what it achieves" }
    ],
    "callout": { "value": "$XM", "label": "Raising" }
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

Generate exactly 10 slides in this order: title, problem, solution, market, product, business_model, traction, competition, team, ask.

For the title slide, use "${companyName}" as the company name in the subheadline.

Return a JSON array of 10 slide objects matching this exact schema:
${DECK_GENERATION_SCHEMA_TEXT}`;
}

export function buildDeckRepairPrompt(
  invalidOutput: string,
  companyName: string,
  description: string,
): string {
  return `The previous model output is invalid JSON or does not match the required schema.
Repair it into valid JSON only \u2014 a JSON array of exactly 10 slide objects.

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
