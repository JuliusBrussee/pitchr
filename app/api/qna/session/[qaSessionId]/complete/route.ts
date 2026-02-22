import { NextRequest, NextResponse } from 'next/server';
import { getConversation } from '@/lib/elevenlabs/convai';
import {
  completeQASession,
  getQASession,
} from '@/services/qnaSessionService';
import type {
  CompleteQASessionRequest,
  CompleteQASessionResponse,
  QATurn,
} from '@/types/qna';

const QA_DURATION_LIMIT_SECONDS = 60;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    value,
  );
}

function normalizeTurns(value: unknown): QATurn[] {
  if (!Array.isArray(value)) return [];
  const turns: QATurn[] = [];
  value.forEach((turn, index) => {
    if (!turn || typeof turn !== 'object') return;
    const row = turn as Record<string, unknown>;
    const text = typeof row.text === 'string' ? row.text.trim() : '';
    if (!text) return;
    const speaker: QATurn['speaker'] =
      row.speaker === 'investor' || row.speaker === 'founder' || row.speaker === 'system'
        ? row.speaker
        : 'system';
    turns.push({
      id: String(row.id ?? `turn-${index + 1}`),
      speaker,
      text,
      start_sec:
        typeof row.start_sec === 'number' && Number.isFinite(row.start_sec)
          ? row.start_sec
          : undefined,
      end_sec:
        typeof row.end_sec === 'number' && Number.isFinite(row.end_sec)
          ? row.end_sec
          : undefined,
      latency_ms:
        typeof row.latency_ms === 'number' && Number.isFinite(row.latency_ms)
          ? row.latency_ms
          : undefined,
      created_at:
        typeof row.created_at === 'string' && row.created_at
          ? row.created_at
          : new Date().toISOString(),
    });
  });
  return turns;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ qaSessionId: string }> },
): Promise<NextResponse> {
  const { qaSessionId } = await params;
  if (!isUuid(qaSessionId)) {
    return NextResponse.json({ error: 'qaSessionId must be a valid UUID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const payload = body as CompleteQASessionRequest;

  try {
    const session = await getQASession(qaSessionId);
    if (!session) {
      return NextResponse.json({ error: 'QA session not found.' }, { status: 404 });
    }

    const conversationId = payload.conversationId ?? session.conversationId;
    let transcript = payload.transcript;
    let turns = payload.turns ?? [];
    let conversationMeta: Record<string, unknown> = {};

    if (conversationId && (!transcript || turns.length === 0)) {
      try {
        const conversation = await getConversation(conversationId);
        conversationMeta = {
          ...(conversation.metadata ?? {}),
          conversation_status: conversation.status,
        };
        if (!transcript && typeof conversation.transcript === 'string') {
          transcript = conversation.transcript;
        }
        if (turns.length === 0 && Array.isArray(conversation.turns)) {
          turns = normalizeTurns(conversation.turns);
        }
      } catch {
        // Keep client-provided payload if upstream conversation fetch fails.
      }
    }

    const normalizedTurns = normalizeTurns(turns);
    const durationSeconds =
      typeof payload.durationSeconds === 'number' && payload.durationSeconds >= 0
        ? payload.durationSeconds
        : Math.max(
            0,
            Math.round((Date.now() - Date.parse(session.startedAt)) / 1000),
          );

    const capCompliant = durationSeconds <= QA_DURATION_LIMIT_SECONDS;
    const finalStatus =
      payload.status ?? (capCompliant ? 'completed' : 'expired');

    const qaSession = await completeQASession(qaSessionId, {
      status: finalStatus,
      conversationId,
      durationSeconds,
      turns: normalizedTurns,
      transcript,
      evaluation: payload.evaluation,
      meta: {
        ...(session.meta ?? {}),
        ...(payload.meta ?? {}),
        ...conversationMeta,
        qa_cap_compliant: capCompliant,
      },
    });

    const response: CompleteQASessionResponse = { qaSession };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete QA session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
