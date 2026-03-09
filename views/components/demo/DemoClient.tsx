'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_STEPS } from '@/views/components/demo/demoData';
import { DemoBrowserFrame } from '@/views/components/demo/DemoBrowserFrame';
import { DemoStepLabel } from '@/views/components/demo/DemoStepLabel';
import { DemoAnalyzingOverlay } from '@/views/components/demo/DemoAnalyzingOverlay';
import { DemoCTA } from '@/views/components/demo/DemoCTA';
import { DemoCursor } from '@/views/components/demo/DemoCursor';
import { DemoDashboard } from '@/views/components/demo/screens/DemoDashboard';
import { DemoSession } from '@/views/components/demo/screens/DemoSession';
import { DemoResults } from '@/views/components/demo/screens/DemoResults';
import { DemoQA } from '@/views/components/demo/screens/DemoQA';
import './demo.css';

export function DemoClient({ paused = false }: { paused?: boolean }) {
  const [step, setStep] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);
  const [cursorClicking, setCursorClicking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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
      setCursorClicking(false);
    }, 300);
  }, [totalSteps]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(advance, currentStep.duration);
    return () => clearTimeout(timerRef.current);
  }, [step, advance, currentStep.duration, paused]);

  // Cursor click trigger
  useEffect(() => {
    setCursorClicking(false);
    if (currentStep.cursor?.clickAt) {
      clickTimerRef.current = setTimeout(() => {
        setCursorClicking(true);
        // Reset after animation
        setTimeout(() => setCursorClicking(false), 500);
      }, currentStep.cursor.clickAt);
    }
    return () => clearTimeout(clickTimerRef.current);
  }, [step, currentStep.cursor?.clickAt]);

  // Determine which screens are active
  const activeScreen = currentStep.screen;
  const isSessionActive = activeScreen === 'session';
  const showTypewriter = step >= 3;
  const showChecklist = step >= 4;

  // Compose the camera transform
  const stageTransform = `scale(${scaleFactor}) ${currentStep.transform}`;

  // Cursor visibility
  const hasCursor = !!currentStep.cursor;
  const cursorX = currentStep.cursor?.x ?? 0;
  const cursorY = currentStep.cursor?.y ?? 0;

  // QA props
  const qaPhase = currentStep.qaPhase ?? 'gate';
  const qaVisibleTurns = currentStep.qaVisibleTurns ?? 0;

  // Group steps into sections for dot indicator (must match DEMO_STEPS)
  const sections = [
    { label: 'Dashboard', count: 2 },
    { label: 'Session', count: 4 },
    { label: 'Analysis', count: 1 },
    { label: 'Results', count: 5 },
    { label: 'Q&A', count: 4 },
    { label: 'CTA', count: 1 },
  ];

  let dotIndex = 0;

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
                scrollTo={activeScreen === 'results' ? currentStep.scrollTo : undefined}
              />
            </div>

            {/* QA screen */}
            <div className={`demo-screen${activeScreen === 'qa' ? ' demo-screen--active' : ''}`}>
              <DemoQA phase={qaPhase} visibleTurns={qaVisibleTurns} />
            </div>

            {/* Analyzing overlay */}
            <DemoAnalyzingOverlay active={activeScreen === 'analyzing'} />

            {/* CTA overlay */}
            {activeScreen === 'cta' && <DemoCTA />}

            {/* Cursor */}
            <DemoCursor
              targetX={cursorX}
              targetY={cursorY}
              visible={hasCursor}
              clicking={cursorClicking}
            />
          </div>
        </div>
      </DemoBrowserFrame>

      {/* Step indicator dots — grouped by section */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {sections.map((section, si) => {
          const dots = [];
          for (let j = 0; j < section.count; j++) {
            const idx = dotIndex++;
            dots.push(
              <div
                key={idx}
                style={{
                  width: idx === step ? 16 : 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: idx === step ? '#ff5941' : 'var(--border-color)',
                  transition: 'all 0.3s ease',
                }}
              />
            );
          }
          return (
            <div key={si} style={{ display: 'flex', gap: 3, alignItems: 'center', marginRight: si < sections.length - 1 ? 6 : 0 }}>
              {dots}
            </div>
          );
        })}
      </div>
    </div>
  );
}
