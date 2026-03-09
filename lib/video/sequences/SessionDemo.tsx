import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { WARM_WHITE } from '../utils/constants';
import { ScreenshotScene } from '../components/ScreenshotScene';
import { AnimatedCursor } from '../components/AnimatedCursor';

export function SessionDemo() {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [195, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: WARM_WHITE }}>
      <div style={{ width: '100%', height: '100%', opacity: Math.min(fadeIn, fadeOut) }}>
        <ScreenshotScene
          src="video/screenshots/session.png"
          keyframes={[
            { frame: 0, scale: 1.05, x: 0, y: 0 },
            { frame: 25, scale: 1.0, x: 0, y: 0 },
            // Hold on full session view
            { frame: 60, scale: 1.0, x: 0, y: 0 },
            // Zoom into the three cards area
            { frame: 100, scale: 1.5, x: 0, y: -30 },
            // Pan to right-side stats panel
            { frame: 150, scale: 1.5, x: -150, y: -30 },
            // Zoom out, cursor moves to bottom controls
            { frame: 190, scale: 1.0, x: 0, y: 0 },
            { frame: 210, scale: 1.0, x: 0, y: 0 },
          ]}
        >
          <AnimatedCursor
            path={[
              // Start at the heading
              { x: 30, y: 8, frame: 25 },
              // Move to "Why this happens as companies scale" heading
              { x: 40, y: 12, frame: 45 },
              // Move to first card (5-8+ tools per company)
              { x: 20, y: 45, frame: 70 },
              // Glide across to second card (Search only works inside)
              { x: 48, y: 45, frame: 100 },
              // Third card (No ownership or validation)
              { x: 76, y: 45, frame: 130 },
              // Move to right sidebar stats (160, 2, etc.)
              { x: 90, y: 15, frame: 160 },
              // Down to bottom bar controls
              { x: 50, y: 90, frame: 190 },
            ]}
            clickFrames={[70, 130]}
          />
        </ScreenshotScene>
      </div>
    </AbsoluteFill>
  );
}
