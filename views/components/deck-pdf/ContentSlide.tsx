import { View, Text } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface ContentSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function ContentSlide({ slide, template, pageNumber }: ContentSlideProps) {
  const styles = createSlideStyles(template);

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={styles.headline}>{slide.headline}</Text>
      <View style={styles.accentRule} />
      {slide.subheadline && (
        <Text style={styles.subheadline}>{slide.subheadline}</Text>
      )}
      {slide.callout && (
        <View style={styles.bannerCallout}>
          <Text style={styles.bannerCalloutValue}>{slide.callout.value}</Text>
          <Text style={styles.bannerCalloutLabel}>{slide.callout.label}</Text>
        </View>
      )}
      <View style={styles.bulletContainer}>
        {slide.bullets.map((bullet, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <View style={styles.bulletTextGroup}>
              <Text style={styles.bulletText}>{bullet.text}</Text>
              {bullet.detail && (
                <Text style={styles.bulletDetail}>{bullet.detail}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </SlideBase>
  );
}
