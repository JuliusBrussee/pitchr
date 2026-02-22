import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MiroProvider } from "@/services/miro/miroProvider";
import { MiroService } from "@/services/miro/miroService";
import type {
  MiroFixBoardRequest,
  MiroProviderCreateResult,
  MiroProviderSyncResult,
  PersistedMiroBoardState,
} from "@/services/miro/miroTypes";

type StoredRecord = {
  run_id: string;
  board_id: string;
  board_url: string;
  is_fallback: boolean;
  state: PersistedMiroBoardState;
  created_at: string;
  updated_at: string;
};

const inMemoryStore = new Map<string, StoredRecord>();

vi.mock("@/services/miro/runMiroBoardService", () => {
  class RunMiroBoardNotFoundError extends Error {
    constructor(runId: string) {
      super(`Miro board not found for run: ${runId}`);
    }
  }

  return {
    RunMiroBoardNotFoundError,
    async getRunMiroBoard(runId: string) {
      return inMemoryStore.get(runId) ?? null;
    },
    async getRequiredRunMiroBoard(runId: string) {
      const row = inMemoryStore.get(runId);
      if (!row) throw new RunMiroBoardNotFoundError(runId);
      return row;
    },
    async upsertRunMiroBoard(input: {
      runId: string;
      boardId: string;
      boardUrl: string;
      isFallback?: boolean;
      state: PersistedMiroBoardState;
    }) {
      const existing = inMemoryStore.get(input.runId);
      const nowIso = new Date().toISOString();
      const record: StoredRecord = {
        run_id: input.runId,
        board_id: input.boardId,
        board_url: input.boardUrl,
        is_fallback: input.isFallback ?? false,
        state: input.state,
        created_at: existing?.created_at ?? nowIso,
        updated_at: nowIso,
      };
      inMemoryStore.set(input.runId, record);
      return record;
    },
  };
});

function makeState(status: "todo" | "doing" | "blocked" | "done" = "todo"): PersistedMiroBoardState {
  return {
    version: 1,
    layout: {
      overviewFrameId: "frame-overview",
      kanbanFrameId: "frame-kanban",
      rewriteFrameId: "frame-rewrite",
      columnIds: {
        todo: "col-todo",
        doing: "col-doing",
        blocked: "col-blocked",
        done: "col-done",
      },
    },
    fixes: {
      "1": {
        itemId: "item-1",
        status,
        owner: "",
        notes: "",
        updatedAt: "2026-02-22T10:00:00.000Z",
        source: "system",
      },
    },
    pendingOps: [],
    lastSyncedAt: "2026-02-22T10:00:00.000Z",
  };
}

function makeCreateResult(): MiroProviderCreateResult {
  const state = makeState("todo");
  return {
    boardId: "board-1",
    boardUrl: "https://miro.com/app/board/board-1/",
    createdAt: "2026-02-22T10:00:00.000Z",
    state,
    snapshot: {
      boardId: "board-1",
      syncedAt: state.lastSyncedAt,
      fixes: [
        {
          rank: 1,
          status: "todo",
          owner: undefined,
          notes: undefined,
          updatedAt: state.fixes["1"].updatedAt,
          itemId: state.fixes["1"].itemId,
          source: "system",
          conflict: false,
        },
      ],
      warnings: [],
      queuedOps: 0,
      degraded: false,
      conflicts: 0,
      version: 1,
    },
  };
}

function makeSyncResult(status: "todo" | "doing" | "blocked" | "done"): MiroProviderSyncResult {
  return {
    boardId: "board-1",
    syncedAt: "2026-02-22T10:01:00.000Z",
    fixes: [
      {
        rank: 1,
        itemId: "item-1",
        status,
        owner: "owner@pitchr.ai",
        notes: "From board",
        updatedAt: "2026-02-22T10:01:00.000Z",
        source: "miro",
      },
    ],
    warnings: [],
  };
}

function makeProvider(): {
  provider: MiroProvider;
  createFixBoard: ReturnType<typeof vi.fn>;
  syncFixBoard: ReturnType<typeof vi.fn>;
  applyFixPatch: ReturnType<typeof vi.fn>;
} {
  const createFixBoard = vi.fn(async () => makeCreateResult());
  const syncFixBoard = vi.fn(async () => makeSyncResult("todo"));
  const applyFixPatch = vi.fn(async () => ({
    rank: 1,
    itemId: "item-1",
    status: "doing" as const,
    owner: "app@pitchr.ai",
    notes: "local patch",
    updatedAt: "2026-02-22T10:00:10.000Z",
  }));

  const provider: MiroProvider = {
    createFixBoard,
    syncFixBoard,
    applyFixPatch,
  };

  return {
    provider,
    createFixBoard,
    syncFixBoard,
    applyFixPatch,
  };
}

const sampleRequest: MiroFixBoardRequest = {
  runId: "run_test_1",
  mode: "vc_pitch",
  oneLineVerdict: "Test verdict",
  rewriteScript: "Rewrite text",
  topFixes: [
    {
      rank: 1,
      category: "market",
      impact: "high",
      issue: "Missing TAM",
      fix: "Add market sizing",
    },
  ],
};

describe("miroService integration behaviors", () => {
  const dueTimestamp = new Date(Date.now() - 60_000).toISOString();

  beforeEach(() => {
    inMemoryStore.clear();
  });

  it("returns reused=false on first create and reused=true on second create", async () => {
    const mock = makeProvider();
    const service = new MiroService({ provider: mock.provider });

    const first = await service.createFixBoard(sampleRequest);
    expect(first.reused).toBe(false);
    expect(mock.createFixBoard).toHaveBeenCalledTimes(1);

    const second = await service.createFixBoard(sampleRequest);
    expect(second.reused).toBe(true);
    expect(mock.createFixBoard).toHaveBeenCalledTimes(1);
    expect(mock.syncFixBoard).toHaveBeenCalled();
  });

  it("queues patch when provider returns retryable 429", async () => {
    const mock = makeProvider();
    mock.applyFixPatch.mockImplementation(async () => {
      throw new Error("Miro API 429 on /boards/board-1/items/item-1: rate limited");
    });

    const service = new MiroService({ provider: mock.provider });
    await service.createFixBoard(sampleRequest);

    const result = await service.patchFix({
      runId: sampleRequest.runId,
      rank: 1,
      patch: {
        status: "doing",
        owner: "owner@pitchr.ai",
        notes: "queued",
      },
      clientUpdatedAt: dueTimestamp,
    });

    expect(result.accepted).toBe(true);
    expect(result.queued).toBe(true);
    expect(result.snapshot.queuedOps).toBeGreaterThan(0);
  });

  it("drains queued ops when provider recovers on sync", async () => {
    const mock = makeProvider();
    let shouldFail = true;
    mock.applyFixPatch.mockImplementation(async () => {
      if (shouldFail) {
        throw new Error("Miro API 429 on /boards/board-1/items/item-1: rate limited");
      }
      return {
        rank: 1,
        itemId: "item-1",
        status: "doing" as const,
        owner: "owner@pitchr.ai",
        notes: "applied",
        updatedAt: "2026-02-22T10:00:30.000Z",
      };
    });
    mock.syncFixBoard.mockImplementation(async () => makeSyncResult("doing"));

    const service = new MiroService({ provider: mock.provider });
    await service.createFixBoard(sampleRequest);

    const queued = await service.patchFix({
      runId: sampleRequest.runId,
      rank: 1,
      patch: {
        status: "doing",
        owner: "owner@pitchr.ai",
        notes: "queue first",
      },
      clientUpdatedAt: dueTimestamp,
    });
    expect(queued.queued).toBe(true);

    shouldFail = false;
    const snapshot = await service.syncFixBoard({ runId: sampleRequest.runId });
    expect(snapshot.queuedOps).toBe(0);
    expect(snapshot.fixes[0]?.status).toBe("doing");
  });
});
