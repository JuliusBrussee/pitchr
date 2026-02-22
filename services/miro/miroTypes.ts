export type MiroFixStatus = "todo" | "doing" | "done" | "blocked";
export type MiroFixSource = "app" | "miro" | "system";
export type MiroBoardContentProvider = "openrouter" | "anthropic" | "template";

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
  transcript?: string;
  boardNamePrefix?: string;
  recreate?: boolean;
}

export interface MiroGeneratedFixCard {
  rank: number;
  category: string;
  impact: string;
  issue: string;
  action: string;
  status: MiroFixStatus;
  owner: string;
  notes: string;
  nextStep: string;
  successMetric: string;
  blocker: string;
}

export interface MiroGeneratedBoardCopy {
  overviewCardHtml: string;
  rewriteCardText: string;
  columnGuides: Record<MiroFixStatus, string>;
  fixCards: MiroGeneratedFixCard[];
}

export interface MiroGeneratedBoardMeta {
  providerUsed: MiroBoardContentProvider;
  fallbackUsed: boolean;
  message: string;
}

export interface MiroProviderCreateInput extends MiroFixBoardRequest {
  generated: MiroGeneratedBoardCopy;
  generatedMeta?: MiroGeneratedBoardMeta;
}

export interface MiroFixPatch {
  status?: MiroFixStatus;
  owner?: string;
  notes?: string;
}

export interface MiroFixPatchRequest {
  runId: string;
  rank: number;
  patch: MiroFixPatch;
  clientUpdatedAt: string;
}

export interface MiroFixLayoutColumnIds {
  todo: string;
  doing: string;
  blocked: string;
  done: string;
}

export interface MiroBoardLayoutState {
  overviewFrameId: string;
  kanbanFrameId: string;
  rewriteFrameId: string;
  columnIds: MiroFixLayoutColumnIds;
}

export interface PersistedMiroFixState {
  itemId: string;
  status: MiroFixStatus;
  owner: string;
  notes: string;
  updatedAt: string;
  source: MiroFixSource;
  x?: number;
  y?: number;
}

export interface PersistedMiroPendingOp {
  opId: string;
  rank: number;
  patch: MiroFixPatch;
  clientUpdatedAt: string;
  attempts: number;
  nextRetryAt: string;
  lastError: string;
}

export interface PersistedMiroBoardState {
  version: number;
  layout: MiroBoardLayoutState;
  fixes: Record<string, PersistedMiroFixState>;
  pendingOps: PersistedMiroPendingOp[];
  lastSyncedAt: string;
}

export interface MiroSyncedFix {
  rank: number;
  status: MiroFixStatus;
  owner?: string;
  notes?: string;
  updatedAt?: string;
  itemId?: string;
  source: MiroFixSource;
  conflict?: boolean;
}

export interface MiroSyncSnapshot {
  boardId: string;
  syncedAt: string;
  fixes: MiroSyncedFix[];
  warnings: string[];
  queuedOps: number;
  degraded: boolean;
  conflicts: number;
  version: number;
  fallback?: boolean;
  message?: string;
}

export interface MiroFixBoardResponse {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  reused: boolean;
  snapshot: MiroSyncSnapshot;
  fallback?: boolean;
  message?: string;
}

export interface MiroGetFixBoardResponse {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  snapshot: MiroSyncSnapshot;
  fallback?: boolean;
  message?: string;
}

export interface MiroFixPatchResponse {
  accepted: true;
  queued: boolean;
  snapshot: MiroSyncSnapshot;
}

export interface MiroProviderCreateResult {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  state: PersistedMiroBoardState;
  snapshot: MiroSyncSnapshot;
  fallback?: boolean;
  message?: string;
}

export interface MiroProviderSyncedFix {
  rank: number;
  itemId: string;
  status: MiroFixStatus;
  owner: string;
  notes: string;
  updatedAt: string;
  source: "miro";
  x?: number;
  y?: number;
}

export interface MiroProviderSyncResult {
  boardId: string;
  syncedAt: string;
  fixes: MiroProviderSyncedFix[];
  warnings: string[];
  fallback?: boolean;
  message?: string;
}

export interface MiroProviderPatchResult {
  rank: number;
  itemId: string;
  status: MiroFixStatus;
  owner: string;
  notes: string;
  updatedAt: string;
}
