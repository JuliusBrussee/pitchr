'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Mini Loop Hook ───
function useMiniLoop(isVisible: boolean, totalDuration: number, restDuration: number = 900) {
  const [tick, setTick] = useState(0);
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const cycle = totalDuration + restDuration;
    const interval = setInterval(() => {
      setLoopKey((k) => k + 1);
      setTick(0);
    }, cycle);

    return () => clearInterval(interval);
  }, [isVisible, totalDuration, restDuration]);

  // Tick every 100ms for progress tracking
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => setTick((t) => t + 100), 100);
    return () => clearInterval(timer);
  }, [isVisible, loopKey]);

  return { tick, loopKey };
}

// ─── Tile 1: Deck Generation ───
function DeckGenTile({ isVisible }: { isVisible: boolean }) {
  const { tick, loopKey } = useMiniLoop(isVisible, 5000);

  const showInput = tick >= 0;
  const showClick = tick >= 800;
  const showSlides = tick >= 1400;
  const slideCount = showSlides ? Math.min(Math.floor((tick - 1400) / 200), 6) : 0;
  const showPreview = tick >= 3400;

  const slides = ['Problem', 'Why Now', 'Solution', 'Product', 'Market', 'Traction'];

  return (
    <div className="dl-bento-demo" key={loopKey}>
      {/* Input field */}
      <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', marginBottom: '8px' }}>
        {showInput && (
          <div className="dl-field-value" style={{ fontSize: '11px', padding: '6px 8px' }}>
            AI pitch practice for founders
            {!showClick && <span className="dl-cursor" style={{ height: '11px' }} />}
          </div>
        )}
      </div>

      {/* Generate button */}
      {showClick && !showSlides && (
        <div style={{ animation: 'dlFadeUp 0.2s ease both' }}>
          <div className="dl-btn-primary" style={{ fontSize: '10px', padding: '5px 10px', width: '100%', justifyContent: 'center' }}>
            Generating...
          </div>
        </div>
      )}

      {/* Slide outline */}
      {showSlides && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {slides.map((slide, i) => (
            <div
              key={slide}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                color: i < slideCount ? 'var(--dl-text)' : 'transparent',
                background: i < slideCount ? (showPreview && i === 1 ? 'var(--dl-bg-card)' : 'transparent') : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', minWidth: '12px' }}>{i + 1}</span>
              {slide}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tile 2: Live Q&A ───
function LiveQATile({ isVisible }: { isVisible: boolean }) {
  const { tick, loopKey } = useMiniLoop(isVisible, 5500);

  const showQ1 = tick >= 200;
  const showTranscript = tick >= 1200;
  const transcriptLines = showTranscript ? Math.min(Math.floor((tick - 1200) / 500), 2) : 0;
  const showQ2 = tick >= 3000;
  const showTag = tick >= 4500;

  return (
    <div className="dl-bento-demo" key={loopKey}>
      {/* Question card */}
      <div
        style={{
          background: 'var(--dl-bg-card)',
          border: '1px solid var(--dl-border)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '8px',
          opacity: showQ1 ? 1 : 0,
          transition: 'all 0.35s ease',
          color: 'var(--dl-text)',
        }}
      >
        {showQ2 ? 'What proof do you have?' : 'Why a company, not a feature?'}
      </div>

      {/* Transcript */}
      {['The core problem isn\'t just writing...', 'It\'s ongoing practice and review...'].map((line, i) => (
        <div
          key={`${loopKey}-${i}`}
          style={{
            fontSize: '11px',
            color: 'var(--dl-text-secondary)',
            padding: '3px 6px',
            opacity: i < transcriptLines ? 1 : 0,
            transition: 'all 0.3s ease',
          }}
        >
          {line}
        </div>
      ))}

      {/* Feedback tag */}
      {showTag && (
        <div style={{ marginTop: '6px', animation: 'dlFadeUp 0.3s ease both' }}>
          <span className="dl-feedback-tag dl-feedback-tag--good" style={{ fontSize: '10px', padding: '2px 8px' }}>
            ✓ Strong structure
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Tile 3: Session Review ───
function SessionReviewTile({ isVisible }: { isVisible: boolean }) {
  const { tick, loopKey } = useMiniLoop(isVisible, 5000);

  const showScore = tick >= 200;
  const showHighlight = tick >= 1200;
  const showStrength = tick >= 2400;
  const showWeak = tick >= 3400;

  return (
    <div className="dl-bento-demo" key={loopKey}>
      {/* Mini score */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {[{ l: 'Overall', v: 78, c: 'var(--dl-accent)' }, { l: 'Clarity', v: 82, c: 'var(--dl-blue)' }, { l: 'Q&A', v: 68, c: 'var(--dl-red)' }].map((s) => (
          <div
            key={s.l}
            style={{
              textAlign: 'center',
              opacity: showScore ? 1 : 0,
              transition: 'all 0.4s ease',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 750, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{showScore ? s.v : 0}</div>
            <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', textTransform: 'uppercase' as const, fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Transcript highlight */}
      <div
        className={`dl-transcript-line ${showHighlight ? 'dl-transcript-line--highlight' : ''}`}
        style={{ fontSize: '11px', padding: '4px 6px', marginBottom: '8px', transition: 'all 0.5s ease' }}
      >
        &quot;The market is really big...&quot;
      </div>

      {/* Strength/Weakness cards */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div className="dl-mini-card" style={{ flex: 1, opacity: showStrength ? 1 : 0, transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--dl-green)', marginBottom: '2px' }}>STRENGTH</div>
          <div style={{ fontSize: '10px', color: 'var(--dl-text-secondary)' }}>Clear problem framing</div>
        </div>
        <div className="dl-mini-card" style={{ flex: 1, opacity: showWeak ? 1 : 0, transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--dl-orange)', marginBottom: '2px' }}>NEEDS WORK</div>
          <div style={{ fontSize: '10px', color: 'var(--dl-text-secondary)' }}>Market too broad</div>
        </div>
      </div>
    </div>
  );
}

// ─── Tile 4: Practice Suggestions ───
function PracticeTile({ isVisible }: { isVisible: boolean }) {
  const { tick, loopKey } = useMiniLoop(isVisible, 5000);

  const showHighlight = tick >= 200;
  const suggestions = ['Tighten market answer', 'Practice defensibility Q&A', 'Add proof point'];
  const visibleSuggestions = tick >= 1000 ? Math.min(Math.floor((tick - 1000) / 500), 3) : 0;
  const showCta = tick >= 3500;

  return (
    <div className="dl-bento-demo" key={loopKey}>
      {/* Weakness highlight */}
      <div
        style={{
          fontSize: '11px',
          padding: '6px 8px',
          borderRadius: '6px',
          background: showHighlight ? 'var(--dl-orange-muted)' : 'transparent',
          border: `1px solid ${showHighlight ? 'rgba(255, 170, 51, 0.15)' : 'transparent'}`,
          color: showHighlight ? 'var(--dl-orange)' : 'var(--dl-text-muted)',
          marginBottom: '10px',
          transition: 'all 0.4s ease',
          fontWeight: 600,
        }}
      >
        ! Market clarity needs work
      </div>

      {/* Suggestion list */}
      {suggestions.map((s, i) => (
        <div
          key={s}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 6px',
            fontSize: '11px',
            color: 'var(--dl-text-secondary)',
            opacity: i < visibleSuggestions ? 1 : 0,
            transform: i < visibleSuggestions ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--dl-accent)', flexShrink: 0 }} />
          {s}
        </div>
      ))}

      {/* CTA */}
      {showCta && (
        <div style={{ marginTop: '8px', animation: 'dlFadeUp 0.3s ease both' }}>
          <span className="dl-chip dl-chip--accent" style={{ fontSize: '10px', padding: '3px 10px' }}>Start practice</span>
        </div>
      )}
    </div>
  );
}

// ─── Tile 5: Weekly Challenges ───
function ChallengesTile({ isVisible }: { isVisible: boolean }) {
  const { tick, loopKey } = useMiniLoop(isVisible, 5500);

  const challenges = [
    'Nail your 30-second opener',
    'Defend your market size',
    'Handle the feature objection',
  ];

  const visibleCards = tick >= 200 ? Math.min(Math.floor((tick - 200) / 400), 3) : 0;
  const expandedCard = tick >= 2000 ? 2 : -1;
  const showTimer = tick >= 2800;
  const showComplete = tick >= 4200;

  return (
    <div className="dl-bento-demo" key={loopKey}>
      {challenges.map((challenge, i) => (
        <div
          key={challenge}
          className={`dl-mini-card ${expandedCard === i ? 'dl-mini-card--active' : ''}`}
          style={{
            opacity: i < visibleCards ? 1 : 0,
            transform: i < visibleCards ? 'translateY(0)' : 'translateY(6px)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ fontSize: '11px', color: expandedCard === i ? 'var(--dl-text)' : 'var(--dl-text-secondary)', fontWeight: expandedCard === i ? 600 : 400 }}>
            {challenge}
          </div>
          {expandedCard === i && showTimer && !showComplete && (
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginTop: '4px', animation: 'dlFadeUp 0.2s ease both' }}>
              ⏱ 6 min • Medium
            </div>
          )}
          {expandedCard === i && showComplete && (
            <div style={{ fontSize: '10px', color: 'var(--dl-green)', marginTop: '4px', fontWeight: 600, animation: 'dlFadeUp 0.3s ease both' }}>
              ✓ Completed
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Tile 6: Progress Tracking ───
function ProgressTile({ isVisible }: { isVisible: boolean }) {
  const { tick, loopKey } = useMiniLoop(isVisible, 5500);

  const points = [68, 71, 73, 77, 78];
  const showChart = tick >= 200;
  const chartProgress = showChart ? Math.min((tick - 200) / 800, 1) : 0;
  const visiblePoints = Math.floor(chartProgress * points.length);
  const showLabel = tick >= 1500;
  const showWeak = tick >= 2500;
  const showRec = tick >= 3800;

  const maxVal = 100;
  const chartW = 180;
  const chartH = 60;

  return (
    <div className="dl-bento-demo" key={loopKey}>
      {/* Mini line chart */}
      <svg width={chartW} height={chartH} style={{ display: 'block', marginBottom: '8px' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" y1={chartH * (1 - p)} x2={chartW} y2={chartH * (1 - p)} stroke="var(--dl-border)" strokeWidth="0.5" />
        ))}

        {/* Area fill */}
        {visiblePoints >= 2 && (
          <path
            d={points.slice(0, visiblePoints).map((v, i) => {
              const x = (i / (points.length - 1)) * chartW;
              const y = chartH - (v / maxVal) * chartH;
              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ') + ` L${((visiblePoints - 1) / (points.length - 1)) * chartW},${chartH} L0,${chartH} Z`}
            fill="var(--dl-accent-glow)"
            opacity="0.5"
          />
        )}

        {/* Line */}
        {visiblePoints >= 2 && (
          <polyline
            points={points.slice(0, visiblePoints).map((v, i) => {
              const x = (i / (points.length - 1)) * chartW;
              const y = chartH - (v / maxVal) * chartH;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--dl-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points */}
        {points.slice(0, visiblePoints).map((v, i) => {
          const x = (i / (points.length - 1)) * chartW;
          const y = chartH - (v / maxVal) * chartH;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === visiblePoints - 1 ? 4 : 2.5}
              fill={i === visiblePoints - 1 ? 'var(--dl-accent)' : 'var(--dl-bg-card)'}
              stroke="var(--dl-accent)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      {/* Trend label */}
      {showLabel && (
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dl-green)', marginBottom: '6px', animation: 'dlFadeUp 0.3s ease both' }}>
          +10 points in 5 sessions
        </div>
      )}

      {/* Weak category */}
      {showWeak && (
        <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', animation: 'dlFadeUp 0.3s ease both' }}>
          Weakest: <span style={{ color: 'var(--dl-red)' }}>Q&A 68</span>
        </div>
      )}

      {/* Recommendation */}
      {showRec && (
        <div style={{ marginTop: '6px', animation: 'dlFadeUp 0.3s ease both' }}>
          <span className="dl-chip" style={{ fontSize: '10px', padding: '3px 10px' }}>Focus: Q&A practice</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Bento Grid ───
export function BentoGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tiles = [
    {
      label: 'Deck Generation',
      desc: 'Turn startup context into a clear pitch structure.',
      Demo: DeckGenTile,
    },
    {
      label: 'Live Q&A',
      desc: 'Practice the questions investors actually ask.',
      Demo: LiveQATile,
    },
    {
      label: 'Session Review',
      desc: 'See what went well and what still needs work.',
      Demo: SessionReviewTile,
    },
    {
      label: 'Practice Suggestions',
      desc: 'Know exactly what to work on next.',
      Demo: PracticeTile,
    },
    {
      label: 'Weekly Challenges',
      desc: 'Build consistency with focused drills each week.',
      Demo: ChallengesTile,
    },
    {
      label: 'Progress Tracking',
      desc: 'Measure how your pitch improves over time.',
      Demo: ProgressTile,
    },
  ];

  return (
    <section ref={sectionRef} className="dl-section">
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Full Workflow</div>
          <h2 className="dl-section-title">A complete pitch workflow,<br />built into one product.</h2>
          <p className="dl-section-subtitle">
            Generate, practice, review, and improve — without guessing what to do next.
          </p>
        </div>

        <div className="dl-bento">
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              className="dl-bento-tile"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s ease ${i * 100}ms`,
              }}
            >
              <div className="dl-bento-label">{tile.label}</div>
              <div className="dl-bento-desc">{tile.desc}</div>
              <tile.Demo isVisible={isVisible} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
