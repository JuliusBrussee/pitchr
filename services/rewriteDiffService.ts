import type {
  RewriteDiff,
  RewriteDiffGrammarTag,
  RewriteDiffHunk,
  RewriteDiffToken,
} from '@/types/analysis-v2';

interface SequenceOp {
  kind: RewriteDiffToken['kind'];
  value: string;
  grammar_tag?: RewriteDiffGrammarTag;
}

const ARTICLE_TOKENS = new Set(['a', 'an', 'the']);
const AGREEMENT_TOKENS = new Set(['is', 'are', 'was', 'were', 'has', 'have', 'do', 'does']);

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function tokenize(text: string): string[] {
  return text.match(/\w+|[^\s\w]/gu) ?? [];
}

function isPunctuation(token: string): boolean {
  return /^[^\p{L}\p{N}]+$/u.test(token);
}

function grammarTag(token: string): RewriteDiffGrammarTag {
  const lower = token.toLowerCase();
  if (isPunctuation(token)) return 'punctuation';
  if (ARTICLE_TOKENS.has(lower)) return 'article';
  if (AGREEMENT_TOKENS.has(lower)) return 'agreement';
  if (
    lower.endsWith('ed') ||
    lower.endsWith('ing') ||
    lower === 'will' ||
    lower === 'would' ||
    lower === 'did'
  ) {
    return 'tense';
  }
  return 'word_choice';
}

function lcsTable(left: string[], right: string[]): number[][] {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (left[i - 1].toLowerCase() === right[j - 1].toLowerCase()) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table;
}

function diffTokens(left: string[], right: string[]): SequenceOp[] {
  const table = lcsTable(left, right);
  const ops: SequenceOp[] = [];

  let i = left.length;
  let j = right.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && left[i - 1].toLowerCase() === right[j - 1].toLowerCase()) {
      ops.push({ kind: 'context', value: right[j - 1] });
      i -= 1;
      j -= 1;
      continue;
    }

    if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      const token = right[j - 1];
      ops.push({
        kind: 'add',
        value: token,
        grammar_tag: grammarTag(token),
      });
      j -= 1;
      continue;
    }

    if (i > 0) {
      const token = left[i - 1];
      ops.push({
        kind: 'remove',
        value: token,
        grammar_tag: grammarTag(token),
      });
      i -= 1;
    }
  }

  return ops.reverse();
}

function buildHunkSummary(tokens: RewriteDiffToken[]): string | undefined {
  const addCount = tokens.filter((token) => token.kind === 'add').length;
  const removeCount = tokens.filter((token) => token.kind === 'remove').length;
  if (addCount === 0 && removeCount === 0) return undefined;
  return `Edits: +${addCount} / -${removeCount}`;
}

export function buildSectionRewriteDiff(
  originalQuotes: string[],
  rewrite: string | undefined,
): RewriteDiff | undefined {
  if (!rewrite || originalQuotes.length === 0) return undefined;
  const originalText = originalQuotes.join(' ');
  return buildRewriteDiff(originalText, rewrite);
}

export function buildRewriteDiff(originalText: string, rewriteText: string): RewriteDiff {
  const leftSentences = splitSentences(originalText);
  const rightSentences = splitSentences(rewriteText);
  const maxLen = Math.max(leftSentences.length, rightSentences.length);

  const hunks: RewriteDiffHunk[] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;

  for (let index = 0; index < maxLen; index += 1) {
    const originalSentence = leftSentences[index] ?? '';
    const rewriteSentence = rightSentences[index] ?? '';

    const tokens = diffTokens(tokenize(originalSentence), tokenize(rewriteSentence));
    const addCount = tokens.filter((token) => token.kind === 'add').length;
    const removeCount = tokens.filter((token) => token.kind === 'remove').length;
    if (addCount > 0 || removeCount > 0) changed += 1;
    added += addCount;
    removed += removeCount;

    hunks.push({
      id: `hunk-${index + 1}`,
      original_text: originalSentence,
      rewrite_text: rewriteSentence,
      tokens,
      summary: buildHunkSummary(tokens),
    });
  }

  const denominator = Math.max(1, added + removed + changed);
  const alignmentScore = Math.max(0, Math.min(1, 1 - (added + removed) / denominator));

  return {
    hunks,
    stats: {
      added,
      removed,
      changed,
    },
    alignment_score: Number(alignmentScore.toFixed(4)),
  };
}
