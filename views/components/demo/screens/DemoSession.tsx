'use client';

import { useEffect, useState, useRef } from 'react';
import { Video, FileText, CheckCircle2, Mic } from 'lucide-react';
import { DemoSidebar } from '@/views/components/demo/DemoSidebar';
import {
  DEMO_TRANSCRIPT,
  DEMO_CHECKLIST,
  type ChecklistState,
} from '@/views/components/demo/demoData';

interface DemoSessionProps {
  isActive: boolean;
  showTypewriter: boolean;
  showChecklist: boolean;
}

function CheckIcon({ state }: { state: ChecklistState }) {
  if (state === 'complete') {
    return (
      <div className="demo-session__check-icon demo-session__check-icon--complete">
        <CheckCircle2 size={11} />
      </div>
    );
  }
  if (state === 'partial') {
    return (
      <div className="demo-session__check-icon demo-session__check-icon--partial">
        <span style={{ fontSize: 8, fontWeight: 700 }}>~</span>
      </div>
    );
  }
  return <div className="demo-session__check-icon demo-session__check-icon--uncovered" />;
}

export function DemoSession({ isActive, showTypewriter, showChecklist }: DemoSessionProps) {
  const [charIndex, setCharIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Typewriter effect
  useEffect(() => {
    if (!isActive || !showTypewriter) return;

    setCharIndex(0);
    intervalRef.current = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= DEMO_TRANSCRIPT.length) {
          clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(intervalRef.current);
  }, [isActive, showTypewriter]);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const displayedText = DEMO_TRANSCRIPT.slice(0, charIndex);
  // Simulate realistic WPM (ramp up to ~148 like real speech)
  const wpm = elapsedSeconds < 3 ? 0 : Math.min(148, Math.round(80 + (elapsedSeconds / 60) * 68));

  return (
    <div className="demo-app-layout">
      <DemoSidebar activeNav="session" />
      <main className="demo-main" style={{ padding: 16 }}>
        <div className="demo-session-layout">
          {/* Left: mode + canvas */}
          <div className="demo-session__left">
            <div className="demo-session__mode">
              <div className="demo-session__mode-btn">Elevator</div>
              <div className="demo-session__mode-btn demo-session__mode-btn--active">VC Pitch</div>
            </div>
            <div className="demo-session__canvas">
              <Video size={40} className="demo-session__canvas-icon" />
              <span>Recording in progress...</span>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  animation: 'demo-dot-pulse 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* Right: metrics panel */}
          <div className="demo-session__right">
            {/* Transcript */}
            <div className="demo-session__panel">
              <div className="demo-session__panel-title">
                <FileText size={12} />
                Live Transcript
              </div>
              <div className="demo-session__transcript">
                {displayedText}
                {showTypewriter && charIndex < DEMO_TRANSCRIPT.length && (
                  <span className="demo-session__cursor" />
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="demo-session__panel">
              <div className="demo-session__panel-title">
                <CheckCircle2 size={12} />
                Coverage Checklist
              </div>
              <div className="demo-session__checklist">
                {DEMO_CHECKLIST.map((item, i) => (
                  <div key={i} className="demo-session__check-item">
                    <CheckIcon state={showChecklist ? item.state : 'uncovered'} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Metrics */}
            <div className="demo-session__panel">
              <div className="demo-session__panel-title">
                <Mic size={12} />
                Live Metrics
              </div>
              <div className="demo-session__metrics-row">
                <div className="demo-session__metric-pill">
                  <span className="demo-session__metric-value">
                    {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
                  </span>
                  <span className="demo-session__metric-label">Duration</span>
                </div>
                <div className="demo-session__metric-pill">
                  <span className="demo-session__metric-value">{wpm || '\u2014'}</span>
                  <span className="demo-session__metric-label">WPM</span>
                </div>
                <div className="demo-session__metric-pill">
                  <span className="demo-session__metric-value">2</span>
                  <span className="demo-session__metric-label">Fillers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
