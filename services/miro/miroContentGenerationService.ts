import { AnthropicProvider } from "@/lib/llm/providers/anthropic";
import { OpenRouterProvider } from "@/lib/llm/providers/openrouter";
import type { LlmCompletionRequest } from "@/lib/llm/types";
import {
  buildMiroFixBoardUserPrompt,
  MIRO_FIX_BOARD_SYSTEM_PROMPT,
} from "@/lib/prompts/miroFixBoard";
import type {
  MiroBoardContentProvider,
  MiroBoardLayoutStyle,
  MiroFixBoardRequest,
  MiroFixStatus,
  MiroGeneratedBoardCopy,
  MiroGeneratedFixCard,
  MiroGeneratedMindMapNode,
  MiroVisualTool,
} from "@/services/miro/miroTypes";

const STATUS_ORDER: MiroFixStatus[] = ["todo", "doing", "blocked", "done"];
const INITIAL_STATUS_BY_INDEX: MiroFixStatus[] = ["doing", "todo", "blocked", "done", "todo"];

const MAX_OVERVIEW_HTML_CHARS = 1200;
const MAX_COLUMN_GUIDE_CHARS = 500;
const MAX_REWRITE_CARD_CHARS = 2500;
const MAX_TEXT_CHARS = 360;
const MAX_OWNER_CHARS = 120;
const MAX_NOTES_CHARS = 600;
const MAX_FIELD_CHARS = 220;
const MAX_TRANSCRIPT_CHARS = 80_000;
const MAX_MINDMAP_NODE_TITLE_CHARS = 110;
const MAX_MINDMAP_NODE_BULLETS = 4;
const MAX_MINDMAP_NODE_BULLET_CHARS = 120;
const MAX_MINDMAP_CENTER_BULLETS = 5;
const MAX_MINDMAP_NODES = 10;

export interface MiroBoardCopyGenerationResult {
  generated: MiroGeneratedBoardCopy;
  providerUsed: MiroBoardContentProvider;
  fallbackUsed: boolean;
  message: string;
}

interface MiroContentGenerationDeps {
  openrouterComplete?: (request: LlmCompletionRequest) => Promise<string>;
  anthropicComplete?: (request: LlmCompletionRequest) => Promise<string>;
  hasOpenRouterApiKey?: () => boolean;
  hasAnthropicApiKey?: () => boolean;
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clamp(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return clamp(normalizeSpace(value), maxLength);
}

function sanitizeMultiline(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function isFixStatus(value: string): value is MiroFixStatus {
  return value === "todo" || value === "doing" || value === "blocked" || value === "done";
}

function isLayoutStyle(value: string): value is MiroBoardLayoutStyle {
  return value === "mindmap_hybrid" || value === "compact_kanban";
}

function isVisualTool(value: string): value is MiroVisualTool {
  return value === "bubble" || value === "shape" || value === "sticky";
}

function getInitialStatusForIndex(index: number): MiroFixStatus {
  return INITIAL_STATUS_BY_INDEX[index] ?? "todo";
}

function capTranscript(transcript?: string) {
  if (!transcript || typeof transcript !== "string") return undefined;
  if (transcript.length <= MAX_TRANSCRIPT_CHARS) return transcript;
  return transcript.slice(0, MAX_TRANSCRIPT_CHARS);
}

function baseColumnGuides(): Record<MiroFixStatus, string> {
  return {
    todo: ["<strong>Backlog Prompt</strong>", "Owner:", "Next Step:", "Success Metric:"].join(
      "<br/>",
    ),
    doing: [
      "<strong>In Progress Prompt</strong>",
      "Latest update:",
      "Risk:",
      "Next checkpoint:",
    ].join("<br/>"),
    blocked: [
      "<strong>Blocked Prompt</strong>",
      "Blocker:",
      "Needed decision:",
      "Escalate to:",
    ].join("<br/>"),
    done: ["<strong>Done Prompt</strong>", "Outcome:", "Evidence link:", "What changed:"].join(
      "<br/>",
    ),
  };
}

function toBullets(input: unknown, maxItems: number, maxChars: number): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => sanitizeText(item, maxChars))
      .filter(Boolean)
      .slice(0, maxItems);
  }
  if (typeof input !== "string") return [];
  const source = input.trim();
  if (!source) return [];
  return source
    .split(/\n|;|•|-/)
    .map((part) => sanitizeText(part, maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function toMindMapFallbackNodes(fixCards: MiroGeneratedFixCard[]): MiroGeneratedMindMapNode[] {
  return fixCards.slice(0, 6).map((fix) => ({
    id: `fix-${fix.rank}`,
    title: `#${fix.rank} ${toTitleCase(fix.category)}`,
    bullets: [fix.issue, fix.action].map((item) => sanitizeText(item, MAX_MINDMAP_NODE_BULLET_CHARS)),
    rank: fix.rank,
    tool: "bubble",
  }));
}

export function buildTemplateMiroBoardCopy(input: MiroFixBoardRequest): MiroGeneratedBoardCopy {
  const datePart = new Date().toISOString().slice(0, 10);
  const topFixes = [...input.topFixes]
    .filter((fix) => Number.isFinite(fix.rank))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  const fixCards: MiroGeneratedFixCard[] = topFixes.map((fix, index) => ({
    rank: fix.rank,
    category: sanitizeText(fix.category, 80) || "general",
    impact: sanitizeText(fix.impact, 24) || "medium",
    issue: sanitizeText(fix.issue, MAX_TEXT_CHARS),
    action: sanitizeText(fix.fix, MAX_TEXT_CHARS),
    status: getInitialStatusForIndex(index),
    owner: "",
    notes: "",
    nextStep: "[define next step]",
    successMetric: "[define success metric]",
    blocker: "[none]",
  }));

  return {
    layoutStyle: "mindmap_hybrid",
    kanbanSize: "small",
    overviewCardHtml: [
      `<strong>Verdict</strong>: ${sanitizeText(input.oneLineVerdict, 280)}`,
      `<strong>Mode</strong>: ${toTitleCase(sanitizeText(input.mode, 40))}`,
      `<strong>Run</strong>: ${sanitizeText(input.runId, 64).slice(-12)}`,
      `<strong>Generated</strong>: ${datePart}`,
    ].join("<br/>"),
    rewriteCardText: sanitizeMultiline(input.rewriteScript, MAX_REWRITE_CARD_CHARS),
    columnGuides: baseColumnGuides(),
    fixCards,
    mindMap: {
      centerTitle: "Pitch Fix Strategy",
      centerBullets: [
        sanitizeText(input.oneLineVerdict, MAX_MINDMAP_NODE_BULLET_CHARS),
        `Mode: ${toTitleCase(input.mode)}`,
      ].filter(Boolean),
      nodes: toMindMapFallbackNodes(fixCards),
    },
  };
}

function parseJsonPayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first === -1 || last <= first) return null;
    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

function normalizeGeneratedCopy(
  raw: unknown,
  input: MiroFixBoardRequest,
): MiroGeneratedBoardCopy | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const fallback = buildTemplateMiroBoardCopy(input);

  const inputFixes = [...input.topFixes]
    .filter((fix) => Number.isFinite(fix.rank))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);
  const inputFixByRank = new Map<number, (typeof inputFixes)[number]>(
    inputFixes.map((fix) => [fix.rank, fix]),
  );
  const fallbackByRank = new Map<number, MiroGeneratedFixCard>(
    fallback.fixCards.map((fix) => [fix.rank, fix]),
  );

  const rawFixCards = Array.isArray(value.fixCards) ? value.fixCards : null;
  if (!rawFixCards || rawFixCards.length < 1 || rawFixCards.length > 5) return null;

  const normalizedFixes: MiroGeneratedFixCard[] = [];
  const seenRanks = new Set<number>();
  for (const card of rawFixCards) {
    if (!card || typeof card !== "object") continue;
    const data = card as Record<string, unknown>;
    const rank =
      typeof data.rank === "number"
        ? data.rank
        : typeof data.rank === "string"
          ? Number.parseInt(data.rank, 10)
          : NaN;
    if (!Number.isInteger(rank) || rank < 1 || rank > 5 || seenRanks.has(rank)) continue;
    const sourceFix = inputFixByRank.get(rank);
    const fallbackFix = fallbackByRank.get(rank);
    if (!sourceFix || !fallbackFix) continue;

    const statusRaw = sanitizeText(data.status, 20).toLowerCase();
    normalizedFixes.push({
      rank,
      category: sanitizeText(data.category, 80) || sanitizeText(sourceFix.category, 80),
      impact: sanitizeText(data.impact, 24) || sanitizeText(sourceFix.impact, 24),
      issue: sanitizeText(data.issue, MAX_TEXT_CHARS) || fallbackFix.issue,
      action:
        sanitizeText(data.action, MAX_TEXT_CHARS) ||
        sanitizeText(data.fix, MAX_TEXT_CHARS) ||
        fallbackFix.action,
      status: isFixStatus(statusRaw) ? statusRaw : fallbackFix.status,
      owner: sanitizeText(data.owner, MAX_OWNER_CHARS),
      notes: sanitizeText(data.notes, MAX_NOTES_CHARS),
      nextStep: sanitizeText(data.nextStep, MAX_FIELD_CHARS) || fallbackFix.nextStep,
      successMetric:
        sanitizeText(data.successMetric, MAX_FIELD_CHARS) || fallbackFix.successMetric,
      blocker: sanitizeText(data.blocker, MAX_FIELD_CHARS) || fallbackFix.blocker,
    });
    seenRanks.add(rank);
  }

  if (normalizedFixes.length !== inputFixes.length) return null;
  const normalizedRanks = normalizedFixes.map((fix) => fix.rank).sort((a, b) => a - b);
  const inputRanks = inputFixes.map((fix) => fix.rank).sort((a, b) => a - b);
  if (normalizedRanks.join(",") !== inputRanks.join(",")) return null;

  const rawGuides =
    value.columnGuides && typeof value.columnGuides === "object"
      ? (value.columnGuides as Record<string, unknown>)
      : {};

  const columnGuides = { ...fallback.columnGuides };
  for (const status of STATUS_ORDER) {
    const next = sanitizeMultiline(rawGuides[status], MAX_COLUMN_GUIDE_CHARS);
    if (next) columnGuides[status] = next;
  }

  const layoutStyleRaw = sanitizeText(value.layoutStyle, 32).toLowerCase();
  const layoutStyle: MiroBoardLayoutStyle = isLayoutStyle(layoutStyleRaw)
    ? layoutStyleRaw
    : fallback.layoutStyle;

  const kanbanSizeRaw = sanitizeText(value.kanbanSize, 16).toLowerCase();
  const kanbanSize: "small" | "full" =
    kanbanSizeRaw === "small" || kanbanSizeRaw === "full" ? kanbanSizeRaw : fallback.kanbanSize;

  const rawMindMap =
    value.mindMap && typeof value.mindMap === "object"
      ? (value.mindMap as Record<string, unknown>)
      : {};
  const rawNodes = Array.isArray(rawMindMap.nodes) ? rawMindMap.nodes : [];
  const parsedNodes: MiroGeneratedMindMapNode[] = [];

  for (const rawNode of rawNodes.slice(0, MAX_MINDMAP_NODES)) {
    if (!rawNode || typeof rawNode !== "object") continue;
    const node = rawNode as Record<string, unknown>;
    const title = sanitizeText(node.title, MAX_MINDMAP_NODE_TITLE_CHARS);
    if (!title) continue;
    const nodeId = sanitizeText(node.id, 40) || `node-${parsedNodes.length + 1}`;
    const toolRaw = sanitizeText(node.tool, 16).toLowerCase();
    const rankRaw =
      typeof node.rank === "number"
        ? node.rank
        : typeof node.rank === "string"
          ? Number.parseInt(node.rank, 10)
          : NaN;
    const rank = Number.isInteger(rankRaw) && rankRaw >= 1 && rankRaw <= 5 ? rankRaw : undefined;
    const bullets = toBullets(
      node.bullets,
      MAX_MINDMAP_NODE_BULLETS,
      MAX_MINDMAP_NODE_BULLET_CHARS,
    );

    parsedNodes.push({
      id: nodeId,
      title,
      bullets: bullets.length > 0 ? bullets : ["Execution item"],
      rank,
      tool: isVisualTool(toolRaw) ? toolRaw : "bubble",
    });
  }

  const fallbackNodes = toMindMapFallbackNodes(normalizedFixes);
  const centerTitle =
    sanitizeText(rawMindMap.centerTitle, 140) || sanitizeText(fallback.mindMap.centerTitle, 140);
  const centerBullets = toBullets(
    rawMindMap.centerBullets,
    MAX_MINDMAP_CENTER_BULLETS,
    MAX_MINDMAP_NODE_BULLET_CHARS,
  );

  return {
    layoutStyle,
    kanbanSize,
    overviewCardHtml:
      sanitizeMultiline(value.overviewCardHtml, MAX_OVERVIEW_HTML_CHARS) ||
      fallback.overviewCardHtml,
    rewriteCardText:
      sanitizeMultiline(value.rewriteCardText, MAX_REWRITE_CARD_CHARS) || fallback.rewriteCardText,
    columnGuides,
    fixCards: normalizedFixes.sort((a, b) => a.rank - b.rank),
    mindMap: {
      centerTitle,
      centerBullets:
        centerBullets.length > 0 ? centerBullets : fallback.mindMap.centerBullets.slice(0, 3),
      nodes: parsedNodes.length > 0 ? parsedNodes : fallbackNodes,
    },
  };
}

function hasOpenRouterApiKey() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function hasAnthropicApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function buildRequest(input: MiroFixBoardRequest): LlmCompletionRequest {
  return {
    systemPrompt: MIRO_FIX_BOARD_SYSTEM_PROMPT,
    userPrompt: buildMiroFixBoardUserPrompt({
      mode: input.mode,
      oneLineVerdict: input.oneLineVerdict,
      topFixes: input.topFixes,
      rewriteScript: input.rewriteScript,
      transcript: capTranscript(input.transcript),
    }),
    responseFormat: "json",
    temperature: 0.3,
    maxTokens: 2200,
    timeoutMs: 25_000,
  };
}

function defaultDeps(): Required<MiroContentGenerationDeps> {
  return {
    openrouterComplete: (request) => new OpenRouterProvider().complete(request),
    anthropicComplete: (request) => new AnthropicProvider().complete(request),
    hasOpenRouterApiKey,
    hasAnthropicApiKey,
  };
}

async function runProviderAttempt(input: {
  name: "openrouter" | "anthropic";
  complete: (request: LlmCompletionRequest) => Promise<string>;
  request: LlmCompletionRequest;
  source: MiroFixBoardRequest;
}): Promise<MiroGeneratedBoardCopy> {
  const raw = await input.complete(input.request);
  const parsed = parseJsonPayload(raw);
  const normalized = normalizeGeneratedCopy(parsed, input.source);
  if (!normalized) {
    throw new Error(`${input.name} returned invalid board-copy JSON`);
  }
  return normalized;
}

export async function generateMiroBoardCopy(
  input: MiroFixBoardRequest,
  deps?: MiroContentGenerationDeps,
): Promise<MiroBoardCopyGenerationResult> {
  const resolvedDeps = { ...defaultDeps(), ...(deps ?? {}) };
  const template = buildTemplateMiroBoardCopy(input);
  const request = buildRequest(input);

  const failed: string[] = [];
  if (resolvedDeps.hasOpenRouterApiKey()) {
    try {
      const generated = await runProviderAttempt({
        name: "openrouter",
        complete: resolvedDeps.openrouterComplete,
        request,
        source: input,
      });
      return {
        generated,
        providerUsed: "openrouter",
        fallbackUsed: false,
        message: "Miro content generated via OpenRouter.",
      };
    } catch (error) {
      failed.push(`OpenRouter: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    failed.push("OpenRouter: missing OPENROUTER_API_KEY");
  }

  if (resolvedDeps.hasAnthropicApiKey()) {
    try {
      const generated = await runProviderAttempt({
        name: "anthropic",
        complete: resolvedDeps.anthropicComplete,
        request,
        source: input,
      });
      return {
        generated,
        providerUsed: "anthropic",
        fallbackUsed: true,
        message: "Miro content generated via Anthropic fallback.",
      };
    } catch (error) {
      failed.push(`Anthropic: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    failed.push("Anthropic: missing ANTHROPIC_API_KEY");
  }

  const reason = failed.length ? ` ${failed[0]}` : "";
  return {
    generated: template,
    providerUsed: "template",
    fallbackUsed: true,
    message: `Miro content template fallback applied.${reason}`.trim(),
  };
}
