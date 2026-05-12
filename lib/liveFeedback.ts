import type {
  ChecklistItemId,
  ChecklistStatus,
  RealtimeChecklistItemState,
} from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';

export interface LiveMetricSnapshot {
  wpm: number;
  fillerWords: number;
  wordCount: number;
  durationSecs: number;
  fillerRate: number;
}

export type LiveRubricCategory =
  | 'structure'
  | 'clarity'
  | 'evidence'
  | 'market'
  | 'delivery';

export interface LiveRubricCategoryScore {
  category: LiveRubricCategory;
  score20: number;
}

export interface LiveBeatProgressItem {
  id: ChecklistItemId;
  label: string;
  status: ChecklistStatus;
  required: boolean;
}

export interface LiveBeatProgress {
  beats: LiveBeatProgressItem[];
  completed: number;
  total: number;
  nextBeatId: ChecklistItemId | null;
}

export interface ComputeLiveSessionFeedbackInput {
  mode: PitchMode;
  checklist: RealtimeChecklistItemState[];
  metrics: LiveMetricSnapshot;
  targetDurationSeconds: number;
  targetWpm: number;
}

export interface LiveSessionFeedback {
  liveRubric: LiveRubricCategoryScore[];
  beatProgress: LiveBeatProgress;
}

const ELEVATOR_BEAT_ORDER: ChecklistItemId[] = [
  'intro_hook',
  'problem_statement',
  'solution_overview',
  'ask',
];

const VC_BEAT_ORDER: ChecklistItemId[] = [
  'intro_hook',
  'problem_statement',
  'solution_overview',
  'market_opportunity',
  'business_model',
  'traction_metrics',
  'team',
  'ask',
];

const STATUS_TO_SCORE: Record<ChecklistStatus, number> = {
  completed: 1,
  partial: 0.55,
  uncovered: 0,
  failed: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const HACKATHON_BEAT_ORDER: ChecklistItemId[] = [
  'intro_hook',
  'problem_statement',
  'solution_overview',
  'market_opportunity',
  'traction_metrics',
  'ask',
];

const FINAL_YEAR_BEAT_ORDER: ChecklistItemId[] = [
  'intro_hook',
  'problem_statement',
  'solution_overview',
  'traction_metrics',
  'market_opportunity',
  'ask',
];

function getBeatOrder(mode: PitchMode): ChecklistItemId[] {
  switch (mode) {
    case 'elevator': return ELEVATOR_BEAT_ORDER;
    case 'hackathon': return HACKATHON_BEAT_ORDER;
    case 'final_year': return FINAL_YEAR_BEAT_ORDER;
    default: return VC_BEAT_ORDER;
  }
}

function statusScore(status: ChecklistStatus | undefined): number {
  if (!status) return 0;
  return STATUS_TO_SCORE[status] ?? 0;
}

function weightedScore(
  statusById: Map<ChecklistItemId, ChecklistStatus>,
  weights: Array<{ id: ChecklistItemId; weight: number }>,
): number {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;

  const weightedSum = weights.reduce((sum, item) => {
    const score = statusScore(statusById.get(item.id));
    return sum + score * item.weight;
  }, 0);

  return weightedSum / totalWeight;
}

function score20(normalized: number): number {
  return clamp(Math.round(normalized * 20), 0, 20);
}

function computeDeliveryNormalized(params: {
  metrics: LiveMetricSnapshot;
  targetDurationSeconds: number;
  targetWpm: number;
}): number {
  const { metrics, targetDurationSeconds, targetWpm } = params;
  const safeTargetWpm = Math.max(targetWpm, 1);
  const wpm = metrics.wpm;
  const wpmDeltaRatio = Math.abs(wpm - safeTargetWpm) / safeTargetWpm;
  const wpmSub =
    wpmDeltaRatio <= 0.15 ? 1 : wpmDeltaRatio <= 0.3 ? 0.6 : 0.25;

  const fillerRate = metrics.fillerRate;
  const fillerSub =
    fillerRate <= 2 ? 1 : fillerRate <= 4 ? 0.7 : fillerRate <= 6 ? 0.4 : 0.15;

  const elapsedRatio =
    targetDurationSeconds > 0
      ? metrics.durationSecs / targetDurationSeconds
      : 0;
  const timeSub = elapsedRatio <= 1 ? 1 : elapsedRatio <= 1.15 ? 0.6 : 0.25;

  return 0.5 * wpmSub + 0.35 * fillerSub + 0.15 * timeSub;
}

export function computeLiveSessionFeedback(
  input: ComputeLiveSessionFeedbackInput,
): LiveSessionFeedback {
  const beatOrder = getBeatOrder(input.mode);
  const checklistMap = new Map<ChecklistItemId, RealtimeChecklistItemState>(
    input.checklist.map((item) => [item.id, item]),
  );
  const statusById = new Map<ChecklistItemId, ChecklistStatus>(
    input.checklist.map((item) => [item.id, item.status]),
  );

  const beats: LiveBeatProgressItem[] = beatOrder.map((id) => {
    const item = checklistMap.get(id);
    return {
      id,
      label: item?.label ?? id,
      status: item?.status ?? 'uncovered',
      required: item?.required ?? true,
    };
  });

  const completed = beats.filter((beat) => beat.status === 'completed').length;
  const total = beats.length;
  const nextBeat =
    beats.find((beat) => beat.status !== 'completed') ?? null;

  const structure = score20(
    weightedScore(statusById, [
      { id: 'intro_hook', weight: 0.2 },
      { id: 'problem_statement', weight: 0.25 },
      { id: 'solution_overview', weight: 0.25 },
      { id: 'ask', weight: 0.3 },
    ]),
  );

  const clarity = score20(
    weightedScore(statusById, [
      { id: 'intro_hook', weight: 1 / 3 },
      { id: 'problem_statement', weight: 1 / 3 },
      { id: 'solution_overview', weight: 1 / 3 },
    ]),
  );

  const evidence = score20(
    input.mode === 'elevator'
      ? 0
      : weightedScore(statusById, [
          { id: 'traction_metrics', weight: 0.7 },
          { id: 'business_model', weight: 0.3 },
        ]),
  );

  const market = score20(
    weightedScore(statusById, [
      { id: 'market_opportunity', weight: 0.7 },
      { id: 'ask', weight: 0.3 },
    ]),
  );

  const delivery = score20(
    computeDeliveryNormalized({
      metrics: input.metrics,
      targetDurationSeconds: input.targetDurationSeconds,
      targetWpm: input.targetWpm,
    }),
  );

  return {
    liveRubric: [
      { category: 'structure', score20: structure },
      { category: 'clarity', score20: clarity },
      { category: 'evidence', score20: evidence },
      { category: 'market', score20: market },
      { category: 'delivery', score20: delivery },
    ],
    beatProgress: {
      beats,
      completed,
      total,
      nextBeatId: nextBeat?.id ?? null,
    },
  };
}
