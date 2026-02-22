import { randomUUID } from "crypto";
import type { MiroProvider } from "@/services/miro/miroProvider";
import { MiroRestProvider, isRetryableMiroError } from "@/services/miro/providers/miroRestProvider";
import { MiroStubProvider } from "@/services/miro/providers/miroStubProvider";
import {
  getRequiredRunMiroBoard,
  getRunMiroBoard,
  RunMiroBoardNotFoundError,
  upsertRunMiroBoard,
  type RunMiroBoardRecord,
} from "@/services/miro/runMiroBoardService";
import type {
  MiroFixBoardRequest,
  MiroFixBoardResponse,
  MiroFixPatchRequest,
  MiroFixPatchResponse,
  MiroGetFixBoardResponse,
  MiroProviderSyncedFix,
  MiroSyncSnapshot,
  MiroTopFixInput,
  PersistedMiroBoardState,
  PersistedMiroFixState,
  PersistedMiroPendingOp,
} from "@/services/miro/miroTypes";

const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000, 32000, 60000] as const;
const MAX_PENDING_OP_ATTEMPTS = 8;

export class MiroSyncUnavailableError extends Error {}

function toMarkdown(input: {
  runId: string;
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
}) {
  const lines = [
    "# Pitchr Fix Board Export",
    "",
    `Run: ${input.runId}`,
    `Mode: ${input.mode}`,
    "",
    "## Verdict",
    input.oneLineVerdict,
    "",
    "## Top Fixes",
    ...input.topFixes.flatMap((fix) => [
      `### #${fix.rank} ${fix.category} (${fix.impact})`,
      `Issue: ${fix.issue}`,
      `Action: ${fix.fix}`,
      "",
    ]),
    "## Tightened Rewrite",
    input.rewriteScript,
  ];
  return lines.join("\n");
}

function toMs(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sameFixValues(a: PersistedMiroFixState, b: PersistedMiroFixState) {
  return a.status === b.status && a.owner === b.owner && a.notes === b.notes;
}

export function mergeLocalAndRemoteFix(input: {
  local: PersistedMiroFixState | undefined;
  remote: MiroProviderSyncedFix;
}): { merged: PersistedMiroFixState; conflict: boolean } {
  const remoteAsLocal: PersistedMiroFixState = {
    itemId: input.remote.itemId,
    status: input.remote.status,
    owner: input.remote.owner,
    notes: input.remote.notes,
    updatedAt: input.remote.updatedAt,
    source: "miro",
    x: input.remote.x,
    y: input.remote.y,
  };

  if (!input.local) return { merged: remoteAsLocal, conflict: false };

  const localTs = toMs(input.local.updatedAt);
  const remoteTs = toMs(input.remote.updatedAt);
  if (remoteTs > localTs) {
    return { merged: remoteAsLocal, conflict: !sameFixValues(input.local, remoteAsLocal) };
  }
  if (remoteTs < localTs) {
    return { merged: input.local, conflict: false };
  }

  return { merged: remoteAsLocal, conflict: !sameFixValues(input.local, remoteAsLocal) };
}

export function buildRetryDelayMs(attempts: number): number {
  const idx = Math.max(0, Math.min(RETRY_DELAYS_MS.length - 1, attempts - 1));
  return RETRY_DELAYS_MS[idx];
}

function toSnapshot(input: {
  boardId: string;
  state: PersistedMiroBoardState;
  warnings?: string[];
  fallback?: boolean;
  message?: string;
  degraded?: boolean;
  conflictRanks?: Set<number>;
}) {
  const fixes = Object.entries(input.state.fixes)
    .map(([rankKey, fix]) => ({
      rank: Number.parseInt(rankKey, 10),
      status: fix.status,
      owner: fix.owner || undefined,
      notes: fix.notes || undefined,
      updatedAt: fix.updatedAt,
      itemId: fix.itemId,
      source: fix.source,
      conflict: input.conflictRanks?.has(Number.parseInt(rankKey, 10)) ?? false,
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
    conflicts: input.conflictRanks?.size ?? 0,
    version: input.state.version,
    fallback: input.fallback,
    message: input.message,
  } satisfies MiroSyncSnapshot;
}

function applyPatchToFix(input: {
  fix: PersistedMiroFixState;
  patch: MiroFixPatchRequest["patch"];
  updatedAt: string;
  source: PersistedMiroFixState["source"];
}): PersistedMiroFixState {
  return {
    ...input.fix,
    status: input.patch.status ?? input.fix.status,
    owner: input.patch.owner ?? input.fix.owner,
    notes: input.patch.notes ?? input.fix.notes,
    updatedAt: input.updatedAt,
    source: input.source,
  };
}

function normalizePatch(patch: MiroFixPatchRequest["patch"]): MiroFixPatchRequest["patch"] {
  return {
    status: patch.status,
    owner: typeof patch.owner === "string" ? patch.owner.trim() : undefined,
    notes: typeof patch.notes === "string" ? patch.notes.trim() : undefined,
  };
}

function cloneState(state: PersistedMiroBoardState): PersistedMiroBoardState {
  return JSON.parse(JSON.stringify(state)) as PersistedMiroBoardState;
}

function isDue(iso: string, nowMs: number) {
  return toMs(iso) <= nowMs;
}

function makePendingOp(input: {
  rank: number;
  patch: MiroFixPatchRequest["patch"];
  clientUpdatedAt: string;
}): PersistedMiroPendingOp {
  return {
    opId: randomUUID(),
    rank: input.rank,
    patch: input.patch,
    clientUpdatedAt: input.clientUpdatedAt,
    attempts: 0,
    nextRetryAt: input.clientUpdatedAt,
    lastError: "",
  };
}

export class MiroService {
  private readonly liveProvider: MiroProvider | null;
  private readonly stubProvider: MiroProvider;

  constructor(opts?: { provider?: MiroProvider }) {
    this.stubProvider = new MiroStubProvider();
    if (opts?.provider) {
      this.liveProvider = opts.provider;
      return;
    }

    const enabled = process.env.MIRO_ENABLED !== "false";
    const mode = (process.env.MIRO_PROVIDER || "rest").toLowerCase();
    const token = process.env.MIRO_ACCESS_TOKEN;
    const teamId = process.env.MIRO_TEAM_ID;

    if (!enabled || mode === "stub" || !token) {
      this.liveProvider = null;
      return;
    }

    this.liveProvider = new MiroRestProvider({ token, teamId });
  }

  private getProviderForBoard(boardId: string): MiroProvider {
    if (boardId.startsWith("stub-board-")) {
      return this.stubProvider;
    }
    return this.liveProvider || this.stubProvider;
  }

  private async saveBoardRecord(input: {
    runId: string;
    boardId: string;
    boardUrl: string;
    isFallback?: boolean;
    state: PersistedMiroBoardState;
  }) {
    return upsertRunMiroBoard({
      runId: input.runId,
      boardId: input.boardId,
      boardUrl: input.boardUrl,
      isFallback: input.isFallback,
      state: input.state,
    });
  }

  private async processPendingOps(input: {
    board: RunMiroBoardRecord;
    provider: MiroProvider;
    state: PersistedMiroBoardState;
  }): Promise<{ state: PersistedMiroBoardState; warnings: string[] }> {
    const warnings: string[] = [];
    const nowMs = Date.now();
    const nextState = cloneState(input.state);
    const remainingOps: PersistedMiroPendingOp[] = [];

    for (const op of nextState.pendingOps) {
      if (op.attempts >= MAX_PENDING_OP_ATTEMPTS) {
        warnings.push(
          `Pending op ${op.opId} reached max retries (${MAX_PENDING_OP_ATTEMPTS}).`,
        );
        remainingOps.push(op);
        continue;
      }

      if (!isDue(op.nextRetryAt, nowMs)) {
        remainingOps.push(op);
        continue;
      }

      try {
        const patched = await input.provider.applyFixPatch({
          runId: input.board.run_id,
          boardId: input.board.board_id,
          state: nextState,
          rank: op.rank,
          patch: op.patch,
          updatedAtIso: new Date().toISOString(),
        });

        const rankKey = String(op.rank);
        const existing = nextState.fixes[rankKey];
        if (existing) {
          nextState.fixes[rankKey] = {
            ...existing,
            status: patched.status,
            owner: patched.owner,
            notes: patched.notes,
            updatedAt: patched.updatedAt,
            source: "app",
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const attempts = op.attempts + 1;
        const retryable = isRetryableMiroError(error);
        if (!retryable) {
          warnings.push(`Pending op ${op.opId} failed permanently: ${message}`);
          continue;
        }
        const delay = buildRetryDelayMs(attempts);
        remainingOps.push({
          ...op,
          attempts,
          nextRetryAt: new Date(Date.now() + delay).toISOString(),
          lastError: message,
        });
      }
    }

    nextState.pendingOps = remainingOps;
    return { state: nextState, warnings };
  }

  private async syncInternal(board: RunMiroBoardRecord): Promise<MiroSyncSnapshot> {
    const provider = this.getProviderForBoard(board.board_id);
    let state = cloneState(board.state);
    const preWarnings: string[] = [];

    const pendingResult = await this.processPendingOps({
      board,
      provider,
      state,
    });
    state = pendingResult.state;
    preWarnings.push(...pendingResult.warnings);

    try {
      const remote = await provider.syncFixBoard({
        runId: board.run_id,
        boardId: board.board_id,
        state,
      });

      const conflictRanks = new Set<number>();
      for (const remoteFix of remote.fixes) {
        const rankKey = String(remoteFix.rank);
        const merged = mergeLocalAndRemoteFix({
          local: state.fixes[rankKey],
          remote: remoteFix,
        });
        if (merged.conflict) conflictRanks.add(remoteFix.rank);
        state.fixes[rankKey] = merged.merged;
      }

      state.lastSyncedAt = remote.syncedAt;

      await this.saveBoardRecord({
        runId: board.run_id,
        boardId: board.board_id,
        boardUrl: board.board_url,
        isFallback: board.is_fallback || remote.fallback,
        state,
      });

      return toSnapshot({
        boardId: board.board_id,
        state,
        warnings: [...preWarnings, ...remote.warnings],
        fallback: board.is_fallback || remote.fallback,
        message: remote.message,
        degraded: false,
        conflictRanks,
      });
    } catch (error) {
      const hasCachedSnapshot = Object.keys(state.fixes).length > 0;
      if (hasCachedSnapshot) {
        state.lastSyncedAt = new Date().toISOString();
        await this.saveBoardRecord({
          runId: board.run_id,
          boardId: board.board_id,
          boardUrl: board.board_url,
          isFallback: board.is_fallback,
          state,
        });
        return toSnapshot({
          boardId: board.board_id,
          state,
          warnings: [
            ...preWarnings,
            `Sync degraded: ${error instanceof Error ? error.message : String(error)}`,
          ],
          fallback: board.is_fallback,
          degraded: true,
          message: "Using persisted snapshot while Miro sync is unavailable.",
        });
      }

      throw new MiroSyncUnavailableError(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async createFixBoard(input: MiroFixBoardRequest): Promise<MiroFixBoardResponse> {
    const existing = await getRunMiroBoard(input.runId);
    if (existing && !input.recreate) {
      const snapshot = await this.syncInternal(existing);
      return {
        boardId: existing.board_id,
        boardUrl: existing.board_url,
        createdAt: existing.created_at,
        reused: true,
        snapshot,
        fallback: existing.is_fallback,
      };
    }

    const provider = this.liveProvider || this.stubProvider;
    try {
      const created = await provider.createFixBoard(input);
      await this.saveBoardRecord({
        runId: input.runId,
        boardId: created.boardId,
        boardUrl: created.boardUrl,
        isFallback: created.fallback,
        state: created.state,
      });
      return {
        boardId: created.boardId,
        boardUrl: created.boardUrl,
        createdAt: created.createdAt,
        reused: false,
        snapshot: created.snapshot,
        fallback: created.fallback,
        message: created.message,
      };
    } catch (error) {
      const fallback = await this.stubProvider.createFixBoard(input);
      await this.saveBoardRecord({
        runId: input.runId,
        boardId: fallback.boardId,
        boardUrl: fallback.boardUrl,
        isFallback: true,
        state: fallback.state,
      });
      return {
        boardId: fallback.boardId,
        boardUrl: fallback.boardUrl,
        createdAt: fallback.createdAt,
        reused: false,
        snapshot: fallback.snapshot,
        fallback: true,
        message: `Miro create failed; fallback activated. ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async getFixBoard(runId: string): Promise<MiroGetFixBoardResponse> {
    const board = await getRequiredRunMiroBoard(runId);
    const snapshot = await this.syncInternal(board);
    return {
      boardId: board.board_id,
      boardUrl: board.board_url,
      createdAt: board.created_at,
      fallback: board.is_fallback,
      snapshot,
    };
  }

  async syncFixBoard(input: { runId: string }): Promise<MiroSyncSnapshot> {
    const board = await getRequiredRunMiroBoard(input.runId);
    return this.syncInternal(board);
  }

  async patchFix(input: MiroFixPatchRequest): Promise<MiroFixPatchResponse> {
    const board = await getRequiredRunMiroBoard(input.runId);
    const provider = this.getProviderForBoard(board.board_id);
    const state = cloneState(board.state);
    const rankKey = String(input.rank);
    const existingFix = state.fixes[rankKey];
    if (!existingFix) {
      throw new Error(`No persisted fix mapping for rank ${input.rank}`);
    }

    const patch = normalizePatch(input.patch);
    const updatedAt = input.clientUpdatedAt || new Date().toISOString();
    state.fixes[rankKey] = applyPatchToFix({
      fix: existingFix,
      patch,
      updatedAt,
      source: "app",
    });

    await this.saveBoardRecord({
      runId: board.run_id,
      boardId: board.board_id,
      boardUrl: board.board_url,
      isFallback: board.is_fallback,
      state,
    });

    try {
      const patched = await provider.applyFixPatch({
        runId: board.run_id,
        boardId: board.board_id,
        state,
        rank: input.rank,
        patch,
        updatedAtIso: updatedAt,
      });
      state.fixes[rankKey] = {
        ...state.fixes[rankKey],
        status: patched.status,
        owner: patched.owner,
        notes: patched.notes,
        updatedAt: patched.updatedAt,
        source: "app",
      };
      await this.saveBoardRecord({
        runId: board.run_id,
        boardId: board.board_id,
        boardUrl: board.board_url,
        isFallback: board.is_fallback,
        state,
      });

      const snapshot = await this.syncInternal({
        ...board,
        state,
      });

      return {
        accepted: true,
        queued: false,
        snapshot,
      };
    } catch (error) {
      if (!isRetryableMiroError(error)) {
        throw error;
      }

      state.pendingOps.push(
        makePendingOp({
          rank: input.rank,
          patch,
          clientUpdatedAt: updatedAt,
        }),
      );
      await this.saveBoardRecord({
        runId: board.run_id,
        boardId: board.board_id,
        boardUrl: board.board_url,
        isFallback: board.is_fallback,
        state,
      });

      return {
        accepted: true,
        queued: true,
        snapshot: toSnapshot({
          boardId: board.board_id,
          state,
          warnings: [`Queued for retry: ${error instanceof Error ? error.message : String(error)}`],
          degraded: true,
          fallback: board.is_fallback,
        }),
      };
    }
  }

  createMarkdownFallback(input: MiroFixBoardRequest) {
    return toMarkdown({
      runId: input.runId,
      mode: input.mode,
      oneLineVerdict: input.oneLineVerdict,
      topFixes: input.topFixes,
      rewriteScript: input.rewriteScript,
    });
  }
}

export { RunMiroBoardNotFoundError };

export function getMiroService() {
  // Do not memoize across requests in dev: env/provider mode can change while server is running.
  return new MiroService();
}
