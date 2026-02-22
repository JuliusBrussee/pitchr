import type { MiroTopFixInput } from "@/services/miro/miroTypes";

const MAX_TRANSCRIPT_PROMPT_CHARS = 40_000;

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function capTranscript(transcript?: string) {
  if (!transcript) return "";
  const normalized = normalizeWhitespace(transcript);
  if (normalized.length <= MAX_TRANSCRIPT_PROMPT_CHARS) return normalized;
  return normalized.slice(0, MAX_TRANSCRIPT_PROMPT_CHARS);
}

function formatFixes(fixes: MiroTopFixInput[]) {
  return fixes
    .slice(0, 5)
    .sort((a, b) => a.rank - b.rank)
    .map((fix) =>
      [
        `Rank: ${fix.rank}`,
        `Category: ${fix.category}`,
        `Impact: ${fix.impact}`,
        `Issue: ${fix.issue}`,
        `Action: ${fix.fix}`,
      ].join("\n"),
    )
    .join("\n\n---\n\n");
}

export const MIRO_FIX_BOARD_SYSTEM_PROMPT = `
You are an expert startup pitch operator generating execution-oriented Miro board copy.
Return valid JSON only. Do not include markdown fences or extra text.
Prioritize concise language and bullet-point readability.

Required JSON shape:
{
  "layoutStyle": "mindmap_hybrid|compact_kanban",
  "kanbanSize": "small|full",
  "overviewCardHtml": "string",
  "rewriteCardText": "string",
  "columnGuides": {
    "todo": "string",
    "doing": "string",
    "blocked": "string",
    "done": "string"
  },
  "fixCards": [
    {
      "rank": 1,
      "category": "string",
      "impact": "high|medium|low",
      "issue": "string",
      "action": "string",
      "status": "todo|doing|blocked|done",
      "owner": "string",
      "notes": "string",
      "nextStep": "string",
      "successMetric": "string",
      "blocker": "string"
    }
  ],
  "mindMap": {
    "centerTitle": "string",
    "centerBullets": ["string"],
    "nodes": [
      {
        "id": "string",
        "title": "string",
        "bullets": ["string"],
        "rank": 1,
        "tool": "bubble|shape|sticky"
      }
    ]
  }
}

Rules:
- Keep the same ranks that are provided. Do not add or remove fixes.
- Keep content concise, specific, execution-first, and easy to scan.
- Use short bullets (ideally <= 8 words per bullet).
- Preserve original intent of each fix.
- Avoid inventing claims that are not present in input context.
- Decide which visual style is best for this run:
  - Use "mindmap_hybrid" for narrative-heavy feedback and cross-linked issues.
  - Use "compact_kanban" for straightforward execution workflows.
- Mind-map nodes should emphasize clarity over quantity.
`.trim();

export function buildMiroFixBoardUserPrompt(input: {
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
  transcript?: string;
}) {
  const transcript = capTranscript(input.transcript);

  return `
Create board-ready content for a Miro execution board.

Mode:
${input.mode}

One-line verdict:
${input.oneLineVerdict}

Top fixes:
${formatFixes(input.topFixes)}

Rewrite script:
${normalizeWhitespace(input.rewriteScript)}

Transcript (optional context):
${transcript || "[Not provided]"}

Return only JSON matching the required shape.
`.trim();
}
