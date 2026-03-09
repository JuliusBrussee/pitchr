'use client';

import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Orb } from '@/views/components/SiriBubble/Orb';
import type { OrbState } from '@/views/components/SiriBubble/types';

const STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];
const BACKGROUNDS = ['#000000', '#0a0a0a', '#1a1a2e', '#ffffff', '#f5f5f5'];

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs flex justify-between" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-orange-500"
      />
    </label>
  );
}

export default function OrbPreviewPage() {
  const [state, setState] = useState<OrbState>('idle');
  const [intensity, setIntensity] = useState(0.35);
  const [opacity, setOpacity] = useState(0.75);
  const [fresnelPower, setFresnelPower] = useState(2.5);
  const [filmThickness, setFilmThickness] = useState(0.6);
  const [bgIndex, setBgIndex] = useState(0);
  const [orbSize, setOrbSize] = useState(400);

  const bg = BACKGROUNDS[bgIndex];

  return (
    <div className="min-h-screen flex" style={{ background: bg, color: 'var(--text-primary)' }}>
      {/* Orb canvas */}
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: orbSize, height: orbSize }}>
          <Suspense
            fallback={
              <div className="w-full h-full rounded-full bg-orange-500/20 animate-pulse" />
            }
          >
            <Canvas
              gl={{ alpha: true, premultipliedAlpha: false, antialias: true }}
              camera={{ position: [0, 0, 3], fov: 45 }}
              style={{ background: 'transparent' }}
              dpr={[1, 2]}
            >
              <Orb
                state={state}
                intensity={intensity}
                opacity={opacity}
                fresnelPower={fresnelPower}
                filmThickness={filmThickness}
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      {/* Controls panel */}
      <div
        className="w-72 backdrop-blur border-l p-4 flex flex-col gap-4 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Orb Preview
        </h2>

        {/* State selector */}
        <div className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>State</span>
          <div className="flex flex-wrap gap-1">
            {STATES.map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                className="px-2 py-1 text-xs rounded border transition-colors"
                style={
                  state === s
                    ? {
                        backgroundColor: '#ff5941',
                        borderColor: '#ff5941',
                        color: '#ffffff',
                      }
                    : {
                        backgroundColor: 'var(--bg-surface-hover)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Background selector */}
        <div className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Background</span>
          <div className="flex gap-2">
            {BACKGROUNDS.map((c, i) => (
              <button
                key={c}
                onClick={() => setBgIndex(i)}
                className="w-7 h-7 rounded-full border-2"
                style={{
                  background: c,
                  borderColor: bgIndex === i ? '#ff5941' : 'var(--border-color)',
                }}
              />
            ))}
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-color)' }} />

        {/* Shader params */}
        <Slider label="Intensity" value={intensity} onChange={setIntensity} />
        <Slider label="Opacity" value={opacity} onChange={setOpacity} />
        <Slider
          label="Fresnel Power"
          value={fresnelPower}
          onChange={setFresnelPower}
          min={0.5}
          max={6}
          step={0.1}
        />
        <Slider
          label="Film Thickness"
          value={filmThickness}
          onChange={setFilmThickness}
          min={0}
          max={2}
          step={0.05}
        />

        <hr style={{ borderColor: 'var(--border-color)' }} />

        <Slider
          label="Orb Size (px)"
          value={orbSize}
          onChange={setOrbSize}
          min={100}
          max={800}
          step={10}
        />

        {/* Current values dump */}
        <div className="mt-auto">
          <details className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <summary className="cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              Copy values
            </summary>
            <pre
              className="mt-2 p-2 rounded text-[10px] overflow-x-auto"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {JSON.stringify(
                { state, intensity, opacity, fresnelPower, filmThickness },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
