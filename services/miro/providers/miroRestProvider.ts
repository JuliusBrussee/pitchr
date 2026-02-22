import type { MiroProvider } from "@/services/miro/miroProvider";
import type {
  MiroFixPatch,
  MiroFixStatus,
  MiroGeneratedFixCard,
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
  todo: -930,
  doing: -310,
  blocked: 310,
  done: 930,
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
const FIX_CARD_START_Y = -80;
const FIX_CARD_ROW_GAP = 270;

function getInitialStatusForIndex(index: number): MiroFixStatus {
  return INITIAL_STATUS_BY_INDEX[index] ?? "todo";
}

function getGeneratedFixStatus(fix: MiroGeneratedFixCard, index: number): MiroFixStatus {
  return isValidFixStatus(fix.status) ? fix.status : getInitialStatusForIndex(index);
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

interface MiroBoardItemResponse {
  id: string;
  modifiedAt?: string;
  parent?: { id?: string };
  position?: { x?: number; y?: number };
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
  const nextStep = (input.nextStep || "[define next step]").trim();
  const successMetric = (input.successMetric || "[define success metric]").trim();
  const blocker = (input.blocker || "[none]").trim();
  const issue = (input.issue ?? input.fix.issue).trim();
  const action = (input.action ?? input.fix.fix).trim();

  return [
    HEADER_MARKER,
    `Rank: ${input.fix.rank}`,
    `Category: ${input.fix.category}`,
    `Impact: ${input.fix.impact}`,
    "",
    "Execution:",
    `Status: ${status}`,
    `Owner: ${owner}`,
    `Notes: ${notes}`,
    `Next Step: ${nextStep}`,
    `Success Metric: ${successMetric}`,
    `Blocker: ${blocker}`,
    "",
    `Issue: ${issue}`,
    `Action: ${action}`,
  ].join("\n");
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
      return postSticky({ ...safePayload, parent: undefined });
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

  private getColumnXPosition(baseX: number, status: MiroFixStatus): number {
    return baseX + COLUMN_OFFSETS_X[status];
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

    const overviewFrame = await this.createFrame({
      boardId: board.id,
      title: "Overview",
      x: 0,
      y: -1350,
      width: 2500,
      height: 620,
    });

    const kanbanFrame = await this.createFrame({
      boardId: board.id,
      title: "Fix Execution Kanban",
      x: 0,
      y: 50,
      width: 3200,
      height: 1750,
    });

    const rewriteFrame = await this.createFrame({
      boardId: board.id,
      title: "Rewrite Script",
      x: 0,
      y: 1500,
      width: 2500,
      height: 900,
    });

    const columnIds: PersistedMiroBoardState["layout"]["columnIds"] = {
      todo: "",
      doing: "",
      blocked: "",
      done: "",
    };
    const columnX: Record<MiroFixStatus, number> = {
      todo: this.getColumnXPosition(0, "todo"),
      doing: this.getColumnXPosition(0, "doing"),
      blocked: this.getColumnXPosition(0, "blocked"),
      done: this.getColumnXPosition(0, "done"),
    };

    for (const status of KANBAN_COLUMN_ORDER) {
      const frame = await this.createFrame({
        boardId: board.id,
        title: toTitleCase(status),
        x: columnX[status],
        y: 100,
        width: 620,
        height: 1450,
        parentId: kanbanFrame.id,
        fillColor: COLUMN_TINT_FRAME[status],
      });
      columnIds[status] = frame.id;
    }

    for (const status of KANBAN_COLUMN_ORDER) {
      const parentId = columnIds[status];
      if (!parentId) continue;
      await this.createSticky({
        boardId: board.id,
        content: input.generated.columnGuides[status] || buildColumnGuideContent(status),
        x: columnX[status],
        y: -380,
        parentId,
        fillColor: COLUMN_TINT_STICKY[status],
        shape: GUIDE_CARD_SHAPE,
      });
    }

    await this.createSticky({
      boardId: board.id,
      content: input.generated.overviewCardHtml,
      x: 0,
      y: -1350,
      parentId: overviewFrame.id,
      fillColor: "light_yellow",
      shape: "rectangle",
    });

    await this.createSticky({
      boardId: board.id,
      content: capRewriteScript(input.generated.rewriteCardText || input.rewriteScript),
      x: 0,
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
    const columnRowIndex: Record<MiroFixStatus, number> = {
      todo: 0,
      doing: 0,
      blocked: 0,
      done: 0,
    };

    for (const [index, fix] of sortedFixes.entries()) {
      const initialStatus = getGeneratedFixStatus(fix, index);
      const row = columnRowIndex[initialStatus];
      columnRowIndex[initialStatus] = row + 1;
      const stickyY = FIX_CARD_START_Y + row * FIX_CARD_ROW_GAP;

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
          nextStep: fix.nextStep,
          successMetric: fix.successMetric,
          blocker: fix.blocker,
          issue: fix.issue,
          action: fix.action,
        }),
        x: columnX[initialStatus],
        y: stickyY,
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
        x: columnX[initialStatus],
        y: stickyY,
      };
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

    return {
      rank: input.rank,
      itemId: existing.itemId,
      status: nextStatus,
      owner: nextOwner,
      notes: nextNotes,
      updatedAt: updatedSticky.modifiedAt || input.updatedAtIso,
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
