import { NextResponse } from 'next/server';
import { getRunStats } from '@/services/runService';

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getRunStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 },
    );
  }
}
