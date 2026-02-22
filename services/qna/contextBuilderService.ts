import { getRun } from '@/services/runService';
import {
  lookupLocalKnowledge,
  queueKnowledgeGapIfNeeded,
} from '@/services/qna/knowledgeService';
import type { Citation, OneMinuteQAPack } from '@/types/analysis-v2';

export interface QaStarterContext {
  runId: string;
  starterContext: string;
  weakestCategories: string[];
  drillPack?: OneMinuteQAPack;
  knowledgeConfidence: number;
  citations: Citation[];
  queuedKnowledgeGap: boolean;
}

function clip(text: string, max = 220): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}...`;
}

export async function buildQaStarterContext(runId: string): Promise<QaStarterContext> {
  const run = await getRun(runId);
  const feedback = run.analysis.outputs.feedback;

  const weakestCategories = [...feedback.rubric_breakdown]
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((item) => `${item.category} (${item.score}/${item.max_score})`);

  const sectionWeaknesses = (feedback.section_feedback ?? [])
    .filter((section) => section.bad.trim().length > 0)
    .slice(0, 3)
    .map((section) => `${section.beat}: ${clip(section.bad, 120)}`);

  const historical = (feedback.historical_links ?? [])
    .slice(0, 2)
    .map((link) => `${link.run_id}: delta ${link.overall_delta >= 0 ? '+' : ''}${link.overall_delta}`);

  const queryText = [
    feedback.one_line_verdict,
    weakestCategories.join(' '),
    feedback.top_fixes.map((fix) => fix.issue).join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  const knowledge = await lookupLocalKnowledge(queryText);
  const queuedKnowledgeGap = await queueKnowledgeGapIfNeeded({
    runId,
    topic: weakestCategories[0] ?? 'general',
    queryText,
    confidence: knowledge.confidence,
  });

  const diffStats = feedback.rewrite_diff?.stats;
  const contextLines = [
    `Mode: ${run.mode}`,
    `Overall score: ${feedback.overall_score}/100`,
    `Verdict: ${feedback.one_line_verdict}`,
    `Weakest categories: ${weakestCategories.join(', ') || 'n/a'}`,
    `Top fixes: ${feedback.top_fixes.slice(0, 3).map((fix) => fix.fix).join(' | ')}`,
    sectionWeaknesses.length > 0
      ? `Section risks: ${sectionWeaknesses.join(' | ')}`
      : 'Section risks: n/a',
    diffStats
      ? `Rewrite delta: +${diffStats.added} / -${diffStats.removed}, changed hunks ${diffStats.changed}`
      : 'Rewrite delta: n/a',
    historical.length > 0 ? `Historical deltas: ${historical.join(' | ')}` : 'Historical deltas: n/a',
    knowledge.summary ? `Knowledge snippets: ${clip(knowledge.summary, 600)}` : 'Knowledge snippets: n/a',
  ];

  const drillPack = run.analysis.outputs.qa_1min;

  return {
    runId,
    starterContext: contextLines.join('\n'),
    weakestCategories,
    drillPack,
    knowledgeConfidence: knowledge.confidence,
    citations: knowledge.citations,
    queuedKnowledgeGap,
  };
}
