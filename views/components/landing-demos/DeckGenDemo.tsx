'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';

type DeckState = 'idle' | 'typing' | 'generating' | 'building' | 'result' | 'next_actions';

const FIELDS = [
  { label: 'Company', value: 'Pitchr' },
  { label: 'What you do', value: 'AI pitch practice and feedback for founders' },
  { label: 'Target customer', value: 'Early-stage founders preparing for investors' },
  { label: 'Problem', value: 'Most founders practice too little and get weak feedback too late' },
  { label: 'Why now', value: 'AI voice models and real-time evaluation make scalable pitch coaching possible' },
  { label: 'Traction', value: '400+ pitch sessions analyzed, 82% avg improvement after 5 sessions' },
  { label: 'Goal', value: 'Seed round — $2.5M' },
];

const GEN_STEPS = [
  'Structuring story arc',
  'Drafting slide sequence',
  'Generating key points',
  'Creating speaker prompts',
];

const SLIDES = [
  'Problem',
  'Why Now',
  'Solution',
  'Product',
  'Market',
  'Business Model',
  'Traction',
  'Go-to-Market',
  'Competition',
  'Team',
  'Ask',
];

const SLIDE_PREVIEW = {
  title: 'Why Now',
  bullets: [
    'Founders pitch more often and earlier than ever before',
    'Investors expect clearer narratives sooner in the process',
    'Real-time AI evaluation now makes scalable pitch coaching possible',
  ],
  note: 'Speaker note: Emphasize the shift in investor expectations. Pause after "scalable" for impact.',
};

const NEXT_ACTIONS = [
  { label: 'Practice this deck', accent: true },
  { label: 'Run live Q&A', accent: false },
  { label: 'Review talking points', accent: false },
];

export function DeckGenDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<DeckState>('idle');
  const [typingField, setTypingField] = useState(0);
  const [typingChar, setTypingChar] = useState(0);
  const [genStep, setGenStep] = useState(-1);
  const [visibleSlides, setVisibleSlides] = useState(0);
  const [selectedSlide, setSelectedSlide] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);
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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // State machine
  useEffect(() => {
    if (!isVisible) return;

    if (state === 'idle') {
      const t = setTimeout(() => setState('typing'), 600);
      return () => clearTimeout(t);
    }
  }, [state, isVisible]);

  // Typing animation — type the last two fields character by character
  useEffect(() => {
    if (state !== 'typing') return;

    const startField = 5; // Start typing from field 5 (Traction)
    const currentFieldIdx = startField + typingField;

    if (currentFieldIdx >= FIELDS.length) {
      const t = setTimeout(() => setState('generating'), 500);
      return () => clearTimeout(t);
    }

    const fieldValue = FIELDS[currentFieldIdx].value;
    if (typingChar >= fieldValue.length) {
      const t = setTimeout(() => {
        setTypingField((f) => f + 1);
        setTypingChar(0);
      }, 300);
      return () => clearTimeout(t);
    }

    const char = fieldValue[typingChar];
    const delay = char === ',' || char === '—' ? 120 : char === ' ' ? 35 : 25;
    const t = setTimeout(() => setTypingChar((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [state, typingField, typingChar]);

  // Generation steps
  useEffect(() => {
    if (state !== 'generating') return;

    if (genStep >= GEN_STEPS.length - 1) {
      const t = setTimeout(() => setState('building'), 400);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setGenStep((s) => s + 1), genStep === -1 ? 300 : 550);
    return () => clearTimeout(t);
  }, [state, genStep]);

  // Build slide list
  useEffect(() => {
    if (state !== 'building') return;

    if (visibleSlides >= SLIDES.length) {
      const t = setTimeout(() => {
        setSelectedSlide(1); // Select "Why Now"
        setTimeout(() => setShowPreview(true), 350);
        setTimeout(() => setState('result'), 600);
      }, 300);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setVisibleSlides((v) => v + 1), 100);
    return () => clearTimeout(t);
  }, [state, visibleSlides]);

  // Result → next actions
  useEffect(() => {
    if (state !== 'result') return;
    const t1 = setTimeout(() => setShowSummary(true), 800);
    const t2 = setTimeout(() => {
      setShowActions(true);
      setState('next_actions');
    }, 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [state]);

  const getFieldDisplay = (index: number) => {
    const startField = 5;
    const currentFieldIdx = startField + typingField;

    if (state === 'idle' || (state === 'typing' && index > currentFieldIdx)) {
      if (index >= startField) return '';
      return FIELDS[index].value;
    }

    if (state === 'typing' && index === currentFieldIdx) {
      return FIELDS[index].value.slice(0, typingChar);
    }

    return FIELDS[index].value;
  };

  const isFieldActive = (index: number) => {
    const startField = 5;
    return state === 'typing' && index === startField + typingField;
  };

  const showGenerating = state === 'generating' || state === 'building';
  const showResult = state === 'building' || state === 'result' || state === 'next_actions';

  return (
    <section ref={sectionRef} className="dl-section dl-hero">
      <div className="dl-container">
        <div className="dl-hero-badge">
          <div className="dl-hero-badge-dot" />
          AI Pitch Coaching
        </div>

        <h1>
          Generate, practice, review.<br />
          <span className="accent" style={{ color: 'var(--dl-accent)' }}>Ship pitches that close rounds.</span>
        </h1>

        <p className="dl-hero-sub">
          Enter your startup context. Get a pitch structure you can immediately
          practice from, with live Q&A, session review, and improvement tracking built in.
        </p>

        <BrowserFrame url="app.pitchr.com/deck/new">
          {/* Pre-generation: input fields */}
          {!showResult && (
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 650, letterSpacing: '-0.02em', marginBottom: '20px' }}>
                Generate your pitch deck
              </div>

              <div className="dl-input-group">
                {FIELDS.map((field, i) => (
                  <div key={field.label} className="dl-field">
                    <div className="dl-field-label">{field.label}</div>
                    <div className={`dl-field-value ${isFieldActive(i) ? 'dl-field-value--active' : ''}`}>
                      {getFieldDisplay(i) || <span style={{ color: 'var(--dl-text-muted)' }}>Enter {field.label.toLowerCase()}...</span>}
                      {isFieldActive(i) && <span className="dl-cursor" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Generation steps */}
              {showGenerating && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--dl-border)' }}>
                  {GEN_STEPS.map((step, i) => (
                    <div
                      key={step}
                      className={`dl-gen-step ${i <= genStep ? (i < genStep ? 'dl-gen-step--done' : 'dl-gen-step--active') : ''}`}
                    >
                      <div className="dl-gen-step-dot">
                        {i < genStep && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {/* CTA button */}
              {(state === 'typing' && typingField >= 2) && (
                <div style={{ marginTop: '20px' }}>
                  <button
                    className="dl-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Generate Deck
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Post-generation: deck outline + preview */}
          {showResult && (
            <div className="dl-deck-layout" style={{ animation: 'dlFadeUp 0.5s ease both' }}>
              {/* Slide outline sidebar */}
              <div className="dl-deck-sidebar">
                <div className="dl-deck-sidebar-title">Slide Outline</div>
                {SLIDES.map((slide, i) => (
                  <div
                    key={slide}
                    className={`dl-slide-row ${selectedSlide === i ? 'dl-slide-row--active' : ''}`}
                    style={{
                      opacity: i < visibleSlides ? 1 : 0,
                      transform: i < visibleSlides ? 'translateY(0)' : 'translateY(8px)',
                      transition: `all 0.3s ease ${i * 60}ms`,
                    }}
                  >
                    <div className="dl-slide-num">{i + 1}</div>
                    {slide}
                  </div>
                ))}
              </div>

              {/* Selected slide preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {showPreview && (
                  <div className="dl-slide-preview" style={{ animation: 'dlScaleIn 0.4s ease both' }}>
                    <div className="dl-slide-preview-title">{SLIDE_PREVIEW.title}</div>
                    {SLIDE_PREVIEW.bullets.map((bullet) => (
                      <div key={bullet} className="dl-slide-preview-bullet">{bullet}</div>
                    ))}
                    <div className="dl-slide-preview-note">{SLIDE_PREVIEW.note}</div>
                  </div>
                )}

                {/* Summary banner */}
                {showSummary && (
                  <div className="dl-summary" style={{ animation: 'dlFadeUp 0.4s ease both' }}>
                    <div className="dl-summary-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dl-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: 'var(--dl-text)', fontWeight: 600, marginBottom: '4px' }}>
                        Your deck draft is ready.
                      </div>
                      Next, practice it live, run investor Q&A, or refine your talking points.
                      {showActions && (
                        <div className="dl-actions" style={{ animation: 'dlFadeUp 0.35s ease both' }}>
                          {NEXT_ACTIONS.map((action) => (
                            <span
                              key={action.label}
                              className={`dl-chip ${action.accent ? 'dl-chip--accent' : ''}`}
                            >
                              {action.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
