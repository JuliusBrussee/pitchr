import { useCurrentFrame, interpolate } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { WARM_WHITE } from '../utils/constants';
import { ScreenshotScene } from '../components/ScreenshotScene';
import { AnimatedCursor } from '../components/AnimatedCursor';

export function ResultsReveal() {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
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
          src="video/screenshots/results.png"
          keyframes={[
            { frame: 0, scale: 1.05, x: 0, y: 0 },
            { frame: 20, scale: 1.0, x: 0, y: 0 },
            // Hold on full results page
            { frame: 50, scale: 1.0, x: 0, y: 0 },
            // Zoom into score ring + rubric bars (top-left area)
            { frame: 80, scale: 1.7, x: 120, y: 100 },
            // Pan across rubric bars (Structure, Clarity, Evidence, Market, Delivery)
            { frame: 110, scale: 1.7, x: 40, y: 100 },
            // Pan down to priority fix cards
            { frame: 140, scale: 1.7, x: 40, y: -30 },
            // Hold on fixes
            { frame: 175, scale: 1.7, x: 40, y: -30 },
            // Zoom back out
            { frame: 200, scale: 1.0, x: 0, y: 0 },
            { frame: 210, scale: 1.0, x: 0, y: 0 },
          ]}
        >
          <AnimatedCursor
            path={[
              // Start near top
              { x: 30, y: 8, frame: 20 },
              // Move to score ring (57, top-left)
              { x: 6, y: 10, frame: 50 },
              // Click on score ring
              { x: 6, y: 12, frame: 60 },
              // Move across rubric bars: Structure
              { x: 25, y: 6, frame: 80 },
              // Clarity
              { x: 25, y: 12, frame: 90 },
              // Evidence → Market → Delivery
              { x: 25, y: 22, frame: 100 },
              // Down to first fix card
              { x: 35, y: 42, frame: 130 },
              // Second fix card
              { x: 65, y: 42, frame: 150 },
              // Third fix card
              { x: 35, y: 55, frame: 165 },
              // Fourth fix card
              { x: 65, y: 55, frame: 175 },
              // Back to center
              { x: 50, y: 30, frame: 200 },
            ]}
            clickFrames={[60, 130]}
          />
        </ScreenshotScene>
      </div>
    </AbsoluteFill>
  );
}
