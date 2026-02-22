import type {
  MiroFixPatch,
  MiroFixBoardRequest,
  MiroProviderCreateResult,
  MiroProviderPatchResult,
  MiroProviderSyncResult,
  PersistedMiroBoardState,
} from "@/services/miro/miroTypes";

export interface MiroProvider {
  createFixBoard(input: MiroFixBoardRequest): Promise<MiroProviderCreateResult>;
  syncFixBoard(input: {
    runId: string;
    boardId: string;
    state: PersistedMiroBoardState;
  }): Promise<MiroProviderSyncResult>;
  applyFixPatch(input: {
    runId: string;
    boardId: string;
    state: PersistedMiroBoardState;
    rank: number;
    patch: MiroFixPatch;
    updatedAtIso: string;
  }): Promise<MiroProviderPatchResult>;
}
