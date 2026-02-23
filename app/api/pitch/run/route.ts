import { NextRequest, NextResponse } from 'next/server';
import {
  PitchValidationError,
  runPitchAnalysisController,
} from '@/controllers/pitchController';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import { listQASessionSummariesByRunIds } from '@/services/qnaSessionService';
import { computeRunStats, listRuns } from '@/services/runService';
import type {
  CreatePitchRunErrorResponse,
  ListPitchRunsResponse,
  Run,
} from '@/types/pitch';

function toRunResponse(
  run: Awaited<ReturnType<typeof listRuns>>[number],
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { supabase } = await getAuthenticatedUser();
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('mode');
    const limitParam = searchParams.get('limit');
    const includePending = searchParams.get('includePending') === 'true';
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const parsedMode = mode === 'elevator' || mode === 'vc_pitch' ? mode : undefined;

    const allRuns = await listRuns(supabase, { mode: parsedMode });
    const visibleRuns = includePending
      ? allRuns
      : allRuns.filter((run) => run.status === 'complete');
    const runs =
      Number.isFinite(limit) && limit !== undefined
        ? visibleRuns.slice(0, limit)
        : visibleRuns;
    let qaSummariesByRunId = new Map<string, NonNullable<Run['qaSessionsSummary']>>();
    try {
      qaSummariesByRunId = await listQASessionSummariesByRunIds(supabase, runs.map((run) => run.id));
    } catch {
      qaSummariesByRunId = new Map();
    }

    const response: ListPitchRunsResponse = {
      runs: runs.map((run) => toRunResponse(run, qaSummariesByRunId.get(run.id))),
      stats: computeRunStats(visibleRuns),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list runs' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const response: CreatePitchRunErrorResponse = { error: 'Invalid JSON body' };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const result = await runPitchAnalysisController(supabase, user.id, body);
    const statusCode = result.status === 'complete' ? 201 : 202;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof PitchValidationError) {
      const response: CreatePitchRunErrorResponse = { error: error.message };
      return NextResponse.json(response, { status: 400 });
    }

    const response: CreatePitchRunErrorResponse = {
      error: error instanceof Error ? error.message : 'Failed to analyze pitch.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
