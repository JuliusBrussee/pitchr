import { NextRequest, NextResponse } from 'next/server';
import { getRun, deleteRun } from '@/services/runService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    const run = await getRun(runId);
    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Run not found' },
      { status: 404 },
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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete run' },
      { status: 500 },
    );
  }
}
