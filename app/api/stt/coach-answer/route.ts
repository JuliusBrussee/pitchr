import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import { getCoachFeedback } from '@/lib/llm/feedbackQA';
import { getPitchFromEnv } from '@/lib/llm/pitchCoach';
import { synthesizeMp3 } from '@/lib/elevenlabs/tts';

interface CoachAnswerBody {
  question: string;
  answer: string;
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

  let body: CoachAnswerBody;
  try {
    body = (await request.json()) as CoachAnswerBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!question || !answer) {
    return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
  }

  try {
    const pitch = getPitchFromEnv();
    const feedbackText = await getCoachFeedback(question, answer, pitch);

    let audioBase64: string | undefined;
    let audioError: string | undefined;
    try {
      const { audio } = await synthesizeMp3(feedbackText);
      audioBase64 = audio.toString('base64');
    } catch (e) {
      audioError = e instanceof Error ? e.message : 'TTS failed';
    }

    return NextResponse.json({ feedbackText, audioBase64, audioError });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Coach feedback failed' },
      { status: 500 },
    );
  }
}
