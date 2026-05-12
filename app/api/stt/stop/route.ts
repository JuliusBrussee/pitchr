import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import { generateFeedbackQuestion } from '@/lib/llm/feedbackQA';
import { getPitchFromEnv } from '@/lib/llm/pitchCoach';

export async function POST() {
  try {
    await getAuthenticatedUser();
  } catch (e) {
    if (e instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }

  let feedbackQuestion = '';
  let feedbackError: string | undefined;
  try {
    const intendedPitch = getPitchFromEnv();
    feedbackQuestion = await generateFeedbackQuestion(intendedPitch);
  } catch (e) {
    feedbackError = e instanceof Error ? e.message : 'Feedback generation failed';
  }

  return NextResponse.json({ feedbackQuestion, feedbackError });
}
