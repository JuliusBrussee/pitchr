export type MiroFixStatus = "todo" | "doing" | "done" | "blocked";

export interface MiroTopFixInput {
  rank: number;
  category: string;
  impact: string;
  issue: string;
  fix: string;
}

export interface MiroFixBoardRequest {
  runId: string;
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
  boardNamePrefix?: string;
}

export interface MiroFixBoardResponse {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  fallback?: boolean;
  message?: string;
}

export interface MiroSyncedFix {
  rank: number;
  status: MiroFixStatus;
  owner?: string;
  notes?: string;
  lastUpdated?: string;
  itemId?: string;
}

export interface MiroSyncSnapshot {
  boardId: string;
  syncedAt: string;
  fixes: MiroSyncedFix[];
  warnings: string[];
  fallback?: boolean;
  message?: string;
}

