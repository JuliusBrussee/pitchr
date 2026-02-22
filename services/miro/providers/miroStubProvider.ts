import type { MiroProvider } from "@/services/miro/miroProvider";
import type {
  MiroFixPatch,
  MiroFixStatus,
  MiroProviderCreateInput,
  MiroProviderCreateResult,
  MiroProviderPatchResult,
  MiroProviderSyncResult,
  PersistedMiroBoardState,
} from "@/services/miro/miroTypes";

function hash(value: string) {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) {
    out = (out << 5) - out + value.charCodeAt(i);
    out |= 0;
  }
  return Math.abs(out);
}

function deterministicStatus(seed: number, rank: number): MiroFixStatus {
  const statuses: MiroFixStatus[] = ["todo", "doing", "done", "blocked"];
  return statuses[(seed + rank) % statuses.length];
}

function emptyState(nowIso: string): PersistedMiroBoardState {
  return {
    version: 1,
    layout: {
      overviewFrameId: "stub-overview",
      kanbanFrameId: "stub-kanban",
      rewriteFrameId: "stub-rewrite",
      columnIds: {
        todo: "stub-col-todo",
        doing: "stub-col-doing",
        blocked: "stub-col-blocked",
        done: "stub-col-done",
      },
    },
    fixes: {},
    pendingOps: [],
    lastSyncedAt: nowIso,
  };
}

export class MiroStubProvider implements MiroProvider {
  async createFixBoard(input: MiroProviderCreateInput): Promise<MiroProviderCreateResult> {
    const nowIso = new Date().toISOString();
    const seed = hash(input.runId);
    const boardId = `stub-board-${seed}`;
    const state = emptyState(nowIso);

    for (const fix of input.topFixes.slice(0, 5)) {
      state.fixes[String(fix.rank)] = {
        itemId: `stub-item-${seed}-${fix.rank}`,
        status: "todo",
        owner: "",
        notes: "",
        updatedAt: nowIso,
        source: "system",
      };
    }

    return {
      boardId,
      boardUrl: `https://miro.com/app/board/${boardId}/`,
      createdAt: nowIso,
      state,
      snapshot: {
        boardId,
        syncedAt: nowIso,
        fixes: Object.entries(state.fixes)
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
          .sort((a, b) => a.rank - b.rank),
        warnings: ["Stub mode active. Configure MIRO_PROVIDER=rest for live boards."],
        queuedOps: 0,
        degraded: false,
        conflicts: 0,
        version: state.version,
        fallback: true,
        message: "Stub board created.",
      },
      fallback: true,
      message: "Using local stub provider. Add MIRO credentials for live API calls.",
    };
  }

  async syncFixBoard(input: {
    runId: string;
    boardId: string;
    state: PersistedMiroBoardState;
  }): Promise<MiroProviderSyncResult> {
    const seed = hash(`${input.runId}:${input.boardId}`);
    const nowIso = new Date().toISOString();
    const fixes = Object.entries(input.state.fixes).map(([rankKey, fix]) => {
      const rank = Number.parseInt(rankKey, 10);
      return {
        rank,
        itemId: fix.itemId,
        status: deterministicStatus(seed, rank),
        owner: rank % 2 ? "pm@pitchr.local" : "",
        notes: `Stub sync note for fix #${rank}`,
        updatedAt: new Date(Date.now() - rank * 3600000).toISOString(),
        source: "miro" as const,
      };
    });

    return {
      boardId: input.boardId,
      syncedAt: nowIso,
      fixes: fixes.sort((a, b) => a.rank - b.rank),
      warnings: ["Stub sync mode active. Configure MIRO_PROVIDER=rest for live sync."],
      fallback: true,
      message: "Stub sync response",
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
    const stored = input.state.fixes[rankKey];
    if (!stored) {
      throw new Error(`No stub fix mapped for rank ${input.rank}`);
    }
    return {
      rank: input.rank,
      itemId: stored.itemId,
      status: input.patch.status ?? stored.status,
      owner: input.patch.owner ?? stored.owner,
      notes: input.patch.notes ?? stored.notes,
      updatedAt: input.updatedAtIso,
    };
  }
}
