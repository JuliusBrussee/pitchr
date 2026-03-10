export interface SolutionBeat {
  time: string;
  label: string;
  description: string;
  tip: string;
}

export interface SolutionScenario {
  text: string;
  persona: {
    name: string;
    role: string;
    avatar: string;
  };
}

export interface SolutionTransformation {
  scoreBefore: number;
  scoreAfter: number;
  weaknesses: string[];
  strengths: string[];
}

export interface SolutionStat {
  value: string;
  label: string;
}

export interface SolutionConfig {
  slug: string;
  label: string;
  headline: string;
  tagline: string;
  duration: string;
  color: string;
  pitchMode: string | null;
  scenario: SolutionScenario;
  beats: SolutionBeat[];
  transformation: SolutionTransformation;
  stats: SolutionStat[];
  relatedFeatures: string[];
  demos?: [string, string];
  demoLabels?: [string, string];
  ctaHeadline: string;
  ctaDescription: string;
}

export const SOLUTIONS: SolutionConfig[] = [
  {
    slug: 'elevator-pitch',
    label: 'Elevator Pitch',
    headline: 'Nail your 30-second pitch.',
    tagline: 'Turn chance encounters into real opportunities. Master the art of the concise, compelling elevator pitch.',
    duration: '30 seconds',
    color: '#ff5941',
    pitchMode: 'elevator',
    scenario: {
      text: "You're at a startup mixer. Someone asks 'What are you building?' You have 30 seconds before they glance at the next person.",
      persona: { name: 'Sarah Chen', role: 'First-time founder at a networking event', avatar: 'S' },
    },
    beats: [
      { time: '0-8s', label: 'Hook', description: 'Grab attention with a surprising fact, question, or bold statement.', tip: 'Great hooks create an information gap the listener wants to close.' },
      { time: '8-18s', label: 'Problem + Solution', description: 'Name the pain point and your unique approach in one breath.', tip: 'Use concrete language: "We help X do Y by Z" — no abstract jargon.' },
      { time: '18-25s', label: 'Proof Point', description: 'One specific metric or credential that builds instant credibility.', tip: '"500 users in 3 weeks" beats "fast-growing traction" every time.' },
      { time: '25-30s', label: 'Ask', description: 'End with a clear next step — meeting, intro, or follow-up.', tip: 'Make it easy: "Can I send you a one-pager?" beats "Let me know if interested."' },
    ],
    transformation: {
      scoreBefore: 52,
      scoreAfter: 81,
      weaknesses: ['No hook — jumps straight into product description', 'Jargon-heavy language loses non-technical listeners'],
      strengths: ['Tight hook creates curiosity gap', 'Specific traction number builds credibility'],
    },
    stats: [
      { value: '30s', label: 'Target Duration' },
      { value: '4', label: 'Structure Beats' },
      { value: '120-140', label: 'Optimal WPM' },
      { value: '0', label: 'Ideal Fillers' },
    ],
    relatedFeatures: ['score-rubric', 'ai-rewrite', 'delivery-metrics'],
    demos: ['score-rubric', 'delivery-metrics'],
    demoLabels: ['Your score breakdown', 'Delivery analysis'],
    ctaHeadline: 'Make every second count.',
    ctaDescription: 'Turn your 30-second window into a lasting impression.',
  },
  {
    slug: 'vc-pitch',
    label: 'YC / VC Pitch',
    headline: 'Win the room in 2 minutes.',
    tagline: 'The pitch that gets you funded. Master the structure, evidence, and delivery that top VCs expect.',
    duration: '2 minutes',
    color: '#ff5941',
    pitchMode: 'vc_pitch',
    scenario: {
      text: "You've got a 2-minute slot with a partner at a top-tier VC. This is the meeting you've been preparing for months.",
      persona: { name: 'Marcus Johnson', role: 'Series A founder, pre-fundraise', avatar: 'M' },
    },
    beats: [
      { time: '0-20s', label: 'Problem', description: 'Paint the problem so vividly that investors feel the pain.', tip: 'Start with a specific person experiencing the problem, not abstract market data.' },
      { time: '20-40s', label: 'Solution', description: 'Your unique insight and how it translates into a product.', tip: 'Lead with your unique insight, not the feature list.' },
      { time: '40-60s', label: 'Traction', description: 'Hard numbers that prove market demand and momentum.', tip: 'MoM growth rate > absolute numbers for early stage.' },
      { time: '60-80s', label: 'Market', description: 'TAM/SAM/SOM with a credible bottoms-up calculation.', tip: 'Bottoms-up sizing > top-down. "10% of a $50B market" makes VCs cringe.' },
      { time: '80-100s', label: 'Team', description: 'Why this team is uniquely positioned to win.', tip: 'Focus on unfair advantages: domain expertise, prior exits, unique access.' },
      { time: '100-120s', label: 'Ask', description: 'Specific raise amount, use of funds, and the milestone it unlocks.', tip: 'Tie your ask to a specific milestone: "$2M to reach $1M ARR in 12 months."' },
    ],
    transformation: {
      scoreBefore: 48,
      scoreAfter: 86,
      weaknesses: ['No market sizing — "it\'s a huge market" without data', 'Anecdotal evidence instead of concrete metrics'],
      strengths: ['Bottoms-up TAM/SAM analysis with cited sources', 'Concrete metrics: 340% MoM growth, 68% retention'],
    },
    stats: [
      { value: '2min', label: 'Target Duration' },
      { value: '6', label: 'Structure Beats' },
      { value: '130-150', label: 'Optimal WPM' },
      { value: '87%', label: 'VC Panel Accuracy' },
    ],
    relatedFeatures: ['score-rubric', 'top-fixes', 'qa-pack', 'deck-analysis'],
    demos: ['score-rubric', 'qa-pack'],
    demoLabels: ['Investor scoring', 'Q&A preparation'],
    ctaHeadline: 'Pitch like a funded founder.',
    ctaDescription: 'The structure and evidence that top VCs expect.',
  },
  {
    slug: 'hackathon-pitch',
    label: 'Hackathon Pitch',
    headline: 'Win demo day.',
    tagline: 'Stand out after 36 hours of coding. Structure your demo pitch to impress judges who\'ve seen 15 pitches today.',
    duration: '3 minutes',
    color: '#ff5941',
    pitchMode: 'hackathon',
    scenario: {
      text: "It's demo day. Your team has been coding for 36 hours straight. You've got 3 minutes on stage and judges who've seen 15 pitches today.",
      persona: { name: 'Jordan & Team Flux', role: 'Hack team at ETHGlobal', avatar: 'J' },
    },
    beats: [
      { time: '0-30s', label: 'Problem Hook', description: 'Start with the problem in a way that makes judges sit up.', tip: 'A live demo of the broken experience beats describing it.' },
      { time: '30-90s', label: 'Demo', description: 'Show the working product — this is the heart of your pitch.', tip: 'Demo the happy path first. Edge cases and error handling can wait for Q&A.' },
      { time: '90-120s', label: 'Technical Innovation', description: 'What\'s novel about your approach?', tip: 'Explain it like you\'re teaching a smart friend, not writing a whitepaper.' },
      { time: '120-150s', label: 'Impact', description: 'Why does this matter beyond the hackathon?', tip: 'Connect to real-world impact: "This could save X hours for Y people."' },
      { time: '150-180s', label: 'Team + Ask', description: 'Who built this and what\'s next?', tip: 'End on a memorable line — judges remember the last thing they hear.' },
    ],
    transformation: {
      scoreBefore: 55,
      scoreAfter: 83,
      weaknesses: ['Speaking too fast from adrenaline (180 WPM)', 'No clear demo moment — jumped between features'],
      strengths: ['Clean narrative arc: problem → demo → impact', 'Memorable closing line judges can repeat'],
    },
    stats: [
      { value: '3min', label: 'Target Duration' },
      { value: '5', label: 'Structure Beats' },
      { value: '140-160', label: 'Optimal WPM' },
      { value: '36hrs', label: 'Avg Hack Time' },
    ],
    relatedFeatures: ['delivery-metrics', 'ai-rewrite', 'progress'],
    demos: ['delivery-metrics', 'ai-rewrite'],
    demoLabels: ['Pacing analysis', 'Script rewrite'],
    ctaHeadline: 'From hack to win.',
    ctaDescription: 'Structure your demo pitch to stand out from the crowd.',
  },
  {
    slug: 'university',
    label: 'University & Academic',
    headline: 'Ace your capstone pitch.',
    tagline: 'Present research and projects with clarity and confidence. Turn academic rigor into compelling narratives.',
    duration: '3 minutes',
    color: '#ff5941',
    pitchMode: null,
    scenario: {
      text: "Your capstone project is due. The professor has invited industry judges. Half your grade depends on this 3-minute presentation.",
      persona: { name: 'Emily Zhang', role: 'CS senior, capstone presentation', avatar: 'E' },
    },
    beats: [
      { time: '0-30s', label: 'Context + Motivation', description: 'Set the scene: why does this problem matter?', tip: 'Start with a real-world example, not the assignment prompt.' },
      { time: '30-75s', label: 'Approach', description: 'Your methodology, tools, and key design decisions.', tip: 'Focus on WHY you chose this approach, not just WHAT you built.' },
      { time: '75-120s', label: 'Results', description: 'What you found or built, with evidence.', tip: 'One clear chart > three confusing ones. Lead with your strongest result.' },
      { time: '120-150s', label: 'Implications', description: 'What do your results mean for the broader field?', tip: 'Connect back to the real-world motivation from your opening.' },
      { time: '150-180s', label: 'Future Work', description: 'What would you do with more time?', tip: 'Show you understand limitations — it demonstrates intellectual maturity.' },
    ],
    transformation: {
      scoreBefore: 45,
      scoreAfter: 79,
      weaknesses: ['Too technical — lost non-specialist judges in slide 2', 'Buried the lead — results on slide 8 of 10'],
      strengths: ['Accessible language with technical depth available in Q&A', 'Strong narrative arc from motivation to implications'],
    },
    stats: [
      { value: '3min', label: 'Target Duration' },
      { value: '5', label: 'Structure Beats' },
      { value: '130-145', label: 'Optimal WPM' },
      { value: '40%', label: 'Typical Grade Weight' },
    ],
    relatedFeatures: ['score-rubric', 'top-fixes', 'delivery-metrics', 'progress'],
    demos: ['score-rubric', 'top-fixes'],
    demoLabels: ['Rubric scoring', 'Ranked improvements'],
    ctaHeadline: 'Present with confidence.',
    ctaDescription: 'Turn academic rigor into a compelling narrative.',
  },
  {
    slug: 'startup-competition',
    label: 'Startup Competition',
    headline: 'Own the stage.',
    tagline: 'Five minutes to convince a panel of investors and thousands of viewers. Make every second count on the biggest stage.',
    duration: '5 minutes',
    color: '#ff5941',
    pitchMode: null,
    scenario: {
      text: "You're backstage at TechCrunch Disrupt. Your startup's name is next on the screen. 5 minutes to convince a panel of investors and 10,000 live viewers.",
      persona: { name: 'David Kim', role: 'Founder pitching at TechCrunch Disrupt', avatar: 'D' },
    },
    beats: [
      { time: '0-30s', label: 'Opening Hook', description: 'Command the room from word one.', tip: 'Bold statement or live demo beats "Hi, I\'m David from..."' },
      { time: '30-90s', label: 'Problem + Market', description: 'Size the pain and the opportunity.', tip: 'Make the audience feel the problem before showing them the numbers.' },
      { time: '90-180s', label: 'Solution + Demo', description: 'Your product in action — the wow moment.', tip: 'Rehearse your demo 20+ times. Live demos fail when they surprise YOU.' },
      { time: '180-240s', label: 'Business Model', description: 'How you make money and scale.', tip: 'Unit economics > revenue projections. Show you understand your engine.' },
      { time: '240-270s', label: 'Traction + Team', description: 'Social proof and the team behind it.', tip: 'Name-drop strategically: advisors, customers, partners that signal credibility.' },
      { time: '270-300s', label: 'Vision + Ask', description: 'The big picture and your specific ask.', tip: 'End with the world you\'re building, not a list of features.' },
    ],
    transformation: {
      scoreBefore: 50,
      scoreAfter: 88,
      weaknesses: ['Rushed demo section — crammed 3 features into 45 seconds', 'No market sizing — assumed judges knew the space'],
      strengths: ['Tight timing with natural pauses for emphasis', 'Compelling vision statement with data-backed roadmap'],
    },
    stats: [
      { value: '5min', label: 'Target Duration' },
      { value: '6', label: 'Structure Beats' },
      { value: '135-150', label: 'Optimal WPM' },
      { value: '$50K+', label: 'Typical Prize' },
    ],
    relatedFeatures: ['score-rubric', 'qa-pack', 'deck-analysis', 'analytics'],
    demos: ['deck-analysis', 'analytics'],
    demoLabels: ['Slide-by-slide review', 'Performance analytics'],
    ctaHeadline: 'Compete to win.',
    ctaDescription: 'Preparation is the difference between top 3 and forgotten.',
  },
];

export function getSolutionBySlug(slug: string): SolutionConfig | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}
