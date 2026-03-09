import { Series, AbsoluteFill } from 'remotion';
import { SEQ, OFF_WHITE } from './utils/constants';

import { LogoReveal } from './sequences/LogoReveal';
import { ProblemStatement } from './sequences/ProblemStatement';
import { DashboardFlyover } from './sequences/DashboardFlyover';
import { SessionDemo } from './sequences/SessionDemo';
import { ResultsReveal } from './sequences/ResultsReveal';
import { QandAArena } from './sequences/QandAArena';
import { ScoreLeap } from './sequences/ScoreLeap';
import { EndCard } from './sequences/EndCard';

export function PitchrLaunch() {
  return (
    <AbsoluteFill style={{ backgroundColor: OFF_WHITE }}>
      <Series>
        <Series.Sequence durationInFrames={SEQ.LOGO_REVEAL}>
          <LogoReveal />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.PROBLEM_STATEMENT}>
          <ProblemStatement />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.DASHBOARD_FLYOVER}>
          <DashboardFlyover />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.SESSION_DEMO}>
          <SessionDemo />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.RESULTS_REVEAL}>
          <ResultsReveal />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.QA_ARENA}>
          <QandAArena />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.SCORE_LEAP}>
          <ScoreLeap />
        </Series.Sequence>

        <Series.Sequence durationInFrames={SEQ.END_CARD}>
          <EndCard />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
