'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_STEPS } from '@/views/components/demo/demoData';
import { DemoBrowserFrame } from '@/views/components/demo/DemoBrowserFrame';
import { DemoStepLabel } from '@/views/components/demo/DemoStepLabel';
import { DemoAnalyzingOverlay } from '@/views/components/demo/DemoAnalyzingOverlay';
import { DemoCTA } from '@/views/components/demo/DemoCTA';
import { DemoDashboard } from '@/views/components/demo/screens/DemoDashboard';
import { DemoSession } from '@/views/components/demo/screens/DemoSession';
import { DemoResults } from '@/views/components/demo/screens/DemoResults';
import './demo.css';

export function DemoClient() {
  const [step, setStep] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  const currentStep = DEMO_STEPS[step];
  const totalSteps = DEMO_STEPS.length;

  // Compute scale factor to fit 1440px stage into viewport width
  useEffect(() => {
    function updateScale() {
      if (!viewportRef.current) return;
      const vpWidth = viewportRef.current.clientWidth;
      setScaleFactor(vpWidth / 1440);
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Auto-advance timer
  const advance = useCallback(() => {
    setLabelVisible(false);
    setTimeout(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) return 0;
        return next;
      });
      setLabelVisible(true);
    }, 300);
  }, [totalSteps]);

  useEffect(() => {
    timerRef.current = setTimeout(advance, currentStep.duration);
    return () => clearTimeout(timerRef.current);
  }, [step, advance, currentStep.duration]);

  // Determine which screens are active
  const activeScreen = currentStep.screen;
  const isSessionActive = activeScreen === 'session';
  const showTypewriter = step >= 3;
  const showChecklist = step >= 4;
  const showScoreAnimation = step >= 7;

  // Compose the camera transform
  const stageTransform = `scale(${scaleFactor}) ${currentStep.transform}`;

  return (
    <div className="demo-container">
      {/* Step label above browser */}
      <DemoStepLabel
        label={currentStep.label}
        subtitle={currentStep.subtitle}
        visible={labelVisible}
      />

      {/* Browser frame */}
      <DemoBrowserFrame urlText={currentStep.urlText}>
        <div ref={viewportRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div
            className="demo-stage"
            style={{ transform: stageTransform }}
          >
            {/* Dashboard screen */}
            <div className={`demo-screen${activeScreen === 'dashboard' ? ' demo-screen--active' : ''}`}>
              <DemoDashboard />
            </div>

            {/* Session screen */}
            <div className={`demo-screen${activeScreen === 'session' ? ' demo-screen--active' : ''}`}>
              <DemoSession
                isActive={isSessionActive}
                showTypewriter={showTypewriter}
                showChecklist={showChecklist}
              />
            </div>

            {/* Results screen */}
            <div className={`demo-screen${activeScreen === 'results' ? ' demo-screen--active' : ''}`}>
              <DemoResults
                isActive={activeScreen === 'results'}
                showScoreAnimation={showScoreAnimation}
              />
            </div>

            {/* Analyzing overlay */}
            <DemoAnalyzingOverlay active={activeScreen === 'analyzing'} />

            {/* CTA overlay */}
            {activeScreen === 'cta' && <DemoCTA />}
          </div>
        </div>
      </DemoBrowserFrame>

      {/* Step indicator dots */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {DEMO_STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === step ? '#ff5941' : 'var(--border-color)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
