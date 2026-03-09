import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { TEXT_PRIMARY, TEXT_MUTED } from '../utils/constants';

interface CategoryBarProps {
  label: string;
  score: number;
  max: number;
  color: string;
  delay?: number;
  labelColor?: string;
  scoreColor?: string;
  trackBg?: string;
}

export function CategoryBar({ label, score, max, color, delay = 0, labelColor, scoreColor, trackBg }: CategoryBarProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200 },
  });

  const fillWidth = interpolate(s, [0, 1], [0, (score / max) * 100]);
  const displayScore = Math.round(score * s);

  return (
    <div style={{ fontFamily, marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span style={{ color: labelColor ?? TEXT_PRIMARY, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ color: scoreColor ?? TEXT_MUTED }}>
          {displayScore}/{max}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: trackBg ?? `${color}20`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${fillWidth}%`,
            borderRadius: 4,
            background: color,
            boxShadow: `0 0 8px ${color}30`,
          }}
        />
      </div>
    </div>
  );
}
