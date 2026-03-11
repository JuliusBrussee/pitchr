export interface ChapterConfig {
  slug: string;
  number: number;
  title: string;
  verb: string;
  tagline: string;
  color: string;
  /** Old feature slugs that redirect to this chapter */
  merges: string[];
  /** Demo slugs from FeatureHeroDemo to show side by side */
  demos: string[];
  demoLabels: string[];
  hook: string;
  ctaHeadline: string;
  ctaDescription: string;
}

export const CHAPTERS: ChapterConfig[] = [
  {
    slug: 'analyze',
    number: 1,
    title: 'Analyze',
    verb: 'Understand where you stand',
    tagline: 'Your pitch gets a dual diagnosis — a 100-point score with rubric breakdown, plus delivery metrics that reveal how you actually sound to investors.',
    color: '#ff5941',
    merges: ['score-rubric', 'delivery-metrics'],
    demos: ['score-rubric', 'delivery-metrics'],
    demoLabels: ['Score & Rubric', 'Delivery Metrics'],
    hook: 'You thought your pitch was a 90. Investors heard a 52.',
    ctaHeadline: 'Know your real score.',
    ctaDescription: 'Understanding the gap is the first step to closing it.',
  },
  {
    slug: 'improve',
    number: 2,
    title: 'Improve',
    verb: 'Transform your pitch',
    tagline: 'Ranked fixes show exactly what to change and why. Then the AI rewrites your entire pitch with every fix applied — in your voice.',
    color: '#22c55e',
    merges: ['top-fixes', 'ai-rewrite'],
    demos: ['top-fixes', 'ai-rewrite'],
    demoLabels: ['Top Fixes', 'AI Rewrite'],
    hook: 'Three small fixes turned a polite nod into a follow-up email.',
    ctaHeadline: 'See the transformation.',
    ctaDescription: 'Small fixes, compounding impact.',
  },
  {
    slug: 'prepare',
    number: 3,
    title: 'Prepare',
    verb: 'Be ready for the room',
    tagline: 'AI-generated investor questions stress-test your pitch. Deck analysis scores every slide. Walk in ready for anything.',
    color: '#3b82f6',
    merges: ['qa-pack', 'deck-analysis'],
    demos: ['qa-pack', 'deck-analysis'],
    demoLabels: ['QA Pack', 'Deck Analysis'],
    hook: 'The question that sinks most founders isn\'t hard — it\'s unexpected.',
    ctaHeadline: 'Prepare for the hardest room.',
    ctaDescription: 'Confidence comes from knowing you\'re ready.',
  },
  {
    slug: 'track',
    number: 4,
    title: 'Track',
    verb: 'Measure your growth',
    tagline: 'Score timelines, category trends, and improvement velocity. Watch your pitch evolve from rough draft to investor-ready.',
    color: '#ffaa33',
    merges: ['progress', 'analytics'],
    demos: ['progress', 'analytics'],
    demoLabels: ['Progress Dashboard', 'Analytics'],
    hook: 'Day 1: score 47. Day 14: score 83. Here\'s what happened in between.',
    ctaHeadline: 'Track every session.',
    ctaDescription: 'What gets measured gets improved.',
  },
  {
    slug: 'compete',
    number: 5,
    title: 'Compete',
    verb: 'Level up with others',
    tagline: 'Projects keep every pitch organized. Separate workspaces for every fundraise, demo day, and conference talk.',
    color: '#8b5cf6',
    merges: ['projects'],
    demos: ['projects'],
    demoLabels: ['Projects'],
    hook: 'One pitch deck doesn\'t fit every audience.',
    ctaHeadline: 'Stay organized.',
    ctaDescription: 'Every pitch deserves its own workspace.',
  },
];

export function getChapterBySlug(slug: string): ChapterConfig | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

/** Maps old feature slugs to their parent chapter slug */
export function getRedirectChapter(oldSlug: string): string | undefined {
  const chapter = CHAPTERS.find((c) => c.merges.includes(oldSlug));
  return chapter?.slug;
}

export function getNextChapter(currentSlug: string): ChapterConfig | undefined {
  const idx = CHAPTERS.findIndex((c) => c.slug === currentSlug);
  if (idx === -1 || idx >= CHAPTERS.length - 1) return undefined;
  return CHAPTERS[idx + 1];
}

export function getPrevChapter(currentSlug: string): ChapterConfig | undefined {
  const idx = CHAPTERS.findIndex((c) => c.slug === currentSlug);
  if (idx <= 0) return undefined;
  return CHAPTERS[idx - 1];
}
