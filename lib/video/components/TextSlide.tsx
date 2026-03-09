import { useCurrentFrame, useVideoConfig } from 'remotion';
import { textLife } from '../utils/animations';
import { fontFamily } from '../utils/fonts';
import { TEXT_PRIMARY } from '../utils/constants';

interface TextSlideProps {
  text: string;
  fontSize?: number;
  seqDuration: number;
  color?: string;
}

export function TextSlide({
  text,
  fontSize = 64,
  seqDuration,
  color = TEXT_PRIMARY,
}: TextSlideProps) {
  const frame = useCurrentFrame();
  const style = textLife(frame, seqDuration);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        fontFamily,
        fontSize,
        fontWeight: 800,
        color,
        textAlign: 'center',
        padding: '0 120px',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
