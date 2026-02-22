/**
 * Generate a single coaching question based on the pitch content (PLACE_HOLDER_PITCH).
 * The answer is to be provided by the user; voice feedback (speaking the question) is done via ElevenLabs.
 */
import { completeWithLlmRouter } from './router';

const SYSTEM_PROMPT = `You are a pitch coach. You are given the pitch content (script/summary). Generate exactly one short coaching question that the speaker should answer themselves — to practice, recall key points, or reflect on delivery. Output only the question, one line, no "Q:" prefix.`;

export async function generateFeedbackQuestion(intendedPitch: string): Promise<string> {
  const pitch = intendedPitch.trim();
  if (!pitch) {
    return '';
  }
  const userPrompt = `PITCH:\n\n${pitch}\n\nGenerate one coaching question the speaker will answer.`;
  const raw = await completeWithLlmRouter({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.4,
    maxTokens: 120,
  });
  return raw.trim().replace(/^\s*Q:\s*/i, '').trim() || '';
}

const COACH_FEEDBACK_SYSTEM = `You are a pitch coach. The user was asked a coaching question and gave a spoken answer. Give brief, encouraging feedback on their answer in 1-3 sentences. Be specific and actionable.`;

export async function getCoachFeedback(
  question: string,
  userAnswer: string,
  intendedPitch?: string,
): Promise<string> {
  const pitch = intendedPitch?.trim() ?? '';
  const q = question.trim();
  const a = userAnswer.trim();
  if (!q || !a) return 'Answer something to get feedback.';
  const pitchBlock = pitch ? `PITCH CONTEXT:\n${pitch}\n\n` : '';
  const userPrompt = `${pitchBlock}QUESTION THE COACH ASKED:\n${q}\n\nUSER'S ANSWER:\n${a}\n\nGive brief feedback.`;
  return completeWithLlmRouter({
    systemPrompt: COACH_FEEDBACK_SYSTEM,
    userPrompt,
    temperature: 0.4,
    maxTokens: 200,
  });
}
