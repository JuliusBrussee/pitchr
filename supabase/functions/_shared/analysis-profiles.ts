import type { PitchMode } from './types.ts';

export interface AnalysisModeProfile {
  label: string;
  targetDurationSeconds: number;
  targetWpm: number;
  structureBeats: string[];
}

export interface AnalysisPromptProfile {
  workflowMode: PitchMode;
  systemPrompt: string;
  rubricText: string;
  modeConfig: AnalysisModeProfile;
  scoringGuidance: string[];
  transcriptRules: string[];
}

const COMMON_SYSTEM_PROMPT = `You are a startup pitch coach and investor evaluator.

Your job is to help founders improve quickly with direct, practical feedback.
Focus on what they should change next, not abstract commentary.

Feedback quality rules:
- Be specific and actionable.
- Prefer short, plain language.
- One clear action per fix.
- Avoid generic advice (for example: "be more confident").
- Tie each fix to where it appears in the pitch (opening hook, problem statement, solution, traction, market, ask/close, delivery language).
- Prioritize by impact on investor decision-making.

Output rules:
- Return valid JSON only.
- Do not use markdown.
- Do not include explanation text outside JSON.
- Follow the requested schema exactly (field names and value types must match).`;

const VC_RUBRIC_TEXT = `1. STRUCTURE (0-20)
Description: Clear flow with logical transitions and a strong ask at the end.
Criteria: Problem -> Solution -> Why Now -> Traction -> Ask. Penalize missing beats or circular flow.

2. CLARITY & CONCISION (0-20)
Description: Direct language, minimal jargon, concise phrasing that is easy to follow.
Criteria: Every sentence should earn its place. Penalize jargon and unnecessary qualifiers.

3. EVIDENCE & TRACTION (0-20)
Description: Concrete numbers, milestones, and proof points that build investor confidence.
Criteria: Reward specific metrics (users, revenue, growth, pilots, customers). Penalize vague claims.

4. MARKET & DIFFERENTIATION (0-20)
Description: Clear market sizing, competitor framing, and defensible differentiation.
Criteria: Expect TAM/SAM framing, competitors named, and a clear moat or positioning edge.

5. DELIVERY (0-20)
Description: Appropriate pace, low filler usage, low repetition, and time-limit compliance.
Criteria: Use local metrics for pace/fillers/repetition/time-limit adherence.`;

const ELEVATOR_RUBRIC_TEXT = `1. STRUCTURE (0-20)
Description: A complete investor-ready arc in 30 seconds.
Criteria: One-liner -> Problem -> Solution -> Proof -> Ask. Penalize missing ask or missing proof.

2. CLARITY & CONCISION (0-20)
Description: Instantly understandable language with zero fluff.
Criteria: Investor should understand what the company does within first 8 seconds.

3. EVIDENCE & TRACTION (0-20)
Description: At least one concrete proof signal that survives investor scrutiny.
Criteria: Reward metric + timeframe + denominator. Penalize "some revenue" style claims.

4. MARKET & DIFFERENTIATION (0-20)
Description: Clear buyer, clear alternative, clear reason this wins.
Criteria: Penalize unclear customer, no competitive framing, or no distinct edge.

5. DELIVERY (0-20)
Description: Tight, controlled, and on-time delivery for a 30-second window.
Criteria: Penalize overrun, rushed phrasing, filler, and repeated lines.`;

const PROFILES: Record<PitchMode, AnalysisPromptProfile> = {
  vc_pitch: {
    workflowMode: 'vc_pitch',
    systemPrompt: COMMON_SYSTEM_PROMPT,
    rubricText: VC_RUBRIC_TEXT,
    modeConfig: {
      label: 'VC Pitch',
      targetDurationSeconds: 120,
      targetWpm: 140,
      structureBeats: ['Problem', 'Solution', 'Why Now', 'Traction', 'Market', 'Ask'],
    },
    scoringGuidance: [
      'Score harshly: 80+ should be rare and reserved for clear proof, clear ask, and clear differentiation.',
      'Penalize generic and vague language aggressively.',
      'Grade against YC top-decile fundraising quality.',
    ],
    transcriptRules: [
      'Score the founder pitch content, not audience chatter.',
      'If transcript includes unrelated discussion, extract the founder pitch signal and score that signal only.',
    ],
  },
  elevator: {
    workflowMode: 'elevator',
    systemPrompt: `${COMMON_SYSTEM_PROMPT}

You are judging a 30-second elevator pitch where investors expect immediate clarity.
Use a skeptical investor lens: unclear business definition, vague traction, weak differentiation, and incomplete ask details must be penalized heavily.`,
    rubricText: ELEVATOR_RUBRIC_TEXT,
    modeConfig: {
      label: 'Elevator Pitch',
      targetDurationSeconds: 30,
      targetWpm: 165,
      structureBeats: ['One-liner', 'Problem', 'Solution', 'Proof', 'Ask'],
    },
    scoringGuidance: [
      'Score harshly: any missing proof, unclear what-you-do statement, or incomplete ask should cap strong scores.',
      'Penalize vague traction claims unless they include metric + timeframe + denominator.',
      'Penalize unclear differentiation versus alternatives.',
      'Reward crisp investor-ready asks with amount + instrument/equity + clear fund use.',
      'In 30-second mode, verbosity is a defect: penalize overlong or wandering scripts.',
    ],
    transcriptRules: [
      'Transcripts may include investor panel reactions after the founder pitch. Ignore panel commentary while scoring the founder.',
      'If mixed transcript segments exist, prioritize the founder opening and ask segment for score rationales.',
      'Do not let positive panel sentiment compensate for missing founder evidence.',
    ],
  },
};

export function getAnalysisPromptProfile(mode: PitchMode): AnalysisPromptProfile {
  return PROFILES[mode];
}
