'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Share2,
  Download,
  Timer,
  Copy,
  Check,
  Mic,
} from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';

/* ═══════════════════════════════════════════════════════════════
   PRD-aligned Mock Data — Results /100 scoring
   ═══════════════════════════════════════════════════════════════ */

type PitchMode = 'elevator' | 'vc_pitch';
type RubricCategory = 'structure' | 'clarity' | 'evidence' | 'market' | 'delivery';
type Impact = 'high' | 'medium' | 'low';

interface RubricScore {
  category: RubricCategory;
  score: number;
  max_score: number;
  rationale: string;
}

interface Fix {
  rank: number;
  category: RubricCategory;
  issue: string;
  fix: string;
  impact: Impact;
}

interface FillerWord {
  word: string;
  count: number;
}

interface RepeatedPhrase {
  phrase: string;
  count: number;
}

interface DeliveryMetrics {
  wpm: number;
  duration_seconds: number;
  filler_words: FillerWord[];
  repeated_phrases: RepeatedPhrase[];
  within_time_limit: boolean;
}

interface AnalysisResult {
  overall_score: number;
  one_line_verdict: string;
  rubric_breakdown: RubricScore[];
  top_fixes: Fix[];
  rewrite_script: string;
  delivery_metrics: DeliveryMetrics;
}

const MOCK_RUN = {
  id: 'run_abc123',
  createdAt: '2026-02-21T14:34:00Z',
  mode: 'vc_pitch' as PitchMode,
  inputType: 'audio' as const,
  transcript: `Good afternoon everyone. What if I told you that 73% of enterprise teams waste over 20 hours a week on miscommunication? That's basically a whole person's job, just lost to noise.

We're building Pitchr, um, an AI-powered communication coach that helps teams actually deliver their message clearly. Like, every single time.

The problem is really massive. Companies spend $37 billion annually on communication training that basically doesn't work. Traditional coaching is expensive, inconsistent, and just doesn't scale.

Our solution uses real-time AI analysis — think of it as a Grammarly for how you speak, not what you write. We analyze tone, pacing, body language, filler words, and give instant coaching feedback.

So basically our business model is, you know, pretty straightforward. We charge $29 per user per month for teams, with enterprise tiers starting at sort of $15,000 annually.

We're already seeing incredible traction. 2,400 active users, $380K ARR, growing 22% month over month. Three enterprise pilots launching in March.

The team — I guess I should mention — my co-founder Sarah led product at Slack for four years, and I built the NLP pipeline at Google Brain. We've been obsessed with this problem for a really long time.

We're raising a $3 million seed round to, um, basically triple our engineering team and launch enterprise. I think, um, with this capital we can hit $2M ARR by year end.`,
};

const MOCK_ANALYSIS: AnalysisResult = {
  overall_score: 62,
  one_line_verdict: 'Strong problem framing and traction data, but hedging language and weak closing undercut your credibility on the slides that matter most.',
  rubric_breakdown: [
    {
      category: 'structure',
      score: 16,
      max_score: 20,
      rationale: 'Good Problem → Solution → Traction flow. Market sizing is thin. The Ask slides lacks conviction. Transitions feel rushed between business model and traction.',
    },
    {
      category: 'clarity',
      score: 14,
      max_score: 20,
      rationale: 'The Grammarly analogy is excellent — instant understanding. But hedging words ("basically," "sort of," "pretty") dilute clarity. Business model sentence has 4 weak words.',
    },
    {
      category: 'evidence',
      score: 15,
      max_score: 20,
      rationale: 'Strong traction numbers (2,400 users, $380K ARR, 22% MoM) delivered confidently. But team section undersells credentials with "I guess I should mention." No named enterprise pilots.',
    },
    {
      category: 'market',
      score: 8,
      max_score: 20,
      rationale: '$37B training market is mentioned but unsourced. No TAM/SAM breakdown. Zero competitors named. No moat articulation. This is the weakest section.',
    },
    {
      category: 'delivery',
      score: 9,
      max_score: 20,
      rationale: '142 WPM is good pace. But 14 weak/filler words across 2 minutes is high — especially clustering on the Ask (3 fillers). Closing trails off instead of landing.',
    },
  ],
  top_fixes: [
    {
      rank: 1,
      category: 'market',
      issue: 'No market sizing, competitor analysis, or moat — the entire Market section is missing',
      fix: 'Add one slide: "$37B market (Gartner 2025), growing 18% annually. Competitors like BetterUp and Gong focus on post-conversation analytics — we\'re the only real-time coach." Then state your moat: "proprietary NLP pipeline trained on 50K pitch recordings."',
      impact: 'high',
    },
    {
      rank: 2,
      category: 'delivery',
      issue: '"I think" and two "um"s on the Ask slide — the single most important moment of your pitch',
      fix: 'Memorize your Ask verbatim: "We\'re raising $3 million to triple engineering and launch enterprise. This capital gets us to $2M ARR by December." Practice until zero fillers. Record yourself 10 times.',
      impact: 'high',
    },
    {
      rank: 3,
      category: 'clarity',
      issue: 'Business model sentence has 4 hedging words: "basically," "you know," "pretty," "sort of"',
      fix: 'Replace with: "Our pricing: $29 per user per month. Enterprise starts at $15,000 annually. 85% gross margins." No qualifiers. State pricing as fact.',
      impact: 'high',
    },
    {
      rank: 4,
      category: 'evidence',
      issue: '"I guess I should mention" before team credentials is self-sabotage',
      fix: 'Lead with confidence: "Our team is built for this. Sarah spent 4 years leading product at Slack. I built the NLP pipeline at Google Brain. We\'ve been solving this problem for 3 years." Never apologize for strengths.',
      impact: 'medium',
    },
    {
      rank: 5,
      category: 'structure',
      issue: 'Closing trails off — no memorable final line or clear next step',
      fix: 'End with one line that encapsulates your vision: "In two years, every team that practices a pitch will practice it with us. We\'re raising $3M to make that happen — and we\'d love to have you on board."',
      impact: 'medium',
    },
  ],
  rewrite_script: `What if I told you 73% of enterprise teams waste 20 hours a week on miscommunication? That's an entire salary — gone to noise.

Pitchr is an AI communication coach that helps teams deliver their message clearly, every time. Think Grammarly for how you speak, not what you write.

Companies spend $37 billion a year on communication training that doesn't stick. Coaching is expensive, inconsistent, and impossible to scale. The $37B market is growing 18% annually, and current players like BetterUp and Gong focus on post-conversation analytics. We're the only real-time coach.

Our AI analyzes tone, pacing, body language, and filler words — and delivers instant feedback while you're still speaking. Our moat: a proprietary NLP pipeline trained on 50,000 pitch recordings.

Pricing is simple. $29 per user per month. Enterprise starts at $15,000 annually. 85% gross margins.

We already have 2,400 active users, $380K in ARR, and we're growing 22% month over month. Three enterprise pilots launch in March.

Our team is built for this. Sarah spent four years leading product at Slack. I built the NLP pipeline at Google Brain. We've been solving this problem for three years.

We're raising $3 million to triple our engineering team and launch enterprise. This gets us to $2M ARR by December.

In two years, every team that practices a pitch will practice it with us. We'd love to have you on board.`,
  delivery_metrics: {
    wpm: 142,
    duration_seconds: 128,
    filler_words: [
      { word: 'um', count: 3 },
      { word: 'basically', count: 3 },
      { word: 'like', count: 1 },
      { word: 'you know', count: 1 },
      { word: 'really', count: 2 },
      { word: 'sort of', count: 1 },
      { word: 'I guess', count: 1 },
      { word: 'I think', count: 1 },
      { word: 'pretty', count: 1 },
    ],
    repeated_phrases: [
      { phrase: 'basically', count: 3 },
      { phrase: 'our solution', count: 2 },
    ],
    within_time_limit: true,
  },
};

/* ═══════════════════════════════════════════════════════════════
   Helpers — Refined palette
   ═══════════════════════════════════════════════════════════════ */

const ACCENT = '#ff5941';

function getScoreBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Investor-Ready', color: '#5a9e78' };
  if (score >= 60) return { label: 'Solid', color: ACCENT };
  if (score >= 40) return { label: 'Getting There', color: '#c4944c' };
  return { label: 'Needs Work', color: '#b85c5c' };
}

const CATEGORY_LABELS: Record<RubricCategory, string> = {
  structure: 'Structure',
  clarity: 'Clarity & Concision',
  evidence: 'Evidence & Traction',
  market: 'Market & Differentiation',
  delivery: 'Delivery',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function ResultsPage() {
  const run = MOCK_RUN;
  const analysis = MOCK_ANALYSIS;
  const band = getScoreBand(analysis.overall_score);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);

  const totalFillers = analysis.delivery_metrics.filler_words.reduce((s, f) => s + f.count, 0);
  const modeLabel = run.mode === 'elevator' ? 'Elevator Pitch' : 'VC Pitch';

  function handleCopyRewrite() {
    navigator.clipboard.writeText(analysis.rewrite_script);
    setCopiedRewrite(true);
    setTimeout(() => setCopiedRewrite(false), 2000);
  }

  return (
    <main className="flex-1 overflow-y-auto min-h-0 flex flex-col pr-1 pb-8">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between py-2 animate-fade-in-up">
        <Link
          href="/history"
          className="flex items-center gap-2 text-xs font-medium no-underline transition-colors duration-200"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={15} />
          Back to History
        </Link>
        <div className="flex items-center gap-2">
          <ActionButton icon={<Share2 size={13} />} label="Share" />
          <ActionButton icon={<Download size={13} />} label="Export" />
          <Link
            href="/session"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold no-underline transition-all duration-200"
            style={{ background: '#1c1210', color: '#fff0eb' }}
          >
            <RotateCcw size={12} />
            Run Again
          </Link>
        </div>
      </div>

      {/* ─── Score Hero ─── */}
      <div className="animate-fade-in-up mt-2" style={{ animationDelay: '40ms' }}>
        <GlassCard padding="lg" animate={false}>
          <div className="flex items-center gap-10">
            {/* Score arc */}
            <div className="relative flex-shrink-0">
              <ScoreArc score={analysis.overall_score} max={100} size={152} color={band.color} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-5xl font-black tabular-nums tracking-tight"
                  style={{ color: 'var(--text-primary)', lineHeight: 1 }}
                >
                  {analysis.overall_score}
                </span>
                <span className="text-[10px] font-medium mt-1.5 tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  / 100
                </span>
              </div>
            </div>

            {/* Band + metadata + verdict */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-bold tracking-wide" style={{ color: band.color }}>
                  {band.label}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  {modeLabel}
                </span>
              </div>
              <p className="text-[11px] mb-5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(run.createdAt)}</span>
                <span style={{ opacity: 0.4 }}>/</span>
                <span className="flex items-center gap-1"><Timer size={10} /> {formatDuration(analysis.delivery_metrics.duration_seconds)}</span>
                <span style={{ opacity: 0.4 }}>/</span>
                <span className="flex items-center gap-1"><Mic size={10} /> Audio</span>
              </p>
              {/* Verdict as pull-quote */}
              <div style={{ borderLeft: `2px solid ${band.color}`, paddingLeft: 16 }}>
                <p
                  className="text-[13px] leading-relaxed font-medium"
                  style={{ color: 'var(--text-primary)', opacity: 0.85 }}
                >
                  {analysis.one_line_verdict}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ─── Delivery Metrics Strip ─── */}
      <div className="animate-fade-in-up mt-4" style={{ animationDelay: '80ms' }}>
        <GlassCard padding="sm" animate={false}>
          <div className="grid grid-cols-4">
            <MetricCell
              label="WPM"
              value={analysis.delivery_metrics.wpm.toString()}
              note="130–160 ideal"
              ok={analysis.delivery_metrics.wpm >= 130 && analysis.delivery_metrics.wpm <= 160}
            />
            <MetricCell
              label="Filler Words"
              value={totalFillers.toString()}
              note={`${(totalFillers / (analysis.delivery_metrics.duration_seconds / 60)).toFixed(1)}/min`}
              ok={totalFillers <= 4}
              border
            />
            <MetricCell
              label="Duration"
              value={formatDuration(analysis.delivery_metrics.duration_seconds)}
              note="2:00 limit"
              ok={analysis.delivery_metrics.within_time_limit}
              border
            />
            <MetricCell
              label="Repeated"
              value={analysis.delivery_metrics.repeated_phrases.length.toString()}
              note="phrases flagged"
              ok={analysis.delivery_metrics.repeated_phrases.length <= 1}
              border
            />
          </div>
        </GlassCard>
      </div>

      {/* ─── Rubric Breakdown ─── */}
      <div className="animate-fade-in-up mt-6" style={{ animationDelay: '120ms' }}>
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Rubric Breakdown
        </h2>
        <GlassCard padding="md" animate={false}>
          <div className="flex flex-col gap-5">
            {analysis.rubric_breakdown.map((rb, i) => {
              const pct = (rb.score / rb.max_score) * 100;
              const barOpacity = 0.35 + (rb.score / rb.max_score) * 0.65;
              return (
                <div
                  key={rb.category}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${160 + i * 60}ms`, animationFillMode: 'both' }}
                >
                  {/* Label row */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {CATEGORY_LABELS[rb.category]}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {rb.score}
                      </span>
                      <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        /{rb.max_score}
                      </span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: ACCENT,
                        opacity: barOpacity,
                        transitionDelay: `${i * 80}ms`,
                      }}
                    />
                  </div>
                  {/* Rationale */}
                  <p className="text-[11px] leading-relaxed mt-2" style={{ color: 'var(--text-secondary)', opacity: 0.85 }}>
                    {rb.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* ─── Top 5 Fixes ─── */}
      <div className="animate-fade-in-up mt-6" style={{ animationDelay: '180ms' }}>
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Top Fixes — Ranked by Impact
        </h2>
        <div className="flex flex-col gap-2.5">
          {analysis.top_fixes.map((fix, i) => (
            <FixItem key={fix.rank} fix={fix} delay={i} />
          ))}
        </div>
      </div>

      {/* ─── Two-column: Rewrite + Delivery Detail ─── */}
      <div className="grid grid-cols-2 gap-4 mt-6">

        {/* Rewrite Panel */}
        <div className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <h2
            className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Tightened Rewrite
          </h2>
          <GlassCard padding="md" animate={false} className="h-[calc(100%-28px)] flex flex-col">
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={handleCopyRewrite}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all duration-200"
                style={{
                  backgroundColor: copiedRewrite ? 'rgba(90,158,120,0.06)' : 'transparent',
                  borderColor: copiedRewrite ? 'rgba(90,158,120,0.25)' : 'var(--border-color)',
                  color: copiedRewrite ? '#5a9e78' : 'var(--text-muted)',
                }}
              >
                {copiedRewrite ? <Check size={10} /> : <Copy size={10} />}
                {copiedRewrite ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto text-[12.5px] leading-[1.8]"
              style={{ color: 'var(--text-secondary)', maxHeight: 400 }}
            >
              {analysis.rewrite_script.split('\n\n').map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-4' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Filler Words + Repeated Phrases */}
        <div className="animate-fade-in-up flex flex-col gap-4" style={{ animationDelay: '280ms' }}>
          {/* Filler Words */}
          <div>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Filler & Weak Words
              </h2>
              <span
                className="text-lg font-black tabular-nums"
                style={{ color: totalFillers > 10 ? '#b85c5c' : totalFillers > 5 ? '#c4944c' : '#5a9e78' }}
              >
                {totalFillers}
              </span>
            </div>
            <GlassCard padding="sm" animate={false}>
              <div className="flex flex-col">
                {analysis.delivery_metrics.filler_words
                  .sort((a, b) => b.count - a.count)
                  .map((fw, i) => (
                    <div
                      key={fw.word}
                      className="flex items-center gap-3 px-3 py-2 animate-fade-in-up"
                      style={{
                        animationDelay: `${320 + i * 25}ms`,
                        animationFillMode: 'both',
                        borderBottom: i < analysis.delivery_metrics.filler_words.length - 1
                          ? '1px solid var(--border-color)'
                          : 'none',
                      }}
                    >
                      <span
                        className="text-[11px] font-mono font-medium w-20 flex-shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        &ldquo;{fw.word}&rdquo;
                      </span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (fw.count / 3) * 100)}%`,
                            backgroundColor: ACCENT,
                            opacity: 0.4 + (fw.count / 3) * 0.4,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums w-5 text-right" style={{ color: 'var(--text-primary)' }}>
                        {fw.count}
                      </span>
                    </div>
                  ))}
              </div>
            </GlassCard>
          </div>

          {/* Repeated Phrases */}
          {analysis.delivery_metrics.repeated_phrases.length > 0 && (
            <div>
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 px-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Repeated Phrases
              </h2>
              <GlassCard padding="sm" animate={false}>
                <div className="flex flex-col">
                  {analysis.delivery_metrics.repeated_phrases.map((rp, i) => (
                    <div
                      key={rp.phrase}
                      className="flex items-center justify-between px-3 py-2.5"
                      style={{
                        borderBottom: i < analysis.delivery_metrics.repeated_phrases.length - 1
                          ? '1px solid var(--border-color)'
                          : 'none',
                      }}
                    >
                      <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                        &ldquo;{rp.phrase}&rdquo;
                      </span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {rp.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* ─── Transcript ─── */}
      <div className="animate-fade-in-up mt-6" style={{ animationDelay: '320ms' }}>
        <GlassCard padding="md" animate={false}>
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="flex items-center justify-between w-full text-left"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Original Transcript
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-[10px] font-medium">
                {showFullTranscript ? 'Collapse' : 'Expand'}
              </span>
              {showFullTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
          </button>

          {showFullTranscript && (
            <div
              className="mt-4 pt-4 text-[12.5px] leading-[1.8] animate-fade-in"
              style={{
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {run.transcript.split('\n\n').map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ─── Bottom CTA ─── */}
      <div
        className="flex items-center justify-between rounded-2xl border p-5 mt-6 animate-fade-in-up"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          backdropFilter: 'blur(var(--blur-strength))',
          animationDelay: '360ms',
          animationFillMode: 'both',
        }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Your #1 fix: Add market sizing & competitor analysis
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Biggest scoring gap at 8/20 — fixing it alone could push you into the 70s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="px-4 py-2.5 rounded-xl border text-xs font-medium no-underline transition-all duration-200"
            style={{ backgroundColor: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            View History
          </Link>
          <Link
            href="/session"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold no-underline transition-all duration-200"
            style={{ background: '#1c1210', color: '#fff0eb' }}
          >
            <RotateCcw size={12} />
            Run Again
          </Link>
        </div>
      </div>

      <div className="h-2 flex-shrink-0" />
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-medium transition-all duration-200"
      style={{
        backgroundColor: 'transparent',
        borderColor: 'var(--border-color)',
        color: 'var(--text-muted)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ScoreArc({ score, max, size, color }: { score: number; max: number; size: number; color: string }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / max) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}

function MetricCell({ label, value, note, ok, border }: {
  label: string;
  value: string;
  note: string;
  ok: boolean;
  border?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center py-3 px-2"
      style={{
        borderLeft: border ? '1px solid var(--border-color)' : 'none',
      }}
    >
      <span className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
      <div className="flex items-center gap-1 mt-1">
        {ok ? (
          <CheckCircle size={10} style={{ color: '#5a9e78' }} />
        ) : (
          <AlertTriangle size={10} style={{ color: '#c4944c' }} />
        )}
        <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {note}
        </span>
      </div>
    </div>
  );
}

function FixItem({ fix, delay }: { fix: Fix; delay: number }) {
  return (
    <GlassCard
      padding="md"
      animate={false}
      className="animate-slide-in-left"
    >
      <div
        style={{ animationDelay: `${220 + delay * 60}ms`, animationFillMode: 'both' }}
      >
        <div className="flex gap-4">
          {/* Rank number — large, decorative */}
          <div className="flex-shrink-0 w-10 flex items-start justify-center pt-0.5">
            <span
              className="text-2xl font-black tabular-nums"
              style={{ color: 'var(--text-primary)', opacity: 0.12 }}
            >
              {fix.rank.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Category + Impact */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                {CATEGORY_LABELS[fix.category]}
              </span>
              <span style={{ color: 'var(--border-color)' }}>&middot;</span>
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{
                  color: fix.impact === 'high' ? ACCENT : 'var(--text-muted)',
                  opacity: fix.impact === 'low' ? 0.6 : 1,
                }}
              >
                {fix.impact} impact
              </span>
            </div>

            {/* Issue */}
            <p className="text-[13px] font-medium leading-snug mb-3" style={{ color: 'var(--text-primary)' }}>
              {fix.issue}
            </p>

            {/* Fix recommendation */}
            <div
              className="rounded-lg px-3.5 py-3"
              style={{
                backgroundColor: `${ACCENT}06`,
                borderLeft: `2px solid ${ACCENT}30`,
              }}
            >
              <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {fix.fix}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
