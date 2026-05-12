import type {
  FeedbackOutput,
  KnowledgeDigestCategory,
  ScoreCategory,
  ScoringContext,
} from '@/types/analysis-v2';

const GENERIC_PATTERNS = [
  /\b(be more|improve|better|stronger|tighten|sharper|clearer)\b/iu,
  /\b(add detail|more details|be specific|be concise)\b/iu,
  /\b(good|okay|fine|solid)\b/iu,
  /\b(vague|generic|unclear)\b/iu,
];

const SOURCE_REFERENCE_PATTERNS = [
  /\bYC\b/giu,
  /\bY\s?Combinator\b/giu,
  /\bSequoia\b/giu,
  /\bOpenVC\b/giu,
  /\bSlidebean\b/giu,
  /\baccording to\b/giu,
  /\bsource(?:s)?\b/giu,
  /https?:\/\/\S+/giu,
];

const ANTI_PATTERN_CATEGORY_HINTS: Record<string, KnowledgeDigestCategory[]> = {
  no_proof: ['evidence', 'market'],
  no_ask: ['structure', 'market'],
  tam_only: ['market', 'evidence'],
  jargon_overload: ['clarity'],
  slide_overload: ['structure', 'delivery'],
};

export interface KnowledgeCalibrationResult {
  feedback: FeedbackOutput;
  rulesUsedCount: number;
}

function toKnowledgeCategory(category: ScoreCategory): KnowledgeDigestCategory {
  switch (category) {
    case 'deck_narrative':
      return 'structure';
    case 'deck_clarity':
    case 'deck_design':
      return 'clarity';
    case 'deck_evidence':
      return 'evidence';
    case 'deck_ask':
      return 'market';
    default:
      return category;
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/gu, ' ').trim();
}

function stripSourceReferences(text: string): string {
  let output = text;
  for (const pattern of SOURCE_REFERENCE_PATTERNS) {
    output = output.replace(pattern, '');
  }
  output = output
    .replace(/\(\s*\)/gu, '')
    .replace(/\s+,/gu, ',')
    .replace(/\s+\./gu, '.')
    .replace(/\s+;/gu, ';')
    .replace(/\s{2,}/gu, ' ')
    .trim();

  return output.length > 0 ? output : normalizeText(text);
}

function hasConcreteSignal(text: string): boolean {
  return /\b\d+([.,]\d+)?\b/u.test(text) || /\b(arr|mrr|revenue|customers|months|weeks|percent|%)\b/iu.test(text);
}

function isGenericText(text: string): boolean {
  const normalized = normalizeText(text);
  if (normalized.length < 28) return true;
  if (GENERIC_PATTERNS.some((pattern) => pattern.test(normalized)) && !hasConcreteSignal(normalized)) {
    return true;
  }
  return false;
}

function guidanceForCategory(
  context: ScoringContext,
  category: KnowledgeDigestCategory,
  index: number,
): string {
  const antiPatternGuidance = context.detected_anti_patterns
    .filter((hit) => hit.hit)
    .find((hit) => (ANTI_PATTERN_CATEGORY_HINTS[hit.label] ?? []).includes(category));

  if (antiPatternGuidance) {
    const playbook = context.knowledge_digest.anti_pattern_playbook[antiPatternGuidance.label];
    if (playbook) return playbook;
  }

  const categoryGuidance = context.knowledge_digest.category_guidance[category];
  if (categoryGuidance.length > 0) {
    return categoryGuidance[index % categoryGuidance.length];
  }

  if (context.knowledge_digest.do_rules.length > 0) {
    return context.knowledge_digest.do_rules[index % context.knowledge_digest.do_rules.length];
  }

  return 'Convert the claim into one concrete investor-relevant proof point.';
}

function issueTemplate(
  category: KnowledgeDigestCategory,
  context: ScoringContext,
): string {
  const antiPatternEvidence = context.detected_anti_patterns.find(
    (hit) => hit.hit && (ANTI_PATTERN_CATEGORY_HINTS[hit.label] ?? []).includes(category),
  );

  if (antiPatternEvidence) {
    return normalizeText(antiPatternEvidence.evidence);
  }

  switch (category) {
    case 'structure':
      return 'Narrative sequence is not yet tight enough for an investor decision flow.';
    case 'clarity':
      return 'Wording remains broad and hides the exact investor takeaway.';
    case 'evidence':
      return 'Core claims are not anchored by enough measurable proof.';
    case 'market':
      return 'Market narrative lacks concrete wedge and why-now execution signals.';
    case 'delivery':
      return 'Delivery weakens emphasis on the highest-leverage proof statements.';
    default:
      return 'Feedback is still generic and needs concrete investor-facing specifics.';
  }
}

export function calibrateFeedbackWithKnowledge(
  feedback: FeedbackOutput,
  context: ScoringContext,
): KnowledgeCalibrationResult {
  let rulesUsedCount = 0;

  const sanitizedVerdict = stripSourceReferences(feedback.one_line_verdict);

  const rubric_breakdown = feedback.rubric_breakdown.map((item, index) => {
    const category = toKnowledgeCategory(item.category);
    const sanitizedRationale = stripSourceReferences(item.rationale);
    if (!isGenericText(sanitizedRationale)) {
      return { ...item, rationale: sanitizedRationale };
    }

    rulesUsedCount += 1;
    return {
      ...item,
      rationale: normalizeText(guidanceForCategory(context, category, index)),
    };
  });

  const top_fixes = feedback.top_fixes.map((fix, index) => {
    const category = toKnowledgeCategory(fix.category);
    const sanitizedIssue = stripSourceReferences(fix.issue);
    const sanitizedFix = stripSourceReferences(fix.fix);

    let nextIssue = sanitizedIssue;
    let nextFix = sanitizedFix;

    if (isGenericText(sanitizedIssue)) {
      nextIssue = issueTemplate(category, context);
      rulesUsedCount += 1;
    }

    if (isGenericText(sanitizedFix)) {
      nextFix = normalizeText(guidanceForCategory(context, category, index));
      rulesUsedCount += 1;
    }

    return {
      ...fix,
      issue: nextIssue,
      fix: nextFix,
    };
  });

  const do_next_checklist = feedback.do_next_checklist.map((item) => stripSourceReferences(item));

  return {
    feedback: {
      ...feedback,
      one_line_verdict: sanitizedVerdict,
      rubric_breakdown,
      top_fixes,
      rewrite_script: stripSourceReferences(feedback.rewrite_script),
      do_next_checklist,
    },
    rulesUsedCount,
  };
}
