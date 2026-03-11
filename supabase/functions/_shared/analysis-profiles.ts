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

const HACKATHON_RUBRIC_TEXT = `1. STRUCTURE (0-20)
Description: Hook -> Problem -> Demo -> Innovation -> Impact -> Ask. Complete arc in 3 minutes.
Criteria: Penalize missing demo or no CTA. Reward clear flow from problem to working solution to impact.

2. CLARITY & CONCISION (0-20)
Description: Judge understands what you built in one sentence. Accessible language.
Criteria: Penalize jargon, unclear product description. Reward plain-English explanation of technical innovation.

3. EVIDENCE (0-20)
Description: Working demo shown, technical credibility, implementation completeness.
Criteria: Penalize slides-only presentations. Reward live demos, screen recordings, or concrete implementation evidence.

4. MARKET (0-20)
Description: Theme alignment, real-world impact, scalability, differentiation from other hacks.
Criteria: Penalize no theme alignment or unclear impact. Reward creative problem framing and originality.

5. DELIVERY (0-20)
Description: Appropriate pace, low filler usage, energy, and time compliance (target 180s).
Criteria: Use local metrics for pace/fillers/repetition/time-limit adherence.`;

const FINAL_YEAR_RUBRIC_TEXT = `1. STRUCTURE (0-20)
Description: Clear narrative arc from problem statement through methodology to results, with explicit contributions and limitations sections.
Criteria: Introduction -> Problem & Context -> Approach -> Results -> Contributions (personal, delineated) -> Limitations (with implications) -> Impact/Next Steps. Penalize missing results section, absent limitations, or no explicit contributions delineation. Reward signposting, coherent flow, and a conclusion that does not end on future work alone.

2. CLARITY & COMMUNICATION (0-20)
Description: Accessible to both technical examiners and non-specialist evaluators; jargon explained or avoided; system explanation clear enough to withstand examiner questioning.
Criteria: Reward plain-English explanations of technical decisions and design choices. Penalize unexplained acronyms, slides-only reading, or a system that cannot be understood without specialist background. Every key design decision should be explained, not just described.

3. EVIDENCE & METHODOLOGY (0-20)
Description: Research rigor, implementation depth, soundness of methodology, and quality of quantitative results presented against a baseline.
Criteria: Reward concrete results with metric + baseline + interpretation (e.g., "X% vs. Y% baseline"). Reward explicit justification of methodology choices ("chose X instead of Y because Z"). Reward honest limitations discussion with analysis of implications — this is a positive signal, not a weakness. Penalize vague unmeasurable objectives, unsupported claims, results without baselines, or hand-waving over why something did not work.

4. IMPACT & ORIGINALITY (0-20)
Description: Novelty of approach vs. prior work, real-world applicability, and significance relative to existing literature; ambitious scope fully achieved.
Criteria: Reward clear problem motivation tied to a genuine need, novel approach or insight relative to existing work, and discussion of broader implications or societal utility. Reward ambitious objectives fully achieved over modest objectives perfectly executed. Penalize trivial implementations with no differentiation from prior work. Do NOT penalize for absence of revenue model, TAM, commercial viability, or investor readiness.

5. DELIVERY (0-20)
Description: Appropriate academic pace, professional tone, confidence, time-limit compliance (target 240s), and ability to clearly explain the system.
Criteria: Use local metrics for pace/fillers/repetition/time-limit adherence. Reward measured delivery, clear articulation, and explanation depth that would hold up under examiner questioning. Penalize rushed or inaudible sections, excessive filler, slides-only reading, significant overrun, or a presentation that does not demonstrate the system or its results.`;

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
  hackathon: {
    workflowMode: 'hackathon',
    systemPrompt: `${COMMON_SYSTEM_PROMPT}

You are judging a 3-minute hackathon demo pitch where judges expect a working product demo, clear innovation, and theme alignment.
Missing demo is the single most damaging flaw. Slides-only presentations should score poorly on evidence.
Judges care about: Does it work? Is it creative? Does it solve a real problem?
Do not apply investor/VC standards. Grade against hackathon winner quality.`,
    rubricText: HACKATHON_RUBRIC_TEXT,
    modeConfig: {
      label: 'Hackathon Pitch',
      targetDurationSeconds: 180,
      targetWpm: 150,
      structureBeats: ['Hook', 'Problem', 'Demo', 'Innovation', 'Impact', 'Ask'],
    },
    scoringGuidance: [
      'Grade against hackathon winner quality, not YC/investor standards.',
      '80+ requires working demo + clear innovation + theme alignment.',
      'Penalize slides-only presentations heavily on evidence.',
      'Reward creativity, technical implementation depth, and real-world impact.',
    ],
    transcriptRules: [
      'Score the founder demo pitch content only; ignore judge commentary.',
      'Do not penalize informal or enthusiastic tone — hackathon energy is expected.',
      'Treat screen-sharing references and live demo narration as technical credibility signals.',
    ],
  },
  final_year: {
    workflowMode: 'final_year',
    systemPrompt: `You are an academic project presentation evaluator assessing final year university students.

Your job is to give structured, constructive feedback that helps students improve their research communication.
Focus on methodology rigor, result quality, and academic communication — not commercial viability.

Feedback quality rules:
- Be specific and actionable.
- Prefer short, plain language.
- One clear action per fix.
- Avoid generic advice (for example: "explain your methods better").
- Tie each fix to a specific section (introduction, problem framing, methodology, results, impact discussion, delivery).
- Prioritize by impact on examiner understanding and assessment score.
- Do NOT evaluate revenue model, market size, investor readiness, or fundraising.

Output rules:
- Return valid JSON only.
- Do not use markdown.
- Do not include explanation text outside JSON.
- Follow the requested schema exactly (field names and value types must match).`,
    rubricText: FINAL_YEAR_RUBRIC_TEXT,
    modeConfig: {
      label: 'Final Year Project',
      targetDurationSeconds: 240,
      targetWpm: 130,
      structureBeats: ['Introduction', 'Problem & Context', 'Approach', 'Results', 'Impact', 'Next Steps'],
    },
    scoringGuidance: [
      'Grade against strong final-year student presentations, not investor or hackathon standards.',
      '80+ requires: originality/independent contribution clearly demonstrated + critical self-evaluation of own work + quantitative results with baselines.',
      '70–79: All criteria met, demanding objectives fully achieved, limitations critically discussed with implications.',
      '60–69: Competent across all criteria, objectives substantially achieved, some critical depth lacking.',
      'Below 60: Objectives not achieved, results absent or unsupported, no evaluation of own work.',
      'Critical self-evaluation (limitations with implications analysis) is the most reliable first-class marker — its absence caps a score at ~65.',
      'Limitations discussion with analysis of implications RAISES scores, not lowers — it is an explicit positive criterion above 60%.',
      'Penalize vague unmeasurable objectives, results without baselines, and design decisions stated but not justified.',
      'Do NOT penalize for absence of revenue model, TAM, commercial viability, or investor readiness.',
      'Reward methodology justification ("chose X instead of Y because Z") — this separates 70% from 60%.',
    ],
    transcriptRules: [
      'Score the student presentation content only; ignore examiner or supervisor questions and commentary.',
      'Treat quantitative results with baselines, limitations with implications, and methodology justification as primary scoring signals.',
      'Do not penalize academic or technical language when it is explained in context — penalize only unexplained jargon.',
      'A presentation that cannot clearly explain the system it built should be penalised on Clarity even if delivery is fluent.',
      'Treat explicit contributions delineation ("my contribution was X") as a strong positive signal under Structure.',
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

export function getAnalysisPromptProfile(
  mode: PitchMode,
  targetDurationOverride?: number,
): AnalysisPromptProfile {
  const profile = PROFILES[mode];
  if (
    typeof targetDurationOverride === 'number' &&
    targetDurationOverride >= 30 &&
    targetDurationOverride <= 300
  ) {
    return {
      ...profile,
      modeConfig: {
        ...profile.modeConfig,
        targetDurationSeconds: targetDurationOverride,
      },
    };
  }
  return profile;
}
