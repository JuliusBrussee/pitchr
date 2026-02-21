import { NextRequest, NextResponse } from 'next/server';
import {
  PitchValidationError,
  runPitchAnalysisController,
} from '@/controllers/pitchController';
import { listRuns } from '@/services/runService';
import type { CreatePitchRunErrorResponse } from '@/types/pitch';
import type { PitchMode } from '@/types/pitch';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('mode') as PitchMode | null;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const runs = await listRuns({
      mode: mode ?? undefined,
      limit: limit && !isNaN(limit) ? limit : undefined,
    });
    return NextResponse.json(runs);
  } catch (error) {
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
    const response: CreatePitchRunErrorResponse = {
      error: 'Invalid JSON body',
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const result = await runPitchAnalysisController(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PitchValidationError) {
      const response: CreatePitchRunErrorResponse = { error: error.message };
      return NextResponse.json(response, { status: 400 });
    }

    const response: CreatePitchRunErrorResponse = {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to analyze pitch.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
