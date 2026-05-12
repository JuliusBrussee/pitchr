'use client';

import { Building2, Users, TrendingUp, Target, DollarSign, Lightbulb, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { TagPill } from '@/views/components/ui/TagPill';
import type { Scenario } from '@/types/arena';

interface ScenarioCardProps {
  scenario: Scenario;
  showFullBrief?: boolean;
}

const INDUSTRY_COLORS: Record<string, string> = {
  fintech: '#3b82f6',
  healthtech: '#22c55e',
  saas: '#a855f7',
  climate: '#16a34a',
  consumer: '#f59e0b',
  edtech: '#06b6d4',
  ai: '#ff5941',
  hardware: '#6b7280',
};

const STAGE_COLORS: Record<string, string> = {
  pre_seed: '#ffaa33',
  seed: '#ff5941',
  series_a: '#a855f7',
};

function formatStageLabel(stage: string): string {
  return stage.replace(/_/g, '-').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ScenarioCard({ scenario, showFullBrief = true }: ScenarioCardProps) {
  const { brief } = scenario;
  const industryColor = INDUSTRY_COLORS[scenario.industry] ?? '#6b7280';
  const stageColor = STAGE_COLORS[scenario.stage] ?? '#6b7280';

  return (
    <GlassCard className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {brief.companyName}
          </h3>
          <p
            className="text-sm leading-snug"
            style={{ color: 'var(--text-secondary)' }}
          >
            {brief.oneLiner}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4">
        <TagPill label={scenario.industry} color={industryColor} />
        <TagPill label={formatStageLabel(scenario.stage)} color={stageColor} />
      </div>

      {showFullBrief && (
        <div className="flex flex-col gap-4">
          {/* Team */}
          <div className="flex items-start gap-2.5">
            <Users
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            />
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Team
              </span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {brief.team}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-start gap-2.5">
            <TrendingUp
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            />
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Key Metrics
              </span>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {brief.metrics.revenue && (
                  <MetricRow label="Revenue" value={brief.metrics.revenue} />
                )}
                {brief.metrics.users && (
                  <MetricRow label="Users" value={brief.metrics.users} />
                )}
                {brief.metrics.growthRate && (
                  <MetricRow label="Growth" value={brief.metrics.growthRate} />
                )}
                {brief.metrics.foundedYear && (
                  <MetricRow label="Founded" value={String(brief.metrics.foundedYear)} />
                )}
              </div>
            </div>
          </div>

          {/* Market */}
          <div className="flex items-start gap-2.5">
            <Target
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            />
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Market
              </span>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                <MetricRow label="TAM" value={brief.market.tam} />
                {brief.market.sam && <MetricRow label="SAM" value={brief.market.sam} />}
                {brief.market.som && <MetricRow label="SOM" value={brief.market.som} />}
              </div>
            </div>
          </div>

          {/* Ask */}
          <div className="flex items-start gap-2.5">
            <DollarSign
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            />
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                The Ask
              </span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {brief.ask.amount}
                </span>
                {' '}&mdash; {brief.ask.useOfFunds}
              </p>
            </div>
          </div>

          {/* Differentiator */}
          <div className="flex items-start gap-2.5">
            <Lightbulb
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: '#ffaa33' }}
            />
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Differentiator
              </span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {brief.differentiator}
              </p>
            </div>
          </div>

          {/* Weakness */}
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: '#e63b26' }}
            />
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Known Weakness
              </span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {brief.weakness}
              </p>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

/* ——— Helpers ——— */

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}:
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}
