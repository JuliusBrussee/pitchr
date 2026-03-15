'use client';

import { useState } from 'react';
import { Video, BarChart3 } from 'lucide-react';
import { MobileRecordTab } from './MobileRecordTab';
import { MobileMetricsTab } from './MobileMetricsTab';
import { MobileControlBar } from './MobileControlBar';
import type { MetricValues } from '@/hooks/useSessionState';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { LiveRubricCategoryScore } from '@/lib/liveFeedback';

interface MobileSessionPageProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  isSessionActive: boolean;
  canStopSession: boolean;
  canStartSession?: boolean;
  onStartSession: () => void;
  onPauseSession: () => void;
  onStopSession: () => void;
  currentSlide?: number;
  slideCount?: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  elapsedSeconds?: number;
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  liveRubric?: LiveRubricCategoryScore[];
}

export function MobileSessionPage(props: MobileSessionPageProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'metrics'>('record');

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 p-3">
      {/* Tab bar */}
      <div className="flex gap-1 flex-shrink-0">
        <TabButton
          icon={Video}
          label="Record"
          active={activeTab === 'record'}
          onClick={() => setActiveTab('record')}
        />
        <TabButton
          icon={BarChart3}
          label="Metrics"
          active={activeTab === 'metrics'}
          onClick={() => setActiveTab('metrics')}
        />
      </div>

      {/* Tab content */}
      {activeTab === 'record' ? (
        <MobileRecordTab
          stream={props.stream}
          isCameraOn={props.isCameraOn}
          isSessionActive={props.isSessionActive}
          elapsedSeconds={props.elapsedSeconds || 0}
          currentSlide={props.currentSlide}
          slideCount={props.slideCount}
        />
      ) : (
        <MobileMetricsTab
          metrics={props.metrics}
          checklist={props.checklist}
          liveRubric={props.liveRubric}
        />
      )}

      {/* Control bar */}
      <MobileControlBar
        isCameraOn={props.isCameraOn}
        toggleCamera={props.toggleCamera}
        isSessionActive={props.isSessionActive}
        canStopSession={props.canStopSession}
        canStartSession={props.canStartSession}
        onStartSession={props.onStartSession}
        onPauseSession={props.onPauseSession}
        onStopSession={props.onStopSession}
        onNextSlide={props.onNextSlide}
        onPrevSlide={props.onPrevSlide}
        elapsedSeconds={props.elapsedSeconds}
      />
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border"
      style={{
        backgroundColor: active ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
        borderColor: active ? 'var(--border-color)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
