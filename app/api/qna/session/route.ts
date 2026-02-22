import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsConvaiError, getSignedUrl } from '@/lib/elevenlabs/convai';
import { buildQaAgentSystemPrompt } from '@/lib/prompts/qaAgent';
import { createQASession } from '@/services/qnaSessionService';
import { buildQaStarterContext } from '@/services/qna/contextBuilderService';
import type {
  CreateQASessionRequest,
  CreateQASessionResponse,
} from '@/types/qna';

const QA_DURATION_LIMIT_SECONDS = 60;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    value,
  );
}

function liveQaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_LIVE_QA === 'true';
}

function isMissingConvaiWritePermission(error: ElevenLabsConvaiError): boolean {
  const providerStatus = error.providerStatus?.toLowerCase() ?? '';
  const providerMessage = error.providerMessage?.toLowerCase() ?? '';
  return providerStatus === 'missing_permissions' || providerMessage.includes('convai_write');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!liveQaEnabled()) {
    return NextResponse.json(
      { error: 'Live VC Q&A is disabled. Set NEXT_PUBLIC_ENABLE_LIVE_QA=true.' },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const payload = body as Partial<CreateQASessionRequest>;
  const runId = typeof payload.runId === 'string' ? payload.runId.trim() : '';
  if (!runId || !isUuid(runId)) {
    return NextResponse.json({ error: 'runId must be a valid UUID.' }, { status: 400 });
  }

  const agentId = process.env.ELEVENLABS_CONVAI_AGENT_ID?.trim();
  if (!agentId) {
    return NextResponse.json(
      { error: 'Missing ELEVENLABS_CONVAI_AGENT_ID environment variable.' },
      { status: 500 },
    );
  }

  try {
    const context = await buildQaStarterContext(runId);
    const qaSystemPrompt = buildQaAgentSystemPrompt({
      starterContext: context.starterContext,
      weakestCategories: context.weakestCategories,
      timeLimitSeconds: QA_DURATION_LIMIT_SECONDS,
    });
    const signed = await getSignedUrl(agentId, true);
    const qaSession = await createQASession({
      runId,
      status: 'active',
      conversationId: signed.conversationId,
      durationLimitSeconds: QA_DURATION_LIMIT_SECONDS,
      meta: {
        starter_context: qaSystemPrompt,
        knowledge_confidence: context.knowledgeConfidence,
        citations: context.citations,
        queued_knowledge_gap: context.queuedKnowledgeGap,
      },
    });

    const response: CreateQASessionResponse = {
      qaSessionId: qaSession.id,
      signedUrl: signed.signedUrl,
      conversationId: signed.conversationId,
      durationLimitSeconds: QA_DURATION_LIMIT_SECONDS,
      starterContext: qaSystemPrompt,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ElevenLabsConvaiError) {
      if (isMissingConvaiWritePermission(error)) {
        return NextResponse.json(
          {
            error:
              'ElevenLabs API key is missing convai_write permission. Create/use a ConvAI-enabled key and ensure ELEVENLABS_CONVAI_AGENT_ID is in the same workspace.',
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error:
            'Failed to initialize ElevenLabs ConvAI session. Verify ELEVENLABS_API_KEY_CONVAI and ELEVENLABS_CONVAI_AGENT_ID.',
        },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create QA session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
