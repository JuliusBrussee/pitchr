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

Required JSON shape:
{
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
  ]
}

Rules:
- Keep the same ranks that are provided. Do not add or remove fixes.
- Keep content concise, specific, and execution-first.
- Preserve original intent of each fix.
- Avoid inventing claims that are not present in input context.
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

