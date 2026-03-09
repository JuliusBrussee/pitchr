import { AbsoluteFill } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { WARM_WHITE } from '../utils/constants';
import { WordByWord } from '../components/WordByWord';

export function ProblemStatement() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: WARM_WHITE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        padding: '0 160px',
      }}
    >
      <WordByWord
        text="Most founders pitch without a feedback loop."
        fontSize={96}
        stagger={7}
      />
    </AbsoluteFill>
  );
}
