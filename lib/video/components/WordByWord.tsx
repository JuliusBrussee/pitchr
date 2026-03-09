import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { TEXT_PRIMARY } from '../utils/constants';

interface WordByWordProps {
  text: string;
  startFrame?: number;
  stagger?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  align?: 'center' | 'left';
}

export function WordByWord({
  text,
  startFrame = 0,
  stagger = 6,
  fontSize = 96,
  color = TEXT_PRIMARY,
  fontWeight = 800,
  align = 'center',
}: WordByWordProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = text.split(' ');

  // Exit: all words fade out together in last 10 frames
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: `0 ${fontSize * 0.28}px`,
        fontFamily,
        opacity: exitOpacity,
        lineHeight: 1.15,
        letterSpacing: '-0.03em',
      }}
    >
      {words.map((word, i) => {
        const wordDelay = startFrame + i * stagger;
        const s = spring({
          frame: Math.max(0, frame - wordDelay),
          fps,
          config: { damping: 14 },
        });
        const translateY = interpolate(s, [0, 1], [20, 0]);
        const opacity = interpolate(s, [0, 1], [0, 1]);

        return (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight,
              color,
              opacity,
              transform: `translateY(${translateY}px)`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
