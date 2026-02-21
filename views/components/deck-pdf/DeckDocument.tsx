import { Document } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedDeck, AnySlideType } from '@/types/deckGeneration';
import { TitleSlide } from './TitleSlide';
import { ContentSlide } from './ContentSlide';
import { MetricsSlide } from './MetricsSlide';
import { MarketSlide } from './MarketSlide';
import { ComparisonSlide } from './ComparisonSlide';
import { TeamSlide } from './TeamSlide';
import { AskSlide } from './AskSlide';

interface DeckDocumentProps {
  slides: GeneratedDeck;
  template: DeckTemplate;
  companyName: string;
}

// Map legacy 10-slide types to their new 8-slide equivalents
const LEGACY_TYPE_MAP: Partial<Record<AnySlideType, AnySlideType>> = {
  title: 'hook',
  product: 'solution',
  competition: 'market',
};

function resolveType(type: AnySlideType): AnySlideType {
  return LEGACY_TYPE_MAP[type] || type;
}

// Types that use MetricsSlide for prominent callout display
const METRICS_TYPES = new Set<AnySlideType>(['traction']);

export function DeckDocument({ slides, template, companyName }: DeckDocumentProps) {
  return (
    <Document title={`${companyName} \u2014 Pitch Deck`} author="Pitchr">
      {slides.map((slide, index) => {
        const pageNumber = index + 1;
        const resolvedType = resolveType(slide.type);

        if (resolvedType === 'hook') {
          return (
            <TitleSlide
              key={index}
              slide={slide}
              template={template}
              companyName={companyName}
            />
          );
        }

        if (METRICS_TYPES.has(resolvedType)) {
          return (
            <MetricsSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (resolvedType === 'market') {
          return (
            <MarketSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        // Legacy competition slides that weren't mapped (shouldn't happen, but safe)
        if (slide.type === 'competition') {
          return (
            <ComparisonSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (resolvedType === 'team') {
          return (
            <TeamSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (resolvedType === 'ask') {
          return (
            <AskSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        // Default: problem, solution, business_model, and any other content slides
        return (
          <ContentSlide
            key={index}
            slide={slide}
            template={template}
            pageNumber={pageNumber}
          />
        );
      })}
    </Document>
  );
}
