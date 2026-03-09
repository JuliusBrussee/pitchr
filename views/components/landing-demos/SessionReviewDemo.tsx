'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';

type ReviewState = 'idle' | 'overview' | 'transcript' | 'strengths' | 'suggestions' | 'summary';

const SCORES = [
  { label: 'Overall', value: 78, overall: true },
  { label: 'Clarity', value: 82, overall: false },
  { label: 'Confidence', value: 79, overall: false },
  { label: 'Concision', value: 71, overall: false },
  { label: 'Q&A', value: 68, overall: false },
];

const KEY_MOMENTS = [
  { time: '00:42', text: '"We solve the practice gap for founders who pitch more than once a quarter..."', label: 'Strong opening', type: 'good' as const },
  { time: '01:18', text: '"The market is, well, it\'s really big... all founders basically..."', label: 'Weak market explanation', type: 'warn' as const },
  { time: '03:07', text: '"That\'s not really what I meant — we\'re different because..."', label: 'Defensive answer', type: 'bad' as const },
];

const STRENGTHS = [
  'Clear problem framing',
  'Strong energy in opening',
  'Good answer structure in first Q&A response',
];

const WEAKNESSES = [
  'Market slide explanation too broad',
  'Proof points still vague',
  'Defensive answer to defensibility question',
];

const PRACTICE_SUGGESTIONS = [
  { text: 'Rehearse your market explanation in under 30 seconds', icon: '🎯', cta: 'Start practice' },
  { text: 'Add one concrete proof point to your traction answer', icon: '📊', cta: 'Open deck' },
  { text: 'Practice 3 rounds of defensibility Q&A', icon: '💬', cta: 'Run Q&A' },
  { text: 'Retry this session with tougher follow-up questions', icon: '🔄', cta: 'Retry' },
];

export function SessionReviewDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<ReviewState>('idle');
  const [animatedScores, setAnimatedScores] = useState<number[]>(SCORES.map(() => 0));
  const [highlightedMoment, setHighlightedMoment] = useState(-1);
  const [visibleMoments, setVisibleMoments] = useState(0);
  const [showStrengths, setShowStrengths] = useState(false);
  const [showWeaknesses, setShowWeaknesses] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // State machine
  useEffect(() => {
    if (!isVisible) return;

    const transitions: Partial<Record<ReviewState, [ReviewState, number]>> = {
      idle: ['overview', 400],
      overview: ['transcript', 1400],
      transcript: ['strengths', 2200],
      strengths: ['suggestions', 1800],
    };

    const next = transitions[state];
    if (!next) return;
    const t = setTimeout(() => setState(next[0]), next[1]);
    return () => clearTimeout(t);
  }, [state, isVisible]);

  // Score count-up animation
  useEffect(() => {
    if (state === 'idle') return;

    const duration = 700;
    const steps = 20;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScores(SCORES.map((s) => Math.round(s.value * eased)));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [state === 'idle']); // eslint-disable-line react-hooks/exhaustive-deps

  // Transcript moments
  useEffect(() => {
    if (state !== 'transcript' && state !== 'strengths' && state !== 'suggestions' && state !== 'summary') return;
    if (visibleMoments >= KEY_MOMENTS.length) return;

    const t = setTimeout(() => {
      setVisibleMoments((v) => v + 1);
      setHighlightedMoment(visibleMoments);
    }, visibleMoments === 0 ? 200 : 500);
    return () => clearTimeout(t);
  }, [state, visibleMoments]);

  // Strengths/weaknesses
  useEffect(() => {
    if (state !== 'strengths' && state !== 'suggestions' && state !== 'summary') return;
    const t1 = setTimeout(() => setShowStrengths(true), 200);
    const t2 = setTimeout(() => setShowWeaknesses(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [state]);

  // Practice suggestions
  useEffect(() => {
    if (state !== 'suggestions' && state !== 'summary') return;
    if (visibleSuggestions >= PRACTICE_SUGGESTIONS.length) {
      const t1 = setTimeout(() => setShowSummary(true), 600);
      const t2 = setTimeout(() => {
        setShowActions(true);
        setState('summary');
      }, 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    const t = setTimeout(() => setVisibleSuggestions((v) => v + 1), visibleSuggestions === 0 ? 300 : 250);
    return () => clearTimeout(t);
  }, [state, visibleSuggestions]);

  return (
    <section ref={sectionRef} className="dl-section">
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Session Review</div>
          <h2 className="dl-section-title">See what went well and<br />what still needs work.</h2>
          <p className="dl-section-subtitle">
            After every practice session, Pitchr helps you understand what happened,
            identify weak spots, and know exactly what to do next.
          </p>
        </div>

        <BrowserFrame url="app.pitchr.com/review/session-12">
          {/* Header */}
          <div className="dl-review-header">
            <div className="dl-review-session-info">
              <div className="dl-review-session-name">Seed Pitch Practice #12</div>
              <div className="dl-review-session-meta">
                <span>Mar 8, 2026</span>
                <span>4:32 duration</span>
                <span>8 questions</span>
              </div>
            </div>
          </div>

          {/* Score cards */}
          <div className="dl-review-scores">
            {SCORES.map((score, i) => (
              <div
                key={score.label}
                className={`dl-review-score ${score.overall ? 'dl-review-score--overall' : ''}`}
                style={{
                  opacity: state !== 'idle' ? 1 : 0,
                  transform: state !== 'idle' ? 'translateY(0)' : 'translateY(8px)',
                  transition: `all 0.4s ease ${i * 80}ms`,
                }}
              >
                <div
                  className="dl-review-score-value"
                  style={{ color: score.overall ? 'var(--dl-accent)' : score.value >= 75 ? 'var(--dl-green)' : score.value >= 70 ? 'var(--dl-orange)' : 'var(--dl-red)' }}
                >
                  {animatedScores[i]}
                </div>
                <div className="dl-review-score-label">{score.label}</div>
              </div>
            ))}
          </div>

          {/* Transcript + Key Moments */}
          <div className="dl-review-body">
            <div className="dl-review-panel">
              <div className="dl-review-panel-title">Key Moments</div>
              {KEY_MOMENTS.map((moment, i) => (
                <div
                  key={moment.time}
                  className={`dl-transcript-line ${highlightedMoment === i ? 'dl-transcript-line--highlight' : ''}`}
                  style={{
                    opacity: i < visibleMoments ? 1 : 0,
                    transform: i < visibleMoments ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'all 0.35s ease',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span className="dl-timestamp">{moment.time}</span>
                  <span style={{ flex: 1 }}>{moment.text}</span>
                </div>
              ))}
            </div>

            <div className="dl-review-panel">
              <div className="dl-review-panel-title">Insights</div>
              {KEY_MOMENTS.map((moment, i) => (
                <div
                  key={moment.label}
                  className="dl-review-insight"
                  style={{
                    opacity: i < visibleMoments ? 1 : 0,
                    transition: 'all 0.35s ease',
                  }}
                >
                  <div
                    className="dl-review-insight-icon"
                    style={{
                      background: moment.type === 'good' ? 'var(--dl-green-muted)' : moment.type === 'warn' ? 'var(--dl-orange-muted)' : 'var(--dl-red-muted)',
                      color: moment.type === 'good' ? 'var(--dl-green)' : moment.type === 'warn' ? 'var(--dl-orange)' : 'var(--dl-red)',
                    }}
                  >
                    {moment.type === 'good' ? '✓' : moment.type === 'warn' ? '!' : '✕'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--dl-text)', fontSize: '13px' }}>{moment.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--dl-text-muted)' }}>at {moment.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="dl-review-sw">
            <div
              className="dl-review-panel"
              style={{
                opacity: showStrengths ? 1 : 0,
                transform: showStrengths ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.4s ease',
              }}
            >
              <div className="dl-review-panel-title" style={{ color: 'var(--dl-green)' }}>Strengths</div>
              {STRENGTHS.map((item) => (
                <div key={item} className="dl-review-list-item">
                  <div className="dl-review-list-dot" style={{ background: 'var(--dl-green)' }} />
                  {item}
                </div>
              ))}
            </div>

            <div
              className="dl-review-panel"
              style={{
                opacity: showWeaknesses ? 1 : 0,
                transform: showWeaknesses ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.4s ease',
              }}
            >
              <div className="dl-review-panel-title" style={{ color: 'var(--dl-orange)' }}>Needs Work</div>
              {WEAKNESSES.map((item) => (
                <div key={item} className="dl-review-list-item">
                  <div className="dl-review-list-dot" style={{ background: 'var(--dl-orange)' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Practice Suggestions */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 650, letterSpacing: '0.03em', textTransform: 'uppercase' as const, color: 'var(--dl-text-muted)', marginBottom: '12px' }}>
              What to practice next
            </div>
            {PRACTICE_SUGGESTIONS.map((suggestion, i) => (
              <div
                key={suggestion.text}
                className="dl-practice-row"
                style={{
                  opacity: i < visibleSuggestions ? 1 : 0,
                  transform: i < visibleSuggestions ? 'translateY(0)' : 'translateY(8px)',
                  transition: `all 0.35s ease`,
                }}
              >
                <div className="dl-practice-icon" style={{ background: 'var(--dl-bg-input)', fontSize: '15px' }}>
                  {suggestion.icon}
                </div>
                <div className="dl-practice-text">{suggestion.text}</div>
                <div className="dl-practice-cta">{suggestion.cta}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {showSummary && (
            <div className="dl-summary" style={{ animation: 'dlFadeUp 0.4s ease both' }}>
              <div className="dl-summary-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dl-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div>
                <div style={{ color: 'var(--dl-text)', fontWeight: 600, marginBottom: '4px' }}>
                  You&apos;re improving.
                </div>
                The same two issues keep recurring: market clarity and proof. Practice those next before running another full investor session.
                {showActions && (
                  <div className="dl-actions" style={{ animation: 'dlFadeUp 0.35s ease both' }}>
                    <span className="dl-chip dl-chip--accent">Retry session</span>
                    <span className="dl-chip">Practice suggestions</span>
                    <span className="dl-chip">Start weekly challenge</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </BrowserFrame>
      </div>
    </section>
  );
}
