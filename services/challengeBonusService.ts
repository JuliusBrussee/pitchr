import type { Scenario } from '@/types/arena';

/* ——————————————————————————————————————————————————————————
 * Challenge Bonus Scoring Service
 *
 * Pure function — no DB access. Calculates bonus points (max 20)
 * for challenge submissions based on how well the pitch addresses
 * the scenario brief.
 * —————————————————————————————————————————————————————————— */

export interface BonusBreakdown {
  addressedMetrics: { score: number; max: 5; details: string[] };
  withinTimeLimit: { score: number; max: 5 };
  usedSpecificNumbers: { score: number; max: 5; details: string[] };
  clearAsk: { score: number; max: 5 };
}

/* ——— Helpers ——— */

/**
 * Extract numeric strings from a value. Handles formats like
 * "$1.2M", "500K", "120%", "10,000", "$50B TAM", etc.
 * Returns cleaned numeric fragments suitable for transcript matching.
 */
function extractNumbers(value: string): string[] {
  const results: string[] = [];

  // Match patterns like 1.2M, 500K, 50B, 120%, $10,000, etc.
  const numericPatterns = value.match(
    /[\d,]+(?:\.\d+)?(?:\s*[%])?|[\d,]+(?:\.\d+)?(?:\s*[kmbt](?:illion)?)?/gi,
  );

  if (numericPatterns) {
    for (const match of numericPatterns) {
      const cleaned = match.replace(/,/g, '').trim();
      if (cleaned && /\d/.test(cleaned)) {
        results.push(cleaned.toLowerCase());
      }
    }
  }

  // Also extract the raw digits without formatting (e.g., "1.2" from "$1.2M")
  const rawDigits = value.match(/\d+(?:\.\d+)?/g);
  if (rawDigits) {
    for (const digit of rawDigits) {
      if (!results.includes(digit)) {
        results.push(digit);
      }
    }
  }

  return results;
}

/**
 * Check if any of the given numeric strings appear in the transcript.
 */
function transcriptContainsNumber(transcript: string, numbers: string[]): boolean {
  return numbers.some((num) => transcript.includes(num));
}

/* ——— Scoring: Addressed Metrics (+5 max) ——— */

function scoreAddressedMetrics(
  transcript: string,
  metrics: Scenario['brief']['metrics'],
): { score: number; max: 5; details: string[] } {
  const details: string[] = [];
  let score = 0;

  const checks: Array<{ key: string; value: string | undefined; keywords: string[] }> = [
    {
      key: 'revenue',
      value: metrics.revenue,
      keywords: ['revenue', 'arr', 'mrr', 'sales', 'recurring'],
    },
    {
      key: 'users',
      value: metrics.users,
      keywords: ['users', 'customers', 'subscribers', 'active users', 'dau', 'mau'],
    },
    {
      key: 'growth rate',
      value: metrics.growthRate,
      keywords: ['growth', 'growing', 'grew', 'increase', 'yoy', 'mom', 'month over month', 'year over year'],
    },
  ];

  for (const check of checks) {
    if (!check.value) continue;

    const hasKeyword = check.keywords.some((kw) => transcript.includes(kw));
    const numbers = extractNumbers(check.value);
    const hasNumber = transcriptContainsNumber(transcript, numbers);

    if (hasKeyword || hasNumber) {
      score += 1;
      details.push(`Addressed ${check.key}`);
    }
  }

  // Check "other" metrics if present
  if (metrics.other) {
    for (const [key, value] of Object.entries(metrics.other)) {
      if (score >= 5) break;
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, ' ');
      const numbers = extractNumbers(value);
      const hasKey = transcript.includes(normalizedKey);
      const hasNumber = transcriptContainsNumber(transcript, numbers);

      if (hasKey || hasNumber) {
        score += 1;
        details.push(`Addressed ${key}`);
      }
    }
  }

  return { score: Math.min(5, score) as number, max: 5, details };
}

/* ——— Scoring: Within Time Limit (+5) ——— */

function scoreWithinTimeLimit(
  pitchDurationSec: number,
  timeLimitSec: number,
): { score: number; max: 5 } {
  return {
    score: pitchDurationSec <= timeLimitSec ? 5 : 0,
    max: 5,
  };
}

/* ——— Scoring: Used Specific Numbers (+5 max) ——— */

function scoreUsedSpecificNumbers(
  transcript: string,
  brief: Scenario['brief'],
): { score: number; max: 5; details: string[] } {
  const details: string[] = [];
  let score = 0;

  // Collect all number sources from the brief
  const numberSources: Array<{ label: string; value: string }> = [];

  if (brief.metrics.revenue) {
    numberSources.push({ label: 'revenue amount', value: brief.metrics.revenue });
  }
  if (brief.metrics.users) {
    numberSources.push({ label: 'user count', value: brief.metrics.users });
  }
  if (brief.metrics.growthRate) {
    numberSources.push({ label: 'growth rate', value: brief.metrics.growthRate });
  }
  if (brief.market.tam) {
    numberSources.push({ label: 'TAM', value: brief.market.tam });
  }
  if (brief.market.sam) {
    numberSources.push({ label: 'SAM', value: brief.market.sam });
  }
  if (brief.market.som) {
    numberSources.push({ label: 'SOM', value: brief.market.som });
  }
  if (brief.ask.amount) {
    numberSources.push({ label: 'ask amount', value: brief.ask.amount });
  }

  for (const source of numberSources) {
    if (score >= 5) break;

    const numbers = extractNumbers(source.value);
    if (numbers.length > 0 && transcriptContainsNumber(transcript, numbers)) {
      score += 1;
      details.push(`Used ${source.label} (${source.value})`);
    }
  }

  return { score: Math.min(5, score) as number, max: 5, details };
}

/* ——— Scoring: Clear Ask (+5) ——— */

const ASK_KEYWORDS = [
  'seeking',
  'raising',
  'invest',
  'funding',
  'ask',
  'raise',
  'looking for',
  'series',
  'seed round',
  'pre-seed',
  'round of',
  'capital',
  'investment',
];

function scoreClearAsk(
  transcript: string,
  brief: Scenario['brief'],
): { score: number; max: 5 } {
  // Check if the ask amount appears in the transcript
  const askNumbers = extractNumbers(brief.ask.amount);
  const hasAskAmount = transcriptContainsNumber(transcript, askNumbers);

  if (hasAskAmount) {
    return { score: 5, max: 5 };
  }

  // Check for ask-related keywords
  const hasAskKeyword = ASK_KEYWORDS.some((kw) => transcript.includes(kw));

  if (hasAskKeyword) {
    return { score: 5, max: 5 };
  }

  return { score: 0, max: 5 };
}

/* ——— Main ——— */

export function calculateChallengeBonus(
  transcript: string,
  scenario: Scenario,
  pitchDurationSec: number,
  timeLimitSec: number,
): { bonusScore: number; breakdown: BonusBreakdown } {
  const normalizedTranscript = transcript.toLowerCase();
  const { brief } = scenario;

  const addressedMetrics = scoreAddressedMetrics(normalizedTranscript, brief.metrics);
  const withinTimeLimit = scoreWithinTimeLimit(pitchDurationSec, timeLimitSec);
  const usedSpecificNumbers = scoreUsedSpecificNumbers(normalizedTranscript, brief);
  const clearAsk = scoreClearAsk(normalizedTranscript, brief);

  const bonusScore =
    addressedMetrics.score +
    withinTimeLimit.score +
    usedSpecificNumbers.score +
    clearAsk.score;

  return {
    bonusScore,
    breakdown: {
      addressedMetrics,
      withinTimeLimit,
      usedSpecificNumbers,
      clearAsk,
    },
  };
}
