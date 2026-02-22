'use client';

interface GoodBadSummaryProps {
  good?: string;
  bad?: string;
}

export function GoodBadSummary({ good, bad }: GoodBadSummaryProps) {
  if (!good && !bad) return null;

  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Good vs Bad Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#22c55e' }}>
            Good
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {good ?? 'No strong positive signal was captured.'}
          </p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#ef4444' }}>
            Bad
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {bad ?? 'No primary weakness was captured.'}
          </p>
        </div>
      </div>
    </section>
  );
}
