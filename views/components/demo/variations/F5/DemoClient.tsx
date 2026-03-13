'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_STEPS } from '@/views/components/demo/variations/F5/demoData';
import { DemoBrowserFrame } from '@/views/components/demo/DemoBrowserFrame';
import { DemoCinematicCaption } from '@/views/components/demo/variations/F5/DemoCinematicCaption';
import { DemoProofPanel } from '@/views/components/demo/variations/F5/DemoProofPanel';
import { DemoAnalyzingOverlay } from '@/views/components/demo/DemoAnalyzingOverlay';
import { DemoCTA } from '@/views/components/demo/DemoCTA';
import { DemoCursor } from '@/views/components/demo/DemoCursor';
import { DemoDashboard } from '@/views/components/demo/screens/DemoDashboard';
import { DemoSession } from '@/views/components/demo/screens/DemoSession';
import { DemoResults } from '@/views/components/demo/screens/DemoResults';
import { DemoQA } from '@/views/components/demo/screens/DemoQA';
import '@/views/components/demo/demo.css';
import '@/views/components/demo/variations/F5/demo.css';

export function DemoClient({ paused = false, onComplete }: { paused?: boolean; onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);
  const [cursorClicking, setCursorClicking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState<number | null>(null);

  const currentStep = DEMO_STEPS[step];
  const totalSteps = DEMO_STEPS.length;
  const hasProof = !!currentStep.proofPanel;

  // Use ResizeObserver for smooth, continuous scale tracking
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setScaleFactor(w / 1440);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-advance timer
  const advance = useCallback(() => {
    setLabelVisible(false);
    setTimeout(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          if (onComplete) { onComplete(); return prev; }
          return 0;
        }
        return next;
      });
      setLabelVisible(true);
      setCursorClicking(false);
    }, 300);
  }, [totalSteps, onComplete]);

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

  // Cursor visibility
  const hasCursor = !!currentStep.cursor;
  const cursorX = currentStep.cursor?.x ?? 0;
  const cursorY = currentStep.cursor?.y ?? 0;

  // QA props
  const qaPhase = currentStep.qaPhase ?? 'gate';
  const qaVisibleTurns = currentStep.qaVisibleTurns ?? 0;

  return (
    <div className="demo-container">
      {/* Cinematic word-by-word caption above browser */}
      <DemoCinematicCaption
        caption={currentStep.caption}
        visible={labelVisible}
        stepIndex={step}
        isCta={step === 16}
      />

      {/* Split-screen flex container: browser (left) + proof panel (right) */}
      <div className={`f5-split-container${hasProof ? ' f5-split-container--proof' : ''}`}>
        {/* Browser frame — shrinks to 65% when proof panel is active */}
        <div className={`f5-browser-wrap${hasProof ? ' f5-browser-wrap--narrow' : ''}`}>
          <DemoBrowserFrame urlText={currentStep.urlText}>
            <div ref={viewportRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Outer wrapper handles viewport-fitting scale (no transition) */}
              <div
                className="f5-scale-wrapper"
                style={{
                  transform: `scale(${scaleFactor ?? 1})`,
                  visibility: scaleFactor === null ? 'hidden' : 'visible',
                }}
              >
                {/* Inner stage handles camera pan/zoom (with CSS transition) */}
                <div
                  className="demo-stage f5-stage"
                  style={{ transform: currentStep.transform }}
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
            </div>
          </DemoBrowserFrame>
        </div>

        {/* Proof panel — slides in from right on proof steps */}
        <DemoProofPanel panel={currentStep.proofPanel} stepIndex={step} />
      </div>
    </div>
  );
}
