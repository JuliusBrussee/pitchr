import { createAdminClient } from '@/lib/supabase/admin';
import { analyzePitch } from '@/services/analysisService';
import { buildRunEconomics } from '@/services/economicsService';
import { recordUsage } from '@/services/billingService';
import { listRuns, updateRun } from '@/services/runService';
import type { PitchStage, TranscriptSegment } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface QueuePayload {
  runId: string;
  userId?: string;
  mode: PitchMode;
  transcript: string;
  deckId?: string;
  deckText?: string;
  transcriptSegments?: TranscriptSegment[];
  stage?: PitchStage;
  regenerate?: 'feedback' | 'qa_1min';
}

const inFlightJobs = new Map<string, Promise<void>>();

async function processRun(payload: QueuePayload): Promise<void> {
  const supabase = createAdminClient();
  await updateRun(supabase, payload.runId, {
    status: 'running',
    started_at: new Date().toISOString(),
    error_message: null,
  });

  const startedAt = Date.now();

  try {
    const { analysis, fallback } = await analyzePitch({
      supabase,
      runId: payload.runId,
      transcript: payload.transcript,
      mode: payload.mode,
      deckId: payload.deckId,
      deckText: payload.deckText,
      transcriptSegments: payload.transcriptSegments,
      stage: payload.stage,
      regenerate: payload.regenerate,
    });

    const mergedAnalysis = {
      ...analysis,
      meta: {
        ...analysis.meta,
        latency_ms: analysis.meta.latency_ms || Date.now() - startedAt,
      },
    };
    const overallScore = mergedAnalysis.outputs.feedback.overall_score;
    let previousModeScore: number | undefined;

    try {
      const historicalRuns = await listRuns(supabase, { mode: payload.mode });
      const previousCompleted = historicalRuns.find(
        (run) => run.status === 'complete' && run.id !== payload.runId,
      );
      previousModeScore = previousCompleted?.overall_score;
    } catch {
      previousModeScore = undefined;
    }

    const economics = buildRunEconomics({
      transcript: payload.transcript,
      deckText: payload.deckText,
      mode: payload.mode,
      outputs: mergedAnalysis.outputs,
      providerUsed: mergedAnalysis.meta.provider_used,
      overallScore,
      previousModeScore,
      agentRuntimeMs: mergedAnalysis.meta.latency_ms,
    });

    const analysisWithEconomics = {
      ...mergedAnalysis,
      meta: {
        ...mergedAnalysis.meta,
        economics,
      },
    };

    await updateRun(supabase, payload.runId, {
      status: 'complete',
      completed_at: new Date().toISOString(),
      overall_score: overallScore,
      analysis: analysisWithEconomics,
      meta: analysisWithEconomics.meta,
      is_fallback: fallback,
      error_message: null,
    });

    // Record usage for billing
    try {
      if (payload.userId) {
        await recordUsage(supabase, payload.userId, 'run');
      }
    } catch (usageError) {
      console.error('[billing] failed to record usage', {
        runId: payload.runId,
        message:
          usageError instanceof Error
            ? usageError.message
            : String(usageError),
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Pitch analysis job failed.';
    await updateRun(supabase, payload.runId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: message,
      meta: {
        provider_used: 'none',
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 0,
        latency_ms: Date.now() - startedAt,
        attempt_count: 0,
        error_details: {
          message,
          timeout: message.toLowerCase().includes('timed out'),
        },
      },
    });
  }
}

export function enqueuePitchRun(payload: QueuePayload): void {
  if (inFlightJobs.has(payload.runId)) return;

  const job = processRun(payload).finally(() => {
    inFlightJobs.delete(payload.runId);
  });

  inFlightJobs.set(payload.runId, job);
}
