import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { WARM_WHITE, BRAND_CORAL } from '../utils/constants';
import { ScoreRing } from '../components/ScoreRing';
import { WordByWord } from '../components/WordByWord';
import { SEQ } from '../utils/constants';

export function ScoreLeap() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SEQ.SCORE_LEAP;

  // Before ring fades in first
  const beforeS = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // After ring comes in with delay
  const afterS = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 200 },
  });

  // Arrow between rings
  const arrowS = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 18 },
  });

  // "+49 points" text bounce
  const pointsS = spring({
    frame: Math.max(0, frame - 50),
    fps,
    config: { damping: 12 },
  });

  const pointsScale = interpolate(pointsS, [0, 1], [0.5, 1]);

  // Progress timeline bar — fades in at frame 45
  const timelineOpacity = interpolate(frame, [45, 57], [0, 0.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: WARM_WHITE,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        gap: 40,
      }}
    >
      {/* Score comparison */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 60,
        }}
      >
        {/* Before */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: beforeS,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Before
          </div>
          <ScoreRing score={42} label="Needs Work" size={220} delay={5} />
        </div>

        {/* Arrow */}
        <div
          style={{
            opacity: arrowS,
            transform: `scale(${arrowS})`,
          }}
        >
          <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
            <path
              d="M0 20H65M65 20L50 8M65 20L50 32"
              stroke={BRAND_CORAL}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* After */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: afterS,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            After
          </div>
          <ScoreRing score={91} label="Investor-Ready" size={220} delay={35} />
        </div>
      </div>

      {/* +49 points — word by word */}
      <div style={{ opacity: pointsS, transform: `scale(${pointsScale})` }}>
        <WordByWord
          text="+49 points. Measurable."
          fontSize={48}
          color={BRAND_CORAL}
          stagger={5}
          startFrame={50}
        />
      </div>

      {/* Progress timeline placeholder */}
      <div
        style={{
          width: 560,
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(to right, ${BRAND_CORAL}, ${BRAND_CORAL}60)`,
          opacity: timelineOpacity,
        }}
      />
    </AbsoluteFill>
  );
}
