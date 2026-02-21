import type { MiroProvider } from "@/services/miro/miroProvider";
import type {
  MiroFixBoardRequest,
  MiroFixBoardResponse,
  MiroFixStatus,
  MiroSyncSnapshot,
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

export class MiroStubProvider implements MiroProvider {
  async createFixBoard(input: MiroFixBoardRequest): Promise<MiroFixBoardResponse> {
    const seed = hash(input.runId);
    const boardId = `stub-board-${seed}`;
    return {
      boardId,
      boardUrl: `https://miro.com/app/board/${boardId}/`,
      createdAt: new Date().toISOString(),
      fallback: true,
      message: "Using local stub provider. Add MIRO credentials for live API calls.",
    };
  }

  async syncFixBoard(input: { runId: string; boardId: string }): Promise<MiroSyncSnapshot> {
    const seed = hash(`${input.runId}:${input.boardId}`);
    const fixes = [1, 2, 3, 4, 5].map((rank) => ({
      rank,
      status: deterministicStatus(seed, rank),
      owner: rank % 2 ? "pm@pitchr.local" : "",
      notes: `Stub sync note for fix #${rank}`,
      lastUpdated: new Date(Date.now() - rank * 3600000).toISOString(),
      itemId: `stub-item-${seed}-${rank}`,
    }));

    return {
      boardId: input.boardId,
      syncedAt: new Date().toISOString(),
      fixes,
      warnings: ["Stub sync mode active. Configure MIRO_PROVIDER=rest for live sync."],
      fallback: true,
      message: "Stub sync response",
    };
  }
}

