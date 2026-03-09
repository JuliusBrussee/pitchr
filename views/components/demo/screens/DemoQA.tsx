'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Mic, PhoneOff, RotateCcw, ArrowLeft } from 'lucide-react';
import { DEMO_QA_TURNS } from '@/views/components/demo/demoData';

interface DemoQAProps {
  phase: 'gate' | 'connecting' | 'active' | 'complete';
  visibleTurns: number;
}

function CountdownRing({ time, label, progress }: { time: string; label: string; progress: number }) {
  const size = 120;
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - progress * circumference;

  return (
    <div className="demo-qa-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ff5941"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="demo-qa-ring-center">
        <span className="demo-qa-ring-time">{time}</span>
        <span className="demo-qa-ring-label">{label}</span>
      </div>
    </div>
  );
}

function WaveformBars() {
  return (
    <div className="demo-qa-waveform">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="demo-qa-waveform-bar"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

function GatePhase() {
  return (
    <div className="demo-qa-gate">
      <div className="demo-qa-gate-card">
        <div className="demo-qa-gate-icon">
          <Radio size={28} />
        </div>
        <h2 className="demo-qa-gate-title">Investor Q&A</h2>
        <span className="demo-qa-gate-plan">Pro</span>

        <div className="demo-qa-budget-bar">
          <div className="demo-qa-budget-fill" style={{ width: '80%' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>16 / 20 credits remaining</span>

        <div className="demo-qa-duration-options">
          <div className="demo-qa-duration-btn">0:30</div>
          <div className="demo-qa-duration-btn demo-qa-duration-btn--active">1:00</div>
          <div className="demo-qa-duration-btn">2:00</div>
          <div className="demo-qa-duration-btn">5:00</div>
        </div>

        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          1 credit · ~6 investor questions
        </span>

        <button className="demo-qa-start-btn">
          <Mic size={15} />
          Start Session
        </button>
      </div>
    </div>
  );
}

function ConnectingPhase() {
  return (
    <div className="demo-qa-layout">
      <div className="demo-qa-sidebar">
        <div className="demo-qa-status-pill">
          <span className="demo-qa-listening-dot demo-qa-listening-dot--connecting" />
          Connecting...
        </div>
        <CountdownRing time="1:00" label="READY" progress={1} />
        <div style={{ flex: 1 }} />
      </div>
      <div className="demo-qa-transcript">
        <div className="demo-qa-transcript-header">
          <span>Live Transcript</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 turns</span>
        </div>
        <div className="demo-qa-transcript-empty">
          <Radio size={20} style={{ opacity: 0.3 }} />
          <span>Ready for Q&A</span>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ speaker }: { speaker: 'investor' | 'founder' }) {
  return (
    <div className={`demo-qa-bubble-wrap demo-qa-bubble-wrap--${speaker}`}>
      <div className={`demo-qa-avatar demo-qa-avatar--${speaker}`}>
        {speaker === 'investor' ? 'VC' : 'You'}
      </div>
      <div className={`demo-qa-bubble demo-qa-bubble--${speaker} demo-qa-bubble--typing`}>
        <div className="demo-qa-typing-dots">
          <span className="demo-qa-typing-dot" />
          <span className="demo-qa-typing-dot" />
          <span className="demo-qa-typing-dot" />
        </div>
      </div>
    </div>
  );
}

// Internal state: which turn we're on, how many chars typed in that turn, and phase (typing/pausing/indicator)
type TypewriterPhase = 'indicator' | 'typing' | 'pause';

function ActivePhase({ visibleTurns: _maxTurns }: { visibleTurns: number }) {
  const maxTurns = Math.min(_maxTurns, DEMO_QA_TURNS.length);
  const [completedTurns, setCompletedTurns] = useState<string[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<TypewriterPhase>('indicator');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const bubblesRef = useRef<HTMLDivElement>(null);

  const isDone = currentTurnIndex >= maxTurns;
  const currentTurn = DEMO_QA_TURNS[currentTurnIndex];
  const currentText = currentTurn?.text ?? '';

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Typewriter engine
  useEffect(() => {
    if (isDone) return;

    if (phase === 'indicator') {
      // Show typing dots for 0.8s before starting to type
      const timeout = setTimeout(() => {
        setCharIndex(0);
        setPhase('typing');
      }, 800);
      return () => clearTimeout(timeout);
    }

    if (phase === 'typing') {
      // Type characters — investor types slower (25ms), founder types faster (18ms)
      const speed = currentTurn?.speaker === 'investor' ? 25 : 18;
      intervalRef.current = setInterval(() => {
        setCharIndex((prev) => {
          if (prev >= currentText.length) {
            clearInterval(intervalRef.current);
            // Move to pause phase
            setPhase('pause');
            return prev;
          }
          return prev + 1;
        });
      }, speed);
      return () => clearInterval(intervalRef.current);
    }

    if (phase === 'pause') {
      // Commit this turn and advance after a short pause
      const timeout = setTimeout(() => {
        setCompletedTurns((prev) => [...prev, currentText]);
        setCurrentTurnIndex((prev) => prev + 1);
        setCharIndex(0);
        setPhase('indicator');
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [phase, isDone, currentText, currentTurn?.speaker]);

  // Auto-scroll bubbles to bottom
  const scrollToBottom = useCallback(() => {
    if (bubblesRef.current) {
      bubblesRef.current.scrollTop = bubblesRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [completedTurns.length, charIndex, phase, scrollToBottom]);

  // Timer display
  const remaining = Math.max(60 - elapsed, 0);
  const elapsedStr = `0:${String(elapsed).padStart(2, '0')}`;
  const remainingStr = `0:${String(remaining).padStart(2, '0')}`;
  const progress = remaining / 60;

  const finishedCount = completedTurns.length + (phase === 'pause' ? 1 : 0);

  return (
    <div className="demo-qa-layout">
      <div className="demo-qa-sidebar">
        <div className="demo-qa-status-pill demo-qa-status-live">
          <span className="demo-qa-listening-dot" />
          LIVE
        </div>
        <CountdownRing time={remainingStr} label="REMAINING" progress={progress} />
        <WaveformBars />
        <div className="demo-qa-time-readout">
          <span>Elapsed: {elapsedStr}</span>
          <span>Remaining: {remainingStr}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button className="demo-qa-stop-btn">
          <PhoneOff size={14} />
          End Session
        </button>
      </div>
      <div className="demo-qa-transcript">
        <div className="demo-qa-transcript-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Live Transcript</span>
            <span className="demo-qa-live-badge">
              <span className="demo-qa-live-badge-dot" />
              REC
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{finishedCount} turns</span>
        </div>
        <div className="demo-qa-transcript-bubbles" ref={bubblesRef}>
          {/* Fully completed turns */}
          {completedTurns.map((text, i) => {
            const turn = DEMO_QA_TURNS[i];
            return (
              <div
                key={`done-${i}`}
                className={`demo-qa-bubble-wrap demo-qa-bubble-wrap--${turn.speaker}`}
              >
                <div className={`demo-qa-avatar demo-qa-avatar--${turn.speaker}`}>
                  {turn.speaker === 'investor' ? 'VC' : 'You'}
                </div>
                <div className={`demo-qa-bubble demo-qa-bubble--${turn.speaker}`}>
                  <span className={`demo-qa-bubble-label${turn.speaker === 'founder' ? ' demo-qa-bubble-label--founder' : ''}`}>
                    {turn.speaker === 'investor' ? 'Investor' : 'You'}
                  </span>
                  {text}
                </div>
              </div>
            );
          })}

          {/* Currently typing turn (visible during both typing and pause phases) */}
          {!isDone && (phase === 'typing' || phase === 'pause') && currentTurn && (
            <div className={`demo-qa-bubble-wrap demo-qa-bubble-wrap--${currentTurn.speaker}`}>
              <div className={`demo-qa-avatar demo-qa-avatar--${currentTurn.speaker}`}>
                {currentTurn.speaker === 'investor' ? 'VC' : 'You'}
              </div>
              <div className={`demo-qa-bubble demo-qa-bubble--${currentTurn.speaker}`}>
                <span className={`demo-qa-bubble-label${currentTurn.speaker === 'founder' ? ' demo-qa-bubble-label--founder' : ''}`}>
                  {currentTurn.speaker === 'investor' ? 'Investor' : 'You'}
                </span>
                {currentText.slice(0, charIndex)}
                <span className="demo-session__cursor" />
              </div>
            </div>
          )}

          {/* Typing indicator before a turn starts */}
          {!isDone && phase === 'indicator' && currentTurn && (
            <TypingIndicator speaker={currentTurn.speaker} />
          )}
        </div>
      </div>
    </div>
  );
}

function CompletePhase() {
  return (
    <div className="demo-qa-layout">
      <div className="demo-qa-sidebar">
        <div className="demo-qa-status-pill" style={{ color: '#22c55e' }}>
          <span className="demo-qa-listening-dot" style={{ backgroundColor: '#22c55e' }} />
          COMPLETE
        </div>
        <CountdownRing time="DONE" label="COMPLETE" progress={1} />
        <div className="demo-qa-summary-stats">
          <div className="demo-qa-summary-stat">
            <span className="demo-qa-summary-stat-value">3</span>
            <span className="demo-qa-summary-stat-label">Questions</span>
          </div>
          <div className="demo-qa-summary-stat">
            <span className="demo-qa-summary-stat-value">3</span>
            <span className="demo-qa-summary-stat-label">Responses</span>
          </div>
          <div className="demo-qa-summary-stat">
            <span className="demo-qa-summary-stat-value">1:00</span>
            <span className="demo-qa-summary-stat-label">Duration</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <button className="demo-qa-start-btn" style={{ fontSize: 12, padding: '8px 12px' }}>
            <RotateCcw size={13} />
            New Session
          </button>
          <button className="demo-qa-stop-btn" style={{ fontSize: 12, padding: '8px 12px' }}>
            <ArrowLeft size={13} />
            Back to Results
          </button>
        </div>
      </div>
      <div className="demo-qa-transcript">
        <div className="demo-qa-transcript-header">
          <span>Session Transcript</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 turns</span>
        </div>
        <div className="demo-qa-transcript-bubbles">
          {DEMO_QA_TURNS.map((turn, i) => (
            <div
              key={i}
              className={`demo-qa-bubble-wrap demo-qa-bubble-wrap--${turn.speaker}`}
            >
              <div className={`demo-qa-avatar demo-qa-avatar--${turn.speaker}`}>
                {turn.speaker === 'investor' ? 'VC' : 'You'}
              </div>
              <div className={`demo-qa-bubble demo-qa-bubble--${turn.speaker}`}>
                {turn.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DemoQA({ phase, visibleTurns }: DemoQAProps) {
  return (
    <div className="demo-qa-page">
      {phase === 'gate' && <GatePhase />}
      {phase === 'connecting' && <ConnectingPhase />}
      {phase === 'active' && <ActivePhase visibleTurns={visibleTurns} />}
      {phase === 'complete' && <CompletePhase />}
    </div>
  );
}
