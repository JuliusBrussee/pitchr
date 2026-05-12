'use client';

import { useState, useEffect } from 'react';
import { ScoreHero } from '@/views/components/results/ScoreHero';
import { RubricBreakdown } from '@/views/components/results/RubricBreakdown';
import { TopFixes } from '@/views/components/results/TopFixes';
import { DeliveryEventsTimeline } from '@/views/components/results/DeliveryEventsTimeline';
import type { FeedbackOutput, DeliveryEvent } from '@/types/analysis-v2';

/**
 * Video Capture Page — renders Pitchr results UI with mock data
 * for screen recording in the launch video (Scene 3B / 4C).
 *
 * Access at: /video-capture?score=62  or  /video-capture?score=85
 */

const EVENTS_62: DeliveryEvent[] = [
  { id: 'e1', type: 'filler', start_sec: 12, end_sec: 12.5, label: 'like', evidence: '"...we are, like, building..."', severity: 'medium' },
  { id: 'e2', type: 'hesitation', start_sec: 18, end_sec: 20, label: 'long pause', evidence: '2-second silence', severity: 'high' },
  { id: 'e3', type: 'filler', start_sec: 23, end_sec: 23.5, label: 'basically', evidence: '"...basically, founders struggle..."', severity: 'medium' },
  { id: 'e4', type: 'stutter', start_sec: 27, end_sec: 28, label: 'restart', evidence: '"the pro— the problem is..."', severity: 'high' },
  { id: 'e5', type: 'filler', start_sec: 31, end_sec: 31.3, label: 'um', evidence: '"...um, so what we do is..."', severity: 'low' },
  { id: 'e6', type: 'repetition', start_sec: 38, end_sec: 39, label: 'repeated', evidence: '"we solve... we solve the..."', severity: 'medium' },
  { id: 'e7', type: 'vocab', start_sec: 45, end_sec: 45.5, label: 'hedge', evidence: '"kind of" — weakens claim', severity: 'low' },
];

function makeFeedback(score: number): FeedbackOutput {
  const is85 = score >= 80;

  return {
    overall_score: score,
    one_line_verdict: is85
      ? 'Strong, structured pitch with clear value proposition and confident delivery. Minor timing adjustments would push this to perfection.'
      : 'Promising content undermined by frequent filler words, hesitation, and unclear market sizing. Structure needs tightening.',
    rubric_breakdown: [
      { category: 'structure', score: is85 ? 18 : 14, max_score: 20, rationale: is85 ? 'Clear problem → solution → market → ask flow with strong transitions' : 'Missing clear transition between problem and solution. Ask is buried at the end.' },
      { category: 'clarity', score: is85 ? 17 : 13, max_score: 20, rationale: is85 ? 'Concise language with minimal jargon. Value prop lands in first 15 seconds.' : 'Too many technical terms without context. Value prop takes 40 seconds to emerge.' },
      { category: 'evidence', score: is85 ? 17 : 11, max_score: 20, rationale: is85 ? 'Specific metrics cited: 3 pilot customers, 40% time reduction, $2M pipeline.' : 'Claims lack supporting data. "Huge market" without TAM figures.' },
      { category: 'market', score: is85 ? 16 : 12, max_score: 20, rationale: is85 ? 'TAM/SAM clearly articulated. Wedge strategy is compelling.' : 'Market size mentioned but not quantified. No competitive differentiation.' },
      { category: 'delivery', score: is85 ? 17 : 12, max_score: 20, rationale: is85 ? 'Strong pacing at 142 WPM. Natural pauses for emphasis. Minimal fillers.' : '8 filler words in 90 seconds. Speaking pace erratic (110-180 WPM). Frequent hesitation.' },
    ],
    top_fixes: is85
      ? [
          { rank: 1, category: 'delivery', issue: 'Slight rush in the market section — pace jumps to 165 WPM', fix: 'Add a deliberate pause before the TAM figure. Let the number land.', impact: 'medium' },
          { rank: 2, category: 'evidence', issue: 'Pilot customer names not mentioned', fix: 'Name at least one recognizable customer for social proof.', impact: 'medium' },
        ]
      : [
          { rank: 1, category: 'structure', issue: 'No clear problem statement in the first 15 seconds', fix: 'Lead with: "Founders lose $X billion annually because their pitches fail to communicate value."', impact: 'high' },
          { rank: 2, category: 'delivery', issue: '8 filler words ("um", "like", "basically") in 90 seconds', fix: 'Replace filler pauses with deliberate silence. Practice the transition sentences until they flow naturally.', impact: 'high' },
          { rank: 3, category: 'evidence', issue: '"Huge market" claim with no supporting data', fix: 'State specific TAM: "The pitch coaching market is $4.2B globally, growing 23% YoY."', impact: 'high' },
          { rank: 4, category: 'market', issue: 'No competitive differentiation mentioned', fix: 'Add: "Unlike generic AI writing tools, Pitchr scores against the same rubric VCs use internally."', impact: 'medium' },
        ],
    rewrite_script: '',
    spoken_score: score,
    deck_score: null,
    pre_penalty_overall: score + 2,
    penalty: 2,
    delivery_metrics: {
      word_count: is85 ? 210 : 180,
      duration_seconds: is85 ? 88 : 95,
      target_wpm: 150,
      wpm: is85 ? 142 : 114,
      filler_count: is85 ? 2 : 8,
      filler_rate: is85 ? 0.01 : 0.044,
      disfluency_count: is85 ? 1 : 4,
      stutter_rate: is85 ? 0.005 : 0.022,
      repeated_ngram_tokens: is85 ? 0 : 3,
      repeat_rate: is85 ? 0 : 0.017,
      within_time_limit: true,
      pace_score_component: is85 ? 4.5 : 3.2,
      filler_score_component: is85 ? 4.8 : 2.7,
      stutter_score_component: is85 ? 4.9 : 3.3,
      repeat_score_component: is85 ? 5.0 : 3.5,
      time_score_component: 5.0,
      delivery20: is85 ? 17 : 12,
      filler_words: is85
        ? [{ word: 'so', count: 2 }]
        : [
            { word: 'um', count: 3 },
            { word: 'like', count: 3 },
            { word: 'basically', count: 2 },
          ],
      repeated_phrases: is85 ? [] : [{ phrase: 'we solve', count: 2 }],
      events: is85 ? [] : EVENTS_62,
    },
    sentiment_profile: {
      confidence: is85 ? 0.85 : 0.52,
      urgency: is85 ? 0.78 : 0.45,
      credibility: is85 ? 0.82 : 0.48,
      clarity: is85 ? 0.88 : 0.55,
      investor_readiness: is85 ? 0.9 : 0.42,
    },
    anti_pattern_hits: [],
    citations: [],
    stage_expectations: [],
    do_next_checklist: [],
  };
}

export default function VideoCaptureePage() {
  const [score, setScore] = useState(62);
  const [mounted, setMounted] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = parseInt(params.get('score') ?? '62', 10);
    if (s >= 0 && s <= 100) setScore(s);
    setMounted(true);
  }, []);

  const feedback = makeFeedback(score);

  const replay = () => {
    setMounted(false);
    setAnimKey((k) => k + 1);
    setTimeout(() => setMounted(true), 50);
  };

  if (!mounted) {
    return <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }} />;
  }

  return (
    <div
      key={animKey}
      style={{
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        padding: '20px 16px',
        maxWidth: '430px',
        margin: '0 auto',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Control bar — hide during recording */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: '#111',
          color: '#fff',
          padding: '8px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
        }}
        id="controls"
      >
        <span>Score: {score}</span>
        <button
          onClick={() => { setScore(62); replay(); }}
          style={{ background: '#333', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          62 (Scene 3B)
        </button>
        <button
          onClick={() => { setScore(85); replay(); }}
          style={{ background: '#333', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          85 (Scene 4C)
        </button>
        <button
          onClick={replay}
          style={{ background: '#ff5941', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Replay Animations
        </button>
        <button
          onClick={() => {
            const el = document.getElementById('controls');
            if (el) el.style.display = 'none';
          }}
          style={{ background: '#333', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
        >
          Hide Controls
        </button>
      </div>

      <div style={{ paddingTop: '44px' }}>
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>
            Pitch Analysis
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            VC Pitch · 1:35 · Spoken Only
          </p>
        </div>

        {/* Score Hero */}
        <ScoreHero feedback={feedback} />

        {/* Spacing */}
        <div style={{ height: '16px' }} />

        {/* Delivery Events (only for 62 score) */}
        {feedback.delivery_metrics.events && feedback.delivery_metrics.events.length > 0 && (
          <>
            <DeliveryEventsTimeline
              events={feedback.delivery_metrics.events}
              onSeek={() => {}}
            />
            <div style={{ height: '16px' }} />
          </>
        )}

        {/* Top Fixes */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #fff)',
            borderRadius: '16px',
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            padding: '20px',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#9ca3af',
              marginBottom: '12px',
            }}
          >
            Priority Fixes
          </p>
          <TopFixes fixes={feedback.top_fixes} />
        </div>
      </div>
    </div>
  );
}
