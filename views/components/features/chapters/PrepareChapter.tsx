'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChapterConfig } from '@/config/chapters';
import { ChapterHero } from '@/views/components/features/ChapterHero';
import { ChapterCTA } from '@/views/components/features/ChapterCTA';
import { JourneyBarCompact } from '@/views/components/features/JourneyBar';

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('fp-visible');
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const children = el.querySelectorAll('.ch-stagger');
            children.forEach((child, i) => {
              (child as HTMLElement).style.transitionDelay = `${i * 0.1}s`;
            });
            el.classList.add('fp-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

const QUESTIONS = [
  {
    difficulty: 'Hard',
    difficultyColor: '#ef4444',
    question: 'Your competitor just raised $50M. Why should we bet on you instead?',
    why: 'Investors want to know you understand your competitive landscape and have a defensible advantage.',
    answer: 'Focus on your unique wedge: the specific customer segment or use case where you win. Acknowledge the competitor\'s strength, then explain why their approach leaves a gap that your product fills.',
  },
  {
    difficulty: 'Medium',
    difficultyColor: '#ffaa33',
    question: 'Walk me through your unit economics. What\'s your CAC and LTV?',
    why: 'This separates founders who understand their business from those who just built a cool product.',
    answer: 'Be specific with numbers. If early-stage, frame it as: "Our blended CAC is $X, LTV is $Y based on Z months of data. Here\'s how we expect these to improve as we scale."',
  },
  {
    difficulty: 'Curveball',
    difficultyColor: '#8b5cf6',
    question: 'If you could only keep one feature, which would it be and why?',
    why: 'Tests whether you understand your core value prop vs. nice-to-haves.',
    answer: 'Name the feature that delivers your primary value. Explain why it\'s the foundation everything else is built on, and how customers would still pay for just that.',
  },
];

const SLIDES = [
  { title: 'Problem', score: 82, color: '#22c55e', feedback: 'Clear pain point, but add a customer quote for emotional weight.' },
  { title: 'Solution', score: 68, color: '#ffaa33', feedback: 'Too feature-focused. Lead with the outcome, not the technology.' },
  { title: 'Market Size', score: 91, color: '#22c55e', feedback: 'Strong TAM/SAM/SOM breakdown with credible sources.' },
  { title: 'Traction', score: 45, color: '#ef4444', feedback: 'Missing growth rate. Add MoM % and highlight inflection point.' },
];

function QuestionCard({ q }: { q: typeof QUESTIONS[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ch-prepare-question">
      <div className="ch-prepare-q-header" onClick={() => setOpen(!open)}>
        <span className="ch-prepare-q-difficulty" style={{ backgroundColor: q.difficultyColor }}>
          {q.difficulty}
        </span>
        <span className="ch-prepare-q-text">{q.question}</span>
        <span className={`ch-prepare-q-toggle ${open ? 'open' : ''}`}>▾</span>
      </div>
      <div className={`ch-prepare-q-body ${open ? 'open' : ''}`}>
        <div className="ch-prepare-q-why">Why they ask this: {q.why}</div>
        <div className="ch-prepare-q-answer">{q.answer}</div>
      </div>
    </div>
  );
}

export function PrepareChapter({ chapter }: { chapter: ChapterConfig }) {
  const questionsRef = useReveal(0.1);
  const deckRef = useReveal(0.1);
  const confidenceRef = useReveal(0.1);

  return (
    <div className="fp-page" style={{ '--fp-color': chapter.color } as React.CSSProperties}>
      <div className="fp-aura" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${chapter.color}12 0%, transparent 70%)` }} />

      <JourneyBarCompact currentSlug={chapter.slug} />

      <div className="fp-container">
        <ChapterHero chapter={chapter} />

        {/* Act 1: The Hard Questions */}
        <section className="ch-section" ref={questionsRef}>
          <h2 className="ch-section-title ch-section-centered">The questions that sink pitches</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Every pitch ends with Q&A. The founders who prepare for the hard ones get funded.
          </p>
          <div className="ch-prepare-questions ch-stagger">
            {QUESTIONS.map((q) => (
              <QuestionCard key={q.question} q={q} />
            ))}
          </div>
        </section>

        {/* Act 2: Deck Under the Microscope */}
        <section className="ch-section" ref={deckRef}>
          <h2 className="ch-section-title ch-section-centered">Your deck has to work without you in the room</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            After the meeting, your deck gets forwarded to partners who never heard your pitch. Every slide needs to stand alone.
          </p>
          <div className="ch-prepare-slides ch-stagger">
            {SLIDES.map((slide) => (
              <div key={slide.title} className="ch-prepare-slide">
                <div className="ch-prepare-slide-preview">
                  Slide: {slide.title}
                </div>
                <div className="ch-prepare-slide-info">
                  <div className="ch-prepare-slide-title">{slide.title}</div>
                  <div className="ch-prepare-slide-score" style={{ color: slide.color }}>{slide.score}/100</div>
                  <div className="ch-prepare-slide-feedback">{slide.feedback}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Act 3: The Confidence Equation */}
        <section className="ch-section ch-section-centered" ref={confidenceRef}>
          <div className="ch-prepare-confidence ch-stagger">
            <h2 className="ch-section-title">The confidence equation</h2>
            <p>
              Confidence isn&apos;t personality — it&apos;s <strong>preparation</strong>. When you&apos;ve stress-tested your pitch against the hardest questions, when you know every slide&apos;s weakness and have a plan for it, you walk into the room differently. Investors can tell.
            </p>
          </div>
        </section>

        <ChapterCTA chapter={chapter} />
      </div>
    </div>
  );
}
