'use client';

import dynamic from 'next/dynamic';
import { useSiriBubble, OrbState } from '@/views/components/SiriBubble';

const SiriBubble = dynamic(
  () => import('@/views/components/SiriBubble/SiriBubble').then((m) => ({ default: m.SiriBubble })),
  { ssr: false },
);

const STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];
const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

export default function DemoPage() {
  const { props, setState, setIntensity } = useSiriBubble();
  const activeState = props.state;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <h1 className="text-3xl font-bold">SiriBubble Demo</h1>

      {/* Main orb */}
      <SiriBubble {...props} size="xl" />

      {/* State controls */}
      <div className="flex gap-3">
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              activeState === s
                ? {
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                  }
                : {
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Intensity slider */}
      <div className="flex items-center gap-4">
        <span className="text-sm">Intensity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-48 accent-orange-500"
        />
        <span className="text-sm w-10">{props.intensity?.toFixed(2)}</span>
      </div>

      {/* Size comparison row */}
      <div className="flex items-end gap-6 mt-8">
        {SIZES.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <SiriBubble {...props} size={s} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Fluid container demo */}
      <div
        className="mt-8 w-64 h-64 border rounded-lg"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
      >
        <SiriBubble {...props} fluid />
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        fluid (fills 256x256 container)
      </span>
    </div>
  );
}
