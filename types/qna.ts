export type QASessionStatus =
  | 'created'
  | 'active'
  | 'completed'
  | 'expired'
  | 'failed';

export type QATurnSpeaker = 'investor' | 'founder' | 'system';

export interface QATurn {
  id: string;
  speaker: QATurnSpeaker;
  text: string;
  start_sec?: number;
  end_sec?: number;
  latency_ms?: number;
  created_at: string;
}

export interface QASessionEvaluation {
  overall_score?: number;
  strengths: string[];
  improvements: string[];
  notes?: string;
}

export interface QASession {
  id: string;
  runId: string;
  status: QASessionStatus;
  conversationId?: string;
  startedAt: string;
  completedAt?: string;
  durationLimitSeconds: number;
  durationSeconds?: number;
  turns: QATurn[];
  transcript?: string;
  evaluation?: QASessionEvaluation;
  meta?: Record<string, unknown>;
}

export interface QASessionSummary {
  qaSessionId: string;
  status: QASessionStatus;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface CreateQASessionRequest {
  runId: string;
  selectedDurationSeconds?: number;
}

export interface CreateQASessionResponse {
  qaSessionId: string;
  signedUrl: string;
  conversationId?: string;
  durationLimitSeconds: number;
  starterContext: string;
  qaBudget: {
    budgetSeconds: number | null;
    usedSeconds: number;
    remainingSeconds: number | null;
    maxSessionSeconds: number;
    gracePeriodSeconds: number;
  };
}

export interface GetQASessionResponse {
  qaSession: QASession;
}

export interface CompleteQASessionRequest {
  status?: Extract<QASessionStatus, 'completed' | 'expired' | 'failed'>;
  conversationId?: string;
  durationSeconds?: number;
  turns?: QATurn[];
  transcript?: string;
  evaluation?: QASessionEvaluation;
  meta?: Record<string, unknown>;
}

export interface CompleteQASessionResponse {
  qaSession: QASession;
}

export interface RefreshKnowledgeResourcesRequest {
  limit?: number;
}

export interface RefreshKnowledgeResourcesResponse {
  processed: number;
  queued: number;
  failed: number;
}
