import { NextResponse } from 'next/server';
import { expireQASessionIfTimedOut } from '@/services/qnaSessionService';
import type { GetQASessionResponse } from '@/types/qna';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    value,
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ qaSessionId: string }> },
): Promise<NextResponse> {
  const { qaSessionId } = await params;
  if (!isUuid(qaSessionId)) {
    return NextResponse.json({ error: 'qaSessionId must be a valid UUID.' }, { status: 400 });
  }

  try {
    const qaSession = await expireQASessionIfTimedOut(qaSessionId);
    if (!qaSession) {
      return NextResponse.json({ error: 'QA session not found.' }, { status: 404 });
    }
    const response: GetQASessionResponse = { qaSession };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch QA session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
