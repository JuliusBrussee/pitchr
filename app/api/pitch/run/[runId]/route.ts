import { NextRequest, NextResponse } from 'next/server';
import { deleteRun, getRun, RunNotFoundError } from '@/services/runService';
import type { Run } from '@/types/pitch';

function toRunResponse(run: Awaited<ReturnType<typeof getRun>>): Run {
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
    analysis: isComplete ? run.analysis.outputs.feedback : undefined,
    analysisVersion: isComplete ? run.analysis.analysisVersion : undefined,
    coverage: isComplete ? run.analysis.coverage : undefined,
    outputs: isComplete ? run.analysis.outputs : undefined,
    meta: isComplete ? run.analysis.meta : run.meta ?? undefined,
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
    return NextResponse.json({ run: toRunResponse(run) }, { status: 200 });
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
