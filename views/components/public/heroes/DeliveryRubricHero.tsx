'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const BAR_COUNT = 40;
const METRIC_TARGETS = { wpm: 142, fillers: 3, pauses: 7 };

export function DeliveryRubricHero() {
  const [wpm, setWpm] = useState(0);
  const [fillers, setFillers] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [metricsVisible, setMetricsVisible] = useState(false);
  const frameRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const animateMetrics = useCallback(() => {
    const start = performance.now();
    const tick = (now: number) => {
      if (!mountedRef.current) return;
      const t = Math.min((now - start) / 1200, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setWpm(Math.round(e * METRIC_TARGETS.wpm));
      setFillers(Math.round(e * METRIC_TARGETS.fillers));
      setPauses(Math.round(e * METRIC_TARGETS.pauses));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => {
      setMetricsVisible(true);
      animateMetrics();
    }, 800);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      cancelAnimationFrame(frameRef.current);
    };
  }, [animateMetrics]);

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const phase = (i / BAR_COUNT) * Math.PI * 3;
    const baseHeight = 20 + Math.sin(phase) * 30 + Math.random() * 10;
    return {
      height: baseHeight,
      delay: `${(i * 0.04).toFixed(2)}s`,
    };
  });

  return (
    <div className="pp-hero-visual">
      <div className="pp-waveform-container">
        <div className="pp-waveform-bars">
          {bars.map((bar, i) => (
            <div
              key={i}
              className="pp-waveform-bar"
              style={{
                height: `${bar.height}%`,
                animationDelay: bar.delay,
              }}
            />
          ))}
        </div>
        <div className="pp-delivery-metrics">
          <div
            className={`pp-delivery-metric ${metricsVisible ? 'visible' : ''}`}
            style={{ animationDelay: '0s' }}
          >
            <div className="pp-metric-value">{wpm}</div>
            <div className="pp-metric-label">WPM</div>
            <div className="pp-metric-pill pp-metric-pill-green">Optimal</div>
          </div>
          <div
            className={`pp-delivery-metric ${metricsVisible ? 'visible' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="pp-metric-value">{fillers}</div>
            <div className="pp-metric-label">Fillers</div>
            <div className="pp-metric-pill pp-metric-pill-green">Low</div>
          </div>
          <div
            className={`pp-delivery-metric ${metricsVisible ? 'visible' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="pp-metric-value">{pauses}</div>
            <div className="pp-metric-label">Pauses</div>
            <div className="pp-metric-pill pp-metric-pill-orange">Review</div>
          </div>
        </div>
      </div>
    </div>
  );
}
