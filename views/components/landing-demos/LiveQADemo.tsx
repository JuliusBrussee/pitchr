'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';

type QAState = 'idle' | 'question_shown' | 'answering' | 'analyzing' | 'followup' | 'answering2' | 'evaluation' | 'summary';

const QUESTION_1 = 'Why does this need to be a company, not a feature?';
const QUESTION_2 = 'What proof do you have that founders actually improve with Pitchr?';

const TRANSCRIPT_1 = [
  'We think the core problem isn\'t just pitch writing...',
  'It\'s ongoing practice, review, and improvement over time...',
  'That creates a workflow, not a single feature.',
];

const TRANSCRIPT_2 = [
  'After 5 sessions, founders see an average 14-point score increase...',
  'The biggest gains come from Q&A handling and clarity...',
];

const FEEDBACK_TAGS = [
  { label: 'Strong structure', type: 'good' as const },
  { label: 'Needs more proof', type: 'warn' as const },
];

const METRICS_INITIAL = [
  { label: 'Clarity', value: 72, color: 'var(--dl-blue)' },
  { label: 'Confidence', value: 68, color: 'var(--dl-green)' },
  { label: 'Concision', value: 75, color: 'var(--dl-purple)' },
];

const METRICS_UPDATED = [
  { label: 'Clarity', value: 76, color: 'var(--dl-blue)' },
  { label: 'Confidence', value: 71, color: 'var(--dl-green)' },
  { label: 'Concision', value: 73, color: 'var(--dl-purple)' },
];

const WAVE_BARS = 12;

export function LiveQADemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<QAState>('idle');
  const [visibleTranscript, setVisibleTranscript] = useState(0);
  const [visibleTranscript2, setVisibleTranscript2] = useState(0);
  const [timerSec, setTimerSec] = useState(0);
  const [visibleTags, setVisibleTags] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [waveActive, setWaveActive] = useState(false);

  // Scroll trigger
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // State machine
  useEffect(() => {
    if (!isVisible) return;

    const transitions: Partial<Record<QAState, [QAState, number]>> = {
      idle: ['question_shown', 500],
      question_shown: ['answering', 1200],
      answering: ['analyzing', 2400],
      analyzing: ['followup', 800],
      followup: ['answering2', 1200],
      answering2: ['evaluation', 2000],
    };

    const next = transitions[state];
    if (!next) return;
    const t = setTimeout(() => setState(next[0]), next[1]);
    return () => clearTimeout(t);
  }, [state, isVisible]);

  // Transcript 1 animation
  useEffect(() => {
    if (state !== 'answering') return;
    setWaveActive(true);
    if (visibleTranscript >= TRANSCRIPT_1.length) return;
    const t = setTimeout(() => setVisibleTranscript((v) => v + 1), visibleTranscript === 0 ? 300 : 600);
    return () => clearTimeout(t);
  }, [state, visibleTranscript]);

  // Transcript 2 animation
  useEffect(() => {
    if (state !== 'answering2') return;
    setWaveActive(true);
    if (visibleTranscript2 >= TRANSCRIPT_2.length) return;
    const t = setTimeout(() => setVisibleTranscript2((v) => v + 1), visibleTranscript2 === 0 ? 300 : 600);
    return () => clearTimeout(t);
  }, [state, visibleTranscript2]);

  // Stop wave on non-answering states
  useEffect(() => {
    if (state !== 'answering' && state !== 'answering2') {
      setWaveActive(false);
    }
  }, [state]);

  // Timer
  useEffect(() => {
    if (state === 'idle' || state === 'question_shown') return;
    const interval = setInterval(() => setTimerSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Evaluation flow
  useEffect(() => {
    if (state !== 'evaluation') return;
    const t1 = setTimeout(() => setVisibleTags(1), 400);
    const t2 = setTimeout(() => setVisibleTags(2), 800);
    const t3 = setTimeout(() => setShowSummary(true), 1400);
    const t4 = setTimeout(() => {
      setShowActions(true);
      setState('summary');
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [state]);

  const currentQuestion = state === 'followup' || state === 'answering2' || state === 'evaluation' || state === 'summary' ? QUESTION_2 : QUESTION_1;
  const isQ2 = state === 'followup' || state === 'answering2' || state === 'evaluation' || state === 'summary';
  const metrics = isQ2 ? METRICS_UPDATED : METRICS_INITIAL;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <section ref={sectionRef} className="dl-section">
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Live Practice</div>
          <h2 className="dl-section-title">Practice the questions<br />investors actually ask.</h2>
          <p className="dl-section-subtitle">
            Pitchr simulates investor questioning and forces sharper answers in real time.
            Handle objections before they cost you the round.
          </p>
        </div>

        <BrowserFrame url="app.pitchr.com/session/live-qa">
          <div className="dl-qa-layout">
            <div className="dl-qa-main">
              {/* Status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="dl-qa-status">
                  <span className="dl-qa-status-dot" />
                  Live Session
                </div>
                <div className="dl-qa-timer">{formatTime(timerSec)}</div>
              </div>

              {/* Question card */}
              <div
                className="dl-qa-question"
                key={currentQuestion}
                style={{
                  animation: state !== 'idle' ? 'dlFadeUp 0.45s ease both' : undefined,
                  opacity: state === 'idle' ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: 'var(--dl-text-muted)', marginBottom: '8px' }}>
                  Investor Question {isQ2 ? '#2' : '#1'}
                </div>
                {currentQuestion}
              </div>

              {/* Transcript area */}
              <div className="dl-qa-transcript">
                <div className="dl-qa-transcript-header">
                  {/* Waveform */}
                  <div className="dl-qa-waveform">
                    {Array.from({ length: WAVE_BARS }).map((_, i) => (
                      <div
                        key={i}
                        className="dl-qa-waveform-bar"
                        style={{
                          height: waveActive ? `${4 + Math.random() * 12}px` : '3px',
                          animationDelay: `${i * 50}ms`,
                          transition: 'height 0.15s ease',
                          ...(waveActive ? { animation: `dlWaveBar ${0.3 + Math.random() * 0.3}s ease-in-out infinite ${i * 0.05}s` } : {}),
                        }}
                      />
                    ))}
                  </div>
                  <span>Your Response</span>
                </div>

                {/* First answer */}
                {TRANSCRIPT_1.map((line, i) => (
                  <div
                    key={`t1-${i}`}
                    className="dl-transcript-line"
                    style={{
                      opacity: i < visibleTranscript ? 1 : 0,
                      transform: i < visibleTranscript ? 'translateY(0)' : 'translateY(6px)',
                      transition: 'all 0.35s ease',
                    }}
                  >
                    {line}
                  </div>
                ))}

                {/* Analyzing indicator */}
                {state === 'analyzing' && (
                  <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--dl-text-muted)', fontStyle: 'italic', animation: 'dlFadeUp 0.3s ease both' }}>
                    Analyzing response...
                  </div>
                )}

                {/* Second answer */}
                {isQ2 && TRANSCRIPT_2.map((line, i) => (
                  <div
                    key={`t2-${i}`}
                    className="dl-transcript-line"
                    style={{
                      opacity: i < visibleTranscript2 ? 1 : 0,
                      transform: i < visibleTranscript2 ? 'translateY(0)' : 'translateY(6px)',
                      transition: 'all 0.35s ease',
                    }}
                  >
                    {line}
                  </div>
                ))}

                {/* Feedback tags */}
                {visibleTags > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {FEEDBACK_TAGS.slice(0, visibleTags).map((tag, i) => (
                      <span
                        key={tag.label}
                        className={`dl-feedback-tag dl-feedback-tag--${tag.type}`}
                        style={{ animation: `dlFadeUp 0.3s ease ${i * 100}ms both` }}
                      >
                        {tag.type === 'good' ? '✓' : '!'} {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {showSummary && (
                <div className="dl-summary" style={{ animation: 'dlFadeUp 0.4s ease both' }}>
                  <div className="dl-summary-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dl-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'var(--dl-text)', fontWeight: 600, marginBottom: '4px' }}>
                      Good start.
                    </div>
                    You handled the company-vs-feature question well, but your proof points need to be sharper.
                    {showActions && (
                      <div className="dl-actions" style={{ animation: 'dlFadeUp 0.35s ease both' }}>
                        <span className="dl-chip dl-chip--accent">Review this session</span>
                        <span className="dl-chip">Keep practicing</span>
                        <span className="dl-chip">Try tougher questions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metrics rail */}
            <div className="dl-qa-metrics">
              {metrics.map((metric) => (
                <div key={metric.label} className="dl-qa-metric">
                  <div className="dl-qa-metric-label">{metric.label}</div>
                  <div className="dl-qa-metric-value" style={{ color: metric.color }}>
                    {metric.value}
                  </div>
                  <div className="dl-qa-metric-bar">
                    <div
                      className="dl-qa-metric-fill"
                      style={{
                        width: state !== 'idle' ? `${metric.value}%` : '0%',
                        background: metric.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}
