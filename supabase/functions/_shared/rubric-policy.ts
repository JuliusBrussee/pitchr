export const RUBRIC_POLICY_KEY = 'analysis_system_prompt_policy';

const SCORE_CATEGORIES = [
  'structure',
  'clarity',
  'evidence',
  'market',
  'delivery',
  'deck_narrative',
  'deck_clarity',
  'deck_evidence',
  'deck_design',
  'deck_ask',
] as const;

type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

const CATEGORY_ALIASES: Array<{ category: ScoreCategory; aliases: string[] }> = [
  { category: 'structure', aliases: ['structure', 'presentation quality', 'storytelling'] },
  { category: 'clarity', aliases: ['clarity', 'usability', 'ux', 'dx'] },
  { category: 'evidence', aliases: ['evidence', 'traction', 'proof', 'practicality', 'wow factor', 'technical implementation'] },
  { category: 'market', aliases: ['market', 'impact', 'originality', 'creativity'] },
  { category: 'delivery', aliases: ['delivery', 'pace'] },
  { category: 'deck_narrative', aliases: ['deck_narrative', 'deck narrative'] },
  { category: 'deck_clarity', aliases: ['deck_clarity', 'deck clarity'] },
  { category: 'deck_evidence', aliases: ['deck_evidence', 'deck evidence'] },
  { category: 'deck_design', aliases: ['deck_design', 'deck design'] },
  { category: 'deck_ask', aliases: ['deck_ask', 'deck ask'] },
];

export interface RubricPolicyCapRule {
  id: string;
  scope: 'all' | 'category';
  category?: ScoreCategory;
  required_term: string;
  max_score: number;
  evidence: string;
}

export interface RubricPolicy {
  version: 'v1';
  source_hash: string;
  source_chars: number;
  required_terms: string[];
  hard_caps: RubricPolicyCapRule[];
  parse_warnings: string[];
}

export interface RubricPolicyScoreAdjustment {
  rule_id: string;
  category: string;
  required_term: string;
  max_score: number;
  before_score: number;
  after_score: number;
  reason: string;
}

export interface RubricPolicyEvaluation {
  applied: boolean;
  policy_hash?: string;
  rule_count: number;
  missing_terms: string[];
  adjustments: RubricPolicyScoreAdjustment[];
}

interface RubricScoreLike {
  category: string;
  score: number;
  max_score: number;
  rationale: string;
}

interface TopFixLike {
  rank: number;
  category: string;
  issue: string;
  fix: string;
  impact: 'high' | 'medium' | 'low';
}

interface FeedbackLike {
  overall_score: number;
  one_line_verdict: string;
  rubric_breakdown: RubricScoreLike[];
  top_fixes?: TopFixLike[];
  do_next_checklist?: string[];
  sentiment_profile?: {
    confidence?: number;
    urgency?: number;
    credibility?: number;
    clarity?: number;
    investor_readiness?: number;
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function hashDjb2(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return `djb2-${(hash >>> 0).toString(16)}`;
}

function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/^[^a-z0-9]+/iu, '')
    .replace(/[^a-z0-9\s_-]+$/iu, '')
    .replace(/\s+/gu, ' ');
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const rawValue of values) {
    const value = normalizeTerm(rawValue);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    ordered.push(value);
  }
  return ordered;
}

function extractTermCandidates(line: string): string[] {
  const candidates: string[] = [];

  for (const match of line.matchAll(/["']([^"']{2,80})["']/gu)) {
    candidates.push(match[1]);
  }

  const linked = line.match(/\b([a-z][a-z0-9_-]{2,})-linked\b/iu);
  if (linked?.[1]) {
    candidates.push(linked[1]);
  }

  const absent = line.match(/\bif\s+([a-z][a-z0-9_-]{2,})\s+is\s+absent\b/iu);
  if (absent?.[1]) {
    candidates.push(absent[1]);
  }

  const without = line.match(/\bwithout\s+([a-z][a-z0-9_-]{2,})\b/iu);
  if (without?.[1]) {
    candidates.push(without[1]);
  }

  const says = line.match(/\bexplicitly\s+says\s+([a-z][a-z0-9_-]{2,})\b/iu);
  if (says?.[1]) {
    candidates.push(says[1]);
  }

  const mustMention = line.match(
    /\b(?:must|should|need(?:s)?\s+to|required(?:\s+to)?)\s+(?:explicitly\s+)?mention\s+([a-z][a-z0-9_-]{2,})\b/iu,
  );
  if (mustMention?.[1]) {
    candidates.push(mustMention[1]);
  }

  return uniqueStrings(candidates);
}

function extractCapValue(line: string): number | null {
  const patterns = [
    /\b(?:above|exceed|over)\s*(\d+(?:\.\d+)?)\s*(?:\/\s*20)?\b/iu,
    /\bcap(?:\s+\w+){0,4}\s+at\s*(\d+(?:\.\d+)?)\s*(?:\/\s*20)?\b/iu,
    /\b<=\s*(\d+(?:\.\d+)?)\s*(?:\/\s*20)?\b/iu,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (!match?.[1]) continue;
    const parsed = Number.parseFloat(match[1]);
    if (!Number.isFinite(parsed)) continue;
    return Math.max(0, Math.min(20, parsed));
  }

  return null;
}

function resolveCategoryMentions(line: string): ScoreCategory[] {
  const lower = line.toLowerCase();
  const categories = CATEGORY_ALIASES
    .filter((entry) => entry.aliases.some((alias) => lower.includes(alias)))
    .map((entry) => entry.category);
  return [...new Set(categories)];
}

function containsTerm(source: string, term: string): boolean {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'iu').test(source);
}

function buildRuleId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

export function isRubricPolicy(value: unknown): value is RubricPolicy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const policy = value as Record<string, unknown>;
  return (
    policy.version === 'v1' &&
    typeof policy.source_hash === 'string' &&
    typeof policy.source_chars === 'number' &&
    Array.isArray(policy.required_terms) &&
    Array.isArray(policy.hard_caps) &&
    Array.isArray(policy.parse_warnings)
  );
}

export function buildRubricPolicy(rubricText: string): RubricPolicy {
  const normalizedText = rubricText.trim();
  const lines = normalizedText
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter(Boolean);

  const requiredTerms = uniqueStrings(lines.flatMap((line) => extractTermCandidates(line)));
  const hardCaps: RubricPolicyCapRule[] = [];
  const parseWarnings: string[] = [];

  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    const cap = extractCapValue(line);
    if (cap === null) return;

    const termCandidates = extractTermCandidates(line);
    const fallbackTerm =
      termCandidates[0] ??
      (requiredTerms.length === 1 ? requiredTerms[0] : undefined);
    if (!fallbackTerm) {
      parseWarnings.push(`Skipped cap rule without enforceable term: "${line}"`);
      return;
    }

    if (lower.includes('any category')) {
      hardCaps.push({
        id: buildRuleId('all', index),
        scope: 'all',
        required_term: fallbackTerm,
        max_score: cap,
        evidence: line,
      });
      return;
    }

    const categories = resolveCategoryMentions(line);
    if (categories.length === 0) {
      parseWarnings.push(`Skipped cap rule without category scope: "${line}"`);
      return;
    }

    categories.forEach((category, categoryIndex) => {
      hardCaps.push({
        id: `${buildRuleId('cat', index)}-${categoryIndex + 1}`,
        scope: 'category',
        category,
        required_term: fallbackTerm,
        max_score: cap,
        evidence: line,
      });
    });
  });

  const dedupedCaps = hardCaps.filter((rule, index, allRules) => {
    const key = `${rule.scope}:${rule.category ?? '*'}:${rule.required_term}:${rule.max_score}`;
    return allRules.findIndex(
      (candidate) =>
        `${candidate.scope}:${candidate.category ?? '*'}:${candidate.required_term}:${candidate.max_score}` === key,
    ) === index;
  });

  return {
    version: 'v1',
    source_hash: hashDjb2(normalizedText),
    source_chars: normalizedText.length,
    required_terms: requiredTerms,
    hard_caps: dedupedCaps,
    parse_warnings: parseWarnings,
  };
}

export function resolveRubricPolicyFromPromptOverrides(
  promptOverridesValue: unknown,
): RubricPolicy | undefined {
  const promptOverrides = asRecord(promptOverridesValue);
  if (!promptOverrides) return undefined;

  const stored = promptOverrides[RUBRIC_POLICY_KEY];
  if (isRubricPolicy(stored)) {
    return stored;
  }

  const rawPrompt = promptOverrides.analysis_system_prompt;
  if (typeof rawPrompt !== 'string') return undefined;
  const normalizedPrompt = rawPrompt.trim();
  if (!normalizedPrompt) return undefined;
  return buildRubricPolicy(normalizedPrompt);
}

export function applyRubricPolicyToFeedback<TFeedback extends FeedbackLike>(
  feedback: TFeedback,
  opts: {
    policy?: RubricPolicy;
    transcript: string;
    deckText?: string;
  },
): { feedback: TFeedback; evaluation: RubricPolicyEvaluation } {
  const policy = opts.policy;
  if (!policy || (policy.hard_caps.length === 0 && policy.required_terms.length === 0)) {
    return {
      feedback,
      evaluation: {
        applied: false,
        rule_count: policy?.hard_caps.length ?? 0,
        missing_terms: [],
        adjustments: [],
      },
    };
  }

  const transcript = `${opts.transcript ?? ''}\n${opts.deckText ?? ''}`.toLowerCase();
  const missingTerms = policy.required_terms.filter((term) => !containsTerm(transcript, term));

  const nextFeedback: TFeedback = {
    ...feedback,
    rubric_breakdown: feedback.rubric_breakdown.map((item) => ({ ...item })),
    top_fixes: Array.isArray(feedback.top_fixes) ? feedback.top_fixes.map((fix) => ({ ...fix })) : [],
    do_next_checklist: Array.isArray(feedback.do_next_checklist)
      ? [...feedback.do_next_checklist]
      : [],
    sentiment_profile: feedback.sentiment_profile
      ? { ...feedback.sentiment_profile }
      : undefined,
  };

  const adjustments: RubricPolicyScoreAdjustment[] = [];

  for (const rule of policy.hard_caps) {
    if (!missingTerms.includes(rule.required_term)) continue;

    nextFeedback.rubric_breakdown.forEach((item) => {
      const isTarget =
        rule.scope === 'all' ||
        (rule.scope === 'category' && rule.category === item.category);
      if (!isTarget) return;

      const before = item.score;
      const after = Math.min(before, rule.max_score);
      if (after >= before) return;

      item.score = after;
      item.rationale = `${item.rationale} Custom rubric cap applied: missing "${rule.required_term}" (max ${rule.max_score}/20).`
        .replace(/\s+/gu, ' ')
        .trim();

      adjustments.push({
        rule_id: rule.id,
        category: item.category,
        required_term: rule.required_term,
        max_score: rule.max_score,
        before_score: before,
        after_score: after,
        reason: `Missing required mention "${rule.required_term}" from uploaded rubric.`,
      });
    });
  }

  const termsWithAdjustments = new Set(adjustments.map((adjustment) => adjustment.required_term));
  const unresolvedTerms = missingTerms.filter((term) => !termsWithAdjustments.has(term));
  unresolvedTerms.forEach((requiredTerm, index) => {
    const target = nextFeedback.rubric_breakdown
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (!target) return;

    const before = target.score;
    const after = Math.max(0, before - 2);
    if (after === before) return;

    target.score = after;
    target.rationale = `${target.rationale} Custom rubric minimum penalty: missing "${requiredTerm}" (-2 points).`
      .replace(/\s+/gu, ' ')
      .trim();
    adjustments.push({
      rule_id: `min-penalty-${index + 1}`,
      category: target.category,
      required_term: requiredTerm,
      max_score: after,
      before_score: before,
      after_score: after,
      reason: `Missing required mention "${requiredTerm}" from uploaded rubric.`,
    });
  });

  if (adjustments.length > 0) {
    const scoreTotal = nextFeedback.rubric_breakdown.reduce(
      (sum, item) => sum + Math.max(0, Math.min(item.max_score, item.score)),
      0,
    );
    nextFeedback.overall_score = Math.round(Math.max(0, Math.min(100, scoreTotal)));

    const firstAdjustment = adjustments[0];
    const requiredTerm = firstAdjustment.required_term;
    const customFix: TopFixLike = {
      rank: 1,
      category: firstAdjustment.category,
      issue: `Uploaded rubric requires "${requiredTerm}" but the pitch does not include it.`,
      fix: `Add a clear "${requiredTerm}" mention tied to your core claim and ask.`,
      impact: 'high',
    };

    const existingFixes = nextFeedback.top_fixes ?? [];
    nextFeedback.top_fixes = [customFix, ...existingFixes]
      .slice(0, 5)
      .map((fix, index) => ({ ...fix, rank: index + 1 }));

    if (typeof nextFeedback.one_line_verdict === 'string' && nextFeedback.one_line_verdict.length > 0) {
      nextFeedback.one_line_verdict = `${nextFeedback.one_line_verdict} Custom rubric penalty: missing "${requiredTerm}".`
        .replace(/\s+/gu, ' ')
        .trim();
    }

    if (Array.isArray(nextFeedback.do_next_checklist)) {
      const checklist = nextFeedback.do_next_checklist;
      checklist.unshift(`Explicitly mention "${requiredTerm}" to satisfy your uploaded rubric.`);
      nextFeedback.do_next_checklist = checklist.slice(0, 5);
    }

    if (nextFeedback.sentiment_profile) {
      const currentReadiness = Number.isFinite(nextFeedback.sentiment_profile.investor_readiness)
        ? Number(nextFeedback.sentiment_profile.investor_readiness)
        : 1;
      nextFeedback.sentiment_profile.investor_readiness = Math.min(currentReadiness, 0.35);
    }
  }

  return {
    feedback: nextFeedback,
    evaluation: {
      applied: true,
      policy_hash: policy.source_hash,
      rule_count: policy.hard_caps.length,
      missing_terms: missingTerms,
      adjustments,
    },
  };
}
