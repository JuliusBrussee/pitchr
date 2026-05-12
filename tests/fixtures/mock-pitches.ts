import type { PitchMode } from '@/types/pitch';

export interface MockPitch {
  mode: PitchMode;
  transcript: string;
  expectedBeats: string[];
  expectedScoreRange: { min: number; max: number };
}

export const MOCK_PITCHES: Record<PitchMode, MockPitch> = {
  elevator: {
    mode: 'elevator',
    transcript:
      'Hi, I\'m Sarah from Acme AI. We solve the biggest problem in healthcare data: fragmented records across providers. ' +
      'Our platform uses AI to unify patient data in real-time, reducing errors by 40%. ' +
      'We already have 12 hospitals signed up with a 95% retention rate. ' +
      'We\'re raising a $2M seed round to expand into 3 new states.',
    expectedBeats: ['One-liner', 'Problem', 'Solution', 'Proof', 'Ask'],
    expectedScoreRange: { min: 14, max: 20 },
  },
  vc_pitch: {
    mode: 'vc_pitch',
    transcript:
      'Good morning. I\'m Marcus, CEO of DataBridge. Today, 80% of enterprise data sits in disconnected silos. ' +
      'Teams waste 30% of their time searching for information across Slack, Notion, and Drive. ' +
      'DataBridge is an AI-powered knowledge graph that indexes every tool your company uses and makes it searchable in one place. ' +
      'The timing is perfect — with the AI boom, companies are drowning in data and willing to pay for unified access. ' +
      'We launched 6 months ago and already have $400K ARR with 23 enterprise customers growing 25% month over month. ' +
      'The knowledge management market is $12B and growing at 18% annually. ' +
      'We\'re raising a $5M Series A to triple our engineering team and expand into Europe.',
    expectedBeats: ['Problem', 'Solution', 'Why Now', 'Traction', 'Market', 'Ask'],
    expectedScoreRange: { min: 15, max: 20 },
  },
  hackathon: {
    mode: 'hackathon',
    transcript:
      'What if you could debug your code by talking to it? That\'s exactly what we built this weekend. ' +
      'Developers spend 35% of their time debugging — reading stack traces, searching StackOverflow, adding print statements. ' +
      'Let me show you CodeWhisper in action. I paste my error, and it highlights the exact line, explains the root cause, and suggests a fix — all in under 3 seconds. ' +
      'What makes this innovative is our novel approach: we fine-tuned a model on 2 million resolved GitHub issues, not just code. ' +
      'This could save the average developer 8 hours per week, and for a team of 50, that\'s $200K annually in reclaimed productivity. ' +
      'We\'re looking for beta testers and mentors to help us take this from hackathon project to product.',
    expectedBeats: ['Hook', 'Problem', 'Demo', 'Innovation', 'Impact', 'Ask'],
    expectedScoreRange: { min: 14, max: 20 },
  },
  final_year: {
    mode: 'final_year',
    transcript:
      'Good afternoon, my name is Emily Chen and this is my final year project on using machine learning for early detection of crop diseases. ' +
      'Crop diseases cost global agriculture $220 billion annually, and small-scale farmers in developing countries are disproportionately affected because they lack access to expert diagnosis. ' +
      'My approach combines transfer learning with a custom CNN architecture trained on a dataset of 50,000 leaf images across 38 disease categories. ' +
      'The model achieves 94.2% accuracy on the test set, outperforming the previous state-of-the-art by 3.1%. Field trials with 15 farmers in Kenya showed a 28% reduction in crop loss. ' +
      'This work demonstrates that accessible AI tools can meaningfully impact food security in developing regions. ' +
      'Future work includes expanding the disease taxonomy and deploying a mobile application for real-time diagnosis in the field.',
    expectedBeats: ['Introduction', 'Problem & Context', 'Approach', 'Results', 'Impact', 'Next Steps'],
    expectedScoreRange: { min: 15, max: 20 },
  },
};
