export interface FeatureBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureStat {
  value: string;
  label: string;
}

export interface FeatureStep {
  step: number;
  title: string;
  description: string;
}

export interface FeatureUseCase {
  icon: string;
  title: string;
  description: string;
  persona: string;
}

export interface FeatureComparison {
  without: string;
  with: string;
}

export interface FeatureConfig {
  slug: string;
  label: string;
  headline: string;
  tagline: string;
  benefits: FeatureBenefit[];
  color: string;
  stats: FeatureStat[];
  howItWorks: FeatureStep[];
  useCases: FeatureUseCase[];
  comparison: FeatureComparison[];
  ctaHeadline: string;
  ctaDescription: string;
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
    stats: [
      { value: '100pt', label: 'Scoring Scale' },
      { value: '5', label: 'Rubric Categories' },
      { value: '<30s', label: 'Analysis Time' },
      { value: '87%', label: 'Accuracy vs VC Panels' },
    ],
    howItWorks: [
      { step: 1, title: 'Record or paste your pitch', description: 'Speak your pitch into the mic or paste your script. Pitchr supports both audio and text input.' },
      { step: 2, title: 'AI analyzes against VC rubric', description: 'Our model evaluates your pitch across Structure, Clarity, Evidence, Market, and Delivery — the exact criteria real investors use.' },
      { step: 3, title: 'Get your score & breakdown', description: 'See your overall score out of 100 plus individual category scores with a visual radar chart.' },
    ],
    useCases: [
      { icon: '🚀', title: 'Pre-Meeting Confidence Check', persona: 'First-time founder', description: 'Run your pitch through Pitchr 30 minutes before your investor call to know exactly where you stand.' },
      { icon: '🎓', title: 'Accelerator Demo Day Prep', persona: 'Accelerator cohort', description: 'Score your 3-minute demo day pitch and iterate until you hit 80+ across all categories.' },
      { icon: '📊', title: 'Team Pitch Calibration', persona: 'Co-founders', description: 'Have each co-founder pitch independently and compare scores to decide who delivers best.' },
    ],
    comparison: [
      { without: 'Ask friends who say "sounds great!" every time', with: 'Get a calibrated 100-point score mapped to VC standards' },
      { without: 'Guess which parts of your pitch are weak', with: 'See exact category-by-category breakdown' },
      { without: 'Wait days for advisor feedback', with: 'Get results in under 30 seconds' },
    ],
    ctaHeadline: 'Stop guessing. Start scoring.',
    ctaDescription: 'Know your pitch score before investors do.',
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
    stats: [
      { value: '3-5', label: 'Fixes Per Session' },
      { value: '+12pts', label: 'Avg Score Improvement' },
      { value: '3', label: 'Impact Levels' },
      { value: '~2min', label: 'To Apply Top Fix' },
    ],
    howItWorks: [
      { step: 1, title: 'Pitch gets analyzed', description: 'After scoring, the AI identifies the specific areas that would most improve your pitch if fixed.' },
      { step: 2, title: 'Fixes ranked by impact', description: 'Each fix is tagged as High, Medium, or Low impact based on how many points it could add to your score.' },
      { step: 3, title: 'Apply and re-score', description: 'Make the suggested changes and run your pitch again to see your score climb.' },
    ],
    useCases: [
      { icon: '⏰', title: 'Last-Minute Polish', persona: 'Busy founder', description: 'Only have 10 minutes before your meeting? Focus on the #1 high-impact fix for maximum score gain.' },
      { icon: '🔄', title: 'Iterative Improvement', persona: 'Perfectionist', description: 'Apply fixes one at a time and re-score after each to build the perfect pitch incrementally.' },
      { icon: '🎯', title: 'Targeted Weakness Fixing', persona: 'Repeat pitcher', description: 'If "Market" always scores low, focus on market-related fixes to patch your persistent blind spot.' },
    ],
    comparison: [
      { without: 'Vague feedback like "needs more data"', with: 'Specific fix: "Add TAM/SAM sizing in slide 3"' },
      { without: 'No idea which feedback matters most', with: 'Impact-ranked from high to low with point estimates' },
      { without: 'Rewrite your whole pitch from scratch', with: 'Apply targeted fixes that maximize score per effort' },
    ],
    ctaHeadline: 'Know exactly what to fix.',
    ctaDescription: 'Stop wasting time on low-impact changes.',
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
    stats: [
      { value: '+18pts', label: 'Avg Rewrite Score Gain' },
      { value: '100%', label: 'Fixes Applied' },
      { value: '1-click', label: 'Copy to Clipboard' },
      { value: '~5s', label: 'Generation Time' },
    ],
    howItWorks: [
      { step: 1, title: 'Your pitch is scored and analyzed', description: 'The AI identifies all areas for improvement and generates targeted fixes.' },
      { step: 2, title: 'AI applies every fix at once', description: 'All high and medium impact fixes are woven into a new version of your pitch script.' },
      { step: 3, title: 'Compare, copy, and practice', description: 'Review the before/after diff, copy the rewrite, and practice delivering the improved version.' },
    ],
    useCases: [
      { icon: '✨', title: 'First Draft to Final Draft', persona: 'New founder', description: 'Turn your rough first pitch into a polished script ready for investor meetings.' },
      { icon: '🔁', title: 'A/B Test Your Pitch', persona: 'Data-driven founder', description: 'Practice both versions and compare which one feels more natural while scoring higher.' },
      { icon: '📝', title: 'Script for Different Audiences', persona: 'Serial pitcher', description: 'Rewrite your pitch for different contexts — VC meetings vs demo days vs elevator pitches.' },
    ],
    comparison: [
      { without: 'Manually rewrite your pitch paragraph by paragraph', with: 'Get a fully rewritten script in 5 seconds' },
      { without: 'Lose your natural voice when incorporating feedback', with: 'AI preserves your tone while improving structure' },
      { without: 'No way to see what actually changed', with: 'Side-by-side diff highlights every improvement' },
    ],
    ctaHeadline: 'See your pitch transformed.',
    ctaDescription: 'One click from rough draft to investor-ready.',
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
    stats: [
      { value: '130-150', label: 'Optimal WPM Range' },
      { value: '0', label: 'Ideal Filler Count' },
      { value: '±10%', label: 'Time Compliance Zone' },
      { value: 'Live', label: 'Real-Time Feedback' },
    ],
    howItWorks: [
      { step: 1, title: 'Record your pitch delivery', description: 'Speak into the microphone while Pitchr captures your audio in real time.' },
      { step: 2, title: 'Audio is analyzed for delivery patterns', description: 'Speech-to-text plus audio analysis measures pace, pauses, fillers, and timing.' },
      { step: 3, title: 'Get your delivery report', description: 'See WPM over time, filler word count with timestamps, and time compliance status.' },
    ],
    useCases: [
      { icon: '🏃', title: 'Speed Control Training', persona: 'Nervous pitcher', description: 'If you tend to rush when nervous, track your WPM across sessions to build a natural pace.' },
      { icon: '🤫', title: 'Filler Word Elimination', persona: 'Polished presenter', description: 'Track filler words session over session and watch them decrease as you practice.' },
      { icon: '⏱️', title: 'Demo Day Timing', persona: 'Competition pitcher', description: 'Nail the 3-minute time slot by practicing with real-time duration tracking.' },
    ],
    comparison: [
      { without: 'No idea how fast you\'re speaking', with: 'Exact WPM with color-coded optimal range' },
      { without: 'Don\'t notice your own filler words', with: 'Every "um" and "like" flagged with timestamps' },
      { without: 'Run over time in your meeting', with: 'Visual progress bar tracks your duration live' },
    ],
    ctaHeadline: 'Master your delivery.',
    ctaDescription: 'Great content with bad delivery still loses rounds.',
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
    stats: [
      { value: '5-8', label: 'Questions Generated' },
      { value: '100%', label: 'Pitch-Specific' },
      { value: '3', label: 'Difficulty Levels' },
      { value: 'Live', label: 'Practice Mode' },
    ],
    howItWorks: [
      { step: 1, title: 'Your pitch is analyzed for gaps', description: 'The AI identifies what an investor would want to know more about after hearing your pitch.' },
      { step: 2, title: 'Tough questions are generated', description: 'Questions range from clarifying to challenging, targeting your pitch\'s specific weak points.' },
      { step: 3, title: 'Practice with suggested frameworks', description: 'Each question comes with a suggested answer framework so you can prepare confidently.' },
    ],
    useCases: [
      { icon: '🎙️', title: 'Live Q&A Practice', persona: 'Preparing founder', description: 'Practice answering generated questions out loud with the live Q&A mode for realistic rehearsal.' },
      { icon: '🛡️', title: 'Objection Handling Prep', persona: 'Experienced pitcher', description: 'Identify potential investor objections before they come up and have data-backed responses ready.' },
      { icon: '👥', title: 'Partner Meeting Simulation', persona: 'Series A founder', description: 'Simulate a partner meeting where multiple tough questions come in rapid succession.' },
    ],
    comparison: [
      { without: 'Google "common investor questions" and hope for the best', with: 'Questions generated from YOUR specific pitch content' },
      { without: 'Freeze up when asked something unexpected', with: 'Practice with tougher questions than investors will ask' },
      { without: 'No structured way to prepare answers', with: 'Framework answers with key talking points' },
    ],
    ctaHeadline: 'Never get caught off guard.',
    ctaDescription: 'The best founders prepare for the hardest questions.',
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
    stats: [
      { value: 'Per-Slide', label: 'Scoring Granularity' },
      { value: '10-15', label: 'Slides Analyzed' },
      { value: 'PDF/PPTX', label: 'Formats Supported' },
      { value: 'Sync', label: 'Pitch + Deck Alignment' },
    ],
    howItWorks: [
      { step: 1, title: 'Upload your pitch deck', description: 'Drag and drop your PDF or PPTX deck. Pitchr extracts and analyzes every slide.' },
      { step: 2, title: 'Each slide gets scored', description: 'Every slide receives individual scores for content, design, and narrative flow.' },
      { step: 3, title: 'Get per-slide suggestions', description: 'Specific improvements for each slide\'s layout, copy, data visualization, and storytelling.' },
    ],
    useCases: [
      { icon: '🎨', title: 'Design-Blind Founder', persona: 'Technical founder', description: 'Get objective visual feedback on your deck even if design isn\'t your strength.' },
      { icon: '📊', title: 'Data Slide Optimization', persona: 'Data-heavy pitch', description: 'Make sure your charts and data visualizations tell the right story at a glance.' },
      { icon: '🔗', title: 'Full Package Review', persona: 'Fundraising founder', description: 'Score both your verbal pitch and deck together to ensure they tell a cohesive story.' },
    ],
    comparison: [
      { without: 'Ask your designer friend who\'s too busy to help', with: 'Instant per-slide visual and content feedback' },
      { without: 'No idea if your deck matches your pitch narrative', with: 'Pitch + Deck sync analysis shows alignment gaps' },
      { without: 'Generic deck templates with no personalization', with: 'Specific suggestions based on your pitch content' },
    ],
    ctaHeadline: 'Make every slide count.',
    ctaDescription: 'Your deck is the artifact investors share with partners.',
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
    stats: [
      { value: '42→85', label: 'Typical Score Journey' },
      { value: '5-8', label: 'Sessions to 80+' },
      { value: '4', label: 'Performance Zones' },
      { value: '∞', label: 'Session History' },
    ],
    howItWorks: [
      { step: 1, title: 'Practice and score sessions', description: 'Every pitch session is automatically saved with its full score breakdown.' },
      { step: 2, title: 'Watch your timeline grow', description: 'A visual chart shows your score trajectory with color-coded performance zones.' },
      { step: 3, title: 'Hit milestones and celebrate', description: 'Unlock achievements as you cross score thresholds — 60, 70, 80, and 90+.' },
    ],
    useCases: [
      { icon: '📅', title: 'Fundraise Countdown', persona: 'Pre-fundraise founder', description: 'Track daily progress in the weeks leading up to your fundraise to ensure you peak at the right time.' },
      { icon: '🏋️', title: 'Deliberate Practice', persona: 'Growth-minded founder', description: 'Treat pitching like a skill — practice daily, track progress, and celebrate breakthroughs.' },
      { icon: '📊', title: 'Board Updates', persona: 'Portfolio founder', description: 'Show your board and advisors concrete evidence of how your fundraise preparation is going.' },
    ],
    comparison: [
      { without: 'No record of past practice sessions', with: 'Complete session history with full score breakdowns' },
      { without: 'Can\'t tell if you\'re actually getting better', with: 'Visual timeline shows your improvement trajectory' },
      { without: 'No motivation to keep practicing', with: 'Milestone achievements and streak tracking' },
    ],
    ctaHeadline: 'See your growth story.',
    ctaDescription: 'Every great pitch was once a rough draft.',
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
    stats: [
      { value: '5', label: 'Category Dimensions' },
      { value: 'Weekly', label: 'Velocity Reports' },
      { value: 'Smart', label: 'Focus Recommendations' },
      { value: 'All', label: 'Session Data Included' },
    ],
    howItWorks: [
      { step: 1, title: 'Data accumulates automatically', description: 'Every session contributes to your analytics — no extra work required.' },
      { step: 2, title: 'Patterns emerge across sessions', description: 'Analytics reveals which categories you consistently excel in and which need work.' },
      { step: 3, title: 'Get smart focus recommendations', description: 'The AI suggests which area to focus on next for maximum overall score improvement.' },
    ],
    useCases: [
      { icon: '🔬', title: 'Identify Blind Spots', persona: 'Experienced pitcher', description: 'Discover the category that\'s been holding your score back — even if you didn\'t realize it.' },
      { icon: '📈', title: 'Velocity Tracking', persona: 'Time-pressed founder', description: 'Track improvement speed to know if you\'ll be ready by your fundraise deadline.' },
      { icon: '🎯', title: 'Focused Practice', persona: 'Efficient learner', description: 'Instead of practicing everything, focus on the one area analytics says will have the biggest impact.' },
    ],
    comparison: [
      { without: 'Practice randomly without direction', with: 'Data-driven focus on your weakest category' },
      { without: 'No aggregate view across sessions', with: 'Full analytics dashboard with trends and patterns' },
      { without: 'Can\'t measure improvement speed', with: 'Week-over-week velocity shows your acceleration' },
    ],
    ctaHeadline: 'Let data drive your practice.',
    ctaDescription: 'The best founders are data-driven about everything — including their pitch.',
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
    stats: [
      { value: '∞', label: 'Projects Allowed' },
      { value: 'Independent', label: 'Per-Project Tracking' },
      { value: 'Full', label: 'Version History' },
      { value: 'Shared', label: 'Team Access' },
    ],
    howItWorks: [
      { step: 1, title: 'Create a project', description: 'Name your project and set the pitch mode — elevator, VC pitch, or demo day.' },
      { step: 2, title: 'Practice within the project', description: 'All sessions are automatically organized under the right project.' },
      { step: 3, title: 'Track progress independently', description: 'Each project has its own score timeline, analytics, and version history.' },
    ],
    useCases: [
      { icon: '🔀', title: 'Multi-Round Fundraise', persona: 'Growth-stage founder', description: 'Separate projects for seed deck, Series A, and investor-specific custom pitches.' },
      { icon: '🎭', title: 'Different Audiences', persona: 'Versatile pitcher', description: 'One project for VC meetings, another for customer demos, another for conference talks.' },
      { icon: '👥', title: 'Team Collaboration', persona: 'Co-founding team', description: 'Share projects with co-founders so everyone can see the latest pitch version and scores.' },
    ],
    comparison: [
      { without: 'All pitches jumbled together in one timeline', with: 'Clean separation with per-project dashboards' },
      { without: 'Can\'t find your Series A pitch from last week', with: 'Full version history with searchable sessions' },
      { without: 'One pitch improvement messes up another\'s data', with: 'Independent analytics for each project' },
    ],
    ctaHeadline: 'One tool. Every pitch.',
    ctaDescription: 'Keep every pitch organized and independently tracked.',
  },
];

export function getFeatureBySlug(slug: string): FeatureConfig | undefined {
  return FEATURES.find((f) => f.slug === slug);
}
