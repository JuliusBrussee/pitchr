import { NextRequest, NextResponse } from 'next/server';
import { processQueuedResourceRefresh } from '@/services/qna/resourceRefreshService';
import type {
  RefreshKnowledgeResourcesRequest,
  RefreshKnowledgeResourcesResponse,
} from '@/types/qna';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload = body as RefreshKnowledgeResourcesRequest;
  const limit =
    typeof payload.limit === 'number' && Number.isFinite(payload.limit) && payload.limit > 0
      ? Math.min(20, Math.round(payload.limit))
      : 5;

  try {
    const result = await processQueuedResourceRefresh(limit);
    const response: RefreshKnowledgeResourcesResponse = {
      processed: result.processed,
      queued: result.queued,
      failed: result.failed,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to refresh resources.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
