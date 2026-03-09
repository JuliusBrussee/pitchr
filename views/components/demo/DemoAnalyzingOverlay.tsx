'use client';

import { AudioLines } from 'lucide-react';

const STEPS = [
  'Processing transcript',
  'Analyzing structure & clarity',
  'Scoring rubric',
  'Generating fixes',
  'Preparing results',
];

interface DemoAnalyzingOverlayProps {
  active: boolean;
}

export function DemoAnalyzingOverlay({ active }: DemoAnalyzingOverlayProps) {
  const activeStep = 3;

  if (!active) return null;

  return (
    <div className="demo-analyzing">
      <div className="demo-analyzing__card">
        <div className="demo-analyzing__orb">
          <AudioLines size={28} />
        </div>
        <div className="demo-analyzing__text">Analyzing your pitch...</div>
        <div className="demo-analyzing__steps">
          {STEPS.map((step, i) => {
            const state = i < activeStep ? 'done' : i === activeStep ? 'active' : '';
            return (
              <div key={i} className={`demo-analyzing__step${state ? ` demo-analyzing__step--${state}` : ''}`}>
                <div className="demo-analyzing__step-dot" />
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
