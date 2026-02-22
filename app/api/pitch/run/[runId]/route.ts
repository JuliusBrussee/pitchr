import { NextRequest, NextResponse } from 'next/server';
import { listQASessionSummariesByRunIds } from '@/services/qnaSessionService';
import { deleteRun, getRun, RunNotFoundError } from '@/services/runService';
import { deleteRecordingByUrl } from '@/services/recordingService';
import type { Run } from '@/types/pitch';

function toRunResponse(
  run: Awaited<ReturnType<typeof getRun>>,
  qaSessionsSummary?: Run['qaSessionsSummary'],
): Run {
  const isComplete = run.status === 'complete';
  return {
    id: run.id,
    createdAt: run.created_at,
    startedAt: run.started_at ?? undefined,
    completedAt: run.completed_at ?? undefined,
    mode: run.mode,
    status: run.status,
    error: run.error_message ?? undefined,
    inputType: run.input_type,
    transcript: run.transcript,
    audioUrl: run.audio_url ?? undefined,
    deckId: run.deck_id ?? undefined,
    analysis: isComplete ? run.analysis.outputs.feedback : undefined,
    analysisVersion: isComplete ? run.analysis.analysisVersion : undefined,
    coverage: isComplete ? run.analysis.coverage : undefined,
    outputs: isComplete ? run.analysis.outputs : undefined,
    meta: isComplete ? run.analysis.meta : run.meta ?? undefined,
    qaSessionsSummary,
    overallScore: run.overall_score,
    fallback: run.is_fallback,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    const run = await getRun(runId);
    let qaSessionsSummary: Run['qaSessionsSummary'];
    try {
      const summaryMap = await listQASessionSummariesByRunIds([run.id]);
      qaSessionsSummary = summaryMap.get(run.id);
    } catch {
      qaSessionsSummary = undefined;
    }
    return NextResponse.json({ run: toRunResponse(run, qaSessionsSummary) }, { status: 200 });
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch run' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    // Clean up recording file (best-effort, don't fail the delete if this errors)
    try {
      const run = await getRun(runId);
      if (run.audio_url) {
        await deleteRecordingByUrl(run.audio_url);
      }
    } catch {
      // Recording may not exist or run fetch may fail — proceed with deletion
    }
    await deleteRun(runId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete run' },
      { status: 500 },
    );
  }
}
