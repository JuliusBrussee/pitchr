'use client';

import { useState, useCallback } from 'react';
import type { PublicFaqItem } from '@/content/publicPages';

function ChevronDown() {
  return (
    <svg
      className="pp-faq-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PublicFaq({ items }: { items: PublicFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <>
      <div className="pp-faq-header">
        <p className="pp-faq-eyebrow">Trust block</p>
        <h2 className="pp-faq-title">Common questions</h2>
      </div>
      <div className="pp-faq-list">
        {items.map((item, i) => (
          <div
            key={item.question}
            className="pp-faq-item"
            data-open={openIndex === i ? 'true' : 'false'}
          >
            <button
              className="pp-faq-trigger"
              onClick={() => toggle(i)}
              aria-expanded={openIndex === i}
            >
              <span>{item.question}</span>
              <ChevronDown />
            </button>
            <div className="pp-faq-answer-wrap">
              <div className="pp-faq-answer-inner">
                <p className="pp-faq-answer">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
