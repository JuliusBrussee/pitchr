import type {
  MiroFixBoardRequest,
  MiroFixBoardResponse,
  MiroSyncSnapshot,
} from "@/services/miro/miroTypes";

export interface MiroProvider {
  createFixBoard(input: MiroFixBoardRequest): Promise<MiroFixBoardResponse>;
  syncFixBoard(input: { runId: string; boardId: string }): Promise<MiroSyncSnapshot>;
}

