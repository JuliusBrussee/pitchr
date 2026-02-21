'use client';

import { SiriBubble, useSiriBubble, OrbState } from '@/views/components/SiriBubble';

const STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];
const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

export default function DemoPage() {
  const { props, setState, setIntensity } = useSiriBubble();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold text-white">SiriBubble Demo</h1>

      {/* Main orb */}
      <SiriBubble {...props} size="xl" />

      {/* State controls */}
      <div className="flex gap-3">
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              props.state === s
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Intensity slider */}
      <div className="flex items-center gap-4 text-white">
        <span className="text-sm">Intensity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-48"
        />
        <span className="text-sm w-10">{props.intensity?.toFixed(2)}</span>
      </div>

      {/* Size comparison row */}
      <div className="flex items-end gap-6 mt-8">
        {SIZES.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <SiriBubble {...props} size={s} />
            <span className="text-xs text-white/60">{s}</span>
          </div>
        ))}
      </div>

      {/* Fluid container demo */}
      <div className="mt-8 w-64 h-64 border border-white/20 rounded-lg">
        <SiriBubble {...props} fluid />
      </div>
      <span className="text-xs text-white/60">fluid (fills 256x256 container)</span>
    </div>
  );
}
