import { supabase } from "@/lib/supabase";
import type {
  MiroFixStatus,
  PersistedMiroBoardState,
  PersistedMiroFixState,
  PersistedMiroPendingOp,
} from "@/services/miro/miroTypes";

function isFixStatus(value: string): value is MiroFixStatus {
  return value === "todo" || value === "doing" || value === "done" || value === "blocked";
}

function defaultBoardState(nowIso: string): PersistedMiroBoardState {
  return {
    version: 1,
    layout: {
      overviewFrameId: "",
      kanbanFrameId: "",
      rewriteFrameId: "",
      columnIds: {
        todo: "",
        doing: "",
        blocked: "",
        done: "",
      },
    },
    fixes: {},
    pendingOps: [],
    lastSyncedAt: nowIso,
  };
}

function normalizeFixState(input: unknown, key: string, nowIso: string): PersistedMiroFixState | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const statusRaw = typeof value.status === "string" ? value.status : "todo";
  const status = isFixStatus(statusRaw) ? statusRaw : "todo";
  const itemId = typeof value.itemId === "string" ? value.itemId : "";
  if (!itemId) return null;

  return {
    itemId,
    status,
    owner: typeof value.owner === "string" ? value.owner : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : nowIso,
    source:
      value.source === "app" || value.source === "miro" || value.source === "system"
        ? value.source
        : "system",
    x: typeof value.x === "number" ? value.x : undefined,
    y: typeof value.y === "number" ? value.y : undefined,
  };
}

function normalizePendingOp(input: unknown, nowIso: string): PersistedMiroPendingOp | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (typeof value.opId !== "string") return null;
  if (typeof value.rank !== "number" || !Number.isFinite(value.rank)) return null;
  if (!value.patch || typeof value.patch !== "object") return null;
  const patch = value.patch as Record<string, unknown>;
  const statusRaw = patch.status;
  const nextPatch = {
    status: typeof statusRaw === "string" && isFixStatus(statusRaw) ? statusRaw : undefined,
    owner: typeof patch.owner === "string" ? patch.owner : undefined,
    notes: typeof patch.notes === "string" ? patch.notes : undefined,
  };

  return {
    opId: value.opId,
    rank: value.rank,
    patch: nextPatch,
    clientUpdatedAt:
      typeof value.clientUpdatedAt === "string" ? value.clientUpdatedAt : nowIso,
    attempts:
      typeof value.attempts === "number" && Number.isFinite(value.attempts)
        ? value.attempts
        : 0,
    nextRetryAt: typeof value.nextRetryAt === "string" ? value.nextRetryAt : nowIso,
    lastError: typeof value.lastError === "string" ? value.lastError : "",
  };
}

function normalizeBoardState(input: unknown): PersistedMiroBoardState {
  const nowIso = new Date().toISOString();
  const fallback = defaultBoardState(nowIso);
  if (!input || typeof input !== "object") return fallback;
  const value = input as Record<string, unknown>;

  const layoutRaw =
    value.layout && typeof value.layout === "object"
      ? (value.layout as Record<string, unknown>)
      : {};
  const columnIdsRaw =
    layoutRaw.columnIds && typeof layoutRaw.columnIds === "object"
      ? (layoutRaw.columnIds as Record<string, unknown>)
      : {};
  const fixesRaw =
    value.fixes && typeof value.fixes === "object"
      ? (value.fixes as Record<string, unknown>)
      : {};
  const pendingOpsRaw = Array.isArray(value.pendingOps) ? value.pendingOps : [];

  const fixes = Object.entries(fixesRaw).reduce<Record<string, PersistedMiroFixState>>(
    (acc, [key, next]) => {
      const normalized = normalizeFixState(next, key, nowIso);
      if (normalized) acc[key] = normalized;
      return acc;
    },
    {},
  );

  const pendingOps = pendingOpsRaw
    .map((entry) => normalizePendingOp(entry, nowIso))
    .filter((entry): entry is PersistedMiroPendingOp => Boolean(entry));

  return {
    version:
      typeof value.version === "number" && Number.isFinite(value.version) && value.version > 0
        ? value.version
        : 1,
    layout: {
      overviewFrameId:
        typeof layoutRaw.overviewFrameId === "string" ? layoutRaw.overviewFrameId : "",
      kanbanFrameId:
        typeof layoutRaw.kanbanFrameId === "string" ? layoutRaw.kanbanFrameId : "",
      rewriteFrameId:
        typeof layoutRaw.rewriteFrameId === "string" ? layoutRaw.rewriteFrameId : "",
      columnIds: {
        todo: typeof columnIdsRaw.todo === "string" ? columnIdsRaw.todo : "",
        doing: typeof columnIdsRaw.doing === "string" ? columnIdsRaw.doing : "",
        blocked: typeof columnIdsRaw.blocked === "string" ? columnIdsRaw.blocked : "",
        done: typeof columnIdsRaw.done === "string" ? columnIdsRaw.done : "",
      },
    },
    fixes,
    pendingOps,
    lastSyncedAt:
      typeof value.lastSyncedAt === "string" && value.lastSyncedAt
        ? value.lastSyncedAt
        : nowIso,
  };
}

function withMigrationHint(message: string): string {
  if (
    message.includes("relation \"run_miro_boards\" does not exist") ||
    message.includes("Could not find the table 'public.run_miro_boards'")
  ) {
    return `${message}. Apply migration: migrations/11-create-run-miro-boards-table.sql`;
  }
  return message;
}

export class RunMiroBoardNotFoundError extends Error {
  constructor(runId: string) {
    super(`Miro board not found for run: ${runId}`);
  }
}

export interface RunMiroBoardRecord {
  run_id: string;
  board_id: string;
  board_url: string;
  is_fallback: boolean;
  state: PersistedMiroBoardState;
  created_at: string;
  updated_at: string;
}

interface RunMiroBoardRow {
  run_id: string;
  board_id: string;
  board_url: string;
  is_fallback: boolean;
  state: unknown;
  created_at: string;
  updated_at: string;
}

function normalizeRow(row: RunMiroBoardRow): RunMiroBoardRecord {
  return {
    ...row,
    is_fallback: Boolean(row.is_fallback),
    state: normalizeBoardState(row.state),
  };
}

export async function getRunMiroBoard(runId: string): Promise<RunMiroBoardRecord | null> {
  const { data, error } = await supabase
    .from("run_miro_boards")
    .select("*")
    .eq("run_id", runId)
    .maybeSingle();

  if (error) {
    throw new Error(
      withMigrationHint(`Failed to fetch Miro board mapping: ${error.message}`),
    );
  }
  if (!data) return null;
  return normalizeRow(data as RunMiroBoardRow);
}

export async function getRequiredRunMiroBoard(runId: string): Promise<RunMiroBoardRecord> {
  const board = await getRunMiroBoard(runId);
  if (!board) throw new RunMiroBoardNotFoundError(runId);
  return board;
}

export async function upsertRunMiroBoard(input: {
  runId: string;
  boardId: string;
  boardUrl: string;
  isFallback?: boolean;
  state: PersistedMiroBoardState;
}): Promise<RunMiroBoardRecord> {
  const payload = {
    run_id: input.runId,
    board_id: input.boardId,
    board_url: input.boardUrl,
    is_fallback: input.isFallback ?? false,
    state: input.state,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("run_miro_boards")
    .upsert(payload, { onConflict: "run_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      withMigrationHint(`Failed to upsert Miro board mapping: ${error?.message ?? "unknown error"}`),
    );
  }

  return normalizeRow(data as RunMiroBoardRow);
}
