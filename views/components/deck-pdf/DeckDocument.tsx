import { Document } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedDeck } from '@/types/deckGeneration';
import { TitleSlide } from './TitleSlide';
import { ContentSlide } from './ContentSlide';
import { MetricsSlide } from './MetricsSlide';
import { ComparisonSlide } from './ComparisonSlide';
import { TeamSlide } from './TeamSlide';
import { AskSlide } from './AskSlide';

interface DeckDocumentProps {
  slides: GeneratedDeck;
  template: DeckTemplate;
  companyName: string;
}

// Maps slide types to components. Market and Traction use MetricsSlide for
// prominent callout display; Competition uses ComparisonSlide for table layout;
// Team and Ask have their own layouts; everything else uses ContentSlide.
const METRICS_TYPES = new Set(['market', 'traction']);

export function DeckDocument({ slides, template, companyName }: DeckDocumentProps) {
  return (
    <Document title={`${companyName} \u2014 Pitch Deck`} author="Pitchr">
      {slides.map((slide, index) => {
        const pageNumber = index + 1;

        if (slide.type === 'title') {
          return (
            <TitleSlide
              key={index}
              slide={slide}
              template={template}
              companyName={companyName}
            />
          );
        }

        if (METRICS_TYPES.has(slide.type)) {
          return (
            <MetricsSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

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

        if (slide.type === 'team') {
          return (
            <TeamSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (slide.type === 'ask') {
          return (
            <AskSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        // Default: Problem, Solution, Product, Business Model
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
