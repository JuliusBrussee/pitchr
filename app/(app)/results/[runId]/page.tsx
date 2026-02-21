'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Zap,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Share2,
  Download,
  Volume2,
  Timer,
  Brain,
  Lightbulb,
  Copy,
  Check,
  XCircle,
  Eye,
  ShieldCheck,
  BarChart3,
  Mic,
} from 'lucide-react';

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
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function getScoreBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Investor-Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (score >= 60) return { label: 'Solid', color: '#ffaa33', bg: 'rgba(255,170,51,0.12)' };
  if (score >= 40) return { label: 'Getting There', color: '#eab308', bg: 'rgba(234,179,8,0.12)' };
  return { label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

function getCategoryLabel(cat: RubricCategory): string {
  const labels: Record<RubricCategory, string> = {
    structure: 'Structure',
    clarity: 'Clarity & Concision',
    evidence: 'Evidence & Traction',
    market: 'Market & Differentiation',
    delivery: 'Delivery',
  };
  return labels[cat];
}

function getCategoryIcon(cat: RubricCategory) {
  const icons: Record<RubricCategory, typeof Target> = {
    structure: BarChart3,
    clarity: Eye,
    evidence: TrendingUp,
    market: ShieldCheck,
    delivery: Volume2,
  };
  return icons[cat];
}

function getImpactColor(impact: Impact): { text: string; bg: string } {
  if (impact === 'high') return { text: '#ef4444', bg: 'rgba(239,68,68,0.10)' };
  if (impact === 'medium') return { text: '#f59e0b', bg: 'rgba(245,158,11,0.10)' };
  return { text: '#6b7280', bg: 'rgba(107,114,128,0.10)' };
}

function getCategoryColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return '#22c55e';
  if (pct >= 0.6) return '#ffaa33';
  if (pct >= 0.4) return '#eab308';
  return '#ef4444';
}

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
  const modeLabel = run.mode === 'elevator' ? 'Elevator Pitch' : 'VC Pitch (2 min)';

  function handleCopyRewrite() {
    navigator.clipboard.writeText(analysis.rewrite_script);
    setCopiedRewrite(true);
    setTimeout(() => setCopiedRewrite(false), 2000);
  }

  return (
    <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 pr-1">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-4">
          <Link
            href="/history"
            className="p-2 rounded-xl border transition-all duration-200 no-underline flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Pitch Results
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                {modeLabel}
              </span>
            </div>
            <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(run.createdAt)}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span className="flex items-center gap-1"><Timer size={10} /> {formatDuration(analysis.delivery_metrics.duration_seconds)}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span className="flex items-center gap-1"><Mic size={10} /> Audio input</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SmallButton icon={<Share2 size={14} />} label="Share" />
          <SmallButton icon={<Download size={14} />} label="Export" />
          <Link
            href="/session"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold no-underline transition-all duration-200"
            style={{ background: '#1c1210', color: '#fff0eb' }}
          >
            <RotateCcw size={13} />
            Run Again
          </Link>
        </div>
      </div>

      {/* ─── Verdict + Score Hero ─── */}
      <div className="grid grid-cols-12 gap-4 animate-fade-in-up" style={{ animationDelay: '40ms' }}>

        {/* Score Ring */}
        <div className="col-span-3">
          <GlassCard className="h-full flex flex-col items-center justify-center py-6">
            <div className="relative">
              <ScoreRing score={analysis.overall_score} max={100} size={130} color={band.color} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {analysis.overall_score}
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
            <span
              className="mt-3 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: band.bg, color: band.color }}
            >
              {band.label}
            </span>
          </GlassCard>
        </div>

        {/* Verdict + Quick Delivery Stats */}
        <div className="col-span-9 flex flex-col gap-3">
          {/* One-line verdict */}
          <GlassCard className="flex-1">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#1c1210' }}
              >
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Verdict
                </h2>
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {analysis.one_line_verdict}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-3">
            <QuickStat label="WPM" value={analysis.delivery_metrics.wpm.toString()} sub="130–160 ideal" ok={analysis.delivery_metrics.wpm >= 130 && analysis.delivery_metrics.wpm <= 160} />
            <QuickStat label="Filler Words" value={totalFillers.toString()} sub={`${(totalFillers / (analysis.delivery_metrics.duration_seconds / 60)).toFixed(1)}/min`} ok={totalFillers <= 4} />
            <QuickStat label="Duration" value={formatDuration(analysis.delivery_metrics.duration_seconds)} sub="2:00 limit" ok={analysis.delivery_metrics.within_time_limit} />
            <QuickStat label="Repeated Phrases" value={analysis.delivery_metrics.repeated_phrases.length.toString()} sub="phrases flagged" ok={analysis.delivery_metrics.repeated_phrases.length <= 1} />
          </div>
        </div>
      </div>

      {/* ─── Rubric Breakdown (5 categories /20 each) ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <GlassCard>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
            Rubric Breakdown
          </h2>
          <div className="flex flex-col gap-4">
            {analysis.rubric_breakdown.map((rb, i) => {
              const CatIcon = getCategoryIcon(rb.category);
              const color = getCategoryColor(rb.score, rb.max_score);
              const pct = (rb.score / rb.max_score) * 100;
              return (
                <div
                  key={rb.category}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${140 + i * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <CatIcon size={13} style={{ color }} />
                    </div>
                    <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
                      {getCategoryLabel(rb.category)}
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>
                      {rb.score}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      / {rb.max_score}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 ml-9">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: color, transitionDelay: `${i * 80}ms` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mt-1.5 ml-9" style={{ color: 'var(--text-secondary)' }}>
                    {rb.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* ─── Top 5 Fixes ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}
            >
              <Zap size={13} className="text-white" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Top 5 Fixes — Ranked by Impact
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {analysis.top_fixes.map((fix, i) => (
              <FixCard key={fix.rank} fix={fix} delay={i} />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ─── Two-column: Rewrite + Delivery Metrics ─── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Rewrite Panel */}
        <div className="animate-fade-in-up" style={{ animationDelay: '220ms' }}>
          <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: '#ff5941' }} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Tightened Rewrite
                </h2>
              </div>
              <button
                onClick={handleCopyRewrite}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all duration-200"
                style={{
                  backgroundColor: copiedRewrite ? 'rgba(34,197,94,0.08)' : 'transparent',
                  borderColor: copiedRewrite ? 'rgba(34,197,94,0.3)' : 'var(--border-color)',
                  color: copiedRewrite ? '#22c55e' : 'var(--text-secondary)',
                }}
              >
                {copiedRewrite ? <Check size={11} /> : <Copy size={11} />}
                {copiedRewrite ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div
              className="flex-1 rounded-xl border p-4 overflow-y-auto text-sm leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                maxHeight: 420,
              }}
            >
              {analysis.rewrite_script.split('\n\n').map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Delivery Metrics */}
        <div className="animate-fade-in-up flex flex-col gap-4" style={{ animationDelay: '260ms' }}>
          {/* Filler Words */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Filler & Weak Words
              </h2>
              <span
                className="text-lg font-black tabular-nums"
                style={{ color: totalFillers > 10 ? '#ef4444' : totalFillers > 5 ? '#f59e0b' : '#22c55e' }}
              >
                {totalFillers}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {analysis.delivery_metrics.filler_words
                .sort((a, b) => b.count - a.count)
                .map((fw, i) => (
                <div
                  key={fw.word}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 border animate-fade-in-up"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    animationDelay: `${300 + i * 30}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0"
                    style={{
                      backgroundColor: fw.count >= 3 ? 'rgba(239,68,68,0.10)' : fw.count >= 2 ? 'rgba(245,158,11,0.10)' : 'rgba(107,114,128,0.10)',
                      color: fw.count >= 3 ? '#ef4444' : fw.count >= 2 ? '#f59e0b' : 'var(--text-secondary)',
                    }}
                  >
                    &ldquo;{fw.word}&rdquo;
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (fw.count / 3) * 100)}%`,
                        backgroundColor: fw.count >= 3 ? '#ef4444' : fw.count >= 2 ? '#f59e0b' : 'var(--text-muted)',
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {fw.count}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Repeated Phrases */}
          {analysis.delivery_metrics.repeated_phrases.length > 0 && (
            <GlassCard>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Repeated Phrases
              </h2>
              <div className="flex flex-col gap-1.5">
                {analysis.delivery_metrics.repeated_phrases.map((rp) => (
                  <div
                    key={rp.phrase}
                    className="flex items-center justify-between rounded-lg px-3 py-2 border"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                  >
                    <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                      &ldquo;{rp.phrase}&rdquo;
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {rp.count}x
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* ─── Transcript ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '280ms' }}>
        <GlassCard>
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="flex items-center justify-between w-full text-left"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Original Transcript
              </h2>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-[10px] font-medium">
                {showFullTranscript ? 'Collapse' : 'Expand'}
              </span>
              {showFullTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </button>

          {showFullTranscript && (
            <div
              className="mt-4 rounded-xl border p-4 text-sm leading-relaxed animate-fade-in-up"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
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
        className="flex items-center justify-between rounded-2xl border p-5 animate-fade-in-up"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          backdropFilter: `blur(var(--blur-strength))`,
          animationDelay: '320ms',
          animationFillMode: 'both',
        }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Your #1 fix: Add market sizing & competitor analysis
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            This is your biggest scoring gap at 8/20. Fixing it alone could push you into the 70s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="px-4 py-2.5 rounded-xl border text-xs font-semibold no-underline transition-all duration-200"
            style={{ backgroundColor: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            View History
          </Link>
          <Link
            href="/session"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold no-underline transition-all duration-200"
            style={{ background: '#1c1210', color: '#fff0eb' }}
          >
            <RotateCcw size={13} />
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

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {children}
    </div>
  );
}

function SmallButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
    >
      {icon}
      {label}
    </button>
  );
}

function ScoreRing({ score, max, size, color }: { score: number; max: number; size: number; color: string }) {
  const strokeWidth = 10;
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
        style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
      />
    </svg>
  );
}

function QuickStat({ label, value, sub, ok }: { label: string; value: string; sub: string; ok: boolean }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {ok ? (
          <CheckCircle size={12} style={{ color: '#22c55e' }} />
        ) : (
          <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
        )}
      </div>
      <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}

function FixCard({ fix, delay }: { fix: Fix; delay: number }) {
  const impact = getImpactColor(fix.impact);
  const CatIcon = getCategoryIcon(fix.category);

  return (
    <div
      className="rounded-xl border p-4 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        animationDelay: `${200 + delay * 50}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black"
          style={{ backgroundColor: impact.bg, color: impact.text }}
        >
          #{fix.rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            >
              <CatIcon size={9} />
              {getCategoryLabel(fix.category)}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: impact.bg, color: impact.text }}
            >
              {fix.impact} impact
            </span>
          </div>

          {/* Issue */}
          <div className="mb-2">
            <div className="flex items-start gap-1.5">
              <XCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                {fix.issue}
              </p>
            </div>
          </div>

          {/* Fix */}
          <div
            className="rounded-lg border px-3 py-2.5"
            style={{ backgroundColor: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.15)' }}
          >
            <div className="flex items-start gap-1.5">
              <Lightbulb size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {fix.fix}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
