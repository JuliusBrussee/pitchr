import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import {
  evaluateRealtimeChecklist,
} from '@/services/realtimeChecklistService';
import type { RealtimeChecklistSchedulerState } from '@/services/realtimeChecklistService';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';

interface ChecklistRequestBody {
  mode: PitchMode;
  transcript: string;
  previousItems: RealtimeChecklistItemState[];
  scheduler: RealtimeChecklistSchedulerState;
  sessionStartedAtMs: number;
  force?: boolean;
}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch' || value === 'hackathon' || value === 'final_year';
}

export async function POST(request: Request) {
  try {
    await getAuthenticatedUser();
  } catch (e) {
    if (e instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }

  let body: ChecklistRequestBody;
  try {
    body = (await request.json()) as ChecklistRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isPitchMode(body.mode)) {
    return NextResponse.json({ error: 'Invalid pitch mode' }, { status: 400 });
  }
  if (typeof body.transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  try {
    const result = await evaluateRealtimeChecklist({
      mode: body.mode,
      transcript: body.transcript,
      previousItems: body.previousItems ?? [],
      scheduler: body.scheduler ?? { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
      sessionStartedAtMs: body.sessionStartedAtMs ?? Date.now(),
      force: body.force,
    });

    if (!result) {
      return NextResponse.json({ skipped: true });
    }

    return NextResponse.json({
      message: result.message,
      items: result.items,
      scheduler: result.scheduler,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Checklist evaluation failed' },
      { status: 500 },
    );
  }
}
