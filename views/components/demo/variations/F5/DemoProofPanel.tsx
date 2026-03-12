'use client';

import { useEffect, useState, useRef } from 'react';
import type { ProofPanel, ProofCard, MetricCard, QuoteCard, RubricCard, StatRowCard } from './demoData';

/* ——— Individual card renderers ——— */

function MetricCardView({ card }: { card: MetricCard }) {
  return (
    <div className="f5-proof-card f5-proof-card--metric">
      <span className="f5-proof-metric-value">{card.value}</span>
      <span className="f5-proof-metric-label">{card.label}</span>
    </div>
  );
}

function QuoteCardView({ card }: { card: QuoteCard }) {
  return (
    <div className="f5-proof-card f5-proof-card--quote">
      <p className="f5-proof-quote-text">&ldquo;{card.text}&rdquo;</p>
      {card.attribution && (
        <span className="f5-proof-quote-attr">{card.attribution}</span>
      )}
    </div>
  );
}

function RubricCardView({ card, animate }: { card: RubricCard; animate: boolean }) {
  return (
    <div className="f5-proof-card f5-proof-card--rubric">
      {card.bars.map((bar) => {
        const pct = (bar.score / bar.maxScore) * 100;
        return (
          <div className="f5-rubric-row" key={bar.label}>
            <div className="f5-rubric-row__header">
              <span className="f5-rubric-row__label">{bar.label}</span>
              <span className="f5-rubric-row__score">
                {bar.score}/{bar.maxScore}
              </span>
            </div>
            <div className="f5-rubric-row__track">
              <div
                className="f5-rubric-row__fill"
                style={{ width: animate ? `${pct}%` : '0%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatRowCardView({ card }: { card: StatRowCard }) {
  return (
    <div className="f5-proof-card f5-proof-card--statrow">
      {card.stats.map((stat, i) => (
        <div className="f5-stat-item" key={i}>
          {stat.icon && <span className="f5-stat-icon">{stat.icon}</span>}
          <span className="f5-stat-value">{stat.value}</span>
          <span className="f5-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProofCardRenderer({ card, index, animate }: { card: ProofCard; index: number; animate: boolean }) {
  switch (card.type) {
    case 'metric':
      return <MetricCardView card={card} />;
    case 'quote':
      return <QuoteCardView card={card} />;
    case 'rubric':
      return <RubricCardView card={card} animate={animate} />;
    case 'statrow':
      return <StatRowCardView card={card} />;
    default:
      return null;
  }
}

/* ——— Main proof panel ——— */

interface DemoProofPanelProps {
  panel?: ProofPanel;
  stepIndex: number;
}

export function DemoProofPanel({ panel, stepIndex }: DemoProofPanelProps) {
  const [animate, setAnimate] = useState(false);
  const prevStepRef = useRef(stepIndex);

  // Trigger rubric bar animation after panel slides in
  useEffect(() => {
    if (panel) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 600);
      return () => clearTimeout(timer);
    }
    setAnimate(false);
  }, [stepIndex, panel]);

  const isActive = !!panel;

  return (
    <div
      className={`f5-proof-panel${isActive ? ' f5-proof-panel--active' : ''}`}
      aria-hidden={!isActive}
    >
      {panel && (
        <div className="f5-proof-panel__inner" key={stepIndex}>
          <span className="f5-proof-panel__header">{panel.header}</span>
          <div className="f5-proof-panel__cards">
            {panel.cards.map((card, i) => (
              <div
                className="f5-proof-card-wrapper"
                key={`${stepIndex}-${i}`}
                style={{ animationDelay: `${200 + i * 150}ms` }}
              >
                <ProofCardRenderer card={card} index={i} animate={animate} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
