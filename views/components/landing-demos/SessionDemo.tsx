'use client';

import { useState, useEffect, useRef } from 'react';
import { Video, FileText, CheckCircle2, Mic } from 'lucide-react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';
import { DpSidebar } from '@/views/components/landing-demos/DpSidebar';

const TRANSCRIPT =
  'We are building Ledgr, a fintech platform that automates expense reconciliation ' +
  'for mid-market SaaS companies. Today, finance teams spend fourteen hours per week ' +
  'manually matching invoices to bank transactions, leading to delayed closes and costly errors. ' +
  'Ledgr connects directly to your ERP and banking feeds, uses machine learning to auto-match ' +
  'ninety-two percent of transactions on day one, and flags anomalies before they become audit findings. ' +
  'In six months: thirty-eight customers, $200K ARR, and sixty percent faster close times. ' +
  'We are raising $1.5M to expand integrations and hire three enterprise reps.';

type CheckState = 'uncovered' | 'partial' | 'complete';

interface CheckItem {
  label: string;
  state: CheckState;
  charThreshold: number;
  partialThreshold?: number;
}

const CHECKLIST_ITEMS: CheckItem[] = [
  { label: 'Problem statement', state: 'uncovered', charThreshold: 80, partialThreshold: 30 },
  { label: 'Solution overview', state: 'uncovered', charThreshold: 200, partialThreshold: 120 },
  { label: 'Key metrics', state: 'uncovered', charThreshold: 350, partialThreshold: 280 },
  { label: 'Market size', state: 'uncovered', charThreshold: -1 },
  { label: 'Competition', state: 'uncovered', charThreshold: -1 },
  { label: 'Business model', state: 'uncovered', charThreshold: -1, partialThreshold: 320 },
  { label: 'Team', state: 'uncovered', charThreshold: -1 },
  { label: 'The ask', state: 'uncovered', charThreshold: 420, partialThreshold: 380 },
];

function getCheckState(item: CheckItem, charIndex: number): CheckState {
  if (item.charThreshold > 0 && charIndex >= item.charThreshold) return 'complete';
  if (item.partialThreshold && charIndex >= item.partialThreshold) return 'partial';
  return 'uncovered';
}

export function SessionDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tick, setTick] = useState(0);

  // Scroll trigger
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Tick counter (100ms intervals)
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(timer);
  }, [isVisible]);

  // Derived animation state
  const isRecording = tick >= 8;
  const typingStartTick = 12;
  const charsPerTick = 3;
  const charIndex = tick >= typingStartTick
    ? Math.min((tick - typingStartTick) * charsPerTick, TRANSCRIPT.length)
    : 0;
  const isTyping = charIndex > 0 && charIndex < TRANSCRIPT.length;
  const displayedText = TRANSCRIPT.slice(0, charIndex);

  // Metrics
  const elapsedSeconds = tick >= 8 ? Math.floor((tick - 8) / 10) : 0;
  const wordsTyped = displayedText.split(/\s+/).filter(Boolean).length;
  const wpm = elapsedSeconds > 3 ? Math.round((wordsTyped / elapsedSeconds) * 60) : 0;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <section ref={sectionRef} className="dl-section">
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Record Your Pitch</div>
          <h2 className="dl-section-title">Practice like it&apos;s<br />the real thing.</h2>
          <p className="dl-section-subtitle">
            Record your pitch or paste a script. Get real-time transcript,
            coverage tracking, and delivery metrics as you speak.
          </p>
        </div>

        <BrowserFrame url="app.pitchr.com/session">
          <div className="dp-app-layout">
            <DpSidebar active="session" />
            <div className="dp-main">
              {/* Mode toggle */}
              <div className="dp-mode-toggle">
                <div className="dp-mode-btn">Elevator</div>
                <div className="dp-mode-btn dp-mode-btn--active">VC Pitch</div>
              </div>

              {/* Session layout */}
              <div className="dp-session-layout">
                {/* Recording canvas */}
                <div className="dp-canvas">
                  <Video size={28} style={{ color: 'var(--dl-text-muted)', opacity: 0.5 }} />
                  <span style={{ fontSize: '12px', color: 'var(--dl-text-muted)' }}>
                    {isRecording ? 'Recording in progress...' : 'Ready to record'}
                  </span>
                  {isRecording && <div className="dp-rec-dot" />}
                </div>

                {/* Metrics panels */}
                <div className="dp-session-panels">
                  {/* Transcript */}
                  <div className="dp-panel" style={{ flex: 2 }}>
                    <div className="dp-panel-title">
                      <FileText size={10} />
                      Live Transcript
                    </div>
                    <div className="dp-transcript">
                      {displayedText || (
                        <span style={{ color: 'var(--dl-text-muted)', fontStyle: 'italic' }}>
                          Waiting for speech...
                        </span>
                      )}
                      {isTyping && <span className="dp-cursor" />}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="dp-panel" style={{ flex: 1 }}>
                    <div className="dp-panel-title">
                      <CheckCircle2 size={10} />
                      Coverage Checklist
                    </div>
                    <div className="dp-checklist">
                      {CHECKLIST_ITEMS.map((item) => {
                        const state = getCheckState(item, charIndex);
                        return (
                          <div key={item.label} className="dp-check-item">
                            <div className={`dp-check-dot dp-check-dot--${state}`}>
                              {state === 'complete' && (
                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {state === 'partial' && <span style={{ fontSize: '7px', fontWeight: 700 }}>~</span>}
                            </div>
                            <span style={{ color: state === 'complete' ? 'var(--dl-text)' : state === 'partial' ? 'var(--dl-text-secondary)' : 'var(--dl-text-muted)' }}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Metrics */}
                  <div className="dp-panel" style={{ flex: 0 }}>
                    <div className="dp-panel-title">
                      <Mic size={10} />
                      Live Metrics
                    </div>
                    <div className="dp-metrics-row">
                      <div className="dp-metric-pill">
                        <span className="dp-metric-value">{formatTime(elapsedSeconds)}</span>
                        <span className="dp-metric-label">Duration</span>
                      </div>
                      <div className="dp-metric-pill">
                        <span className="dp-metric-value">{wpm || '\u2014'}</span>
                        <span className="dp-metric-label">WPM</span>
                      </div>
                      <div className="dp-metric-pill">
                        <span className="dp-metric-value">{charIndex > 300 ? '2' : charIndex > 150 ? '1' : '0'}</span>
                        <span className="dp-metric-label">Fillers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}
