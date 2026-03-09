export interface FeatureBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureConfig {
  slug: string;
  label: string;
  headline: string;
  tagline: string;
  benefits: FeatureBenefit[];
  color: string;
}

export const FEATURES: FeatureConfig[] = [
  {
    slug: 'score-rubric',
    label: 'Score & Rubric',
    headline: 'Know exactly where your pitch stands.',
    tagline: 'Get an investor-grade score out of 100 with a detailed breakdown across 5 rubric categories. No more guessing — see precisely what works and what needs improvement.',
    benefits: [
      { icon: '🎯', title: 'Precise 100-Point Scale', description: 'Not a vague thumbs-up. A calibrated score that maps to real investor sentiment.' },
      { icon: '📊', title: '5 Rubric Categories', description: 'Structure, Clarity, Evidence, Market, and Delivery — the dimensions VCs actually evaluate.' },
      { icon: '⚡', title: 'Instant Results', description: 'Get your full breakdown in under 30 seconds. No waiting for human reviewers.' },
    ],
    color: '#ff5941',
  },
  {
    slug: 'top-fixes',
    label: 'Top Fixes',
    headline: 'Fix what matters most, first.',
    tagline: 'Prioritized improvements ranked by investor impact. Each fix tells you exactly what to change and why it matters.',
    benefits: [
      { icon: '🏆', title: 'Impact-Ranked', description: 'High, medium, and low impact fixes so you know where to focus your energy.' },
      { icon: '🔧', title: 'Actionable Rewrites', description: 'Not just "improve your evidence" — specific suggestions you can apply immediately.' },
      { icon: '📈', title: 'Score Predictions', description: 'See the estimated point gain from each fix before you make changes.' },
    ],
    color: '#ef4444',
  },
  {
    slug: 'ai-rewrite',
    label: 'AI Rewrite',
    headline: 'Your pitch, rewritten by AI.',
    tagline: 'Get a polished version of your pitch with all top fixes applied. Compare before and after, then copy and practice.',
    benefits: [
      { icon: '✍️', title: 'Side-by-Side Diff', description: 'See exactly what changed between your original and the rewritten version.' },
      { icon: '🎭', title: 'Voice Preservation', description: 'The rewrite sounds like you, not a robot. Your personality, better structured.' },
      { icon: '📋', title: 'One-Click Copy', description: 'Copy the rewritten script directly to your clipboard and start practicing.' },
    ],
    color: '#22c55e',
  },
  {
    slug: 'delivery-metrics',
    label: 'Delivery Metrics',
    headline: 'Every um. Every pause. Every second.',
    tagline: 'Real-time analysis of your speaking pace, filler words, and timing. The metrics that separate a good pitch from a forgettable one.',
    benefits: [
      { icon: '🎤', title: 'WPM Analysis', description: 'Speaking too fast or too slow? Get real-time pacing feedback with optimal ranges.' },
      { icon: '🔇', title: 'Filler Detection', description: 'Every "um", "like", and "basically" counted and flagged with timestamps.' },
      { icon: '⏱️', title: 'Time Compliance', description: 'Stay within your target duration with visual progress tracking.' },
    ],
    color: '#ffaa33',
  },
  {
    slug: 'qa-pack',
    label: 'QA Pack',
    headline: 'Prep for the hard questions.',
    tagline: 'AI-generated investor questions tailored to your specific pitch, with suggested answers to help you prepare for the real thing.',
    benefits: [
      { icon: '❓', title: 'Pitch-Specific Questions', description: 'Questions generated from your actual pitch content, not generic templates.' },
      { icon: '💡', title: 'Suggested Answers', description: 'Framework answers to help you prepare confident, structured responses.' },
      { icon: '🎯', title: 'Weakness Targeting', description: 'Questions focus on your pitch\'s weakest areas to build resilience.' },
    ],
    color: '#3b82f6',
  },
  {
    slug: 'deck-analysis',
    label: 'Deck Analysis',
    headline: 'Score your slides too.',
    tagline: 'Upload your pitch deck and get per-slide scores, visual feedback, and specific suggestions for improving your presentation materials.',
    benefits: [
      { icon: '🖼️', title: 'Per-Slide Scoring', description: 'Individual scores for each slide so you know exactly which ones need work.' },
      { icon: '📐', title: 'Visual Feedback', description: 'Layout, readability, and design suggestions for maximum impact.' },
      { icon: '🔗', title: 'Pitch + Deck Sync', description: 'See how your verbal pitch and deck work together as a complete package.' },
    ],
    color: '#8b5cf6',
  },
  {
    slug: 'progress',
    label: 'Progress Dashboard',
    headline: 'Watch your score climb.',
    tagline: 'Track your pitch performance over time with visual score timelines, session history, and improvement trends.',
    benefits: [
      { icon: '📈', title: 'Score Timeline', description: 'See your score trajectory across sessions with color-coded performance zones.' },
      { icon: '🔍', title: 'Category Trends', description: 'Track improvement in each rubric category independently.' },
      { icon: '🏅', title: 'Milestones', description: 'Celebrate when you hit the Investor-Ready threshold and beyond.' },
    ],
    color: '#ff5941',
  },
  {
    slug: 'analytics',
    label: 'Analytics',
    headline: 'Deep dive into your data.',
    tagline: 'Comprehensive analytics across all your sessions. Category breakdowns, delivery patterns, and improvement velocity — all in one place.',
    benefits: [
      { icon: '📊', title: 'Category Breakdown', description: 'Aggregate performance across Structure, Clarity, Evidence, Market, and Delivery.' },
      { icon: '⚡', title: 'Improvement Velocity', description: 'How fast are you improving? Track your week-over-week score changes.' },
      { icon: '🎯', title: 'Focus Areas', description: 'Data-driven recommendations for what to work on next.' },
    ],
    color: '#3b82f6',
  },
  {
    slug: 'arena',
    label: 'Arena & Challenges',
    headline: 'Compete. Improve. Win.',
    tagline: 'Weekly challenges, leaderboards, and community competition to keep you motivated and improving.',
    benefits: [
      { icon: '🏆', title: 'Weekly Challenges', description: 'Themed challenges with different constraints to sharpen specific skills.' },
      { icon: '🥇', title: 'Leaderboards', description: 'See how you stack up against other founders practicing their pitches.' },
      { icon: '🔥', title: 'Streaks & Badges', description: 'Stay motivated with practice streaks and achievement badges.' },
    ],
    color: '#ffaa33',
  },
  {
    slug: 'projects',
    label: 'Projects',
    headline: 'Organize every pitch.',
    tagline: 'Separate projects for different pitches — Series A, product demo, elevator pitch. Each with its own history and analytics.',
    benefits: [
      { icon: '📁', title: 'Multiple Pitches', description: 'Organize different pitches into separate projects with independent tracking.' },
      { icon: '📊', title: 'Per-Project Analytics', description: 'See progress and trends for each project individually.' },
      { icon: '🔄', title: 'Version History', description: 'Access every version of every pitch with full session history.' },
    ],
    color: '#22c55e',
  },
];

export function getFeatureBySlug(slug: string): FeatureConfig | undefined {
  return FEATURES.find((f) => f.slug === slug);
}
