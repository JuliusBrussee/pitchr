import type { MiroProvider } from "@/services/miro/miroProvider";
import type {
  MiroFixBoardRequest,
  MiroFixBoardResponse,
  MiroFixStatus,
  MiroSyncSnapshot,
  MiroSyncedFix,
  MiroTopFixInput,
} from "@/services/miro/miroTypes";

const MIRO_BASE_URL = "https://api.miro.com/v2";
const HEADER_MARKER = "[PITCHR_FIX]";
const MIRO_BOARD_NAME_MAX = 60;

interface MiroBoardCreateResponse {
  id: string;
  viewLink?: string;
  links?: {
    self?: string;
  };
}

interface MiroItemsResponse {
  data?: Array<{
    id: string;
    type?: string;
    modifiedAt?: string;
    data?: { content?: string };
  }>;
  cursor?: string;
}

function isValidFixStatus(value: string): value is MiroFixStatus {
  return value === "todo" || value === "doing" || value === "done" || value === "blocked";
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
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    parsed.set(key, value);
  }

  return parsed;
}

function trimWrappedQuotes(value: string) {
  return value.trim().replace(/^['"]+|['"]+$/g, "");
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

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function buildPitchrBoardName(input: {
  runId: string;
  datePart: string;
  boardNamePrefix?: string;
}) {
  const prefixRaw = normalizeSpaces(input.boardNamePrefix?.trim() || "Pitchr");
  const prefix = prefixRaw || "Pitchr";
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

export function buildPitchrStickyContent(runId: string, fix: MiroTopFixInput) {
  return [
    HEADER_MARKER,
    `runId: ${runId}`,
    `fixRank: ${fix.rank}`,
    `category: ${fix.category}`,
    `impact: ${fix.impact}`,
    "status: todo",
    "owner: ",
    "notes: ",
    "",
    `Issue: ${fix.issue}`,
    `Action: ${fix.fix}`,
  ].join("\n");
}

export function parsePitchrStickyContent(content: string): { fix?: MiroSyncedFix; warning?: string } {
  const text = stripHtml(content);
  if (!text.includes(HEADER_MARKER)) {
    return { warning: "Skipped non-Pitchr sticky note item." };
  }

  const map = parseKeyValueLines(text);
  const rankValue = map.get("fixRank");
  if (!rankValue) {
    return { warning: "Pitchr sticky is missing fixRank." };
  }

  const rank = Number.parseInt(rankValue, 10);
  if (!Number.isFinite(rank)) {
    return { warning: `Invalid fixRank value: ${rankValue}` };
  }

  const statusRaw = (map.get("status") ?? "todo").toLowerCase();
  const status: MiroFixStatus = isValidFixStatus(statusRaw) ? statusRaw : "todo";

  return {
    fix: {
      rank,
      status,
      owner: map.get("owner") || undefined,
      notes: map.get("notes") || undefined,
    },
  };
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

    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Miro API ${res.status} on ${path}: ${message.slice(0, 400)}`);
    }

    return (await res.json()) as T;
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

  private async createSticky(boardId: string, content: string) {
    await this.fetchMiro(`/boards/${encodeURIComponent(boardId)}/sticky_notes`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          content,
          shape: "square",
        },
      }),
    });
  }

  async createFixBoard(input: MiroFixBoardRequest): Promise<MiroFixBoardResponse> {
    const datePart = new Date().toISOString().slice(0, 10);
    const boardName = buildPitchrBoardName({
      runId: input.runId,
      datePart,
      boardNamePrefix: input.boardNamePrefix,
    });
    const board = await this.createBoard(boardName);

    for (const fix of input.topFixes) {
      const content = buildPitchrStickyContent(input.runId, fix);
      await this.createSticky(board.id, content);
    }

    return {
      boardId: board.id,
      boardUrl: buildMiroBoardUrl(board),
      createdAt: new Date().toISOString(),
    };
  }

  async syncFixBoard(input: { runId: string; boardId: string }): Promise<MiroSyncSnapshot> {
    const warnings: string[] = [];
    const fixes: MiroSyncedFix[] = [];

    let cursor = "";
    do {
      const query = new URLSearchParams({
        limit: "50",
        type: "sticky_note",
      });
      if (cursor) query.set("cursor", cursor);

      const response = await this.fetchMiro<MiroItemsResponse>(
        `/boards/${encodeURIComponent(input.boardId)}/items?${query.toString()}`,
      );

      for (const item of response.data ?? []) {
        const content = item.data?.content;
        if (!content) continue;

        const parsed = parsePitchrStickyContent(content);
        if (parsed.warning) {
          warnings.push(parsed.warning);
          continue;
        }

        if (parsed.fix) {
          fixes.push({
            ...parsed.fix,
            itemId: item.id,
            lastUpdated: item.modifiedAt,
          });
        }
      }

      cursor = response.cursor || "";
    } while (cursor);

    const filteredFixes = fixes
      .filter((fix) => Number.isFinite(fix.rank))
      .sort((a, b) => a.rank - b.rank);

    return {
      boardId: input.boardId,
      syncedAt: new Date().toISOString(),
      fixes: filteredFixes,
      warnings,
    };
  }
}
