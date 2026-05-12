'use client';

import { useMemo, useState, useEffect, useRef } from 'react';

interface DemoCinematicCaptionProps {
  caption?: string;
  visible: boolean;
  stepIndex: number;
  isCta?: boolean;
}

interface WordToken {
  text: string;
  highlight: boolean;
}

function parseCaption(caption: string): WordToken[] {
  const rawWords = caption.split(/\s+/).filter(Boolean);
  return rawWords.map((word) => {
    const match2 = word.match(/^\*(.+?)\*(.*)$/);
    if (match2) {
      return { text: match2[1] + (match2[2] || ''), highlight: true };
    }
    const match = word.match(/^(\*?)([^*]+?)(\*?)([.,!?\u2014;:]*)?$/);
    if (match && match[1] === '*' && match[3] === '*') {
      return { text: match[2] + (match[4] || ''), highlight: true };
    }
    return { text: word, highlight: false };
  });
}

export function DemoCinematicCaption({
  caption,
  visible,
  stepIndex,
  isCta = false,
}: DemoCinematicCaptionProps) {
  const [displayedCaption, setDisplayedCaption] = useState(caption);
  const [showWords, setShowWords] = useState(true);
  const prevStepRef = useRef(stepIndex);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (stepIndex === prevStepRef.current && displayedCaption === caption) return;
    prevStepRef.current = stepIndex;

    // Hide words, swap caption, then reveal with stagger
    setShowWords(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDisplayedCaption(caption);
      setShowWords(true);
    }, 250);

    return () => clearTimeout(timeoutRef.current);
  }, [stepIndex, caption, displayedCaption]);

  const words = useMemo(
    () => (displayedCaption ? parseCaption(displayedCaption) : []),
    [displayedCaption],
  );

  if (!displayedCaption && !caption) {
    return <div className="f5-cinematic-caption" />;
  }

  return (
    <div
      className={`f5-cinematic-caption${isCta ? ' f5-cinematic-caption--cta' : ''}`}
    >
      <p className="f5-cinematic-caption__text">
        {words.map((word, i) => (
          <span
            key={`${stepIndex}-${i}`}
            className={[
              'f5-cinematic-word',
              word.highlight ? 'f5-cinematic-word--highlight' : '',
              showWords ? 'f5-cinematic-word--enter' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              showWords
                ? { animationDelay: `${i * 70}ms` }
                : { opacity: 0 }
            }
          >
            {word.text}
          </span>
        ))}
      </p>
    </div>
  );
}
