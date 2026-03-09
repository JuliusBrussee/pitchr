import { Composition, registerRoot } from 'remotion';
import { PitchrLaunch } from './PitchrLaunch';
import { FPS, WIDTH, HEIGHT, TOTAL_FRAMES } from './utils/constants';

function RemotionRoot() {
  return (
    <>
      <Composition
        id="PitchrLaunch"
        component={PitchrLaunch}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
}

registerRoot(RemotionRoot);
