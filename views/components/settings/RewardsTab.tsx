'use client';

import { useEffect, useState } from 'react';
import { Award, Gift } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementGrid } from '@/views/components/achievements';
import { ReferralCard } from '@/views/components/ReferralCard';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { SectionCard } from './SectionCard';
import type { ProgressRunRecord } from '@/lib/progress';

interface RawRunRecord {
  id: string;
  mode: string;
  overallScore: number;
  createdAt: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: { duration_seconds: number; wpm: number; filler_rate: number };
    top_fixes?: { rank: number; category: string; issue: string; fix: string; impact: string }[];
  };
}

export function RewardsTab() {
  const achievements = useAchievements();
  const [runs, setRuns] = useState<ProgressRunRecord[]>([]);

  useEffect(() => {
    fetchEdge('settings')
      .then((r) => r.json())
      .then((payload: { runs?: RawRunRecord[] }) => {
        const data = Array.isArray(payload.runs) ? payload.runs : [];
        const normalized: ProgressRunRecord[] = data.map((raw) => ({
          id: raw.id,
          createdAt: raw.createdAt,
          overallScore: raw.overallScore,
          mode: raw.mode,
          analysis: {
            one_line_verdict: raw.analysis.one_line_verdict,
            rubric_breakdown: raw.analysis.rubric_breakdown ?? [],
            delivery_metrics: {
              duration_seconds: raw.analysis.delivery_metrics?.duration_seconds ?? 0,
              wpm: raw.analysis.delivery_metrics?.wpm ?? 0,
              filler_rate: raw.analysis.delivery_metrics?.filler_rate ?? 0,
            },
            top_fixes: raw.analysis.top_fixes ?? [],
          },
        }));
        setRuns(normalized);
      })
      .catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    if (runs.length > 0) achievements.processRuns(runs);
  }, [runs, achievements.processRuns]);

  return (
    <div className="flex flex-col gap-5">
      {/* Achievements */}
      <SectionCard icon={Award} title="Achievements" delay={0} id="achievements" iconColor="#eab308">
        <AchievementGrid state={achievements.state} />
      </SectionCard>

      {/* Referrals */}
      <SectionCard icon={Gift} title="Refer a Friend" delay={40} id="referrals" iconColor="#22c55e">
        <ReferralCard />
      </SectionCard>
    </div>
  );
}
