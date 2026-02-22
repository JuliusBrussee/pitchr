import type { MiroProvider } from "@/services/miro/miroProvider";
import type {
  MiroFixPatch,
  MiroFixStatus,
  MiroGeneratedFixCard,
  MiroGeneratedMindMapNode,
  MiroProviderCreateInput,
  MiroProviderCreateResult,
  MiroProviderPatchResult,
  MiroProviderSyncedFix,
  MiroProviderSyncResult,
  MiroTopFixInput,
  PersistedMiroBoardState,
} from "@/services/miro/miroTypes";

const MIRO_BASE_URL = "https://api.miro.com/v2";
const HEADER_MARKER = "[PITCHR_FIX]";
const MIRO_BOARD_NAME_MAX = 60;
const MAX_REWRITE_PREVIEW_CHARS = 1200;

type MiroStickyFillColor =
  | "gray"
  | "light_yellow"
  | "yellow"
  | "orange"
  | "light_green"
  | "green"
  | "dark_green"
  | "cyan"
  | "light_pink"
  | "pink"
  | "violet"
  | "red"
  | "light_blue"
  | "blue"
  | "dark_blue"
  | "black";

type MiroFrameFillColor = `#${string}`;
type MiroStickyShape = "square" | "rectangle";

const KANBAN_COLUMN_ORDER: MiroFixStatus[] = ["todo", "doing", "blocked", "done"];
const COLUMN_OFFSETS_X: Record<MiroFixStatus, number> = {
  todo: -1080,
  doing: -360,
  blocked: 360,
  done: 1080,
};

const COLUMN_OFFSETS_X_SMALL: Record<MiroFixStatus, number> = {
  todo: -570,
  doing: -190,
  blocked: 190,
  done: 570,
};

const COLUMN_TINT_FRAME: Record<MiroFixStatus, MiroFrameFillColor> = {
  todo: "#fcd34d",
  doing: "#93c5fd",
  blocked: "#fca5a5",
  done: "#86efac",
};

const COLUMN_TINT_STICKY: Record<MiroFixStatus, MiroStickyFillColor> = {
  todo: "light_yellow",
  doing: "light_blue",
  blocked: "light_pink",
  done: "light_green",
};

const INITIAL_STATUS_BY_INDEX: MiroFixStatus[] = ["doing", "todo", "blocked", "done", "todo"];
const FIX_CARD_SHAPE: MiroStickyShape = "rectangle";
const GUIDE_CARD_SHAPE: MiroStickyShape = "rectangle";
const FIX_CARD_START_Y = 40;
const FIX_CARD_ROW_GAP = 240;
const FIX_CARD_START_Y_SMALL = 20;
const FIX_CARD_ROW_GAP_SMALL = 220;
const DETAIL_CARD_ROW_GAP = 210;
const PRIMARY_ISSUE_MAX_CHARS = 120;
const PRIMARY_ACTION_MAX_CHARS = 140;
const DETAIL_BODY_MAX_CHARS = 260;

const MINDMAP_NODE_FILL: Record<MiroFixStatus, MiroStickyFillColor> = {
  todo: "light_yellow",
  doing: "light_blue",
  blocked: "light_pink",
  done: "light_green",
};

function getInitialStatusForIndex(index: number): MiroFixStatus {
  return INITIAL_STATUS_BY_INDEX[index] ?? "todo";
}

function getGeneratedFixStatus(fix: MiroGeneratedFixCard, index: number): MiroFixStatus {
  return isValidFixStatus(fix.status) ? fix.status : getInitialStatusForIndex(index);
}

function getColumnOffsets(kanbanSize: "small" | "full"): Record<MiroFixStatus, number> {
  return kanbanSize === "small" ? COLUMN_OFFSETS_X_SMALL : COLUMN_OFFSETS_X;
}

function getFixCardStartY(kanbanSize: "small" | "full") {
  return kanbanSize === "small" ? FIX_CARD_START_Y_SMALL : FIX_CARD_START_Y;
}

function getFixCardRowGap(kanbanSize: "small" | "full") {
  return kanbanSize === "small" ? FIX_CARD_ROW_GAP_SMALL : FIX_CARD_ROW_GAP;
}

function getDetailCardStartY(layoutStyle: "mindmap_hybrid" | "compact_kanban") {
  return layoutStyle === "mindmap_hybrid" ? 2240 : 2140;
}

function getDetailCardColumnOffset(layoutStyle: "mindmap_hybrid" | "compact_kanban") {
  return layoutStyle === "mindmap_hybrid" ? 560 : 430;
}

function resolveKanbanSizeFromColumnWidth(width: number): "small" | "full" {
  return width >= 500 ? "full" : "small";
}

function getFixedSlotAbsoluteY(rank: number, kanbanSize: "small" | "full") {
  const safeRank = Math.min(5, Math.max(1, rank));
  return getFixCardStartY(kanbanSize) + (safeRank - 1) * getFixCardRowGap(kanbanSize);
}

function toParentRelativeCoordinate(parentCenter: number, parentSize: number, absolute: number) {
  return absolute - (parentCenter - parentSize / 2);
}

function getFixedSlotPosition(input: {
  rank: number;
  columnX: number;
  columnY: number;
  columnWidth: number;
  columnHeight: number;
  useParentCoords: boolean;
}) {
  const kanbanSize = resolveKanbanSizeFromColumnWidth(input.columnWidth);
  const absoluteY = getFixedSlotAbsoluteY(input.rank, kanbanSize);
  const absoluteX = input.columnX;

  if (!input.useParentCoords) {
    return {
      x: absoluteX,
      y: absoluteY,
      absoluteX,
      absoluteY,
    };
  }

  return {
    x: input.columnWidth / 2,
    y: toParentRelativeCoordinate(input.columnY, input.columnHeight, absoluteY),
    absoluteX,
    absoluteY,
  };
}

function toBulletLines(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => `- ${line}`);
}

function buildMindMapNodeContent(node: MiroGeneratedMindMapNode) {
  return [`<strong>${node.title}</strong>`, ...toBulletLines(node.bullets)].join("<br/>");
}

function getStatusForMindMapNode(
  node: MiroGeneratedMindMapNode,
  fixesByRank: Map<number, MiroGeneratedFixCard>,
): MiroFixStatus {
  if (typeof node.rank === "number") {
    const rankedFix = fixesByRank.get(node.rank);
    if (rankedFix) return rankedFix.status;
  }
  return "todo";
}

interface MiroBoardCreateResponse {
  id: string;
  viewLink?: string;
  links?: {
    self?: string;
  };
}

interface MiroFrameResponse {
  id: string;
}

interface MiroStickyResponse {
  id: string;
  modifiedAt?: string;
}

interface MiroShapeResponse {
  id: string;
  modifiedAt?: string;
}

interface MiroBoardItemResponse {
  id: string;
  modifiedAt?: string;
  parent?: { id?: string };
  position?: {
    x?: number;
    y?: number;
    origin?: string;
    relativeTo?: string;
  };
  geometry?: {
    width?: number;
    height?: number;
  };
  data?: { content?: string };
}

class MiroHttpError extends Error {
  status: number;

  constructor(path: string, status: number, message: string) {
    super(`Miro API ${status} on ${path}: ${message}`);
    this.status = status;
  }
}

function isValidFixStatus(value: string): value is MiroFixStatus {
  return value === "todo" || value === "doing" || value === "done" || value === "blocked";
}

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function compactStickyText(value: string, maxChars: number) {
  const normalized = normalizeSpaces(value || "");
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

function buildFixDetailStickyContent(input: {
  title: string;
  body: string;
  footer?: string;
}) {
  const lines = [input.title.trim(), "", compactStickyText(input.body, DETAIL_BODY_MAX_CHARS)];
  const footer = input.footer?.trim();
  if (footer) lines.push("", footer);
  return lines.join("\n");
}

function trimWrappedQuotes(value: string) {
  return value.trim().replace(/^['"]+|['"]+$/g, "");
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseKeyValueLines(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const parsed = new Map<string, string>();

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    parsed.set(key, value);
  }

  return parsed;
}

function buildMiroBoardUrl(board: MiroBoardCreateResponse) {
  const viewLink = board.viewLink ? trimWrappedQuotes(board.viewLink) : "";
  if (viewLink) {
    try {
      const url = new URL(viewLink);
      if (url.hostname.includes("miro.com")) {
        return viewLink;
      }
    } catch {
      // Fall through to links.self and id fallback.
    }
  }

  const selfLink = board.links?.self ? trimWrappedQuotes(board.links.self) : "";
  if (selfLink) {
    try {
      const url = new URL(selfLink);
      const segments = url.pathname.split("/").filter(Boolean);
      const encodedBoardId = segments[segments.length - 1];
      if (encodedBoardId) {
        const decodedBoardId = decodeURIComponent(encodedBoardId);
        return `https://miro.com/app/board/${decodedBoardId}`;
      }
    } catch {
      // Fall through to id fallback.
    }
  }

  return `https://miro.com/app/board/${trimWrappedQuotes(board.id)}`;
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function buildColumnGuideContent(status: MiroFixStatus) {
  if (status === "todo") {
    return [
      "<strong>Backlog Prompt</strong>",
      "Owner:",
      "Next Step:",
      "Success Metric:",
    ].join("<br/>");
  }

  if (status === "doing") {
    return [
      "<strong>In Progress Prompt</strong>",
      "Latest update:",
      "Risk:",
      "Next checkpoint:",
    ].join("<br/>");
  }

  if (status === "blocked") {
    return [
      "<strong>Blocked Prompt</strong>",
      "Blocker:",
      "Needed decision:",
      "Escalate to:",
    ].join("<br/>");
  }

  return [
    "<strong>Done Prompt</strong>",
    "Outcome:",
    "Evidence link:",
    "What changed:",
  ].join("<br/>");
}

export function buildPitchrBoardName(input: {
  runId: string;
  datePart: string;
  boardNamePrefix?: string;
}) {
  const prefixRaw = normalizeSpaces(input.boardNamePrefix?.trim() || "Pitchr Fix Board");
  const prefix = prefixRaw || "Pitchr Fix Board";
  const runToken = input.runId.replace(/[^a-zA-Z0-9-]/g, "");
  const runSuffix = (runToken || "run").slice(-12);
  const suffix = ` - Run ${runSuffix} - ${input.datePart}`;
  const maxPrefixLength = Math.max(1, MIRO_BOARD_NAME_MAX - suffix.length);

  const compactPrefix =
    prefix.length > maxPrefixLength
      ? normalizeSpaces(prefix.slice(0, maxPrefixLength))
      : prefix;
  const safePrefix = compactPrefix || prefix.slice(0, maxPrefixLength) || "P";

  return `${safePrefix}${suffix}`.slice(0, MIRO_BOARD_NAME_MAX);
}

interface ParsedPitchrSticky {
  rank: number;
  status: MiroFixStatus;
  owner: string;
  notes: string;
  nextStep: string;
  successMetric: string;
  blocker: string;
  category: string;
  impact: string;
  issue: string;
  action: string;
}

function getIssueLine(text: string) {
  const match = text.match(/(?:^|\n)\s*Issue:\s*(.+)$/im);
  return match?.[1]?.trim() ?? "";
}

function getActionLine(text: string) {
  const match = text.match(/(?:^|\n)\s*Action:\s*(.+)$/im);
  return match?.[1]?.trim() ?? "";
}

export function buildPitchrStickyContent(input: {
  fix: MiroTopFixInput;
  status?: MiroFixStatus;
  owner?: string;
  notes?: string;
  nextStep?: string;
  successMetric?: string;
  blocker?: string;
  issue?: string;
  action?: string;
}) {
  const status = input.status ?? "todo";
  const owner = (input.owner ?? "").trim();
  const notes = (input.notes ?? "").trim();
  const nextStep = (input.nextStep ?? "").trim();
  const successMetric = (input.successMetric ?? "").trim();
  const blocker = (input.blocker ?? "").trim();
  const issue = (input.issue ?? input.fix.issue).trim();
  const action = (input.action ?? input.fix.fix).trim();

  const lines = [
    HEADER_MARKER,
    `Rank: ${input.fix.rank}`,
    `Category: ${input.fix.category}`,
    `Impact: ${input.fix.impact}`,
    `Status: ${status}`,
    `Owner: ${owner}`,
    `Notes: ${notes}`,
  ];
  if (nextStep) lines.push(`Next Step: ${nextStep}`);
  if (successMetric) lines.push(`Success Metric: ${successMetric}`);
  if (blocker) lines.push(`Blocker: ${blocker}`);
  if (issue) lines.push(`Issue: ${issue}`);
  if (action) lines.push(`Action: ${action}`);
  return lines.join("\n");
}

export function parsePitchrStickyContent(
  content: string,
  defaultRank?: number,
): { parsed?: ParsedPitchrSticky; warning?: string } {
  const text = stripHtml(content);
  if (!text.includes(HEADER_MARKER)) {
    return { warning: "Sticky note is not a Pitchr fix card." };
  }

  const map = parseKeyValueLines(text);
  const rankRaw = map.get("rank");
  const rank =
    rankRaw != null ? Number.parseInt(rankRaw, 10) : defaultRank != null ? defaultRank : NaN;
  if (!Number.isFinite(rank)) {
    return { warning: "Pitchr sticky is missing valid rank." };
  }

  const statusRaw = (map.get("status") ?? "todo").toLowerCase();
  const status: MiroFixStatus = isValidFixStatus(statusRaw) ? statusRaw : "todo";

  const category = map.get("category") ?? "";
  const impact = map.get("impact") ?? "medium";

  return {
    parsed: {
      rank,
      status,
      owner: map.get("owner") ?? "",
      notes: map.get("notes") ?? "",
      nextStep: map.get("next step") ?? "",
      successMetric: map.get("success metric") ?? "",
      blocker: map.get("blocker") ?? "",
      category,
      impact,
      issue: getIssueLine(text),
      action: getActionLine(text),
    },
  };
}

function toColumnCenters(columnX: Partial<Record<MiroFixStatus, number>>) {
  const complete = KANBAN_COLUMN_ORDER.every((status) => Number.isFinite(columnX[status]));
  if (!complete) return null;
  return {
    todo: columnX.todo as number,
    doing: columnX.doing as number,
    blocked: columnX.blocked as number,
    done: columnX.done as number,
  };
}

export function detectStatusFromPosition(
  x: number,
  centers: Record<MiroFixStatus, number>,
): MiroFixStatus {
  let selected: MiroFixStatus = "todo";
  let minDistance = Number.POSITIVE_INFINITY;

  for (const status of KANBAN_COLUMN_ORDER) {
    const distance = Math.abs(x - centers[status]);
    if (distance < minDistance) {
      minDistance = distance;
      selected = status;
    }
  }

  return selected;
}

function getColumnStatusByParent(
  parentId: string | undefined,
  columnIds: PersistedMiroBoardState["layout"]["columnIds"],
): MiroFixStatus | null {
  if (!parentId) return null;
  for (const status of KANBAN_COLUMN_ORDER) {
    if (columnIds[status] && columnIds[status] === parentId) return status;
  }
  return null;
}

function toSnapshotFromState(input: {
  boardId: string;
  state: PersistedMiroBoardState;
  warnings?: string[];
  fallback?: boolean;
  message?: string;
  degraded?: boolean;
  conflicts?: number;
}): MiroProviderCreateResult["snapshot"] {
  const fixes = Object.entries(input.state.fixes)
    .map(([rankKey, fix]) => ({
      rank: Number.parseInt(rankKey, 10),
      status: fix.status,
      owner: fix.owner || undefined,
      notes: fix.notes || undefined,
      updatedAt: fix.updatedAt,
      itemId: fix.itemId,
      source: fix.source,
      conflict: false,
    }))
    .filter((fix) => Number.isFinite(fix.rank))
    .sort((a, b) => a.rank - b.rank);

  return {
    boardId: input.boardId,
    syncedAt: input.state.lastSyncedAt,
    fixes,
    warnings: input.warnings ?? [],
    queuedOps: input.state.pendingOps.length,
    degraded: input.degraded ?? false,
    conflicts: input.conflicts ?? 0,
    version: input.state.version,
    fallback: input.fallback,
    message: input.message,
  };
}

function capRewriteScript(script: string) {
  const compact = script.trim();
  if (compact.length <= MAX_REWRITE_PREVIEW_CHARS) return compact;
  return `${compact.slice(0, MAX_REWRITE_PREVIEW_CHARS)}...`;
}

export class MiroRestProvider implements MiroProvider {
  private readonly token: string;
  private readonly teamId?: string;

  constructor(opts: { token: string; teamId?: string }) {
    this.token = opts.token;
    this.teamId = opts.teamId;
  }

  private async fetchMiro<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${MIRO_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const message = await res.text();
    if (!res.ok) {
      throw new MiroHttpError(path, res.status, message.slice(0, 500));
    }

    if (!message) return {} as T;
    try {
      return JSON.parse(message) as T;
    } catch {
      return {} as T;
    }
  }

  private async createBoard(name: string) {
    const payload = this.teamId ? { name, teamId: this.teamId } : { name };

    try {
      return await this.fetchMiro<MiroBoardCreateResponse>("/boards", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!this.teamId) throw error;
      return this.fetchMiro<MiroBoardCreateResponse>("/boards", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    }
  }

  private async createFrame(input: {
    boardId: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    parentId?: string;
    fillColor?: MiroFrameFillColor;
  }): Promise<MiroFrameResponse> {
    const payload = {
      data: {
        title: input.title,
      },
      position: {
        x: input.x,
        y: input.y,
      },
      geometry: {
        width: input.width,
        height: input.height,
      },
      style: input.fillColor
        ? {
            fillColor: input.fillColor,
          }
        : undefined,
      parent: input.parentId ? { id: input.parentId } : undefined,
    };

    try {
      return await this.fetchMiro<MiroFrameResponse>(
        `/boards/${encodeURIComponent(input.boardId)}/frames`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    } catch (error) {
      if (!input.parentId) throw error;
      return this.fetchMiro<MiroFrameResponse>(
        `/boards/${encodeURIComponent(input.boardId)}/frames`,
        {
          method: "POST",
          body: JSON.stringify({ ...payload, parent: undefined }),
        },
      );
    }
  }

  private async createSticky(input: {
    boardId: string;
    content: string;
    x: number;
    y: number;
    fallbackX?: number;
    fallbackY?: number;
    parentId?: string;
    fillColor?: MiroStickyFillColor;
    shape?: MiroStickyShape;
  }): Promise<MiroStickyResponse> {
    const payload = {
      data: {
        content: input.content,
        shape: input.shape ?? "square",
      },
      position: {
        x: input.x,
        y: input.y,
      },
      style: input.fillColor
        ? {
            fillColor: input.fillColor,
          }
        : undefined,
      parent: input.parentId ? { id: input.parentId } : undefined,
    };

    const postSticky = (body: typeof payload) =>
      this.fetchMiro<MiroStickyResponse>(
        `/boards/${encodeURIComponent(input.boardId)}/sticky_notes`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

    try {
      return await postSticky(payload);
    } catch (error) {
      let safePayload = payload;
      if (input.shape && input.shape !== "square") {
        safePayload = {
          ...payload,
          data: {
            ...payload.data,
            shape: "square",
          },
        };
        try {
          return await postSticky(safePayload);
        } catch {
          // Keep falling back.
        }
      }

      if (!input.parentId) throw error;
      return postSticky({
        ...safePayload,
        parent: undefined,
        position: {
          x: typeof input.fallbackX === "number" ? input.fallbackX : safePayload.position.x,
          y: typeof input.fallbackY === "number" ? input.fallbackY : safePayload.position.y,
        },
      });
    }
  }

  private async createShape(input: {
    boardId: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    parentId?: string;
    shape?: "circle" | "rectangle";
    fillColor?: MiroFrameFillColor;
    fallbackFillColor?: MiroStickyFillColor;
  }): Promise<MiroShapeResponse> {
    const path = `/boards/${encodeURIComponent(input.boardId)}/shapes`;
    const payloadA = {
      data: {
        shape: input.shape ?? "circle",
        content: input.content,
      },
      position: {
        x: input.x,
        y: input.y,
      },
      geometry: {
        width: input.width,
        height: input.height,
      },
      style: input.fillColor
        ? {
            fillColor: input.fillColor,
          }
        : undefined,
      parent: input.parentId ? { id: input.parentId } : undefined,
    };

    const payloadB = {
      shape: input.shape ?? "circle",
      content: input.content,
      position: {
        x: input.x,
        y: input.y,
      },
      geometry: {
        width: input.width,
        height: input.height,
      },
      style: input.fillColor
        ? {
            fillColor: input.fillColor,
          }
        : undefined,
      parent: input.parentId ? { id: input.parentId } : undefined,
    };

    try {
      return await this.fetchMiro<MiroShapeResponse>(path, {
        method: "POST",
        body: JSON.stringify(payloadA),
      });
    } catch (firstError) {
      try {
        return await this.fetchMiro<MiroShapeResponse>(path, {
          method: "POST",
          body: JSON.stringify(payloadB),
        });
      } catch {
        const sticky = await this.createSticky({
          boardId: input.boardId,
          content: input.content,
          x: input.x,
          y: input.y,
          parentId: input.parentId,
          fillColor: input.fallbackFillColor ?? "light_blue",
          shape: "rectangle",
        });
        return { id: sticky.id, modifiedAt: sticky.modifiedAt };
      }
    }
  }

  private async createConnector(input: {
    boardId: string;
    startItemId: string;
    endItemId: string;
  }) {
    const path = `/boards/${encodeURIComponent(input.boardId)}/connectors`;
    const payload = {
      startItem: {
        id: input.startItemId,
      },
      endItem: {
        id: input.endItemId,
      },
    };
    try {
      await this.fetchMiro(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      // Connector API support can vary by workspace plan/version.
    }
  }

  private async getItem(boardId: string, itemId: string): Promise<MiroBoardItemResponse> {
    return this.fetchMiro<MiroBoardItemResponse>(
      `/boards/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: "GET",
      },
    );
  }

  private async updateStickyContent(input: {
    boardId: string;
    itemId: string;
    content: string;
  }): Promise<MiroStickyResponse> {
    return this.fetchMiro<MiroStickyResponse>(
      `/boards/${encodeURIComponent(input.boardId)}/sticky_notes/${encodeURIComponent(input.itemId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            content: input.content,
          },
        }),
      },
    );
  }

  private async updateItemParent(input: {
    boardId: string;
    itemId: string;
    parentId: string;
  }): Promise<void> {
    await this.fetchMiro(
      `/boards/${encodeURIComponent(input.boardId)}/items/${encodeURIComponent(input.itemId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          parent: {
            id: input.parentId,
          },
        }),
      },
    );
  }

  private async updateItemPosition(input: {
    boardId: string;
    itemId: string;
    x: number;
    y: number;
  }): Promise<void> {
    await this.fetchMiro(
      `/boards/${encodeURIComponent(input.boardId)}/items/${encodeURIComponent(input.itemId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          position: {
            x: input.x,
            y: input.y,
          },
        }),
      },
    );
  }

  private getColumnXPosition(
    baseX: number,
    status: MiroFixStatus,
    kanbanSize: "small" | "full",
  ): number {
    return baseX + getColumnOffsets(kanbanSize)[status];
  }

  async createFixBoard(input: MiroProviderCreateInput): Promise<MiroProviderCreateResult> {
    const nowIso = new Date().toISOString();
    const datePart = nowIso.slice(0, 10);
    const boardName = buildPitchrBoardName({
      runId: input.runId,
      datePart,
      boardNamePrefix: input.boardNamePrefix,
    });
    const board = await this.createBoard(boardName);
    const boardUrl = buildMiroBoardUrl(board);

    const layoutStyle = input.generated.layoutStyle || "mindmap_hybrid";
    const kanbanSize: "small" | "full" =
      layoutStyle === "mindmap_hybrid"
        ? "small"
        : input.generated.kanbanSize === "full"
          ? "full"
          : "small";
    const rootX = layoutStyle === "mindmap_hybrid" ? -460 : -120;
    const kanbanX = layoutStyle === "mindmap_hybrid" ? 1550 : 1200;
    const mindMapY = 130;
    const mindMapWidth = layoutStyle === "mindmap_hybrid" ? 2500 : 1900;
    const mindMapHeight = layoutStyle === "mindmap_hybrid" ? 1850 : 1450;

    const overviewFrame = await this.createFrame({
      boardId: board.id,
      title: "Overview",
      x: rootX,
      y: -1320,
      width: mindMapWidth,
      height: 620,
    });

    const mindMapFrame = await this.createFrame({
      boardId: board.id,
      title: "Fix Mind Map",
      x: rootX,
      y: mindMapY,
      width: mindMapWidth,
      height: mindMapHeight,
    });

    const kanbanFrame = await this.createFrame({
      boardId: board.id,
      title: "Fix Execution Kanban",
      x: kanbanX,
      y: 180,
      width: kanbanSize === "small" ? 1600 : 3000,
      height: kanbanSize === "small" ? 1950 : 2100,
    });

    const rewriteFrame = await this.createFrame({
      boardId: board.id,
      title: "Rewrite Script",
      x: rootX,
      y: 1620,
      width: mindMapWidth,
      height: 900,
    });

    const detailsFrame = await this.createFrame({
      boardId: board.id,
      title: "Fix Details",
      x: rootX,
      y: layoutStyle === "mindmap_hybrid" ? 2720 : 2620,
      width: mindMapWidth,
      height: 1180,
    });

    const columnIds: PersistedMiroBoardState["layout"]["columnIds"] = {
      todo: "",
      doing: "",
      blocked: "",
      done: "",
    };
    const columnWidth = kanbanSize === "small" ? 320 : 640;
    const columnHeight = kanbanSize === "small" ? 1500 : 1650;
    const columnY = kanbanSize === "small" ? 230 : 200;
    const guideY = kanbanSize === "small" ? -260 : -230;
    const columnX: Record<MiroFixStatus, number> = {
      todo: this.getColumnXPosition(kanbanX, "todo", kanbanSize),
      doing: this.getColumnXPosition(kanbanX, "doing", kanbanSize),
      blocked: this.getColumnXPosition(kanbanX, "blocked", kanbanSize),
      done: this.getColumnXPosition(kanbanX, "done", kanbanSize),
    };

    for (const status of KANBAN_COLUMN_ORDER) {
      const frame = await this.createFrame({
        boardId: board.id,
        title: toTitleCase(status),
        x: columnX[status],
        y: columnY,
        width: columnWidth,
        height: columnHeight,
        parentId: kanbanFrame.id,
        fillColor: COLUMN_TINT_FRAME[status],
      });
      columnIds[status] = frame.id;
    }

    for (const status of KANBAN_COLUMN_ORDER) {
      const parentId = columnIds[status];
      if (!parentId) continue;
      const guideX = columnWidth / 2;
      const guideYRelative = toParentRelativeCoordinate(columnY, columnHeight, guideY);
      await this.createSticky({
        boardId: board.id,
        content: input.generated.columnGuides[status] || buildColumnGuideContent(status),
        x: guideX,
        y: guideYRelative,
        fallbackX: columnX[status],
        fallbackY: guideY,
        parentId,
        fillColor: COLUMN_TINT_STICKY[status],
        shape: GUIDE_CARD_SHAPE,
      });
    }

    const fixesByRank = new Map<number, MiroGeneratedFixCard>(
      input.generated.fixCards.map((fix) => [fix.rank, fix]),
    );
    const centerNode = await this.createShape({
      boardId: board.id,
      content: [
        `<strong>${input.generated.mindMap.centerTitle}</strong>`,
        ...toBulletLines(input.generated.mindMap.centerBullets),
      ].join("<br/>"),
      x: rootX,
      y: mindMapY + 10,
      width: 420,
      height: 300,
      parentId: mindMapFrame.id,
      shape: "circle",
      fillColor: "#bfdbfe",
      fallbackFillColor: "light_blue",
    });

    const mindNodes = input.generated.mindMap.nodes.slice(0, 10);
    const totalNodes = Math.max(1, mindNodes.length);
    const radiusX = layoutStyle === "mindmap_hybrid" ? 840 : 620;
    const radiusY = layoutStyle === "mindmap_hybrid" ? 520 : 420;

    for (const [index, node] of mindNodes.entries()) {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / totalNodes;
      const nodeX = rootX + Math.round(Math.cos(angle) * radiusX);
      const nodeY = mindMapY + Math.round(Math.sin(angle) * radiusY);
      const nodeStatus = getStatusForMindMapNode(node, fixesByRank);
      let visualId = "";

      if (node.tool === "sticky") {
        const sticky = await this.createSticky({
          boardId: board.id,
          content: buildMindMapNodeContent(node),
          x: nodeX,
          y: nodeY,
          parentId: mindMapFrame.id,
          fillColor: MINDMAP_NODE_FILL[nodeStatus],
          shape: "rectangle",
        });
        visualId = sticky.id;
      } else {
        const shape = await this.createShape({
          boardId: board.id,
          content: buildMindMapNodeContent(node),
          x: nodeX,
          y: nodeY,
          width: node.tool === "bubble" ? 280 : 320,
          height: node.tool === "bubble" ? 280 : 220,
          parentId: mindMapFrame.id,
          shape: node.tool === "bubble" ? "circle" : "rectangle",
          fillColor: COLUMN_TINT_FRAME[nodeStatus],
          fallbackFillColor: MINDMAP_NODE_FILL[nodeStatus],
        });
        visualId = shape.id;
      }

      if (visualId) {
        await this.createConnector({
          boardId: board.id,
          startItemId: centerNode.id,
          endItemId: visualId,
        });
      }
    }

    await this.createSticky({
      boardId: board.id,
      content: input.generated.overviewCardHtml,
      x: rootX,
      y: -1350,
      parentId: overviewFrame.id,
      fillColor: "light_yellow",
      shape: "rectangle",
    });

    await this.createSticky({
      boardId: board.id,
      content: capRewriteScript(input.generated.rewriteCardText || input.rewriteScript),
      x: rootX,
      y: 1500,
      parentId: rewriteFrame.id,
      fillColor: "light_blue",
      shape: "rectangle",
    });

    const sortedFixes = [...input.generated.fixCards]
      .filter((fix) => Number.isFinite(fix.rank))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5);

    const fixes: PersistedMiroBoardState["fixes"] = {};

    for (const [index, fix] of sortedFixes.entries()) {
      const initialStatus = getGeneratedFixStatus(fix, index);
      const slot = getFixedSlotPosition({
        rank: fix.rank,
        columnX: columnX[initialStatus],
        columnY,
        columnWidth,
        columnHeight,
        useParentCoords: true,
      });
      const compactIssue = compactStickyText(fix.issue, PRIMARY_ISSUE_MAX_CHARS);
      const compactAction = compactStickyText(fix.action, PRIMARY_ACTION_MAX_CHARS);

      const sticky = await this.createSticky({
        boardId: board.id,
        content: buildPitchrStickyContent({
          fix: {
            rank: fix.rank,
            category: fix.category,
            impact: fix.impact,
            issue: fix.issue,
            fix: fix.action,
          },
          status: initialStatus,
          owner: fix.owner,
          notes: fix.notes,
          issue: compactIssue,
          action: compactAction,
        }),
        x: slot.x,
        y: slot.y,
        fallbackX: slot.absoluteX,
        fallbackY: slot.absoluteY,
        parentId: columnIds[initialStatus],
        fillColor: COLUMN_TINT_STICKY[initialStatus],
        shape: FIX_CARD_SHAPE,
      });

      fixes[String(fix.rank)] = {
        itemId: sticky.id,
        status: initialStatus,
        owner: fix.owner,
        notes: fix.notes,
        updatedAt: sticky.modifiedAt || nowIso,
        source: "system",
        x: slot.absoluteX,
        y: slot.absoluteY,
      };

      const detailsY = getDetailCardStartY(layoutStyle) + index * DETAIL_CARD_ROW_GAP;
      const detailOffsetX = getDetailCardColumnOffset(layoutStyle);
      await this.createSticky({
        boardId: board.id,
        content: buildFixDetailStickyContent({
          title: `#${fix.rank} Issue`,
          body: fix.issue || "No issue text provided.",
          footer: `Category: ${fix.category} (${fix.impact})`,
        }),
        x: rootX - detailOffsetX,
        y: detailsY,
        fillColor: "light_pink",
        shape: "rectangle",
      });

      const actionBody = [
        fix.action,
        fix.nextStep ? `Next: ${fix.nextStep}` : "",
        fix.successMetric ? `Success: ${fix.successMetric}` : "",
        fix.blocker ? `Blocker: ${fix.blocker}` : "",
      ]
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
      await this.createSticky({
        boardId: board.id,
        content: buildFixDetailStickyContent({
          title: `#${fix.rank} Action Plan`,
          body: actionBody || "No action text provided.",
          footer: fix.owner ? `Owner: ${fix.owner}` : "",
        }),
        x: rootX + detailOffsetX,
        y: detailsY,
        fillColor: "light_green",
        shape: "rectangle",
      });
    }

    const state: PersistedMiroBoardState = {
      version: 1,
      layout: {
        overviewFrameId: overviewFrame.id,
        kanbanFrameId: kanbanFrame.id,
        rewriteFrameId: rewriteFrame.id,
        columnIds,
      },
      fixes,
      pendingOps: [],
      lastSyncedAt: nowIso,
    };

    return {
      boardId: board.id,
      boardUrl,
      createdAt: nowIso,
      state,
      snapshot: toSnapshotFromState({
        boardId: board.id,
        state,
      }),
    };
  }

  async syncFixBoard(input: {
    runId: string;
    boardId: string;
    state: PersistedMiroBoardState;
  }): Promise<MiroProviderSyncResult> {
    const warnings: string[] = [];
    const fixes: MiroProviderSyncedFix[] = [];
    const nowIso = new Date().toISOString();

    const columnX: Partial<Record<MiroFixStatus, number>> = {};
    for (const status of KANBAN_COLUMN_ORDER) {
      const columnId = input.state.layout.columnIds[status];
      if (!columnId) continue;
      try {
        const columnItem = await this.getItem(input.boardId, columnId);
        const x = columnItem.position?.x;
        if (typeof x === "number") columnX[status] = x;
      } catch (error) {
        warnings.push(
          `Could not read column ${status}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    const columnCenters = toColumnCenters(columnX);

    const entries = Object.entries(input.state.fixes);
    for (const [rankKey, stored] of entries) {
      const rank = Number.parseInt(rankKey, 10);
      if (!Number.isFinite(rank)) continue;
      if (!stored.itemId) continue;

      try {
        const item = await this.getItem(input.boardId, stored.itemId);
        const parsed = parsePitchrStickyContent(item.data?.content ?? "", rank);
        if (!parsed.parsed) {
          warnings.push(parsed.warning || `Could not parse sticky for rank ${rank}.`);
          continue;
        }

        const statusByParent = getColumnStatusByParent(
          item.parent?.id,
          input.state.layout.columnIds,
        );
        const x = typeof item.position?.x === "number" ? item.position.x : stored.x;
        const statusByX =
          x != null && columnCenters ? detectStatusFromPosition(x, columnCenters) : null;
        const finalStatus = statusByParent || statusByX || parsed.parsed.status;

        fixes.push({
          rank,
          itemId: item.id,
          status: finalStatus,
          owner: parsed.parsed.owner,
          notes: parsed.parsed.notes,
          updatedAt: item.modifiedAt || nowIso,
          source: "miro",
          x,
          y: typeof item.position?.y === "number" ? item.position.y : stored.y,
        });
      } catch (error) {
        warnings.push(
          `Could not sync sticky for rank ${rank}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return {
      boardId: input.boardId,
      syncedAt: nowIso,
      fixes: fixes.sort((a, b) => a.rank - b.rank),
      warnings,
    };
  }

  async applyFixPatch(input: {
    runId: string;
    boardId: string;
    state: PersistedMiroBoardState;
    rank: number;
    patch: MiroFixPatch;
    updatedAtIso: string;
  }): Promise<MiroProviderPatchResult> {
    const rankKey = String(input.rank);
    const existing = input.state.fixes[rankKey];
    if (!existing?.itemId) {
      throw new Error(`No Miro sticky item mapped for fix rank ${input.rank}`);
    }

    const currentItem = await this.getItem(input.boardId, existing.itemId);
    const parsed = parsePitchrStickyContent(currentItem.data?.content ?? "", input.rank);
    if (!parsed.parsed) {
      throw new Error(parsed.warning || `Could not parse sticky content for rank ${input.rank}`);
    }

    const nextStatus = input.patch.status ?? parsed.parsed.status;
    const nextOwner = input.patch.owner ?? parsed.parsed.owner;
    const nextNotes = input.patch.notes ?? parsed.parsed.notes;
    const content = buildPitchrStickyContent({
      fix: {
        rank: parsed.parsed.rank,
        category: parsed.parsed.category || "general",
        impact: parsed.parsed.impact || "medium",
        issue: parsed.parsed.issue || "",
        fix: parsed.parsed.action || "",
      },
      status: nextStatus,
      owner: nextOwner,
      notes: nextNotes,
      nextStep: parsed.parsed.nextStep,
      successMetric: parsed.parsed.successMetric,
      blocker: parsed.parsed.blocker,
      issue: parsed.parsed.issue,
      action: parsed.parsed.action,
    });

    const updatedSticky = await this.updateStickyContent({
      boardId: input.boardId,
      itemId: existing.itemId,
      content,
    });

    const targetColumnId = input.state.layout.columnIds[nextStatus];
    if (targetColumnId) {
      await this.updateItemParent({
        boardId: input.boardId,
        itemId: existing.itemId,
        parentId: targetColumnId,
      });
    }

    let nextX = typeof existing.x === "number" ? existing.x : 0;
    let nextY =
      typeof existing.y === "number" ? existing.y : getFixedSlotAbsoluteY(input.rank, "small");
    if (targetColumnId) {
      try {
        const targetColumn = await this.getItem(input.boardId, targetColumnId);
        const columnX = typeof targetColumn.position?.x === "number" ? targetColumn.position.x : 0;
        const columnY =
          typeof targetColumn.position?.y === "number"
            ? targetColumn.position.y
            : getFixCardStartY("small");
        const columnWidth =
          typeof targetColumn.geometry?.width === "number" ? targetColumn.geometry.width : 320;
        const columnHeight =
          typeof targetColumn.geometry?.height === "number" ? targetColumn.geometry.height : 1500;
        const slot = getFixedSlotPosition({
          rank: input.rank,
          columnX,
          columnY,
          columnWidth,
          columnHeight,
          useParentCoords: true,
        });
        nextX = slot.x;
        nextY = slot.y;
      } catch {
        // Keep existing slot values if target column metadata cannot be resolved.
      }
    }

    try {
      await this.updateItemPosition({
        boardId: input.boardId,
        itemId: existing.itemId,
        x: nextX,
        y: nextY,
      });
    } catch {
      // If position patch is unsupported by the workspace, keep sync alive with parent/content updates.
    }

    return {
      rank: input.rank,
      itemId: existing.itemId,
      status: nextStatus,
      owner: nextOwner,
      notes: nextNotes,
      updatedAt: updatedSticky.modifiedAt || input.updatedAtIso,
      x: Number.isFinite(nextX) ? nextX : undefined,
      y: Number.isFinite(nextY) ? nextY : undefined,
    };
  }
}

export function isRetryableMiroError(error: unknown): boolean {
  if (error instanceof MiroHttpError) {
    return error.status === 429 || error.status >= 500;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /Miro API (429|5\d\d)/i.test(message);
}
