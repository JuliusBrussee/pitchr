import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { getScoreColor, getScoreBandLabel } from '@/views/components/ui/colors';
import { fontFamily } from '../utils/fonts';

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: number;
  animated?: boolean;
  delay?: number;
}

export function ScoreRing({
  score,
  label,
  size = 192,
  animated = true,
  delay = 0,
}: ScoreRingProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const color = getScoreColor(score);
  const band = label ?? getScoreBandLabel(score);
  const radius = (size / 2) - 16;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  let fillPct: number;
  let displayScore: number;

  if (animated) {
    const s = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 200 },
    });
    fillPct = (score / 100) * s;
    displayScore = Math.round(score * s);
  } else {
    fillPct = score / 100;
    displayScore = score;
  }

  const dashOffset = circumference * (1 - fillPct);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
      }}
    >
      {/* Outer glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily,
        }}
      >
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: '#1a1a1a',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayScore}
        </span>
        <span
          style={{
            fontSize: size * 0.065,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color,
            marginTop: 2,
          }}
        >
          {band}
        </span>
      </div>
    </div>
  );
}
