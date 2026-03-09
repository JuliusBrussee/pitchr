import { useCurrentFrame, interpolate } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { WARM_WHITE } from '../utils/constants';
import { ScreenshotScene } from '../components/ScreenshotScene';
import { AnimatedCursor } from '../components/AnimatedCursor';

export function QandAArena() {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [150, 165], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulsing LIVE indicator
  const pulse = interpolate(frame % 30, [0, 15, 30], [0.5, 1, 0.5]);

  return (
    <AbsoluteFill style={{ backgroundColor: WARM_WHITE }}>
      <div style={{ width: '100%', height: '100%', opacity: Math.min(fadeIn, fadeOut) }}>
        <ScreenshotScene
          src="video/screenshots/qa.png"
          keyframes={[
            { frame: 0, scale: 1.05, x: 0, y: 0 },
            { frame: 20, scale: 1.0, x: 0, y: 0 },
            // Hold on full Q&A view (timer ring left, chat right)
            { frame: 50, scale: 1.0, x: 0, y: 0 },
            // Zoom into chat transcript area (center-right)
            { frame: 80, scale: 1.5, x: -60, y: 20 },
            // Pan down through the conversation
            { frame: 120, scale: 1.5, x: -60, y: -20 },
            // Zoom back out
            { frame: 150, scale: 1.0, x: 0, y: 0 },
            { frame: 165, scale: 1.0, x: 0, y: 0 },
          ]}
        >
          {/* LIVE badge overlay */}
          {frame >= 30 && (
            <div
              style={{
                position: 'absolute',
                top: '3%',
                right: '3%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                borderRadius: 14,
                background: 'rgba(239,68,68,0.2)',
                backdropFilter: 'blur(8px)',
                fontSize: 13,
                fontWeight: 700,
                color: '#ef4444',
                fontFamily,
                zIndex: 70,
                opacity: pulse,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
              LIVE
            </div>
          )}

          <AnimatedCursor
            path={[
              // Start near the timer ring (left side)
              { x: 12, y: 15, frame: 20 },
              // Move to "Start Session" area
              { x: 12, y: 75, frame: 40 },
              // Click start session
              { x: 12, y: 77, frame: 50 },
              // Move into chat transcript area
              { x: 45, y: 18, frame: 70 },
              // Follow first investor message
              { x: 50, y: 22, frame: 85 },
              // Follow founder response
              { x: 60, y: 32, frame: 100 },
              // Follow second investor message
              { x: 50, y: 42, frame: 115 },
              // Follow second founder response
              { x: 60, y: 52, frame: 130 },
              // Back to timer
              { x: 12, y: 15, frame: 150 },
            ]}
            clickFrames={[50]}
          />
        </ScreenshotScene>
      </div>
    </AbsoluteFill>
  );
}
