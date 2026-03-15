import type { FeedbackOutput, OneMinuteQAPack, RubricScore } from '@/types/analysis-v2';
import type { Project, ProjectPromptOverrides } from '@/types/project';
import type { CreatePitchRunRequest, InputType, PitchMode, Run } from '@/types/pitch';

const LOCAL_REGRESSION_STORAGE_KEY = 'pitchr_local_regression_edge_v1';
const PLACEHOLDER_SUPABASE_HOST = 'example.supabase.co';
const SEEDED_PROJECT_ID = '00000000-0000-4000-8000-000000000001';
const SEEDED_PROJECT_NAME = 'Regression Demo Project';

interface RegressionEdgeState {
  projects: Project[];
  activeProjectId: string | null;
  runs: Run[];
}

let cachedState: RegressionEdgeState | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLocalHostRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function hasPlaceholderSupabaseUrl(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    return new URL(supabaseUrl).hostname === PLACEHOLDER_SUPABASE_HOST;
  } catch {
    return supabaseUrl.includes(PLACEHOLDER_SUPABASE_HOST);
  }
}

function hasPlaywrightAuthBypassFlag(): boolean {
  return process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH === "true";
}

export function isLocalRegressionMode(): boolean {
  if (!hasPlaceholderSupabaseUrl()) return false;
  return hasPlaywrightAuthBypassFlag() || isLocalHostRuntime();
}

function nowIso(): string {
  return new Date().toISOString();
}

function seedProject(now: string): Project {
  return {
    id: SEEDED_PROJECT_ID,
    name: SEEDED_PROJECT_NAME,
    description: 'Deterministic local regression project',
    targetMarket: null,
    keyMetrics: null,
    extraNotes: null,
    isArchived: false,
    defaultMode: 'vc_pitch',
    promptOverrides: {},
    createdAt: now,
    updatedAt: now,
  };
}

function createInitialState(): RegressionEdgeState {
  const now = nowIso();
  const project = seedProject(now);
  return {
    projects: [project],
    activeProjectId: project.id,
    runs: [],
  };
}

function normalizeMode(value: unknown): PitchMode {
  if (value === 'elevator' || value === 'vc_pitch' || value === 'hackathon' || value === 'final_year') {
    return value;
  }
  return 'vc_pitch';
}

function normalizeInputType(value: unknown): InputType {
  if (value === 'audio' || value === 'text' || value === 'upload') {
    return value;
  }
  return 'text';
}

function loadState(): RegressionEdgeState {
  if (cachedState) return cachedState;

  if (typeof window === 'undefined') {
    cachedState = createInitialState();
    return cachedState;
  }

  try {
    const raw = localStorage.getItem(LOCAL_REGRESSION_STORAGE_KEY);
    if (!raw) {
      cachedState = createInitialState();
      return cachedState;
    }
    const parsed = JSON.parse(raw);
    if (
      isObject(parsed) &&
      Array.isArray(parsed.projects) &&
      Array.isArray(parsed.runs) &&
      (typeof parsed.activeProjectId === 'string' || parsed.activeProjectId === null)
    ) {
      cachedState = {
        projects: parsed.projects as Project[],
        activeProjectId: parsed.activeProjectId as string | null,
        runs: parsed.runs as Run[],
      };
      return cachedState;
    }
  } catch {
    // fallback to deterministic initial state
  }

  cachedState = createInitialState();
  return cachedState;
}

function persistState(state: RegressionEdgeState): void {
  cachedState = state;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_REGRESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore localStorage failures
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function projectForId(state: RegressionEdgeState, projectId: string | null): Project | null {
  if (!projectId) return null;
  return state.projects.find((project) => project.id === projectId) ?? null;
}

async function parseJsonBody(init?: RequestInit): Promise<Record<string, unknown>> {
  const body = init?.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return isObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }
  return {};
}

function computeRubricBreakdown(mode: PitchMode): RubricScore[] {
  if (mode === 'hackathon') {
    return [
      { category: 'structure', score: 15, max_score: 20, rationale: 'Clear challenge framing and flow.' },
      { category: 'clarity', score: 14, max_score: 20, rationale: 'Messaging is understandable with minor density.' },
      { category: 'evidence', score: 14, max_score: 20, rationale: 'Some proof points provided, more demo specifics help.' },
      { category: 'market', score: 13, max_score: 20, rationale: 'Use case is clear, market framing can be sharper.' },
      { category: 'delivery', score: 16, max_score: 20, rationale: 'Confident pace and clear transitions.' },
    ];
  }
  if (mode === 'final_year') {
    return [
      { category: 'structure', score: 16, max_score: 20, rationale: 'Problem-method-results structure is coherent.' },
      { category: 'clarity', score: 15, max_score: 20, rationale: 'Technical ideas are explained well.' },
      { category: 'evidence', score: 15, max_score: 20, rationale: 'Evidence references are present with moderate depth.' },
      { category: 'market', score: 13, max_score: 20, rationale: 'Context and impact can be quantified more strongly.' },
      { category: 'delivery', score: 15, max_score: 20, rationale: 'Steady cadence with room for stronger emphasis.' },
    ];
  }
  if (mode === 'elevator') {
    return [
      { category: 'structure', score: 15, max_score: 20, rationale: 'Core narrative is concise and ordered.' },
      { category: 'clarity', score: 16, max_score: 20, rationale: 'Value proposition is easy to follow.' },
      { category: 'evidence', score: 13, max_score: 20, rationale: 'Include one concrete metric earlier.' },
      { category: 'market', score: 14, max_score: 20, rationale: 'Target segment is identifiable.' },
      { category: 'delivery', score: 16, max_score: 20, rationale: 'Natural pacing for short format.' },
    ];
  }
  return [
    { category: 'structure', score: 16, max_score: 20, rationale: 'Strong narrative flow and transitions.' },
    { category: 'clarity', score: 15, max_score: 20, rationale: 'Message is mostly crisp and specific.' },
    { category: 'evidence', score: 14, max_score: 20, rationale: 'Evidence is present with room for one stronger proof point.' },
    { category: 'market', score: 14, max_score: 20, rationale: 'Market opportunity is plausible and scoped.' },
    { category: 'delivery', score: 16, max_score: 20, rationale: 'Delivery is confident with consistent cadence.' },
  ];
}

function createQaPack(mode: PitchMode): OneMinuteQAPack {
  const counterparty = mode === 'hackathon' ? 'judge' : mode === 'final_year' ? 'panel' : 'investor';
  return {
    total_target_seconds: 60,
    timing_plan_seconds: [20, 20, 20],
    investor_questions: [
      `What is the strongest proof point for this ${counterparty} audience?`,
      'What is your clearest differentiation signal?',
      'What is the specific next-step ask?',
    ],
    suggested_answers: [
      {
        question: `What is the strongest proof point for this ${counterparty} audience?`,
        answer: 'Lead with one concrete metric plus timeframe and denominator.',
        target_seconds: 20,
      },
      {
        question: 'What is your clearest differentiation signal?',
        answer: 'Contrast your approach with alternatives in one sentence.',
        target_seconds: 20,
      },
      {
        question: 'What is the specific next-step ask?',
        answer: 'Close with one explicit ask tied to measurable milestones.',
        target_seconds: 20,
      },
    ],
    focus_tags: ['proof', 'differentiation', 'ask'],
    red_flags_to_avoid: [
      'Do not use vague market-size statements without execution details.',
      'Do not skip a concrete next-step ask.',
      'Do not claim traction without numbers.',
    ],
  };
}

function createFeedback(mode: PitchMode, transcript: string): FeedbackOutput {
  const rubric = computeRubricBreakdown(mode);
  const overall = Math.round(
    rubric.reduce((sum, item) => sum + (item.score / item.max_score) * 100, 0) / rubric.length,
  );
  const words = transcript.trim().split(/\s+/u).filter(Boolean);
  const wordCount = words.length;
  const durationSeconds = Math.max(45, Math.round((wordCount / 140) * 60));

  return {
    overall_score: overall,
    one_line_verdict: 'Solid baseline pitch with clear upside in evidence precision.',
    rubric_breakdown: rubric,
    top_fixes: [
      {
        rank: 1,
        category: 'evidence',
        issue: 'Proof points are general.',
        fix: 'Add one quantifiable metric with timeframe and denominator.',
        impact: 'high',
      },
      {
        rank: 2,
        category: 'market',
        issue: 'Audience targeting is broad.',
        fix: 'Name one wedge segment and why it converts first.',
        impact: 'medium',
      },
      {
        rank: 3,
        category: 'structure',
        issue: 'Ask appears late.',
        fix: 'State the ask earlier and tie it to the next milestone.',
        impact: 'medium',
      },
    ],
    rewrite_script: 'We help founders practice investor pitches with instant scoring, ranked fixes, and a stronger rewrite before important meetings.',
    delivery_metrics: {
      word_count: wordCount,
      duration_seconds: durationSeconds,
      target_wpm: 140,
      wpm: 138,
      filler_count: 2,
      filler_rate: 0.8,
      disfluency_count: 1,
      stutter_rate: 0.2,
      repeated_ngram_tokens: 1,
      repeat_rate: 0.4,
      within_time_limit: true,
      pace_score_component: 18,
      filler_score_component: 19,
      stutter_score_component: 19,
      repeat_score_component: 19,
      time_score_component: 18,
      delivery20: 16,
      filler_words: [{ word: 'um', count: 1 }],
      repeated_phrases: [{ phrase: 'we help', count: 2 }],
    },
    spoken_score: overall,
    deck_score: null,
    pre_penalty_overall: overall,
    penalty: 0,
    sentiment_profile: {
      confidence: 0.76,
      urgency: 0.68,
      credibility: 0.74,
      clarity: 0.79,
      investor_readiness: 0.72,
    },
    anti_pattern_hits: [],
    citations: [],
    stage_expectations: [],
    do_next_checklist: [
      'Open with one customer pain statement in under 10 seconds.',
      'Add one proof metric and one explicit ask.',
      'Practice pacing around the proof sentence.',
    ],
    summary_good: 'Clear structure and steady delivery.',
    summary_bad: 'Needs one stronger proof point and tighter market wedge.',
  };
}

function buildRun(input: CreatePitchRunRequest, project: Project): Run {
  const createdAt = nowIso();
  const mode = normalizeMode(input.mode);
  const feedback = createFeedback(mode, input.transcript ?? '');
  const qaPack = createQaPack(mode);
  const runId = crypto.randomUUID();
  const coverage = input.deckText || input.deckId ? 'spoken+deck' : 'spoken_only';

  return {
    id: runId,
    createdAt,
    completedAt: createdAt,
    projectId: project.id,
    projectName: project.name,
    mode,
    status: 'complete',
    inputType: normalizeInputType(input.inputType),
    transcript: input.transcript ?? '',
    audioUrl: input.audioUrl,
    deckId: input.deckId,
    deckText: input.deckText,
    analysis: feedback,
    analysisVersion: 'v2',
    coverage,
    outputs: {
      feedback,
      qa_1min: qaPack,
    },
    meta: {
      provider_used: 'none',
      fallback_used: false,
      cache_hit: false,
      llm_calls_used: 0,
      latency_ms: 12,
      attempt_count: 1,
    },
    overallScore: feedback.overall_score,
    fallback: false,
  };
}

function computeStats(runs: Run[]): { totalRuns: number; averageScore: number; bestScore: number; trend: number[] } {
  const totalRuns = runs.length;
  if (totalRuns === 0) {
    return { totalRuns: 0, averageScore: 0, bestScore: 0, trend: [] };
  }
  const scores = runs.map((run) => run.overallScore);
  const averageScore = Math.round(scores.reduce((sum, value) => sum + value, 0) / totalRuns);
  const bestScore = Math.max(...scores);
  const trend = runs.slice(0, 20).reverse().map((run) => run.overallScore);
  return { totalRuns, averageScore, bestScore, trend };
}

function listRunsForResponse(
  state: RegressionEdgeState,
  params?: Record<string, string> | URLSearchParams,
): Run[] {
  const getParam = (key: string): string | null => {
    if (!params) return null;
    if (params instanceof URLSearchParams) return params.get(key);
    return params[key] ?? null;
  };

  const allProjects = getParam('allProjects') === 'true';
  const requestedProjectId = getParam('projectId');
  const filtered = allProjects || !requestedProjectId
    ? state.runs
    : state.runs.filter((run) => run.projectId === requestedProjectId);

  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function handleProjectsRequest(state: RegressionEdgeState, method: string, init?: RequestInit): Promise<Response> {
  if (method === 'GET') {
    return jsonResponse({
      projects: state.projects,
      activeProjectId: state.activeProjectId,
    });
  }

  if (method === 'POST') {
    const body = await parseJsonBody(init);
    const rawName = body.name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name) {
      return jsonResponse({ error: 'name is required.' }, 400);
    }

    const now = nowIso();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description: typeof body.description === 'string' ? body.description : null,
      targetMarket: typeof body.targetMarket === 'string' ? body.targetMarket : null,
      keyMetrics: typeof body.keyMetrics === 'string' ? body.keyMetrics : null,
      extraNotes: typeof body.extraNotes === 'string' ? body.extraNotes : null,
      isArchived: false,
      defaultMode: normalizeMode(body.workflowMode) as Project['defaultMode'],
      promptOverrides: isObject(body.promptOverrides) ? (body.promptOverrides as ProjectPromptOverrides) : {},
      createdAt: now,
      updatedAt: now,
    };

    const setActive = body.setActive === true || !state.activeProjectId;
    state.projects = [...state.projects, project];
    if (setActive) {
      state.activeProjectId = project.id;
    }
    persistState(state);
    return jsonResponse(
      {
        project,
        activeProjectId: state.activeProjectId,
      },
      201,
    );
  }

  if (method === 'PATCH') {
    const body = await parseJsonBody(init);
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    if (!projectId) {
      return jsonResponse({ error: 'projectId is required.' }, 400);
    }

    const current = state.projects.find((project) => project.id === projectId);
    if (!current) {
      return jsonResponse({ error: 'Project not found.' }, 404);
    }

    const next: Project = {
      ...current,
      updatedAt: nowIso(),
      name: typeof body.name === 'string' ? body.name : current.name,
      description: typeof body.description === 'string' ? body.description : current.description,
      targetMarket: typeof body.targetMarket === 'string' ? body.targetMarket : current.targetMarket,
      keyMetrics: typeof body.keyMetrics === 'string' ? body.keyMetrics : current.keyMetrics,
      extraNotes: typeof body.extraNotes === 'string' ? body.extraNotes : current.extraNotes,
      isArchived: typeof body.isArchived === 'boolean' ? body.isArchived : current.isArchived,
      promptOverrides: isObject(body.promptOverrides)
        ? (body.promptOverrides as ProjectPromptOverrides)
        : current.promptOverrides,
    };

    state.projects = state.projects.map((project) => (project.id === projectId ? next : project));

    if (body.setActive === true) {
      state.activeProjectId = projectId;
    }

    if (next.isArchived && state.activeProjectId === next.id) {
      const fallback = state.projects.find((project) => !project.isArchived) ?? null;
      state.activeProjectId = fallback?.id ?? null;
    }

    persistState(state);
    return jsonResponse({
      project: next,
      activeProjectId: state.activeProjectId,
    });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handlePitchRunRequest(
  state: RegressionEdgeState,
  method: string,
  init?: RequestInit & { params?: Record<string, string> | URLSearchParams },
): Promise<Response> {
  if (method === 'GET') {
    const runs = listRunsForResponse(state, init?.params);
    return jsonResponse({
      runs,
      stats: computeStats(runs),
    });
  }

  if (method === 'POST') {
    const body = await parseJsonBody(init) as Partial<CreatePitchRunRequest>;
    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';
    if (!transcript) {
      return jsonResponse({ error: 'Transcript is required.' }, 400);
    }

    const selectedProject = projectForId(
      state,
      typeof body.projectId === 'string' ? body.projectId : state.activeProjectId,
    ) ?? state.projects[0] ?? null;

    if (!selectedProject) {
      return jsonResponse({ error: 'Select a project before analysis.' }, 400);
    }

    const run = buildRun(
      {
        mode: normalizeMode(body.mode),
        inputType: normalizeInputType(body.inputType),
        transcript,
        audioUrl: typeof body.audioUrl === 'string' ? body.audioUrl : undefined,
        deckId: typeof body.deckId === 'string' ? body.deckId : undefined,
        deckText: typeof body.deckText === 'string' ? body.deckText : undefined,
      },
      selectedProject,
    );

    state.runs = [run, ...state.runs];
    persistState(state);

    return jsonResponse({
      runId: run.id,
      status: run.status,
      projectId: run.projectId,
      analysisVersion: run.analysisVersion,
      coverage: run.coverage,
      outputs: run.outputs,
      meta: run.meta,
      analysis: run.analysis,
      fallback: false,
      provider_used: 'none',
    });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

function handlePitchRunDetailRequest(
  state: RegressionEdgeState,
  method: string,
  init?: RequestInit & { params?: Record<string, string> | URLSearchParams },
): Response {
  const getParam = (key: string): string | null => {
    const params = init?.params;
    if (!params) return null;
    if (params instanceof URLSearchParams) return params.get(key);
    return params[key] ?? null;
  };

  const runId = getParam('runId');
  if (!runId) {
    return jsonResponse({ error: 'runId is required.' }, 400);
  }

  if (method === 'GET') {
    const run = state.runs.find((item) => item.id === runId);
    if (!run) {
      return jsonResponse({ error: 'Run not found.' }, 404);
    }
    return jsonResponse({ run });
  }

  if (method === 'DELETE') {
    state.runs = state.runs.filter((run) => run.id !== runId);
    persistState(state);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

export async function handleLocalRegressionEdgeRequest(
  functionName: string,
  init?: RequestInit & { params?: Record<string, string> | URLSearchParams },
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const state = loadState();

  if (functionName === 'projects') {
    return handleProjectsRequest(state, method, init);
  }

  if (functionName === 'deck-list') {
    return jsonResponse([]);
  }

  if (functionName === 'deck-detail') {
    return jsonResponse({ slides: [] });
  }

  if (functionName === 'pitch-run') {
    return handlePitchRunRequest(state, method, init);
  }

  if (functionName === 'pitch-run-detail') {
    return handlePitchRunDetailRequest(state, method, init);
  }

  return jsonResponse(
    { error: `Local regression fallback is not implemented for '${functionName}'.` },
    404,
  );
}
