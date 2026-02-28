'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Linkedin, Share2, X } from 'lucide-react';
import type { FeedbackOutput } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';
import { useShareCard, type ShareCardData, type SharePlatform } from '@/hooks/useShareCard';
import { getScoreColor, getScoreBandLabel } from '@/views/components/ui/colors';
import { fetchEdge } from '@/lib/supabase/fetch-edge';

interface ShareScoreCardProps {
  feedback: FeedbackOutput;
  run: Run;
}

function XLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShareScoreCard({ feedback, run }: ShareScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionDelta, setSessionDelta] = useState<{ points: number; sessions: number } | null>(null);
  const [deltaLoaded, setDeltaLoaded] = useState(false);
  const [justShared, setJustShared] = useState<SharePlatform | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { share, isGenerating, isSharing, error } = useShareCard();

  const score = feedback.overall_score;
  const scoreColor = getScoreColor(score);
  const bandLabel = getScoreBandLabel(score);

  // Load session delta from run history
  useEffect(() => {
    if (deltaLoaded) return;
    setDeltaLoaded(true);

    fetchEdge('pitch-run', { params: { projectId: run.projectId } })
      .then((res) => res.json())
      .then((payload: { runs?: Array<{ id: string; overallScore: number; createdAt: string }> }) => {
        const runs = payload.runs ?? [];
        if (runs.length < 2) return;

        // Sort chronologically
        const sorted = [...runs].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        const firstScore = sorted[0].overallScore;
        const currentScore = score;
        const delta = currentScore - firstScore;

        if (delta !== 0) {
          setSessionDelta({ points: delta, sessions: sorted.length });
        }
      })
      .catch(() => {});
  }, [deltaLoaded, run.projectId, score]);

  const shareData = useMemo<ShareCardData>(() => ({
    score,
    bandLabel,
    verdict: feedback.one_line_verdict,
    rubricScores: feedback.rubric_breakdown.map((r) => ({
      category: r.category,
      score: r.score,
      maxScore: r.max_score,
    })),
    sessionDelta,
    mode: run.mode,
  }), [score, bandLabel, feedback.one_line_verdict, feedback.rubric_breakdown, sessionDelta, run.mode]);

  const handleShare = useCallback(async (platform: SharePlatform) => {
    await share(platform, shareData);
    setJustShared(platform);
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setJustShared(null), 2500);
  }, [share, shareData]);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  const busy = isGenerating || isSharing;

  const platforms: { id: SharePlatform; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} />, color: '#0A66C2' },
    { id: 'x', label: 'X', icon: <XLogo size={14} />, color: '#ededec' },
    { id: 'instagram', label: 'Stories', icon: <InstagramLogo size={16} />, color: '#E4405F' },
    { id: 'download', label: 'Save', icon: <Download size={16} />, color: '#ffaa33' },
  ];

  return (
    <div className="share-scorecard-container">
      {/* Collapsed: Share CTA strip */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group w-full relative overflow-hidden flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border transition-all duration-300 share-scorecard-enter hover:scale-[1.01]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,89,65,0.06) 0%, transparent 70%)`,
            }}
          />
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,89,65,0.1)' }}
          >
            <Share2 size={14} style={{ color: '#ff5941' }} />
          </div>
          <span className="text-sm font-medium relative">
            Share your <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{score}/100</span> score
          </span>
          {sessionDelta && sessionDelta.points > 0 ? (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full relative"
              style={{
                color: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
              }}
            >
              +{sessionDelta.points} pts
            </span>
          ) : null}
        </button>
      ) : (
        /* Expanded: Full share panel */
        <section
          className="rounded-2xl border p-5 share-scorecard-expand"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Share2 size={16} style={{ color: '#ff5941' }} />
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Share Score Card
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Preview card (miniature dark glass) */}
          <div
            className="relative rounded-xl overflow-hidden p-4 mb-4 share-card-preview"
            style={{
              background: 'linear-gradient(135deg, #0a0a0c 0%, #0d0d10 50%, #0a0a0c 100%)',
              boxShadow: `0 0 40px ${scoreColor}08, inset 0 1px 0 rgba(255,255,255,0.04)`,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: `${scoreColor}08` }}
            />
            <div
              className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: 'rgba(255,89,65,0.05)' }}
            />

            <div className="relative flex items-center gap-4">
              {/* Mini score ring with glow */}
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ backgroundColor: `${scoreColor}15` }}
                />
                <svg width="68" height="68" viewBox="0 0 72 72" className="relative">
                  <circle
                    cx="36" cy="36" r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="36" cy="36" r="28"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - score / 100)}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '36px 36px',
                      filter: `drop-shadow(0 0 6px ${scoreColor}60)`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: '#ffffff' }}
                  >
                    {score}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: '#ff5941' }}>
                    pitchr
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {'\u00B7'}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: scoreColor,
                      backgroundColor: `${scoreColor}15`,
                      border: `1px solid ${scoreColor}25`,
                    }}
                  >
                    {bandLabel}
                  </span>
                </div>
                <p
                  className="text-xs leading-snug line-clamp-2"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {feedback.one_line_verdict}
                </p>
                {sessionDelta && sessionDelta.points !== 0 ? (
                  <p
                    className="text-[11px] font-semibold mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      color: sessionDelta.points > 0 ? '#22c55e' : '#ef4444',
                      backgroundColor: sessionDelta.points > 0
                        ? 'rgba(34,197,94,0.1)'
                        : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {sessionDelta.points > 0 ? '\u2191' : '\u2193'}
                    {sessionDelta.points > 0 ? '+' : ''}
                    {sessionDelta.points} pts in {sessionDelta.sessions} session
                    {sessionDelta.sessions !== 1 ? 's' : ''}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Mini rubric bars with labels */}
            <div className="relative flex gap-1.5 mt-3">
              {feedback.rubric_breakdown
                .filter((r) => !r.category.startsWith('deck_'))
                .map((rubric) => {
                  const pct = rubric.max_score > 0 ? (rubric.score / rubric.max_score) * 100 : 0;
                  const catColor = getScoreColor(pct);
                  return (
                    <div key={rubric.category} className="flex-1">
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${catColor}80, ${catColor})`,
                            boxShadow: `0 0 4px ${catColor}40`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="relative text-[9px] text-center mt-2.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Score your pitch at <span style={{ color: '#ff5941', fontWeight: 600 }}>pitchr.live</span>
            </p>
          </div>

          {/* Share platform buttons */}
          <div className="grid grid-cols-4 gap-2.5">
            {platforms.map((platform) => {
              const isJustShared = justShared === platform.id;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => void handleShare(platform.id)}
                  disabled={busy}
                  className="group/btn flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] disabled:opacity-50"
                  style={{
                    borderColor: isJustShared ? `${platform.color}40` : 'var(--border-color)',
                    backgroundColor: isJustShared
                      ? `${platform.color}10`
                      : 'transparent',
                    color: isJustShared ? platform.color : 'var(--text-secondary)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 group-hover/btn:scale-110"
                    style={{
                      backgroundColor: isJustShared
                        ? `${platform.color}20`
                        : `${platform.color}08`,
                      color: platform.color,
                    }}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide">
                    {isJustShared ? 'Shared!' : platform.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status messages */}
          {busy ? (
            <p
              className="text-xs text-center mt-3 animate-pulse"
              style={{ color: 'var(--text-muted)' }}
            >
              Generating your score card...
            </p>
          ) : null}

          {error ? (
            <p
              className="text-xs text-center mt-3"
              style={{ color: '#ef4444' }}
            >
              {error}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
