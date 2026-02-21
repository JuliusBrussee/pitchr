import type {
  ChecklistDefinition,
  ChecklistItemId,
  RealtimeChecklistItemState,
} from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';

export const REALTIME_CHECKLIST_ITEMS: readonly ChecklistDefinition[] = [
  {
    id: 'intro_hook',
    label: 'Introduction & hook',
    description:
      'Open with who you are, what you do, and why this matters immediately.',
    order: 1,
    requiredModes: ['elevator', 'vc_pitch'],
    cuePatterns: [
      '\\bmy name is\\b',
      '\\bi am\\b',
      '\\bwe are\\b',
      '\\bimagine\\b',
      '\\btoday\\b',
      '\\bright now\\b',
    ],
    semanticHints: [
      'founder intro',
      'company one-liner',
      'opening hook',
      'stakes setup',
    ],
  },
  {
    id: 'problem_statement',
    label: 'Problem statement',
    description:
      'State the pain clearly and make the cost of the problem explicit.',
    order: 2,
    requiredModes: ['elevator', 'vc_pitch'],
    cuePatterns: [
      '\\bproblem\\b',
      '\\bpain\\b',
      '\\bfrustrating\\b',
      '\\bbroken\\b',
      '\\bwaste\\b',
      '\\bhard to\\b',
    ],
    semanticHints: [
      'customer pain',
      'cost of inaction',
      'current workflow failure',
    ],
  },
  {
    id: 'solution_overview',
    label: 'Solution overview',
    description:
      'Explain your product or approach and how it solves the problem.',
    order: 3,
    requiredModes: ['elevator', 'vc_pitch'],
    cuePatterns: [
      '\\bwe built\\b',
      '\\bwe created\\b',
      '\\bour platform\\b',
      '\\bour product\\b',
      '\\bwe help\\b',
      '\\bsolution\\b',
    ],
    semanticHints: [
      'product explanation',
      'how it works',
      'why solution is better',
    ],
  },
  {
    id: 'market_opportunity',
    label: 'Market opportunity',
    description:
      'Quantify market size or opportunity to show venture-scale potential.',
    order: 4,
    requiredModes: ['elevator', 'vc_pitch'],
    cuePatterns: [
      '\\bmarket\\b',
      '\\btam\\b',
      '\\bsam\\b',
      '\\bmillion\\b',
      '\\bbillion\\b',
      '\\bindustry\\b',
    ],
    semanticHints: [
      'market sizing',
      'opportunity framing',
      'demand context',
    ],
  },
  {
    id: 'business_model',
    label: 'Business model',
    description:
      'Show how the company makes money with pricing or revenue mechanics.',
    order: 5,
    requiredModes: ['vc_pitch'],
    cuePatterns: [
      '\\bwe charge\\b',
      '\\bsubscription\\b',
      '\\bcommission\\b',
      '\\bmargin\\b',
      '\\bpricing\\b',
      '\\btake rate\\b',
    ],
    semanticHints: [
      'monetization',
      'pricing model',
      'unit economics',
    ],
  },
  {
    id: 'traction_metrics',
    label: 'Traction & metrics',
    description:
      'Provide concrete proof points like growth, revenue, users, or retention.',
    order: 6,
    requiredModes: ['vc_pitch'],
    cuePatterns: [
      '\\bgrowth\\b',
      '\\bgrowing\\b',
      '\\brevenue\\b',
      '\\brun rate\\b',
      '\\busers\\b',
      '\\bcustomers\\b',
      '\\b\\d+\\s*%\\b',
    ],
    semanticHints: [
      'proof points',
      'traction evidence',
      'quantified milestones',
    ],
  },
  {
    id: 'team',
    label: 'Team',
    description:
      'Establish founder or team credibility and why this team can win.',
    order: 7,
    requiredModes: ['vc_pitch'],
    cuePatterns: [
      '\\bfounder\\b',
      '\\bco-founder\\b',
      '\\bceo\\b',
      '\\bcto\\b',
      '\\bour team\\b',
      '\\bexperience\\b',
    ],
    semanticHints: [
      'team credibility',
      'domain expertise',
      'execution ability',
    ],
  },
  {
    id: 'ask',
    label: 'The ask',
    description:
      'Close with a clear ask: funding, customer action, or next-step CTA.',
    order: 8,
    requiredModes: ['elevator', 'vc_pitch'],
    cuePatterns: [
      '\\braising\\b',
      '\\bfunding\\b',
      '\\binvestment\\b',
      '\\bjoin us\\b',
      '\\bcome talk\\b',
      '\\bthank you\\b',
    ],
    semanticHints: [
      'fundraising ask',
      'clear close',
      'call to action',
    ],
  },
] as const;

export function getChecklistDefinitions(mode: PitchMode): ChecklistDefinition[] {
  return [...REALTIME_CHECKLIST_ITEMS]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...item,
      requiredModes: [...item.requiredModes],
      cuePatterns: [...item.cuePatterns],
      semanticHints: [...item.semanticHints],
    }));
}

export function getChecklistDefinitionMap(): Record<ChecklistItemId, ChecklistDefinition> {
  return REALTIME_CHECKLIST_ITEMS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<ChecklistItemId, ChecklistDefinition>,
  );
}

export function createInitialChecklistState(
  mode: PitchMode,
  nowIso: string = new Date().toISOString(),
): RealtimeChecklistItemState[] {
  return getChecklistDefinitions(mode).map((item) => ({
    id: item.id,
    label: item.label,
    status: 'uncovered',
    confidence: 0,
    evidence: '',
    required: item.requiredModes.includes(mode),
    lastUpdatedAt: nowIso,
  }));
}
