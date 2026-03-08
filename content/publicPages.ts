export type PublicPageKey = 'deliveryRubric' | 'scoringLogic' | 'growthPricing';

export interface PublicBreadcrumb {
  label: string;
  href: string;
}

export interface PublicPageHero {
  eyebrow: string;
  question: string;
  answer: string;
}

export interface PublicPageSection {
  title: string;
  body: string;
}

export interface PublicFaqItem {
  question: string;
  answer: string;
}

export interface PublicRelatedLink {
  href: string;
  label: string;
  description: string;
}

export interface PublicPageDefinition {
  key: PublicPageKey;
  slug: string;
  href: string;
  title: string;
  description: string;
  hero: PublicPageHero;
  sections: PublicPageSection[];
  faqs: PublicFaqItem[];
  breadcrumbs: PublicBreadcrumb[];
  relatedLinks: PublicRelatedLink[];
}

export const PUBLIC_PAGES: Record<PublicPageKey, PublicPageDefinition> = {
  deliveryRubric: {
    key: 'deliveryRubric',
    slug: 'delivery-rubric',
    href: '/delivery-rubric',
    title: 'Delivery Rubric',
    description:
      'Learn how Pitchr evaluates pacing, pauses, filler words, and delivery control before your next investor meeting.',
    hero: {
      eyebrow: 'Delivery rubric',
      question: 'What does Pitchr look for in pitch delivery?',
      answer:
        'Pitchr scores the signals investors feel first: pace, pauses, filler control, and whether your spoken story sounds calm enough to trust.',
    },
    sections: [
      {
        title: 'Hear the pitch before investors tune out',
        body:
          'A strong idea can still miss if the delivery rushes the room. This page explains the cues Pitchr uses to flag pacing spikes, hesitation, and distracting repetition.',
      },
      {
        title: 'Turn rough audio into coachable fixes',
        body:
          'Instead of vague notes, Pitchr turns your spoken take into concrete corrections you can practice again before the next meeting or demo day.',
      },
    ],
    faqs: [
      {
        question: 'Does Pitchr only care about filler words?',
        answer:
          'No. Filler words are one signal, but Pitchr also weighs tempo, pauses, and whether the delivery supports a confident narrative.',
      },
      {
        question: 'Can I use the rubric with a pasted script instead of audio?',
        answer:
          'Yes. Text helps with structure and clarity, while recorded delivery unlocks pacing and hesitation signals for a fuller rubric view.',
      },
    ],
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Delivery Rubric', href: '/delivery-rubric' },
    ],
    relatedLinks: [
      {
        href: '/delivery-rubric',
        label: 'Delivery Rubric',
        description: 'Review the spoken signals Pitchr tracks during practice.',
      },
      {
        href: '/scoring-logic',
        label: 'Scoring Logic',
        description: 'See how delivery rolls into the full investor-ready score.',
      },
      {
        href: '/growth-pricing',
        label: 'Growth Pricing',
        description: 'Understand what you can test for free before you upgrade.',
      },
      {
        href: '/blog',
        label: 'Journal',
        description: 'Read articles that sharpen live delivery and founder storytelling.',
      },
    ],
  },
  scoringLogic: {
    key: 'scoringLogic',
    slug: 'scoring-logic',
    href: '/scoring-logic',
    title: 'Scoring Logic',
    description:
      'Understand how Pitchr combines rubric categories, ranked fixes, and delivery signals into an investor-ready score.',
    hero: {
      eyebrow: 'Scoring logic',
      question: 'How does Pitchr turn a pitch into a score?',
      answer:
        'Pitchr maps your pitch against structure, clarity, evidence, market, and delivery so the score reflects what investors need to hear next.',
    },
    sections: [
      {
        title: 'A scorecard built around investor questions',
        body:
          'The system scores the parts of a pitch that affect conviction: how clear the story is, whether claims are supported, and how well the delivery carries the message.',
      },
      {
        title: 'Fixes are ranked so the next rehearsal matters',
        body:
          'Pitchr does not stop at a number. It orders the highest-leverage changes so founders know what to tighten first before rewriting or recording another take.',
      },
    ],
    faqs: [
      {
        question: 'Is the score only based on one rubric category?',
        answer:
          'No. The overall score synthesizes multiple rubric dimensions so one strong area cannot fully hide a weak story or weak proof.',
      },
      {
        question: 'Does Pitchr score body language?',
        answer:
          'Not in this release. The scoring logic focuses on spoken and written pitch quality rather than camera-based body language analysis.',
      },
    ],
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Scoring Logic', href: '/scoring-logic' },
    ],
    relatedLinks: [
      {
        href: '/delivery-rubric',
        label: 'Delivery Rubric',
        description: 'Trace the live delivery inputs that influence the score.',
      },
      {
        href: '/scoring-logic',
        label: 'Scoring Logic',
        description: 'Review how the full scorecard translates into ranked fixes.',
      },
      {
        href: '/growth-pricing',
        label: 'Growth Pricing',
        description: 'Check which scoring workflows are available on free and paid plans.',
      },
      {
        href: '/blog',
        label: 'Journal',
        description: 'Follow the editorial breakdowns behind better scoring decisions.',
      },
    ],
  },
  growthPricing: {
    key: 'growthPricing',
    slug: 'growth-pricing',
    href: '/growth-pricing',
    title: 'Growth Pricing',
    description:
      'See how Pitchr’s free and paid plans support founders who want feedback now and deeper practice over time.',
    hero: {
      eyebrow: 'Growth pricing',
      question: 'What can founders do with Pitchr before they pay?',
      answer:
        'Pitchr is built so teams can start with free scoring, understand the upgrade path quickly, and expand usage only when practice becomes part of the fundraising routine.',
    },
    sections: [
      {
        title: 'Start with enough room to validate the workflow',
        body:
          'The free tier lets founders feel the score, fixes, and rewrite loop before they commit to a recurring coaching workflow.',
      },
      {
        title: 'Upgrade when repetition becomes an advantage',
        body:
          'Paid access is for teams that want more practice volume, more scoring passes, and a predictable system for sharpening every investor-facing story.',
      },
    ],
    faqs: [
      {
        question: 'Do I need a paid plan to try Pitchr?',
        answer:
          'No. The product is designed so founders can test the core scoring experience first and decide later whether they need more depth or volume.',
      },
      {
        question: 'Is the Journal part of the paid product?',
        answer:
          'No. The Journal stays public so founders can learn from the same playbooks even before they create an account.',
      },
    ],
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Growth Pricing', href: '/growth-pricing' },
    ],
    relatedLinks: [
      {
        href: '/delivery-rubric',
        label: 'Delivery Rubric',
        description: 'Connect pricing to the delivery practice loop founders repeat most.',
      },
      {
        href: '/scoring-logic',
        label: 'Scoring Logic',
        description: 'See the scoring workflow that sits behind every plan.',
      },
      {
        href: '/growth-pricing',
        label: 'Growth Pricing',
        description: 'Review the founder-friendly path from free access to heavier usage.',
      },
      {
        href: '/blog',
        label: 'Journal',
        description: 'Browse public strategy notes before you decide how to invest.',
      },
    ],
  },
};

export const PUBLIC_PAGE_ORDER: PublicPageKey[] = [
  'deliveryRubric',
  'scoringLogic',
  'growthPricing',
];
