import { completeWithLlmRouter } from './router';
import type { ChatTurn } from './types';

const SYSTEM_PROMPT = `You are a pitch coach. Use the provided pitch transcript as context. Answer clearly and practically. If the question is ambiguous, ask exactly 1 clarifying question. Keep answers under 120 words unless the user asks for details.`;

const MAX_HISTORY_TURNS = 6;

function buildUserPrompt(pitch: string, question: string, history: ChatTurn[]): string {
  const historyBlock =
    history.length > 0
      ? history
          .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
          .join('\n\n') + '\n\n'
      : '';
  return `${historyBlock}PITCH:\n${pitch}\n\nQUESTION:\n${question}`;
}

export async function askPitchCoach(
  pitch: string,
  question: string,
  history: ChatTurn[],
): Promise<string> {
  const userPrompt = buildUserPrompt(pitch, question, history);
  return completeWithLlmRouter({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
    maxTokens: 512,
  });
}

export function getPitchFromEnv(): string {
  const raw = process.env.PLACE_HOLDER_PITCH ?? '';
  return raw.replace(/\\n/g, '\n');
}
