import { analyzePitch } from '@/services/analysisService';
import { buildRunEconomics } from '@/services/economicsService';
import { syncRunToPaid } from '@/services/paidService';
import { listRuns, updateRun } from '@/services/runService';
import type { PitchStage } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface QueuePayload {
  runId: string;
  mode: PitchMode;
  transcript: string;
  deckText?: string;
  stage?: PitchStage;
  regenerate?: 'feedback' | 'qa_1min';
}

const inFlightJobs = new Map<string, Promise<void>>();

async function processRun(payload: QueuePayload): Promise<void> {
  await updateRun(payload.runId, {
    status: 'running',
    started_at: new Date().toISOString(),
    error_message: null,
  });

  const startedAt = Date.now();

  try {
    const { analysis, fallback } = await analyzePitch({
      transcript: payload.transcript,
      mode: payload.mode,
      deckText: payload.deckText,
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
      const historicalRuns = await listRuns({ mode: payload.mode });
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

    await updateRun(payload.runId, {
      status: 'complete',
      completed_at: new Date().toISOString(),
      overall_score: overallScore,
      analysis: analysisWithEconomics,
      meta: analysisWithEconomics.meta,
      is_fallback: fallback,
      error_message: null,
    });

    try {
      const paidSync = await syncRunToPaid({
        runId: payload.runId,
        mode: payload.mode,
        overallScore,
        latencyMs: analysisWithEconomics.meta.latency_ms,
        fallbackUsed: fallback,
        economics,
      });

      const finalAnalysis = {
        ...analysisWithEconomics,
        meta: {
          ...analysisWithEconomics.meta,
          economics: {
            ...economics,
            paid_sync: paidSync,
          },
        },
      };

      await updateRun(payload.runId, {
        analysis: finalAnalysis,
        meta: finalAnalysis.meta,
      });
    } catch (paidSyncError) {
      console.error('[paid-sync] failed to persist Paid sync status', {
        runId: payload.runId,
        message:
          paidSyncError instanceof Error
            ? paidSyncError.message
            : String(paidSyncError),
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Pitch analysis job failed.';
    await updateRun(payload.runId, {
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
