import { NextRequest, NextResponse } from 'next/server';
import {
  PitchValidationError,
  runPitchAnalysisController,
} from '@/controllers/pitchController';
import type { CreatePitchRunErrorResponse } from '@/types/pitch';

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
